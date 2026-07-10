import { v } from 'convex/values';

export const attemptRecordValidator = v.object({
  selected: v.union(v.literal('A'), v.literal('B'), v.literal('C'), v.literal('D'), v.null()),
  status: v.union(v.literal('correct'), v.literal('incorrect')),
  attemptedAt: v.string(),
});

export const srsDataValidator = v.object({
  repetition: v.number(),
  interval: v.number(),
  easeFactor: v.number(),
  nextReviewDate: v.string(),
});

export const progressItemValidator = v.object({
  questionId: v.number(),
  attempts: v.array(attemptRecordValidator),
  bookmarked: v.boolean(),
  srsData: v.optional(srsDataValidator),
  updatedAt: v.string(),
});

export const progressItemReturnValidator = progressItemValidator;

export const xpEventTypeValidator = v.union(
  v.literal('correct'),
  v.literal('wrong'),
  v.literal('precision_bonus'),
  v.literal('streak_bonus'),
  v.literal('mastery_cap'),
  v.literal('cooldown'),
  v.literal('srs_clear'),
);

export const xpEventInputValidator = v.object({
  questionId: v.number(),
  eventType: xpEventTypeValidator,
  xpDelta: v.number(),
  createdAt: v.string(),
});

export const xpEventReturnValidator = v.object({
  questionId: v.number(),
  eventType: xpEventTypeValidator,
  xpDelta: v.number(),
  createdAt: v.string(),
});

export const streakStateValidator = v.object({
  currentStreak: v.number(),
  longestStreak: v.number(),
  lastActivityDate: v.union(v.string(), v.null()),
  shieldUsedAt: v.optional(v.union(v.string(), v.null())),
});

export const xpTotalsValidator = v.object({
  totalXp: v.number(),
  displayName: v.union(v.string(), v.null()),
  updatedAt: v.string(),
});

export const leaderboardEntryValidator = v.object({
  position: v.number(),
  rank: v.number(),
  displayName: v.string(),
  totalXp: v.number(),
  currentStreak: v.number(),
});

export const leaderboardPositionValidator = v.object({
  position: v.number(),
  rank: v.number(),
  totalXp: v.number(),
});
