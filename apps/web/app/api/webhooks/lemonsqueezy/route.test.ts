import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, test, vi } from 'vitest';

const { updateUserMetadataMock, clerkClientMock } = vi.hoisted(() => ({
  updateUserMetadataMock: vi.fn(),
  clerkClientMock: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: clerkClientMock,
}));

import { POST } from './route';

const WEBHOOK_URL = 'https://example.com/api/webhooks/lemonsqueezy';

function sign(rawBody: string): string {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('LEMONSQUEEZY_WEBHOOK_SECRET must be set in test');
  }
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

function makeRequest(rawBody: string, signature: string): Request {
  return new Request(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-signature': signature,
    },
    body: rawBody,
  });
}

beforeEach(() => {
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'test-webhook-secret';
  updateUserMetadataMock.mockReset();
  clerkClientMock.mockReset();
  clerkClientMock.mockResolvedValue({
    users: {
      updateUserMetadata: updateUserMetadataMock,
    },
  });
});

describe('Lemon Squeezy webhook route', () => {
  it('rejects when webhook secret is missing', async () => {
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    const rawBody = JSON.stringify({ meta: { event_name: 'subscription_created' } });

    const response = await POST(makeRequest(rawBody, 'any-signature'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid signature' });
    expect(updateUserMetadataMock).not.toHaveBeenCalled();
  });

  it('rejects bad signatures', async () => {
    const response = await POST(
      makeRequest('{"meta":{"event_name":"subscription_created"}}', 'bad'),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid signature' });
    expect(updateUserMetadataMock).not.toHaveBeenCalled();
  });

  it('rejects bad JSON after a valid signature', async () => {
    const rawBody = '{"meta":';
    const response = await POST(makeRequest(rawBody, sign(rawBody)));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON' });
    expect(updateUserMetadataMock).not.toHaveBeenCalled();
  });

  test.each([
    'subscription_created',
    'subscription_resumed',
    'subscription_unpaused',
  ])('sets plan to pro for %s', async (eventName) => {
    const rawBody = JSON.stringify({
      meta: {
        event_name: eventName,
        custom_data: { user_id: 'user_123' },
      },
    });

    const response = await POST(makeRequest(rawBody, sign(rawBody)));

    expect(response.status).toBe(200);
    expect(updateUserMetadataMock).toHaveBeenCalledTimes(1);
    expect(updateUserMetadataMock).toHaveBeenCalledWith('user_123', {
      publicMetadata: { plan: 'pro' },
    });
  });

  it('does not downgrade on subscription_cancelled (grace period)', async () => {
    const rawBody = JSON.stringify({
      meta: {
        event_name: 'subscription_cancelled',
        custom_data: { user_id: 'user_123' },
      },
    });

    const response = await POST(makeRequest(rawBody, sign(rawBody)));

    expect(response.status).toBe(200);
    expect(updateUserMetadataMock).not.toHaveBeenCalled();
  });

  it('sets plan to free on subscription_expired', async () => {
    const rawBody = JSON.stringify({
      meta: {
        event_name: 'subscription_expired',
        custom_data: { user_id: 'user_123' },
      },
    });

    const response = await POST(makeRequest(rawBody, sign(rawBody)));

    expect(response.status).toBe(200);
    expect(updateUserMetadataMock).toHaveBeenCalledTimes(1);
    expect(updateUserMetadataMock).toHaveBeenCalledWith('user_123', {
      publicMetadata: { plan: 'free' },
    });
  });

  it('acknowledges payloads without user_id as a safe no-op', async () => {
    const rawBody = JSON.stringify({
      meta: {
        event_name: 'subscription_created',
      },
    });

    const response = await POST(makeRequest(rawBody, sign(rawBody)));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(updateUserMetadataMock).not.toHaveBeenCalled();
  });

  it('acknowledges unhandled events without mutating user metadata', async () => {
    const rawBody = JSON.stringify({
      meta: {
        event_name: 'subscription_paused',
        custom_data: { user_id: 'user_123' },
      },
    });

    const response = await POST(makeRequest(rawBody, sign(rawBody)));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(updateUserMetadataMock).not.toHaveBeenCalled();
  });

  it('returns 500 when metadata update fails', async () => {
    updateUserMetadataMock.mockRejectedValueOnce(new Error('clerk unavailable'));
    const rawBody = JSON.stringify({
      meta: {
        event_name: 'subscription_created',
        custom_data: { user_id: 'user_123' },
      },
    });

    const response = await POST(makeRequest(rawBody, sign(rawBody)));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Internal server error' });
    expect(updateUserMetadataMock).toHaveBeenCalledTimes(1);
  });
});
