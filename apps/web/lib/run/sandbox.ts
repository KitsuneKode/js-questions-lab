import type { SandboxRunResult, TimelineEvent } from '@/lib/run/types';

const RUNNER_TIMEOUT_MS = 5000;

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
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
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
      const fn = new Function('"use strict"; return (async () => {\\n' + code + '\\n})();');
      await fn();
      await flushAsyncWork();
      pushTimeline('sync', 'end', 'script');
    } catch (error) {
      post({
        type: 'error',
        message: error && error.stack ? error.stack : String(error),
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
  const errors: string[] = [];
  const timeline: TimelineEvent[] = [];

  return new Promise((resolve) => {
    const cleanup = () => {
      worker.terminate();
    };

    const timeout = window.setTimeout(() => {
      errors.push('Execution timed out after 5 seconds.');
      cleanup();
      resolve({ logs, errors, timeline });
    }, RUNNER_TIMEOUT_MS);

    worker.addEventListener('message', (event: MessageEvent) => {
      const data = event.data as
        | { source: string; runId: string; type: string; message?: string; level?: string; event?: TimelineEvent }
        | undefined;

      if (!data || data.source !== 'jsq-worker' || data.runId !== runId) {
        return;
      }

      if (data.type === 'log' && data.message) {
        logs.push(`[${data.level}] ${data.message}`);
      }

      if (data.type === 'error' && data.message) {
        errors.push(data.message);
      }

      if (data.type === 'timeline' && data.event) {
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
