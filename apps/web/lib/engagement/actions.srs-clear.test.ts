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

import * as actions from '@/lib/engagement/actions';
import { awardSrsClearBonus } from '@/lib/engagement/actions';

function selectChain(data: unknown) {
  return {
    select: () => ({
      eq: () => ({
        order: async () => ({ data, error: null }),
      }),
    }),
  };
}

describe('awardSrsClearBonus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ userId: 'user_1' });
  });

  it('does not export a generic XP injector', () => {
    expect('appendXPEvents' in actions).toBe(false);
    expect(typeof actions.awardSrsClearBonus).toBe('function');
  });

  it('rebuilds totals from persisted events so duplicate same-day awards cannot inflate XP', async () => {
    const persisted = [
      {
        question_id: 12,
        event_type: 'srs_clear',
        xp_delta: 25,
        created_at: '2026-09-10T00:00:00.000Z',
      },
    ];

    let totalsPayload: { total_xp?: number } | undefined;
    writerFrom.mockImplementation((table: string) => {
      if (table === 'xp_events') {
        return {
          upsert: async () => ({ error: null }),
          ...selectChain(persisted),
        };
      }
      if (table === 'user_xp_totals') {
        return {
          upsert: async (row: { total_xp: number }) => {
            totalsPayload = row;
            return { error: null };
          },
        };
      }
      throw new Error(`unexpected writer table ${table}`);
    });

    const next = await awardSrsClearBonus(12);

    expect(next?.totalXP).toBe(25);
    expect(totalsPayload?.total_xp).toBe(25);
    expect(revalidateLeaderboardCaches).toHaveBeenCalled();
  });

  it('returns null when signed out', async () => {
    auth.mockResolvedValue({ userId: null });
    await expect(awardSrsClearBonus(12)).resolves.toBeNull();
    expect(writerFrom).not.toHaveBeenCalled();
  });
});
