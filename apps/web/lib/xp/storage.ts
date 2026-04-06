import type { XPEvent } from '@/lib/xp/scoring';

export interface XPState {
  version: number;
  totalXP: number;
  /** ISO date string (YYYY-MM-DD) of the last day XP was earned. */
  lastEarnedDate: string | null;
  /** All-time XP event log — used to recompute weekly XP. */
  events: XPEvent[];
}

const BASE_KEY = 'jsq_xp_v2';
const key = (sid: string) => `${BASE_KEY}_${sid}`;

export const defaultXPState: XPState = {
  version: 1,
  totalXP: 0,
  lastEarnedDate: null,
  events: [],
};

export function isValid(value: unknown): value is XPState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as XPState;
  return (
    v.version === 1 &&
    typeof v.totalXP === 'number' &&
    Array.isArray(v.events) &&
    (v.lastEarnedDate === null || typeof v.lastEarnedDate === 'string')
  );
}

export function readXP(sid: string): XPState {
  if (typeof window === 'undefined') return defaultXPState;
  try {
    const raw = window.localStorage.getItem(key(sid));
    if (!raw) return defaultXPState;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : defaultXPState;
  } catch {
    return defaultXPState;
  }
}

export function writeXP(sid: string, state: XPState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key(sid), JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to persist XP state:', err);
  }
}

/** XP earned since the most recent Monday 00:00 UTC. */
export function getWeeklyXP(events: XPEvent[]): number {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sun, 1 = Mon
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - daysFromMonday);
  monday.setUTCHours(0, 0, 0, 0);

  return events
    .filter((e) => new Date(e.timestamp) >= monday)
    .reduce((sum, e) => sum + e.xpDelta, 0);
}

/** Clamp total XP so it never goes negative. */
export function applyXPEvents(state: XPState, newEvents: XPEvent[]): XPState {
  const delta = newEvents.reduce((sum, e) => sum + e.xpDelta, 0);
  const today = new Date().toISOString().slice(0, 10);
  return {
    ...state,
    totalXP: Math.max(0, state.totalXP + delta),
    lastEarnedDate: delta !== 0 ? today : state.lastEarnedDate,
    events: [...state.events, ...newEvents],
  };
}
