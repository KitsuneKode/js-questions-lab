import { defaultStreakState, type StreakState } from '@/lib/streaks/calculator';

const KEY = 'jsq_streak_v1';

export function isValid(value: unknown): value is StreakState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as StreakState;
  return (
    v.version === 1 &&
    typeof v.currentStreak === 'number' &&
    typeof v.longestStreak === 'number' &&
    (v.lastActivityDate === null || typeof v.lastActivityDate === 'string')
  );
}

export function readStreak(): StreakState {
  if (typeof window === 'undefined') return defaultStreakState;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultStreakState;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : defaultStreakState;
  } catch {
    return defaultStreakState;
  }
}

export function writeStreak(state: StreakState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}
