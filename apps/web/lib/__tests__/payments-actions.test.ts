import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.fn();
const currentUserMock = vi.fn();
const createSession = vi.fn();
const writerFrom = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => authMock(...args),
  currentUser: (...args: unknown[]) => currentUserMock(...args),
}));

vi.mock('@/lib/payments/dodo-client', () => ({
  createDodoClient: () => ({
    checkoutSessions: { create: (...args: unknown[]) => createSession(...args) },
  }),
  getDodoProductId: () => 'pdt_pro',
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleSupabaseClient: () => ({ from: writerFrom }),
}));

import { createProCheckout } from '@/lib/payments/actions';

const originalEnv = { ...process.env };

describe('createProCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DODO_PAYMENTS_API_KEY = 'dodo_key';
    process.env.DODO_PAYMENTS_PRODUCT_ID = 'pdt_pro';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://jsq.example.com';

    authMock.mockResolvedValue({ userId: 'user_123' });
    currentUserMock.mockResolvedValue({
      fullName: 'Dev Example',
      firstName: 'Dev',
      primaryEmailAddress: { emailAddress: 'dev@example.com' },
    });
    createSession.mockResolvedValue({
      session_id: 'cks_abc',
      checkout_url: 'https://checkout.dodopayments.com/session/test',
    });
    writerFrom.mockReturnValue({
      insert: async () => ({ error: null }),
    });
  });

  it('throws when user is not authenticated', async () => {
    authMock.mockResolvedValue({ userId: null });
    await expect(createProCheckout()).rejects.toThrow('You must be signed in to start checkout');
  });

  it('throws when primary email is missing', async () => {
    currentUserMock.mockResolvedValue({ primaryEmailAddress: null });
    await expect(createProCheckout()).rejects.toThrow(
      'User primary email is required for checkout',
    );
  });

  it('throws when NEXT_PUBLIC_SITE_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    await expect(createProCheckout()).rejects.toThrow('NEXT_PUBLIC_SITE_URL is not set');
  });

  it('records the checkout session then returns the hosted URL', async () => {
    let inserted: Record<string, unknown> | undefined;
    writerFrom.mockReturnValue({
      insert: async (row: Record<string, unknown>) => {
        inserted = row;
        return { error: null };
      },
    });

    const result = await createProCheckout();

    expect(result).toEqual({
      checkoutUrl: 'https://checkout.dodopayments.com/session/test',
    });
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        product_cart: [{ product_id: 'pdt_pro', quantity: 1 }],
        customer: expect.objectContaining({ email: 'dev@example.com' }),
        metadata: { user_id: 'user_123' },
        return_url: 'https://jsq.example.com/dashboard?upgraded=1',
      }),
    );
    expect(inserted).toEqual({
      checkout_session_id: 'cks_abc',
      user_id: 'user_123',
      product_id: 'pdt_pro',
    });
  });
});

afterAll(() => {
  process.env = { ...originalEnv };
});
