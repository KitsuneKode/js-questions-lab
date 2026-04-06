import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getLevelInfo } from '@/lib/xp/levels';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  totalXP: number;
  level: number;
  levelName: string;
  rank: number;
}

interface LeaderboardRow {
  user_id: string;
  total_xp: number;
}

export async function getWeeklyLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('leaderboard_weekly')
    .select('user_id, total_xp')
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch weekly leaderboard:', error.message);
    return [];
  }

  if (!data) return [];
  return toEntries(data as LeaderboardRow[]);
}

export async function getAllTimeLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('leaderboard_alltime')
    .select('user_id, total_xp')
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch all-time leaderboard:', error.message);
    return [];
  }

  if (!data) return [];
  return toEntries(data as LeaderboardRow[]);
}

export function toEntries(rows: LeaderboardRow[]): LeaderboardEntry[] {
  const sortedRows = rows
    .slice()
    .sort((a, b) => b.total_xp - a.total_xp || a.user_id.localeCompare(b.user_id));

  return sortedRows.map((row, i) => {
    const level = getLevelInfo(row.total_xp);
    const previous = sortedRows[i - 1];
    const rank =
      previous && previous.total_xp === row.total_xp
        ? sortedRows.findIndex((entry) => entry.total_xp === row.total_xp) + 1
        : i + 1;
    return {
      userId: row.user_id,
      displayName: 'Anonymous',
      totalXP: Math.max(0, row.total_xp),
      level: level.level,
      levelName: level.name,
      rank,
    };
  });
}
