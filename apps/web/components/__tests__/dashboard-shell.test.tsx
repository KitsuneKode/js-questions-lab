import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const analyticsState = vi.hoisted(() => ({
  ready: true,
  overall: { totalAnswered: 2 },
  tagStats: [] as unknown[],
  dailyActivity: [] as unknown[],
  weakestTopics: [] as unknown[],
  topicMastery: [] as unknown[],
  reviewQueue: [] as Array<{ id: number }>,
  continueLearning: { question: null, labelKey: 'continue', description: '' },
  recommended: { question: null, labelKey: 'recommended', description: '' },
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/progress/progress-context', () => ({
  useProgress: () => ({
    xpState: { totalXP: 0 },
    streakState: { currentStreak: 0, longestStreak: 0 },
  }),
}));

vi.mock('@/lib/progress/use-analytics', () => ({
  useAnalytics: () => analyticsState,
}));

vi.mock('@/components/intent-prefetch-link', () => ({
  IntentPrefetchLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/components/dashboard/activity-chart', () => ({ ActivityChart: () => null }));
vi.mock('@/components/dashboard/bookmarked-list', () => ({ BookmarkedList: () => null }));
vi.mock('@/components/dashboard/mastery-paths-grid', () => ({ MasteryPathsGrid: () => null }));
vi.mock('@/components/dashboard/overview-cards', () => ({ OverviewCards: () => null }));
vi.mock('@/components/dashboard/recent-activity', () => ({ RecentActivity: () => null }));
vi.mock('@/components/dashboard/review-queue', () => ({ ReviewQueue: () => null }));
vi.mock('@/components/dashboard/topic-accuracy-chart', () => ({ TopicAccuracyChart: () => null }));
vi.mock('@/components/dashboard/weakest-topics', () => ({ WeakestTopics: () => null }));
vi.mock('@/components/engagement/streak-badge', () => ({ StreakBadge: () => null }));
vi.mock('@/components/engagement/xp-badge', () => ({ XPBadge: () => null }));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

import { DashboardShell } from '@/components/dashboard/dashboard-shell';

const questions = [
  {
    id: 12,
    title: 'Review me',
    difficulty: 'beginner' as const,
    tags: ['scope'],
    slug: 'review-me',
    locale: 'en',
    runnable: true,
  },
];

describe('DashboardShell daily review CTA', () => {
  beforeEach(() => {
    analyticsState.ready = true;
    analyticsState.reviewQueue = [];
  });

  it('opens the first due question in review mode', () => {
    analyticsState.reviewQueue = [{ id: 12 }];

    render(<DashboardShell questions={questions} locale="en" />);

    expect(screen.getByRole('link', { name: /dailyReviewCta/ })).toHaveAttribute(
      'href',
      '/en/questions/12?status=review',
    );
  });
});
