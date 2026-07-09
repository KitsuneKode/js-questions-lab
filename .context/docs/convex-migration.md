# Convex Migration Runbook

Companion to [product-audit-2026-07.md](./product-audit-2026-07.md).

## Current status (Phase 1 foundation)

| Artifact | Location | Status |
|----------|----------|--------|
| Schema | `apps/web/convex/schema.ts` | Ready |
| Clerk auth config | `apps/web/convex/auth.config.ts` | Ready (needs dashboard issuer) |
| Shared scoring re-exports | `apps/web/convex/lib/engagement.ts` | Ready |
| Live backend | Supabase | Still authoritative |
| Cutover | — | Not started |

## Bootstrap (local or cloud agent)

```bash
cd apps/web
# Cloud agents:
CONVEX_AGENT_MODE=anonymous bunx convex dev

# Configure env:
# CLERK_JWT_ISSUER_DOMAIN=https://<your-clerk-domain>
# NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud
```

## Phase checklist

### Phase 1 — Foundation (this PR)
- [x] Schema mirroring progress / XP / streaks / profiles
- [x] Clerk auth.config
- [x] Shared engagement imports (single XP source of truth)
- [ ] `convex dev` + codegen committed `_generated` (per environment)

### Phase 2 — Shadow writes
- [ ] `recordAttempt` Convex mutation dual-writes with Supabase
- [ ] Compare weekly/all-time leaderboard outputs in tests

### Phase 3 — Progress cutover
- [ ] Swap `fetchServerProgress` / `syncProgressToServer` to Convex
- [ ] One-time Supabase → Convex export script

### Phase 4 — Engagement cutover
- [ ] XP, streaks, leaderboard queries on Convex
- [ ] Drop `unstable_cache` leaderboard path

### Phase 5 — New features on Convex only
- [ ] Profiles UI, AI actions, interview sessions

### Phase 6 — Decommission Supabase
- [ ] Remove `@supabase/supabase-js`, migrations freeze

## Non-goals

- Question corpus / SSG routes
- Worker sandbox
- Guest localStorage until sign-in
