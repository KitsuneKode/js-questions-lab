import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireIdentity } from './lib/auth';
import { progressItemReturnValidator, progressItemValidator } from './lib/validators';

export const listMine = query({
  args: {},
  returns: v.array(progressItemReturnValidator),
  handler: async (ctx) => {
    const { userId } = await requireIdentity(ctx);

    const rows = await ctx.db
      .query('userProgress')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    return rows.map((row) => ({
      questionId: row.questionId,
      attempts: row.attempts,
      bookmarked: row.bookmarked,
      srsData: row.srsData,
      updatedAt: row.updatedAt,
    }));
  },
});

export const upsertOne = mutation({
  args: {
    item: progressItemValidator,
    preserveExistingSrs: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId } = await requireIdentity(ctx);

    const existing = await ctx.db
      .query('userProgress')
      .withIndex('by_user_and_question', (q) =>
        q.eq('userId', userId).eq('questionId', args.item.questionId),
      )
      .unique();

    const srsData =
      args.preserveExistingSrs && existing?.srsData !== undefined
        ? existing.srsData
        : args.item.srsData;

    if (existing) {
      await ctx.db.patch(existing._id, {
        attempts: args.item.attempts,
        bookmarked: args.item.bookmarked,
        srsData,
        updatedAt: args.item.updatedAt,
      });
      return null;
    }

    await ctx.db.insert('userProgress', {
      userId,
      questionId: args.item.questionId,
      attempts: args.item.attempts,
      bookmarked: args.item.bookmarked,
      srsData,
      updatedAt: args.item.updatedAt,
    });

    return null;
  },
});

export const upsertMany = mutation({
  args: {
    items: v.array(progressItemValidator),
    preserveExistingSrs: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId } = await requireIdentity(ctx);
    if (args.items.length === 0) {
      return null;
    }

    const existingRows = await ctx.db
      .query('userProgress')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    const existingByQuestionId = new Map(existingRows.map((row) => [row.questionId, row]));

    for (const item of args.items) {
      const existing = existingByQuestionId.get(item.questionId);
      const srsData =
        args.preserveExistingSrs && existing?.srsData !== undefined
          ? existing.srsData
          : item.srsData;

      if (existing) {
        await ctx.db.patch(existing._id, {
          attempts: item.attempts,
          bookmarked: item.bookmarked,
          srsData,
          updatedAt: item.updatedAt,
        });
        continue;
      }

      await ctx.db.insert('userProgress', {
        userId,
        questionId: item.questionId,
        attempts: item.attempts,
        bookmarked: item.bookmarked,
        srsData,
        updatedAt: item.updatedAt,
      });
    }

    return null;
  },
});
