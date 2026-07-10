# Supabase → Convex Engagement Migration Plan

> **Branch:** `cursor/trust-habit-sprint-360d`  
> **Status:** Phase 1 (scaffold) — Convex files exist but are **not wired** to the app.

**Goal:** Move dynamic engagement data (progress sync, XP, streaks, leaderboard) off Supabase onto Convex so the product is not blocked by Supabase free-tier project pauses. Keep content SSG/static, guest-first localStorage, and Clerk auth unchanged.

---

## Recommendation

**Yes — migrate engagement to Convex.**

| Surface | Backend | Rationale |
|---------|---------|-----------|
| Question content, routes, SEO | Static / SSG (JSON on CDN) | Already optimal; no DB needed |
| Guest practice | `localStorage` | Guest-first; no account required |
| Auth / identity | Clerk | Already integrated; Convex supports Clerk JWT |
| Progress, XP, streaks, leaderboard | **Convex** (target) | Only dynamic DB surface; reactive queries; no pause risk |

Supabase remains the live backend until Phase 4 cutover. This PR delivers Phase 1 only.

---

## Tables to migrate

| Supabase | Convex | Notes |
|----------|--------|-------|
| `user_progress` | `userProgress` | `user_id` TEXT → `userId`; composite index `by_user_and_question` |
| `xp_events` | `xpEvents` | Idempotency via `(userId, submissionId, eventIndex)` |
| `user_streaks` | `userStreaks` | One row per user |
| `user_xp_totals` | `userXpTotals` | Includes `displayName`; all-time leaderboard source |

Clerk `user_...` id maps 1:1 to `userId` (same as current `user_id` TEXT).

---

## Auth

- **Clerk** via `convex/auth.config.ts` + future `ConvexProviderWithClerk` in `apps/web`.
- Convex identity `subject` = Clerk user id (`user_...`).
- `convex/lib/auth.ts` — `requireIdentity(ctx)` throws if unauthenticated; returns `{ userId }`.
- Set `CLERK_JWT_ISSUER_DOMAIN` in the **Convex dashboard** (e.g. `https://verb-noun-00.clerk.accounts.dev`), not in Next.js env.
- Enable Clerk ↔ Convex integration in Clerk dashboard (JWT template `applicationID: convex`).

---

## Leaderboard

Replace Supabase SQL RPCs with Convex queries:

| RPC (Supabase) | Convex function | Auth |
|----------------|-----------------|------|
| `get_weekly_leaderboard` | `leaderboard.weekly` | Public |
| `get_alltime_leaderboard` | `leaderboard.allTime` | Public |
| `get_my_weekly_leaderboard_position` | `leaderboard.myWeeklyPosition` | Required |
| `get_my_alltime_leaderboard_position` | `leaderboard.myAllTimePosition` | Required |

**Weekly window:** Monday 00:00 UTC → now. Caller passes `weekStartIso` (no `Date.now()` in queries).

**V1 weekly aggregation:** Collect `xpEvents` with `createdAt >= weekStartIso`, sum `xpDelta` per `userId` in TypeScript. Join `displayName` from `userXpTotals` and `currentStreak` from `userStreaks`. Cap `limit` at 100.

**All-time:** Sort `userXpTotals` by `totalXp` (index `by_total_xp`), join streak + display name.

**Future optimization:** Denormalized `weeklyXp` on `userXpTotals` or a `weeklyLeaderboard` aggregate table updated on each `appendEvents` mutation to avoid full-week event scans.

**SSG note:** Leaderboard page is already `force-dynamic`; guest path unchanged.

---

## Phased approach

### Phase 1 — Scaffold (this PR)

- [x] `convex/` schema + functions (`progress`, `xp`, `streaks`, `leaderboard`)
- [x] `convex/auth.config.ts`, `convex/README.md`
- [x] Root scripts: `convex:dev`, `convex:deploy`
- [x] `apps/web/.env.example` — `NEXT_PUBLIC_CONVEX_URL`
- [x] `apps/web/lib/backend/engagement-backend.ts` — `ENGAGEMENT_BACKEND` stub (not wired)
- [ ] **No** `ProgressProvider` / server action changes yet
- [ ] **No** `convex dev` / login in CI or cloud agent (scaffold files only)

### Phase 2 — Dual-write + feature flag

- Set `ENGAGEMENT_BACKEND=supabase|convex` (default `supabase`).
- Implement Convex adapters mirroring `apps/web/lib/progress/actions.ts` and `apps/web/lib/engagement/actions.ts`.
- Dual-write to both backends when flag is `convex` (or explicit `dual` mode) during validation.
- Add `ConvexProviderWithClerk` behind flag; keep Supabase client for fallback.

### Phase 3 — Backfill

- Script: read all rows from Supabase tables → Convex mutations (batch `upsertMany`, `appendEvents`, etc.).
- Verify counts, idempotency keys, and leaderboard parity on staging.
- Re-run idempotent backfill safe for partial failures.

### Phase 4 — Cutover reads

- Flip `ENGAGEMENT_BACKEND=convex` for reads first (writes already dual or convex-only).
- Monitor leaderboard, sign-in merge, XP replay.
- Remove Supabase reads from engagement paths.

### Phase 5 — Remove Supabase engagement

- Drop Supabase calls from progress/engagement actions.
- Keep `@supabase/supabase-js` until any remaining Supabase usage is gone.
- Archive or delete engagement migrations/views when confident.

---

## File map (Convex)

| File | Responsibility |
|------|----------------|
| `convex/schema.ts` | `userProgress`, `xpEvents`, `userStreaks`, `userXpTotals` |
| `convex/auth.config.ts` | Clerk JWT provider |
| `convex/lib/auth.ts` | `requireIdentity` |
| `convex/lib/validators.ts` | Shared arg/return validators |
| `convex/progress.ts` | `listMine`, `upsertOne`, `upsertMany` |
| `convex/xp.ts` | `listEvents`, `appendEvents`, `getTotals`, `setDisplayName`, `upsertTotals` |
| `convex/streaks.ts` | `getMine`, `upsertMine` |
| `convex/leaderboard.ts` | `weekly`, `allTime`, `myWeeklyPosition`, `myAllTimePosition` |
| `convex/README.md` | Activation steps |

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Supabase weekly RPC uses recursive running total with `GREATEST(0, …)` floor | V1 Convex sums `xpDelta` per week (documented difference); add running-total TS or denormalized field if parity gaps appear |
| Weekly leaderboard full-table scan on `xpEvents` | Acceptable at current scale; add `weeklyXp` denormalization in Phase 2+ |
| Dual-write drift | Idempotency keys on XP events; backfill verification script |
| Clerk JWT misconfiguration | Document `CLERK_JWT_ISSUER_DOMAIN` in Convex dashboard; test with `convex dev` locally |
| Cloud agents conflicting with dev deployment | Set `CONVEX_AGENT_MODE=anonymous` only for cloud coding agents, not local dev |

---

## Ops

- **Convex free tier** does not pause projects after inactivity (unlike Supabase free).
- **Local dev:** `bun run convex:dev` from repo root after `convex login` and project link.
- **Deploy:** `bun run convex:deploy` (production only, after CI green).
- **Cloud agents:** `CONVEX_AGENT_MODE=anonymous` in agent env — see `.cursor` Convex agent-mode rules.

---

## Activation checklist (post-merge)

1. Create Convex project at [convex.dev](https://convex.dev).
2. Clerk dashboard → enable Convex integration; note issuer domain.
3. Convex dashboard → set `CLERK_JWT_ISSUER_DOMAIN`.
4. `bun run convex:dev` — link project, generate `_generated/`.
5. Set `NEXT_PUBLIC_CONVEX_URL` in `apps/web/.env.local`.
6. Future PR: wire `ConvexProviderWithClerk` + `ENGAGEMENT_BACKEND` adapters.

---

## Out of scope (unchanged)

- Question content pipeline / SSG
- Guest localStorage-first UX
- Pro tier, AI interview, streak shield
- Removing Supabase package entirely (later)
