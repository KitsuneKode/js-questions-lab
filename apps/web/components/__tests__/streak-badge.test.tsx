import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StreakBadge } from '@/components/engagement/streak-badge';

vi.mock('@/lib/progress/progress-context', () => ({
  useProgress: vi.fn(),
}));

import { useProgress } from '@/lib/progress/progress-context';

const mockUseProgress = vi.mocked(useProgress);

function createProgressContext(overrides: Partial<ReturnType<typeof useProgress>>) {
  return {
    state: { version: 2, questions: {} },
    reactState: { version: 1 as const, questions: {} },
    ready: true,
    syncStatus: 'idle' as const,
    saveAttempt: vi.fn(),
    saveSelfGrade: vi.fn(),
    saveReactAttempt: vi.fn(),
    saveReactSelfGrade: vi.fn(),
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

describe('StreakBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when the current streak is zero', () => {
    mockUseProgress.mockReturnValue(
      createProgressContext({
        streakState: {
          version: 1,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
        },
      }),
    );

    const { container } = render(<StreakBadge />);

    expect(container.firstChild).toBeNull();
  });

  it('shows the amber glow styling at streaks of 7 or higher', () => {
    mockUseProgress.mockReturnValue(
      createProgressContext({
        streakState: {
          version: 1,
          currentStreak: 7,
          longestStreak: 7,
          lastActivityDate: '2026-04-08',
        },
      }),
    );

    render(<StreakBadge />);

    const badge = screen.getByTitle('7-day streak');
    expect(badge.className).toContain('bg-primary/10');
    expect(badge.className).toContain('shadow-[0_0_12px_rgba(245,158,11,0.2)]');
  });
});
