# PRD: React Practice Platform + Platform-Wide Enhancements
**Status**: Draft v1.0  
**Date**: 2026-04-05  
**Author**: Product (via grill-me session)  
**Branch target**: `feat/react-platform`  
**Depends on**: `prd-engagement-pro.md` (XP + Leaderboard + Pro tier must ship first or in parallel)

---

## 1. Executive Summary

This PRD extends the platform from a JavaScript-only practice tool into a dual-discipline frontend interview preparation product: **JavaScript Fundamentals** + **React Practice**. It also ships three platform-wide improvements that benefit all users regardless of discipline: a Resources panel on every question, a Bookmarks filter on the questions library, and a Credits page update. The landing page is upgraded to introduce the React section with a premium bento-grid section using the Dark Forge design system.

---

## 2. Scope of Changes

| Area | Change type | Effort |
|---|---|---|
| React playground runtime | New feature | High |
| `/react` section + routing | New feature | High |
| React content pipeline | New feature | Medium |
| Read → Build → Review flow | New feature | Medium |
| Resources field (all questions) | Platform-wide enhancement | Low |
| Bookmarks filter chip | Bug/UX fix | Low |
| Landing page React section | Marketing/SEO | Medium |
| Credits page update | Polish | Low |
| `globals.css` color token bug | Bug fix | Done ✓ |

---

## 3. Bug Fix: Status Color Tokens (SHIPPED)

**Root cause**: `@theme` block in `globals.css` mapped `--color-success` and `--color-danger` but not `--color-status-correct` / `--color-status-wrong`. All components using `bg-status-correct/10`, `text-status-correct`, `border-status-wrong` etc. were silently emitting no styles — Tailwind v4 only generates utilities for tokens declared in `@theme`.

**Fix applied** in `apps/web/app/globals.css`:
```css
--color-status-correct: #22c55e;
--color-status-wrong: #ef4444;
```

**Affected components** (all now fixed without further changes):
- `landing-hero.tsx` — interactive demo answer selection
- `dashboard/recent-activity.tsx` — correct/incorrect answer icons
- `dashboard/bookmarked-list.tsx` — status dots
- `dashboard/overview-cards.tsx` — accuracy trend colors
- `dashboard/weakest-topics.tsx` — accuracy color warning
- `question-card.tsx` — difficulty badge colors

---

## 4. Platform-Wide: Resources Field

### 4.1 Purpose
Every question (JS and React) gets a curated reference panel — YouTube videos, blog posts, MDN docs, repo links. The field is empty by default; content is curated incrementally without blocking any feature.

### 4.2 Schema Extension

**Add to `QuestionRecord` type** (`apps/web/lib/content/types.ts`):
```ts
export interface QuestionResource {
  type: 'video' | 'blog' | 'docs' | 'repo';
  title: string;
  url: string;
  author?: string;
}

// Add to QuestionRecord:
resources?: QuestionResource[];
```

**Add to React question schema** (see Section 6.2):
```ts
resources?: QuestionResource[];
```

### 4.3 UI: Resources Panel

Rendered as a collapsible panel at the bottom of every question detail page (JS and React). Appears only when `resources.length > 0`.

```
┌─ References ──────────────────────────────────────────┐
│  ▶  [YouTube] "Closures in JS Explained" — Fireship   │
│  ✎  [Blog]    "Understanding Prototypes" — MDN        │
│  ⬡  [Docs]    MDN: Function.prototype                 │
│  ⊞  [Repo]    javascript-questions — Lydia Hallie     │
└───────────────────────────────────────────────────────┘
```

Icon per type: `IconBrandYoutube` (red), `IconArticle` (amber), `IconBook` (sky blue), `IconBrandGithub` (white). Opens in new tab. No tracking parameters added to URLs.

### 4.4 Content Pipeline Integration
- **JS questions**: Add `resources: []` to `content/generated/en/*.json` schema (no parser change required — manually curated via the JSON files or a future admin UI)
- **React questions**: Parsed from `sources/react-patterns/` MDX files — each pattern already links to related content in its frontmatter

---

## 5. Platform-Wide: Bookmarks Filter

### 5.1 Current state
`ProgressItem.bookmarked` exists in localStorage. The `FiltersBar` has no way to filter to bookmarked questions. Users can see their bookmarks only on the dashboard `BookmarkedList` component — they can't practice from them directly.

### 5.2 Implementation

**New URL param**: `?bookmarked=true`

**Filter chip**: Add a "Saved" chip to `FiltersBar`, positioned between the search bar and the tag filters. Uses `IconBookmark` icon.

```tsx
// Behaviour
const bookmarkedCount = useBookmarkedCount(); // reads localStorage progress
const isBookmarkFilter = scope.bookmarked === true;

// Disabled state: chip exists but greyed + cursor-not-allowed when bookmarkedCount === 0
// Active state: amber fill, same as other active filter chips
```

**Client-side application**: Bookmark state is local-first. Apply bookmark filter in `QuestionsClientWrapper` after `applyServerFilters`, using `useProgress()` to read the local bookmark list. This mirrors how `applyStatusFilter` works for answered/unanswered.

**Logged-in sync**: Bookmark state already syncs to Supabase via the existing progress sync. No new infrastructure needed.

**Schema change to `parseQuestionScope`** (`lib/content/query.ts`):
```ts
// Add to QuestionScope
bookmarked?: boolean;

// Add to parseQuestionScope
bookmarked: params.bookmarked === 'true' ? true : undefined,

// Add to buildQuestionScopeQuery
if (scope.bookmarked) params.set('bookmarked', 'true');
```

### 5.3 Zero-bookmark state
When `bookmarkedCount === 0`, chip renders as:
- Visible (not hidden) — discoverability
- Disabled with `title="Bookmark questions to filter here"`
- Amber icon, muted text, `cursor-not-allowed`

---

## 6. React Practice Platform

### 6.1 Route Architecture

```
/[locale]/react                   ← React question library (English content, locale UI strings only)
/[locale]/react/[id]              ← React question detail (3-phase IDE)
/[locale]/react/[id]/solution     ← Solution reveal (optional, or tab within detail)
```

**i18n note**: React question *content* (title, prompt, code) is English-only — no locale variants generated. UI chrome (buttons, labels, nav) still uses the existing `next-intl` system. `generateStaticParams` for React questions uses only the English content set, same as `content/generated/react/en/` — no per-locale content duplication.

**Static generation**: `export const dynamic = 'force-static'` — same SSG-first approach as JS questions. Sandpack loads client-side only, no server runtime needed.

### 6.2 React Question Schema

New type in `apps/web/lib/content/types.ts`:
```ts
export type ReactQuestionCategory = 'component' | 'hook' | 'pattern' | 'debug' | 'styling';

export interface ReactQuestion {
  id: string;                        // e.g. "react-001", "react-hooks-002"
  title: string;                     // "Build a useDebounce hook"
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];                    // ['hooks', 'state', 'closures']
  category: ReactQuestionCategory;
  prompt: string;                    // The task description (MDX-renderable string)
  context?: string;                  // Optional: conceptual explanation shown in READ phase
  starterCode: {                     // Multi-file Sandpack initial state
    [filename: string]: string;      // e.g. { 'App.tsx': '...', 'utils.ts': '...' }
  };
  entryFile: string;                 // Which file opens first, e.g. 'App.tsx'
  solutionCode: {                    // Hidden until user reveals
    [filename: string]: string;
  };
  previewVisible: boolean;           // Does this question render visible UI?
  sandpackTemplate: 'react' | 'react-ts'; // Sandpack template to use
  resources?: QuestionResource[];
  source?: {                         // Attribution
    repo: string;
    path: string;
    author: string;
    license: string;
  };
}
```

### 6.3 Runtime: Sandpack + Monaco Integration

**Package**: `@codesandbox/sandpack-react` (lazy-loaded, only on `/react/[id]` pages)

**Architecture**: Keep existing `MonacoCodeEditor` component as the editor. Wrap it in `SandpackProvider` to get the runtime benefits (module resolution, live preview, file system) without replacing the editor.

```tsx
// apps/web/components/react-ide/react-ide-client.tsx (new)
import { SandpackProvider, SandpackPreview, SandpackConsole } from '@codesandbox/sandpack-react';
import { MonacoCodeEditor } from '@/components/editor/monaco-code-editor';
import { useSandpack } from '@codesandbox/sandpack-react';

// SandpackProvider wraps everything
// MonacoCodeEditor reads/writes active file via useSandpack().sandpack
// SandpackPreview renders live component
// SandpackConsole captures console.log + runtime errors
```

**Why this works**: `SandpackProvider` exposes `useSandpack()` which gives `sandpack.files`, `sandpack.activeFile`, `sandpack.updateFile()`. Monaco reads from and writes to these — the Sandpack runtime picks up changes and hot-reloads the preview.

**Sandpack theme** (Dark Forge aligned):
```ts
const darkForgeTheme = {
  colors: {
    surface1: '#111113',    // --bg-surface
    surface2: '#1a1a1f',    // --bg-elevated
    surface3: '#0d0d12',    // --bg-code
    clickable: '#71717a',   // --text-tertiary
    base: '#fafafa',        // --text-primary
    disabled: '#3f3f46',    // --text-ghost
    hover: '#a1a1aa',       // --text-secondary
    accent: '#f59e0b',      // --accent-primary
    error: '#ef4444',       // --status-wrong
    errorSurface: '#1a0a0a',
  },
  syntax: {
    plain: '#fafafa',
    comment: { color: '#3f3f46', fontStyle: 'italic' },
    keyword: '#38bdf8',     // --code-accent
    tag: '#f59e0b',
    punctuation: '#71717a',
    definition: '#fafafa',
    property: '#38bdf8',
    static: '#22c55e',
    string: '#f59e0b',
  },
  font: {
    body: "Geist Sans, ui-sans-serif, system-ui",
    mono: "JetBrains Mono, Fira Code, ui-monospace",
    size: '14px',
    lineHeight: '1.6',
  },
};
```

**Node.js escalation path**: If a future question requires a real Node.js runtime (e.g., testing a server-side hook pattern), embed a StackBlitz `template: 'node'` iframe at that point only, not globally. This is an escape hatch, not the default.

### 6.4 React Question IDE Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Phase tabs: [READ]  [BUILD ●]  [REVIEW]        Difficulty badge │
├──────────────────────────────────────────────────────────────────┤
│  READ PHASE                                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Concept explanation (MDX rendered)                        │  │
│  │  Code example blocks (syntax highlighted, not editable)   │  │
│  │  "Ready to build →" button advances to BUILD phase        │  │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  BUILD PHASE                                                      │
│  ┌─────────────────────────┬──────────────────────────────────┐  │
│  │  File tabs              │  Live Preview                    │  │
│  │  [App.tsx] [utils.ts]   │  (SandpackPreview iframe)        │  │
│  ├─────────────────────────┤  Visible only if previewVisible  │  │
│  │                         ├──────────────────────────────────┤  │
│  │  Monaco Code Editor     │  Console                         │  │
│  │  (JSX/TSX, full         │  (SandpackConsole)               │  │
│  │   IntelliSense)         │  errors + console.log output     │  │
│  │                         │                                  │  │
│  └─────────────────────────┴──────────────────────────────────┘  │
│  [Mark as Done]  [I'm stuck — See Solution]                      │
├──────────────────────────────────────────────────────────────────┤
│  REVIEW PHASE                                                     │
│  SRS grading: [Hard]  [Got it]  [Easy]                           │
│  Pro: AI Answer Grader feedback panel                            │
│  [View Solution] → switches Sandpack files to solutionCode       │
│  Resources panel (if resources.length > 0)                       │
└──────────────────────────────────────────────────────────────────┘
```

### 6.5 Solution Reveal

Solution is stored in `solutionCode` (same multi-file map as `starterCode`). On "View Solution":
1. Sandpack `updateFile()` replaces each file with the solution version
2. A "Solution" badge appears in the file tab bar (amber, non-dismissable)
3. User can still edit the solution files (exploration encouraged)
4. SRS grade is locked to "Hard" if solution was viewed before attempting

No separate route for solutions. No new Sandpack embed. Single instance, file swap.

### 6.6 Progress Integration

React questions extend the existing `ProgressItem` store:
```ts
// No schema change needed — ProgressItem keys by question ID
// React question IDs are namespaced: "react-001", "react-hooks-002"
// bookmarked, attempts, srsData all work identically
// attempts for React questions: { selected: 'submitted' | 'viewed-solution', status, attemptedAt }
```

Supabase sync: the existing `user_progress` table stores by `question_id` (text). React question IDs slot in without schema changes.

XP awards: React questions feed into the XP system from `prd-engagement-pro.md`. `category: 'hook'` or `'pattern'` maps to difficulty-based XP.

---

## 7. React Content Pipeline

### 7.1 Source

**Primary**: `lydiahallie/javascript-react-patterns` (MIT licensed)  
Credit attribution per question via `source.repo` + `source.author` fields. Credit link rendered in the question footer and the Credits page.

**Structure of source**:
```
pages/
  design-patterns/
    container-presentational/
      index.mdx    ← concept explanation + JSX code blocks
    hoc/index.mdx
    render-props/index.mdx
    ...
  hooks/
    ...
  performance/
    ...
```

### 7.2 Parser: `scripts/parse-react-patterns.mjs`

New parser, same pipeline convention as `scripts/parse-readme.mjs`.

**Input**: `content/source/react-patterns/` (git submodule or snapshot)  
**Output**: `content/generated/react/en/` (JSON files, one per question)  
**Index**: `content/generated/react/manifest.json`

**Parsing steps**:
1. Walk MDX files in `pages/`
2. Extract: frontmatter title, path-derived category, first JSX/TSX code block → `starterCode`
3. If multiple code blocks: first = `starterCode`, last complete block = `solutionCode`
4. Generate `id` from path: `pages/hooks/use-fetch` → `react-hooks-use-fetch`
5. Derive `difficulty`: `design-patterns/*` → intermediate, `performance/*` → advanced, `hooks/use-*` basic → beginner
6. Detect `previewVisible`: true if code block renders JSX to DOM (has `return (`, has JSX tags)
7. Default `sandpackTemplate: 'react-ts'`
8. Default `resources: []`

**New script commands** (add to root `package.json`):
```json
"parse:react": "node scripts/parse-react-patterns.mjs",
"content:react": "bun run parse:react"
```

### 7.3 Content Loader Extension

**New file**: `apps/web/lib/content/react-loaders.ts`
```ts
export function getReactQuestions(): ReactQuestion[]
export function getReactQuestion(id: string): ReactQuestion | null
export function getReactManifest(): ReactQuestionsManifest
export function getReactDiscoveryIndex(): ReactDiscoveryItem[]
```

Same pattern as existing `apps/web/lib/content/loaders.ts`. Reads from `content/generated/react/en/`.

---

## 8. Landing Page: React Section

### 8.1 Placement
Second section on the homepage, directly below the existing JS hero, above the workflow sticky cards.

### 8.2 Design: Bento Grid with Dark Forge + Aceternity aesthetic

The section uses an asymmetric bento grid. Each cell is a dark card with subtle border glow, amber accent highlights, and micro-animations on scroll entry. No glassmorphism. No generic purple gradients.

**Section header**:
```
┌─────────────────────────────────────────────────────────────────┐
│  [NEW] badge in amber pill                                       │
│  "React Practice. Now Live."  (Instrument Serif, 56px)          │
│  "Build components. Debug hooks. Ship confidence."              │
│   (Geist Sans, 18px, text-secondary)                            │
└─────────────────────────────────────────────────────────────────┘
```

**Bento grid layout** (12-column, 3 rows):

```
┌──────────────────────────┬─────────────────┬──────────────────┐
│  CELL 1 (col-span-7)     │  CELL 2 (col 5) │                  │
│  Live Sandpack preview   │  Category stats │                  │
│  showing a real hook     │  Components     │                  │
│  question with code      │  Hooks          │                  │
│  editor + mini preview   │  Patterns       │                  │
│                          │  Debug          │                  │
├────────────┬─────────────┴─────────────────┤                  │
│  CELL 3    │  CELL 4 (col-span-5)          │                  │
│  col-span-4│  "Read → Build → Review"      │                  │
│  Streak /  │  3-step flow illustration     │                  │
│  XP hook   │  (animated step indicators)  │                  │
│  for React │                               │                  │
│  questions │                               │                  │
├────────────┴────────────────┬──────────────┘                  │
│  CELL 5 (col-span-8)        │  CELL 6 (col-span-4)            │
│  "Ship interview-ready      │  CTA card                       │
│   React skills"             │  [Start React Practice →]       │
│  Feature bullets            │  amber button, glow on hover    │
└─────────────────────────────┴─────────────────────────────────┘
```

**Cell 1 — Live Code Preview**: Static code snippet showing a React hook question (not a full Sandpack embed — too heavy for landing). Monaco-styled syntax highlighting with a mock preview pane beside it. Subtle typing animation using `motion/react` suggests interactivity.

**Cell 3 — Social proof hook**: "Join X developers practicing React daily" (once leaderboard is live, pull real count). Falls back to "Built for frontend engineers preparing for FAANG and beyond" before real data.

**Implementation note**: Use `frontend-design` and `emil-design-eng` skills during implementation of this section to ensure polish. The bento grid cards use `card-tilt.tsx` (already in the codebase) for the magnetic hover effect.

### 8.3 SEO
```html
<!-- Structured data additions on homepage -->
<meta name="description" content="Master JavaScript and React interview questions. Practice components, hooks, and patterns in a real editor. Spaced repetition, AI interviews, leaderboard." />
```

The React section H2 heading targets: "React interview practice", "build React components", "practice React hooks". No keyword stuffing — these are the literal headings of the section.

---

## 9. Credits Page Update

**File**: create or update `apps/web/app/[locale]/credits/page.tsx`

**New credits to add**:
- **Lydia Hallie** — `javascript-react-patterns` repo (MIT) — React patterns content source
- **CodeSandbox** — Sandpack — React runtime
- **Stream** — Video SDK — AI Interview Mode (when shipped)
- **ElevenLabs** — TTS — AI Interview Mode (when shipped)
- **Lemon Squeezy** — Payments (when shipped)

**Format**: Existing credits layout, add new cards in the same style. Link to each project's repo/site. Do not change layout structure.

---

## 10. Implementation Phases

### Phase A: Bug Fixes + Platform Plumbing (Week 1)
- [x] Fix `--color-status-correct` / `--color-status-wrong` in `globals.css` ← **DONE**
- [ ] Add `resources?: QuestionResource[]` to `QuestionRecord` type
- [ ] Add `bookmarked` URL param to `parseQuestionScope` + `buildQuestionScopeQuery`
- [ ] Add "Saved" filter chip to `FiltersBar` (client-side bookmark filter)
- [ ] Resources panel component (collapsible, icon per type, empty = hidden)
- [ ] Add Resources panel to JS question detail page

### Phase B: React Content Pipeline (Week 2)
- [ ] Copy/submodule `javascript-react-patterns` into `content/source/react-patterns/`
- [ ] `scripts/parse-react-patterns.mjs` — MDX → JSON pipeline
- [ ] `content/generated/react/en/` + `manifest.json` output
- [ ] `apps/web/lib/content/react-loaders.ts`
- [ ] `ReactQuestion` type in `apps/web/lib/content/types.ts`
- [ ] Add `parse:react` script to root `package.json`
- [ ] Validate: run parser, inspect 5 sample outputs

### Phase C: React IDE (Week 3–4)
- [ ] Install `@codesandbox/sandpack-react` (lazy-loaded)
- [ ] `darkForgeTheme` object (Sandpack theme tokens)
- [ ] `apps/web/components/react-ide/sandpack-file-tabs.tsx` — file tab bar reading `useSandpack()`
- [ ] `apps/web/components/react-ide/react-ide-client.tsx` — SandpackProvider + Monaco + Preview + Console layout
- [ ] Phase tabs component: READ / BUILD / REVIEW
- [ ] Solution reveal: `updateFile()` swap on "View Solution" click
- [ ] Progress integration: `markQuestionAnswered` for React questions
- [ ] SRS grading in REVIEW phase

### Phase D: React Routes (Week 4–5)
- [ ] `apps/web/app/[locale]/react/page.tsx` — React library page (SSG, English content only)
- [ ] `apps/web/app/[locale]/react/[id]/page.tsx` — React question detail
- [ ] `apps/web/app/[locale]/react/[id]/loading.tsx`
- [ ] `generateStaticParams` for React questions (English only, all locales share same content)
- [ ] Nav update: add "React" link to main navigation
- [ ] Metadata + OpenGraph for React pages (SEO)

### Phase E: Landing Page React Section (Week 5)
- [ ] `apps/web/components/react-practice-section.tsx` — bento grid section
- [ ] Static code preview card (Cell 1) — non-interactive, syntax highlighted
- [ ] Category stats cards (Cell 2)
- [ ] 3-phase flow illustration (Cell 4)
- [ ] CTA card (Cell 6) with amber glow button → `/react`
- [ ] Add section to `apps/web/app/[locale]/page.tsx` between hero and workflow
- [ ] SEO metadata updates on homepage
- [ ] Use `frontend-design` + `emil-design-eng` skills for final polish pass

### Phase F: Credits + Resources Content (Week 6 — ongoing)
- [ ] Credits page update with new attributions
- [ ] Begin curating `resources` arrays for first 20 JS questions (highest traffic)
- [ ] Curate resources for all parsed React questions from pattern source links

---

## 11. Technical Constraints & Decisions

### Sandpack bundle strategy
- Import path: `import dynamic from 'next/dynamic'` wrapping the entire React IDE
- `ssr: false` — Sandpack is client-only
- Lazy boundary sits at the route level (`react-ide-dynamic.tsx`, same pattern as existing `question-ide-dynamic.tsx`)
- Sandpack service worker: registered only on `/react/*` routes, not globally

### i18n boundary for React content
- `generateStaticParams` for React question pages: generate params for ALL locales but feed the same English content
- Translation keys for React UI chrome added to all locale JSON files under `namespace: 'react'`
- No translated question content — `getReactQuestion(id)` always reads from `content/generated/react/en/`

### ID namespace collision prevention
- JS question IDs: numeric strings (`"1"`, `"42"`)
- React question IDs: prefixed strings (`"react-001"`, `"react-hooks-use-fetch"`)
- No collision possible with current scheme

### Sandpack vs StackBlitz escalation rule (codified)
- Default runtime for React questions: **Sandpack** (local, fully themed, Monaco-compatible)
- Escalate to StackBlitz embed ONLY when a question explicitly requires: `template: 'node'` (server-side execution) or multi-process simulation
- This escalation is per-question via a flag: `runtimeOverride: 'stackblitz'` in `ReactQuestion`
- When `runtimeOverride` is set, render a StackBlitz iframe embed (`@stackblitz/sdk` `embedProject`) instead of the Sandpack IDE

---

## 12. Out of Scope (V1)

- TypeScript strict-mode type-checking in Sandpack editor (Monaco provides type hints, full strict checking deferred)
- Multiple test-case assertion runner (future: Vitest in Sandpack)
- React question localization (content stays English-only)
- Topic leaderboard for React (covered by global leaderboard from engagement PRD)
- AI-generated React questions (requires Claude integration on top of content pipeline)
- User-submitted questions or community content
- Mobile-optimized React IDE layout (responsive dashboard is V2)
