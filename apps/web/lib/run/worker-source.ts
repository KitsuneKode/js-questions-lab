/**
 * Unified Worker Source
 *
 * Single worker implementation that handles both basic and enhanced (traced) execution.
 * Key fixes from previous implementation:
 * - Globals are NOT restored until all async work completes
 * - Promise.prototype.then tracking only counts when callbacks execute
 * - Complete console API support
 * - Security hardening (blocks postMessage/importScripts)
 */

/**
 * Generates the worker source code as a string.
 * This is injected into a Blob URL to create the worker.
 */
export function generateWorkerSource(): string {
  return `
'use strict';

const runnerScope = self;
let activeRunId = null;
let activeTransportToken = null;

// =============================================================================
// Security Hardening
// Block dangerous APIs that could escape the sandbox
// =============================================================================

const BLOCKED_APIS = ['postMessage', 'importScripts', 'close'];
const scopeProto = Object.getPrototypeOf(runnerScope);

BLOCKED_APIS.forEach(name => {
  const original = runnerScope[name];
  const descriptor = {
    get() {
      if (name === 'postMessage') {
        return function sandboxedPostMessage(...args) {
          // Only allow messages from our internal code for the current run.
          const msg = args[0];
          if (
            msg &&
            typeof msg === 'object' &&
            msg.source === 'jsq-worker' &&
            msg.runId === activeRunId &&
            msg.transportToken === activeTransportToken &&
            typeof msg.type === 'string'
          ) {
            return original.apply(runnerScope, args);
          }
          throw new Error('postMessage is not available in sandbox');
        };
      }
      throw new Error(name + ' is not available in sandbox');
    },
    configurable: false
  };
  Object.defineProperty(runnerScope, name, descriptor);
  if (scopeProto) {
    Object.defineProperty(scopeProto, name, descriptor);
  }
});

// =============================================================================
// Browser Environment Shims
// =============================================================================

const createMockElement = (tagName = 'div', id = null) => {
  const listeners = new Map();
  return {
    tagName,
    id,
    addEventListener(type, handler, options) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push({ handler, options });
    },
    removeEventListener(type, handler) {
      if (listeners.has(type)) {
        const arr = listeners.get(type);
        const idx = arr.findIndex(l => l.handler === handler);
        if (idx > -1) arr.splice(idx, 1);
      }
    },
    dispatchEvent(event) {
      if (listeners.has(event.type)) {
        listeners.get(event.type).forEach(l => l.handler(event));
      }
    },
    click() { this.dispatchEvent({ type: 'click', target: this }); },
    style: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; }
    },
    getAttribute() { return null; },
    setAttribute() {},
    appendChild() {},
    removeChild() {},
    innerHTML: '',
    innerText: '',
    textContent: ''
  };
};

const elementsById = new Map();
const elementsBySelector = new Map();
const documentNode = createMockElement('document');

const getOrCreateElementById = (id) => {
  if (!elementsById.has(id)) {
    elementsById.set(id, createMockElement('div', id));
  }
  return elementsById.get(id);
};

const getOrCreateElementBySelector = (selector) => {
  if (!elementsBySelector.has(selector)) {
    elementsBySelector.set(selector, createMockElement('div'));
  }
  return elementsBySelector.get(selector);
};

const document = Object.assign(documentNode, {
  getElementById: (id) => getOrCreateElementById(id),
  querySelector: (selector) => getOrCreateElementBySelector(selector),
  querySelectorAll: (selector) => {
    const element = getOrCreateElementBySelector(selector);
    return element ? [element] : [];
  },
  createElement: (tagName) => createMockElement(tagName),
  body: createMockElement('body'),
  head: createMockElement('head'),
  documentElement: createMockElement('html')
});

const frames = [];
const navigator = { userAgent: 'sandbox' };

const createStorageShim = () => {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (index) => [...store.keys()][index] ?? null
  };
};

const localStorage = createStorageShim();
const sessionStorage = createStorageShim();

Object.defineProperty(runnerScope, 'window', { value: runnerScope, configurable: false });
Object.defineProperty(runnerScope, 'document', { value: document, configurable: false });
Object.defineProperty(runnerScope, 'navigator', { value: navigator, configurable: false });
Object.defineProperty(runnerScope, 'localStorage', { value: localStorage, configurable: false });
Object.defineProperty(runnerScope, 'sessionStorage', { value: sessionStorage, configurable: false });

// =============================================================================
// Message Handler
// =============================================================================

runnerScope.addEventListener('message', async (event) => {
  if (!event?.data || event.data.type !== 'RUN_CODE') return;

  const { runId, code, options = {}, transportToken } = event.data;
  const { enableTracing = false } = options;
  activeRunId = runId;
  activeTransportToken = typeof transportToken === 'string' ? transportToken : null;

  // ============= State =============
  let eventId = 0;
  let pendingAsyncTasks = 0;
  let completionPosted = false;
  let scriptSettled = false;
  let idleTimer = null;
  let cleanedUp = false;

  const handleUnhandledRejection = (e) => {
    post({ type: 'error', error: serializeError(e.reason, 'unhandledRejection') });
  };
  runnerScope.addEventListener('unhandledrejection', handleUnhandledRejection);

  // Console state
  const timers = new Map();
  const counts = new Map();
  let groupDepth = 0;

  // Interval/RAF tracking
  const activeTimeouts = new Set();
  const activeIntervals = new Set();
  const intervalIterations = new Map();
  const activeRAFs = new Set();
  let rafId = 0;
  let rafIterations = 0;

  const MAX_INTERVAL_ITERATIONS = 50;
  const MAX_RAF_ITERATIONS = 60;

  // ============= Originals (saved ONCE at start) =============
  const originalConsole = { ...console };
  const originalSetTimeout = runnerScope.setTimeout.bind(runnerScope);
  const originalClearTimeout = runnerScope.clearTimeout.bind(runnerScope);
  const originalSetInterval = runnerScope.setInterval.bind(runnerScope);
  const originalClearInterval = runnerScope.clearInterval.bind(runnerScope);
  const originalRequestAnimationFrame = runnerScope.requestAnimationFrame;
  const originalCancelAnimationFrame = runnerScope.cancelAnimationFrame;
  const originalFetch = runnerScope.fetch;
  const originalQueueMicrotask = runnerScope.queueMicrotask
    ? runnerScope.queueMicrotask.bind(runnerScope)
    : (cb) => Promise.resolve().then(cb);
  const originalThen = Promise.prototype.then;
  const originalCatch = Promise.prototype.catch;
  const originalFinally = Promise.prototype.finally;

  // ============= Utilities =============
  const post = (payload) => {
    runnerScope.postMessage({ source: 'jsq-worker', runId, transportToken: activeTransportToken, ...payload });
  };

  const formatValue = (value, depth = 0) => {
    if (depth > 3) return '[...]';
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'bigint') return value + 'n';
    if (typeof value === 'symbol') return value.toString();
    if (typeof value === 'function') return '[Function: ' + (value.name || 'anonymous') + ']';

    if (value instanceof Error) {
      return value.name + ': ' + value.message;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      if (value.length > 10) return 'Array(' + value.length + ')';
      return '[' + value.map(v => formatValue(v, depth + 1)).join(', ') + ']';
    }

    if (value instanceof Map) {
      return 'Map(' + value.size + ')';
    }

    if (value instanceof Set) {
      return 'Set(' + value.size + ')';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (value instanceof RegExp) {
      return value.toString();
    }

    if (typeof value === 'object') {
      try {
        const keys = Object.keys(value);
        if (keys.length === 0) return '{}';
        if (keys.length > 5) {
          return '{' + keys.slice(0, 3).map(k => k + ': ' + formatValue(value[k], depth + 1)).join(', ') + ', ...}';
        }
        return '{' + keys.map(k => k + ': ' + formatValue(value[k], depth + 1)).join(', ') + '}';
      } catch {
        return '[Object]';
      }
    }

    return String(value);
  };

  const formatArgs = (...args) => args.map(arg => formatValue(arg)).join(' ');

  const formatTable = (data, columns) => {
    if (!data || typeof data !== 'object') return formatValue(data);

    try {
      const requestedColumns = Array.isArray(columns)
        ? columns.filter(column => typeof column === 'string')
        : [];

      if (Array.isArray(data)) {
        if (data.length === 0) return '(empty array)';
        const availableKeys = typeof data[0] === 'object' && data[0] !== null
          ? Object.keys(data[0])
          : ['Value'];
        const keys = requestedColumns.length > 0 ? requestedColumns : availableKeys;
        let table = '| (index) | ' + keys.join(' | ') + ' |\\n';
        table += '|---------|' + keys.map(() => '-------').join('|') + '|\\n';
        data.slice(0, 20).forEach((row, i) => {
          if (typeof row === 'object' && row !== null) {
            table += '| ' + i + ' | ' + keys.map(k => formatValue(row[k], 1)).join(' | ') + ' |\\n';
          } else {
            table += '| ' + i + ' | ' + formatValue(row, 1) + ' |\\n';
          }
        });
        if (data.length > 20) table += '... ' + (data.length - 20) + ' more rows';
        return table;
      } else {
        const entries = Object.entries(data).filter(([key]) => {
          return requestedColumns.length === 0 || requestedColumns.includes(key);
        });
        if (entries.length === 0) return '(empty object)';
        let table = '| (key) | Value |\\n|-------|-------|\\n';
        entries.slice(0, 20).forEach(([k, v]) => {
          table += '| ' + k + ' | ' + formatValue(v, 1) + ' |\\n';
        });
        return table;
      }
    } catch {
      return formatValue(data);
    }
  };

  const serializeError = (error, fallbackKind = 'runtime') => {
    const name = error?.name || 'Error';
    const message = error?.message || String(error);
    return {
      kind: name === 'SyntaxError' ? 'syntax' : fallbackKind,
      name,
      message,
      rawStack: error?.stack || null
    };
  };

  // ============= Lifecycle Management =============
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

  const markAsyncEnd = () => {
    pendingAsyncTasks = Math.max(0, pendingAsyncTasks - 1);
    maybePostDone();
  };

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;

    runnerScope.removeEventListener('unhandledrejection', handleUnhandledRejection);

    // Restore all patched globals
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
    console.table = originalConsole.table;
    console.dir = originalConsole.dir;
    console.time = originalConsole.time;
    console.timeEnd = originalConsole.timeEnd;
    console.timeLog = originalConsole.timeLog;
    console.assert = originalConsole.assert;
    console.count = originalConsole.count;
    console.countReset = originalConsole.countReset;
    console.group = originalConsole.group;
    console.groupCollapsed = originalConsole.groupCollapsed;
    console.groupEnd = originalConsole.groupEnd;
    console.clear = originalConsole.clear;
    console.trace = originalConsole.trace;

    runnerScope.setTimeout = originalSetTimeout;
    runnerScope.clearTimeout = originalClearTimeout;
    runnerScope.setInterval = originalSetInterval;
    runnerScope.clearInterval = originalClearInterval;
    runnerScope.requestAnimationFrame = originalRequestAnimationFrame;
    runnerScope.cancelAnimationFrame = originalCancelAnimationFrame;
    runnerScope.fetch = originalFetch;
    runnerScope.queueMicrotask = originalQueueMicrotask;
    if (scopeProto) {
      scopeProto.setTimeout = originalSetTimeout;
      scopeProto.clearTimeout = originalClearTimeout;
      scopeProto.setInterval = originalSetInterval;
      scopeProto.clearInterval = originalClearInterval;
      scopeProto.requestAnimationFrame = originalRequestAnimationFrame;
      scopeProto.cancelAnimationFrame = originalCancelAnimationFrame;
      scopeProto.fetch = originalFetch;
      scopeProto.queueMicrotask = originalQueueMicrotask;
    }
    Promise.prototype.then = originalThen;
    Promise.prototype.catch = originalCatch;
    Promise.prototype.finally = originalFinally;

    for (const timeoutId of activeTimeouts) {
      originalClearTimeout(timeoutId);
    }
    activeTimeouts.clear();

    // Clean up active intervals
    for (const intervalId of activeIntervals) {
      originalClearInterval(intervalId);
    }
    activeIntervals.clear();
    intervalIterations.clear();
    activeRAFs.clear();
  };

  const maybePostDone = () => {
    if (!scriptSettled || completionPosted) return;
    if (pendingAsyncTasks > 0 || activeIntervals.size > 0 || activeRAFs.size > 0) return;

    clearIdleTimer();
    idleTimer = originalSetTimeout(() => {
      if (completionPosted) return;
      if (pendingAsyncTasks > 0 || activeIntervals.size > 0 || activeRAFs.size > 0) return;

      // CRITICAL: Cleanup AFTER we're done, not before
      cleanup();
      completionPosted = true;
      post({ type: 'done' });
      activeRunId = null;
      activeTransportToken = null;
    }, 12);
  };

  // ============= Timeline =============
  const pushTimeline = (kind, phase, label, extra = {}) => {
    post({
      type: 'timeline',
      event: {
        id: ++eventId,
        at: performance.now(),
        kind,
        phase,
        label
      }
    });

    if (enableTracing && extra.loc) {
      post({
        type: 'enhanced-timeline',
        event: {
          id: eventId,
          at: performance.now(),
          kind,
          phase,
          label,
          ...extra
        }
      });
    }
  };

  // ============= Console Proxy =============
  const indent = () => '  '.repeat(groupDepth);

  console.log = (...args) => {
    pushTimeline('output', 'instant', 'console.log');
    post({ type: 'log', level: 'log', message: indent() + formatArgs(...args) });
  };

  console.warn = (...args) => {
    pushTimeline('output', 'instant', 'console.warn');
    post({ type: 'log', level: 'warn', message: indent() + formatArgs(...args) });
  };

  console.error = (...args) => {
    pushTimeline('output', 'instant', 'console.error');
    post({ type: 'log', level: 'error', message: indent() + formatArgs(...args) });
  };

  console.info = (...args) => {
    pushTimeline('output', 'instant', 'console.info');
    post({ type: 'log', level: 'info', message: indent() + formatArgs(...args) });
  };

  console.debug = (...args) => {
    pushTimeline('output', 'instant', 'console.debug');
    post({ type: 'log', level: 'log', message: indent() + '[debug] ' + formatArgs(...args) });
  };

  console.table = (data, columns) => {
    pushTimeline('output', 'instant', 'console.table');
    post({ type: 'log', level: 'log', message: indent() + formatTable(data, columns) });
  };

  console.dir = (obj, options) => {
    pushTimeline('output', 'instant', 'console.dir');
    post({ type: 'log', level: 'log', message: indent() + formatValue(obj, 0) });
  };

  console.time = (label = 'default') => {
    timers.set(label, performance.now());
  };

  console.timeEnd = (label = 'default') => {
    const start = timers.get(label);
    if (start !== undefined) {
      const duration = performance.now() - start;
      timers.delete(label);
      pushTimeline('output', 'instant', 'console.timeEnd');
      post({ type: 'log', level: 'log', message: indent() + label + ': ' + duration.toFixed(3) + 'ms' });
    }
  };

  console.timeLog = (label = 'default', ...args) => {
    const start = timers.get(label);
    if (start !== undefined) {
      const duration = performance.now() - start;
      pushTimeline('output', 'instant', 'console.timeLog');
      const extra = args.length > 0 ? ' ' + formatArgs(...args) : '';
      post({ type: 'log', level: 'log', message: indent() + label + ': ' + duration.toFixed(3) + 'ms' + extra });
    }
  };

  console.assert = (condition, ...args) => {
    if (!condition) {
      pushTimeline('output', 'instant', 'console.assert');
      post({ type: 'log', level: 'error', message: indent() + 'Assertion failed: ' + formatArgs(...args) });
    }
  };

  console.count = (label = 'default') => {
    const current = (counts.get(label) || 0) + 1;
    counts.set(label, current);
    pushTimeline('output', 'instant', 'console.count');
    post({ type: 'log', level: 'log', message: indent() + label + ': ' + current });
  };

  console.countReset = (label = 'default') => {
    counts.delete(label);
  };

  console.group = (...args) => {
    pushTimeline('output', 'instant', 'console.group');
    if (args.length > 0) {
      post({ type: 'log', level: 'log', message: indent() + formatArgs(...args) });
    }
    groupDepth++;
  };

  console.groupCollapsed = (...args) => {
    console.group(...args);
  };

  console.groupEnd = () => {
    groupDepth = Math.max(0, groupDepth - 1);
  };

  console.clear = () => {
    post({ type: 'log', level: 'log', message: '[Console cleared]' });
  };

  console.trace = (...args) => {
    pushTimeline('output', 'instant', 'console.trace');
    const stack = new Error().stack || '';
    const msg = args.length > 0 ? formatArgs(...args) + '\\n' : '';
    post({ type: 'log', level: 'log', message: indent() + 'Trace: ' + msg + stack });
  };

  // ============= setTimeout =============
  runnerScope.setTimeout = (fn, delay = 0, ...args) => {
    const delayNum = Number(delay) || 0;
    pushTimeline('macro', 'enqueue', 'setTimeout', {
      apiMeta: { type: 'timer', delay: delayNum }
    });
    markAsyncStart();

    const timeoutId = originalSetTimeout(() => {
      activeTimeouts.delete(timeoutId);
      pushTimeline('macro', 'start', 'setTimeout callback');
      try {
        if (typeof fn === 'function') {
          fn(...args);
        } else if (typeof fn === 'string') {
          // Preserve legacy browser compatibility for setTimeout(fn, delay) when fn is a
          // string. Using new Function(fn) here is intentional: this sandbox already
          // executes arbitrary user code, so matching the legacy runtime behavior for fn
          // is more important than avoiding an eval-like construct inside the worker.
          new Function(fn)();
        }
      } catch (error) {
        post({ type: 'error', error: serializeError(error) });
      } finally {
        pushTimeline('macro', 'end', 'setTimeout callback');
        markAsyncEnd();
      }
    }, delayNum);

    activeTimeouts.add(timeoutId);
    return timeoutId;
  };
  if (scopeProto) scopeProto.setTimeout = runnerScope.setTimeout;

  runnerScope.clearTimeout = (id) => {
    if (activeTimeouts.has(id)) {
      activeTimeouts.delete(id);
      markAsyncEnd();
    }
    return originalClearTimeout(id);
  };
  if (scopeProto) scopeProto.clearTimeout = runnerScope.clearTimeout;

  // ============= setInterval =============
  runnerScope.setInterval = (fn, delay = 0, ...args) => {
    const delayNum = Number(delay) || 0;
    pushTimeline('macro', 'enqueue', 'setInterval', {
      apiMeta: { type: 'timer', delay: delayNum }
    });
    markAsyncStart();

    const wrappedFn = () => {
      const currentCount = (intervalIterations.get(intervalId) || 0) + 1;
      intervalIterations.set(intervalId, currentCount);

      if (currentCount > MAX_INTERVAL_ITERATIONS) {
        console.warn('[Sandbox] setInterval reached maximum iterations (' + MAX_INTERVAL_ITERATIONS + ') and was automatically cleared.');
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
      } catch (error) {
        post({ type: 'error', error: serializeError(error) });
      } finally {
        pushTimeline('macro', 'end', 'setInterval callback');
      }
    };

    const intervalId = originalSetInterval(wrappedFn, delayNum);
    activeIntervals.add(intervalId);
    intervalIterations.set(intervalId, 0);
    return intervalId;
  };
  if (scopeProto) scopeProto.setInterval = runnerScope.setInterval;

  runnerScope.clearInterval = (id) => {
    if (activeIntervals.has(id)) {
      activeIntervals.delete(id);
      intervalIterations.delete(id);
      markAsyncEnd();
    }
    return originalClearInterval(id);
  };
  if (scopeProto) scopeProto.clearInterval = runnerScope.clearInterval;

  // ============= queueMicrotask =============
  runnerScope.queueMicrotask = (fn) => {
    pushTimeline('micro', 'enqueue', 'queueMicrotask');
    markAsyncStart();

    return originalQueueMicrotask(() => {
      pushTimeline('micro', 'start', 'queueMicrotask callback');
      try {
        if (typeof fn === 'function') {
          fn();
        }
      } catch (error) {
        post({ type: 'error', error: serializeError(error) });
      } finally {
        pushTimeline('micro', 'end', 'queueMicrotask callback');
        markAsyncEnd();
      }
    });
  };
  if (scopeProto) scopeProto.queueMicrotask = runnerScope.queueMicrotask;

  // ============= requestAnimationFrame =============
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
        console.warn('[Sandbox] requestAnimationFrame reached maximum iterations (' + MAX_RAF_ITERATIONS + ').');
        activeRAFs.delete(currentRafId);
        markAsyncEnd();
        return;
      }

      pushTimeline('raf', 'start', 'rAF callback');
      try {
        if (typeof fn === 'function') {
          fn(performance.now());
        }
      } catch (error) {
        post({ type: 'error', error: serializeError(error) });
      } finally {
        pushTimeline('raf', 'end', 'rAF callback');
        activeRAFs.delete(currentRafId);
        markAsyncEnd();
      }
    }, 16);

    return currentRafId;
  };
  if (scopeProto) scopeProto.requestAnimationFrame = runnerScope.requestAnimationFrame;

  runnerScope.cancelAnimationFrame = (id) => {
    if (activeRAFs.has(id)) {
      activeRAFs.delete(id);
      markAsyncEnd();
    }
  };
  if (scopeProto) scopeProto.cancelAnimationFrame = runnerScope.cancelAnimationFrame;

  // ============= fetch (mock) =============
  runnerScope.fetch = async (url, options = {}) => {
    const urlStr = typeof url === 'string' ? url : url?.url || 'Request';
    const shortUrl = urlStr.length > 30 ? urlStr.substring(0, 30) + '...' : urlStr;
    const label = 'fetch(' + shortUrl + ')';

    pushTimeline('macro', 'enqueue', label, {
      apiMeta: { type: 'fetch', url: urlStr }
    });
    markAsyncStart();

    // This mock intentionally favors predictable visualization over full fidelity:
    // it always resolves successfully, does not honor AbortController signals, and
    // does not simulate network errors or timeouts yet. The fixed 50ms delay and
    // JSON Response payload make pushTimeline/markAsyncStart/markAsyncEnd deterministic.
    await new Promise(resolve => originalSetTimeout(resolve, 50));

    pushTimeline('macro', 'start', label + ' resolved');

    // Future extension point: inspect options.signal or other flags here if we want
    // runnerScope.fetch to exercise abort or failure paths in tests later.
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
  if (scopeProto) scopeProto.fetch = runnerScope.fetch;

  // ============= Promise.prototype.then =============
  // FIX: Only track when callback actually executes, not at registration
  Promise.prototype.then = function patchedThen(onFulfilled, onRejected) {
    const wrapCallback = (callback, label) => {
      if (typeof callback !== 'function') return callback;

      return function wrappedCallback(...args) {
        // Track ONLY when the callback actually runs
        markAsyncStart();
        pushTimeline('micro', 'start', label);

        try {
          return callback.apply(this, args);
        } finally {
          pushTimeline('micro', 'end', label);
          markAsyncEnd();
        }
      };
    };

    return originalThen.call(
      this,
      wrapCallback(onFulfilled, 'promise.then'),
      wrapCallback(onRejected, 'promise.catch')
    );
  };

  Promise.prototype.catch = function patchedCatch(onRejected) {
    return this.then(undefined, onRejected);
  };

  Promise.prototype.finally = function patchedFinally(onFinally) {
    return originalFinally.call(this, typeof onFinally === 'function' ? () => {
      markAsyncStart();
      pushTimeline('micro', 'start', 'promise.finally');
      try {
        return onFinally();
      } finally {
        pushTimeline('micro', 'end', 'promise.finally');
        markAsyncEnd();
      }
    } : onFinally);
  };

  // ============= Tracer Runtime (for Visual Debugger) =============
  const scopeStack = [];

  const serializeValue = (value, depth = 0) => {
    if (depth > 2) return { type: 'object', preview: '[...]' };
    if (value === undefined) return { type: 'undefined', preview: 'undefined' };
    if (value === null) return { type: 'null', preview: 'null' };

    const t = typeof value;
    if (t === 'function') return { type: 'function', preview: '[Function: ' + (value.name || 'anonymous') + ']' };
    if (t === 'string') {
      const preview = value.length > 50 ? value.slice(0, 50) + '...' : value;
      return { type: 'primitive', preview: '"' + preview + '"', value };
    }
    if (t === 'number' || t === 'boolean') return { type: 'primitive', preview: String(value), value };
    if (t === 'symbol') return { type: 'primitive', preview: value.toString() };
    if (Array.isArray(value)) {
      if (value.length === 0) return { type: 'array', preview: '[]' };
      if (value.length <= 3) {
        const items = value.map(v => serializeValue(v, depth + 1).preview).join(', ');
        return { type: 'array', preview: '[' + items + ']' };
      }
      return { type: 'array', preview: 'Array(' + value.length + ')' };
    }
    if (t === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) return { type: 'object', preview: '{}' };
      if (keys.length <= 2) {
        const items = keys.map(k => k + ': ' + serializeValue(value[k], depth + 1).preview).join(', ');
        return { type: 'object', preview: '{' + items + '}' };
      }
      const ctor = value.constructor?.name || 'Object';
      return { type: 'object', preview: ctor + ' {' + keys.length + ' keys}' };
    }
    return { type: 'object', preview: String(value) };
  };

  const captureCurrentScope = () => {
    return scopeStack.map(scope => ({
      type: scope.type,
      name: scope.name,
      variables: Object.fromEntries(
        Object.entries(scope.variables || {}).map(([k, v]) => [k, serializeValue(v)])
      )
    }));
  };

  self.__tracer = {
    trace(varName, line, column) {
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

    scopeEnter(funcName, line, column) {
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

    scopeExit(funcName, line, column) {
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

    beforeCall(callName, line, column) {
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

    captureVariable(name, value) {
      if (scopeStack.length > 0) {
        scopeStack[scopeStack.length - 1].variables[name] = value;
      }
    }
  };

  // ============= Async Work Flusher =============
  const flushAsyncWork = async () => {
    for (let i = 0; i < 8; i++) {
      await new Promise(resolve => originalQueueMicrotask(resolve));
      await new Promise(resolve => originalSetTimeout(resolve, 0));
    }
  };

  // ============= Execute Code =============
  try {
    pushTimeline('sync', 'start', 'script');

    // Wrap in async IIFE to support top-level await
    const fn = new Function('return (async () => {\\n' + code + '\\n})();\\n//# sourceURL=snippet.js');
    await fn();
    await flushAsyncWork();

    pushTimeline('sync', 'end', 'script');
  } catch (error) {
    post({ type: 'error', error: serializeError(error) });
  } finally {
    scriptSettled = true;
    maybePostDone();
  }
});
`;
}
