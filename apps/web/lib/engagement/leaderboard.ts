import { auth } from '@clerk/nextjs/server';
import { unstable_cache } from 'next/cache';
import {
  ALL_TIME_LEADERBOARD_CACHE_TAG,
  LEADERBOARD_CACHE_TAG,
  WEEKLY_LEADERBOARD_CACHE_TAG,
} from '@/lib/engagement/leaderboard-cache';
import { createReadonlyServerSupabaseClient } from '@/lib/supabase/public-server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getLevelInfo } from '@/lib/xp/levels';

export interface LeaderboardEntry {
  position: number;
  displayName: string;
  totalXP: number;
  level: number;
  levelName: string;
  rank: number;
  currentStreak: number;
  isPro: boolean;
}

interface LeaderboardRow {
  position: number;
  rank: number;
  display_name: string;
  total_xp: number;
  current_streak?: number | null;
  is_pro?: boolean | null;
}

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

export function toEntries(rows: LeaderboardRow[]): LeaderboardEntry[] {
  return rows.map((row) => {
    const level = getLevelInfo(row.total_xp);

    return {
      position: row.position,
      displayName: row.display_name,
      totalXP: Math.max(0, row.total_xp),
      level: level.level,
      levelName: level.name,
      rank: row.rank,
      currentStreak: row.current_streak ?? 0,
      isPro: row.is_pro ?? false,
    };
  });
}
