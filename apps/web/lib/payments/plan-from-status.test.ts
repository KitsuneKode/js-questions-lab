import { describe, expect, it } from 'vitest';
import { planFromStatus } from '@/lib/payments/plan-from-status';

describe('planFromStatus', () => {
  const now = Date.parse('2026-09-10T12:00:00.000Z');

  it('keeps Pro for active and past_due', () => {
    expect(planFromStatus('active', null, now)).toBe('pro');
    expect(planFromStatus('past_due', '2026-09-11T00:00:00.000Z', now)).toBe('pro');
  });

  it('keeps Pro for cancelled subscriptions that have not ended', () => {
    expect(planFromStatus('cancelled', '2026-09-20T00:00:00.000Z', now)).toBe('pro');
  });

  it('drops Pro when cancelled access has ended', () => {
    expect(planFromStatus('cancelled', '2026-09-01T00:00:00.000Z', now)).toBe('free');
  });

  it('drops Pro on pause and expiry even if a later active event is replayed with expired status', () => {
    expect(planFromStatus('paused', null, now)).toBe('free');
    expect(planFromStatus('on_hold', null, now)).toBe('free');
    expect(planFromStatus('expired', '2026-12-01T00:00:00.000Z', now)).toBe('free');
  });
});
