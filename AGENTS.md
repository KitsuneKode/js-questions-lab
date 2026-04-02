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
- **Supabase Integration**: Fully implemented with native Clerk third-party auth (not JWT templates — deprecated April 2025). Row Level Security enforces user isolation via `auth.uid()`. Tables: `user_progress`, `user_srs_progress`. Migrations in `supabase/migrations/`. See `docs/supabase-clerk-setup.md`.
- **i18n is fully implemented** for 6 pilot locales: `en`, `es`, `fr`, `de`, `ja`, `pt-BR`.
  - Routes are locale-prefixed (`/[locale]/...`). Root `/` redirects to `/en`.
  - `next-intl` powers translations. Message catalogs live in `apps/web/messages/`.
  - All client components use `useTranslations()`. All server pages use `getTranslations()`.
  - Missing locale questions fall back to English with a `isFallback: true` banner.
  - `SiteHeader` has a locale switcher powered by `switchLocalePath()`.

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

- `bun run typecheck` — passes with zero errors (2.4s)
- `bun run lint`
- `bun run build`
- `bun run parse:questions` — produces 6-locale JSON in `content/generated/locales/`

## Important Files

- Root layout: `apps/web/app/layout.tsx` (minimal shell — no providers)
- Locale layout: `apps/web/app/[locale]/layout.tsx` (NextIntlClientProvider + lang/dir injection)
- Landing page: `apps/web/app/[locale]/page.tsx`
- Questions list: `apps/web/app/[locale]/questions/page.tsx`
- Question detail: `apps/web/app/[locale]/questions/[id]/page.tsx`
- Credits page: `apps/web/app/[locale]/credits/page.tsx`
- Root redirect: `apps/web/app/page.tsx` (301 → `/en`)
- i18n config (app): `apps/web/lib/i18n/config.ts`
- i18n request config: `apps/web/i18n/request.ts`
- i18n routing: `apps/web/i18n/routing.ts`
- Locale path helpers: `apps/web/lib/locale-paths.ts`
- Message catalogs: `apps/web/messages/{en,es,fr,de,ja,pt-BR}.json`
- Content loaders (locale-aware): `apps/web/lib/content/loaders.ts`
- Runtime runner: `apps/web/lib/run/sandbox.ts`
- Scratchpad sheet: `apps/web/components/scratchpad/floating-scratchpad.tsx`
- Scratchpad state: `apps/web/components/scratchpad/scratchpad-context.tsx`
- Terminal formatting helper: `apps/web/lib/run/terminal.ts`
- Playground UI: `apps/web/components/code-playground.tsx`
- Progress store: `apps/web/lib/progress/progress-context.tsx`
- **Section progress store**: `apps/web/lib/progress/section-progress-store.ts` (Zustand + Zod)
- **Progress tracker**: `apps/web/components/section-progress-tracker.tsx`
- Dashboard hub: `apps/web/components/dashboard/dashboard-shell.tsx`
- Site header (locale switcher): `apps/web/components/site-header.tsx`
- Site footer (translated): `apps/web/components/site-footer.tsx`
- Landing hero (translated): `apps/web/components/landing-hero.tsx`
- Landing sections (translated): `apps/web/components/landing-sections.tsx`
- Parser: `scripts/parse-readme.mjs`
- **Multi-select filters**: `apps/web/components/filters-bar.tsx`
- **Content query helpers**: `apps/web/lib/content/query.ts`
- **SEO config**: `apps/web/lib/seo/config.ts`
- **JSON-LD components**: `apps/web/components/seo/site-json-ld.tsx`, `apps/web/components/seo/question-json-ld.tsx`
- **Robots/Sitemap**: `apps/web/app/robots.ts`, `apps/web/app/sitemap.ts`
- **LLM endpoints**: `apps/web/public/llms.txt`, `apps/web/app/llms-full.txt/route.ts`
- **Questions API**: `apps/web/app/api/questions/route.ts`, `apps/web/app/api/questions/[id]/route.ts`

## Context And Token Discipline

Use context deliberately. Do not load large or generated files unless the task truly needs them.

Read in this order:

1. `AGENTS.md`
2. `docs/agent-handoff.md`
3. `docs/v2-roadmap-mastery.md`
4. one focused implementation file based on the task

Load only when necessary:

- `docs/design-system-brief.md` for visual/product polish work
- `docs/supabase-clerk-setup.md` for auth/sync work
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
- **Visual Debugger** is production-ready with expression-level tracing, Babel AST transformation, and smooth animations.
- App runs on Next 16 (Turbopack) and Tailwind v4, styled consistently without heavy generic dashboard bloat.

## Known Gaps / Next Priorities

- Adding richer context or external links into explanations where necessary, though this requires upstream PRs or a local overlay layer.
- Expanding offline capabilities or PWA features.
- Continuing to refine the code runner's AST parsing if even deeper concept visualizations are needed.
- Tightening worker completion behavior for promise-heavy snippets that launch async work without top-level `await`. If touching the runner, prefer idle/drain detection over patching broad Promise internals.
- 9 pre-existing lint warnings (noArrayIndexKey in legacy components, noSvgWithoutTitle in dashboard icons, a11y in input-group/questions-results) — these predate i18n and should be addressed in a separate cleanup pass.

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
- Next 16 and Tailwind 4 migration is complete. Do not revert or partially roll back these upgrades.

## Branching & CI/CD Workflow

- All new work goes on a feature branch (`feat/`, `fix/`, `chore/` prefix).
- Open PRs targeting the `dev` branch first. CI runs typecheck, lint, and build.
- After `dev` is validated, merge to `main`.
- Never commit directly to `main` for feature or fix work.
- Hotfixes may use `hotfix/` branches targeting `main` directly if critical.

## Read Next

- `docs/v2-roadmap-mastery.md` (Active North Star — Phase 3 Active Recall is next)
- `docs/agent-handoff.md`
- `docs/design-system-brief.md`
- `docs/supabase-clerk-setup.md` (auth/sync setup and integration details)
- `docs/seo-llm-guide.md` (SEO and LLM optimization implementation)
- `docs/principal-engineer-prompt.md`
- `docs/continue-agent-prompt.md`
