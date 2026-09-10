import { v } from 'convex/values';
import { type MutationCtx, mutation, query } from './_generated/server';
import { requireIdentity } from './lib/auth';
import { normalizeDisplayName } from './lib/display-name';
import { xpEventInputValidator, xpEventReturnValidator, xpTotalsValidator } from './lib/validators';

const XP_DELTA_MIN = -50;
const XP_DELTA_MAX = 50;

async function rebuildTotalXp(ctx: MutationCtx, userId: string): Promise<number> {
  const rows = await ctx.db
    .query('xpEvents')
    .withIndex('by_user_and_created', (q) => q.eq('userId', userId))
    .collect();

  return rows.reduce((sum, row) => sum + row.xpDelta, 0);
}

async function persistTotalXp(
  ctx: MutationCtx,
  userId: string,
  totalXp: number,
  nowIso: string,
): Promise<number> {
  const totals = await ctx.db
    .query('userXpTotals')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique();

  if (totals) {
    await ctx.db.patch(totals._id, {
      totalXp,
      updatedAt: nowIso,
    });
  } else {
    await ctx.db.insert('userXpTotals', {
      userId,
      totalXp,
      updatedAt: nowIso,
    });
  }

  return totalXp;
}

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
    nowIso: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const { userId } = await requireIdentity(ctx);

    for (const [index, event] of args.events.entries()) {
      if (event.xpDelta < XP_DELTA_MIN || event.xpDelta > XP_DELTA_MAX) {
        throw new Error('xp_delta out of bounds');
      }

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

    const totalXp = await rebuildTotalXp(ctx, userId);
    return await persistTotalXp(ctx, userId, totalXp, args.nowIso);
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
    const normalized = normalizeDisplayName(args.displayName);
    if (!normalized.ok) {
      throw new Error(normalized.error);
    }

    const existing = await ctx.db
      .query('userXpTotals')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: normalized.displayName,
        updatedAt: args.nowIso,
      });
      return { displayName: normalized.displayName };
    }

    await ctx.db.insert('userXpTotals', {
      userId,
      totalXp: 0,
      displayName: normalized.displayName,
      updatedAt: args.nowIso,
    });

    return { displayName: normalized.displayName };
  },
});
