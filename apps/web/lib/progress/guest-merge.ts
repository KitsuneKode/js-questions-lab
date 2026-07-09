import type { ProgressItem } from '@/lib/progress/storage';
import { defaultStreakState, type StreakState } from '@/lib/streaks/calculator';
import type { XPEvent } from '@/lib/xp/scoring';

function eventKey(event: XPEvent): string {
  return `${event.questionId}|${event.eventType}|${event.xpDelta}|${event.timestamp}`;
}

/**
 * Guest progress rows that should be upserted on sign-in.
 * Prefer the newer item by updatedAt. When guest wins, keep guest SRS
 * (including when server had none). When timestamps tie, prefer the side
 * with more attempts; still prefer guest SRS if server has none.
 */
export function mergeGuestProgressItems(
  guestItems: ProgressItem[],
  serverItems: ProgressItem[],
): ProgressItem[] {
  const serverById = new Map(serverItems.map((item) => [item.questionId, item]));
  const toSync: ProgressItem[] = [];

  for (const guest of guestItems) {
    const server = serverById.get(guest.questionId);
    if (!server) {
      toSync.push(guest);
      continue;
    }

    const guestTime = new Date(guest.updatedAt).getTime();
    const serverTime = new Date(server.updatedAt).getTime();

    if (guestTime > serverTime) {
      toSync.push({
        ...guest,
        // Prefer guest SRS when present; otherwise keep server SRS.
        srsData: guest.srsData ?? server.srsData,
        bookmarked: guest.bookmarked || server.bookmarked,
      });
      continue;
    }

    if (guestTime === serverTime && guest.attempts.length > server.attempts.length) {
      toSync.push({
        ...guest,
        srsData: guest.srsData ?? server.srsData,
        bookmarked: guest.bookmarked || server.bookmarked,
      });
    }
  }

  return toSync;
}

/**
 * Guest XP events not already present on the server (exact event fingerprint).
 */
export function mergeGuestXPEvents(guestEvents: XPEvent[], serverEvents: XPEvent[]): XPEvent[] {
  const serverKeys = new Set(serverEvents.map(eventKey));
  return guestEvents.filter((event) => !serverKeys.has(eventKey(event)));
}

export interface GuestXPImportBatch {
  submissionId: string;
  events: XPEvent[];
}

/**
 * Group guest XP events by timestamp into idempotent import batches.
 * submission_id is stable so re-running sign-in merge does not double-count.
 */
export function partitionGuestXPForImport(
  guestEvents: XPEvent[],
  serverEvents: XPEvent[],
): GuestXPImportBatch[] {
  const novel = mergeGuestXPEvents(guestEvents, serverEvents);
  const byTimestamp = new Map<string, XPEvent[]>();

  for (const event of novel) {
    const existing = byTimestamp.get(event.timestamp) ?? [];
    existing.push(event);
    byTimestamp.set(event.timestamp, existing);
  }

  return [...byTimestamp.entries()]
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([timestamp, events]) => {
      const first = events[0];
      const questionId = first?.questionId ?? 0;
      return {
        submissionId: `guest:${questionId}:${timestamp}`,
        events,
      };
    });
}

/**
 * Combine guest and server streak. Prefer the more recent activity date for
 * current streak; take the max longest streak from either side.
 */
export function mergeGuestStreak(
  guest: StreakState | null | undefined,
  server: StreakState | null | undefined,
): StreakState {
  const g = guest ?? defaultStreakState;
  const s = server ?? defaultStreakState;

  if (!g.lastActivityDate && !s.lastActivityDate) {
    return {
      ...defaultStreakState,
      longestStreak: Math.max(g.longestStreak, s.longestStreak),
    };
  }

  if (!g.lastActivityDate) {
    return { ...s, longestStreak: Math.max(g.longestStreak, s.longestStreak) };
  }

  if (!s.lastActivityDate) {
    return { ...g, longestStreak: Math.max(g.longestStreak, s.longestStreak) };
  }

  const guestNewer = g.lastActivityDate >= s.lastActivityDate;
  const primary = guestNewer ? g : s;

  return {
    version: 1,
    currentStreak: primary.currentStreak,
    longestStreak: Math.max(g.longestStreak, s.longestStreak),
    lastActivityDate: primary.lastActivityDate,
  };
}
