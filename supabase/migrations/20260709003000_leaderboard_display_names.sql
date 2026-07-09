-- Differentiate leaderboard rows without a profiles table.
-- Top 3: Anonymous #rank; everyone else: Learner #position.

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
    CASE
      WHEN ranked.rank <= 3 THEN 'Anonymous #' || ranked.rank::text
      ELSE 'Learner #' || ranked.position::text
    END AS display_name,
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
    CASE
      WHEN ranked.rank <= 3 THEN 'Anonymous #' || ranked.rank::text
      ELSE 'Learner #' || ranked.position::text
    END AS display_name,
    ranked.total_xp
  FROM ranked
  ORDER BY ranked.position
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
$$;
