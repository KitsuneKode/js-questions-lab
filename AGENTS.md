# Agent Handoff

This repository is no longer just the upstream JavaScript questions source. It now contains a product app in `apps/web` plus a content pipeline in `scripts/` and `content/`.

## Source of Truth

**The canonical source is `content/source/README.upstream.md`** — synced directly from [Lydia Hallie's javascript-questions](https://github.com/lydiahallie/javascript-questions) repository. This file is the source of truth.

The content pipeline generates:

- `content/generated/questions.v1.json` — parsed question data
- `content/generated/manifest.v1.json` — metadata/index

All generated content derives from `README.upstream.md`. Do not edit generated files directly.

## Current Product State

- The app is an interactive JavaScript interview practice product built on Next.js 16 (App Router) and Tailwind CSS v4.
- Source content is parsed from `content/source/README.upstream.md` into generated JSON in `content/generated/`.
- Markdown content is rendered on the client securely using Vercel's `streamdown` for optimal streaming and rendering.
- The core flow is:
  - browse questions
  - answer in quiz mode
  - reveal explanation
  - run code
  - inspect event-loop visualization
- Runtime execution is entirely worker-based for all JavaScript snippets, mocking browser globals natively. StackBlitz has been fully removed.
- The scratchpad is a lazy-mounted bottom sheet for fast experiments. It should stay lightweight, feel secondary to the main question surface, and preserve the original snippet as the reset baseline when opened from a question.
- Local progress is the primary persistence layer. Clerk + Supabase are optional sync layers when configured.

## Validated Commands

Run these from the repository root:

- `bun run dev`
- `bun run build`
- `bun run start`
- `bun run lint`
- `bun run typecheck`
- `bun run parse:questions`
- `bun run sync:upstream`
- `bun run content:refresh`

These commands were recently verified:

- `bun run typecheck`
- `bun run lint`
- `bun run build`

## Important Files

- App shell: `apps/web/app/layout.tsx`
- Landing page: `apps/web/app/page.tsx`
- Questions list: `apps/web/app/questions/page.tsx`
- Question detail: `apps/web/app/questions/[id]/page.tsx`
- Runtime runner: `apps/web/lib/run/sandbox.ts`
- Scratchpad sheet: `apps/web/components/scratchpad/floating-scratchpad.tsx`
- Scratchpad state: `apps/web/components/scratchpad/scratchpad-context.tsx`
- Terminal formatting helper: `apps/web/lib/run/terminal.ts`
- Playground UI: `apps/web/components/code-playground.tsx`
- Progress store: `apps/web/lib/progress/progress-context.tsx`
- Dashboard hub: `apps/web/components/dashboard/dashboard-shell.tsx`
- Parser: `scripts/parse-readme.mjs`

## Context And Token Discipline

Use context deliberately. Do not load large or generated files unless the task truly needs them.

Read in this order:

1. `AGENTS.md`
2. `docs/agent-handoff.md`
3. `docs/rebuild-roadmap.md`
4. one focused implementation file based on the task

Load only when necessary:

- `docs/design-system-brief.md` for visual/product polish work
- `docs/next16-tailwind4-migration.md` for framework upgrade work
- `docs/principal-engineer-prompt.md` or `docs/continue-agent-prompt.md` when another agent needs a continuation brief

Avoid loading by default:

- `content/generated/questions.v1.json`
- `content/generated/manifest.v1.json`
- long generated build artifacts
- unrelated route files

Prefer:

- reading one page/component pair at a time
- reading type definitions before broad component trees
- summarizing findings instead of repeating file contents
- editing in focused passes instead of broad speculative rewrites

## Architectural Decisions Already Made

- Keep the product inside the repo under `apps/web`.
- Keep content generation at repo root for easy syncing and reuse.
- Worker-based execution is the exclusive runtime model for snippets.
- Do not treat `secure-exec` or Node polyfill stacks as the default browser runtime path. If a harder isolation model is needed later, build it as a separate server-side or host-managed execution path.
- StackBlitz has been removed to reduce bundle size and enforce practice focus.
- Guest mode remains fully usable without auth.
- Auth is treated as sync/identity, not as a requirement for basic learning.

## Things That Are Good Enough To Build On

- Parser and generated content pipeline are stable. Markdown is dynamically rendered on the client safely using `streamdown`.
- Root scripts are wired and working.
- Dashboard analytics and progress model exist and are usable.
- Question detail page operates as a focused split-pane workstation.
- Event loop visualization has a polished industrial/diagnostics aesthetic with a vertical call stack.
- App runs on Next 16 (Turbopack) and Tailwind v4, styled consistently without heavy generic dashboard bloat.

## Known Gaps / Next Priorities

- Adding richer context or external links into explanations where necessary, though this requires upstream PRs or a local overlay layer.
- Expanding offline capabilities or PWA features.
- Continuing to refine the code runner's AST parsing if even deeper concept visualizations are needed.
- Tightening worker completion behavior for promise-heavy snippets that launch async work without top-level `await`. If touching the runner, prefer idle/drain detection over patching broad Promise internals.

## Product Direction

Aim for:

- LeetCode feeling for JavaScript interviews
- Premium but restrained design
- Fast answer -> feedback -> retry loop
- Excellent mobile ergonomics
- Clear progress/review loop
- Strong explanation + visualization pairing

Avoid:

- Tooling sprawl
- Multiple competing runtime models
- Auth-first UX
- Generic AI-looking design

## Before You Make Major Changes

- Preserve the worker-first runtime unless there is a very strong reason to change it.
- Do not try to recreate a full Node.js runtime in the browser client. The product goal is fast, predictable interview-snippet execution, not Node parity.
- Keep root-level scripts working.
- Treat content pipeline integrity as non-negotiable.
- If migrating to Next 16 / Tailwind 4, do it as a coherent pass, not piecemeal.

## Read Next

- `docs/v2-roadmap-mastery.md` (New Roadmap for Advanced Interview Features)
- `docs/agent-handoff.md`
- `docs/rebuild-roadmap.md` (V1 Completed)
- `docs/design-system-brief.md`
- `docs/next16-tailwind4-migration.md`
- `docs/principal-engineer-prompt.md`
- `docs/continue-agent-prompt.md`
