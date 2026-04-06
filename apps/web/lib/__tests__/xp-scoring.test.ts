import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AttemptRecord } from '@/lib/progress/storage';
import { computeXP } from '@/lib/xp/scoring';

function createAttempt(
  status: AttemptRecord['status'],
  attemptedAt: string,
  selected: AttemptRecord['selected'] = 'A',
): AttemptRecord {
  return { selected, status, attemptedAt };
}

describe('computeXP', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits wrong and streak bonus for a wrong first answer of the day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-06T12:00:00.000Z'));

    expect(
      computeXP({
        questionId: 7,
        status: 'incorrect',
        difficulty: 'advanced',
        srsData: undefined,
        priorAttempts: [],
        isFirstAnswerToday: true,
      }).map((event) => [event.eventType, event.xpDelta]),
    ).toEqual([
      ['wrong', -5],
      ['streak_bonus', 15],
    ]);
  });

  it('uses all previous attempts for cooldown, even across a date boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-06T00:05:00.000Z'));

    const events = computeXP({
      questionId: 7,
      status: 'correct',
      difficulty: 'beginner',
      srsData: undefined,
      priorAttempts: [createAttempt('incorrect', '2026-04-05T23:59:00.000Z')],
      isFirstAnswerToday: false,
    });

    expect(events).toHaveLength(1);
    expect(events[0]?.eventType).toBe('cooldown');
    expect(events[0]?.xpDelta).toBe(0);
  });

  it('filters previous wrong attempts by today before awarding precision bonus', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-06T12:00:00.000Z'));

    expect(
      computeXP({
        questionId: 7,
        status: 'correct',
        difficulty: 'beginner',
        srsData: undefined,
        priorAttempts: [createAttempt('incorrect', '2026-04-05T08:00:00.000Z')],
        isFirstAnswerToday: false,
      }).map((event) => event.eventType),
    ).toEqual(['correct', 'precision_bonus']);
  });

  it('awards only mastery cap XP for mastered questions', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-06T12:00:00.000Z'));

    const events = computeXP({
      questionId: 7,
      status: 'correct',
      difficulty: 'advanced',
      srsData: {
        repetition: 4,
        interval: 14,
        easeFactor: 2.5,
        nextReviewDate: '2026-04-20T12:00:00.000Z',
      },
      priorAttempts: [],
      isFirstAnswerToday: false,
    });

    expect(events).toHaveLength(1);
    expect(events[0]?.eventType).toBe('mastery_cap');
    expect(events[0]?.xpDelta).toBe(2);
  });

  it('awards base, precision, and streak bonus for an eligible correct first answer', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-06T12:00:00.000Z'));

    expect(
      computeXP({
        questionId: 7,
        status: 'correct',
        difficulty: 'intermediate',
        srsData: undefined,
        priorAttempts: [],
        isFirstAnswerToday: true,
      }).map((event) => [event.eventType, event.xpDelta]),
    ).toEqual([
      ['correct', 20],
      ['precision_bonus', 10],
      ['streak_bonus', 15],
    ]);
  });
});
