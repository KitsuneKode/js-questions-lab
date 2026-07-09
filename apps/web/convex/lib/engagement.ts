/**
 * Re-export pure engagement scoring for Convex mutations.
 * Keep business rules in apps/web/lib — Convex imports the same source of truth
 * so weekly XP floor / cooldown / mastery caps cannot drift.
 *
 * Note: Convex bundler resolves these via relative imports from the web package.
 */
export {
  buildAuthoritativeAttemptResult,
  buildAuthoritativeSelfGradeResult,
  rebuildXPState,
  resolveAttemptStatus,
} from '../../lib/engagement/engine';
export {
  mergeGuestProgressItems,
  mergeGuestStreak,
  partitionGuestXPForImport,
} from '../../lib/progress/guest-merge';
export { defaultStreakState, updateStreak } from '../../lib/streaks/calculator';
export { getLevelInfo } from '../../lib/xp/levels';
export { computeXP } from '../../lib/xp/scoring';
