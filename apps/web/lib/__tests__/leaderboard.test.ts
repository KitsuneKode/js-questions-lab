import { describe, expect, it } from 'vitest';
import { currentUserRankToEntry, toEntries } from '@/lib/engagement/leaderboard-types';

describe('leaderboard entries', () => {
  it('uses sanitized display names from the server payload', () => {
    const entries = toEntries([
      { position: 1, rank: 1, display_name: 'Anonymous #1', total_xp: 120 },
    ]);

    expect(entries[0]?.displayName).toBe('Anonymous #1');
    expect(entries[0]?.level).toBe(1);
    expect(entries[0]?.levelName).toBe('Apprentice');
  });

  it('preserves stable positions and competition ranks from the server payload', () => {
    const entries = toEntries([
      { position: 1, rank: 1, display_name: 'Anonymous #1', total_xp: 200 },
      { position: 2, rank: 1, display_name: 'Anonymous #1', total_xp: 200 },
      { position: 3, rank: 3, display_name: 'Anonymous #3', total_xp: 150 },
    ]);

    expect(entries.map((entry) => [entry.position, entry.rank])).toEqual([
      [1, 1],
      [2, 1],
      [3, 3],
    ]);
  });

  it('maps current-user rank into a sticky row entry', () => {
    const entry = currentUserRankToEntry(
      {
        position: 73,
        rank: 70,
        totalXP: 820,
        level: 2,
        levelName: 'Practitioner',
      },
      'Alex',
    );

    expect(entry).toEqual({
      position: 73,
      displayName: 'Alex',
      totalXP: 820,
      level: 2,
      levelName: 'Practitioner',
      rank: 70,
    });
  });
});
