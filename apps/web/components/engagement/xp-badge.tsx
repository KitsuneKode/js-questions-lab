'use client';

import { useProgress } from '@/lib/progress/progress-context';
import { cn } from '@/lib/utils';
import { getLevelInfo } from '@/lib/xp/levels';
import { getWeeklyXP } from '@/lib/xp/storage';

interface XPBadgeProps {
  className?: string;
  /** 'full' shows level name + XP progress bar, 'compact' shows level + weekly XP */
  variant?: 'full' | 'compact';
}

export function XPBadge({ className, variant = 'compact' }: XPBadgeProps) {
  const { xpState } = useProgress();
  const level = getLevelInfo(xpState.totalXP);
  const weeklyXP = getWeeklyXP(xpState.events);

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 py-1',
          className,
        )}
        title={`Level ${level.level} · ${xpState.totalXP} total XP`}
      >
        <span className="text-[10px] font-mono text-primary font-semibold">L{level.level}</span>
        <span className="text-[11px] text-secondary font-medium">{level.name}</span>
        <span className="text-[10px] font-mono text-tertiary">{weeklyXP} XP</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">
          {level.name}
          <span className="ml-1.5 text-tertiary font-normal">Lv.{level.level}</span>
        </span>
        <span className="font-mono text-tertiary">{xpState.totalXP.toLocaleString()} XP</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
          style={{ width: `${level.progress * 100}%` }}
        />
      </div>
      {level.level < 6 && (
        <p className="text-[10px] text-tertiary text-right">
          {Math.max(0, level.bandWidth - level.currentBandXP).toLocaleString()} XP to next level
        </p>
      )}
    </div>
  );
}
