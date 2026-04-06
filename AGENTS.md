# AGENTS.md (System Architecture & Topology)

This repository is no longer just the upstream JavaScript questions source. It contains a product app in `apps/web` plus a content pipeline in `scripts/` and `content/`.

## Validated Commands

Run these from the repository root:

- `bun run dev`
- `bun run build`
- `bun run typecheck`
- `bun run test`
- `bun run lint`
- `bun run parse:questions`
- `bun run sync:upstream`
- `bun run content:refresh`

## Testing Expectations

- Add or update automated tests whenever a notable feature, bug fix, or regression-prone behavior is introduced.
- Prefer `apps/web/lib/__tests__/` for logic and storage coverage, and `apps/web/components/__tests__/` for UI/component behavior.
- Changes are not ready to merge until CI can verify them with `bun run typecheck` and `bun run test`.

## Important Files & Topology

- **Product App**: `apps/web/`
  - Root layout: `apps/web/app/layout.tsx` (minimal shell)
  - Locale layout: `apps/web/app/[locale]/layout.tsx` (NextIntlClientProvider)
  - Question detail: `apps/web/app/[locale]/questions/[id]/page.tsx`
  - i18n routing: `apps/web/i18n/routing.ts`
  - Dashboard hub: `apps/web/components/dashboard/dashboard-shell.tsx`
  - Runtime runner: `apps/web/lib/run/sandbox.ts`
  - Progress store: `apps/web/lib/progress/progress-context.tsx`
- **Content Generation**: `scripts/` & `content/`
  - Parser: `scripts/parse-readme.mjs`
  - Upstream Markdown: `content/source/README.upstream.md`
  - Generated JSON: `content/generated/`

## Domain-Specific AI Rules

If you are working on specific domains, **you must read the relevant guide first**:

- **Authentication & Database Sync**: Read `.context/docs/auth-sync.md`
- **Content Generation Pipeline**: Read `.context/docs/content-pipeline.md`
- **Question Discovery, Filters & Progress**: Read `.context/docs/question-discovery.md`
- **Product Direction & Learning Roadmap**: Read `.context/docs/learning-roadmap.md`
- **Visual Debugger / AST Execution**: Read `.context/docs/visual-debugger.md`
- **SEO & Structured Data**: Read `.context/docs/seo-llm.md`
- **Engagement Engine, XP, Leaderboard, Pro Tier & AI Interview**: Read `.context/docs/prd-engagement-pro.md`
- **React Practice Platform, Resources, Bookmarks Filter & Landing Upgrade**: Read `.context/docs/prd-react-platform.md`
- **UI/UX & Styling Guidelines**: Read `.context/docs/design-system.md`

## Architectural Decisions Already Made

- Keep the product inside the repo under `apps/web`.
- Worker-based execution is the exclusive runtime model for snippets. Do not try to recreate a full Node.js runtime in the browser client.
- StackBlitz has been removed to reduce bundle size and enforce practice focus.
- Auth is treated as sync/identity (Guest-first UX), not as a requirement for basic learning. Supabase uses native Clerk third-party auth (no JWT templates).
- Next 16 and Tailwind 4 migration is complete. The application is completely Statically Generated (SSG).

## Branching & CI/CD Workflow

- All new work goes on a feature branch (`feat/`, `fix/`, `chore/` prefix).
- **All upstream changes and PRs must target the `dev` branch.**
- We use `dev` as our staging environment and primary source of work.
- After changes are made, reviewed, and validated in `dev`, they are merged into `main`.
- The main website is deployed directly from the `main` branch.
- Never commit directly to `main` for feature or fix work.
- **After every dev→main merge PR**, run `git checkout dev && git merge origin/main && git push origin dev` to pull the merge commit back into `dev`. GitHub's merge commit lands only on `main`, leaving `dev` 1 commit behind — this re-sync keeps the branches aligned.
