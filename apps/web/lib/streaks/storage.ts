import { defaultStreakState, type StreakState } from '@/lib/streaks/calculator';

const KEY = 'jsq_streak_v1';

function isValid(value: unknown): value is StreakState {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as StreakState).version === 1 &&
    typeof (value as StreakState).currentStreak === 'number'
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
