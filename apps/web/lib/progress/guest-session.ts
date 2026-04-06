const SID_KEY = 'jsq_guest_sid';

const DATA_KEYS = {
  progress: (sid: string) => `jsq_progress_v2_${sid}`,
  xp: (sid: string) => `jsq_xp_v2_${sid}`,
  streak: (sid: string) => `jsq_streak_v2_${sid}`,
};

/**
 * Returns the current guest session ID, creating and persisting a new UUID
 * if none exists yet. This is the stable identity for the current guest
 * session — consumed (cleared + rotated) when the user signs in.
 *
 * Must only be called on the client (e.g. inside useEffect).
 */
export function getOrCreateGuestSid(): string {
  if (typeof window === 'undefined') {
    throw new Error('getOrCreateGuestSid must be called on the client');
  }
  const existing = window.localStorage.getItem(SID_KEY);
  if (existing) return existing;
  const sid = crypto.randomUUID();
  window.localStorage.setItem(SID_KEY, sid);
  return sid;
}

/**
 * Generates a new guest session ID, replacing the old one. Call this on
 * sign-out (or session expiry) so the next visitor starts with a clean slate.
 * Returns the new SID.
 *
 * Must only be called on the client (e.g. inside useEffect).
 */
export function rotateGuestSid(): string {
  if (typeof window === 'undefined') {
    throw new Error('rotateGuestSid must be called on the client');
  }
  const sid = crypto.randomUUID();
  window.localStorage.setItem(SID_KEY, sid);
  return sid;
}

/**
 * Removes all localStorage data written under the given guest session ID.
 * Call this after a successful sign-in merge so the consumed session data
 * does not persist.
 */
export function clearGuestData(sid: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DATA_KEYS.progress(sid));
  window.localStorage.removeItem(DATA_KEYS.xp(sid));
  window.localStorage.removeItem(DATA_KEYS.streak(sid));
}
