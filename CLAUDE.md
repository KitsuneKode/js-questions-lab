# CLAUDE.md

Start with `AGENTS.md` and `docs/agent-handoff.md`.

## Short Context

- This repo contains both source content and the app product.
- `apps/web` is the product app (Next.js 16, Tailwind v4, React 19).
- `scripts/` + `content/` are the content pipeline.
- The current runtime decision is worker-first execution for JS snippets.
- Guest mode must remain fully usable.
- Auth (Clerk) is optional sync, not a prerequisite.
- Supabase sync uses native Clerk third-party auth — no JWT templates.

## Minimal Reading Order

Keep context tight:

1. `AGENTS.md`
2. `docs/agent-handoff.md`
3. `docs/v2-roadmap-mastery.md` ← active north star
4. Only the files needed for the current task

Do not load generated JSON or large unrelated files unless the change requires them.

## Current Priority Order

1. Preserve working root scripts.
2. Keep the question flow coherent and fast.
3. **Active Recall UX (Phase 3)** — "Type the Output" mode + Anki-style self-grading.
4. Multi-source content pipeline (Phase 1 of v2 roadmap).

## Branching & CI/CD Workflow

- All new work goes on a feature branch (`feat/`, `fix/`, `chore/` prefix).
- Open PRs targeting `dev` branch first (CI runs typecheck + lint + build).
- Merge to `main` only after `dev` is validated and tested.
- Never commit directly to `main` for feature work.

## What Not To Reintroduce

- StackBlitz as the primary playground experience
- Fragile localStorage race conditions
- Auth-gated learning flow
- Generic dashboard patterns with no recommendation logic
- JWT template approach for Supabase (deprecated April 2025)

## Main Handoff Docs

- `AGENTS.md`
- `docs/agent-handoff.md`
- `docs/v2-roadmap-mastery.md`
- `docs/design-system-brief.md`
- `docs/supabase-clerk-setup.md` ← load for auth/sync work
- `docs/principal-engineer-prompt.md`
- `docs/continue-agent-prompt.md`
