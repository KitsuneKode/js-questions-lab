import { describe, expect, it } from 'vitest';
import { toEntries } from '@/lib/engagement/leaderboard';

describe('leaderboard entries', () => {
  it('uses sanitized display names from the server payload', () => {
    const entries = toEntries([{ position: 1, rank: 1, display_name: 'Anonymous', total_xp: 120 }]);

    expect(entries[0]?.displayName).toBe('Anonymous');
  });

  it('preserves stable positions and competition ranks from the server payload', () => {
    const entries = toEntries([
      { position: 1, rank: 1, display_name: 'Anonymous', total_xp: 200 },
      { position: 2, rank: 1, display_name: 'Anonymous', total_xp: 200 },
      { position: 3, rank: 3, display_name: 'Anonymous', total_xp: 150 },
    ]);

    expect(entries.map((entry) => [entry.position, entry.rank])).toEqual([
      [1, 1],
      [2, 1],
      [3, 3],
    ]);
  });

  it('defaults currentStreak to 0 when missing from payload', () => {
    const entries = toEntries([{ position: 1, rank: 1, display_name: 'Anonymous', total_xp: 50 }]);

    expect(entries[0]?.currentStreak).toBe(0);
  });

  it('defaults isPro to false when missing from payload', () => {
    const entries = toEntries([{ position: 1, rank: 1, display_name: 'Anonymous', total_xp: 50 }]);

    expect(entries[0]?.isPro).toBe(false);
  });

  it('passes through currentStreak and isPro from payload', () => {
    const entries = toEntries([
      {
        position: 1,
        rank: 1,
        display_name: 'Anonymous',
        total_xp: 500,
        current_streak: 14,
        is_pro: true,
      },
    ]);

    expect(entries[0]?.currentStreak).toBe(14);
    expect(entries[0]?.isPro).toBe(true);
  });

  it('clamps negative XP to 0', () => {
    const entries = toEntries([{ position: 1, rank: 1, display_name: 'Anonymous', total_xp: -5 }]);

    expect(entries[0]?.totalXP).toBe(0);
  });
});
