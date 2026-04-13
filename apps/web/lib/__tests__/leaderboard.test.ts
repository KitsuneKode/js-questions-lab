import { describe, expect, it } from 'vitest';
import { computeStats, extractPodium } from '@/components/leaderboard/leaderboard-table';
import { toEntries } from '@/lib/engagement/leaderboard';

// Helper to create a single entry from raw data
function entry(position: number, rank: number, name: string, xp: number) {
  const entries = toEntries([{ position, rank, display_name: name, total_xp: xp }]);
  return entries[0];
}

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

    expect(entries.map((e) => [e.position, e.rank])).toEqual([
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

describe('extractPodium', () => {
  const mockEntries = Array.from({ length: 10 }, (_, i) => {
    const e = entry(i + 1, i + 1, `User ${i + 1}`, (10 - i) * 100);
    return (
      e ?? {
        position: 0,
        displayName: '',
        totalXP: 0,
        level: 1,
        levelName: '',
        rank: 0,
        currentStreak: 0,
        isPro: false,
      }
    );
  });

  it('extracts top 3 as podium', () => {
    const { podium } = extractPodium(mockEntries);
    expect(podium).toHaveLength(3);
    expect(podium[0]?.position).toBe(1);
    expect(podium[2]?.position).toBe(3);
  });

  it('returns remaining entries as rest', () => {
    const { rest } = extractPodium(mockEntries);
    expect(rest).toHaveLength(7);
    expect(rest[0]?.position).toBe(4);
  });

  it('handles fewer than 3 entries gracefully', () => {
    const { podium, rest } = extractPodium(mockEntries.slice(0, 2));
    expect(podium).toHaveLength(2);
    expect(rest).toHaveLength(0);
  });

  it('handles empty entries', () => {
    const { podium, rest } = extractPodium([]);
    expect(podium).toHaveLength(0);
    expect(rest).toHaveLength(0);
  });
});

describe('computeStats', () => {
  const mockEntries = [entry(1, 1, 'A', 500), entry(2, 2, 'B', 300), entry(3, 3, 'C', 200)].filter(
    (e): e is NonNullable<typeof e> => e !== undefined,
  );

  it('counts total participants', () => {
    const stats = computeStats(mockEntries);
    expect(stats.totalParticipants).toBe(3);
  });

  it('sums total XP', () => {
    const stats = computeStats(mockEntries);
    expect(stats.totalWeeklyXP).toBe(1000);
  });

  it('handles empty entries', () => {
    const stats = computeStats([]);
    expect(stats.totalParticipants).toBe(0);
    expect(stats.totalWeeklyXP).toBe(0);
  });
});
