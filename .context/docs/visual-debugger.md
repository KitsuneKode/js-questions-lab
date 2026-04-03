# Visual Debugger Developer Guide

The Visual Debugger is a production-ready expression-level JavaScript execution tracer that provides Lydia Hallie keynote-style animations. It transforms user code via Babel AST manipulation to inject tracing calls, then visualizes execution with a vertical call stack, Web APIs lane, and task queues.

## Architecture

`User Code → Babel Transform → Instrumented Code → Worker Execution → Enhanced Timeline → Visual Debugger UI`

1. **Babel Transformer** (`apps/web/lib/run/babel-transform.ts`)
   - Parses user code with `@babel/standalone`.
   - Injects `__tracer.scopeEnter()` / `__tracer.scopeExit()` calls around functions.
   - Wraps expressions with `__tracer.trace()` for line-level tracking.
2. **Tracer Runtime** (`apps/web/lib/run/tracer-runtime.ts`)
   - Lightweight helpers injected into worker scope. Emits enhanced timeline events with source locations.
3. **Replay Engine** (`apps/web/lib/visualization/replay-engine.ts`)
   - Converts flat timeline into stepped replay sequence.
4. **Visual Debugger UI** (`apps/web/components/visualization/`)
   - `visual-debugger.tsx` - Main container.
   - `debugger-call-stack.tsx` - Animated LIFO stack (pink).
   - `debugger-web-apis.tsx`, `debugger-queues.tsx`, `debugger-event-loop.tsx`, `debugger-code-panel.tsx`.

## Animation Specifications

- **Stack push**: 400ms spring (bounce: 0.15) from top with blur.
- All animations respect `prefers-reduced-motion`.
- Worker isolation: All tracing runs off main thread.

## Debugging Tips

- If visualization doesn't update, confirm worker emits `enhanced-timeline` message and check `replay-engine.ts` step generation logic.
- If Monaco highlighting breaks, inspect CSS classes `.debugger-active-line` and `.debugger-active-glyph`.
