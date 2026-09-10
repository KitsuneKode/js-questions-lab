import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getOrCreateGuestSid } from '@/lib/progress/guest-session';
import { ProgressProvider, useProgress } from '@/lib/progress/progress-context';
import { defaultProgressState, writeProgress } from '@/lib/progress/storage';
import { defaultStreakState } from '@/lib/streaks/calculator';
import { writeStreak } from '@/lib/streaks/storage';
import { defaultXPState, writeXP } from '@/lib/xp/storage';

const replayGuestAttempts = vi.fn();
const upsertStreak = vi.fn();
const syncProgressToServer = vi.fn();
const fetchServerProgress = vi.fn();
const fetchXPState = vi.fn();
const fetchStreak = vi.fn();

vi.mock('@/lib/auth-utils', () => ({
  useSafeAuth: () => ({ isSignedIn: true }),
}));

vi.mock('@/lib/engagement/actions', () => ({
  recordAttempt: vi.fn(),
  applyServerSelfGrade: vi.fn(),
  awardSrsClearBonus: vi.fn(),
  fetchXPState: (...args: unknown[]) => fetchXPState(...args),
  fetchStreak: (...args: unknown[]) => fetchStreak(...args),
  replayGuestAttempts: (...args: unknown[]) => replayGuestAttempts(...args),
  upsertStreak: (...args: unknown[]) => upsertStreak(...args),
}));

vi.mock('@/lib/progress/actions', () => ({
  fetchServerProgress: (...args: unknown[]) => fetchServerProgress(...args),
  syncProgressToServer: (...args: unknown[]) => syncProgressToServer(...args),
  upsertSingleQuestion: vi.fn(),
}));

describe('ProgressProvider sign-in merge', () => {
  // Date-relative so the streak-merge assertions never go stale (a streak
  // older than yesterday is legitimately zeroed by mergeStreakStates).
  const yesterdayDate = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const attemptedAt = `${yesterdayDate}T12:00:00.000Z`;

  const replayedXP = {
    version: 1,
    totalXP: 30,
    lastEarnedDate: yesterdayDate,
    events: [
      {
        questionId: 1,
        xpDelta: 30,
        eventType: 'correct' as const,
        timestamp: attemptedAt,
      },
    ],
  };

  const replayedStreak = {
    version: 1,
    currentStreak: 2,
    longestStreak: 2,
    lastActivityDate: yesterdayDate,
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    const guestSid = getOrCreateGuestSid();

    writeProgress(guestSid, {
      ...defaultProgressState,
      questions: {
        '1': {
          questionId: 1,
          attempts: [{ selected: 'A', status: 'correct', attemptedAt }],
          bookmarked: true,
          updatedAt: attemptedAt,
        },
      },
    });

    writeStreak(guestSid, {
      version: 1,
      currentStreak: 5,
      longestStreak: 5,
      lastActivityDate: yesterdayDate,
    });

    writeXP(guestSid, {
      version: 1,
      totalXP: 25,
      lastEarnedDate: yesterdayDate,
      events: [
        {
          questionId: 1,
          xpDelta: 25,
          eventType: 'correct' as const,
          timestamp: attemptedAt,
        },
      ],
    });

    fetchServerProgress.mockResolvedValue([]);
    fetchXPState.mockResolvedValue(defaultXPState);
    fetchStreak.mockResolvedValue(defaultStreakState);
    replayGuestAttempts.mockResolvedValue({
      xpState: replayedXP,
      streakState: replayedStreak,
    });
    upsertStreak.mockImplementation(async (state: unknown) => state);
    syncProgressToServer.mockResolvedValue(undefined);
  });

  it('replays guest attempts before syncing progress, merges XP/streak, and clears guest storage', async () => {
    const oldSid = getOrCreateGuestSid();

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ProgressProvider>{children}</ProgressProvider>
    );

    const { result } = renderHook(() => useProgress(), { wrapper });

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('idle');
    });

    expect(replayGuestAttempts).toHaveBeenCalledTimes(1);
    expect(replayGuestAttempts.mock.calls[0]?.[0]).toEqual([
      {
        questionId: 1,
        selected: 'A',
        attemptedAt,
        submissionId: `guest:1:${attemptedAt}`,
      },
    ]);

    expect(syncProgressToServer).toHaveBeenCalledTimes(1);
    const replayOrder = replayGuestAttempts.mock.invocationCallOrder[0];
    const syncOrder = syncProgressToServer.mock.invocationCallOrder[0];
    expect(replayOrder).toBeDefined();
    expect(syncOrder).toBeDefined();
    expect(replayOrder).toBeLessThan(syncOrder as number);

    expect(result.current.xpState.totalXP).toBe(30);
    expect(result.current.streakState.currentStreak).toBe(2);
    expect(result.current.streakState.longestStreak).toBe(2);

    expect(localStorage.getItem(`jsq_progress_v2_${oldSid}`)).toBeNull();
    expect(localStorage.getItem(`jsq_xp_v2_${oldSid}`)).toBeNull();
    expect(localStorage.getItem(`jsq_streak_v2_${oldSid}`)).toBeNull();

    expect(upsertStreak).not.toHaveBeenCalled();
    expect(syncProgressToServer).toHaveBeenCalledWith([
      expect.objectContaining({
        questionId: 1,
        bookmarked: true,
        attempts: [],
      }),
    ]);
  });

  // First mount with isSignedIn=true still runs the merge path because wasSignedInForMergeRef
  // starts false. Subsequent effect re-runs in the same session (e.g. Strict Mode cleanup +
  // re-setup) hydrate from server only — replay/sync/upsertStreak are skipped.
});
