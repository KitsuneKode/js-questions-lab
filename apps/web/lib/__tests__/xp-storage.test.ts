import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultXPState, getWeeklyXP, isValid, writeXP } from '@/lib/xp/storage';

describe('xp storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('rejects invalid persisted shapes', () => {
    expect(
      isValid({
        version: 1,
        totalXP: 10,
        lastEarnedDate: '2026-04-06',
      }),
    ).toBe(false);

    expect(
      isValid({
        version: 1,
        totalXP: 10,
        events: [],
      }),
    ).toBe(false);

    expect(
      isValid({
        version: 2,
        totalXP: 10,
        lastEarnedDate: '2026-04-06',
        events: [],
      }),
    ).toBe(false);
  });

  it('does not throw when localStorage.setItem fails', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => writeXP('test-sid', defaultXPState)).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('sums only events from the current ISO week in UTC', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-08T12:00:00.000Z'));

    expect(
      getWeeklyXP([
        {
          questionId: 1,
          xpDelta: 40,
          eventType: 'correct',
          timestamp: '2026-04-05T23:59:59.000Z',
        },
        {
          questionId: 2,
          xpDelta: 20,
          eventType: 'correct',
          timestamp: '2026-04-06T00:00:00.000Z',
        },
        {
          questionId: 3,
          xpDelta: 15,
          eventType: 'streak_bonus',
          timestamp: '2026-04-08T09:00:00.000Z',
        },
      ]),
    ).toBe(35);
  });
});
