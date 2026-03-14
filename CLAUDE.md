# CLAUDE.md

Start with `AGENTS.md` and `docs/agent-handoff.md`.

## Short Context

- This repo contains both source content and the app product.
- `apps/web` is the product app.
- `scripts/` + `content/` are the content pipeline.
- The current runtime decision is worker-first execution for JS snippets.
- Guest mode must remain fully usable.
- Auth is optional sync, not a prerequisite.

## Minimal Reading Order

Keep context tight:

1. `AGENTS.md`
2. `docs/agent-handoff.md`
3. `docs/rebuild-roadmap.md`
4. only the files needed for the current task

Do not load generated JSON or large unrelated files unless the change requires them.

## Current Priority Order

1. Preserve working root scripts.
2. Keep the question flow coherent and fast.
3. Improve product polish and scalability.
4. Migrate to Next 16 + Tailwind 4 in a controlled pass.

## What Not To Reintroduce

- StackBlitz as the primary playground experience
- Fragile localStorage race conditions
- Auth-gated learning flow
- Generic dashboard patterns with no recommendation logic

## Main Handoff Docs

- `AGENTS.md`
- `docs/agent-handoff.md`
- `docs/rebuild-roadmap.md`
- `docs/design-system-brief.md`
- `docs/next16-tailwind4-migration.md`
- `docs/principal-engineer-prompt.md`
- `docs/continue-agent-prompt.md`
