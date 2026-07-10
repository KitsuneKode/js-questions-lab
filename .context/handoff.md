---
updated: 2026-07-10T02:45:00Z
branch: cursor/trust-habit-sprint-360d
session_name: trust-habit-sprint-complete
context_pressure: low
---

# Session Handoff

## Done

Trust + habit sprint (plan: `.context/docs/plans/2026-07-09-trust-habit-sprint.md`):

### Phase 1 — Guest → sign-in engagement sync
- `mergeStreakStates` (`apps/web/lib/streaks/merge.ts`)
- Guest attempt replay helpers (`apps/web/lib/engagement/guest-replay.ts`)
- `upsertStreak` + `replayGuestAttempts` (+ `answeredAt` forwarding, 200-cap)
- Sign-in effect: **replay before sync**, merge streaks, preserve guest SRS, clear guest session
- Integration test: `progress-context.sign-in.test.tsx`

### Phase 2 — Dashboard unification
- `computeOverallStats` accepts `streakState` override
- OverviewCards uses real XP levels + `questions.length` (no hardcoded 155 / fake level÷15)

### Phase 3 — Daily Review
- `countDueReviews` + ReviewBadge alignment
- `status=review` scope (`applyReviewFilter`)
- `/review` route + dashboard CTAs
- `srs_clear` +25 XP when due queue clears
- Self-grade emphasis in review mode

### Phase 4 — Leaderboard polish
- Migration: `display_name` on `user_xp_totals`, streak in RPCs
- Table shows streak + guest sign-up CTA

## Verification

- `bun run typecheck` — pass
- `bun run test` — 190 passed
- `bun run lint` — pass (warnings cleaned)
- `bun run build` — pass (includes `/[locale]/review`)

## In Progress

- None

## Blocked

- None

## Next

- Apply Supabase migration `20260710000000_leaderboard_display_name.sql` on staging/prod
- Optional follow-ups from reviews:
  - Sign-in transition guard (avoid redundant sync on every authenticated mount)
  - Settings UI to set `user_xp_totals.display_name`
  - Merge `/dashboard` + `/progress` IA
- Defer: Pro tier, AI interview, streak shield

## Decisions

- Replay guest attempts **before** `syncProgressToServer` to avoid duplicate attempt rows (`recordAttempt` appends)
- Server engine is authoritative for XP after replay (guest local totals may differ slightly)
- Review badge stays SRS-only; `/review` uses full `getReviewQueue` (SRS + legacy)
- `srs_clear` uses SRS-only due count in ProgressProvider (no question list in context)

## Key Files

- `apps/web/lib/progress/progress-context.tsx` — sign-in merge + srs_clear award
- `apps/web/lib/engagement/actions.ts` — replay/upsert/appendXPEvents
- `apps/web/lib/engagement/guest-replay.ts` — pure replay selection
- `apps/web/lib/streaks/merge.ts` — streak merge
- `apps/web/app/[locale]/(app)/review/page.tsx` — daily review entry
- `supabase/migrations/20260710000000_leaderboard_display_name.sql`

## Test Summary

- ~190 vitest tests passing
- New coverage: streak merge, guest replay, sign-in sync, overview cards, review start, srs_clear, leaderboard streaks
