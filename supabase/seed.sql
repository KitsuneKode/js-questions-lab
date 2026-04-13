-- ============================================================
-- Dev seed: engagement data for local leaderboard preview
-- Safe to re-run: uses INSERT ... ON CONFLICT DO NOTHING
-- All user_ids are prefixed "seed_" for easy identification
-- ============================================================

DO $$
DECLARE
  wk timestamptz := date_trunc('week', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN

  -- ── xp_events (this week) ─────────────────────────────────────────────
  INSERT INTO public.xp_events (user_id, question_id, event_type, xp_delta, created_at)
  VALUES
    -- #1 Distinguished (25k+ XP grinder)
    ('seed_user_1', 1,  'correct_hard',      35, wk + interval '1 hour'),
    ('seed_user_1', 1,  'precision_bonus',   10, wk + interval '1 hour 1 second'),
    ('seed_user_1', 2,  'correct_hard',      35, wk + interval '2 hours'),
    ('seed_user_1', 3,  'correct_medium',    20, wk + interval '3 hours'),
    ('seed_user_1', 4,  'streak_bonus',      15, wk + interval '4 hours'),
    ('seed_user_1', 5,  'correct_hard',      35, wk + interval '5 hours'),
    ('seed_user_1', 6,  'precision_bonus',   10, wk + interval '6 hours'),
    ('seed_user_1', 7,  'correct_medium',    20, wk + interval '7 hours'),
    ('seed_user_1', 8,  'correct_easy',      10, wk + interval '8 hours'),
    ('seed_user_1', 9,  'correct_hard',      35, wk + interval '9 hours'),
    ('seed_user_1', 10, 'streak_bonus',      15, wk + interval '10 hours'),
    -- #2 Principal
    ('seed_user_2', 11, 'correct_hard',      35, wk + interval '1 hour'),
    ('seed_user_2', 12, 'precision_bonus',   10, wk + interval '2 hours'),
    ('seed_user_2', 13, 'correct_medium',    20, wk + interval '3 hours'),
    ('seed_user_2', 14, 'correct_hard',      35, wk + interval '4 hours'),
    ('seed_user_2', 15, 'streak_bonus',      15, wk + interval '5 hours'),
    ('seed_user_2', 16, 'correct_medium',    20, wk + interval '6 hours'),
    ('seed_user_2', 17, 'correct_hard',      35, wk + interval '7 hours'),
    -- #3 Architect
    ('seed_user_3', 18, 'correct_hard',      35, wk + interval '2 hours'),
    ('seed_user_3', 19, 'correct_medium',    20, wk + interval '3 hours'),
    ('seed_user_3', 20, 'precision_bonus',   10, wk + interval '4 hours'),
    ('seed_user_3', 21, 'streak_bonus',      15, wk + interval '5 hours'),
    ('seed_user_3', 22, 'correct_hard',      35, wk + interval '6 hours'),
    ('seed_user_3', 23, 'correct_easy',      10, wk + interval '7 hours'),
    -- #4 Engineer
    ('seed_user_4', 24, 'correct_medium',    20, wk + interval '1 hour'),
    ('seed_user_4', 25, 'correct_hard',      35, wk + interval '2 hours'),
    ('seed_user_4', 26, 'streak_bonus',      15, wk + interval '3 hours'),
    ('seed_user_4', 27, 'correct_medium',    20, wk + interval '5 hours'),
    -- #5 Practitioner
    ('seed_user_5', 28, 'correct_easy',      10, wk + interval '1 hour'),
    ('seed_user_5', 29, 'correct_medium',    20, wk + interval '2 hours'),
    ('seed_user_5', 30, 'streak_bonus',      15, wk + interval '3 hours'),
    ('seed_user_5', 31, 'correct_easy',      10, wk + interval '4 hours'),
    -- #6
    ('seed_user_6', 32, 'correct_easy',      10, wk + interval '1 hour'),
    ('seed_user_6', 33, 'correct_medium',    20, wk + interval '3 hours'),
    ('seed_user_6', 34, 'wrong',              0, wk + interval '4 hours'),
    -- #7
    ('seed_user_7', 35, 'correct_easy',      10, wk + interval '2 hours'),
    ('seed_user_7', 36, 'correct_easy',      10, wk + interval '5 hours'),
    -- #8 tie with #7
    ('seed_user_8', 37, 'correct_easy',      10, wk + interval '3 hours'),
    ('seed_user_8', 38, 'correct_easy',      10, wk + interval '6 hours'),
    -- #9
    ('seed_user_9', 39, 'correct_easy',      10, wk + interval '4 hours'),
    -- #10
    ('seed_user_10', 40, 'correct_easy',     10, wk + interval '8 hours')
  ON CONFLICT DO NOTHING;

  -- ── historic XP (all-time board) ──────────────────────────────────────
  INSERT INTO public.xp_events (user_id, question_id, event_type, xp_delta, created_at)
  VALUES
    ('seed_user_1', 99,  'correct_hard',   1500, wk - interval '30 days'),
    ('seed_user_2', 98,  'correct_hard',    900, wk - interval '20 days'),
    ('seed_user_3', 97,  'correct_medium',  600, wk - interval '15 days'),
    ('seed_user_4', 96,  'correct_medium',  320, wk - interval '10 days'),
    ('seed_user_5', 95,  'correct_easy',    150, wk - interval '7 days'),
    ('seed_user_6', 94,  'correct_easy',     80, wk - interval '5 days'),
    ('seed_user_7', 93,  'correct_easy',     45, wk - interval '3 days'),
    ('seed_user_8', 92,  'correct_easy',     45, wk - interval '2 days'),
    ('seed_user_9', 91,  'correct_easy',     20, wk - interval '1 day'),
    ('seed_user_10', 90, 'correct_easy',     10, wk - interval '12 hours')
  ON CONFLICT DO NOTHING;

  -- ── user_streaks ───────────────────────────────────────────────────────
  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_activity_date, updated_at)
  VALUES
    ('seed_user_1',  42, 60, CURRENT_DATE, NOW()),
    ('seed_user_2',  21, 30, CURRENT_DATE, NOW()),
    ('seed_user_3',  14, 20, CURRENT_DATE, NOW()),
    ('seed_user_4',   7, 10, CURRENT_DATE, NOW()),
    ('seed_user_5',   3,  5, CURRENT_DATE, NOW()),
    ('seed_user_6',   2,  4, CURRENT_DATE, NOW()),
    ('seed_user_7',   1,  2, CURRENT_DATE, NOW()),
    ('seed_user_8',   1,  1, CURRENT_DATE, NOW()),
    ('seed_user_9',   0,  1, CURRENT_DATE, NOW()),
    ('seed_user_10',  0,  0, CURRENT_DATE, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET current_streak    = EXCLUDED.current_streak,
        longest_streak    = EXCLUDED.longest_streak,
        last_activity_date = EXCLUDED.last_activity_date,
        updated_at        = EXCLUDED.updated_at;

END $$;
