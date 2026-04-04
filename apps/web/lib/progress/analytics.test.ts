import { afterEach, describe, expect, it, vi } from 'vitest';

import type { QuestionRecord } from '@/lib/content/types';
import type { ProgressState } from '@/lib/progress/storage';

import {
  computeOverallStats,
  computeStreak,
  computeTagStats,
  getRecommendedSuggestion,
  getReviewQueue,
} from './analytics';

type QuestionFixture = QuestionRecord & {
  locale?: string;
  runtime?: {
    kind?: 'javascript' | 'dom-click-propagation' | 'static';
  };
};

function createQuestion(overrides: Partial<QuestionFixture>): QuestionRecord {
  return {
    id: 1,
    slug: 'question-1',
    locale: 'en',
    title: 'Question',
    promptMarkdown: 'Prompt',
    codeBlocks: [],
    explanationCodeBlocks: [],
    options: [],
    correctOption: 'A',
    explanationMarkdown: 'Explanation',
    images: [],
    tags: ['scope'],
    difficulty: 'beginner',
    runnable: false,
    runtime: { kind: 'static' },
    source: {
      startLineHint: null,
    },
    ...overrides,
  } as QuestionRecord;
}

function createProgressState(): ProgressState {
  return {
    version: 2,
    questions: {
      '1': {
        questionId: 1,
        bookmarked: true,
        updatedAt: '2026-03-28T10:00:00.000Z',
        attempts: [
          {
            selected: 'A',
            status: 'correct',
            attemptedAt: '2026-03-27T10:00:00.000Z',
          },
          {
            selected: 'A',
            status: 'incorrect',
            attemptedAt: '2026-03-28T10:00:00.000Z',
          },
        ],
      },
      '2': {
        questionId: 2,
        bookmarked: false,
        updatedAt: '2026-03-29T10:00:00.000Z',
        attempts: [
          {
            selected: 'B',
            status: 'correct',
            attemptedAt: '2026-03-29T10:00:00.000Z',
          },
        ],
        srsData: {
          repetition: 2,
          interval: 6,
          easeFactor: 2.5,
          nextReviewDate: '2026-03-25T10:00:00.000Z',
        },
      },
    },
  };
}

describe('progress analytics', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('computes streaks and overall stats from attempt history', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-29T12:00:00.000Z'));

    const progress = createProgressState();
    const streak = computeStreak(progress);
    const overall = computeOverallStats(progress);

    expect(streak).toEqual({ current: 3, longest: 3 });
    expect(overall.totalAnswered).toBe(2);
    expect(overall.totalAttempts).toBe(3);
    expect(overall.bookmarkedCount).toBe(1);
  });

  it('aggregates tag accuracy across question attempts', () => {
    const progress = createProgressState();
    const questions = [
      createQuestion({ id: 1, tags: ['scope', 'fundamentals'] }),
      createQuestion({ id: 2, tags: ['async'] }),
    ];

    const tagStats = computeTagStats(progress, questions);

    expect(tagStats.find((tag) => tag.tag === 'scope')).toMatchObject({
      totalAttempts: 2,
      correctCount: 1,
      questionCount: 1,
    });
    expect(tagStats.find((tag) => tag.tag === 'async')).toMatchObject({
      totalAttempts: 1,
      correctCount: 1,
    });
  });

  it('prioritizes overdue SRS questions in the review queue', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-29T12:00:00.000Z'));

    const progress = createProgressState();
    const questions = [
      createQuestion({ id: 1, tags: ['scope'] }),
      createQuestion({ id: 2, tags: ['async'] }),
      createQuestion({ id: 3, tags: ['objects'] }),
    ];

    const queue = getReviewQueue(progress, questions, 2);

    expect(queue.map((question) => question.id)).toEqual([2, 1]);
  });

  it('recommends a fresh question from the weakest topic when possible', () => {
    const progress = createProgressState();
    const questions = [
      createQuestion({ id: 1, tags: ['scope'] }),
      createQuestion({ id: 2, tags: ['async'] }),
      createQuestion({ id: 3, tags: ['scope'] }),
    ];

    const suggestion = getRecommendedSuggestion(progress, questions, [
      {
        tag: 'scope',
        totalAttempts: 4,
        correctCount: 1,
        accuracy: 0.25,
        questionCount: 2,
      },
    ]);

    expect(suggestion.question?.id).toBe(3);
    expect(suggestion.labelKey).toBe('questions.sharpen');
    expect(suggestion.labelParams?.topic).toBe('scope');
  });
});
