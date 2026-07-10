import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireIdentity } from './lib/auth';
import { streakStateValidator } from './lib/validators';

export const getMine = query({
  args: {},
  returns: v.union(streakStateValidator, v.null()),
  handler: async (ctx) => {
    const { userId } = await requireIdentity(ctx);

    const row = await ctx.db
      .query('userStreaks')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (!row) {
      return null;
    }

    return {
      currentStreak: row.currentStreak,
      longestStreak: row.longestStreak,
      lastActivityDate: row.lastActivityDate,
      shieldUsedAt: row.shieldUsedAt ?? null,
    };
  },
});

export const upsertMine = mutation({
  args: {
    state: streakStateValidator,
    nowIso: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId } = await requireIdentity(ctx);

    const existing = await ctx.db
      .query('userStreaks')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    const payload = {
      currentStreak: args.state.currentStreak,
      longestStreak: args.state.longestStreak,
      lastActivityDate: args.state.lastActivityDate,
      shieldUsedAt: args.state.shieldUsedAt ?? null,
      updatedAt: args.nowIso,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return null;
    }

    await ctx.db.insert('userStreaks', {
      userId,
      ...payload,
    });

    return null;
  },
});
