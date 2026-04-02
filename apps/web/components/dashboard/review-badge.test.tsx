import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgressProvider } from '@/lib/progress/progress-context';
import type { ProgressState } from '@/lib/progress/storage';
import { ReviewBadge } from './review-badge';

vi.mock('@/lib/progress/progress-context', () => ({
  useProgress: vi.fn(),
  ProgressProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { useProgress } from '@/lib/progress/progress-context';

const mockUseProgress = useProgress as ReturnType<typeof vi.fn>;

describe('ReviewBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockState = (
    questions: Array<{
      id: number;
      srsData?: { nextReviewDate: string | null };
    }>,
  ): ProgressState => ({
    version: 2,
    questions: Object.fromEntries(
      questions.map((q) => [
        String(q.id),
        {
          questionId: q.id,
          attempts: [],
          bookmarked: false,
          updatedAt: new Date().toISOString(),
          srsData:
            q.srsData && q.srsData.nextReviewDate
              ? {
                  repetition: 1,
                  interval: 1,
                  easeFactor: 2.5,
                  nextReviewDate: q.srsData.nextReviewDate,
                }
              : undefined,
        },
      ]),
    ),
  });

  it('returns null when no questions have SRS data', () => {
    const mockState = createMockState([{ id: 1 }, { id: 2 }]);
    mockUseProgress.mockReturnValue({ state: mockState, ready: true });

    const { container } = render(<ReviewBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when all nextReviewDate are in the future', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const mockState = createMockState([
      { id: 1, srsData: { nextReviewDate: futureDate.toISOString() } },
      { id: 2, srsData: { nextReviewDate: futureDate.toISOString() } },
    ]);
    mockUseProgress.mockReturnValue({ state: mockState, ready: true });

    const { container } = render(<ReviewBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('renders badge with correct count when some reviews are due', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const mockState = createMockState([
      { id: 1, srsData: { nextReviewDate: pastDate.toISOString() } }, // due
      { id: 2, srsData: { nextReviewDate: futureDate.toISOString() } }, // not due
      { id: 3, srsData: { nextReviewDate: pastDate.toISOString() } }, // due
    ]);
    mockUseProgress.mockReturnValue({ state: mockState, ready: true });

    render(<ReviewBadge />);

    const badge = screen.getByText('2');
    expect(badge).toBeInTheDocument();
  });

  it('handles exactly one review due', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const mockState = createMockState([
      { id: 1, srsData: { nextReviewDate: pastDate.toISOString() } },
    ]);
    mockUseProgress.mockReturnValue({ state: mockState, ready: true });

    render(<ReviewBadge />);

    const badge = screen.getByText('1');
    expect(badge).toBeInTheDocument();
  });

  it('shows 99+ for counts over 99', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const mockQuestions = Array.from({ length: 150 }, (_, i) => ({
      id: i + 1,
      srsData: { nextReviewDate: pastDate.toISOString() },
    }));
    const mockState = createMockState(mockQuestions);
    mockUseProgress.mockReturnValue({ state: mockState, ready: true });

    render(<ReviewBadge />);

    const badge = screen.getByText('99+');
    expect(badge).toBeInTheDocument();
  });

  it('returns 0 when progress is not ready', () => {
    const mockState = createMockState([
      { id: 1, srsData: { nextReviewDate: new Date().toISOString() } },
    ]);
    mockUseProgress.mockReturnValue({ state: mockState, ready: false });

    const { container } = render(<ReviewBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('handles exactly due date (today)', () => {
    const now = new Date();
    const mockState = createMockState([
      { id: 1, srsData: { nextReviewDate: now.toISOString() } }, // due today
    ]);
    mockUseProgress.mockReturnValue({ state: mockState, ready: true });

    render(<ReviewBadge />);

    const badge = screen.getByText('1');
    expect(badge).toBeInTheDocument();
  });

  it('has correct accessibility title', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const mockState = createMockState([
      { id: 1, srsData: { nextReviewDate: pastDate.toISOString() } },
    ]);
    mockUseProgress.mockReturnValue({ state: mockState, ready: true });

    render(<ReviewBadge />);

    const badge = screen.getByTitle('1 question due for review');
    expect(badge).toBeInTheDocument();
  });
});
