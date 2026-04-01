import { describe, expect, it } from 'vitest';

import type { QuestionRecord } from '@/lib/content/types';
import type { ProgressState } from '@/lib/progress/storage';

import {
  applyServerFilters,
  applyStatusFilter,
  buildQuestionScopeQuery,
  paginate,
  parseQuestionScope,
} from './query';

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
    title: 'What is hoisting?',
    promptMarkdown: 'Explain how var behaves.',
    codeBlocks: [],
    explanationCodeBlocks: [],
    options: [],
    correctOption: null,
    explanationMarkdown: 'Hoisting moves declarations during compilation.',
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

describe('content query helpers', () => {
  const questions = [
    createQuestion({
      id: 1,
      title: 'What is hoisting?',
      tags: ['scope'],
      difficulty: 'beginner',
      runnable: false,
      explanationMarkdown: 'Hoisting moves declarations.',
    }),
    createQuestion({
      id: 2,
      title: 'How do promises schedule callbacks?',
      promptMarkdown: 'Look at queueMicrotask and Promise.then.',
      explanationMarkdown: 'Promises schedule follow-up callbacks in the microtask queue.',
      tags: ['async'],
      difficulty: 'advanced',
      runnable: true,
      runtime: { kind: 'javascript' },
    }),
  ];

  it('filters by text across title, prompt, and explanation', () => {
    expect(
      applyServerFilters(questions, { q: 'queueMicrotask' }).map((question) => question.id),
    ).toEqual([2]);
    expect(
      applyServerFilters(questions, { q: 'var behaves' }).map((question) => question.id),
    ).toEqual([1]);
  });

  it('filters by tag, runnable, and difficulty together', () => {
    const result = applyServerFilters(questions, {
      tags: ['async'],
      runnable: true,
      difficulties: ['advanced'],
    });

    expect(result.map((question) => question.id)).toEqual([2]);
  });

  it('filters by status against progress state', () => {
    const progressQuestions: ProgressState['questions'] = {
      '1': {
        questionId: 1,
        attempts: [{ selected: 'A', status: 'correct', attemptedAt: '2026-01-01T00:00:00.000Z' }],
        bookmarked: false,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      '2': {
        questionId: 2,
        attempts: [],
        bookmarked: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    };

    expect(
      applyStatusFilter(questions, 'answered', progressQuestions).map((question) => question.id),
    ).toEqual([1]);
    expect(
      applyStatusFilter(questions, 'unanswered', progressQuestions).map((question) => question.id),
    ).toEqual([2]);
    expect(
      applyStatusFilter(questions, 'bookmarked', progressQuestions).map((question) => question.id),
    ).toEqual([2]);
  });

  it('parses and serializes a normalized question scope', () => {
    const scope = parseQuestionScope({
      q: ' promises ',
      tag: 'async',
      difficulties: ['advanced'],
      runnable: 'true',
      status: 'unanswered',
      page: '3',
    });

    expect(scope).toEqual({
      q: 'promises',
      tags: ['async'],
      difficulties: ['advanced'],
      runnable: true,
      status: 'unanswered',
      page: 3,
    });

    expect(buildQuestionScopeQuery(scope, { includePage: true })).toBe(
      'q=promises&tags=async&runnable=true&difficulties=advanced&status=unanswered&page=3',
    );
    expect(buildQuestionScopeQuery(scope, { includePage: false })).toBe(
      'q=promises&tags=async&runnable=true&difficulties=advanced&status=unanswered',
    );
  });

  it('paginates and clamps the requested page', () => {
    const result = paginate([1, 2, 3, 4, 5], 99, 2);

    expect(result.page).toBe(3);
    expect(result.pageCount).toBe(3);
    expect(result.items).toEqual([5]);
  });
});
