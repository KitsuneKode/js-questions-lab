import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { QuestionSummary } from '@/lib/content/types';

const analyticsState = vi.hoisted(() => ({
  ready: true,
  reviewQueue: [] as QuestionSummary[],
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: { count?: number }) =>
    params?.count !== undefined ? `${key}:${params.count}` : key,
}));

vi.mock('@/lib/progress/use-analytics', () => ({
  useAnalytics: () => analyticsState,
}));

vi.mock('@/components/intent-prefetch-link', () => ({
  IntentPrefetchLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { ReviewStartClient } from '@/components/dashboard/review-start-client';

const questions: QuestionSummary[] = [
  {
    id: 1,
    title: 'First question',
    difficulty: 'beginner',
    tags: ['scope'],
    slug: 'first-question',
    locale: 'en',
    runnable: true,
  },
  {
    id: 2,
    title: 'Second question',
    difficulty: 'intermediate',
    tags: ['closures'],
    slug: 'second-question',
    locale: 'en',
    runnable: true,
  },
];

describe('ReviewStartClient', () => {
  beforeEach(() => {
    analyticsState.ready = true;
    analyticsState.reviewQueue = [];
  });

  it('shows empty state when review queue is empty', () => {
    render(<ReviewStartClient locale="en" questions={questions} />);

    expect(screen.getByText('reviewPageTitle')).toBeInTheDocument();
    expect(screen.getByText('reviewEmpty')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'browseQuestions' })).toHaveAttribute(
      'href',
      '/en/questions',
    );
  });

  it('shows start review CTA when queue has items', () => {
    analyticsState.reviewQueue = [questions[0]!, questions[1]!];

    render(<ReviewStartClient locale="en" questions={questions} />);

    expect(screen.getByText('reviewsDueDesc:2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /startReview/ })).toHaveAttribute(
      'href',
      '/en/questions/1?status=review',
    );
    expect(screen.getByRole('link', { name: /#2 Second question/ })).toHaveAttribute(
      'href',
      '/en/questions/2?status=review',
    );
  });

  it('shows loading state when analytics is not ready', () => {
    analyticsState.ready = false;

    render(<ReviewStartClient locale="en" questions={questions} />);

    expect(screen.getByText('loading')).toBeInTheDocument();
  });
});
