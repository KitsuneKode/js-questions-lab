import { describe, expect, it } from 'vitest';
import {
  mergeGuestProgressItems,
  mergeGuestStreak,
  mergeGuestXPEvents,
  partitionGuestXPForImport,
} from '@/lib/progress/guest-merge';
import type { ProgressItem } from '@/lib/progress/storage';
import { defaultStreakState } from '@/lib/streaks/calculator';
import type { XPEvent } from '@/lib/xp/scoring';

describe('mergeGuestProgressItems', () => {
  it('keeps guest SRS when the server row has none', () => {
    const guest: ProgressItem = {
      questionId: 1,
      bookmarked: false,
      updatedAt: '2026-07-09T12:00:00.000Z',
      attempts: [{ selected: 'A', status: 'correct', attemptedAt: '2026-07-09T12:00:00.000Z' }],
      srsData: {
        repetition: 1,
        interval: 1,
        easeFactor: 2.5,
        nextReviewDate: '2026-07-10T00:00:00.000Z',
      },
    };

    const server: ProgressItem = {
      questionId: 1,
      bookmarked: true,
      updatedAt: '2026-07-08T12:00:00.000Z',
      attempts: [{ selected: 'B', status: 'incorrect', attemptedAt: '2026-07-08T12:00:00.000Z' }],
    };

    const merged = mergeGuestProgressItems([guest], [server]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.srsData?.repetition).toBe(1);
    expect(merged[0]?.bookmarked).toBe(true);
    expect(merged[0]?.attempts[0]?.selected).toBe('A');
  });

  it('prefers newer guest progress including SRS over older server SRS', () => {
    const guest: ProgressItem = {
      questionId: 2,
      bookmarked: false,
      updatedAt: '2026-07-09T15:00:00.000Z',
      attempts: [{ selected: 'C', status: 'correct', attemptedAt: '2026-07-09T15:00:00.000Z' }],
      srsData: {
        repetition: 2,
        interval: 6,
        easeFactor: 2.6,
        nextReviewDate: '2026-07-15T00:00:00.000Z',
      },
    };

    const server: ProgressItem = {
      questionId: 2,
      bookmarked: false,
      updatedAt: '2026-07-01T00:00:00.000Z',
      attempts: [],
      srsData: {
        repetition: 1,
        interval: 1,
        easeFactor: 2.5,
        nextReviewDate: '2026-07-02T00:00:00.000Z',
      },
    };

    const merged = mergeGuestProgressItems([guest], [server]);
    expect(merged[0]?.srsData?.repetition).toBe(2);
    expect(merged[0]?.srsData?.interval).toBe(6);
  });

  it('does not push older guest progress over newer server rows', () => {
    const guest: ProgressItem = {
      questionId: 3,
      bookmarked: false,
      updatedAt: '2026-07-01T00:00:00.000Z',
      attempts: [{ selected: 'A', status: 'incorrect', attemptedAt: '2026-07-01T00:00:00.000Z' }],
    };
    const server: ProgressItem = {
      questionId: 3,
      bookmarked: true,
      updatedAt: '2026-07-09T00:00:00.000Z',
      attempts: [{ selected: 'B', status: 'correct', attemptedAt: '2026-07-09T00:00:00.000Z' }],
      srsData: {
        repetition: 3,
        interval: 14,
        easeFactor: 2.7,
        nextReviewDate: '2026-07-23T00:00:00.000Z',
      },
    };

    expect(mergeGuestProgressItems([guest], [server])).toHaveLength(0);
  });
});

describe('mergeGuestXPEvents', () => {
  it('imports guest events that are not already on the server', () => {
    const server: XPEvent[] = [
      {
        questionId: 1,
        eventType: 'correct',
        xpDelta: 10,
        timestamp: '2026-07-08T10:00:00.000Z',
      },
    ];
    const guest: XPEvent[] = [
      {
        questionId: 1,
        eventType: 'correct',
        xpDelta: 10,
        timestamp: '2026-07-08T10:00:00.000Z',
      },
      {
        questionId: 2,
        eventType: 'wrong',
        xpDelta: -5,
        timestamp: '2026-07-09T11:00:00.000Z',
      },
    ];

    const toImport = mergeGuestXPEvents(guest, server);
    expect(toImport).toHaveLength(1);
    expect(toImport[0]?.questionId).toBe(2);
  });

  it('partitions guest events into importable batches with stable submission ids', () => {
    const guest: XPEvent[] = [
      {
        questionId: 5,
        eventType: 'correct',
        xpDelta: 20,
        timestamp: '2026-07-09T12:00:00.000Z',
      },
      {
        questionId: 5,
        eventType: 'precision_bonus',
        xpDelta: 10,
        timestamp: '2026-07-09T12:00:00.000Z',
      },
    ];

    const batches = partitionGuestXPForImport(guest, []);
    expect(batches).toHaveLength(1);
    expect(batches[0]?.submissionId).toBe('guest:5:2026-07-09T12:00:00.000Z');
    expect(batches[0]?.events).toHaveLength(2);
  });
});

describe('mergeGuestStreak', () => {
  it('keeps the stronger streak when guest practiced more recently', () => {
    const guest = {
      ...defaultStreakState,
      currentStreak: 5,
      longestStreak: 5,
      lastActivityDate: '2026-07-09',
    };
    const server = {
      ...defaultStreakState,
      currentStreak: 2,
      longestStreak: 10,
      lastActivityDate: '2026-07-01',
    };

    const merged = mergeGuestStreak(guest, server);
    expect(merged.currentStreak).toBe(5);
    expect(merged.longestStreak).toBe(10);
    expect(merged.lastActivityDate).toBe('2026-07-09');
  });

  it('keeps server streak when it is more recent', () => {
    const guest = {
      ...defaultStreakState,
      currentStreak: 3,
      longestStreak: 3,
      lastActivityDate: '2026-07-01',
    };
    const server = {
      ...defaultStreakState,
      currentStreak: 4,
      longestStreak: 4,
      lastActivityDate: '2026-07-09',
    };

    const merged = mergeGuestStreak(guest, server);
    expect(merged.currentStreak).toBe(4);
    expect(merged.lastActivityDate).toBe('2026-07-09');
  });
});
