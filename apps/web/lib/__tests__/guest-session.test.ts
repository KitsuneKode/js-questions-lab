import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearGuestData, getOrCreateGuestSid, rotateGuestSid } from '@/lib/progress/guest-session';

const SID_KEY = 'jsq_guest_sid';
const PROGRESS_KEY = (sid: string) => `jsq_progress_v2_${sid}`;
const XP_KEY = (sid: string) => `jsq_xp_v2_${sid}`;
const STREAK_KEY = (sid: string) => `jsq_streak_v2_${sid}`;

describe('guest session', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Ensure crypto.randomUUID is available in jsdom
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'test-uuid-1234'),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getOrCreateGuestSid', () => {
    it('creates and stores a new UUID when none exists', () => {
      const sid = getOrCreateGuestSid();
      expect(sid).toBe('test-uuid-1234');
      expect(window.localStorage.getItem(SID_KEY)).toBe('test-uuid-1234');
    });

    it('returns the existing SID without generating a new one on subsequent calls', () => {
      window.localStorage.setItem(SID_KEY, 'existing-sid-abc');
      const sid = getOrCreateGuestSid();
      expect(sid).toBe('existing-sid-abc');
      expect(crypto.randomUUID).not.toHaveBeenCalled();
    });

    it('generates a new SID when the stored value is an empty string', () => {
      window.localStorage.setItem(SID_KEY, '');
      const sid = getOrCreateGuestSid();
      expect(sid).toBe('test-uuid-1234');
    });
  });

  describe('rotateGuestSid', () => {
    it('replaces the old SID with a new UUID', () => {
      window.localStorage.setItem(SID_KEY, 'old-sid');
      vi.mocked(crypto.randomUUID).mockReturnValueOnce(
        'new-uuid-5678' as `${string}-${string}-${string}-${string}-${string}`,
      );
      const newSid = rotateGuestSid();
      expect(newSid).toBe('new-uuid-5678');
      expect(window.localStorage.getItem(SID_KEY)).toBe('new-uuid-5678');
    });

    it('returns a different value than the previous SID', () => {
      window.localStorage.setItem(SID_KEY, 'old-sid');
      vi.mocked(crypto.randomUUID).mockReturnValueOnce(
        'brand-new-id' as `${string}-${string}-${string}-${string}-${string}`,
      );
      const newSid = rotateGuestSid();
      expect(newSid).not.toBe('old-sid');
    });
  });

  describe('clearGuestData', () => {
    it('removes progress, xp, and streak keys for the given SID', () => {
      const sid = 'abc-123';
      window.localStorage.setItem(PROGRESS_KEY(sid), '{"version":2,"questions":{}}');
      window.localStorage.setItem(XP_KEY(sid), '{"version":1,"totalXP":100,"events":[]}');
      window.localStorage.setItem(
        STREAK_KEY(sid),
        '{"version":1,"currentStreak":3,"longestStreak":5,"lastActivityDate":"2026-04-06"}',
      );

      clearGuestData(sid);

      expect(window.localStorage.getItem(PROGRESS_KEY(sid))).toBeNull();
      expect(window.localStorage.getItem(XP_KEY(sid))).toBeNull();
      expect(window.localStorage.getItem(STREAK_KEY(sid))).toBeNull();
    });

    it('does not touch keys belonging to a different SID', () => {
      const sidA = 'sid-to-clear';
      const sidB = 'unrelated-sid';
      window.localStorage.setItem(PROGRESS_KEY(sidA), 'data-a');
      window.localStorage.setItem(PROGRESS_KEY(sidB), 'data-b');

      clearGuestData(sidA);

      expect(window.localStorage.getItem(PROGRESS_KEY(sidB))).toBe('data-b');
    });

    it('does not throw when the keys do not exist', () => {
      expect(() => clearGuestData('nonexistent-sid')).not.toThrow();
    });
  });
});
