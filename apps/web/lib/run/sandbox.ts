import type { SandboxRunResult, TimelineEvent } from '@/lib/run/types';

const RUNNER_TIMEOUT_MS = 5000;

const WORKER_SOURCE = `
  const runnerScope = self;

  runnerScope.addEventListener('message', async (event) => {
    if (!event?.data || event.data.type !== 'RUN_CODE') {
      return;
    }

    const { runId, code } = event.data;
    let eventId = 0;

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
    const originalQueueMicrotask = runnerScope.queueMicrotask
      ? runnerScope.queueMicrotask.bind(runnerScope)
      : (callback) => Promise.resolve().then(callback);
    const originalThen = Promise.prototype.then;

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
      return originalSetTimeout(() => {
        pushTimeline('macro', 'start', 'setTimeout callback');
        try {
          if (typeof fn === 'function') {
            fn(...args);
          }
        } finally {
          pushTimeline('macro', 'end', 'setTimeout callback');
        }
      }, Number(delay));
    };

    runnerScope.queueMicrotask = (fn) => {
      pushTimeline('micro', 'enqueue', 'queueMicrotask');
      return originalQueueMicrotask(() => {
        pushTimeline('micro', 'start', 'queueMicrotask callback');
        try {
          if (typeof fn === 'function') {
            fn();
          }
        } finally {
          pushTimeline('micro', 'end', 'queueMicrotask callback');
        }
      });
    };

    Promise.prototype.then = function patchedThen(onFulfilled, onRejected) {
      const wrap = (callback, label) => {
        if (typeof callback !== 'function') {
          return callback;
        }

        pushTimeline('micro', 'enqueue', label);
        return (...args) => {
          pushTimeline('micro', 'start', label);
          try {
            return callback(...args);
          } finally {
            pushTimeline('micro', 'end', label);
          }
        };
      };

      return originalThen.call(this, wrap(onFulfilled, 'promise.then'), wrap(onRejected, 'promise.catch'));
    };

    try {
      pushTimeline('sync', 'start', 'script');
      const fn = new Function('"use strict";\\n' + code);
      const result = fn();
      if (result && typeof result.then === 'function') {
        await result;
      }
      pushTimeline('sync', 'end', 'script');
    } catch (error) {
      post({
        type: 'error',
        message: error && error.stack ? error.stack : String(error),
      });
    } finally {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      runnerScope.setTimeout = originalSetTimeout;
      runnerScope.queueMicrotask = originalQueueMicrotask;
      Promise.prototype.then = originalThen;
      originalSetTimeout(() => {
        post({ type: 'done' });
      }, 40);
    }
  });
`;

function createWorker(): { worker: Worker; url: string } {
  const blob = new Blob([WORKER_SOURCE], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  return { worker: new Worker(url, { name: 'jsq-runner' }), url };
}

export async function runJavaScriptInSandbox(code: string): Promise<SandboxRunResult> {
  if (/^\s*(import|export)\s/m.test(code)) {
    return {
      logs: [],
      errors: ['Module-style snippets need a full project sandbox.'],
      timeline: [],
    };
  }

  if (/\b(document|window|frames)\b/.test(code)) {
    return {
      logs: [],
      errors: ['This snippet depends on browser globals and is not suited to the worker runner.'],
      timeline: [],
    };
  }

  const { worker, url } = createWorker();
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const logs: string[] = [];
  const errors: string[] = [];
  const timeline: TimelineEvent[] = [];

  return new Promise((resolve) => {
    const cleanup = () => {
      worker.terminate();
      URL.revokeObjectURL(url);
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

    worker.postMessage({ type: 'RUN_CODE', runId, code });
  });
}
