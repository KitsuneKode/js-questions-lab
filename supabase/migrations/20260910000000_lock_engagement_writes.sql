-- Lock engagement scoring writes to the service role.
-- Authenticated clients may still SELECT their own rows.
-- Leaderboard RPCs are SECURITY DEFINER and are unchanged.

ALTER TABLE public.xp_events
  DROP CONSTRAINT IF EXISTS xp_events_xp_delta_bounds;

ALTER TABLE public.xp_events
  ADD CONSTRAINT xp_events_xp_delta_bounds CHECK (xp_delta BETWEEN -50 AND 50);

DROP POLICY IF EXISTS "users can insert own xp_events" ON public.xp_events;
DROP POLICY IF EXISTS "users can insert own user_xp_totals" ON public.user_xp_totals;
DROP POLICY IF EXISTS "users can update own user_xp_totals" ON public.user_xp_totals;
DROP POLICY IF EXISTS "users can insert own user_streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "users can update own user_streaks" ON public.user_streaks;

REVOKE INSERT, UPDATE, DELETE ON public.xp_events FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_xp_totals FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_streaks FROM authenticated, anon;
