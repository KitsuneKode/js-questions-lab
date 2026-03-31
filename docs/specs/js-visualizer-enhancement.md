<!-- markdownlint-disable MD060 -->
# JavaScript Code Visualizer Enhancement Specification

## Overview

Transform the current event loop timeline into a production-ready "Visual Debugger" that provides expression-level code tracing with Lydia Hallie keynote-style animations. Users will understand JavaScript execution line-by-line with beautiful visualizations of the call stack, execution context, Web APIs, and task queues.

## Requirements Summary

| Requirement | Approach |
|-|-|
| Expression-level tracing | Babel AST transformation via `@babel/standalone` |
| New premium view | Separate "Visual Debugger" component coexisting with simple timeline |
| Extended API coverage | `requestAnimationFrame`, `fetch/XHR`, `addEventListener` |
| Code-to-visualization sync | Monaco editor decorations highlighting current line/expression |
| Lydia Hallie style | Vertical call stack, colored queue lanes, smooth spring animations |

## Architecture

```text
                                    +------------------+
                                    |   Monaco Editor  |
                                    |  (with markers)  |
                                    +--------+---------+
                                             |
                                             v
+---------------------------+       +------------------+
|  @babel/standalone        |       |  Trace Events    |
|  (browser-side transform) +------>+  { line, col,    |
|  Injects tracing calls    |       |    type, data }  |
+---------------------------+       +--------+---------+
                                             |
                                             v
                              +-----------------------------+
                              |      Web Worker Sandbox     |
                              |  - Executes transformed code |
                              |  - Emits enhanced timeline   |
                              |  - Captures scope snapshots  |
                              +-------------+---------------+
                                            |
                                            v
                              +-----------------------------+
                              |     Visual Debugger UI      |
                              | +-------------------------+ |
                              | |     Code Panel          | |
                              | | (synced line highlight) | |
                              | +-------------------------+ |
                              | |     Visualization       | |
                              | | +-----+  +------------+ | |
                              | | |Stack|  | Web APIs   | | |
                              | | +-----+  +------------+ | |
                              | | +----------+ +--------+ | |
                              | | |Microtasks| | Tasks  | | |
                              | | +----------+ +--------+ | |
                              | +-------------------------+ |
                              | |   Event Loop Indicator  | |
                              | +-------------------------+ |
                              +-----------------------------+
```

## Enhanced Timeline Event Schema

```typescript
// Extended from current TimelineEvent
interface EnhancedTimelineEvent {
  id: number;
  at: number;
  kind: 'sync' | 'macro' | 'micro' | 'output' | 'scope' | 'raf';
  phase: 'enqueue' | 'start' | 'end' | 'instant' | 'enter' | 'exit';
  label: string;
  
  // NEW: Source location for code sync
  loc?: {
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
  };
  
  // NEW: Execution context snapshot
  context?: {
    functionName: string | null;
    scopeChain: ScopeSnapshot[];
    thisBinding: string; // Serialized representation
  };
  
  // NEW: For Web API tracking
  apiMeta?: {
    type: 'timer' | 'raf' | 'fetch' | 'event';
    delay?: number;         // For setTimeout/setInterval
    url?: string;           // For fetch
    eventType?: string;     // For addEventListener
    targetSelector?: string; // For event listeners
  };
}

interface ScopeSnapshot {
  type: 'global' | 'function' | 'block';
  name: string;
  variables: Record<string, SerializedValue>;
}

interface SerializedValue {
  type: 'primitive' | 'object' | 'array' | 'function' | 'undefined' | 'null';
  preview: string;  // Short display string
  value?: unknown;  // Actual value for primitives
}
```

## Implementation Phases

### Phase 1: Babel Instrumentation Layer

**Goal:** Transform user code to emit expression-level trace events with source locations.

**New Files:**

- `apps/web/lib/run/babel-transform.ts` - Babel transformation logic
- `apps/web/lib/run/tracer-runtime.ts` - Runtime helpers injected into worker

**Dependencies to Add:**

```json
{
  "@babel/standalone": "^7.26.0"
}
```

**Transformation Strategy:**

```javascript
// Input code:
const x = 1 + 2;
console.log(x);

// Transformed code:
const x = (__trace({ line: 1, col: 10, type: 'expr' }, 1 + 2));
__trace({ line: 2, col: 0, type: 'call', name: 'console.log' });
console.log(x);
```

**Babel Plugin Outline:**

```typescript
// babel-transform.ts
import { transform } from '@babel/standalone';

const tracerPlugin = () => ({
  visitor: {
    // Track variable declarations
    VariableDeclarator(path) {
      // Wrap init with __trace call
    },
    
    // Track function calls
    CallExpression(path) {
      // Emit trace before call
    },
    
    // Track function entries/exits
    FunctionDeclaration(path) {
      // Inject __scopeEnter at start
      // Wrap body with try/finally for __scopeExit
    },
    
    // Track async boundaries
    AwaitExpression(path) {
      // Mark await points
    }
  }
});

export function transformForTracing(code: string): TransformResult {
  return transform(code, {
    plugins: [tracerPlugin],
    sourceType: 'script',
    sourceMaps: 'inline'
  });
}
```

### Phase 2: Enhanced Worker Sandbox

**Goal:** Execute transformed code and emit enhanced timeline events.

**Modifications to `sandbox.ts`:**

1. Import and use Babel transformation before execution
2. Inject tracer runtime into worker scope
3. Extend message schema for new event types
4. Add scope snapshot capture

**New Tracer Runtime (injected into worker):**

```typescript
// tracer-runtime.ts
interface TracerConfig {
  pushTimeline: (event: Partial<EnhancedTimelineEvent>) => void;
  captureScope: () => ScopeSnapshot[];
}

function createTracer(config: TracerConfig) {
  return {
    __trace(loc: { line: number; col: number; type: string }, value?: unknown) {
      config.pushTimeline({
        kind: 'sync',
        phase: 'instant',
        label: `Expression at ${loc.line}:${loc.col}`,
        loc
      });
      return value;
    },
    
    __scopeEnter(name: string, loc: { line: number }) {
      config.pushTimeline({
        kind: 'scope',
        phase: 'enter',
        label: name || 'anonymous',
        loc,
        context: {
          functionName: name,
          scopeChain: config.captureScope(),
          thisBinding: 'window'
        }
      });
    },
    
    __scopeExit(name: string, loc: { line: number }) {
      config.pushTimeline({
        kind: 'scope',
        phase: 'exit',
        label: name || 'anonymous',
        loc
      });
    }
  };
}
```

**Extended API Patching:**

```typescript
// Add to worker source

// requestAnimationFrame
runnerScope.requestAnimationFrame = (fn) => {
  pushTimeline('raf', 'enqueue', 'requestAnimationFrame');
  markAsyncStart();
  return originalRAF((timestamp) => {
    pushTimeline('raf', 'start', 'rAF callback');
    try {
      fn(timestamp);
    } finally {
      pushTimeline('raf', 'end', 'rAF callback');
      markAsyncEnd();
    }
  });
};

// fetch
runnerScope.fetch = async (url, options) => {
  const label = `fetch(${typeof url === 'string' ? url : 'Request'})`;
  pushTimeline('macro', 'enqueue', label, { apiMeta: { type: 'fetch', url: String(url) } });
  markAsyncStart();
  try {
    // Return mock response for safety
    return new Response(JSON.stringify({ mocked: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    pushTimeline('macro', 'end', label);
    markAsyncEnd();
  }
};

// addEventListener (on mocked elements)
const mockElement = {
  addEventListener(type, handler) {
    pushTimeline('macro', 'enqueue', `addEventListener('${type}')`, {
      apiMeta: { type: 'event', eventType: type }
    });
  }
};
```

### Phase 3: Visual Debugger UI Component

**Goal:** Create the premium Lydia Hallie-style visualization component.

**New Files:**

- `apps/web/components/visualization/visual-debugger.tsx` - Main container
- `apps/web/components/visualization/debugger-call-stack.tsx` - Animated call stack
- `apps/web/components/visualization/debugger-queues.tsx` - Task/Microtask queues
- `apps/web/components/visualization/debugger-web-apis.tsx` - Web APIs lane
- `apps/web/components/visualization/debugger-event-loop.tsx` - Event loop indicator
- `apps/web/components/visualization/debugger-code-panel.tsx` - Synced code view
- `apps/web/components/visualization/debugger-controls.tsx` - Playback controls
- `apps/web/lib/visualization/replay-engine.ts` - Step-by-step replay logic

**Color Palette (Lydia Hallie inspired):**

```typescript
const DEBUGGER_COLORS = {
  // Lanes
  callStack: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    chip: 'bg-pink-500/20 text-pink-200',
    dot: 'bg-pink-400'
  },
  webApis: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    chip: 'bg-cyan-500/20 text-cyan-200',
    dot: 'bg-cyan-400'
  },
  microtaskQueue: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    chip: 'bg-violet-500/20 text-violet-200',
    dot: 'bg-violet-400'
  },
  taskQueue: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    chip: 'bg-amber-500/20 text-amber-200',
    dot: 'bg-amber-400'
  },
  
  // Event loop phases
  eventLoop: {
    idle: 'text-slate-500',
    checkingMicrotasks: 'text-violet-400',
    checkingTasks: 'text-amber-400',
    executing: 'text-pink-400'
  }
} as const;
```

**Visual Debugger Layout:**

```text
+------------------------------------------------------------------+
| Visual Debugger                                    [Controls]     |
+------------------------------------------------------------------+
|                                                                   |
| +---------------------------+  +--------------------------------+ |
| |    CODE PANEL             |  |      RUNTIME VISUALIZATION     | |
| |                           |  |                                | |
| |  1 | const x = 1;    <--  |  |  +--------+   +-------------+  | |
| |  2 | setTimeout(() => {   |  |  | CALL   |   | WEB APIs    |  | |
| |  3 |   console.log(x);    |  |  | STACK  |   |             |  | |
| |  4 | }, 0);               |  |  |        |   | setTimeout  |  | |
| |  5 | console.log("sync"); |  |  | main() |   | [=====>]    |  | |
| |                           |  |  +--------+   +-------------+  | |
| |  Line highlight synced    |  |                                | |
| |  to current step          |  |  +-------------+ +-----------+ | |
| |                           |  |  | MICROTASKS  | | TASKS     | | |
| +---------------------------+  |  |             | |           | | |
|                                |  | Promise.then| | setTimeout| | |
|                                |  +-------------+ +-----------+ | |
|                                |                                | |
|                                |  +----------------------------+| |
|                                |  |    EVENT LOOP INDICATOR    || |
|                                |  |  [Checking microtask queue]|| |
|                                |  +----------------------------+| |
|                                +--------------------------------+ |
+------------------------------------------------------------------+
| Step 3/12  |  +0.5ms  |  [|<] [<] [>||] [>] [>|]  |  [Restart]  |
+------------------------------------------------------------------+
```

**Call Stack Component (Vertical Pancake Style):**

```tsx
// debugger-call-stack.tsx
interface DebuggerCallStackProps {
  frames: StackFrame[];
  activeFrameId: string | null;
  prefersReducedMotion: boolean;
}

export function DebuggerCallStack({ frames, activeFrameId, prefersReducedMotion }: DebuggerCallStackProps) {
  return (
    <div className="flex flex-col-reverse gap-2 min-h-[300px] p-4 rounded-xl border border-pink-500/20 bg-pink-500/5">
      <div className="text-xs text-pink-400/60 uppercase tracking-wider mb-2">
        Call Stack
      </div>
      
      <AnimatePresence mode="popLayout">
        {frames.length === 0 ? (
          <div className="text-slate-500 text-sm italic">Stack empty</div>
        ) : (
          frames.map((frame, index) => (
            <motion.div
              key={frame.id}
              layout
              initial={prefersReducedMotion ? false : { 
                opacity: 0, 
                y: -20, 
                scale: 0.9,
                filter: 'blur(4px)'
              }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                filter: 'blur(0px)'
              }}
              exit={prefersReducedMotion ? undefined : { 
                opacity: 0, 
                y: -10, 
                scale: 0.95,
                filter: 'blur(2px)',
                transition: { duration: 0.15 }
              }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              className={cn(
                'px-4 py-3 rounded-lg border font-mono text-sm',
                frame.id === activeFrameId 
                  ? 'border-pink-400/50 bg-pink-500/20 shadow-lg shadow-pink-500/10' 
                  : 'border-pink-500/20 bg-pink-500/10'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-pink-300">{frame.name || 'anonymous'}</span>
                {frame.loc && (
                  <span className="text-pink-400/50 text-xs">
                    :{frame.loc.line}
                  </span>
                )}
              </div>
              {frame.variables && Object.keys(frame.variables).length > 0 && (
                <div className="mt-2 text-xs text-pink-400/70 space-y-1">
                  {Object.entries(frame.variables).slice(0, 3).map(([key, val]) => (
                    <div key={key}>
                      <span className="text-pink-300">{key}</span>
                      <span className="text-pink-400/50">: </span>
                      <span className="text-pink-200">{val.preview}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Event Loop Indicator (Animated Ring):**

```tsx
// debugger-event-loop.tsx
interface DebuggerEventLoopProps {
  phase: 'idle' | 'checking-microtasks' | 'checking-tasks' | 'executing';
  prefersReducedMotion: boolean;
}

export function DebuggerEventLoop({ phase, prefersReducedMotion }: DebuggerEventLoopProps) {
  const phaseConfig = {
    'idle': { label: 'Waiting for tasks...', color: 'slate' },
    'checking-microtasks': { label: 'Draining microtask queue', color: 'violet' },
    'checking-tasks': { label: 'Picking next task', color: 'amber' },
    'executing': { label: 'Executing on call stack', color: 'pink' }
  };
  
  const { label, color } = phaseConfig[phase];
  
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50">
      {/* Animated loop indicator */}
      <motion.div
        className={cn(
          'w-8 h-8 rounded-full border-2 border-dashed',
          `border-${color}-400`
        )}
        animate={prefersReducedMotion ? {} : { rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
      
      <div className="flex-1">
        <div className="text-xs text-slate-500 uppercase tracking-wider">Event Loop</div>
        <motion.div 
          key={phase}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('text-sm font-medium', `text-${color}-400`)}
        >
          {label}
        </motion.div>
      </div>
    </div>
  );
}
```

### Phase 4: Monaco Editor Integration

**Goal:** Sync code highlighting with visualization steps.

**Monaco Decoration Strategy:**

```typescript
// In debugger-code-panel.tsx
import { useMonaco } from '@monaco-editor/react';

function useCodeHighlighting(
  editorRef: React.RefObject<monaco.editor.IStandaloneCodeEditor>,
  currentLoc: { line: number; column: number } | null
) {
  const decorationsRef = useRef<string[]>([]);
  
  useEffect(() => {
    if (!editorRef.current || !currentLoc) return;
    
    const editor = editorRef.current;
    
    // Clear previous decorations
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    
    // Add new highlight
    decorationsRef.current = editor.deltaDecorations([], [
      {
        range: new monaco.Range(
          currentLoc.line, 1,
          currentLoc.line, 1000
        ),
        options: {
          isWholeLine: true,
          className: 'debugger-active-line',
          glyphMarginClassName: 'debugger-active-glyph'
        }
      }
    ]);
    
    // Scroll to line
    editor.revealLineInCenter(currentLoc.line);
  }, [currentLoc]);
}
```

**CSS for Monaco decorations:**

```css
/* In globals.css */
.debugger-active-line {
  background: rgba(236, 72, 153, 0.15) !important;
  border-left: 3px solid rgb(236, 72, 153);
}

.debugger-active-glyph {
  background: rgb(236, 72, 153);
  border-radius: 50%;
  margin-left: 3px;
}
```

### Phase 5: Integration & Polish

**Goal:** Wire everything together and add final polish.

**Integration Points:**

1. **Question IDE Client** - Add "Visual Debugger" button alongside "Event Loop Replay"
2. **Floating Scratchpad** - Add toggle to switch between simple timeline and visual debugger
3. **Keyboard shortcuts** - `Cmd+Shift+D` to open Visual Debugger

**Entry Point Updates:**

```typescript
// In question-ide-client.tsx
const [debuggerMode, setDebuggerMode] = useState<'timeline' | 'visual'>('timeline');

// In the dialog that shows timeline:
{debuggerMode === 'timeline' ? (
  <TimelineChart events={timeline} />
) : (
  <VisualDebugger 
    code={code}
    events={enhancedTimeline} 
    onClose={() => setShowDebugger(false)}
  />
)}
```

## File Structure

```text
apps/web/
├── lib/
│   └── run/
│       ├── sandbox.ts              # Modify: integrate Babel
│       ├── babel-transform.ts      # NEW: Babel plugin + transform
│       ├── tracer-runtime.ts       # NEW: __trace helpers
│       └── types.ts                # Modify: EnhancedTimelineEvent
│
├── components/
│   └── visualization/
│       ├── timeline-chart.tsx      # KEEP: existing simple view
│       ├── visual-debugger.tsx     # NEW: main container
│       ├── debugger-call-stack.tsx # NEW
│       ├── debugger-queues.tsx     # NEW
│       ├── debugger-web-apis.tsx   # NEW
│       ├── debugger-event-loop.tsx # NEW
│       ├── debugger-code-panel.tsx # NEW: Monaco with highlights
│       └── debugger-controls.tsx   # NEW: playback UI
│
└── lib/visualization/
    └── replay-engine.ts            # NEW: step computation logic
```

## Dependencies to Add

```json
{
  "@babel/standalone": "^7.26.0"
}
```

## Animation Specifications

| Animation | Duration | Easing | Notes |
|-|-|-|-|
| Stack push | 400ms | spring (bounce: 0.15) | Enter from top with blur |
| Stack pop | 150ms | ease-out | Exit upward with fade |
| Queue chip enter | 400ms | spring (bounce: 0.15) | Slide from left |
| Queue chip exit | 150ms | ease-out | Fade out |
| Event loop rotation | 2000ms | linear | Continuous when active |
| Line highlight | 200ms | ease-out | Background fade in |
| Step transition | instant | - | State change is immediate |

## Accessibility

- All animations respect `prefers-reduced-motion`
- Keyboard navigation for step controls
- ARIA labels on all interactive elements
- Focus management when opening/closing debugger
- Screen reader announcements for step changes

## Performance Considerations

1. **Babel transformation** - Cached per code string (WeakMap or LRU cache)
2. **Replay computation** - Memoized with useMemo
3. **Animation** - Use `layout` prop sparingly, prefer `position: absolute` for exit animations
4. **Worker communication** - Batch timeline events if needed
5. **Monaco decorations** - Delta updates only, no full re-render

## Testing Strategy

1. **Unit tests** for Babel transformation (various JS patterns)
2. **Unit tests** for replay engine (event -> snapshot computation)
3. **Integration tests** for worker + transformation pipeline
4. **Visual regression tests** for debugger components
5. **E2E tests** for full flow: code -> run -> visualize

## Success Metrics

- [ ] Expression-level events emitted with correct source locations
- [ ] Call stack visualization matches actual execution
- [ ] Queue visualizations accurately reflect pending tasks
- [ ] Code highlighting syncs perfectly with visualization steps
- [ ] Animations are smooth (60fps) on mid-range devices
- [ ] Reduced motion mode works completely
- [ ] No regression in existing timeline functionality
- [ ] Works with all existing question snippets
