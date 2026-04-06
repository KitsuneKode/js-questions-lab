import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultXPState, readXP, writeXP } from '@/lib/xp/storage';

const sid = 'test-session-abc';
const KEY = `jsq_xp_v2_${sid}`;

describe('xp storage (session-keyed)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('writes xp state to a key scoped to the given SID', () => {
    writeXP(sid, defaultXPState);
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify(defaultXPState));
  });

  it('reads xp state from a key scoped to the given SID', () => {
    const state = { ...defaultXPState, totalXP: 250 };
    window.localStorage.setItem(KEY, JSON.stringify(state));
    expect(readXP(sid)).toEqual(state);
  });

  it('returns default state when nothing is stored for the given SID', () => {
    expect(readXP(sid)).toEqual(defaultXPState);
  });

  it('does not read from the flat legacy key', () => {
    window.localStorage.setItem('jsq_xp_v1', JSON.stringify({ ...defaultXPState, totalXP: 999 }));
    window.localStorage.setItem('jsq_xp_v2', JSON.stringify({ ...defaultXPState, totalXP: 999 }));
    expect(readXP(sid)).toEqual(defaultXPState);
  });

  it('does not throw when localStorage.setItem fails', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => writeXP(sid, defaultXPState)).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
  });
});
