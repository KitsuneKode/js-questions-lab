import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  userProgress: defineTable({
    userId: v.string(),
    questionId: v.number(),
    attempts: v.array(
      v.object({
        selected: v.union(v.literal('A'), v.literal('B'), v.literal('C'), v.literal('D'), v.null()),
        status: v.union(v.literal('correct'), v.literal('incorrect')),
        attemptedAt: v.string(),
      }),
    ),
    bookmarked: v.boolean(),
    srsData: v.optional(
      v.object({
        repetition: v.number(),
        interval: v.number(),
        easeFactor: v.number(),
        nextReviewDate: v.string(),
      }),
    ),
    updatedAt: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_question', ['userId', 'questionId']),

  xpEvents: defineTable({
    userId: v.string(),
    questionId: v.number(),
    eventType: v.union(
      v.literal('correct'),
      v.literal('wrong'),
      v.literal('precision_bonus'),
      v.literal('streak_bonus'),
      v.literal('mastery_cap'),
      v.literal('cooldown'),
      v.literal('srs_clear'),
    ),
    xpDelta: v.number(),
    submissionId: v.optional(v.string()),
    eventIndex: v.optional(v.number()),
    createdAt: v.string(),
  })
    .index('by_user_and_created', ['userId', 'createdAt'])
    .index('by_user_submission', ['userId', 'submissionId', 'eventIndex']),

  userStreaks: defineTable({
    userId: v.string(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastActivityDate: v.union(v.string(), v.null()),
    shieldUsedAt: v.optional(v.union(v.string(), v.null())),
    updatedAt: v.string(),
  }).index('by_user', ['userId']),

  userXpTotals: defineTable({
    userId: v.string(),
    totalXp: v.number(),
    displayName: v.optional(v.union(v.string(), v.null())),
    updatedAt: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_total_xp', ['totalXp']),
});
