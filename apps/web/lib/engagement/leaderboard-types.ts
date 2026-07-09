import { getLevelInfo } from '@/lib/xp/levels';

export interface LeaderboardEntry {
  position: number;
  displayName: string;
  totalXP: number;
  level: number;
  levelName: string;
  rank: number;
}

export interface CurrentUserRank {
  position: number;
  rank: number;
  totalXP: number;
  level: number;
  levelName: string;
}

export type LeaderboardFetchResult =
  | { ok: true; entries: LeaderboardEntry[] }
  | { ok: false; error: string; entries: [] };

export type CurrentUserRankResult =
  | { ok: true; rank: CurrentUserRank | null }
  | { ok: false; error: string; rank: null };

export interface LeaderboardRow {
  position: number;
  rank: number;
  display_name: string;
  total_xp: number;
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
    };
  });
}

export function currentUserRankToEntry(
  rank: CurrentUserRank,
  displayName: string,
): LeaderboardEntry {
  return {
    position: rank.position,
    displayName,
    totalXP: rank.totalXP,
    level: rank.level,
    levelName: rank.levelName,
    rank: rank.rank,
  };
}
