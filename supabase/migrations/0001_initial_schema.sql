-- Initial schema for user progress and SRS tracking
-- Clerk user IDs are strings (e.g. user_3Blv...), so user_id is TEXT (not UUID)
-- Uses auth.jwt()->>'sub' for Clerk third-party auth (not auth.uid() which is for Supabase native auth)

-- user_progress: stores quiz attempts, bookmarks, and SRS data
CREATE TABLE IF NOT EXISTS user_progress (
  user_id TEXT NOT NULL DEFAULT (auth.jwt()->>'sub'),
  question_id INTEGER NOT NULL,
  attempts JSONB NOT NULL DEFAULT '[]'::jsonb,
  bookmarked BOOLEAN NOT NULL DEFAULT false,
  srs_data JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_question_id ON user_progress(question_id);
CREATE INDEX idx_user_progress_srs_review ON user_progress(user_id, (srs_data->>'nextReview'))
  WHERE srs_data IS NOT NULL;

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies using auth.jwt()->>'sub' for Clerk third-party auth
CREATE POLICY user_access_own_progress ON user_progress FOR ALL
  TO authenticated
  USING (((SELECT auth.jwt()->>'sub') = user_id))
  WITH CHECK (((SELECT auth.jwt()->>'sub') = user_id));

COMMENT ON TABLE user_progress IS 'Stores user quiz attempts, bookmarks, and SRS data for JavaScript questions';

-- user_srs_progress: dedicated SRS tracking for optimized review queue queries
CREATE TABLE IF NOT EXISTS user_srs_progress (
  user_id TEXT NOT NULL DEFAULT (auth.jwt()->>'sub'),
  question_id INTEGER NOT NULL,
  interval INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  next_review TIMESTAMPTZ,
  last_reviewed TIMESTAMPTZ,
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX idx_user_srs_next_review ON user_srs_progress(user_id, next_review)
  WHERE next_review IS NOT NULL;

ALTER TABLE user_srs_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies using auth.jwt()->>'sub' for Clerk third-party auth
CREATE POLICY user_access_own_srs ON user_srs_progress FOR ALL
  TO authenticated
  USING (((SELECT auth.jwt()->>'sub') = user_id))
  WITH CHECK (((SELECT auth.jwt()->>'sub') = user_id));

COMMENT ON TABLE user_srs_progress IS 'Dedicated SRS tracking table for optimized review queue queries';
