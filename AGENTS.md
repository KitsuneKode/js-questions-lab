# Agent Handoff

This repository is no longer just the upstream JavaScript questions source. It now contains a product app in `apps/web` plus a content pipeline in `scripts/` and `content/`.

## Current Product State

- The app is an interactive JavaScript interview practice product built on Next.js App Router.
- Source content is parsed from `content/source/README.upstream.md` into generated JSON in `content/generated/`.
- The core flow is:
  - browse questions
  - answer in quiz mode
  - reveal explanation
  - run code
  - inspect event-loop visualization
- Runtime execution is now worker-first for plain JavaScript snippets.
- StackBlitz is still present, but only as an optional full-sandbox escape hatch for module syntax or browser-global snippets.
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
- Prefer worker-based execution over embedded online sandboxes.
- Treat StackBlitz as secondary, not primary UX.
- Keep guest mode fully usable without auth.
- Treat auth as sync/identity, not as a requirement for basic learning.

## Things That Are Good Enough To Build On

- Parser and generated content pipeline are stable enough for iteration.
- Root scripts are wired and working.
- Dashboard analytics and progress model exist and are usable.
- Question detail page already has the right conceptual flow.

## Known Gaps / Next Priorities

- The stack is still on Next 15 + Tailwind 3. A controlled migration to Next 16 + Tailwind 4 is still pending.
- `@stackblitz/sdk` still exists in dependencies and can be removed after deciding whether external sandbox support stays.
- ESLint currently runs through `.eslintrc` compatibility mode. That is acceptable short-term, but should be migrated to a modern flat config during the Next 16 pass.
- The question detail page still has a fairly heavy client bundle and should be tightened after the runtime and upgrade work settle.
- Design quality is improved, but the product still needs a stronger “JS LeetCode” feel on the detail page and dashboard.

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
- Keep root-level scripts working.
- Treat content pipeline integrity as non-negotiable.
- If migrating to Next 16 / Tailwind 4, do it as a coherent pass, not piecemeal.

## Read Next

- `docs/agent-handoff.md`
- `docs/rebuild-roadmap.md`
- `docs/design-system-brief.md`
- `docs/next16-tailwind4-migration.md`
- `docs/principal-engineer-prompt.md`
- `docs/continue-agent-prompt.md`
