import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { unstable_cache } from 'next/cache';
import {
  ALL_TIME_LEADERBOARD_CACHE_TAG,
  LEADERBOARD_CACHE_TAG,
  WEEKLY_LEADERBOARD_CACHE_TAG,
} from '@/lib/engagement/leaderboard-cache';
import {
  type CurrentUserRankResult,
  type LeaderboardFetchResult,
  type LeaderboardRow,
  toEntries,
} from '@/lib/engagement/leaderboard-types';
import { createReadonlyServerSupabaseClient } from '@/lib/supabase/public-server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getLevelInfo } from '@/lib/xp/levels';

export type {
  CurrentUserRank,
  CurrentUserRankResult,
  LeaderboardEntry,
  LeaderboardFetchResult,
} from '@/lib/engagement/leaderboard-types';
export { currentUserRankToEntry, toEntries } from '@/lib/engagement/leaderboard-types';

interface CurrentUserLeaderboardRow {
  position: number;
  rank: number;
  total_xp: number;
}

async function fetchLeaderboardRows(
  rpc: 'get_weekly_leaderboard' | 'get_alltime_leaderboard',
  limit: number,
): Promise<LeaderboardRow[]> {
  const supabase = createReadonlyServerSupabaseClient();
  const { data, error } = await supabase.rpc(rpc, { p_limit: limit });

  if (error) {
    throw new Error(error.message);
  }

  return (data as LeaderboardRow[] | null) ?? [];
}

async function getCachedLeaderboard(
  rpc: 'get_weekly_leaderboard' | 'get_alltime_leaderboard',
  tag: string,
  limit: number,
): Promise<LeaderboardFetchResult> {
  try {
    // Only successful payloads are cached — thrown errors bypass the cache.
    const rows = await unstable_cache(
      () => fetchLeaderboardRows(rpc, limit),
      ['leaderboard', rpc, String(limit)],
      {
        revalidate: 60,
        tags: [LEADERBOARD_CACHE_TAG, tag],
      },
    )();

    return { ok: true, entries: toEntries(rows) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown leaderboard error';
    console.error(`Failed to fetch ${rpc}:`, message);
    return { ok: false, error: message, entries: [] };
  }
}

export async function getWeeklyLeaderboard(limit = 50): Promise<LeaderboardFetchResult> {
  return getCachedLeaderboard('get_weekly_leaderboard', WEEKLY_LEADERBOARD_CACHE_TAG, limit);
}

export async function getAllTimeLeaderboard(limit = 50): Promise<LeaderboardFetchResult> {
  return getCachedLeaderboard('get_alltime_leaderboard', ALL_TIME_LEADERBOARD_CACHE_TAG, limit);
}

async function getCurrentUserLeaderboardRank(
  rpc: 'get_my_weekly_leaderboard_position' | 'get_my_alltime_leaderboard_position',
): Promise<CurrentUserRankResult> {
  const { userId } = await auth();
  if (!userId) return { ok: true, rank: null };

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.rpc(rpc);

    if (error) {
      console.error(`Failed to fetch ${rpc}:`, error.message);
      return { ok: false, error: error.message, rank: null };
    }

    const row = (data as CurrentUserLeaderboardRow[] | null)?.[0];
    if (!row) return { ok: true, rank: null };

    const level = getLevelInfo(row.total_xp);
    return {
      ok: true,
      rank: {
        position: row.position,
        rank: row.rank,
        totalXP: Math.max(0, row.total_xp),
        level: level.level,
        levelName: level.name,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown rank error';
    console.error(`Failed to fetch ${rpc}:`, message);
    return { ok: false, error: message, rank: null };
  }
}

export async function getWeeklyCurrentUserRank(): Promise<CurrentUserRankResult> {
  return getCurrentUserLeaderboardRank('get_my_weekly_leaderboard_position');
}

export async function getAllTimeCurrentUserRank(): Promise<CurrentUserRankResult> {
  return getCurrentUserLeaderboardRank('get_my_alltime_leaderboard_position');
}

/** @deprecated Prefer getWeeklyCurrentUserRank */
export async function getWeeklyCurrentUserPosition(): Promise<number | null> {
  const result = await getWeeklyCurrentUserRank();
  return result.ok ? (result.rank?.position ?? null) : null;
}

/** @deprecated Prefer getAllTimeCurrentUserRank */
export async function getAllTimeCurrentUserPosition(): Promise<number | null> {
  const result = await getAllTimeCurrentUserRank();
  return result.ok ? (result.rank?.position ?? null) : null;
}
