import { describe, expect, it } from 'vitest';
import {
  buildAuthoritativeAttemptResult,
  buildAuthoritativeSelfGradeResult,
  rebuildXPState,
} from '@/lib/engagement/engine';
import { defaultStreakState } from '@/lib/streaks/calculator';
import type { XPEvent } from '@/lib/xp/scoring';

const question = {
  id: 7,
  difficulty: 'intermediate' as const,
  correctOption: 'B' as const,
  options: [
    { key: 'A' as const, text: 'Alpha' },
    { key: 'B' as const, text: 'Beta' },
    { key: 'C' as const, text: 'Gamma' },
    { key: 'D' as const, text: 'Delta' },
  ],
};

describe('engagement engine', () => {
  it('treats an earlier cooldown event as already answering today', () => {
    const previousEvents: XPEvent[] = [
      {
        questionId: 99,
        xpDelta: 0,
        eventType: 'cooldown',
        timestamp: '2026-04-06T08:00:00.000Z',
      },
    ];

    const result = buildAuthoritativeAttemptResult({
      question,
      previousXPState: rebuildXPState(previousEvents),
      previousStreakState: defaultStreakState,
      previousProgress: undefined,
      selected: 'B',
      answeredAt: '2026-04-06T12:00:00.000Z',
    });

    expect(result.xpEvents.map((event) => event.eventType)).toEqual(['correct', 'precision_bonus']);
  });

  it('uses the server-side recall answer evaluation for hard mode submissions', () => {
    const result = buildAuthoritativeAttemptResult({
      question,
      selected: null,
      recallAnswer: 'Beta',
      answeredAt: '2026-04-06T12:00:00.000Z',
    });

    expect(result.status).toBe('correct');
    expect(result.progressItem.attempts[0]?.selected).toBeNull();
  });

  it('preserves attempts and bookmarks while computing server-side self grading', () => {
    const result = buildAuthoritativeSelfGradeResult({
      questionId: 7,
      grade: 'easy',
      previousProgress: {
        questionId: 7,
        bookmarked: true,
        updatedAt: '2026-04-06T10:00:00.000Z',
        attempts: [{ selected: 'A', status: 'incorrect', attemptedAt: '2026-04-06T10:00:00.000Z' }],
      },
      gradedAt: '2026-04-06T12:00:00.000Z',
    });

    expect(result.bookmarked).toBe(true);
    expect(result.attempts).toHaveLength(1);
    expect(result.srsData?.repetition).toBe(1);
  });
});
