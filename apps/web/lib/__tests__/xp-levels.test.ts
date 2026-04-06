import { describe, expect, it } from 'vitest';
import { getLevelInfo } from '@/lib/xp/levels';

describe('getLevelInfo', () => {
  it('returns level 1 for zero XP and level 6 for 25000+ XP', () => {
    expect(getLevelInfo(0).level).toBe(1);
    expect(getLevelInfo(25_000).level).toBe(6);
    expect(getLevelInfo(40_000).level).toBe(6);
  });

  it('keeps band math and progress consistent within a level band', () => {
    const info = getLevelInfo(1_250);

    expect(info.level).toBe(2);
    expect(info.currentBandXP).toBe(750);
    expect(info.bandWidth).toBe(1_000);
    expect(info.progress).toBe(0.75);
    expect(info.progress).toBeGreaterThanOrEqual(0);
    expect(info.progress).toBeLessThanOrEqual(1);
  });
});
