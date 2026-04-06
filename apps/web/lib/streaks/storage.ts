import { defaultStreakState, type StreakState } from '@/lib/streaks/calculator';

const BASE_KEY = 'jsq_streak_v2';
const key = (sid: string) => `${BASE_KEY}_${sid}`;

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

export function readStreak(sid: string): StreakState {
  if (typeof window === 'undefined') return defaultStreakState;
  try {
    const raw = window.localStorage.getItem(key(sid));
    if (!raw) return defaultStreakState;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : defaultStreakState;
  } catch {
    return defaultStreakState;
  }
}

export function writeStreak(sid: string, state: StreakState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key(sid), JSON.stringify(state));
}
