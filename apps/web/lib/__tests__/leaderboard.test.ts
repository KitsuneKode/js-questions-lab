import { describe, expect, it } from 'vitest';
import { toEntries } from '@/lib/engagement/leaderboard';

describe('leaderboard entries', () => {
  it('does not leak user-id fragments in fallback display names', () => {
    const entries = toEntries([{ user_id: 'user_123456', total_xp: 120 }]);

    expect(entries[0]?.displayName).toBe('Anonymous');
  });

  it('assigns stable tie ranks using total XP then user id ordering', () => {
    const entries = toEntries([
      { user_id: 'user_b', total_xp: 200 },
      { user_id: 'user_a', total_xp: 200 },
      { user_id: 'user_c', total_xp: 150 },
    ]);

    expect(entries.map((entry) => [entry.userId, entry.rank])).toEqual([
      ['user_a', 1],
      ['user_b', 1],
      ['user_c', 3],
    ]);
  });
});
