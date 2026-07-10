import { render, screen } from '@testing-library/react';
import type { HTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { OverviewCards } from '@/components/dashboard/overview-cards';
import type { OverallStats } from '@/lib/progress/analytics';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    const templates: Record<string, string> = {
      xpLevelRequirement: '{count} XP to {name}',
      xpLevelMax: 'Max level reached',
    };
    const template = templates[key] ?? key;
    if (!values) return template;
    return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), template);
  },
}));

vi.mock('motion/react', () => ({
  motion: {
    div: (props: HTMLAttributes<HTMLDivElement>) => <div {...props} />,
  },
}));

const baseOverall: OverallStats = {
  totalAnswered: 10,
  totalCorrect: 8,
  totalAttempts: 12,
  overallAccuracy: 0.67,
  bookmarkedCount: 2,
  currentStreak: 3,
  longestStreak: 5,
};

describe('OverviewCards', () => {
  it('shows Apprentice at level 1, uses totalQuestions prop, and not hardcoded 155', () => {
    render(<OverviewCards overall={baseOverall} totalQuestions={200} totalXP={0} />);

    expect(screen.getByText(/Level 1 · Apprentice/)).toBeInTheDocument();
    expect(screen.getByText(/\/ 200/)).toBeInTheDocument();
    expect(screen.queryByText('155')).not.toBeInTheDocument();
    expect(screen.getByText('500 XP to Practitioner')).toBeInTheDocument();
  });

  it('shows Practitioner at level 2 when totalXP is 500', () => {
    render(<OverviewCards overall={baseOverall} totalQuestions={200} totalXP={500} />);

    expect(screen.getByText(/Level 2 · Practitioner/)).toBeInTheDocument();
    expect(screen.getByText('1000 XP to Engineer')).toBeInTheDocument();
  });
});
