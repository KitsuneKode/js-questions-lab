import type { SandboxRunResult, TimelineEvent } from '@/lib/run/types';

const SANDBOX_ORIGIN = 'null';
const SANDBOX_RUNNER_TIMEOUT_MS = 5000;

const SANDBOX_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
    <script>
      (() => {
        const toStringSafe = (value) => {
          if (typeof value === 'string') return value;
          try {
            return JSON.stringify(value);
          } catch {
            return String(value);
          }
        };

        window.addEventListener('message', async (event) => {
          if (!event || !event.data || event.data.type !== 'RUN_CODE') {
            return;
          }

          const { runId, code } = event.data;
          const post = (payload) => {
            parent.postMessage({ source: 'jsq-sandbox', runId, ...payload }, '*');
          };

          let eventId = 0;
          const now = () => performance.now();

          const pushTimeline = (kind, phase, label) => {
            post({
              type: 'timeline',
              event: {
                id: ++eventId,
                at: now(),
                kind,
                phase,
                label,
              },
            });
          };

          const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
          };
          const originalSetTimeout = window.setTimeout.bind(window);
          const originalQueueMicrotask = window.queueMicrotask.bind(window);
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

          window.setTimeout = (fn, delay, ...args) => {
            const timeoutDelay = Number(delay || 0);
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
            }, timeoutDelay);
          };

          window.queueMicrotask = (fn) => {
            pushTimeline('micro', 'enqueue', 'queueMicrotask');
            return originalQueueMicrotask(() => {
              pushTimeline('micro', 'start', 'queueMicrotask callback');
              try {
                fn();
              } finally {
                pushTimeline('micro', 'end', 'queueMicrotask callback');
              }
            });
          };

          Promise.prototype.then = function patchedThen(onFulfilled, onRejected) {
            const wrap = (cb, label) => {
              if (typeof cb !== 'function') {
                return cb;
              }

              pushTimeline('micro', 'enqueue', label);
              return (...args) => {
                pushTimeline('micro', 'start', label);
                try {
                  return cb(...args);
                } finally {
                  pushTimeline('micro', 'end', label);
                }
              };
            };

            return originalThen.call(this, wrap(onFulfilled, 'promise.then'), wrap(onRejected, 'promise.catch'));
          };

          try {
            pushTimeline('sync', 'start', 'script');
            const fn = new Function('"use strict";\n' + code);
            const result = fn();
            if (result && typeof result.then === 'function') {
              await result;
            }
            pushTimeline('sync', 'end', 'script');
          } catch (error) {
            post({ type: 'error', message: error && error.stack ? error.stack : String(error) });
          } finally {
            console.log = originalConsole.log;
            console.warn = originalConsole.warn;
            console.error = originalConsole.error;
            window.setTimeout = originalSetTimeout;
            window.queueMicrotask = originalQueueMicrotask;
            Promise.prototype.then = originalThen;
            originalSetTimeout(() => {
              post({ type: 'done' });
            }, 40);
          }
        });
      })();
    </script>
  </body>
</html>`;

export async function runJavaScriptInSandbox(code: string): Promise<SandboxRunResult> {
  if (/^\s*(import|export)\s/m.test(code)) {
    return {
      logs: [],
      errors: ['Module-style snippets are not executable in this browser sandbox.'],
      timeline: [],
    };
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.style.display = 'none';
  iframe.srcdoc = SANDBOX_HTML;

  document.body.appendChild(iframe);

  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const logs: string[] = [];
  const errors: string[] = [];
  const timeline: TimelineEvent[] = [];

  return new Promise((resolve) => {
    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      iframe.remove();
    };

    const timer = window.setTimeout(() => {
      errors.push('Execution timed out after 5 seconds.');
      cleanup();
      resolve({ logs, errors, timeline });
    }, SANDBOX_RUNNER_TIMEOUT_MS);

    const onMessage = (event: MessageEvent) => {
      const data = event.data as
        | { source: string; runId: string; type: string; message?: string; level?: string; event?: TimelineEvent }
        | undefined;

      if (!data || data.source !== 'jsq-sandbox' || data.runId !== runId) {
        return;
      }

      if (event.origin !== SANDBOX_ORIGIN && event.origin !== window.location.origin) {
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
        window.clearTimeout(timer);
        cleanup();
        resolve({ logs, errors, timeline: [...timeline].sort((a, b) => a.at - b.at) });
      }
    };

    window.addEventListener('message', onMessage);

    iframe.addEventListener('load', () => {
      iframe.contentWindow?.postMessage(
        {
          type: 'RUN_CODE',
          runId,
          code,
        },
        '*',
      );
    });
  });
}
