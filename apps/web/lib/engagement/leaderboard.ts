'use server';

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

  if (error || !data) return [];
  return toEntries(data as LeaderboardRow[]);
}

export async function getAllTimeLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('leaderboard_alltime')
    .select('user_id, total_xp')
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return toEntries(data as LeaderboardRow[]);
}

function toEntries(rows: LeaderboardRow[]): LeaderboardEntry[] {
  return rows.map((row, i) => {
    const level = getLevelInfo(row.total_xp);
    return {
      userId: row.user_id,
      // Display name: truncated user ID until we have a profiles table
      displayName: `user_${row.user_id.slice(-6)}`,
      totalXP: Math.max(0, row.total_xp),
      level: level.level,
      levelName: level.name,
      rank: i + 1,
    };
  });
}
