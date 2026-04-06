# Supabase Verification

This folder contains repeatable checks for the engagement schema and its app-facing integrations.

## Files

- `engagement_smoke_test.sql`
  Verifies the `xp_events` and `user_streaks` tables, leaderboard views, indexes, grants, and UTC weekly boundary logic. It inserts seeded rows inside a transaction and ends with `ROLLBACK`, so it does not leave residue behind.

## Recommended Verification Flow

1. Apply the migration in [20260406000000_engagement_schema.sql](/home/kitsunekode/Projects/lydia-js-questions/supabase/migrations/20260406000000_engagement_schema.sql).
2. Run `engagement_smoke_test.sql` in Supabase SQL Editor or with `psql`.
3. Smoke-test the app while signed in:
   - answer one question correctly
   - answer one question incorrectly
   - self-grade a recall question
   - revisit the leaderboard page
4. Confirm the backing tables/views reflect the app behavior:
   - `xp_events` contains server-computed events
   - `user_streaks` updates once per day as expected
   - `leaderboard_weekly` excludes rows before Monday `00:00 UTC`
   - `leaderboard_alltime` includes the full history

## Manual App Checks

- Signed-in attempt flow:
  Submit an answer while logged in and confirm the row written to `xp_events` matches the server-computed outcome, not a browser-provided delta.
- Signed-in streak flow:
  Answer on the same day twice and confirm `current_streak` does not increment twice.
- Sign-in rehydration:
  Refresh while signed in and confirm XP/streak badges reflect server state.
- Leaderboard:
  Verify tied users get stable ordering and anonymous fallback names instead of leaked auth-id fragments.

## What This SQL Script Does Not Cover

- Real authenticated RLS enforcement with Clerk session tokens.
- End-to-end Next.js server-action wiring.
- Lemon Squeezy or Pro-plan behavior.

Those still need an app-level smoke test with a real signed-in session.
