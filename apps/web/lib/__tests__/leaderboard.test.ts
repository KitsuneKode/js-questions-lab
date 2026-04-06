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
});
