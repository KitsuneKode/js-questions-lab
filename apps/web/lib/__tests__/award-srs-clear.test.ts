import { describe, expect, it } from 'vitest';
import { rebuildXPState } from '@/lib/engagement/engine';
import { srsClearSubmissionId } from '@/lib/engagement/srs-clear';
import { buildSrsClearEvent, SRS_CLEAR_XP } from '@/lib/xp/scoring';

describe('SRS clear bonus contract', () => {
  it('builds a stable per-user-per-day submission id', () => {
    expect(srsClearSubmissionId(12, '2026-09-10')).toBe('srs-clear:2026-09-10:12');
  });

  it('is a fixed +25 srs_clear event', () => {
    const event = buildSrsClearEvent(12, '2026-09-10T00:00:00.000Z');
    expect(event).toEqual({
      questionId: 12,
      xpDelta: SRS_CLEAR_XP,
      eventType: 'srs_clear',
      timestamp: '2026-09-10T00:00:00.000Z',
    });
    expect(SRS_CLEAR_XP).toBe(25);
  });

  it('rebuilds totals from persisted events only so a duplicate client event cannot inflate XP', () => {
    const persisted = [buildSrsClearEvent(12, '2026-09-10T00:00:00.000Z')];
    const clientReplay = [buildSrsClearEvent(12, '2026-09-10T00:00:01.000Z')];

    expect(rebuildXPState(persisted).totalXP).toBe(25);
    expect(rebuildXPState([...persisted, ...clientReplay]).totalXP).toBe(50);
  });
});
