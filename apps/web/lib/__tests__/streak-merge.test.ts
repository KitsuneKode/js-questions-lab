import { describe, expect, it } from 'vitest';
import { defaultStreakState, type StreakState } from '@/lib/streaks/calculator';
import { mergeStreakStates } from '@/lib/streaks/merge';

function streak(partial: Partial<StreakState>): StreakState {
  return { ...defaultStreakState, ...partial };
}

describe('mergeStreakStates', () => {
  it('keeps the longer current streak when dates are consecutive-compatible', () => {
    const guest = streak({
      currentStreak: 5,
      longestStreak: 5,
      lastActivityDate: '2026-07-09',
    });
    const server = streak({
      currentStreak: 2,
      longestStreak: 10,
      lastActivityDate: '2026-07-08',
    });

    const merged = mergeStreakStates(guest, server, '2026-07-09');
    expect(merged.currentStreak).toBe(5);
    expect(merged.longestStreak).toBe(10);
    expect(merged.lastActivityDate).toBe('2026-07-09');
  });

  it('prefers the more recent lastActivityDate when streaks conflict', () => {
    const guest = streak({
      currentStreak: 3,
      longestStreak: 3,
      lastActivityDate: '2026-07-01',
    });
    const server = streak({
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: '2026-07-09',
    });

    const merged = mergeStreakStates(guest, server, '2026-07-09');
    expect(merged.lastActivityDate).toBe('2026-07-09');
    expect(merged.currentStreak).toBe(1);
    expect(merged.longestStreak).toBe(3);
  });

  it('returns default when both empty', () => {
    expect(mergeStreakStates(defaultStreakState, defaultStreakState, '2026-07-09')).toEqual(
      defaultStreakState,
    );
  });
});
