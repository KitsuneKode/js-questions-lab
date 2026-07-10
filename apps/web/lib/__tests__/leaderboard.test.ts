import { describe, expect, it } from 'vitest';
import { toEntries } from '@/lib/engagement/leaderboard';

describe('leaderboard entries', () => {
  it('uses sanitized display names from the server payload', () => {
    const entries = toEntries([
      { position: 1, rank: 1, display_name: 'Anonymous', total_xp: 120, current_streak: 0 },
    ]);

    expect(entries[0]?.displayName).toBe('Anonymous');
    expect(entries[0]?.currentStreak).toBe(0);
  });

  it('maps current streak from the server payload', () => {
    const entries = toEntries([
      { position: 1, rank: 1, display_name: 'Ace', total_xp: 500, current_streak: 7 },
    ]);

    expect(entries[0]?.currentStreak).toBe(7);
  });

  it('defaults missing streak to zero', () => {
    const entries = toEntries([{ position: 1, rank: 1, display_name: 'Ace', total_xp: 500 }]);

    expect(entries[0]?.currentStreak).toBe(0);
  });

  it('preserves stable positions and competition ranks from the server payload', () => {
    const entries = toEntries([
      { position: 1, rank: 1, display_name: 'Anonymous', total_xp: 200, current_streak: 3 },
      { position: 2, rank: 1, display_name: 'Anonymous', total_xp: 200, current_streak: 1 },
      { position: 3, rank: 3, display_name: 'Anonymous', total_xp: 150, current_streak: null },
    ]);

    expect(entries.map((entry) => [entry.position, entry.rank])).toEqual([
      [1, 1],
      [2, 1],
      [3, 3],
    ]);
  });
});
