-- Weekly leaderboard must SUM xp_delta for the UTC week, not take the peak
-- of a running MAX. Align public rank with get_my_weekly_leaderboard_position.

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
  WITH totals AS (
    SELECT
      e.user_id,
      GREATEST(SUM(e.xp_delta), 0)::bigint AS total_xp
    FROM public.xp_events AS e
    WHERE e.created_at >= (date_trunc('week', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')
    GROUP BY e.user_id
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
  WITH viewer AS (
    SELECT COALESCE((SELECT auth.jwt()->>'sub'), '') AS user_id
  ),
  totals AS (
    SELECT
      xp.user_id,
      GREATEST(SUM(xp.xp_delta), 0)::bigint AS total_xp
    FROM public.xp_events AS xp
    WHERE xp.created_at >= (date_trunc('week', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')
    GROUP BY xp.user_id
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

COMMENT ON FUNCTION public.get_weekly_leaderboard(integer) IS
  'Weekly leaderboard from SUM(xp_delta) for the current UTC week, with display names and streaks.';

COMMENT ON FUNCTION public.get_my_weekly_leaderboard_position() IS
  'Authenticated viewer weekly rank using the same SUM(xp_delta) as get_weekly_leaderboard.';

REVOKE ALL ON FUNCTION public.get_weekly_leaderboard(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_weekly_leaderboard_position() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_weekly_leaderboard(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_weekly_leaderboard_position() TO authenticated;
