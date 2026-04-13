-- Engagement schema smoke test
-- Run after applying supabase/migrations/20260406000000_engagement_schema.sql.
-- Safe to run in Supabase SQL Editor or via psql: all writes are rolled back.

BEGIN;

SET LOCAL TIME ZONE 'UTC';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relname = 'xp_events' AND relkind = 'r'
  ) THEN
    RAISE EXCEPTION 'Missing table: xp_events';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relname = 'user_streaks' AND relkind = 'r'
  ) THEN
    RAISE EXCEPTION 'Missing table: user_streaks';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relname = 'leaderboard_weekly' AND relkind = 'v'
  ) THEN
    RAISE EXCEPTION 'Missing view: leaderboard_weekly';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relname = 'leaderboard_alltime' AND relkind = 'v'
  ) THEN
    RAISE EXCEPTION 'Missing view: leaderboard_alltime';
  END IF;
END
$$;

DO $$
DECLARE
  xp_user_default text;
  streak_user_default text;
  xp_rls_enabled boolean;
  streak_rls_enabled boolean;
BEGIN
  SELECT pg_get_expr(ad.adbin, ad.adrelid)
  INTO xp_user_default
  FROM pg_attrdef ad
  JOIN pg_attribute a
    ON a.attrelid = ad.adrelid
   AND a.attnum = ad.adnum
  JOIN pg_class c
    ON c.oid = ad.adrelid
  WHERE c.relname = 'xp_events'
    AND a.attname = 'user_id';

  IF xp_user_default IS NULL OR xp_user_default NOT LIKE '%auth.jwt()%sub%' THEN
    RAISE EXCEPTION 'xp_events.user_id default is not tied to Clerk subject: %', xp_user_default;
  END IF;

  SELECT pg_get_expr(ad.adbin, ad.adrelid)
  INTO streak_user_default
  FROM pg_attrdef ad
  JOIN pg_attribute a
    ON a.attrelid = ad.adrelid
   AND a.attnum = ad.adnum
  JOIN pg_class c
    ON c.oid = ad.adrelid
  WHERE c.relname = 'user_streaks'
    AND a.attname = 'user_id';

  IF streak_user_default IS NULL OR streak_user_default NOT LIKE '%auth.jwt()%sub%' THEN
    RAISE EXCEPTION 'user_streaks.user_id default is not tied to Clerk subject: %', streak_user_default;
  END IF;

  SELECT relrowsecurity
  INTO xp_rls_enabled
  FROM pg_class
  WHERE relname = 'xp_events';

  IF xp_rls_enabled IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'xp_events must have RLS enabled';
  END IF;

  SELECT relrowsecurity
  INTO streak_rls_enabled
  FROM pg_class
  WHERE relname = 'user_streaks';

  IF streak_rls_enabled IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'user_streaks must have RLS enabled';
  END IF;
END
$$;

DO $$
DECLARE
  missing_policy_count integer;
BEGIN
  SELECT COUNT(*)
  INTO missing_policy_count
  FROM (
    VALUES
      ('xp_events', 'users can read own xp_events', 'authenticated'),
      ('xp_events', 'users can insert own xp_events', 'authenticated'),
      ('user_streaks', 'users can read own user_streaks', 'authenticated'),
      ('user_streaks', 'users can insert own user_streaks', 'authenticated'),
      ('user_streaks', 'users can update own user_streaks', 'authenticated')
  ) AS expected(tablename, policyname, role_name)
  LEFT JOIN pg_policies p
    ON p.tablename = expected.tablename
   AND p.policyname = expected.policyname
   AND expected.role_name = ANY (p.roles)
  WHERE p.policyname IS NULL;

  IF missing_policy_count <> 0 THEN
    RAISE EXCEPTION 'Expected RLS policies are missing or not scoped to authenticated';
  END IF;
END
$$;

DO $$
DECLARE
  missing_index_count integer;
BEGIN
  SELECT COUNT(*)
  INTO missing_index_count
  FROM (
    VALUES
      ('idx_xp_events_user_created'),
      ('idx_xp_events_user_question_created')
  ) AS expected(indexname)
  LEFT JOIN pg_indexes i
    ON i.indexname = expected.indexname
  WHERE i.indexname IS NULL;

  IF missing_index_count <> 0 THEN
    RAISE EXCEPTION 'Expected engagement indexes are missing';
  END IF;
END
$$;

DO $$
DECLARE
  weekly_grant_count integer;
  alltime_grant_count integer;
BEGIN
  SELECT COUNT(*)
  INTO weekly_grant_count
  FROM information_schema.role_table_grants
  WHERE table_name = 'leaderboard_weekly'
    AND privilege_type = 'SELECT'
    AND grantee IN ('anon', 'authenticated');

  IF weekly_grant_count <> 2 THEN
    RAISE EXCEPTION 'leaderboard_weekly must grant SELECT to anon and authenticated';
  END IF;

  SELECT COUNT(*)
  INTO alltime_grant_count
  FROM information_schema.role_table_grants
  WHERE table_name = 'leaderboard_alltime'
    AND privilege_type = 'SELECT'
    AND grantee IN ('anon', 'authenticated');

  IF alltime_grant_count <> 2 THEN
    RAISE EXCEPTION 'leaderboard_alltime must grant SELECT to anon and authenticated';
  END IF;
END
$$;

DO $$
DECLARE
  week_start_utc timestamptz := (date_trunc('week', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC');
  weekly_total integer;
  weekly_event_count bigint;
  weekly_other_total integer;
  alltime_total integer;
BEGIN
  INSERT INTO xp_events (user_id, question_id, event_type, xp_delta, created_at)
  VALUES
    ('smoke_user_a', 101, 'correct', 10, week_start_utc - INTERVAL '1 second'),
    ('smoke_user_a', 101, 'precision_bonus', 2, week_start_utc + INTERVAL '1 second'),
    ('smoke_user_a', 101, 'streak_bonus', 3, week_start_utc + INTERVAL '2 seconds'),
    ('smoke_user_b', 102, 'correct', 20, week_start_utc + INTERVAL '3 seconds'),
    ('smoke_user_c', 103, 'wrong', 0, week_start_utc + INTERVAL '4 seconds');

  SELECT total_xp, event_count
  INTO weekly_total, weekly_event_count
  FROM leaderboard_weekly
  WHERE user_id = 'smoke_user_a';

  IF weekly_total <> 5 OR weekly_event_count <> 2 THEN
    RAISE EXCEPTION
      'leaderboard_weekly should include only current-week rows for smoke_user_a. got total %, count %',
      weekly_total,
      weekly_event_count;
  END IF;

  SELECT total_xp
  INTO weekly_other_total
  FROM leaderboard_weekly
  WHERE user_id = 'smoke_user_b';

  IF weekly_other_total <> 20 THEN
    RAISE EXCEPTION 'leaderboard_weekly total mismatch for smoke_user_b: %', weekly_other_total;
  END IF;

  SELECT total_xp
  INTO alltime_total
  FROM leaderboard_alltime
  WHERE user_id = 'smoke_user_a';

  IF alltime_total <> 15 THEN
    RAISE EXCEPTION 'leaderboard_alltime should include both before/after boundary rows: %', alltime_total;
  END IF;
END
$$;

DO $$
DECLARE
  streak_row user_streaks%ROWTYPE;
BEGIN
  INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, updated_at)
  VALUES ('smoke_user_a', 3, 5, CURRENT_DATE, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET current_streak = EXCLUDED.current_streak,
      longest_streak = EXCLUDED.longest_streak,
      last_activity_date = EXCLUDED.last_activity_date,
      updated_at = EXCLUDED.updated_at;

  INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, updated_at)
  VALUES ('smoke_user_a', 4, 5, CURRENT_DATE + 1, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET current_streak = EXCLUDED.current_streak,
      longest_streak = EXCLUDED.longest_streak,
      last_activity_date = EXCLUDED.last_activity_date,
      updated_at = EXCLUDED.updated_at;

  SELECT *
  INTO streak_row
  FROM user_streaks
  WHERE user_id = 'smoke_user_a';

  IF streak_row.current_streak <> 4 OR streak_row.longest_streak <> 5 THEN
    RAISE EXCEPTION 'user_streaks upsert failed: current %, longest %',
      streak_row.current_streak,
      streak_row.longest_streak;
  END IF;

  IF streak_row.last_activity_date <> CURRENT_DATE + 1 THEN
    RAISE EXCEPTION 'user_streaks last_activity_date mismatch: %', streak_row.last_activity_date;
  END IF;
END
$$;

SELECT 'Engagement schema smoke test passed.' AS result;

ROLLBACK;
