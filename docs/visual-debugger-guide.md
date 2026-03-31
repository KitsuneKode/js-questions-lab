# Visual Debugger Developer Guide

## Overview

The Visual Debugger is a production-ready expression-level JavaScript execution tracer that provides Lydia Hallie keynote-style animations. It transforms user code via Babel AST manipulation to inject tracing calls, then visualizes execution with a vertical call stack, Web APIs lane, and task queues.

## Architecture

```text
User Code → Babel Transform → Instrumented Code → Worker Execution → Enhanced Timeline → Visual Debugger UI
```

### Key Components

1. **Babel Transformer** (`apps/web/lib/run/babel-transform.ts`)
   - Parses user code with `@babel/standalone`
   - Injects `__tracer.scopeEnter()` / `__tracer.scopeExit()` calls around functions
   - Wraps expressions with `__tracer.trace()` for line-level tracking
   - Handles: FunctionDeclaration, FunctionExpression, ArrowFunctionExpression, CallExpression, VariableDeclarator, AwaitExpression

2. **Tracer Runtime** (`apps/web/lib/run/tracer-runtime.ts`)
   - Lightweight helpers injected into worker scope
   - Emits enhanced timeline events with source locations
   - Tracks: scope chain, variable bindings, API metadata

3. **Replay Engine** (`apps/web/lib/visualization/replay-engine.ts`)
   - Converts flat timeline into stepped replay sequence
   - Groups related events (scope enter/exit pairs)
   - Calculates timing offsets and durations
   - Builds call stack snapshots per step

4. **Visual Debugger UI** (`apps/web/components/visualization/`)
   - `visual-debugger.tsx` - Main container with playback controls
   - `debugger-call-stack.tsx` - Animated LIFO stack (pink)
   - `debugger-web-apis.tsx` - Timer/RAF/fetch/event cards
   - `debugger-queues.tsx` - Task/Microtask queue lanes
   - `debugger-event-loop.tsx` - Rotating phase indicator ring
   - `debugger-code-panel.tsx` - Monaco editor with line decorations
   - `debugger-controls.tsx` - Play/pause/step navigation

## How Tracing Works

### AST Transformation Example

**Input:**

```javascript
function add(a, b) {
  return a + b;
}

const result = add(1, 2);
console.log(result);
```

**Transformed:**

```javascript
function add(a, b) {
  __tracer.scopeEnter("add", 1, 0);
  try {
    return (__tracer.trace("a + b", 2, 9), a + b);
  } finally {
    __tracer.scopeExit("add", 1, 0);
  }
}

const result = (__tracer.trace("add", 6, 15), add(1, 2));
(__tracer.trace("console.log", 7, 0), console.log(result));
```

### Emitted Events

```typescript
{
  id: 1,
  at: 0,
  kind: 'scope',
  phase: 'enter',
  label: 'add',
  loc: { line: 1, column: 0 },
  context: {
    functionName: 'add',
    scopeChain: [{ type: 'function', name: 'add', variables: { a: 1, b: 2 } }],
    thisBinding: 'global'
  }
}
```

## Color System

<!-- markdownlint-disable MD060 -->
| Element | Color | Tailwind Class |
|-|-|-|
| Call Stack | Pink | `bg-pink-500/10`, `border-pink-500/30` |
| Microtasks | Violet | `bg-violet-500/10`, `border-violet-500/30` |
| Tasks | Amber | `bg-amber-500/10`, `border-amber-500/30` |
| Timers | Cyan | `bg-cyan-500/10`, `border-cyan-500/30` |
| RAF | Sky | `bg-sky-500/10`, `border-sky-500/30` |
| Active Line | Pink | `debugger-active-line` (CSS) |
<!-- markdownlint-enable MD060 -->

## Animation Specifications

All animations respect `prefers-reduced-motion`:

- **Stack push**: 400ms spring (bounce: 0.15) from top with blur
- **Stack pop**: 150ms ease-out exit upward with fade
- **Queue chips**: 400ms spring slide from left
- **Event loop rotation**: 2000ms linear continuous
- **Line highlight**: 200ms ease-in background fade

## Usage in Question IDE

Users toggle between simple timeline and Visual Debugger:

```tsx
// apps/web/components/ide/question-ide-client.tsx
const [debuggerMode, setDebuggerMode] = useState<'timeline' | 'visual'>('timeline');

{debuggerMode === 'visual' ? (
  <VisualDebugger 
    code={code}
    enhancedTimeline={enhancedTimeline}
    logs={logs.map(l => l.message)}
  />
) : (
  <TimelineChart events={timeline} />
)}
```

## Performance Considerations

1. **Transformation caching**: Transformed code cached by hash (max 100 entries)
2. **Worker isolation**: All tracing runs off main thread
3. **Step throttling**: Auto-play respects 16ms frame budget
4. **Monaco decorations**: Only active line highlighted (not full diff)

## Debugging Tips

### If transformation fails

1. Check browser console for Babel parse errors
2. Verify syntax is valid ES5+ (no TypeScript)
3. Look for `error` in `transformForTracing` result

### If visualization doesn't update

1. Confirm worker emits `enhanced-timeline` message
2. Check `replay-engine.ts` step generation logic
3. Verify `activeIndex` state updates in `visual-debugger.tsx`

### If Monaco highlighting breaks

1. Inspect CSS classes `.debugger-active-line` and `.debugger-active-glyph`
2. Ensure `currentLine` prop matches transformed code line numbers
3. Check delta decorations are disposed on unmount

## Future Enhancements

Potential additions for deeper visualization:

- **Memory/Heap view**: Object allocation tracking
- **Lexical scope chains**: Closure variable references
- **Prototype chain inspection**: `[[Prototype]]` links
- **Event listener graph**: DOM node → handler mappings
- **Async stack traces**: Across microtask boundaries

## Related Files

- Full spec: `docs/specs/js-visualizer-enhancement.md`
- Types: `apps/web/lib/run/types.ts` (EnhancedTimelineEvent)
- Zod schemas: `apps/web/lib/run/sandbox.ts` (worker validation)
- CSS decorations: `apps/web/app/globals.css`

## Testing Checklist

Before shipping Visual Debugger changes:

- [ ] Lint passes: `bun run lint`
- [ ] Typecheck passes: `bun run typecheck`
- [ ] Build succeeds: `bun run build`
- [ ] Simple async snippet (setTimeout) visualizes correctly
- [ ] Closures show nested scope chains
- [ ] Promise/await shows microtask queue
- [ ] Reduced motion mode disables animations
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Mobile layout stacks panels vertically
