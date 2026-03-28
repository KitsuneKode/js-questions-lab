import type { SandboxError, SandboxRunResult, SandboxStackFrame, TimelineEvent } from '@/lib/run/types';
import { z } from 'zod';

const RUNNER_TIMEOUT_MS = 5000;
const USER_SOURCE_NAME = 'snippet.js';
const USER_WRAPPER_LINE_OFFSET = 1;

const workerTransportTimelineEventSchema = z.object({
  id: z.number().int(),
  at: z.number(),
  kind: z.enum(['sync', 'macro', 'micro', 'output']),
  phase: z.enum(['enqueue', 'start', 'end', 'instant']),
  label: z.string(),
});

const workerTransportErrorSchema = z.object({
  kind: z.enum(['runtime', 'syntax', 'timeout']).optional(),
  name: z.string().optional(),
  message: z.string().optional(),
  rawStack: z.string().nullable().optional(),
});

const workerTransportMessageSchema = z.discriminatedUnion('type', [
  z.object({
    source: z.literal('jsq-worker'),
    runId: z.string(),
    type: z.literal('log'),
    level: z.enum(['log', 'warn', 'error', 'info']),
    message: z.string(),
  }),
  z.object({
    source: z.literal('jsq-worker'),
    runId: z.string(),
    type: z.literal('error'),
    error: workerTransportErrorSchema,
  }),
  z.object({
    source: z.literal('jsq-worker'),
    runId: z.string(),
    type: z.literal('timeline'),
    event: workerTransportTimelineEventSchema,
  }),
  z.object({
    source: z.literal('jsq-worker'),
    runId: z.string(),
    type: z.literal('done'),
  }),
]);

type WorkerTransportError = z.infer<typeof workerTransportErrorSchema>;
type WorkerTransportMessage = z.infer<typeof workerTransportMessageSchema>;

function formatErrorSummary(name: string, message: string) {
  return message ? `${name}: ${message}` : name;
}

function normalizeUserLine(line: number | null) {
  if (line === null) {
    return null;
  }

  return Math.max(1, line - USER_WRAPPER_LINE_OFFSET);
}

function normalizeFunctionName(functionName: string | null | undefined) {
  const resolvedName = functionName?.trim();

  if (!resolvedName) {
    return null;
  }

  if (/^(anonymous|<anonymous>|eval|Function)$/i.test(resolvedName)) {
    return null;
  }

  if (resolvedName.includes('blob:') || resolvedName.includes('/<')) {
    return null;
  }

  return resolvedName;
}

function parseStackFrame(line: string): SandboxStackFrame | null {
  const trimmed = line.trim();

  if (!trimmed) {
    return null;
  }

  const v8Match = trimmed.match(/^at\s+(?:(.+?)\s+\()?([^()]+):(\d+):(\d+)\)?$/);
  if (v8Match) {
    const [, functionName, file, rawLine, rawColumn] = v8Match;
    const resolvedFile = file.includes(USER_SOURCE_NAME) ? USER_SOURCE_NAME : file.trim();
    const lineNumber = normalizeUserLine(Number.parseInt(rawLine, 10));
    const columnNumber = Number.parseInt(rawColumn, 10);

    if (resolvedFile === USER_SOURCE_NAME || !resolvedFile.startsWith('blob:')) {
      return {
        functionName: normalizeFunctionName(functionName),
        file: resolvedFile,
        line: lineNumber,
        column: columnNumber,
      };
    }
  }

  const firefoxEvalMatch = trimmed.match(/^(.*?)@.*Function:(\d+):(\d+)$/);
  if (firefoxEvalMatch) {
    const [, rawFunctionName, rawLine, rawColumn] = firefoxEvalMatch;
    return {
      functionName: normalizeFunctionName(rawFunctionName),
      file: USER_SOURCE_NAME,
      line: normalizeUserLine(Number.parseInt(rawLine, 10)),
      column: Number.parseInt(rawColumn, 10),
    };
  }

  const firefoxDirectMatch = trimmed.match(/^(.*?)@(.+?):(\d+):(\d+)$/);
  if (firefoxDirectMatch) {
    const [, rawFunctionName, file, rawLine, rawColumn] = firefoxDirectMatch;
    const resolvedFile = file.includes(USER_SOURCE_NAME) ? USER_SOURCE_NAME : file.trim();

    if (resolvedFile === USER_SOURCE_NAME || !resolvedFile.startsWith('blob:')) {
      return {
        functionName: normalizeFunctionName(rawFunctionName),
        file: resolvedFile,
        line: normalizeUserLine(Number.parseInt(rawLine, 10)),
        column: Number.parseInt(rawColumn, 10),
      };
    }
  }

  return null;
}

function toSandboxError(error: WorkerTransportError | string): SandboxError {
  if (typeof error === 'string') {
    const name = 'Error';
    const message = error;

    return {
      kind: 'runtime',
      name,
      message,
      summary: formatErrorSummary(name, message),
      rawStack: null,
      frames: [],
      userLine: null,
      userColumn: null,
    };
  }

  const name = error.name?.trim() || 'Error';
  const message = error.message?.trim() || 'Unknown runtime error.';
  const rawStack = error.rawStack?.trim() || null;
  const frames = rawStack
    ? rawStack
        .split('\n')
        .slice(1)
        .map(parseStackFrame)
        .filter((frame): frame is SandboxStackFrame => frame !== null)
    : [];
  const userLine = frames[0]?.line ?? null;
  const userColumn = frames[0]?.column ?? null;

  return {
    kind: error.kind ?? (name === 'SyntaxError' ? 'syntax' : 'runtime'),
    name,
    message,
    summary: formatErrorSummary(name, message),
    rawStack,
    frames,
    userLine,
    userColumn,
  };
}

function createTimeoutError(): SandboxError {
  const name = 'TimeoutError';
  const message = 'Execution timed out after 5 seconds.';

  return {
    kind: 'timeout',
    name,
    message,
    summary: formatErrorSummary(name, message),
    rawStack: null,
    frames: [],
    userLine: null,
    userColumn: null,
  };
}

const WORKER_SOURCE = `
  const runnerScope = self;

  // Provide lightweight browser-ish globals so interview snippets can run
  // without crashing on simple window/document references.
  const window = new Proxy(runnerScope, {
    get: (target, prop) => {
      if (prop === 'name') return '';
      return target[prop];
    }
  });
  const document = {
    getElementById: () => null,
    querySelector: () => null,
    createElement: () => ({}),
  };
  const frames = [];
  const navigator = { userAgent: 'worker' };
  const localStorage = { getItem: () => null, setItem: () => {} };
  const sessionStorage = { getItem: () => null, setItem: () => {} };

  runnerScope.addEventListener('message', async (event) => {
    if (!event?.data || event.data.type !== 'RUN_CODE') {
      return;
    }

    const { runId, code } = event.data;
    let eventId = 0;
    let pendingAsyncTasks = 0;
    let completionPosted = false;
    let scriptSettled = false;
    let idleTimer = null;

    const toStringSafe = (value) => {
      if (typeof value === 'string') return value;
      if (value instanceof Error) return value.stack || value.toString();
      try {
        const serialized = JSON.stringify(value);
        if (typeof serialized === 'string') {
          return serialized;
        }
      } catch {
      }

      return String(value);
    };

    const serializeError = (error, fallbackKind = 'runtime') => {
      const name = error && typeof error.name === 'string' && error.name ? error.name : 'Error';
      const message =
        error && typeof error.message === 'string' && error.message
          ? error.message
          : String(error);

      return {
        kind: name === 'SyntaxError' ? 'syntax' : fallbackKind,
        name,
        message,
        rawStack: error && typeof error.stack === 'string' ? error.stack : null,
      };
    };

    const post = (payload) => {
      runnerScope.postMessage({ source: 'jsq-worker', runId, ...payload });
    };

    const clearIdleTimer = () => {
      if (idleTimer !== null) {
        originalClearTimeout(idleTimer);
        idleTimer = null;
      }
    };

    const markAsyncStart = () => {
      pendingAsyncTasks += 1;
      clearIdleTimer();
    };

    const maybePostDone = () => {
      if (!scriptSettled || completionPosted || pendingAsyncTasks > 0) {
        return;
      }

      clearIdleTimer();
      idleTimer = originalSetTimeout(() => {
        if (completionPosted || pendingAsyncTasks > 0) {
          return;
        }

        completionPosted = true;
        post({ type: 'done' });
      }, 12);
    };

    const markAsyncEnd = () => {
      pendingAsyncTasks = Math.max(0, pendingAsyncTasks - 1);
      maybePostDone();
    };

    const pushTimeline = (kind, phase, label) => {
      post({
        type: 'timeline',
        event: {
          id: ++eventId,
          at: performance.now(),
          kind,
          phase,
          label,
        },
      });
    };

    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    };
    const originalSetTimeout = runnerScope.setTimeout.bind(runnerScope);
    const originalClearTimeout = runnerScope.clearTimeout.bind(runnerScope);
    const originalQueueMicrotask = runnerScope.queueMicrotask
      ? runnerScope.queueMicrotask.bind(runnerScope)
      : (callback) => Promise.resolve().then(callback);
    const originalThen = Promise.prototype.then;

    const flushAsyncWork = async () => {
      for (let i = 0; i < 8; i += 1) {
        await new Promise((resolve) => originalQueueMicrotask(resolve));
        await new Promise((resolve) => originalSetTimeout(resolve, 0));
      }
    };

    console.log = (...args) => {
      pushTimeline('output', 'instant', 'console.log');
      post({ type: 'log', level: 'log', message: args.map(toStringSafe).join(' ') });
    };

    console.warn = (...args) => {
      pushTimeline('output', 'instant', 'console.warn');
      post({ type: 'log', level: 'warn', message: args.map(toStringSafe).join(' ') });
    };

    console.error = (...args) => {
      pushTimeline('output', 'instant', 'console.error');
      post({ type: 'log', level: 'error', message: args.map(toStringSafe).join(' ') });
    };

    runnerScope.setTimeout = (fn, delay = 0, ...args) => {
      pushTimeline('macro', 'enqueue', 'setTimeout');
      markAsyncStart();
      return originalSetTimeout(() => {
        pushTimeline('macro', 'start', 'setTimeout callback');
        try {
          if (typeof fn === 'function') {
            fn(...args);
          }
        } finally {
          pushTimeline('macro', 'end', 'setTimeout callback');
          markAsyncEnd();
        }
      }, Number(delay));
    };

    runnerScope.queueMicrotask = (fn) => {
      pushTimeline('micro', 'enqueue', 'queueMicrotask');
      markAsyncStart();
      return originalQueueMicrotask(() => {
        pushTimeline('micro', 'start', 'queueMicrotask callback');
        try {
          if (typeof fn === 'function') {
            fn();
          }
        } finally {
          pushTimeline('micro', 'end', 'queueMicrotask callback');
          markAsyncEnd();
        }
      });
    };

    Promise.prototype.then = function patchedThen(onFulfilled, onRejected) {
      const wrap = (callback, label) => {
        if (typeof callback !== 'function') {
          return callback;
        }

        pushTimeline('micro', 'enqueue', label);
        markAsyncStart();
        return (...args) => {
          pushTimeline('micro', 'start', label);
          try {
            return callback(...args);
          } finally {
            pushTimeline('micro', 'end', label);
            markAsyncEnd();
          }
        };
      };

      return originalThen.call(this, wrap(onFulfilled, 'promise.then'), wrap(onRejected, 'promise.catch'));
    };

    try {
      pushTimeline('sync', 'start', 'script');
      const fn = new Function('"use strict"; return (async () => {\\n' + code + '\\n})();\\n//# sourceURL=${USER_SOURCE_NAME}');
      await fn();
      await flushAsyncWork();
      pushTimeline('sync', 'end', 'script');
    } catch (error) {
      post({
        type: 'error',
        error: serializeError(error),
      });
    } finally {
      scriptSettled = true;
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      runnerScope.setTimeout = originalSetTimeout;
      runnerScope.clearTimeout = originalClearTimeout;
      runnerScope.queueMicrotask = originalQueueMicrotask;
      Promise.prototype.then = originalThen;
      maybePostDone();
    }
  });
`;

let workerUrl: string | null = null;

function getWorkerUrl() {
  if (!workerUrl) {
    const blob = new Blob([WORKER_SOURCE], { type: 'text/javascript' });
    workerUrl = URL.createObjectURL(blob);
  }

  return workerUrl;
}

function createWorker(): Worker {
  return new Worker(getWorkerUrl(), { name: 'jsq-runner' });
}

export async function runJavaScriptInSandbox(code: string): Promise<SandboxRunResult> {
  let executableCode = code;

  executableCode = executableCode
    .replace(/^\s*import\s+.*$/gm, '')
    .replace(/^\s*export\s+(const|let|var|function|class)\s+/gm, '$1 ')
    .replace(/^\s*export\s+default\s+/gm, '')
    .replace(/import\s*\(['"]([^'"]+)['"]\)/g, 'require($1)');

  const worker = createWorker();
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const logs: string[] = [];
  const errors: SandboxError[] = [];
  const timeline: TimelineEvent[] = [];

  return new Promise((resolve) => {
    const cleanup = () => {
      worker.terminate();
    };

    const timeout = window.setTimeout(() => {
      errors.push(createTimeoutError());
      cleanup();
      resolve({ logs, errors, timeline });
    }, RUNNER_TIMEOUT_MS);

    worker.addEventListener('message', (event: MessageEvent) => {
      const parsedMessage = workerTransportMessageSchema.safeParse(event.data);

      if (!parsedMessage.success) {
        return;
      }

      const data: WorkerTransportMessage = parsedMessage.data;

      if (data.runId !== runId) {
        return;
      }

      if (data.type === 'log') {
        logs.push(`[${data.level}] ${data.message}`);
      }

      if (data.type === 'error') {
        errors.push(toSandboxError(data.error));
      }

      if (data.type === 'timeline') {
        timeline.push(data.event);
      }

      if (data.type === 'done') {
        window.clearTimeout(timeout);
        cleanup();
        resolve({
          logs,
          errors,
          timeline: [...timeline].sort((a, b) => a.at - b.at),
        });
      }
    });

    worker.postMessage({ type: 'RUN_CODE', runId, code: executableCode });
  });
}
