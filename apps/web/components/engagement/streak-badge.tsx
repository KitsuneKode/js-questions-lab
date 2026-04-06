'use client';

import { IconFlame } from '@tabler/icons-react';
import { useProgress } from '@/lib/progress/progress-context';
import { STREAK_MILESTONES } from '@/lib/streaks/calculator';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  className?: string;
}

export function StreakBadge({ className }: StreakBadgeProps) {
  const { streakState } = useProgress();
  const { currentStreak } = streakState;

  const isAtMilestone = STREAK_MILESTONES.includes(currentStreak);

  if (currentStreak === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1 transition-all',
        isAtMilestone
          ? 'border-primary/60 bg-primary/10 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
          : 'border-border-subtle bg-surface',
        className,
      )}
      title={`${currentStreak}-day streak`}
    >
      <IconFlame
        className={cn(
          'h-3.5 w-3.5 transition-colors',
          currentStreak >= 7 ? 'text-primary fill-primary/20' : 'text-orange-400',
        )}
      />
      <span className="text-[11px] font-semibold text-foreground tabular-nums">
        {currentStreak}
      </span>
    </div>
  );
}
