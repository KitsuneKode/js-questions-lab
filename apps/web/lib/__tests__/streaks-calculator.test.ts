import { describe, expect, it } from 'vitest';
import { updateStreak } from '@/lib/streaks/calculator';

describe('updateStreak', () => {
  it('increments the streak on a consecutive day', () => {
    const result = updateStreak(
      {
        version: 1,
        currentStreak: 4,
        longestStreak: 6,
        lastActivityDate: '2026-04-05',
      },
      '2026-04-06',
    );

    expect(result.state.currentStreak).toBe(5);
    expect(result.state.longestStreak).toBe(6);
    expect(result.milestoneHit).toBe(null);
  });

  it('keeps the streak unchanged on the same day', () => {
    const state = {
      version: 1,
      currentStreak: 4,
      longestStreak: 6,
      lastActivityDate: '2026-04-06',
    } as const;

    const result = updateStreak(state, '2026-04-06');

    expect(result.state).toEqual(state);
    expect(result.milestoneHit).toBe(null);
  });

  it('resets the streak to 1 after a gap longer than one day', () => {
    const result = updateStreak(
      {
        version: 1,
        currentStreak: 9,
        longestStreak: 12,
        lastActivityDate: '2026-04-03',
      },
      '2026-04-06',
    );

    expect(result.state.currentStreak).toBe(1);
    expect(result.state.longestStreak).toBe(12);
    expect(result.milestoneHit).toBe(null);
  });

  it('fires milestone detection only when the new streak crosses the threshold', () => {
    const hit = updateStreak(
      {
        version: 1,
        currentStreak: 6,
        longestStreak: 6,
        lastActivityDate: '2026-04-05',
      },
      '2026-04-06',
    );
    const noHit = updateStreak(
      {
        version: 1,
        currentStreak: 7,
        longestStreak: 7,
        lastActivityDate: '2026-04-06',
      },
      '2026-04-07',
    );

    expect(hit.milestoneHit).toBe(7);
    expect(noHit.milestoneHit).toBe(null);
  });
});
