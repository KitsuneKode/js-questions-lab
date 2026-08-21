import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireIdentity } from './lib/auth';
import { xpEventInputValidator, xpEventReturnValidator, xpTotalsValidator } from './lib/validators';

export const listEvents = query({
  args: {},
  returns: v.array(xpEventReturnValidator),
  handler: async (ctx) => {
    const { userId } = await requireIdentity(ctx);

    const rows = await ctx.db
      .query('xpEvents')
      .withIndex('by_user_and_created', (q) => q.eq('userId', userId))
      .collect();

    return rows
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((row) => ({
        questionId: row.questionId,
        eventType: row.eventType,
        xpDelta: row.xpDelta,
        createdAt: row.createdAt,
      }));
  },
});

export const getTotals = query({
  args: {},
  returns: v.union(xpTotalsValidator, v.null()),
  handler: async (ctx) => {
    const { userId } = await requireIdentity(ctx);

    const row = await ctx.db
      .query('userXpTotals')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (!row) {
      return null;
    }

    return {
      totalXp: row.totalXp,
      displayName: row.displayName ?? null,
      updatedAt: row.updatedAt,
    };
  },
});

export const appendEvents = mutation({
  args: {
    submissionId: v.string(),
    events: v.array(xpEventInputValidator),
    totalXp: v.number(),
    nowIso: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const { userId } = await requireIdentity(ctx);
    if (args.events.length === 0) {
      return args.totalXp;
    }

    for (const [index, event] of args.events.entries()) {
      const existing = await ctx.db
        .query('xpEvents')
        .withIndex('by_user_submission', (q) =>
          q.eq('userId', userId).eq('submissionId', args.submissionId).eq('eventIndex', index),
        )
        .unique();

      if (existing) {
        continue;
      }

      await ctx.db.insert('xpEvents', {
        userId,
        questionId: event.questionId,
        eventType: event.eventType,
        xpDelta: event.xpDelta,
        submissionId: args.submissionId,
        eventIndex: index,
        createdAt: event.createdAt,
      });
    }

    const totals = await ctx.db
      .query('userXpTotals')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (totals) {
      await ctx.db.patch(totals._id, {
        totalXp: args.totalXp,
        updatedAt: args.nowIso,
      });
    } else {
      await ctx.db.insert('userXpTotals', {
        userId,
        totalXp: args.totalXp,
        updatedAt: args.nowIso,
      });
    }

    return args.totalXp;
  },
});

export const upsertTotals = mutation({
  args: {
    totalXp: v.number(),
    nowIso: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId } = await requireIdentity(ctx);

    const existing = await ctx.db
      .query('userXpTotals')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalXp: args.totalXp,
        updatedAt: args.nowIso,
      });
      return null;
    }

    await ctx.db.insert('userXpTotals', {
      userId,
      totalXp: args.totalXp,
      updatedAt: args.nowIso,
    });

    return null;
  },
});

export const setDisplayName = mutation({
  args: {
    displayName: v.string(),
    nowIso: v.string(),
  },
  returns: v.object({
    displayName: v.string(),
  }),
  handler: async (ctx, args) => {
    const { userId } = await requireIdentity(ctx);

    const existing = await ctx.db
      .query('userXpTotals')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: args.displayName,
        updatedAt: args.nowIso,
      });
      return { displayName: args.displayName };
    }

    await ctx.db.insert('userXpTotals', {
      userId,
      totalXp: 0,
      displayName: args.displayName,
      updatedAt: args.nowIso,
    });

    return { displayName: args.displayName };
  },
});
