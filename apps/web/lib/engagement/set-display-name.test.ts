import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.fn();
const userFrom = vi.fn();
const writerFrom = vi.fn();
const revalidateLeaderboardCaches = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: () => auth(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: () => ({ from: userFrom }),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleSupabaseClient: () => ({ from: writerFrom }),
}));

vi.mock('@/lib/engagement/leaderboard-cache', () => ({
  revalidateLeaderboardCaches: () => revalidateLeaderboardCaches(),
}));

vi.mock('@/lib/content/loaders', () => ({
  getQuestionById: vi.fn(),
}));

import { setDisplayName } from '@/lib/engagement/actions';

describe('setDisplayName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ userId: 'user_1' });
  });

  it('updates an existing row without writing total_xp', async () => {
    userFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { user_id: 'user_1' }, error: null }),
        }),
      }),
    });

    let updatePayload: Record<string, unknown> | undefined;
    writerFrom.mockReturnValue({
      update: (payload: Record<string, unknown>) => {
        updatePayload = payload;
        return {
          eq: async () => ({ error: null }),
        };
      },
      insert: async () => {
        throw new Error('insert should not run for existing rows');
      },
    });

    const result = await setDisplayName('kitsune');

    expect(result).toEqual({ ok: true, displayName: 'kitsune' });
    expect(updatePayload).toEqual({
      display_name: 'kitsune',
      updated_at: expect.any(String),
    });
    expect(updatePayload).not.toHaveProperty('total_xp');
    expect(revalidateLeaderboardCaches).toHaveBeenCalled();
  });

  it('inserts a zero-XP row when the user has no totals yet', async () => {
    userFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    });

    let insertPayload: Record<string, unknown> | undefined;
    writerFrom.mockReturnValue({
      update: () => {
        throw new Error('update should not run when no row exists');
      },
      insert: async (payload: Record<string, unknown>) => {
        insertPayload = payload;
        return { error: null };
      },
    });

    const result = await setDisplayName('neo');

    expect(result).toEqual({ ok: true, displayName: 'neo' });
    expect(insertPayload).toMatchObject({
      user_id: 'user_1',
      total_xp: 0,
      display_name: 'neo',
    });
  });
});
