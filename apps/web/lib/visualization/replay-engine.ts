/**
 * Replay Engine for Visual Debugger
 *
 * Transforms enhanced timeline events into replay steps with state snapshots
 * for the Visual Debugger visualization.
 */

import type { EnhancedTimelineEvent, ExecutionContext, SourceLocation } from '@/lib/run/types';

// Replay state types
export type EventLoopPhase = 'idle' | 'executing' | 'checking-microtasks' | 'checking-tasks';

export interface StackFrame {
  id: string;
  name: string;
  kind: 'sync' | 'micro' | 'macro' | 'raf';
  loc?: SourceLocation;
  variables?: Record<string, { type: string; preview: string }>;
}

export interface QueueItem {
  id: string;
  label: string;
  kind: 'micro' | 'macro' | 'raf';
  delay?: number;
}

export interface WebApiItem {
  id: string;
  label: string;
  type: 'timer' | 'raf' | 'fetch' | 'event';
  delay?: number;
  startTime: number;
  url?: string;
}

export interface ConsoleEntry {
  id: string;
  message: string;
  level: 'log' | 'warn' | 'error' | 'info';
}

export interface ReplaySnapshot {
  callStack: StackFrame[];
  webApis: WebApiItem[];
  microtaskQueue: QueueItem[];
  taskQueue: QueueItem[];
  console: ConsoleEntry[];
  eventLoopPhase: EventLoopPhase;
  currentContext?: ExecutionContext;
}

export interface ReplayStep {
  key: string;
  event: EnhancedTimelineEvent;
  title: string;
  caption: string;
  badge: string;
  badgeColor: 'pink' | 'violet' | 'amber' | 'cyan' | 'lime' | 'slate';
  durationMs: number;
  atOffset: number;
  currentLine?: number;
  snapshot: ReplaySnapshot;
}

// Helper to create unique IDs
let idCounter = 0;
function generateId(prefix: string): string {
  return `${prefix}-${++idCounter}`;
}

// Reset ID counter (useful for tests)
export function resetIdCounter(): void {
  idCounter = 0;
}

function createEmptySnapshot(): ReplaySnapshot {
  return {
    callStack: [],
    webApis: [],
    microtaskQueue: [],
    taskQueue: [],
    console: [],
    eventLoopPhase: 'idle',
  };
}

function cloneSnapshot(snapshot: ReplaySnapshot): ReplaySnapshot {
  return {
    callStack: [...snapshot.callStack],
    webApis: [...snapshot.webApis],
    microtaskQueue: [...snapshot.microtaskQueue],
    taskQueue: [...snapshot.taskQueue],
    console: [...snapshot.console],
    eventLoopPhase: snapshot.eventLoopPhase,
    currentContext: snapshot.currentContext,
  };
}

function normalizeLabel(label: string): string {
  return label
    .replace(/\bcallback\b/gi, 'Callback')
    .replace(/\bpromise\.then\b/gi, 'Promise.then')
    .replace(/\bpromise\.catch\b/gi, 'Promise.catch')
    .replace(/\bscript\b/gi, 'Script')
    .replace(/\bvar\s+/gi, '')
    .replace(/\bcall\s+/gi, '')
    .trim();
}

interface StepMeta {
  title: string;
  caption: string;
  badge: string;
  badgeColor: 'pink' | 'violet' | 'amber' | 'cyan' | 'lime' | 'slate';
  durationMs: number;
}

function describeEvent(event: EnhancedTimelineEvent): StepMeta {
  const prettyLabel = normalizeLabel(event.label);

  // Synchronous execution
  if (event.kind === 'sync' && event.phase === 'start') {
    return {
      title: 'Script execution begins',
      caption:
        'The main thread starts evaluating your code, pushing the global execution context onto the Call Stack.',
      badge: 'Synchronous',
      badgeColor: 'pink',
      durationMs: 1000,
    };
  }

  if (event.kind === 'sync' && event.phase === 'end') {
    return {
      title: 'Synchronous code complete',
      caption:
        'All synchronous code has finished. The Event Loop will now check for pending microtasks.',
      badge: 'Synchronous',
      badgeColor: 'pink',
      durationMs: 900,
    };
  }

  if (event.kind === 'sync' && event.phase === 'instant') {
    return {
      title: `Evaluating: ${prettyLabel}`,
      caption: 'The JavaScript engine evaluates this expression and updates the current scope.',
      badge: 'Expression',
      badgeColor: 'pink',
      durationMs: 600,
    };
  }

  // Scope events
  if (event.kind === 'scope' && event.phase === 'enter') {
    return {
      title: `Entering function: ${prettyLabel}`,
      caption:
        'A new execution context is created and pushed onto the Call Stack. Local variables are initialized.',
      badge: 'Function Call',
      badgeColor: 'pink',
      durationMs: 800,
    };
  }

  if (event.kind === 'scope' && event.phase === 'exit') {
    return {
      title: `Exiting function: ${prettyLabel}`,
      caption: 'The function completes and its execution context is popped from the Call Stack.',
      badge: 'Return',
      badgeColor: 'pink',
      durationMs: 700,
    };
  }

  // Microtasks
  if (event.kind === 'micro' && event.phase === 'enqueue') {
    return {
      title: `${prettyLabel} queued`,
      caption:
        'A microtask is added to the Microtask Queue. It will execute after the current task completes but before any macrotasks.',
      badge: 'Microtask',
      badgeColor: 'violet',
      durationMs: 900,
    };
  }

  if (event.kind === 'micro' && event.phase === 'start') {
    return {
      title: `${prettyLabel} executing`,
      caption:
        'The Event Loop drains the Microtask Queue. This callback is moved to the Call Stack.',
      badge: 'Microtask',
      badgeColor: 'violet',
      durationMs: 1000,
    };
  }

  if (event.kind === 'micro' && event.phase === 'end') {
    return {
      title: `${prettyLabel} completed`,
      caption:
        'The microtask finishes and is removed from the Call Stack. The Event Loop checks for more microtasks.',
      badge: 'Microtask',
      badgeColor: 'violet',
      durationMs: 800,
    };
  }

  // Macrotasks (setTimeout, setInterval)
  if (event.kind === 'macro' && event.phase === 'enqueue') {
    return {
      title: `${prettyLabel} registered`,
      caption:
        "The browser's Web APIs take over. The timer runs in the background while JavaScript continues.",
      badge: 'Task',
      badgeColor: 'amber',
      durationMs: 1000,
    };
  }

  if (event.kind === 'macro' && event.phase === 'start') {
    return {
      title: `${prettyLabel} dispatched`,
      caption:
        'The timer fired and the callback moved from Task Queue to Call Stack. This only happens when the stack and microtasks are empty.',
      badge: 'Task',
      badgeColor: 'amber',
      durationMs: 1100,
    };
  }

  if (event.kind === 'macro' && event.phase === 'end') {
    return {
      title: `${prettyLabel} completed`,
      caption:
        'The macrotask finishes. The Event Loop will check for microtasks before the next macrotask.',
      badge: 'Task',
      badgeColor: 'amber',
      durationMs: 900,
    };
  }

  // requestAnimationFrame
  if (event.kind === 'raf' && event.phase === 'enqueue') {
    return {
      title: 'Animation frame requested',
      caption:
        'requestAnimationFrame schedules a callback before the next browser repaint (~16ms at 60fps).',
      badge: 'rAF',
      badgeColor: 'cyan',
      durationMs: 900,
    };
  }

  if (event.kind === 'raf' && event.phase === 'start') {
    return {
      title: 'Animation frame executing',
      caption:
        'The browser is ready to repaint. Your rAF callback now runs to prepare the next frame.',
      badge: 'rAF',
      badgeColor: 'cyan',
      durationMs: 1000,
    };
  }

  if (event.kind === 'raf' && event.phase === 'end') {
    return {
      title: 'Animation frame completed',
      caption: 'The rAF callback finished. The browser will now repaint with your changes.',
      badge: 'rAF',
      badgeColor: 'cyan',
      durationMs: 800,
    };
  }

  // Console output
  if (event.kind === 'output') {
    return {
      title: 'Console output',
      caption: `Output logged: ${prettyLabel}`,
      badge: 'Console',
      badgeColor: 'lime',
      durationMs: 700,
    };
  }

  // Fallback
  return {
    title: prettyLabel || 'Event',
    caption: 'JavaScript execution event.',
    badge: 'Event',
    badgeColor: 'slate',
    durationMs: 800,
  };
}

// Tracking maps for matching enqueue -> start -> end
interface PendingItem {
  id: string;
  label: string;
  startTime: number;
  delay?: number;
  apiMeta?: EnhancedTimelineEvent['apiMeta'];
}

/**
 * Build replay steps from enhanced timeline events.
 * Each step contains a snapshot of the runtime state at that moment.
 */
export function buildEnhancedReplaySteps(
  events: EnhancedTimelineEvent[],
  logs: string[] = [],
): ReplayStep[] {
  if (events.length === 0) {
    return [];
  }

  resetIdCounter();

  const orderedEvents = [...events].sort((a, b) => a.at - b.at);
  const minAt = orderedEvents[0].at;

  // Tracking state
  const pendingMicro = new Map<string, PendingItem[]>();
  const pendingMacro = new Map<string, PendingItem[]>();
  const pendingRaf = new Map<string, PendingItem[]>();
  const activeCalls = new Map<string, string>(); // label -> frameId

  let snapshot = createEmptySnapshot();
  let logIndex = 0;

  const steps: ReplayStep[] = [];

  for (const event of orderedEvents) {
    snapshot = cloneSnapshot(snapshot);
    const meta = describeEvent(event);
    const prettyLabel = normalizeLabel(event.label);

    // Handle different event types
    switch (event.kind) {
      case 'sync': {
        if (event.phase === 'start') {
          // Script starts - push main frame
          const frameId = generateId('frame');
          snapshot.callStack.push({
            id: frameId,
            name: 'main()',
            kind: 'sync',
            loc: event.loc,
          });
          snapshot.eventLoopPhase = 'executing';
        } else if (event.phase === 'end') {
          // Script ends - pop main frame if present
          snapshot.callStack = snapshot.callStack.filter((f) => f.name !== 'main()');
          snapshot.eventLoopPhase =
            snapshot.microtaskQueue.length > 0
              ? 'checking-microtasks'
              : snapshot.taskQueue.length > 0
                ? 'checking-tasks'
                : 'idle';
        } else if (event.phase === 'instant') {
          // Expression evaluation - just update context
          snapshot.currentContext = event.context;
        }
        break;
      }

      case 'scope': {
        if (event.phase === 'enter') {
          const frameId = generateId('frame');
          activeCalls.set(event.label, frameId);
          snapshot.callStack.push({
            id: frameId,
            name: `${prettyLabel}()`,
            kind: 'sync',
            loc: event.loc,
            variables: event.context?.scopeChain?.[0]?.variables,
          });
          snapshot.currentContext = event.context;
          snapshot.eventLoopPhase = 'executing';
        } else if (event.phase === 'exit') {
          const frameId = activeCalls.get(event.label);
          if (frameId) {
            snapshot.callStack = snapshot.callStack.filter((f) => f.id !== frameId);
            activeCalls.delete(event.label);
          }
          snapshot.currentContext = event.context;
        }
        break;
      }

      case 'micro': {
        if (event.phase === 'enqueue') {
          const itemId = generateId('micro');
          const pending: PendingItem = {
            id: itemId,
            label: prettyLabel,
            startTime: event.at,
          };
          const queue = pendingMicro.get(event.label) || [];
          queue.push(pending);
          pendingMicro.set(event.label, queue);

          snapshot.microtaskQueue.push({
            id: itemId,
            label: prettyLabel,
            kind: 'micro',
          });
        } else if (event.phase === 'start') {
          const queue = pendingMicro.get(event.label) || [];
          const pending = queue.shift();
          if (queue.length === 0) {
            pendingMicro.delete(event.label);
          } else {
            pendingMicro.set(event.label, queue);
          }

          if (pending) {
            // Remove from microtask queue
            snapshot.microtaskQueue = snapshot.microtaskQueue.filter((q) => q.id !== pending.id);
            // Add to call stack
            activeCalls.set(event.label, pending.id);
            snapshot.callStack.push({
              id: pending.id,
              name: prettyLabel,
              kind: 'micro',
              loc: event.loc,
            });
          }
          snapshot.eventLoopPhase = 'executing';
        } else if (event.phase === 'end') {
          const frameId = activeCalls.get(event.label);
          if (frameId) {
            snapshot.callStack = snapshot.callStack.filter((f) => f.id !== frameId);
            activeCalls.delete(event.label);
          }
          // Check what's next
          snapshot.eventLoopPhase =
            snapshot.microtaskQueue.length > 0
              ? 'checking-microtasks'
              : snapshot.taskQueue.length > 0
                ? 'checking-tasks'
                : 'idle';
        }
        break;
      }

      case 'macro': {
        if (event.phase === 'enqueue') {
          const itemId = generateId('macro');
          const delay = event.apiMeta?.delay;
          const pending: PendingItem = {
            id: itemId,
            label: prettyLabel,
            startTime: event.at,
            delay,
            apiMeta: event.apiMeta,
          };
          const queue = pendingMacro.get(event.label) || [];
          queue.push(pending);
          pendingMacro.set(event.label, queue);

          // Add to Web APIs (timers live here until they fire)
          snapshot.webApis.push({
            id: itemId,
            label: prettyLabel,
            type: event.apiMeta?.type || 'timer',
            delay,
            startTime: event.at,
            url: event.apiMeta?.url,
          });
        } else if (event.phase === 'start') {
          const queue = pendingMacro.get(event.label) || [];
          const pending = queue.shift();
          if (queue.length === 0) {
            pendingMacro.delete(event.label);
          } else {
            pendingMacro.set(event.label, queue);
          }

          if (pending) {
            // Remove from Web APIs
            snapshot.webApis = snapshot.webApis.filter((w) => w.id !== pending.id);
            // Add to task queue momentarily (visual effect)
            snapshot.taskQueue.push({
              id: pending.id,
              label: prettyLabel,
              kind: 'macro',
              delay: pending.delay,
            });
            // Then add to call stack
            activeCalls.set(event.label, pending.id);
            snapshot.callStack.push({
              id: pending.id,
              name: prettyLabel,
              kind: 'macro',
              loc: event.loc,
            });
          }
          snapshot.eventLoopPhase = 'executing';
        } else if (event.phase === 'end') {
          const frameId = activeCalls.get(event.label);
          if (frameId) {
            snapshot.callStack = snapshot.callStack.filter((f) => f.id !== frameId);
            snapshot.taskQueue = snapshot.taskQueue.filter((t) => t.id !== frameId);
            activeCalls.delete(event.label);
          }
          // Check what's next
          snapshot.eventLoopPhase =
            snapshot.microtaskQueue.length > 0
              ? 'checking-microtasks'
              : snapshot.taskQueue.length > 0
                ? 'checking-tasks'
                : 'idle';
        }
        break;
      }

      case 'raf': {
        if (event.phase === 'enqueue') {
          const itemId = generateId('raf');
          const pending: PendingItem = {
            id: itemId,
            label: 'rAF',
            startTime: event.at,
          };
          const queue = pendingRaf.get(event.label) || [];
          queue.push(pending);
          pendingRaf.set(event.label, queue);

          snapshot.webApis.push({
            id: itemId,
            label: 'requestAnimationFrame',
            type: 'raf',
            startTime: event.at,
          });
        } else if (event.phase === 'start') {
          const queue = pendingRaf.get(event.label) || [];
          const pending = queue.shift();
          if (queue.length === 0) {
            pendingRaf.delete(event.label);
          } else {
            pendingRaf.set(event.label, queue);
          }

          if (pending) {
            snapshot.webApis = snapshot.webApis.filter((w) => w.id !== pending.id);
            activeCalls.set(event.label, pending.id);
            snapshot.callStack.push({
              id: pending.id,
              name: 'rAF callback',
              kind: 'raf',
              loc: event.loc,
            });
          }
          snapshot.eventLoopPhase = 'executing';
        } else if (event.phase === 'end') {
          const frameId = activeCalls.get(event.label);
          if (frameId) {
            snapshot.callStack = snapshot.callStack.filter((f) => f.id !== frameId);
            activeCalls.delete(event.label);
          }
          snapshot.eventLoopPhase = 'idle';
        }
        break;
      }

      case 'output': {
        // Add console entry
        if (logIndex < logs.length) {
          const logMessage = logs[logIndex];
          const levelMatch = logMessage.match(/^\[(log|warn|error|info)\]\s*/);
          const level = (levelMatch?.[1] || 'log') as ConsoleEntry['level'];
          const message = logMessage.replace(/^\[(log|warn|error|info)\]\s*/, '');

          snapshot.console.push({
            id: generateId('console'),
            message,
            level,
          });
          // Keep last 5 entries
          if (snapshot.console.length > 5) {
            snapshot.console = snapshot.console.slice(-5);
          }
          logIndex++;
        }
        break;
      }
    }

    steps.push({
      key: `${event.id}-${event.phase}-${event.at}`,
      event,
      title: meta.title,
      caption: meta.caption,
      badge: meta.badge,
      badgeColor: meta.badgeColor,
      durationMs: meta.durationMs,
      atOffset: event.at - minAt,
      currentLine: event.loc?.line,
      snapshot: cloneSnapshot(snapshot),
    });
  }

  return steps;
}

/**
 * Get the event loop phase color for styling.
 */
export function getEventLoopPhaseColor(phase: EventLoopPhase): string {
  switch (phase) {
    case 'idle':
      return 'slate';
    case 'executing':
      return 'pink';
    case 'checking-microtasks':
      return 'violet';
    case 'checking-tasks':
      return 'amber';
    default:
      return 'slate';
  }
}

/**
 * Get the kind color for a stack frame or queue item.
 */
export function getKindColor(kind: 'sync' | 'micro' | 'macro' | 'raf'): string {
  switch (kind) {
    case 'sync':
      return 'pink';
    case 'micro':
      return 'violet';
    case 'macro':
      return 'amber';
    case 'raf':
      return 'cyan';
    default:
      return 'slate';
  }
}
