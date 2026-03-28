# Agent Handoff

## Repository Shape

- `README.md`: upstream source material from Lydia Hallie
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
- The focus is now shifting to **V2: Interview Mastery**.
- We need to implement Active Recall ("Type the Output" mode) to replace passive multiple-choice guessing.
- A Spaced Repetition System (SRS) backend via Supabase needs to be wired up.
- The content pipeline needs refactoring to support multi-source data ingestion (e.g., from Sudheer J's JS interview questions repo) into unified "Paths".

## Current Technical State

### Working

- Root scripts work from repo root.
- Build succeeds.
- Typecheck succeeds.
- Lint succeeds (ESLint Flat Config active).
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
- Linting uses flat config.

### Runtime / Playground

- Worker runner is the primary environment.
- The product does not want a fake in-browser Node.js environment. Aim for lightweight worker execution with small browser-friendly shims only.
- If async snippets appear to "run but do nothing", investigate worker completion/drain logic first. Promise-heavy snippets that spawn background async work without top-level `await` are the current sharp edge.
- The scratchpad should stay a quick bottom sheet for experimentation, not a second full IDE competing with the question screen.
- StackBlitz has been removed.
- Future work may involve building AST representations or more complex data visualizers.

### Design

- The app feels premium, with a split-pane workstation layout for practice.
- Future iterations might add themes or more tailored visualization animations.

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
5. Build advanced concept visualizers (Memory / Call Stack) for specific tags.

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

- `AGENTS.md`
- `CLAUDE.md`
- `apps/web/app/questions/[id]/page.tsx`
- `apps/web/components/ide/question-ide-client.tsx`
- `apps/web/components/scratchpad/floating-scratchpad.tsx`
- `apps/web/components/question-client-shell.tsx`
- `apps/web/components/code-playground.tsx`
- `apps/web/lib/run/sandbox.ts`
- `apps/web/lib/run/terminal.ts`
- `apps/web/lib/progress/progress-context.tsx`
