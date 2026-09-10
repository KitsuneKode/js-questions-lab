import { describe, expect, it } from 'vitest';
import { type DodoWebhookStore, processDodoWebhook } from '@/lib/payments/process-webhook';

const PRODUCT = 'pdt_pro';
const now = Date.parse('2026-09-10T12:00:00.000Z');

function store(overrides: Partial<DodoWebhookStore> = {}): DodoWebhookStore & {
  plans: Array<{ userId: string; plan: 'pro' | 'free' }>;
} {
  const plans: Array<{ userId: string; plan: 'pro' | 'free' }> = [];
  return {
    plans,
    findCheckoutBySessionId: async (sessionId) =>
      sessionId === 'cks_1' ? { user_id: 'user_1', product_id: PRODUCT } : null,
    findCheckoutByUserId: async (userId) =>
      userId === 'user_1' ? { user_id: 'user_1', product_id: PRODUCT } : null,
    setUserPlan: async (userId, plan) => {
      plans.push({ userId, plan });
    },
    ...overrides,
  };
}

describe('processDodoWebhook', () => {
  it('does not restore Pro when an active event is replayed with expired status', async () => {
    const deps = store();
    const result = await processDodoWebhook(
      {
        type: 'subscription.active',
        data: {
          status: 'expired',
          product_id: PRODUCT,
          checkout_session_id: 'cks_1',
        },
      },
      deps,
      PRODUCT,
      now,
    );

    expect(result.status).toBe(200);
    expect(deps.plans).toEqual([{ userId: 'user_1', plan: 'free' }]);
  });

  it('drops Pro on subscription.paused / on_hold', async () => {
    const deps = store();
    const result = await processDodoWebhook(
      {
        type: 'subscription.paused',
        data: {
          status: 'paused',
          product_id: PRODUCT,
          metadata: { user_id: 'user_1' },
        },
      },
      deps,
      PRODUCT,
      now,
    );

    expect(result.status).toBe(200);
    expect(deps.plans).toEqual([{ userId: 'user_1', plan: 'free' }]);
  });

  it('returns 500 when checkout id and metadata user are both unknown', async () => {
    const deps = store();
    const result = await processDodoWebhook(
      {
        type: 'subscription.active',
        data: {
          status: 'active',
          product_id: PRODUCT,
        },
      },
      deps,
      PRODUCT,
      now,
    );

    expect(result).toEqual({ status: 500, body: { error: 'Unknown checkout' } });
    expect(deps.plans).toEqual([]);
  });

  it('rejects a product_id mismatch without writing Clerk', async () => {
    const deps = store();
    const result = await processDodoWebhook(
      {
        type: 'subscription.active',
        data: {
          status: 'active',
          product_id: 'pdt_other',
          checkout_session_id: 'cks_1',
        },
      },
      deps,
      PRODUCT,
      now,
    );

    expect(result).toEqual({ status: 400, body: { error: 'Product mismatch' } });
    expect(deps.plans).toEqual([]);
  });

  it('ignores spoofed metadata.user_id that does not match the checkout row', async () => {
    const deps = store();
    const result = await processDodoWebhook(
      {
        type: 'subscription.active',
        data: {
          status: 'active',
          product_id: PRODUCT,
          checkout_session_id: 'cks_1',
          metadata: { user_id: 'user_attacker' },
        },
      },
      deps,
      PRODUCT,
      now,
    );

    expect(result.status).toBe(500);
    expect(deps.plans).toEqual([]);
  });

  it('sets Pro from a mapped checkout session', async () => {
    const deps = store();
    const result = await processDodoWebhook(
      {
        type: 'subscription.active',
        data: {
          status: 'active',
          product_id: PRODUCT,
          checkout_session_id: 'cks_1',
        },
      },
      deps,
      PRODUCT,
      now,
    );

    expect(result.status).toBe(200);
    expect(deps.plans).toEqual([{ userId: 'user_1', plan: 'pro' }]);
  });
});
