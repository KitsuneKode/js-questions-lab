import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { authMock, currentUserMock, createCheckoutMock, lemonSqueezySetupMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  currentUserMock: vi.fn(),
  createCheckoutMock: vi.fn(),
  lemonSqueezySetupMock: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
  currentUser: currentUserMock,
}));

vi.mock('@lemonsqueezy/lemonsqueezy.js', () => ({
  createCheckout: createCheckoutMock,
  lemonSqueezySetup: lemonSqueezySetupMock,
}));

import { createProCheckout } from '@/lib/payments/actions';

const originalEnv = { ...process.env };

describe('createProCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.LEMONSQUEEZY_API_KEY = 'ls_api_key';
    process.env.LEMONSQUEEZY_STORE_ID = 'store_123';
    process.env.LEMONSQUEEZY_VARIANT_ID = 'variant_456';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://jsq.example.com';

    authMock.mockResolvedValue({ userId: 'user_123' });
    currentUserMock.mockResolvedValue({
      primaryEmailAddress: { emailAddress: 'dev@example.com' },
    });
    createCheckoutMock.mockResolvedValue({
      data: {
        data: {
          attributes: {
            url: 'https://checkout.lemonsqueezy.com/buy/test',
          },
        },
      },
      error: null,
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

  it('throws when store or variant env is missing', async () => {
    delete process.env.LEMONSQUEEZY_STORE_ID;

    await expect(createProCheckout()).rejects.toThrow(
      'LEMONSQUEEZY_STORE_ID or LEMONSQUEEZY_VARIANT_ID is not set',
    );
  });

  it('throws when NEXT_PUBLIC_SITE_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;

    await expect(createProCheckout()).rejects.toThrow('NEXT_PUBLIC_SITE_URL is not set');
  });

  it('throws when Lemon Squeezy returns an error', async () => {
    createCheckoutMock.mockResolvedValue({
      data: null,
      error: { message: 'provider unavailable' },
    });

    await expect(createProCheckout()).rejects.toThrow(
      'Failed to create checkout: provider unavailable',
    );
  });

  it('returns checkout URL for a valid request', async () => {
    const result = await createProCheckout();

    expect(result).toEqual({
      checkoutUrl: 'https://checkout.lemonsqueezy.com/buy/test',
    });
    expect(lemonSqueezySetupMock).toHaveBeenCalledWith({ apiKey: 'ls_api_key' });
    expect(createCheckoutMock).toHaveBeenCalledWith(
      'store_123',
      'variant_456',
      expect.objectContaining({
        checkoutData: expect.objectContaining({
          email: 'dev@example.com',
          custom: { user_id: 'user_123' },
        }),
        productOptions: {
          redirectUrl: 'https://jsq.example.com/dashboard?upgraded=1',
        },
      }),
    );
  });
});

afterAll(() => {
  process.env = { ...originalEnv };
});
