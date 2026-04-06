-- Engagement schema: XP events, user streaks, and leaderboard view
-- Clerk user IDs are strings (e.g. user_3Blv...), so user_id is TEXT (not UUID)
-- Uses auth.jwt()->>'sub' for Clerk third-party auth (not auth.uid() which is for Supabase native auth)

-- ---------------------------------------------------------------------------
-- xp_events: append-only log of every XP-affecting action
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS xp_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT        NOT NULL,
  question_id  INTEGER     NOT NULL,
  event_type   TEXT        NOT NULL
                             CHECK (event_type IN (
                               'correct',
                               'wrong',
                               'precision_bonus',
                               'streak_bonus',
                               'mastery_cap',
                               'cooldown',
                               'srs_clear'
                             )),
  xp_delta     INTEGER     NOT NULL,
  metadata     JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- General per-user timeline index (leaderboard / profile queries)
CREATE INDEX idx_xp_events_user_created
  ON xp_events (user_id, created_at DESC);

-- Per-question cooldown check index
CREATE INDEX idx_xp_events_user_question_created
  ON xp_events (user_id, question_id, created_at DESC);

ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own xp_events"
  ON xp_events FOR SELECT
  USING ((SELECT auth.jwt()->>'sub') = user_id);

CREATE POLICY "users can insert own xp_events"
  ON xp_events FOR INSERT
  WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);

COMMENT ON TABLE xp_events IS
  'Append-only log of XP-affecting events for engagement engine (correct, wrong, bonuses, caps)';

-- ---------------------------------------------------------------------------
-- user_streaks: current and longest daily streak per user
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id            TEXT        PRIMARY KEY,
  current_streak     INTEGER     NOT NULL DEFAULT 0,
  longest_streak     INTEGER     NOT NULL DEFAULT 0,
  last_activity_date DATE,
  shield_used_at     TIMESTAMPTZ,            -- Pro streak shield; NULL when unused
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own user_streaks"
  ON user_streaks FOR SELECT
  USING ((SELECT auth.jwt()->>'sub') = user_id);

CREATE POLICY "users can insert own user_streaks"
  ON user_streaks FOR INSERT
  WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);

CREATE POLICY "users can update own user_streaks"
  ON user_streaks FOR UPDATE
  USING ((SELECT auth.jwt()->>'sub') = user_id)
  WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);

COMMENT ON TABLE user_streaks IS
  'Tracks current/longest daily streaks per user; shield_used_at supports Pro streak-shield feature';

-- ---------------------------------------------------------------------------
-- leaderboard_weekly / leaderboard_alltime: public-readable views
-- Weekly window: current ISO week (Mon 00:00 UTC → now)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW leaderboard_weekly AS
  SELECT
    user_id,
    SUM(xp_delta)  AS total_xp,
    COUNT(*)       AS event_count
  FROM xp_events
  WHERE created_at >= date_trunc('week', NOW() AT TIME ZONE 'UTC')
  GROUP BY user_id
  ORDER BY total_xp DESC;

COMMENT ON VIEW leaderboard_weekly IS
  'Weekly XP leaderboard: sums xp_delta since last Monday 00:00 UTC, ordered by XP descending';

CREATE OR REPLACE VIEW leaderboard_alltime AS
  SELECT
    user_id,
    SUM(xp_delta)  AS total_xp,
    COUNT(*)       AS event_count
  FROM xp_events
  GROUP BY user_id
  ORDER BY total_xp DESC;

COMMENT ON VIEW leaderboard_alltime IS
  'All-time XP leaderboard: sums all xp_delta per user, ordered by XP descending';

-- Grant public read access to leaderboard views (no RLS on views; access is positional)
GRANT SELECT ON leaderboard_weekly  TO anon, authenticated;
GRANT SELECT ON leaderboard_alltime TO anon, authenticated;
