import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Convex schema mirroring the authenticated Supabase engagement layer.
 * Phase 1 foundation — mutations/queries land in follow-up cutover PRs.
 *
 * Identity: Clerk `sub` stored as `userId` (string), same as Supabase TEXT user_id.
 */
export default defineSchema({
  userProfiles: defineTable({
    userId: v.string(),
    displayName: v.optional(v.string()),
    isAnonymous: v.boolean(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  userProgress: defineTable({
    userId: v.string(),
    questionId: v.number(),
    attempts: v.array(
      v.object({
        selected: v.union(v.literal('A'), v.literal('B'), v.literal('C'), v.literal('D'), v.null()),
        status: v.union(v.literal('correct'), v.literal('incorrect')),
        attemptedAt: v.string(),
        mode: v.optional(v.union(v.literal('quiz'), v.literal('recall'))),
        responseText: v.optional(v.string()),
        errorType: v.optional(
          v.union(
            v.literal('misread'),
            v.literal('forgot'),
            v.literal('wrong_concept'),
            v.literal('guess'),
          ),
        ),
        selfGrade: v.optional(v.union(v.literal('hard'), v.literal('good'), v.literal('easy'))),
        timeMs: v.optional(v.number()),
        submissionId: v.optional(v.string()),
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
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_question', ['userId', 'questionId']),

  xpEvents: defineTable({
    userId: v.string(),
    questionId: v.optional(v.number()),
    eventType: v.string(),
    xpDelta: v.number(),
    submissionId: v.string(),
    eventIndex: v.number(),
    metadata: v.optional(
      v.object({
        mode: v.optional(v.string()),
        errorType: v.optional(v.string()),
        source: v.optional(v.string()),
      }),
    ),
    createdAt: v.number(),
  })
    .index('by_user_created', ['userId', 'createdAt'])
    .index('by_submission', ['userId', 'submissionId', 'eventIndex']),

  userStreaks: defineTable({
    userId: v.string(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastActivityDate: v.union(v.string(), v.null()),
    shieldUsedAt: v.optional(v.number()),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  userXpTotals: defineTable({
    userId: v.string(),
    totalXp: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_total', ['totalXp']),
});
