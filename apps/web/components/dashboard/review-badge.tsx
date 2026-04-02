'use client';

import { useMemo } from 'react';
import { useProgress } from '@/lib/progress/progress-context';

interface ReviewBadgeProps {
  questions?: { id: number }[];
  className?: string;
}

/**
 * Counts progress items whose SRS nextReviewDate is today or earlier.
 * Works purely from localStorage progress — no question list required.
 */
export function ReviewBadge({ className = '' }: ReviewBadgeProps) {
  const { state, ready } = useProgress();

  const dueCount = useMemo(() => {
    if (!ready) return 0;
    const now = new Date();
    return Object.values(state.questions).filter((item) => {
      const srsData = item.srsData;
      if (!srsData?.nextReviewDate) return false;
      return new Date(srsData.nextReviewDate).getTime() <= now.getTime();
    }).length;
  }, [ready, state]);

  if (dueCount === 0) return null;

  return (
    <span
      className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 font-mono text-[9px] font-bold leading-none text-background tabular-nums ${className}`}
      title={`${dueCount} question${dueCount === 1 ? '' : 's'} due for review`}
    >
      {dueCount > 99 ? '99+' : dueCount}
    </span>
  );
}
