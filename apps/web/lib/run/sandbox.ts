import { z } from 'zod';
import type {
  EnhancedSandboxRunResult,
  EnhancedTimelineEvent,
  SandboxError,
  SandboxRunResult,
  SandboxStackFrame,
  TimelineEvent,
} from '@/lib/run/types';

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

// Enhanced timeline event schema for Visual Debugger
const workerTransportEnhancedTimelineEventSchema = z.object({
  id: z.number().int(),
  at: z.number(),
  kind: z.enum(['sync', 'macro', 'micro', 'output', 'scope', 'raf']),
  phase: z.enum(['enqueue', 'start', 'end', 'instant', 'enter', 'exit']),
  label: z.string(),
  loc: z
    .object({
      line: z.number(),
      column: z.number(),
      endLine: z.number().optional(),
      endColumn: z.number().optional(),
    })
    .optional(),
  context: z
    .object({
      functionName: z.string().nullable(),
      scopeChain: z.array(
        z.object({
          type: z.enum(['global', 'function', 'block']),
          name: z.string(),
          variables: z.record(
            z.string(),
            z.object({
              type: z.enum(['primitive', 'object', 'array', 'function', 'undefined', 'null']),
              preview: z.string(),
              value: z.unknown().optional(),
            }),
          ),
        }),
      ),
      thisBinding: z.string(),
    })
    .optional(),
  apiMeta: z
    .object({
      type: z.enum(['timer', 'raf', 'fetch', 'event']),
      delay: z.number().optional(),
      url: z.string().optional(),
      eventType: z.string().optional(),
      targetSelector: z.string().optional(),
    })
    .optional(),
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
    type: z.literal('enhanced-timeline'),
    event: workerTransportEnhancedTimelineEventSchema,
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
      if (!scriptSettled || completionPosted || pendingAsyncTasks > 0 || activeIntervals.size > 0) {
        return;
      }

      clearIdleTimer();
      idleTimer = originalSetTimeout(() => {
        if (completionPosted || pendingAsyncTasks > 0 || activeIntervals.size > 0) {
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
    const originalSetInterval = runnerScope.setInterval.bind(runnerScope);
    const originalClearInterval = runnerScope.clearInterval.bind(runnerScope);
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

    const activeIntervals = new Set();
    const intervalIterations = new Map();
    const MAX_INTERVAL_ITERATIONS = 50;

    runnerScope.setInterval = (fn, delay = 0, ...args) => {
      pushTimeline('macro', 'enqueue', 'setInterval');
      markAsyncStart();

      const wrappedFn = () => {
        const currentCount = (intervalIterations.get(intervalId) || 0) + 1;
        intervalIterations.set(intervalId, currentCount);

        if (currentCount > MAX_INTERVAL_ITERATIONS) {
          originalConsole.warn.call(console, '[Warning] setInterval reached maximum iterations (' + MAX_INTERVAL_ITERATIONS + ') and was automatically cleared to prevent infinite loops.');
          originalClearInterval(intervalId);
          activeIntervals.delete(intervalId);
          intervalIterations.delete(intervalId);
          markAsyncEnd();
          return;
        }

        pushTimeline('macro', 'start', 'setInterval callback');
        try {
          if (typeof fn === 'function') {
            fn(...args);
          }
        } finally {
          pushTimeline('macro', 'end', 'setInterval callback');
        }
      };

      const intervalId = originalSetInterval(wrappedFn, Number(delay));
      activeIntervals.add(intervalId);
      intervalIterations.set(intervalId, 0);
      return intervalId;
    };

    runnerScope.clearInterval = (id) => {
      if (activeIntervals.has(id)) {
        activeIntervals.delete(id);
        intervalIterations.delete(id);
        markAsyncEnd();
      }
      return originalClearInterval(id);
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
      const fn = new Function('return (async () => {\\n' + code + '\\n})();\\n//# sourceURL=${USER_SOURCE_NAME}');
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
      runnerScope.setInterval = originalSetInterval;
      runnerScope.clearInterval = originalClearInterval;
      runnerScope.queueMicrotask = originalQueueMicrotask;
      Promise.prototype.then = originalThen;

      for (const intervalId of activeIntervals) {
        originalClearInterval(intervalId);
      }
      activeIntervals.clear();
      intervalIterations.clear();

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
    .replace(/^\s*export\s+default\s+/gm, '');

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

// Enhanced Worker Source with additional API support for Visual Debugger
const ENHANCED_WORKER_SOURCE = `
  const runnerScope = self;

  // Provide lightweight browser-ish globals
  const window = new Proxy(runnerScope, {
    get: (target, prop) => {
      if (prop === 'name') return '';
      return target[prop];
    }
  });

  // Enhanced document mock with event listener tracking
  const eventListenerRegistry = new Map();
  
  const createMockElement = (tagName = 'div', id = null) => {
    const listeners = new Map();
    return {
      tagName,
      id,
      addEventListener: function(type, handler, options) {
        if (!listeners.has(type)) {
          listeners.set(type, []);
        }
        listeners.get(type).push({ handler, options });
        
        // Track in registry for timeline
        if (!eventListenerRegistry.has(type)) {
          eventListenerRegistry.set(type, []);
        }
        eventListenerRegistry.get(type).push({ element: this, handler });
      },
      removeEventListener: function(type, handler) {
        if (listeners.has(type)) {
          const arr = listeners.get(type);
          const idx = arr.findIndex(l => l.handler === handler);
          if (idx > -1) arr.splice(idx, 1);
        }
      },
      dispatchEvent: function(event) {
        if (listeners.has(event.type)) {
          listeners.get(event.type).forEach(l => l.handler(event));
        }
      },
      click: function() {
        this.dispatchEvent({ type: 'click', target: this });
      },
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
        contains: () => false
      },
      getAttribute: () => null,
      setAttribute: () => {},
      appendChild: () => {},
      removeChild: () => {},
      innerHTML: '',
      innerText: '',
      textContent: ''
    };
  };

  const document = {
    getElementById: (id) => createMockElement('div', id),
    querySelector: (selector) => createMockElement('div'),
    querySelectorAll: () => [],
    createElement: (tagName) => createMockElement(tagName),
    body: createMockElement('body'),
    head: createMockElement('head'),
    documentElement: createMockElement('html'),
    addEventListener: function(type, handler, options) {
      createMockElement('document').addEventListener(type, handler, options);
    }
  };

  const frames = [];
  const navigator = { userAgent: 'worker' };
  const localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  const sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

  runnerScope.addEventListener('message', async (event) => {
    if (!event?.data || event.data.type !== 'RUN_CODE') {
      return;
    }

    const { runId, code, enableTracing } = event.data;
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
      } catch {}
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

    const originalSetTimeout = runnerScope.setTimeout.bind(runnerScope);
    const originalClearTimeout = runnerScope.clearTimeout.bind(runnerScope);
    const originalSetInterval = runnerScope.setInterval.bind(runnerScope);
    const originalClearInterval = runnerScope.clearInterval.bind(runnerScope);
    const originalQueueMicrotask = runnerScope.queueMicrotask
      ? runnerScope.queueMicrotask.bind(runnerScope)
      : (callback) => Promise.resolve().then(callback);
    const originalThen = Promise.prototype.then;

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
      if (!scriptSettled || completionPosted || pendingAsyncTasks > 0 || activeIntervals.size > 0 || activeRAFs.size > 0) {
        return;
      }

      clearIdleTimer();
      idleTimer = originalSetTimeout(() => {
        if (completionPosted || pendingAsyncTasks > 0 || activeIntervals.size > 0 || activeRAFs.size > 0) {
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

    const pushTimeline = (kind, phase, label, extra = {}) => {
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
      
      // Also emit enhanced timeline for Visual Debugger
      if (enableTracing) {
        post({
          type: 'enhanced-timeline',
          event: {
            id: eventId,
            at: performance.now(),
            kind,
            phase,
            label,
            ...extra
          },
        });
      }
    };

    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
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

    console.info = (...args) => {
      pushTimeline('output', 'instant', 'console.info');
      post({ type: 'log', level: 'info', message: args.map(toStringSafe).join(' ') });
    };

    // setTimeout with delay tracking
    runnerScope.setTimeout = (fn, delay = 0, ...args) => {
      const delayNum = Number(delay);
      pushTimeline('macro', 'enqueue', 'setTimeout', {
        apiMeta: { type: 'timer', delay: delayNum }
      });
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
      }, delayNum);
    };

    const activeIntervals = new Set();
    const intervalIterations = new Map();
    const MAX_INTERVAL_ITERATIONS = 50;

    runnerScope.setInterval = (fn, delay = 0, ...args) => {
      const delayNum = Number(delay);
      pushTimeline('macro', 'enqueue', 'setInterval', {
        apiMeta: { type: 'timer', delay: delayNum }
      });
      markAsyncStart();

      const wrappedFn = () => {
        const currentCount = (intervalIterations.get(intervalId) || 0) + 1;
        intervalIterations.set(intervalId, currentCount);

        if (currentCount > MAX_INTERVAL_ITERATIONS) {
          originalConsole.warn.call(console, '[Warning] setInterval reached maximum iterations (' + MAX_INTERVAL_ITERATIONS + ') and was automatically cleared.');
          originalClearInterval(intervalId);
          activeIntervals.delete(intervalId);
          intervalIterations.delete(intervalId);
          markAsyncEnd();
          return;
        }

        pushTimeline('macro', 'start', 'setInterval callback');
        try {
          if (typeof fn === 'function') {
            fn(...args);
          }
        } finally {
          pushTimeline('macro', 'end', 'setInterval callback');
        }
      };

      const intervalId = originalSetInterval(wrappedFn, delayNum);
      activeIntervals.add(intervalId);
      intervalIterations.set(intervalId, 0);
      return intervalId;
    };

    runnerScope.clearInterval = (id) => {
      if (activeIntervals.has(id)) {
        activeIntervals.delete(id);
        intervalIterations.delete(id);
        markAsyncEnd();
      }
      return originalClearInterval(id);
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

    // requestAnimationFrame support
    const activeRAFs = new Set();
    let rafId = 0;
    const MAX_RAF_ITERATIONS = 60;
    let rafIterations = 0;

    runnerScope.requestAnimationFrame = (fn) => {
      pushTimeline('raf', 'enqueue', 'requestAnimationFrame', {
        apiMeta: { type: 'raf' }
      });
      markAsyncStart();
      
      const currentRafId = ++rafId;
      activeRAFs.add(currentRafId);

      originalSetTimeout(() => {
        if (!activeRAFs.has(currentRafId)) {
          markAsyncEnd();
          return;
        }
        
        rafIterations++;
        if (rafIterations > MAX_RAF_ITERATIONS) {
          originalConsole.warn.call(console, '[Warning] requestAnimationFrame reached maximum iterations (' + MAX_RAF_ITERATIONS + ').');
          activeRAFs.delete(currentRafId);
          markAsyncEnd();
          return;
        }

        pushTimeline('raf', 'start', 'rAF callback');
        try {
          if (typeof fn === 'function') {
            fn(performance.now());
          }
        } finally {
          pushTimeline('raf', 'end', 'rAF callback');
          activeRAFs.delete(currentRafId);
          markAsyncEnd();
        }
      }, 16); // ~60fps

      return currentRafId;
    };

    runnerScope.cancelAnimationFrame = (id) => {
      if (activeRAFs.has(id)) {
        activeRAFs.delete(id);
        markAsyncEnd();
      }
    };

    // fetch mock with timeline tracking
    runnerScope.fetch = async (url, options = {}) => {
      const urlStr = typeof url === 'string' ? url : url.url || 'Request';
      const label = 'fetch(' + urlStr.substring(0, 30) + (urlStr.length > 30 ? '...' : '') + ')';
      
      pushTimeline('macro', 'enqueue', label, {
        apiMeta: { type: 'fetch', url: urlStr }
      });
      markAsyncStart();

      // Simulate network delay
      await new Promise(resolve => originalSetTimeout(resolve, 50));

      pushTimeline('macro', 'start', label + ' resolved');
      
      // Return mock response
      const mockResponse = new Response(JSON.stringify({ 
        mocked: true, 
        url: urlStr,
        message: 'This is a mocked fetch response for visualization purposes.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      pushTimeline('macro', 'end', label);
      markAsyncEnd();

      return mockResponse;
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

    // Tracer runtime for Babel-instrumented code
    const scopeStack = [];
    
    function serializeValue(value, depth = 0) {
      if (depth > 2) return { type: 'object', preview: '[...]' };
      if (value === undefined) return { type: 'undefined', preview: 'undefined' };
      if (value === null) return { type: 'null', preview: 'null' };
      
      const valueType = typeof value;
      if (valueType === 'function') {
        return { type: 'function', preview: '[Function: ' + (value.name || 'anonymous') + ']' };
      }
      if (valueType === 'string') {
        const preview = value.length > 50 ? value.slice(0, 50) + '...' : value;
        return { type: 'primitive', preview: '"' + preview + '"', value };
      }
      if (valueType === 'number' || valueType === 'boolean') {
        return { type: 'primitive', preview: String(value), value };
      }
      if (valueType === 'symbol') {
        return { type: 'primitive', preview: value.toString() };
      }
      if (Array.isArray(value)) {
        if (value.length === 0) return { type: 'array', preview: '[]' };
        if (value.length <= 3) {
          const items = value.map(v => serializeValue(v, depth + 1).preview).join(', ');
          return { type: 'array', preview: '[' + items + ']' };
        }
        return { type: 'array', preview: 'Array(' + value.length + ')' };
      }
      if (valueType === 'object') {
        const keys = Object.keys(value);
        if (keys.length === 0) return { type: 'object', preview: '{}' };
        if (keys.length <= 2) {
          const items = keys.map(k => k + ': ' + serializeValue(value[k], depth + 1).preview).join(', ');
          return { type: 'object', preview: '{' + items + '}' };
        }
        const constructor = value.constructor?.name || 'Object';
        return { type: 'object', preview: constructor + ' {' + keys.length + ' keys}' };
      }
      return { type: 'object', preview: String(value) };
    }

    function captureCurrentScope() {
      return scopeStack.map(scope => ({
        type: scope.type,
        name: scope.name,
        variables: Object.fromEntries(
          Object.entries(scope.variables || {}).map(([k, v]) => [k, serializeValue(v)])
        )
      }));
    }

    self.__tracer = {
      trace: function(varName, line, column) {
        if (enableTracing) {
          post({
            type: 'enhanced-timeline',
            event: {
              id: ++eventId,
              at: performance.now(),
              kind: 'sync',
              phase: 'instant',
              label: 'var ' + varName,
              loc: { line, column }
            }
          });
        }
      },
      
      scopeEnter: function(funcName, line, column) {
        const scope = { type: 'function', name: funcName, variables: {}, line, column };
        scopeStack.push(scope);
        
        if (enableTracing) {
          post({
            type: 'enhanced-timeline',
            event: {
              id: ++eventId,
              at: performance.now(),
              kind: 'scope',
              phase: 'enter',
              label: funcName,
              loc: { line, column },
              context: {
                functionName: funcName,
                scopeChain: captureCurrentScope(),
                thisBinding: 'window'
              }
            }
          });
        }
      },
      
      scopeExit: function(funcName, line, column) {
        scopeStack.pop();
        
        if (enableTracing) {
          post({
            type: 'enhanced-timeline',
            event: {
              id: ++eventId,
              at: performance.now(),
              kind: 'scope',
              phase: 'exit',
              label: funcName,
              loc: { line, column },
              context: {
                functionName: funcName,
                scopeChain: captureCurrentScope(),
                thisBinding: 'window'
              }
            }
          });
        }
      },
      
      beforeCall: function(callName, line, column) {
        if (enableTracing) {
          post({
            type: 'enhanced-timeline',
            event: {
              id: ++eventId,
              at: performance.now(),
              kind: 'sync',
              phase: 'instant',
              label: 'call ' + callName,
              loc: { line, column }
            }
          });
        }
      },
      
      captureVariable: function(name, value) {
        if (scopeStack.length > 0) {
          scopeStack[scopeStack.length - 1].variables[name] = value;
        }
      }
    };

    const flushAsyncWork = async () => {
      for (let i = 0; i < 8; i += 1) {
        await new Promise((resolve) => originalQueueMicrotask(resolve));
        await new Promise((resolve) => originalSetTimeout(resolve, 0));
      }
    };

    try {
      pushTimeline('sync', 'start', 'script');
      const fn = new Function('return (async () => {\\n' + code + '\\n})();\\n//# sourceURL=snippet.js');
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
      console.info = originalConsole.info;
      runnerScope.setTimeout = originalSetTimeout;
      runnerScope.clearTimeout = originalClearTimeout;
      runnerScope.setInterval = originalSetInterval;
      runnerScope.clearInterval = originalClearInterval;
      runnerScope.queueMicrotask = originalQueueMicrotask;
      Promise.prototype.then = originalThen;

      for (const intervalId of activeIntervals) {
        originalClearInterval(intervalId);
      }
      activeIntervals.clear();
      intervalIterations.clear();
      activeRAFs.clear();

      maybePostDone();
    }
  });
`;

let enhancedWorkerUrl: string | null = null;

function getEnhancedWorkerUrl() {
  if (!enhancedWorkerUrl) {
    const blob = new Blob([ENHANCED_WORKER_SOURCE], { type: 'text/javascript' });
    enhancedWorkerUrl = URL.createObjectURL(blob);
  }
  return enhancedWorkerUrl;
}

function createEnhancedWorker(): Worker {
  return new Worker(getEnhancedWorkerUrl(), { name: 'jsq-enhanced-runner' });
}

/**
 * Run JavaScript code in enhanced sandbox with Visual Debugger support.
 * Includes expression-level tracing and extended API coverage.
 */
export async function runJavaScriptInEnhancedSandbox(
  code: string,
  options: { enableTracing?: boolean; transformCode?: (code: string) => string } = {},
): Promise<EnhancedSandboxRunResult> {
  const { enableTracing = true, transformCode } = options;

  let executableCode = code;

  // Strip import/export
  executableCode = executableCode
    .replace(/^\s*import\s+.*$/gm, '')
    .replace(/^\s*export\s+(const|let|var|function|class)\s+/gm, '$1 ')
    .replace(/^\s*export\s+default\s+/gm, '');

  // Apply optional transformation (e.g., Babel instrumentation)
  if (transformCode) {
    executableCode = transformCode(executableCode);
  }

  const worker = createEnhancedWorker();
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const logs: string[] = [];
  const errors: SandboxError[] = [];
  const timeline: TimelineEvent[] = [];
  const enhancedTimeline: EnhancedTimelineEvent[] = [];

  return new Promise((resolve) => {
    const cleanup = () => {
      worker.terminate();
    };

    const timeout = window.setTimeout(() => {
      errors.push(createTimeoutError());
      cleanup();
      resolve({ logs, errors, timeline, enhancedTimeline });
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

      if (data.type === 'enhanced-timeline') {
        enhancedTimeline.push(data.event as EnhancedTimelineEvent);
      }

      if (data.type === 'done') {
        window.clearTimeout(timeout);
        cleanup();
        resolve({
          logs,
          errors,
          timeline: [...timeline].sort((a, b) => a.at - b.at),
          enhancedTimeline: [...enhancedTimeline].sort((a, b) => a.at - b.at),
        });
      }
    });

    worker.postMessage({
      type: 'RUN_CODE',
      runId,
      code: executableCode,
      enableTracing,
    });
  });
}
