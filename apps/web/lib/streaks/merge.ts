import { defaultStreakState, type StreakState } from '@/lib/streaks/calculator';

function dayDiff(a: string, b: string): number {
  const ms = new Date(a).getTime() - new Date(b).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Merge guest + server streak for sign-in.
 * - longestStreak: max of both
 * - lastActivityDate: most recent non-null
 * - currentStreak: take the side whose lastActivityDate is more recent
 *   (if tied, take the larger currentStreak), then zero it out if the
 *   activity is older than yesterday relative to `today`.
 */
export function mergeStreakStates(
  guest: StreakState,
  server: StreakState,
  today: string,
): StreakState {
  const candidates = [guest, server].filter((s) => s.lastActivityDate);
  if (candidates.length === 0) return defaultStreakState;

  const byRecency = [...candidates].sort((a, b) =>
    (b.lastActivityDate ?? '').localeCompare(a.lastActivityDate ?? ''),
  );
  const primary = byRecency[0]!;
  const secondary = byRecency[1];

  let currentStreak = primary.currentStreak;
  if (
    secondary &&
    primary.lastActivityDate === secondary.lastActivityDate &&
    secondary.currentStreak > currentStreak
  ) {
    currentStreak = secondary.currentStreak;
  }

  const last = primary.lastActivityDate!;
  const age = dayDiff(today, last);
  if (age > 1) {
    currentStreak = 0;
  }

  return {
    version: Math.max(guest.version, server.version, 1),
    currentStreak,
    longestStreak: Math.max(guest.longestStreak, server.longestStreak, currentStreak),
    lastActivityDate: last,
  };
}
