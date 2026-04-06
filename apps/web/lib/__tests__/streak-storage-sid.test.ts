import { beforeEach, describe, expect, it } from 'vitest';
import { defaultStreakState } from '@/lib/streaks/calculator';
import { readStreak, writeStreak } from '@/lib/streaks/storage';

const sid = 'test-session-abc';
const KEY = `jsq_streak_v2_${sid}`;

describe('streak storage (session-keyed)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('writes streak state to a key scoped to the given SID', () => {
    writeStreak(sid, defaultStreakState);
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify(defaultStreakState));
  });

  it('reads streak state from a key scoped to the given SID', () => {
    const state = {
      version: 1 as const,
      currentStreak: 7,
      longestStreak: 14,
      lastActivityDate: '2026-04-06',
    };
    window.localStorage.setItem(KEY, JSON.stringify(state));
    expect(readStreak(sid)).toEqual(state);
  });

  it('returns default state when nothing is stored for the given SID', () => {
    expect(readStreak(sid)).toEqual(defaultStreakState);
  });

  it('does not read from the flat legacy key', () => {
    const legacyData = {
      version: 1,
      currentStreak: 99,
      longestStreak: 99,
      lastActivityDate: '2026-01-01',
    };
    window.localStorage.setItem('jsq_streak_v1', JSON.stringify(legacyData));
    window.localStorage.setItem('jsq_streak_v2', JSON.stringify(legacyData));
    expect(readStreak(sid)).toEqual(defaultStreakState);
  });
});
