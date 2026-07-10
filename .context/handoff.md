---
updated: 2026-07-09T12:45:00Z
branch: cursor/product-audit-convex-leaderboard-2df2
session_name: product-audit-convex-leaderboard
context_pressure: low
---

# Session Handoff

## Done

- Full product audit: feedback/response storage, leaderboard, analytics, Convex migration
- Wrote `.context/docs/product-audit-2026-07.md` with prioritized roadmap

## In Progress

- None — audit doc only; implementation deferred to follow-up PRs

## Blocked

- None

## Next

- P0: AttemptRecord v2 + IDE hydrate + guest XP/SRS merge
- P0: Leaderboard identity, errors, sticky rank
- P2: Convex foundation (do before more Supabase PRD tables)

## Decisions

- Store rich responses (recall text, errorType, mode) — current boolean+option is too shallow
- Migrate authenticated sync to Convex before building profiles/AI on Supabase
- Keep SSG content + guest localStorage + worker sandbox out of Convex
- Knowledge graph = content-side concept map + derived mastery, not a graph DB

## Key Files

- `.context/docs/product-audit-2026-07.md` — full audit
- `apps/web/lib/progress/storage.ts` — AttemptRecord (needs v2)
- `apps/web/lib/engagement/leaderboard.ts` — silent empty on RPC error
- `apps/web/lib/engagement/actions.ts` — recordAttempt (signed-in only)
- `apps/web/lib/progress/progress-context.tsx` — guest clear without XP merge
- `.context/docs/prd-engagement-pro.md` — target engagement product

## Test Summary

- No code changes this session (docs only)
