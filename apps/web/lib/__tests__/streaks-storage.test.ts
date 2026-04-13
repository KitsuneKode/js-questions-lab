import { describe, expect, it } from 'vitest';
import { isValid } from '@/lib/streaks/storage';

describe('streak storage validation', () => {
  it('rejects missing or non-numeric streak counters', () => {
    expect(
      isValid({
        version: 1,
        currentStreak: 3,
        lastActivityDate: '2026-04-06',
      }),
    ).toBe(false);

    expect(
      isValid({
        version: 1,
        currentStreak: '3',
        longestStreak: 5,
        lastActivityDate: '2026-04-06',
      }),
    ).toBe(false);

    expect(
      isValid({
        version: 1,
        currentStreak: 3,
        longestStreak: '5',
        lastActivityDate: '2026-04-06',
      }),
    ).toBe(false);
  });

  it('rejects invalid lastActivityDate values', () => {
    expect(
      isValid({
        version: 1,
        currentStreak: 3,
        longestStreak: 5,
        lastActivityDate: 123,
      }),
    ).toBe(false);

    expect(
      isValid({
        version: 1,
        currentStreak: 3,
        longestStreak: 5,
        lastActivityDate: null,
      }),
    ).toBe(true);
  });
});
