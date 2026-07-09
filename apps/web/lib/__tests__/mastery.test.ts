import { describe, expect, it } from 'vitest';
import type { TagStats } from '@/lib/progress/analytics';
import {
  computeMasteryState,
  computeTopicMastery,
  type MasteryState,
} from '@/lib/progress/mastery';
import type { ProgressState } from '@/lib/progress/storage';

function tag(
  partial: Partial<TagStats> & Pick<TagStats, 'tag' | 'questionCount' | 'accuracy'>,
): TagStats {
  return {
    totalAttempts: partial.totalAttempts ?? Math.max(1, partial.questionCount),
    correctCount: partial.correctCount ?? Math.round(partial.accuracy * partial.questionCount),
    ...partial,
  };
}

describe('computeMasteryState', () => {
  const cases: Array<{
    answered: number;
    accuracy: number;
    srsReady: boolean;
    expected: MasteryState;
  }> = [
    { answered: 0, accuracy: 0, srsReady: false, expected: 'locked' },
    { answered: 3, accuracy: 1, srsReady: false, expected: 'exploring' },
    { answered: 5, accuracy: 0.35, srsReady: false, expected: 'exploring' },
    { answered: 5, accuracy: 0.5, srsReady: false, expected: 'developing' },
    { answered: 10, accuracy: 0.75, srsReady: false, expected: 'proficient' },
    { answered: 10, accuracy: 0.9, srsReady: false, expected: 'proficient' },
    { answered: 10, accuracy: 0.9, srsReady: true, expected: 'mastered' },
  ];

  for (const { answered, accuracy, srsReady, expected } of cases) {
    it(`returns ${expected} for answered=${answered} accuracy=${accuracy} srsReady=${srsReady}`, () => {
      expect(computeMasteryState(answered, accuracy, srsReady)).toBe(expected);
    });
  }
});

describe('computeTopicMastery', () => {
  it('includes locked topics from the catalog even with no attempts', () => {
    const progress: ProgressState = { version: 2, questions: {} };
    const tagStats: TagStats[] = [];
    const catalog = { scope: 12, async: 8 };

    const result = computeTopicMastery(tagStats, catalog, progress, new Map());
    expect(result.map((t) => t.tag).sort()).toEqual(['async', 'scope']);
    expect(result.every((t) => t.state === 'locked')).toBe(true);
  });

  it('marks a topic mastered when accuracy, volume, and SRS interval qualify', () => {
    const progress: ProgressState = {
      version: 2,
      questions: {
        '1': {
          questionId: 1,
          bookmarked: false,
          updatedAt: '2026-07-09T00:00:00.000Z',
          attempts: [{ selected: 'A', status: 'correct', attemptedAt: '2026-07-09T00:00:00.000Z' }],
          srsData: {
            repetition: 4,
            interval: 14,
            easeFactor: 2.5,
            nextReviewDate: '2026-07-23T00:00:00.000Z',
          },
        },
      },
    };

    const tagStats = [
      tag({
        tag: 'scope',
        questionCount: 10,
        accuracy: 0.9,
        totalAttempts: 12,
        correctCount: 11,
      }),
    ];

    const questionTags = new Map<number, string[]>([[1, ['scope']]]);
    const result = computeTopicMastery(tagStats, { scope: 12 }, progress, questionTags);
    expect(result[0]?.state).toBe('mastered');
  });
});
