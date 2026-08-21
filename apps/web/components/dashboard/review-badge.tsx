'use client';

import { useMemo } from 'react';
import { countDueReviews } from '@/lib/progress/analytics';
import { useProgress } from '@/lib/progress/progress-context';

interface ReviewBadgeProps {
  questions?: { id: number }[];
  className?: string;
}

/**
 * Header badge showing SRS-due review count (lightweight — no question list).
 * The `/review` page uses the full queue via `getReviewQueue`, which also
 * includes legacy fallbacks for items answered before SRS was implemented.
 */
export function ReviewBadge({ className = '' }: ReviewBadgeProps) {
  const { state, ready } = useProgress();

  const dueCount = useMemo(() => {
    if (!ready) return 0;
    return countDueReviews(state);
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
