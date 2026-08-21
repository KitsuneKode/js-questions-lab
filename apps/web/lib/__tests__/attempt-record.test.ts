import { describe, expect, it } from 'vitest';
import {
  buildAuthoritativeAttemptResult,
  buildAuthoritativeSelfGradeResult,
} from '@/lib/engagement/engine';
import {
  type AttemptErrorType,
  type AttemptRecord,
  createAttemptRecord,
  getLastAttempt,
  patchLastAttempt,
} from '@/lib/progress/storage';

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

describe('AttemptRecord v2 helpers', () => {
  it('creates an attempt with optional feedback fields', () => {
    const attempt = createAttemptRecord({
      selected: null,
      status: 'incorrect',
      attemptedAt: '2026-07-09T12:00:00.000Z',
      mode: 'recall',
      responseText: 'Alpha',
      errorType: 'wrong_concept',
      timeMs: 4200,
    });

    expect(attempt).toEqual({
      selected: null,
      status: 'incorrect',
      attemptedAt: '2026-07-09T12:00:00.000Z',
      mode: 'recall',
      responseText: 'Alpha',
      errorType: 'wrong_concept',
      timeMs: 4200,
    });
  });

  it('preserves the unjudgeable flag for open-ended recalls', () => {
    const attempt = createAttemptRecord({
      selected: null,
      status: 'incorrect',
      attemptedAt: '2026-07-09T12:00:00.000Z',
      mode: 'recall',
      responseText: 'some freeform answer',
      unjudgeable: true,
    });

    expect(attempt.unjudgeable).toBe(true);
  });

  it('omits the unjudgeable flag for scored attempts', () => {
    const attempt = createAttemptRecord({
      selected: null,
      status: 'correct',
      attemptedAt: '2026-07-09T12:00:00.000Z',
      mode: 'recall',
    });

    expect('unjudgeable' in attempt).toBe(false);
  });

  it('patches the last attempt without mutating earlier ones', () => {
    const attempts: AttemptRecord[] = [
      createAttemptRecord({
        selected: 'A',
        status: 'incorrect',
        attemptedAt: '2026-07-09T11:00:00.000Z',
        mode: 'quiz',
      }),
      createAttemptRecord({
        selected: 'B',
        status: 'correct',
        attemptedAt: '2026-07-09T12:00:00.000Z',
        mode: 'quiz',
      }),
    ];

    const next = patchLastAttempt(attempts, {
      errorType: 'misread' as AttemptErrorType,
      selfGrade: 'good',
    });

    expect(next).toHaveLength(2);
    expect(next[0]).toEqual(attempts[0]);
    expect(next[1]?.errorType).toBe('misread');
    expect(next[1]?.selfGrade).toBe('good');
    expect(attempts[1]?.selfGrade).toBeUndefined();
  });

  it('returns the last attempt for hydrate', () => {
    expect(getLastAttempt([])).toBeUndefined();
    const last = createAttemptRecord({
      selected: 'C',
      status: 'incorrect',
      attemptedAt: '2026-07-09T12:00:00.000Z',
      mode: 'quiz',
      responseText: undefined,
    });
    expect(getLastAttempt([last])).toBe(last);
  });
});

describe('engagement engine AttemptRecord v2', () => {
  it('persists recall response text and mode on the attempt', () => {
    const result = buildAuthoritativeAttemptResult({
      question,
      selected: null,
      recallAnswer: 'Beta',
      mode: 'recall',
      timeMs: 1500,
      answeredAt: '2026-07-09T12:00:00.000Z',
    });

    expect(result.status).toBe('correct');
    expect(result.progressItem.attempts[0]).toMatchObject({
      selected: null,
      status: 'correct',
      mode: 'recall',
      responseText: 'Beta',
      timeMs: 1500,
    });
  });

  it('records open-ended attempts when correctOption is null', () => {
    const openQuestion = {
      ...question,
      correctOption: null,
    };

    const result = buildAuthoritativeAttemptResult({
      question: openQuestion,
      selected: null,
      recallAnswer: 'console.log(1)',
      mode: 'recall',
      answeredAt: '2026-07-09T12:00:00.000Z',
    });

    expect(result.status).toBe('incorrect');
    expect(result.progressItem.attempts[0]).toMatchObject({
      mode: 'recall',
      responseText: 'console.log(1)',
      status: 'incorrect',
    });
  });

  it('attaches self-grade and error type to the latest attempt', () => {
    const afterAttempt = buildAuthoritativeAttemptResult({
      question,
      selected: 'A',
      mode: 'quiz',
      answeredAt: '2026-07-09T12:00:00.000Z',
    });

    const graded = buildAuthoritativeSelfGradeResult({
      questionId: 7,
      grade: 'hard',
      errorType: 'forgot',
      previousProgress: afterAttempt.progressItem,
      gradedAt: '2026-07-09T12:05:00.000Z',
    });

    expect(graded.attempts).toHaveLength(1);
    expect(graded.attempts[0]).toMatchObject({
      selected: 'A',
      status: 'incorrect',
      errorType: 'forgot',
      selfGrade: 'hard',
    });
    expect(graded.srsData?.repetition).toBe(0);
  });
});
