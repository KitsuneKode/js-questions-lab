export interface StreakState {
  version: number;
  currentStreak: number;
  longestStreak: number;
  /** ISO date string (YYYY-MM-DD) of the last day a question was answered. */
  lastActivityDate: string | null;
}

export const defaultStreakState: StreakState = {
  version: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
};

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

/**
 * Update streak state after an answer is recorded.
 * Returns the new state and whether a milestone was just hit.
 */
export function updateStreak(
  state: StreakState,
  today = toDateStr(new Date()),
): { state: StreakState; milestoneHit: number | null } {
  const { lastActivityDate, currentStreak, longestStreak } = state;

  // Already answered today — streak unchanged
  if (lastActivityDate === today) {
    return { state, milestoneHit: null };
  }

  let newStreak: number;
  if (!lastActivityDate) {
    newStreak = 1;
  } else {
    const gap = daysBetween(lastActivityDate, today);
    if (gap === 1) {
      // Consecutive day
      newStreak = currentStreak + 1;
    } else {
      // Streak broken
      newStreak = 1;
    }
  }

  const newLongest = Math.max(longestStreak, newStreak);

  const prevStreak = currentStreak;
  const milestoneHit = STREAK_MILESTONES.find((m) => newStreak === m && prevStreak < m) ?? null;

  return {
    state: {
      ...state,
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActivityDate: today,
    },
    milestoneHit,
  };
}
