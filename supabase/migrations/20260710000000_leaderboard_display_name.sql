-- Leaderboard display names and streak column.

ALTER TABLE public.user_xp_totals
  ADD COLUMN IF NOT EXISTS display_name TEXT;

CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard(p_limit integer DEFAULT 50)
RETURNS TABLE (
  "position" bigint,
  "rank" bigint,
  display_name text,
  total_xp bigint,
  current_streak bigint
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
      user_id,
      row_number() OVER (ORDER BY total_xp DESC, user_id ASC) AS position,
      rank() OVER (ORDER BY total_xp DESC) AS rank,
      total_xp
    FROM totals
  )
  SELECT
    ranked.position,
    ranked.rank,
    COALESCE(NULLIF(t.display_name, ''), 'Anonymous')::text AS display_name,
    ranked.total_xp,
    COALESCE(s.current_streak, 0)::bigint AS current_streak
  FROM ranked
  LEFT JOIN public.user_xp_totals AS t ON t.user_id = ranked.user_id
  LEFT JOIN public.user_streaks AS s ON s.user_id = ranked.user_id
  ORDER BY ranked.position
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
$$;

CREATE OR REPLACE FUNCTION public.get_alltime_leaderboard(p_limit integer DEFAULT 50)
RETURNS TABLE (
  "position" bigint,
  "rank" bigint,
  display_name text,
  total_xp bigint,
  current_streak bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      user_id,
      row_number() OVER (ORDER BY total_xp DESC, user_id ASC) AS position,
      rank() OVER (ORDER BY total_xp DESC) AS rank,
      total_xp
    FROM public.user_xp_totals
  )
  SELECT
    ranked.position,
    ranked.rank,
    COALESCE(NULLIF(t.display_name, ''), 'Anonymous')::text AS display_name,
    ranked.total_xp,
    COALESCE(s.current_streak, 0)::bigint AS current_streak
  FROM ranked
  LEFT JOIN public.user_xp_totals AS t ON t.user_id = ranked.user_id
  LEFT JOIN public.user_streaks AS s ON s.user_id = ranked.user_id
  ORDER BY ranked.position
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
$$;

COMMENT ON FUNCTION public.get_weekly_leaderboard(integer) IS
  'Returns a sanitized weekly leaderboard with stable positions, tie ranks, display names, and streaks.';

COMMENT ON FUNCTION public.get_alltime_leaderboard(integer) IS
  'Returns a sanitized all-time leaderboard with stable positions, tie ranks, display names, and streaks.';

REVOKE ALL ON FUNCTION public.get_weekly_leaderboard(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_alltime_leaderboard(integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_weekly_leaderboard(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_alltime_leaderboard(integer) TO anon, authenticated;
