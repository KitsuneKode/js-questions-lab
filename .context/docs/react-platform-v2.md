# React Platform V2 — Implementation Plan

**Status**: Active  
**Branch**: `feat/react-platform`  
**Supersedes**: `prd-react-platform.md` (original PRD preserved for reference)  
**Last updated**: 2026-04-29

---

## 0. Context: What Already Exists

The branch already ships a working React IDE. This document defines targeted improvements, not a rewrite.

| Already built | Status |
|---|---|
| `/react` listing page + `ReactQuestionGrid` | ✓ functional |
| `/react/[id]` detail page + `ReactIDEClient` | ✓ functional |
| Sandpack runtime + `darkForgeTheme` | ✓ |
| Split/editor/preview/console layout modes | ✓ |
| Review phase + SRS grading | ✓ |
| Solution file swap (`updateFile`) | ✓ |
| Progress integration (`useProgress`) | ✓ |
| 10 parsed React questions | ✓ |
| `SandpackCodeMirrorEditor` (current editor layer) | ✓ being replaced |

---

## 1. Git / Package Fixes (Complete)

### 1.1 bun.lock conflict — RESOLVED
Stash pop created a 3-way conflict at line 2334 (`@types/prettier/prettier` entry). Resolved by keeping the stash version.

### 1.2 package.json conflict — RESOLVED
The staged `package.json` contained raw conflict markers. Resolved: keep upstream's `devDependencies` (turbo `^2.9.6`) + stash's `dependencies` (codemirror packages, prettier `^3.8.2`). Both blocks are correct, they were in separate sections.

### 1.3 Staged WIP (ready to commit)
- `codemirror-editor.tsx` — `useCallback`/`useMemo`/`useRef` stability, `indentWithTab: true`
- `react-ide-client.tsx` — `recompileMode: 'delayed'`, `initMode: 'immediate'`, `updateFile` fix
- `package.json` — clean, no conflicts
- `bun.lock` — clean, no conflicts

### 1.4 Unstaged (separate commit)
- `leaderboard-table.tsx` — stagger animation + rank glow shadows
- `terminal-output.tsx` — border→shadow, `rounded-xl`, traffic light polish
- `react-ide-client.tsx` — concentric radius fix on layout toggle, transition specificity
- `proxy.ts` — quote style + `llms\\.txt` exclusion

---

## 2. Runtime Architecture Decision

### Decision: Sandpack (runtime) + Monaco (editor)

**Sandpack** stays as the execution runtime: bundler, module resolution, hot-reload, preview iframe, console. It runs in a cross-origin sandboxed iframe — executed user code cannot access the host page's cookies, localStorage, or DOM.

**Monaco** replaces `SandpackCodeMirrorEditor` as the editing surface. Monaco is already in the bundle (used in JS questions IDE) — zero additional cost. It provides:
- Full TypeScript IntelliSense via JSX compiler options already configured in `MonacoCodeEditor`
- Native `readOnly` prop for solution viewing
- Multi-file model support via `projectFiles` prop (already implemented)
- `path` prop for Monaco URI tracking across file switches

**Bridge layer** (`SandpackMonacoEditor` component, replaces `SandpackCodeMirrorEditor`):
```tsx
const { sandpack } = useSandpack();
const { files, activeFile, updateFile } = sandpack;

// Monaco reads from Sandpack file system
const code = files[activeFile]?.code ?? '';
const projectFiles = Object.fromEntries(
  Object.entries(files)
    .filter(([path]) => !path.includes('node_modules'))
    .map(([path, file]) => [path, file.code])
);

// Monaco writes back via updateFile
<MonacoCodeEditor
  value={code}
  path={activeFile}
  projectFiles={projectFiles}
  onChange={(val) => updateFile(activeFile, val ?? '')}
  readOnly={isReadOnly}
  language={activeFile.endsWith('.html') ? 'html' : 'typescript'}
/>
```

**Why not pure CodeMirror?** CodeMirror is already working and this is an optional upgrade. The reason to switch: Monaco's multi-file model means TypeScript `import` statements in one file resolve against other files in the project — CodeMirror has no concept of cross-file types. For hooks like `useDebounce` that export from `utils.ts`, Monaco gives correct IntelliSense; CodeMirror doesn't.

**File tree**: Use Sandpack's native `SandpackFileExplorer` exported from `@codesandbox/sandpack-react`. Removes the custom `custom-file-tree.tsx`. Sandpack's component stays in sync with its file system without manual `useSandpack()` wiring.

---

## 3. Read Phase — Three-Phase Architecture

### 3.1 Decision

Implement `'read' | 'build' | 'review'` as proper inline phases. The current modal approach is removed.

**Why**: The `/react` listing page explicitly shows users `01 Read the concept → 02 Build in the IDE → 03 Self-grade`. The modal breaks that promise. Users dismiss it to start coding, losing access to the concept explanation.

### 3.2 Phase behaviour

| Phase | Initial state | What user sees |
|---|---|---|
| `read` | Default on first visit | Left: concept + problem statement (Streamdown rendered). Right: static code preview of what they'll build (syntax-highlighted, non-interactive). CTA: "Start Building →" |
| `build` | After CTA or returning to question | Full IDE: editor left, preview+console right |
| `review` | After "Mark Done" or "View Solution" | SRS grading cards + resources panel |

**Return visits**: If `isAlreadyAttempted`, default phase is `build` (skip the read gate). The `read` tab is still accessible as a quick reference but shows a compact version — no "Start Building" CTA, just the problem text.

### 3.3 Phase tabs update (`phase-tabs.tsx`)

```tsx
export type ReactIDEPhase = 'read' | 'build' | 'review';

const PHASES = [
  { id: 'read',   label: 'Read',   step: '01' },
  { id: 'build',  label: 'Build',  step: '02' },
  { id: 'review', label: 'Review', step: '03' },
];
```

Locking rules:
- `review` locked until `hasAttempted`
- `read` always accessible
- `build` always accessible (read phase has a "skip" path)

### 3.4 Read phase layout

Left panel (60% width):
```
┌─ Concept ─────────────────────────────────────────────┐
│  [category pill]  [difficulty badge]                   │
│                                                        │
│  ## Title                                              │
│  <context rendered via Streamdown if present>          │
│                                                        │
│  ─── What to Build ───────────────────────────────     │
│  <prompt rendered via Streamdown>                      │
│                                                        │
│  [Start Building →]  amber button, bottom of panel     │
└────────────────────────────────────────────────────────┘
```

Right panel (40% width):
```
┌─ Preview ─────────────────────────────────────────────┐
│  Static syntax-highlighted starter code (Shiki)        │
│  NOT a live Sandpack embed — just a teaser             │
│  Shows the entry file with line numbers                │
└────────────────────────────────────────────────────────┘
```

**Shiki** is already in the codebase for question detail pages. Use it for the read-phase code preview. No Sandpack cost on the read phase.

### 3.5 Transition animation

Read → Build: slide the left panel content out left, editor slides in from right. `motion/react` `AnimatePresence` with `x: [-20, 0]` on enter, `x: [0, 20]` on exit. Duration 200ms, `cubic-bezier(0.23, 1, 0.32, 1)`.

---

## 4. Solution Viewing — Read-Only Differentiation

### 4.1 Decision

Solution files are shown in a **read-only Monaco editor** with a clear visual treatment. Users can read, copy, and understand the solution but cannot accidentally edit it.

### 4.2 Implementation

When `viewMode === 'solution'`:
1. Pass `readOnly={true}` to `MonacoCodeEditor`
2. Monaco renders with cursor disabled, no text selection for typing (but copy still works via keyboard)
3. A persistent amber banner sits above the editor:
   ```
   ┌── Solution — Reference Only ─────────────────────┐
   │  ★  Studying the reference. Your code is saved.   │
   └───────────────────────────────────────────────────┘
   ```
4. The file tabs show an amber lock icon `🔒` next to each filename
5. The editor background shifts to `rgba(245, 158, 11, 0.03)` — just enough amber tint to reinforce "different mode" without being jarring

When `viewMode === 'problem'`:
1. Banner disappears, lock icons disappear
2. Editor returns to normal (user's code is preserved in `userFilesRef`)
3. Editor background returns to `--bg-code`

The `userFilesRef` pattern already in the codebase handles code preservation correctly.

### 4.3 Solution preview still runs

Sandpack's preview continues to run even in read-only mode. Users can see the solution's output live. This is intentional — understanding what the correct output looks like is half of learning.

---

## 5. Focus Mode (Maximize)

### 5.1 Decision

Add a `focused` layout mode. Not fullscreen — the IDE's own toolbar stays visible. The site-wide `SiteHeader` is hidden, the file tree collapses to an icon rail, and action buttons condense.

### 5.2 What's visible in focus mode

| Element | Focused state |
|---|---|
| Site header (`SiteHeader`) | Hidden (CSS `hidden` class via context) |
| Phase tabs | Visible |
| Title + difficulty badge | Visible (compact) |
| Layout toggle | Visible |
| "Done" / "Solution" buttons | Visible as icon buttons only (no text labels) |
| File tree | Collapsed to 32px icon rail |
| Editor | Full remaining width |
| Preview/console | Full remaining height |

### 5.3 Implementation

Add `FocusModeContext` or a simpler approach: a CSS class `ide-focused` on the IDE root `div`. The `SiteHeader` checks this via a context flag:

```tsx
// In IDELayout, when focused mode is active:
useEffect(() => {
  document.documentElement.classList.toggle('ide-focused', layoutMode === 'focused');
  return () => document.documentElement.classList.remove('ide-focused');
}, [layoutMode]);
```

```css
/* globals.css */
html.ide-focused [data-site-header] {
  display: none;
}
```

The IDE root `div` adds `h-screen` when focused (instead of filling a layout slot).

### 5.4 UI

Focus mode button: `IconMaximize` icon in the layout toggle group. When active, the IDE's ambient glow intensifies slightly (amber radial gradient opacity increases from 0.06 → 0.10) to signal "you're in deep work mode."

Exit: same button, `IconMinimize`. Or press `Escape`.

---

## 6. Pre-warming Strategy

### 6.1 Problem

Sandpack's bundler service worker needs ~1–3s to boot on first load per session. Navigating from question to question causes a reload delay.

### 6.2 Solution

**Layer 1 — Next.js prefetch**: The `ReactQuestionGrid` cards are `<Link>` elements. Next.js `prefetch={true}` (default for `<Link>`) already prefetches the next page's RSC payload. No code change needed.

**Layer 2 — Sandpack service worker**: Once Sandpack is initialized for question N, its service worker caches the bundler. Question N+1 with the same template (`react-ts`) reuses the cached bundler. The per-question startup time drops from ~2s → ~300ms.

**Layer 3 — `initMode: 'immediate'`**: Already in the staged stash. This tells Sandpack to start the bundler as soon as the component mounts rather than waiting for user interaction.

**Layer 4 — Loading state**: Add a minimal loading indicator inside `SandpackPreview`:
```tsx
<SandpackPreview
  showLoadingScreen   // Sandpack's built-in loading indicator
  // Custom override via CSS to match Dark Forge:
  className="[&_.sp-loading]:bg-void [&_.sp-loading-dots]:text-primary"
/>
```

Sandpack v2 has a native loading screen — use it with CSS overrides rather than rebuilding.

---

## 7. Error Surface

### 7.1 Error boundary dark theme fix

The inline `ErrorBoundary` in `index.tsx` currently renders with `background-color: #ffffff` (white). Fix: use the Dark Forge palette.

```tsx
// In the injected index.tsx ErrorBoundary render():
<div style={{
  padding: '20px',
  backgroundColor: '#0d0d12',
  color: '#ef4444',
  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
  height: '100%',
  minHeight: '100vh',
}}>
```

### 7.2 Console error indicator

Add a red dot badge on the Console panel button when Sandpack reports errors. Sandpack exposes `sandpack.status` and the console logs include `error` type entries. Don't auto-open the console — just signal. Let users investigate on their own terms.

```tsx
const hasError = consoleLogs.some(log => log.type === 'error');
// Show a 6px red dot on the Console button when hasError
```

### 7.3 No over-engineering

No toast notifications, no inline error panels, no syntax error overlays. The console is the error surface — the badge just makes it discoverable.

---

## 8. Design Polish Pass

Applying `frontend-design`, `emil-design-eng`, `make-interfaces-feel-better`, and `impeccable` principles.

### 8.1 `phase-tabs.tsx`

| Fix | Detail |
|---|---|
| `transition-all` → specific | `transition-colors duration-150, transition-transform duration-100` |
| Active tab color transition | Duplicate tab bar + `clip-path: inset(...)` transition for seamless color swap (Emil technique) |
| `active:scale-[0.97]` needs transition-transform | Already partially fixed in unstaged changes; complete it |
| Add stagger to tab render | `animation-delay: calc(index * 30ms)` on first mount |

### 8.2 `react-ide-client.tsx` — Header

| Fix | Detail |
|---|---|
| Remove `backdrop-blur-xl` | Replace with `bg-background border-b border-border/50`. Glassmorphism as default is banned. |
| Console chevron icon swap | Both `IconChevronDown` and `IconChevronUp` in DOM simultaneously; cross-fade with `opacity`, `scale(0.25→1)`, `blur(4px→0)`. Use `transition: opacity 150ms, transform 150ms, filter 150ms` |
| Phase transition add Y | `initial={{ opacity: 0, y: 4 }}` on build phase enter |
| Layout toggle concentric radius | Container: `rounded-lg p-1`. Buttons inside: `rounded-md`. Already partially in unstaged changes. |

### 8.3 `react-ide-client.tsx` — Problem modal inner card

| Fix | Detail |
|---|---|
| Inner `rounded-xl` inside Dialog (also `rounded-xl`) | Change inner card to `rounded-lg` — Dialog is `rounded-xl`, inner card at `p-4` padding needs at most `rounded-md` (radius 6px) by concentric rule. Use `rounded-md` or drop the inner background entirely (use `border-t border-border/40 pt-4 mt-4`) |

### 8.4 `react-question-grid.tsx`

| Fix | Detail |
|---|---|
| No card entrance animation | Stagger with CSS `@starting-style` + `animation-delay: calc(var(--index) * 40ms)`. Set `style={{ '--index': i }}` on each card. Keep stagger under 50ms/item |
| `transition-all` on filter buttons | `transition-colors duration-150, transition-transform duration-100` |
| Filter change has no orchestration | On `setActiveFilter`: wrap `filtered` in `AnimatePresence` with `mode="wait"`. Exit old cards (200ms), enter new cards staggered (40ms/item) |

### 8.5 `sandpack-file-tabs.tsx`

| Fix | Detail |
|---|---|
| Active tab: plain background swap | Use Emil's clip-path color transition: overlay layer on active tab, clip to tab width on change |
| Solution badge: just a text span | Add a lock icon (`IconLock`, 10px) before "Solution" text |
| No scale-on-press | `active:scale-[0.97] transition-transform duration-100` |

### 8.6 SRS grade cards in Review phase

| Fix | Detail |
|---|---|
| `transition-all duration-200` | `transition-colors duration-150, transition-transform duration-100, transition-shadow duration-150` |
| `hover:scale-[1.02]` | Change to `hover:scale-[1.01]` — less exaggerated for a selection card |
| Enter animation | Stagger the three grade cards: `animation-delay: 0ms / 80ms / 160ms` |

### 8.7 Global

| Fix | Detail |
|---|---|
| Font smoothing | Verify `-webkit-font-smoothing: antialiased` is on root layout (likely already there; confirm in `globals.css`) |
| `text-wrap: balance` on headings | Add to all `h1`/`h2` in React IDE and listing page |
| Image outlines | N/A (no images in IDE) |
| Minimum hit area | IDE icon buttons are `p-1.5` on `h-3.5 w-3.5` icons = ~28px. Add `min-h-8 min-w-8` to all icon-only buttons |

---

## 9. Content: 20 Questions

### 9.1 Questions to add (10 new, on top of existing 10)

The goal: cover the full interview question spectrum — foundational, architectural, tricky.

| ID | Title | Category | Difficulty | Why it's asked |
|---|---|---|---|---|
| `react-use-intersection` | `useIntersectionObserver` hook | hook | beginner | Lazy loading, infinite scroll, analytics — extremely common in production |
| `react-use-media-query` | `useMediaQuery` hook | hook | beginner | Responsive logic in hooks rather than CSS — tests understanding of window APIs |
| `react-controlled-form` | Controlled form with validation | component | intermediate | Every app has forms. Tests controlled inputs, validation state, submit handling |
| `react-context-theme` | Theme context + provider pattern | pattern | intermediate | Context API + custom hooks + TypeScript generics — a core architectural pattern |
| `react-portal-tooltip` | Portal-based tooltip | component | intermediate | Tests `createPortal`, z-index layering, ref-based positioning |
| `react-compound-select` | Compound component Select | pattern | advanced | Inversion of control — sharing implicit state via Context without prop drilling |
| `react-use-undo` | `useUndo` / `useRedo` hook | hook | advanced | Tricky state machine — tests reducer patterns, immutability, history management |
| `react-virtual-list` | Basic virtualised list | component | advanced | Performance interview staple — only render visible items, scroll position math |
| `react-optimistic-update` | Optimistic UI mutation | pattern | advanced | Modern async UI — update before server confirms, rollback on failure |
| `react-suspense-boundary` | Suspense + error boundary tree | pattern | advanced | React 18 concurrent features — tests understanding of Suspense + thrown promises |

### 9.2 Content requirements per question

Each question JSON must have:
- `prompt`: Clear statement of what to implement (required)
- `context`: Conceptual explanation shown in Read phase. **Required for intermediate/advanced**. 2–4 paragraphs covering: what this pattern is, when you'd use it, what the common pitfall is.
- `starterCode`: Genuinely incomplete. The challenge is real — the user must implement the key logic.
- `solutionCode`: Instructive. Includes comments explaining the non-obvious parts.
- `resources`: At least 2 links for intermediate/advanced questions (MDN, React docs, or a specific blog post). Empty array is acceptable for beginner questions.

### 9.3 Question 4 (existing — `react-use-fetch`) context

Currently has an empty `context` field. Add:

> **useFetch** is a custom hook that encapsulates the data-fetching lifecycle: loading, data, and error states. It's one of the first hooks you write in a real React project because `useEffect` + `fetch` has subtle bugs when written naively — particularly around **stale closures** and **race conditions** when the component unmounts before the fetch resolves.
>
> The critical pattern to understand is the **cleanup function** returned from `useEffect`. Without it, a slow network response can call `setState` on an unmounted component, causing a warning or silent state corruption. The canonical fix is an `aborted` flag or an `AbortController`.
>
> A production-grade `useFetch` also handles dependency arrays carefully — the URL is a dependency, so changing the URL triggers a new fetch and resets the loading state correctly.

(Apply similar context enrichment to any other existing questions with empty `context` fields.)

---

## 10. Security

Sandpack's execution model is safe by default:

1. The bundler runs inside a cross-origin `<iframe>` with the `sandbox` attribute
2. Executed code cannot access the host page's `window`, `document`, `localStorage`, or cookies
3. The iframe origin is `*.csb.io` (CodeSandbox CDN) — completely separate from the app origin
4. No `postMessage` communication is set up that would leak sensitive state

**No additional code changes needed.** This should be documented in a comment at the top of `react-ide-client.tsx` for future contributors.

---

## 11. Implementation Sequence

Execute in this order to avoid blocking dependencies:

### Step 1 — Commit the staged WIP (30 min)
Commit the already-staged conflict resolutions + stash improvements. Clean commit message: `fix(react-ide): resolve stash conflicts and apply Sandpack + CodeMirror perf improvements`

### Step 2 — Monaco bridge layer (2–3 hr)
- Create `SandpackMonacoEditor` component replacing `SandpackCodeMirrorEditor`
- Wire `useSandpack()` → `MonacoCodeEditor` for read/write
- Pass `projectFiles` for cross-file IntelliSense
- Test: edit one file, switch active file, verify Monaco syncs

### Step 3 — Native file tree (1 hr)
- Replace `CustomFileTree` + `SandpackFileTabs` with `SandpackFileExplorer` from `@codesandbox/sandpack-react`
- Style it to match Dark Forge (CSS overrides on `.sp-file-explorer` classes)
- OR keep custom `SandpackFileTabs` (it's simpler and already styled) + drop `CustomFileTree` specifically

### Step 4 — Read phase (3–4 hr)
- Update `ReactIDEPhase` type to include `'read'`
- Update `phase-tabs.tsx` (3 phases, new locking rules)
- Build `ReadPhase` component: left panel with Streamdown content, right panel with Shiki static preview
- Wire `"Start Building →"` CTA → `setPhase('build')`
- Default phase: `isAlreadyAttempted ? 'build' : 'read'`
- Remove the `<Dialog>` problem modal (entire block)
- Remove `isProblemModalOpen` state

### Step 5 — Solution read-only (1 hr)
- Pass `readOnly={viewMode === 'solution'}` through to `MonacoCodeEditor`
- Add amber banner component above editor when `readOnly`
- Add lock icons to `SandpackFileTabs` in solution mode
- Verify user code is preserved via `userFilesRef`

### Step 6 — Focus mode (2 hr)
- Add `'focused'` to `LayoutMode` type
- Add `useEffect` to toggle `ide-focused` CSS class on `<html>`
- Add `data-site-header` attribute to `SiteHeader`
- Add CSS rule in `globals.css`
- Add `IconMaximize` / `IconMinimize` to layout toggle group
- `Escape` key listener to exit focus mode

### Step 7 — 10 new questions (3–4 hr)
- Write JSON for 10 new questions (see §9.1 table)
- Add `context` to existing questions with empty fields (at minimum `react-use-fetch`)
- Update `content/generated/react/manifest.json` with new total count
- Run typecheck to verify schema compliance

### Step 8 — Design polish (2–3 hr)
Apply all fixes from §8 in sequence. Start with the most visible:
1. `phase-tabs.tsx` — 3 phases + clip-path color transition
2. Header — remove blur, fix chevron icon animation
3. `react-question-grid.tsx` — card stagger, filter animation
4. SRS grade cards — transition specificity, stagger on enter
5. Error boundary dark theme
6. Console error dot badge
7. Hit area fixes

### Step 9 — Loading state (30 min)
- Add `showLoadingScreen` to `SandpackPreview`
- Override `.sp-loading` CSS to match Dark Forge (`bg-void`, amber spinner)

### Step 10 — Tests + typecheck
- Update `react-ide-client.build-layout.test.tsx` for new 3-phase layout
- Add test for Read phase: renders concept text, "Start Building" advances to build
- Add test for solution read-only: `readOnly` prop is `true` when `viewMode === 'solution'`
- `bun run typecheck && bun run test` must pass

---

## 12. Design Decisions Summary

| Decision | Choice | Rationale |
|---|---|---|
| Runtime | Sandpack | Already working, correct feature set, sandboxed |
| Editor | Monaco (replacing CodeMirror in React IDE) | Already in bundle, `readOnly`, cross-file IntelliSense |
| File tree | Sandpack's `SandpackFileExplorer` | Native, no maintenance |
| Read phase | Inline 3-phase, remove modal | Matches what listing page promises users |
| Solution viewing | Read-only Monaco + amber banner | Clear visual differentiation, users can still copy |
| Maximize | Focus mode: hide SiteHeader, collapse file tree | Important controls stay visible |
| Pre-warming | `initMode: immediate` + Next.js prefetch | No custom infrastructure needed |
| Error surface | Console badge only | Let users investigate themselves |
| Content target | 20 questions for first merge to dev | Enough variety to feel real |
| Security | Sandpack iframe sandbox (default) | Already handled, document it |

---

## 13. Files Changed (Expected)

```
apps/web/components/react-ide/
  react-ide-client.tsx          — major: Read phase, focus mode, solution read-only, polish
  phase-tabs.tsx                — 3 phases, clip-path transition
  sandpack-file-tabs.tsx        — lock icon, clip-path active tab, scale-on-press
  sandpack-monaco-editor.tsx    — NEW: Monaco bridge layer
  custom-file-tree.tsx          — REMOVE (replaced by SandpackFileExplorer)
  react-question-grid.tsx       — card stagger, filter animation, transition specificity
  dark-forge-theme.ts           — no changes needed

apps/web/app/[locale]/react/
  page.tsx                      — minor: static code preview card
  [id]/page.tsx                 — no changes needed

apps/web/app/globals.css        — ide-focused CSS class
apps/web/lib/content/types.ts   — no changes (ReactQuestion already has context field)

content/generated/react/en/
  react-use-fetch.json          — add context field
  [10 new question files]

content/generated/react/manifest.json  — update totalQuestions to 20
```
