import { beforeEach, describe, expect, it, vi } from 'vitest';

const unwrap = vi.fn();
const writerFrom = vi.fn();
const updateUserMetadata = vi.fn();

vi.mock('@/lib/payments/dodo-client', () => ({
  createDodoClient: () => ({
    webhooks: { unwrap: (...args: unknown[]) => unwrap(...args) },
  }),
  getDodoProductId: () => 'pdt_pro',
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleSupabaseClient: () => ({ from: writerFrom }),
}));

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: async () => ({
    users: { updateUserMetadata },
  }),
}));

import { POST } from '@/app/api/webhooks/dodo/route';

const WEBHOOK_URL = 'https://example.com/api/webhooks/dodo';

function makeRequest(rawBody: string, webhookId = 'wh_1'): Request {
  return new Request(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'webhook-id': webhookId,
      'webhook-signature': 'v1,sig',
      'webhook-timestamp': '1',
    },
    body: rawBody,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DODO_PAYMENTS_WEBHOOK_KEY = 'whsec_test';
  process.env.DODO_PAYMENTS_API_KEY = 'dodo_test';
  unwrap.mockReturnValue({
    type: 'subscription.active',
    data: {
      status: 'active',
      product_id: 'pdt_pro',
      checkout_session_id: 'cks_1',
    },
  });
  writerFrom.mockImplementation((table: string) => {
    if (table === 'dodo_webhook_events') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
        insert: async () => ({ error: null }),
      };
    }
    if (table === 'dodo_checkouts') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { user_id: 'user_1', product_id: 'pdt_pro' },
              error: null,
            }),
            limit: () => ({
              maybeSingle: async () => ({
                data: { user_id: 'user_1', product_id: 'pdt_pro' },
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
});

describe('Dodo webhook route', () => {
  it('rejects invalid signatures', async () => {
    unwrap.mockImplementation(() => {
      throw new Error('bad sig');
    });

    const response = await POST(makeRequest('{}'));

    expect(response.status).toBe(401);
    expect(updateUserMetadata).not.toHaveBeenCalled();
  });

  it('no-ops duplicate webhook-id', async () => {
    writerFrom.mockImplementation((table: string) => {
      if (table === 'dodo_webhook_events') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { webhook_id: 'wh_1' }, error: null }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const response = await POST(makeRequest('{}', 'wh_dup'));

    expect(response.status).toBe(200);
    expect(updateUserMetadata).not.toHaveBeenCalled();
  });

  it('sets plan to pro for a mapped active subscription', async () => {
    const response = await POST(makeRequest('{}'));

    expect(response.status).toBe(200);
    expect(updateUserMetadata).toHaveBeenCalledWith('user_1', {
      publicMetadata: { plan: 'pro' },
    });
  });
});
