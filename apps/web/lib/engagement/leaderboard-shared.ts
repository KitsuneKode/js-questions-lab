import { getLevelInfo } from '@/lib/xp/levels';

export interface LeaderboardEntry {
  position: number;
  displayName: string;
  totalXP: number;
  level: number;
  levelName: string;
  rank: number;
  /** Optional social fields — filled when the RPC payload includes them */
  streakDays?: number;
  isPro?: boolean;
  avatarUrl?: string | null;
}

export interface LeaderboardRow {
  position: number;
  rank: number;
  display_name: string;
  total_xp: number;
  current_streak?: number | null;
  is_pro?: boolean | null;
  avatar_url?: string | null;
}

export function getDisplayInitials(displayName: string): string {
  const cleaned = displayName.trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
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
      streakDays:
        typeof row.current_streak === 'number' && row.current_streak > 0
          ? row.current_streak
          : undefined,
      isPro: row.is_pro === true,
      avatarUrl: row.avatar_url ?? null,
    };
  });
}
