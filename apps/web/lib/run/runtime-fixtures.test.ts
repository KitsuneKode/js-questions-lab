import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { prepareCodeForSandbox } from './babel-transform';
import type { EnhancedTimelineEvent, TimelineEvent } from './types';
import { generateWorkerSource } from './worker-source';

interface WorkerHarnessResult {
  logs: string[];
  errors: Array<{
    kind?: string;
    name?: string;
    message?: string;
    rawStack?: string | null;
  }>;
  timeline: TimelineEvent[];
  enhancedTimeline: EnhancedTimelineEvent[];
}

interface RuntimeFixture {
  name: string;
  code: string;
  enableTracing?: boolean;
  expectedLogs?: string[];
  assert?: (result: WorkerHarnessResult) => void;
}

function stripLogPrefix(log: string): string {
  return log.replace(/^\[(log|warn|error|info)\]\s*/, '');
}

async function executeSnippetInWorker(
  code: string,
  { enableTracing = false, timeout = 150 }: { enableTracing?: boolean; timeout?: number } = {},
): Promise<WorkerHarnessResult> {
  const prepared = await prepareCodeForSandbox(code, { enableTracing });

  if (prepared.error) {
    throw prepared.error;
  }

  const outbound: Array<Record<string, unknown>> = [];
  const workerListeners = new Map<
    string,
    Array<(event: { data: unknown }) => void | Promise<void>>
  >();
  const hostTimeouts = new Set<ReturnType<typeof setTimeout>>();
  const hostIntervals = new Set<ReturnType<typeof setInterval>>();
  const runId = 'fixture-run';
  const transportToken = 'fixture-token';

  const workerScope: Record<string, unknown> = {
    performance,
    Response,
    Headers,
    Request,
    URL,
    Promise,
    Error,
    TypeError,
    SyntaxError,
    RangeError,
    ReferenceError,
    Map,
    Set,
    Date,
    RegExp,
    Math,
    JSON,
    Object,
    Array,
    Number,
    String,
    Boolean,
    Symbol,
    Function,
    navigator: { userAgent: 'runtime-fixture-test' },
    console,
    addEventListener(type: string, handler: (event: { data: unknown }) => void | Promise<void>) {
      const handlers = workerListeners.get(type) ?? [];
      handlers.push(handler);
      workerListeners.set(type, handlers);
    },
    removeEventListener(type: string, handler: (event: { data: unknown }) => void | Promise<void>) {
      const handlers = workerListeners.get(type) ?? [];
      workerListeners.set(
        type,
        handlers.filter((candidate) => candidate !== handler),
      );
    },
    setTimeout(callback: TimerHandler, delay?: number, ...args: unknown[]) {
      const id = setTimeout(() => {
        hostTimeouts.delete(id);
        if (typeof callback === 'function') {
          callback(...args);
          return;
        }
        vm.runInContext(String(callback), context);
      }, delay);
      hostTimeouts.add(id);
      return id;
    },
    clearTimeout(id: ReturnType<typeof setTimeout>) {
      hostTimeouts.delete(id);
      clearTimeout(id);
    },
    setInterval(callback: TimerHandler, delay?: number, ...args: unknown[]) {
      const id = setInterval(() => {
        if (typeof callback === 'function') {
          callback(...args);
          return;
        }
        vm.runInContext(String(callback), context);
      }, delay);
      hostIntervals.add(id);
      return id;
    },
    clearInterval(id: ReturnType<typeof setInterval>) {
      hostIntervals.delete(id);
      clearInterval(id);
    },
    queueMicrotask,
    postMessage(message: Record<string, unknown>) {
      outbound.push(message);
    },
  };

  workerScope.self = workerScope;
  workerScope.window = workerScope;
  workerScope.globalThis = workerScope;

  const context = vm.createContext(workerScope);
  vm.runInContext(generateWorkerSource(), context);

  const messageHandlers = workerListeners.get('message') ?? [];
  if (messageHandlers.length === 0) {
    throw new Error('Worker source did not register a message handler.');
  }

  const result = await new Promise<WorkerHarnessResult>((resolve, reject) => {
    const finishHostTimeout = setTimeout(() => {
      reject(new Error(`Worker fixture did not finish within ${timeout}ms.`));
    }, timeout + 400);

    const poll = () => {
      const doneMessage = outbound.find(
        (message) =>
          message.type === 'done' &&
          message.runId === runId &&
          message.transportToken === transportToken,
      );

      if (!doneMessage) {
        const idleId = setTimeout(poll, 5);
        hostTimeouts.add(idleId);
        return;
      }

      clearTimeout(finishHostTimeout);
      resolve({
        logs: outbound
          .filter((message) => message.type === 'log')
          .map((message) => `[${message.level}] ${message.message}`),
        errors: outbound
          .filter((message) => message.type === 'error')
          .map((message) => (message.error ?? {}) as WorkerHarnessResult['errors'][number]),
        timeline: outbound
          .filter((message) => message.type === 'timeline')
          .map((message) => message.event as TimelineEvent),
        enhancedTimeline: outbound
          .filter((message) => message.type === 'enhanced-timeline')
          .map((message) => message.event as EnhancedTimelineEvent),
      });
    };

    for (const handler of messageHandlers) {
      void Promise.resolve(
        handler({
          data: {
            type: 'RUN_CODE',
            runId,
            transportToken,
            code: prepared.code,
            options: {
              enableTracing,
              timeout,
            },
          },
        }),
      ).catch(reject);
    }

    poll();
  });

  for (const timeoutId of hostTimeouts) {
    clearTimeout(timeoutId);
  }
  for (const intervalId of hostIntervals) {
    clearInterval(intervalId);
  }

  return result;
}

const fixtures: RuntimeFixture[] = [
  {
    name: 'preserves var and let closure semantics in timers',
    code: `
      for (var i = 0; i < 3; i++) {
        setTimeout(() => console.log(i), 1);
      }

      for (let i = 0; i < 3; i++) {
        setTimeout(() => console.log(i), 1);
      }
    `,
    expectedLogs: ['3', '3', '3', '0', '1', '2'],
  },
  {
    name: 'runs microtasks before macrotasks in observable order',
    code: `
      console.log('start');
      setTimeout(() => console.log('timeout'), 0);
      queueMicrotask(() => console.log('micro'));
      Promise.resolve().then(() => console.log('promise'));
      console.log('end');
    `,
    expectedLogs: ['start', 'end', 'micro', 'promise', 'timeout'],
  },
  {
    name: 'releases cancelled timeout bookkeeping',
    code: `
      const id = setTimeout(() => console.log('late'), 10);
      clearTimeout(id);
      console.log('done');
    `,
    expectedLogs: ['done'],
  },
  {
    name: 'stops intervals when cleared from inside the callback',
    code: `
      let count = 0;
      const id = setInterval(() => {
        count += 1;
        console.log(count);
        if (count === 3) {
          clearInterval(id);
        }
      }, 0);
    `,
    expectedLogs: ['1', '2', '3'],
  },
  {
    name: 'supports async and await across timers',
    code: `
      async function run() {
        await new Promise((resolve) => {
          setTimeout(() => {
            console.log('hi');
            resolve();
          }, 1);
        });
        console.log('done');
      }

      run();
    `,
    expectedLogs: ['hi', 'done'],
  },
  {
    name: 'surfaces runtime errors after user code executes',
    code: `
      function boom() {
        return missingVariable;
      }

      boom();
    `,
    assert(result) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.name).toBe('ReferenceError');
      expect(result.errors[0]?.message).toContain('missingVariable');
    },
  },
  {
    name: 'still executes correctly when tracing is enabled',
    enableTracing: true,
    code: `
      setTimeout(() => console.log('tick'), 1);
    `,
    expectedLogs: ['tick'],
    assert(result) {
      expect(result.errors).toEqual([]);
      expect(result.timeline.some((event) => event.label === 'console.log')).toBe(true);
      expect(result.timeline.some((event) => event.label === 'script')).toBe(true);
    },
  },
];

describe('runtime compatibility fixtures', () => {
  for (const fixture of fixtures) {
    it(fixture.name, async () => {
      const result = await executeSnippetInWorker(fixture.code, {
        enableTracing: fixture.enableTracing,
      });

      if (fixture.expectedLogs) {
        expect(result.logs.map(stripLogPrefix)).toEqual(fixture.expectedLogs);
      }

      fixture.assert?.(result);
    });
  }
});
