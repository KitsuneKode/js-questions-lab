'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { LeaderboardEntry } from '@/lib/engagement/leaderboard';
import { cn } from '@/lib/utils';

const LEVEL_COLOURS: Record<number, string> = {
  1: 'border-zinc-600/40 text-zinc-400',
  2: 'border-sky-600/40 text-sky-400',
  3: 'border-emerald-600/40 text-emerald-400',
  4: 'border-violet-600/40 text-violet-400',
  5: 'border-primary/40 text-primary',
  6: 'border-yellow-400/50 text-yellow-400',
};

interface LeaderboardUserPositionProps {
  entry: LeaderboardEntry;
}

export function LeaderboardUserPosition({ entry }: LeaderboardUserPositionProps) {
  const format = useFormatter();
  const t = useTranslations('leaderboard');

  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 mt-3 flex items-center gap-3 rounded-xl border px-4 py-3',
        'border-primary/30 bg-zinc-950/90 backdrop-blur-xl',
        'shadow-[0_-4px_24px_rgba(0,0,0,0.4)]',
      )}
    >
      {/* Rank */}
      <div className="flex h-7 w-10 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 font-mono text-[11px] font-bold text-primary">
        #{entry.position}
      </div>

      {/* Avatar */}
      <div
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-[11px] font-bold tracking-wider text-primary select-none"
      >
        YO
      </div>

      {/* Name + level */}
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-primary">{t('stickyYou')}</span>
        <div className="mt-0.5">
          <Badge
            variant="outline"
            className={cn(
              'h-[18px] rounded border px-1.5 font-mono text-[9px] uppercase tracking-widest',
              LEVEL_COLOURS[entry.level] ?? 'border-zinc-600/40 text-zinc-400',
            )}
          >
            Lv.{entry.level}&nbsp;{entry.levelName}
          </Badge>
        </div>
      </div>

      {/* XP */}
      <div className="shrink-0 text-right">
        <div className="font-mono text-sm font-semibold tabular-nums text-primary">
          {format.number(entry.totalXP)}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">XP</div>
      </div>
    </div>
  );
}
