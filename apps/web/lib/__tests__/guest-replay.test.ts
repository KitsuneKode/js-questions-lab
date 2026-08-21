import { describe, expect, it } from 'vitest';
import { buildGuestSubmissionId, listGuestAttemptsToReplay } from '@/lib/engagement/guest-replay';
import type { ProgressItem, ProgressState } from '@/lib/progress/storage';

function item(partial: Partial<ProgressItem> & { questionId: number }): ProgressItem {
  return {
    attempts: [],
    bookmarked: false,
    updatedAt: '2026-07-09T12:00:00.000Z',
    ...partial,
  };
}

describe('guest-replay', () => {
  it('builds a stable submissionId from questionId + attemptedAt', () => {
    expect(buildGuestSubmissionId(7, '2026-07-09T12:00:00.000Z')).toBe(
      'guest:7:2026-07-09T12:00:00.000Z',
    );
  });

  it('replays guest attempts that are missing or newer than server', () => {
    const guest: ProgressState = {
      version: 1,
      questions: {
        '7': item({
          questionId: 7,
          attempts: [
            { selected: 'A', status: 'incorrect', attemptedAt: '2026-07-08T10:00:00.000Z' },
            { selected: 'B', status: 'correct', attemptedAt: '2026-07-09T10:00:00.000Z' },
          ],
          updatedAt: '2026-07-09T10:00:00.000Z',
        }),
        '8': item({
          questionId: 8,
          attempts: [{ selected: 'C', status: 'correct', attemptedAt: '2026-07-09T11:00:00.000Z' }],
          updatedAt: '2026-07-09T11:00:00.000Z',
        }),
      },
    };

    const serverItems: ProgressItem[] = [
      item({
        questionId: 7,
        attempts: [{ selected: 'A', status: 'incorrect', attemptedAt: '2026-07-08T10:00:00.000Z' }],
        updatedAt: '2026-07-08T10:00:00.000Z',
      }),
    ];

    const replay = listGuestAttemptsToReplay(guest, serverItems);
    expect(
      replay.map((r) => ({ q: r.questionId, at: r.attemptedAt, selected: r.selected })),
    ).toEqual([
      { q: 7, at: '2026-07-09T10:00:00.000Z', selected: 'B' },
      { q: 8, at: '2026-07-09T11:00:00.000Z', selected: 'C' },
    ]);
  });

  it('returns empty when guest has nothing newer', () => {
    const guest: ProgressState = {
      version: 1,
      questions: {
        '7': item({
          questionId: 7,
          attempts: [{ selected: 'B', status: 'correct', attemptedAt: '2026-07-08T10:00:00.000Z' }],
          updatedAt: '2026-07-08T10:00:00.000Z',
        }),
      },
    };
    const serverItems: ProgressItem[] = [
      item({
        questionId: 7,
        attempts: [{ selected: 'B', status: 'correct', attemptedAt: '2026-07-08T10:00:00.000Z' }],
        updatedAt: '2026-07-09T12:00:00.000Z',
      }),
    ];
    expect(listGuestAttemptsToReplay(guest, serverItems)).toEqual([]);
  });
});
