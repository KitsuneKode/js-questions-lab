-- Add idempotency keys for XP events and persist authoritative XP totals.

ALTER TABLE public.xp_events
  ADD COLUMN IF NOT EXISTS submission_id TEXT,
  ADD COLUMN IF NOT EXISTS event_index INTEGER;

UPDATE public.xp_events
SET event_index = 0
WHERE event_index IS NULL;

ALTER TABLE public.xp_events
  ALTER COLUMN event_index SET DEFAULT 0,
  ALTER COLUMN event_index SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'xp_events_event_index_nonnegative'
  ) THEN
    ALTER TABLE public.xp_events
      ADD CONSTRAINT xp_events_event_index_nonnegative CHECK (event_index >= 0);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_events_idempotency
  ON public.xp_events (user_id, submission_id, event_index)
  WHERE submission_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.user_xp_totals (
  user_id TEXT PRIMARY KEY DEFAULT (auth.jwt()->>'sub'),
  total_xp BIGINT NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_xp_totals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'user_xp_totals' AND policyname = 'users can read own user_xp_totals'
  ) THEN
    CREATE POLICY "users can read own user_xp_totals"
      ON public.user_xp_totals FOR SELECT
      TO authenticated
      USING ((SELECT auth.jwt()->>'sub') = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'user_xp_totals' AND policyname = 'users can insert own user_xp_totals'
  ) THEN
    CREATE POLICY "users can insert own user_xp_totals"
      ON public.user_xp_totals FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'user_xp_totals' AND policyname = 'users can update own user_xp_totals'
  ) THEN
    CREATE POLICY "users can update own user_xp_totals"
      ON public.user_xp_totals FOR UPDATE
      TO authenticated
      USING ((SELECT auth.jwt()->>'sub') = user_id)
      WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);
  END IF;
END $$;

INSERT INTO public.user_xp_totals (user_id, total_xp, updated_at)
SELECT
  user_id,
  GREATEST(SUM(xp_delta), 0)::bigint AS total_xp,
  NOW() AS updated_at
FROM public.xp_events
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE
SET total_xp = EXCLUDED.total_xp,
    updated_at = EXCLUDED.updated_at;

CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard(p_limit integer DEFAULT 50)
RETURNS TABLE (
  "position" bigint,
  "rank" bigint,
  display_name text,
  total_xp bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE week_events AS (
    SELECT
      e.user_id,
      e.xp_delta,
      row_number() OVER (
        PARTITION BY e.user_id
        ORDER BY e.created_at, e.event_index, e.id
      ) AS rn
    FROM public.xp_events AS e
    WHERE e.created_at >= (date_trunc('week', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')
  ),
  running AS (
    SELECT
      user_id,
      rn,
      GREATEST(0, xp_delta)::bigint AS total_xp
    FROM week_events
    WHERE rn = 1
    UNION ALL
    SELECT
      e.user_id,
      e.rn,
      GREATEST(0, r.total_xp + e.xp_delta)::bigint AS total_xp
    FROM running AS r
    JOIN week_events AS e
      ON e.user_id = r.user_id
     AND e.rn = r.rn + 1
  ),
  totals AS (
    SELECT
      user_id,
      MAX(total_xp) AS total_xp
    FROM running
    GROUP BY user_id
  ),
  ranked AS (
    SELECT
      row_number() OVER (ORDER BY total_xp DESC, user_id ASC) AS position,
      rank() OVER (ORDER BY total_xp DESC) AS rank,
      total_xp
    FROM totals
  )
  SELECT
    ranked.position,
    ranked.rank,
    'Anonymous'::text AS display_name,
    ranked.total_xp
  FROM ranked
  ORDER BY ranked.position
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
$$;

CREATE OR REPLACE FUNCTION public.get_alltime_leaderboard(p_limit integer DEFAULT 50)
RETURNS TABLE (
  "position" bigint,
  "rank" bigint,
  display_name text,
  total_xp bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      row_number() OVER (ORDER BY total_xp DESC, user_id ASC) AS position,
      rank() OVER (ORDER BY total_xp DESC) AS rank,
      total_xp
    FROM public.user_xp_totals
  )
  SELECT
    ranked.position,
    ranked.rank,
    'Anonymous'::text AS display_name,
    ranked.total_xp
  FROM ranked
  ORDER BY ranked.position
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
$$;

CREATE OR REPLACE FUNCTION public.get_my_weekly_leaderboard_position()
RETURNS TABLE (
  "position" bigint,
  "rank" bigint,
  total_xp bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE viewer AS (
    SELECT COALESCE((SELECT auth.jwt()->>'sub'), '') AS user_id
  ),
  week_events AS (
    SELECT
      e.user_id,
      e.xp_delta,
      row_number() OVER (
        PARTITION BY e.user_id
        ORDER BY e.created_at, e.event_index, e.id
      ) AS rn
    FROM public.xp_events AS e
    WHERE e.created_at >= (date_trunc('week', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')
  ),
  running AS (
    SELECT
      user_id,
      rn,
      GREATEST(0, xp_delta)::bigint AS total_xp
    FROM week_events
    WHERE rn = 1
    UNION ALL
    SELECT
      e.user_id,
      e.rn,
      GREATEST(0, r.total_xp + e.xp_delta)::bigint AS total_xp
    FROM running AS r
    JOIN week_events AS e
      ON e.user_id = r.user_id
     AND e.rn = r.rn + 1
  ),
  totals AS (
    SELECT
      user_id,
      MAX(total_xp) AS total_xp
    FROM running
    GROUP BY user_id
  ),
  ranked AS (
    SELECT
      row_number() OVER (ORDER BY total_xp DESC, user_id ASC) AS position,
      rank() OVER (ORDER BY total_xp DESC) AS rank,
      user_id,
      total_xp
    FROM totals
  )
  SELECT
    ranked.position,
    ranked.rank,
    ranked.total_xp
  FROM ranked
  JOIN viewer ON viewer.user_id = ranked.user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_my_alltime_leaderboard_position()
RETURNS TABLE (
  "position" bigint,
  "rank" bigint,
  total_xp bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH viewer AS (
    SELECT COALESCE((SELECT auth.jwt()->>'sub'), '') AS user_id
  ),
  ranked AS (
    SELECT
      row_number() OVER (ORDER BY total_xp DESC, user_id ASC) AS position,
      rank() OVER (ORDER BY total_xp DESC) AS rank,
      user_id,
      total_xp
    FROM public.user_xp_totals
  )
  SELECT
    ranked.position,
    ranked.rank,
    ranked.total_xp
  FROM ranked
  JOIN viewer ON viewer.user_id = ranked.user_id;
$$;
