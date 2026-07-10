import type { Doc } from '../_generated/dataModel';

export interface LeaderboardRow {
  userId: string;
  totalXp: number;
}

export interface RankedLeaderboardRow extends LeaderboardRow {
  position: number;
  rank: number;
}

export function clampLeaderboardLimit(limit: number): number {
  return Math.min(Math.max(limit, 1), 100);
}

export function sumWeeklyXpByUser(
  events: Array<Pick<Doc<'xpEvents'>, 'userId' | 'xpDelta' | 'createdAt'>>,
  weekStartIso: string,
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const event of events) {
    if (event.createdAt < weekStartIso) {
      continue;
    }

    const current = totals.get(event.userId) ?? 0;
    totals.set(event.userId, current + event.xpDelta);
  }

  return totals;
}

export function rankLeaderboardRows(rows: LeaderboardRow[]): RankedLeaderboardRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (b.totalXp !== a.totalXp) {
      return b.totalXp - a.totalXp;
    }

    return a.userId.localeCompare(b.userId);
  });

  const ranked: RankedLeaderboardRow[] = [];
  let position = 0;
  let rank = 0;
  let previousXp: number | null = null;

  for (const row of sorted) {
    position += 1;
    if (previousXp === null || row.totalXp !== previousXp) {
      rank = position;
      previousXp = row.totalXp;
    }

    ranked.push({
      ...row,
      position,
      rank,
    });
  }

  return ranked;
}

export function findUserPosition(
  ranked: RankedLeaderboardRow[],
  userId: string,
): RankedLeaderboardRow | null {
  return ranked.find((row) => row.userId === userId) ?? null;
}

export function formatDisplayName(displayName: string | null | undefined): string {
  const trimmed = displayName?.trim();
  return trimmed ? trimmed : 'Anonymous';
}
