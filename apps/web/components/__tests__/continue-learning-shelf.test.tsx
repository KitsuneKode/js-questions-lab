import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const progressState = vi.hoisted(() => ({
  ready: true,
  state: {
    questions: {} as Record<
      string,
      {
        questionId: number;
        attempts: Array<{ selected: string; status: 'correct' | 'incorrect'; attemptedAt: string }>;
        bookmarked: boolean;
        updatedAt: string;
      }
    >,
  },
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/progress/progress-context', () => ({
  useProgress: () => progressState,
}));

vi.mock('@/components/intent-prefetch-link', () => ({
  IntentPrefetchLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { ContinueLearningShelf } from '@/components/continue-learning-shelf';

describe('ContinueLearningShelf', () => {
  beforeEach(() => {
    progressState.ready = true;
    progressState.state.questions = {
      '2': {
        questionId: 2,
        attempts: [{ selected: 'A', status: 'correct', attemptedAt: '2026-01-01T00:00:00.000Z' }],
        bookmarked: false,
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    };
  });

  it('renders resume card from slim question refs', () => {
    render(
      <ContinueLearningShelf
        locale="en"
        questionRefs={[
          { id: 1, title: 'First question' },
          { id: 2, title: 'Latest question' },
        ]}
      />,
    );

    expect(screen.getByText('Latest question')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('returns null when there is no answered progress', () => {
    progressState.state.questions = {};
    const { container } = render(
      <ContinueLearningShelf locale="en" questionRefs={[{ id: 1, title: 'First question' }]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
