import { describe, expect, it } from 'vitest';
import { clampReplayAttemptedAt, resolveReplayAttemptedAt } from '@/lib/engagement/guest-replay';

const now = new Date('2026-09-10T12:00:00.000Z');

describe('replay clocks', () => {
  it('drops timestamps older than 400 days', () => {
    expect(clampReplayAttemptedAt('2025-01-01T00:00:00.000Z', now)).toBeNull();
  });

  it('drops timestamps more than a minute in the future', () => {
    expect(clampReplayAttemptedAt('2026-09-10T12:02:00.000Z', now)).toBeNull();
  });

  it('accepts timestamps within the replay window', () => {
    expect(clampReplayAttemptedAt('2026-08-01T00:00:00.000Z', now)).toBe(
      '2026-08-01T00:00:00.000Z',
    );
  });

  it('skips unknown question ids without throwing', () => {
    expect(
      resolveReplayAttemptedAt(
        {
          questionId: 999_999,
          selected: 'A',
          attemptedAt: '2026-08-01T00:00:00.000Z',
          submissionId: 'guest:999999:2026-08-01T00:00:00.000Z',
        },
        now,
        { questionExists: false, alreadyPersisted: false },
      ),
    ).toBeNull();
  });
});
