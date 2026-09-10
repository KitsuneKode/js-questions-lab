import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.fn();
const getUser = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: () => auth(),
  clerkClient: async () => ({
    users: { getUser },
  }),
}));

import { requiresPro } from '@/lib/payments/pro-gate.server';

describe('requiresPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when signed out', async () => {
    auth.mockResolvedValue({ userId: null, sessionClaims: { metadata: { plan: 'pro' } } });
    await expect(requiresPro()).resolves.toBe(false);
    expect(getUser).not.toHaveBeenCalled();
  });

  it('ignores sessionClaims and reads Clerk user metadata', async () => {
    auth.mockResolvedValue({
      userId: 'user_1',
      sessionClaims: { metadata: { plan: 'pro' } },
    });
    getUser.mockResolvedValue({ publicMetadata: { plan: 'free' } });

    await expect(requiresPro()).resolves.toBe(false);
    expect(getUser).toHaveBeenCalledWith('user_1');
  });

  it('returns true when the Clerk user is Pro', async () => {
    auth.mockResolvedValue({ userId: 'user_1', sessionClaims: {} });
    getUser.mockResolvedValue({ publicMetadata: { plan: 'pro' } });

    await expect(requiresPro()).resolves.toBe(true);
  });
});
