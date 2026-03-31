# Agent Handoff

## Repository Shape

- `README.md`: project overview, setup, and docs map
- `CONTRIBUTING.md`: contributor workflow and PR expectations
- `docs/content-pipeline.md`: source-of-truth and generated-content rules
- `content/source/README.upstream.md`: local synced source copy
- `content/generated/*.json`: parsed structured content used by the app
- `scripts/parse-readme.mjs`: parser/generator
- `scripts/sync-upstream.mjs`: upstream sync
- `apps/web`: product app

## Current Status Snapshot

### Stable Enough To Build On

- Root scripts work from the repository root.
- The content pipeline is usable and produces generated JSON artifacts, rendering Markdown safely on the client via `streamdown`.
- The question list and question detail flows are in place.
- A worker-first JavaScript runtime handles snippet execution natively (including browser globals).
- The scratchpad now lives as a lazy-mounted bottom sheet instead of a blocking always-mounted tool surface.
- Local-first progress tracking is wired through the app.
- The dashboard has recommendation and review-oriented primitives instead of a purely decorative shell.
- The stack is migrated to Next 16 (Turbopack) and Tailwind CSS v4.

### Not Finished Yet

- The V1 Rebuild is complete (Next 16, Tailwind 4, Worker runtime, Streamdown).
- Phase 2 (SRS Backend via Supabase) is complete — see `docs/supabase-clerk-setup.md`.
- **Current focus: Phase 3 — Active Recall UX.**
  - "Type the Output" mode (hide A/B/C/D, user types expected console output)
  - Anki-style self-grading (Hard/Good/Easy) wired to SRS review dates
- Multi-source content pipeline (Phase 1 of v2 roadmap) comes after Active Recall.

### Completed (Track B - Supabase & Auth V2)

- ✅ Supabase database migrations created (`supabase/migrations/`)
- ✅ `user_progress` table with RLS policies for data isolation
- ✅ `user_srs_progress` table for optimized SRS queries
- ✅ Native Clerk third-party auth integration (JWT templates deprecated April 2025)
- ✅ Row Level Security enforced via `auth.uid()`
- ✅ Client-side sync with race condition handling and batching
- ✅ Guest mode support (localStorage only, no auth required)
- ✅ Sync status tracking and improved toast notifications
- See `docs/supabase-clerk-setup.md` for implementation details

## Current Technical State

### Working

- Root scripts work from repo root.
- Build succeeds.
- Typecheck succeeds.
- Lint succeeds (Biome).
- Content generation succeeds (raw Markdown preserved for streamdown).
- Question library, question detail, dashboard, auth shell, and credits page all render.

### Key Decisions Already Implemented

- Complete migration to Next 16 and Tailwind 4.
- Split-pane "workstation" layout implemented on the question detail page.
- Worker-first JavaScript runner in `apps/web/lib/run/sandbox.ts` mock browser globals.
- Added diagnostics-style event loop visualizer with physical spring animations and a vertical call stack.
- Browser execution should remain browser-native. `secure-exec` and Node-stdlib emulation are not the default product path for the client runner.
- StackBlitz has been removed to enforce the native execution model.
- Progress state centralized in `apps/web/lib/progress/progress-context.tsx`
- Dashboard upgraded into a practice hub with:
  - continue learning
  - next recommendation
  - review queue
  - weakest topics
  - bookmarks

### Current Root Commands

Run these from the repository root:

- `bun run dev`
- `bun run build`
- `bun run start`
- `bun run lint`
- `bun run typecheck`
- `bun run parse:questions`
- `bun run sync:upstream`
- `bun run content:refresh`

## UX/Product Intent

This product should feel like:

- JavaScript interview prep with LeetCode energy
- fast and clear, not bloated
- premium and tasteful, not flashy
- helpful for both quick practice sessions and longer learning loops
- focused on rapid answer -> feedback -> retry cycles

The strongest path through the product is:

1. discover a question quickly
2. answer it before seeing the explanation
3. inspect the explanation
4. run or tweak the snippet
5. visualize async/runtime behavior
6. return later through progress/review cues

## Where The Codebase Is Still Uneven

### Stack / Platform

- The platform is stable on Next 16 and Tailwind 4.
- Linting uses Biome.

### Runtime / Playground

- Worker runner is the primary environment.
- The product does not want a fake in-browser Node.js environment. Aim for lightweight worker execution with small browser-friendly shims only.
- If async snippets appear to "run but do nothing", investigate worker completion/drain logic first. Promise-heavy snippets that spawn background async work without top-level `await` are the current sharp edge.
- **Timer Support**: Both `setTimeout` and `setInterval` are supported. `setInterval` auto-clears after 50 iterations (with warning) to prevent infinite loops, and respects the 5-second worker timeout.
- The scratchpad should stay a quick bottom sheet for experimentation, not a second full IDE competing with the question screen.
- StackBlitz has been removed.
- **Visual Debugger**: Expression-level tracing via Babel AST transformation is now available. See `docs/specs/js-visualizer-enhancement.md` and `apps/web/components/visualization/visual-debugger.tsx`.

### Design

- The app features a premium, bespoke "Dark Forge" aesthetic targeting a split-pane workstation layout for practice.
- Uses `Instrument Serif` for editorial headings and `Geist` for body/mono.
- Leverages Framer Motion (`motion/react`) for physical spring animations, magnetic buttons, and 3D card tilts.
- Utilizes Shadcn UI primitives (like `<CommandDialog>` for CMD+K search and `<Sheet>` for the global Scratchpad).
- See `docs/ui-redesign-dark-forge.md` for complete aesthetic details and component implementation specifics.

### State / Data

- Local-first progress is the right default.
- Guest mode should remain first-class.
- Auth should continue to be optional enhancement for sync.

## Product Principles For The Next Agent

- Favor one strong learning workflow over multiple competing modes.
- Make progress feel earned and useful, not decorative.
- Keep the practice loop tight: prompt -> commit -> explain -> run -> review.
- Treat explanation clarity as a product feature, not just content rendering.
- Prefer fewer, better interactions over dashboard clutter.
- Preserve trust: fast UI, clear attribution, predictable behavior.

## Recommended Next Engineering Sequence

1. Implement Active Recall UX ("Type the Output" mode and Anki-style grading) on the existing detail page.
2. Extend Supabase Schema and wire up SRS (SM-2 Algorithm) for authenticated users.
3. Refactor the `scripts/parse-readme.mjs` into a multi-source ingest pipeline (Phase 1).
4. Introduce Curated Paths & Playlists on the Dashboard.
5. Build additional visualizers (Memory/Heap, Glossary tooltips, Interviewer's Notes) — Visual Debugger is complete.

## Open Decisions

- Should the dashboard become the signed-in home only, with the public landing page carrying more of the product narrative?

If making one of these calls, document the reasoning in the PR or handoff notes.

## Guardrails For Future Agents

- Do not collapse the app into generic dashboard aesthetics.
- Do not make auth mandatory.
- Do not lose root-level script ergonomics.
- Do not treat the upstream README as editable product content; the generated JSON is the app contract.
- Do not weaken the parser without adding validation.
- Do not replace worker execution with main-thread eval.
- Do not spend product time trying to force a full Node runtime into the browser client. If stronger isolation is needed, separate it from the default practice loop.

## Validation Checklist

Before handing off changes, run:

- `bun run typecheck`
- `bun run lint`
- `bun run build`
- `bun run parse:questions`

If changing content pipeline:

- verify generated JSON shape
- verify question count continuity
- verify question detail pages still render correctly

## Helpful Product Principles

- Bias for fast interaction loops.
- Keep explanations readable and code-focused.
- Make review and revisit behavior feel natural.
- Prefer one strong workflow over three mediocre ones.
- Every extra feature should strengthen practice, not distract from it.

## Useful Files To Read First

- `README.md`
- `AGENTS.md`
- `docs/content-pipeline.md`
- `CLAUDE.md`
- `apps/web/app/[locale]/questions/[id]/page.tsx`
- `apps/web/components/ide/question-ide-client.tsx`
- `apps/web/components/scratchpad/floating-scratchpad.tsx`

- `apps/web/components/code-playground.tsx`
- `apps/web/lib/run/sandbox.ts`
- `apps/web/lib/run/terminal.ts`
- `apps/web/lib/progress/progress-context.tsx`
