import { auth } from '@clerk/nextjs/server';
import { unstable_cache } from 'next/cache';
import {
  ALL_TIME_LEADERBOARD_CACHE_TAG,
  LEADERBOARD_CACHE_TAG,
  WEEKLY_LEADERBOARD_CACHE_TAG,
} from '@/lib/engagement/leaderboard-cache';
import {
  type LeaderboardEntry,
  type LeaderboardRow,
  toEntries,
} from '@/lib/engagement/leaderboard-shared';
import { createReadonlyServerSupabaseClient } from '@/lib/supabase/public-server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export type { LeaderboardEntry, LeaderboardRow } from '@/lib/engagement/leaderboard-shared';
export { getDisplayInitials, toEntries } from '@/lib/engagement/leaderboard-shared';

interface CurrentUserLeaderboardRow {
  position: number;
}

async function getCachedLeaderboard(
  rpc: 'get_weekly_leaderboard' | 'get_alltime_leaderboard',
  tag: string,
  limit: number,
): Promise<LeaderboardEntry[]> {
  return unstable_cache(
    async () => {
      const supabase = createReadonlyServerSupabaseClient();
      const { data, error } = await supabase.rpc(rpc, { p_limit: limit });

      if (error) {
        console.error(`Failed to fetch ${rpc}:`, error.message);
        return [];
      }

      if (!data) return [];
      return toEntries(data as LeaderboardRow[]);
    },
    ['leaderboard', rpc, String(limit)],
    {
      revalidate: 60,
      tags: [LEADERBOARD_CACHE_TAG, tag],
    },
  )();
}

export async function getWeeklyLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  return getCachedLeaderboard('get_weekly_leaderboard', WEEKLY_LEADERBOARD_CACHE_TAG, limit);
}

export async function getAllTimeLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  return getCachedLeaderboard('get_alltime_leaderboard', ALL_TIME_LEADERBOARD_CACHE_TAG, limit);
}

async function getCurrentUserLeaderboardPosition(
  rpc: 'get_my_weekly_leaderboard_position' | 'get_my_alltime_leaderboard_position',
): Promise<number | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc(rpc);

  if (error) {
    console.error(`Failed to fetch ${rpc}:`, error.message);
    return null;
  }

  return (data as CurrentUserLeaderboardRow[] | null)?.[0]?.position ?? null;
}

export async function getWeeklyCurrentUserPosition(): Promise<number | null> {
  return getCurrentUserLeaderboardPosition('get_my_weekly_leaderboard_position');
}

export async function getAllTimeCurrentUserPosition(): Promise<number | null> {
  return getCurrentUserLeaderboardPosition('get_my_alltime_leaderboard_position');
}
