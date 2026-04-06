-- Harden leaderboard access by replacing public views with explicit RPCs.
-- The leaderboard remains public, but only through sanitized, fixed-shape
-- functions instead of SECURITY DEFINER views that expose raw user ids.

DROP VIEW IF EXISTS public.leaderboard_weekly;
DROP VIEW IF EXISTS public.leaderboard_alltime;

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
  WITH totals AS (
    SELECT
      user_id,
      GREATEST(SUM(xp_delta), 0)::bigint AS total_xp
    FROM public.xp_events
    WHERE created_at >= (date_trunc('week', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')
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
  WITH totals AS (
    SELECT
      user_id,
      GREATEST(SUM(xp_delta), 0)::bigint AS total_xp
    FROM public.xp_events
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
  totals AS (
    SELECT
      xp.user_id,
      GREATEST(SUM(xp.xp_delta), 0)::bigint AS total_xp
    FROM public.xp_events AS xp
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
  'Returns a sanitized weekly leaderboard with stable positions and tie ranks.';

COMMENT ON FUNCTION public.get_alltime_leaderboard(integer) IS
  'Returns a sanitized all-time leaderboard with stable positions and tie ranks.';

COMMENT ON FUNCTION public.get_my_weekly_leaderboard_position() IS
  'Returns the authenticated user''s weekly leaderboard position without exposing other user ids.';

COMMENT ON FUNCTION public.get_my_alltime_leaderboard_position() IS
  'Returns the authenticated user''s all-time leaderboard position without exposing other user ids.';

REVOKE ALL ON FUNCTION public.get_weekly_leaderboard(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_alltime_leaderboard(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_weekly_leaderboard_position() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_alltime_leaderboard_position() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_weekly_leaderboard(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_alltime_leaderboard(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_weekly_leaderboard_position() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_alltime_leaderboard_position() TO authenticated;
