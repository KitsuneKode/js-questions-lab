import { describe, expect, it } from 'vitest';
import { buildAuthoritativeAttemptResult } from '@/lib/engagement/engine';
import { computeQuestionStats } from '@/lib/progress/analytics';

const openEndedQuestion = {
  id: 88,
  difficulty: 'intermediate' as const,
  correctOption: null,
  options: [
    { key: 'A' as const, text: 'Alpha' },
    { key: 'B' as const, text: 'Beta' },
    { key: 'C' as const, text: 'Gamma' },
    { key: 'D' as const, text: 'Delta' },
  ],
};

describe('unjudgeable attempts', () => {
  it('stores recall history without XP when the question has no correct option', () => {
    const result = buildAuthoritativeAttemptResult({
      question: openEndedQuestion,
      selected: null,
      recallAnswer: 'maybe this output',
      answeredAt: '2026-09-10T12:00:00.000Z',
    });

    expect(result.xpEvents).toEqual([]);
    expect(result.status).toBe('incorrect');
    expect(result.progressItem.attempts).toHaveLength(1);
    expect(result.progressItem.attempts[0]).toMatchObject({
      unjudgeable: true,
      status: 'incorrect',
      responseText: 'maybe this output',
      mode: 'recall',
    });

    const stats = computeQuestionStats(result.progressItem);
    expect(stats.totalAttempts).toBe(0);
    expect(stats.accuracy).toBe(0);
    expect(stats.lastStatus).toBe('incorrect');
  });
});
