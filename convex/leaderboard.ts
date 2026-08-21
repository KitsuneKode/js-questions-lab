import { v } from 'convex/values';
import type { QueryCtx } from './_generated/server';
import { query } from './_generated/server';
import { requireIdentity } from './lib/auth';
import {
  clampLeaderboardLimit,
  findUserPosition,
  formatDisplayName,
  rankLeaderboardRows,
  sumWeeklyXpByUser,
} from './lib/leaderboard-helpers';
import { leaderboardEntryValidator, leaderboardPositionValidator } from './lib/validators';

async function loadUserMetadata(ctx: QueryCtx, userIds: string[]) {
  const displayNames = new Map<string, string | null>();
  const streaks = new Map<string, number>();

  await Promise.all(
    userIds.map(async (userId) => {
      const [totals, streak] = await Promise.all([
        ctx.db
          .query('userXpTotals')
          .withIndex('by_user', (q) => q.eq('userId', userId))
          .unique(),
        ctx.db
          .query('userStreaks')
          .withIndex('by_user', (q) => q.eq('userId', userId))
          .unique(),
      ]);

      displayNames.set(userId, totals?.displayName ?? null);
      streaks.set(userId, streak?.currentStreak ?? 0);
    }),
  );

  return { displayNames, streaks };
}

function toLeaderboardEntries(
  ranked: ReturnType<typeof rankLeaderboardRows>,
  displayNames: Map<string, string | null>,
  streaks: Map<string, number>,
  limit: number,
) {
  return ranked.slice(0, limit).map((row) => ({
    position: row.position,
    rank: row.rank,
    displayName: formatDisplayName(displayNames.get(row.userId)),
    totalXp: Math.max(0, row.totalXp),
    currentStreak: Math.max(0, streaks.get(row.userId) ?? 0),
  }));
}

export const weekly = query({
  args: {
    weekStartIso: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(leaderboardEntryValidator),
  handler: async (ctx, args) => {
    const limit = clampLeaderboardLimit(args.limit ?? 50);

    const events = await ctx.db.query('xpEvents').collect();
    const weeklyTotals = sumWeeklyXpByUser(events, args.weekStartIso);

    const rows = [...weeklyTotals.entries()].map(([userId, totalXp]) => ({
      userId,
      totalXp,
    }));

    const ranked = rankLeaderboardRows(rows);
    const topUserIds = ranked.slice(0, limit).map((row) => row.userId);
    const { displayNames, streaks } = await loadUserMetadata(ctx, topUserIds);

    return toLeaderboardEntries(ranked, displayNames, streaks, limit);
  },
});

export const allTime = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(leaderboardEntryValidator),
  handler: async (ctx, args) => {
    const limit = clampLeaderboardLimit(args.limit ?? 50);

    const totals = await ctx.db.query('userXpTotals').collect();
    const rows = totals.map((row) => ({
      userId: row.userId,
      totalXp: row.totalXp,
    }));

    const ranked = rankLeaderboardRows(rows);
    const topUserIds = ranked.slice(0, limit).map((row) => row.userId);
    const { displayNames, streaks } = await loadUserMetadata(ctx, topUserIds);

    return toLeaderboardEntries(ranked, displayNames, streaks, limit);
  },
});

export const myWeeklyPosition = query({
  args: {
    weekStartIso: v.string(),
  },
  returns: v.union(leaderboardPositionValidator, v.null()),
  handler: async (ctx, args) => {
    const { userId } = await requireIdentity(ctx);

    const events = await ctx.db.query('xpEvents').collect();
    const weeklyTotals = sumWeeklyXpByUser(events, args.weekStartIso);

    const rows = [...weeklyTotals.entries()].map(([id, totalXp]) => ({
      userId: id,
      totalXp,
    }));

    const ranked = rankLeaderboardRows(rows);
    const mine = findUserPosition(ranked, userId);
    if (!mine) {
      return null;
    }

    return {
      position: mine.position,
      rank: mine.rank,
      totalXp: Math.max(0, mine.totalXp),
    };
  },
});

export const myAllTimePosition = query({
  args: {},
  returns: v.union(leaderboardPositionValidator, v.null()),
  handler: async (ctx) => {
    const { userId } = await requireIdentity(ctx);

    const totals = await ctx.db.query('userXpTotals').collect();
    const rows = totals.map((row) => ({
      userId: row.userId,
      totalXp: row.totalXp,
    }));

    const ranked = rankLeaderboardRows(rows);
    const mine = findUserPosition(ranked, userId);
    if (!mine) {
      return null;
    }

    return {
      position: mine.position,
      rank: mine.rank,
      totalXp: Math.max(0, mine.totalXp),
    };
  },
});
