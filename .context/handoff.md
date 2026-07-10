---
updated: 2026-07-10T03:50:00Z
branch: cursor/trust-habit-sprint-360d
session_name: trust-habit-followups-convex-scaffold
context_pressure: low
---

# Session Handoff

## Done

### Trust + habit sprint (complete)
See prior handoff + `.context/docs/plans/2026-07-09-trust-habit-sprint.md`.

### Follow-ups (this session)
1. **Sign-in hydrate guard** — full guest merge only on false→true; subsequent mounts hydrate from server only (`wasSignedInForMergeRef` in `progress-context.tsx`).
2. **Leaderboard display name settings** — `normalizeDisplayName`, `fetchDisplayName` / `setDisplayName`, `DisplayNameForm` on `/dashboard`.
3. **Convex engagement scaffold (not wired)** — schema + progress/xp/streaks/leaderboard functions + migration plan. Supabase still live.

## Verification

- typecheck ✅
- test ✅ 195 passed
- lint ✅ (after auth.config fix)

## In Progress

- None in code. Convex activation needs human Convex project + Clerk integration.

## Blocked

- Full Convex cutover needs: Convex project, `bun run convex:dev`, Clerk Convex integration, `NEXT_PUBLIC_CONVEX_URL`, dual-write adapters.

## Next

1. Apply Supabase migration `20260710000000_leaderboard_display_name.sql` on staging/prod (still needed until Convex cutover).
2. Create Convex project → enable Clerk integration → set `CLERK_JWT_ISSUER_DOMAIN` → `bun run convex:dev`.
3. Phase 2 dual-write behind `ENGAGEMENT_BACKEND=supabase|convex` (see `.context/docs/plans/2026-07-10-supabase-to-convex.md`).

## Decisions

- Migrate **engagement only** to Convex; keep content SSG + guest localStorage + Clerk.
- Do not big-bang cutover — scaffold first, then feature-flag dual-write.
- Supabase free-tier pause is the driver; Convex free tier does not pause the same way.

## Key Files

- `apps/web/lib/progress/progress-context.tsx` — hydrate vs merge
- `apps/web/components/dashboard/display-name-form.tsx`
- `apps/web/lib/engagement/display-name.ts` + actions
- `convex/schema.ts`, `convex/progress.ts`, `convex/xp.ts`, `convex/streaks.ts`, `convex/leaderboard.ts`
- `.context/docs/plans/2026-07-10-supabase-to-convex.md`
- `apps/web/lib/backend/engagement-backend.ts` — feature flag stub
