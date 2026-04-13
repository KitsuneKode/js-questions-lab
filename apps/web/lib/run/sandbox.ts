/**
 * JavaScript Sandbox
 *
 * Executes user JavaScript code in an isolated Web Worker with:
 * - Complete console API support
 * - Async operation tracking (setTimeout, Promise, rAF)
 * - Timeline events for visualization
 * - Optional tracing for Visual Debugger
 * - Proper lifecycle management (globals restored only after async completes)
 *
 * @module
 */

import { z } from 'zod';
import { prepareCodeForSandbox } from '@/lib/run/babel-transform';
import type {
  EnhancedSandboxRunResult,
  EnhancedTimelineEvent,
  SandboxError,
  SandboxRunResult,
  SandboxStackFrame,
  TimelineEvent,
} from '@/lib/run/types';
import { generateWorkerSource } from '@/lib/run/worker-source';

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_TIMEOUT_MS = 5000;
const USER_SOURCE_NAME = 'snippet.js';
const USER_WRAPPER_LINE_OFFSET = 1;

// =============================================================================
// Zod Schemas for Worker Messages
// =============================================================================

const workerTransportTimelineEventSchema = z.object({
  id: z.number().int(),
  at: z.number(),
  kind: z.enum(['sync', 'macro', 'micro', 'output', 'raf']),
  phase: z.enum(['enqueue', 'start', 'end', 'instant']),
  label: z.string(),
});

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

// =============================================================================
// Error Handling Utilities
// =============================================================================

function formatErrorSummary(name: string, message: string): string {
  return message ? `${name}: ${message}` : name;
}

function normalizeUserLine(line: number | null): number | null {
  if (line === null) {
    return null;
  }
  return Math.max(1, line - USER_WRAPPER_LINE_OFFSET);
}

function normalizeFunctionName(functionName: string | null | undefined): string | null {
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

  // V8/Chrome format: "at functionName (file:line:col)" or "at file:line:col"
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

  // Firefox eval format: "functionName@...Function:line:col"
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

  // Firefox direct format: "functionName@file:line:col"
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

export function createTimeoutError(timeoutMs: number): SandboxError {
  const name = 'TimeoutError';
  const message = `Execution timed out after ${timeoutMs / 1000} seconds.`;

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

export function createSyntaxError(error: Error): SandboxError {
  const name = 'SyntaxError';
  const message = error.message || 'Invalid syntax';

  return {
    kind: 'syntax',
    name,
    message,
    summary: formatErrorSummary(name, message),
    rawStack: error.stack || null,
    frames: [],
    userLine: null,
    userColumn: null,
  };
}

// =============================================================================
// Worker Management
// =============================================================================

let workerUrl: string | null = null;
let workerUrlCleanupRegistered = false;

function revokeWorkerUrl() {
  if (!workerUrl) {
    return;
  }

  URL.revokeObjectURL(workerUrl);
  workerUrl = null;
  workerUrlCleanupRegistered = false;
}

function registerWorkerUrlCleanup() {
  if (workerUrlCleanupRegistered || typeof window === 'undefined') {
    return;
  }

  window.addEventListener('pagehide', revokeWorkerUrl, { once: true });
  workerUrlCleanupRegistered = true;
}

function getWorkerUrl(): string {
  if (!workerUrl) {
    const source = generateWorkerSource();
    const blob = new Blob([source], { type: 'text/javascript' });
    workerUrl = URL.createObjectURL(blob);
    registerWorkerUrlCleanup();
  }
  return workerUrl;
}

function createWorker(): Worker {
  const WorkerConstructor =
    globalThis.Worker ??
    (typeof window !== 'undefined' ? window.Worker : undefined) ??
    (typeof self !== 'undefined' ? self.Worker : undefined);

  if (typeof WorkerConstructor !== 'function') {
    throw new Error('Worker is not available in this environment.');
  }

  return new WorkerConstructor(getWorkerUrl(), { name: 'jsq-sandbox' });
}

function createRunTransportToken(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

// =============================================================================
// Sandbox Options
// =============================================================================

export interface RunJavaScriptOptions {
  /**
   * Enable tracing for Visual Debugger (scope enter/exit, variable capture).
   * Adds overhead but provides detailed execution visualization.
   * @default false
   */
  enableTracing?: boolean;

  /**
   * Maximum execution time in milliseconds.
   * @default 5000
   */
  timeout?: number;
}

// =============================================================================
// Main Sandbox Function
// =============================================================================

/**
 * Run JavaScript code in an isolated sandbox.
 *
 * Features:
 * - Isolated Web Worker execution
 * - Complete console API (log, warn, error, table, time, etc.)
 * - Async tracking (setTimeout, Promise, requestAnimationFrame)
 * - Timeline events for visualization
 * - Optional tracing for Visual Debugger
 *
 * @param code - JavaScript code to execute
 * @param options - Execution options
 * @returns Execution result with logs, errors, and timeline
 *
 * @example
 * ```ts
 * const result = await runJavaScript(`
 *   console.log("Hello!");
 *   await new Promise(r => setTimeout(r, 100));
 *   console.log("Done!");
 * `);
 * console.log(result.logs); // ["[log] Hello!", "[log] Done!"]
 * ```
 */
export async function runJavaScript(
  code: string,
  options: RunJavaScriptOptions = {},
): Promise<EnhancedSandboxRunResult> {
  const { enableTracing = false, timeout = DEFAULT_TIMEOUT_MS } = options;

  // Prepare code: strip imports/exports, optionally add tracing
  const prepared = await prepareCodeForSandbox(code, { enableTracing });

  // If code preparation failed with a syntax error, return it immediately
  if (prepared.error) {
    return {
      logs: [],
      errors: [createSyntaxError(prepared.error)],
      timeline: [],
      enhancedTimeline: [],
    };
  }

  const executableCode = prepared.code;
  const worker = createWorker();
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const transportToken = createRunTransportToken();

  const logs: string[] = [];
  const errors: SandboxError[] = [];
  const timeline: TimelineEvent[] = [];
  const enhancedTimeline: EnhancedTimelineEvent[] = [];

  return new Promise((resolve) => {
    let settled = false;

    const sortedResult = () => ({
      logs,
      errors,
      timeline: [...timeline].sort((a, b) => a.at - b.at),
      enhancedTimeline: [...enhancedTimeline].sort((a, b) => a.at - b.at),
    });

    const cleanup = () => {
      worker.terminate();
    };

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      cleanup();
      resolve(sortedResult());
    };

    const timeoutId = window.setTimeout(() => {
      errors.push(createTimeoutError(timeout));
      finish();
    }, timeout);

    worker.addEventListener('message', (event: MessageEvent) => {
      const payload = event.data;
      if (!payload || typeof payload !== 'object' || payload.transportToken !== transportToken) {
        return;
      }

      const parsedMessage = workerTransportMessageSchema.safeParse(event.data);

      if (!parsedMessage.success) {
        return;
      }

      const data: WorkerTransportMessage = parsedMessage.data;

      if (data.runId !== runId) {
        return;
      }

      switch (data.type) {
        case 'log':
          logs.push(`[${data.level}] ${data.message}`);
          break;

        case 'error':
          errors.push(toSandboxError(data.error));
          break;

        case 'timeline':
          timeline.push(data.event as TimelineEvent);
          break;

        case 'enhanced-timeline':
          enhancedTimeline.push(data.event as EnhancedTimelineEvent);
          break;

        case 'done':
          finish();
          break;
      }
    });

    worker.addEventListener('error', (event) => {
      errors.push({
        kind: 'runtime',
        name: 'WorkerError',
        message: event.message || 'Unknown worker error',
        summary: `WorkerError: ${event.message || 'Unknown worker error'}`,
        rawStack: null,
        frames: [],
        userLine: null,
        userColumn: null,
      });
      finish();
    });

    // Send code to worker
    worker.postMessage({
      type: 'RUN_CODE',
      runId,
      transportToken,
      code: executableCode,
      options: {
        enableTracing,
        timeout,
      },
    });
  });
}

// =============================================================================
// Backwards-Compatible Aliases
// =============================================================================

/**
 * @deprecated Use `runJavaScript(code)` instead.
 * Alias for backwards compatibility.
 */
export async function runJavaScriptInSandbox(code: string): Promise<SandboxRunResult> {
  const result = await runJavaScript(code, { enableTracing: false });
  return {
    logs: result.logs,
    errors: result.errors,
    timeline: result.timeline,
  };
}

/**
 * @deprecated Use `runJavaScript(code, { enableTracing: true })` instead.
 * Alias for backwards compatibility.
 */
export async function runJavaScriptInEnhancedSandbox(
  code: string,
  options: { enableTracing?: boolean; transformCode?: (code: string) => string } = {},
): Promise<EnhancedSandboxRunResult> {
  if (typeof options.transformCode === 'function') {
    console.warn(
      'runJavaScriptInEnhancedSandbox: `transformCode` is deprecated and ignored. Code preparation now happens internally via Babel.',
    );
  }

  return runJavaScript(code, {
    enableTracing: options.enableTracing ?? true,
  });
}
