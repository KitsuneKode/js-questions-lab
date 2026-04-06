import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { XPBadge } from '@/components/engagement/xp-badge';

vi.mock('@/lib/progress/progress-context', () => ({
  useProgress: vi.fn(),
}));

import { useProgress } from '@/lib/progress/progress-context';

const mockUseProgress = vi.mocked(useProgress);

function createProgressContext(overrides: Partial<ReturnType<typeof useProgress>>) {
  return {
    state: { version: 2, questions: {} },
    ready: true,
    syncStatus: 'idle' as const,
    saveAttempt: vi.fn(),
    saveSelfGrade: vi.fn(),
    toggleBookmark: vi.fn(),
    xpState: {
      version: 1,
      totalXP: 0,
      lastEarnedDate: null,
      events: [],
    },
    streakState: {
      version: 1,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
    },
    ...overrides,
  };
}

describe('XPBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows remaining XP to the next level in full variant', () => {
    mockUseProgress.mockReturnValue(
      createProgressContext({
        xpState: {
          version: 1,
          totalXP: 1_250,
          lastEarnedDate: '2026-04-08',
          events: [],
        },
      }),
    );

    render(<XPBadge variant="full" />);

    expect(screen.getByText('250 XP to next level')).toBeInTheDocument();
  });

  it('shows weekly XP instead of total XP in compact variant', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-08T12:00:00.000Z'));

    mockUseProgress.mockReturnValue(
      createProgressContext({
        xpState: {
          version: 1,
          totalXP: 1_250,
          lastEarnedDate: '2026-04-08',
          events: [
            {
              questionId: 1,
              xpDelta: 100,
              eventType: 'correct',
              timestamp: '2026-04-05T18:00:00.000Z',
            },
            {
              questionId: 2,
              xpDelta: 35,
              eventType: 'correct',
              timestamp: '2026-04-06T09:00:00.000Z',
            },
          ],
        },
      }),
    );

    render(<XPBadge variant="compact" />);

    expect(screen.getByText('35 XP')).toBeInTheDocument();
    expect(screen.queryByText('1,250 XP')).not.toBeInTheDocument();
  });
});
