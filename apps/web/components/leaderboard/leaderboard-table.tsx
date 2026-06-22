'use client';

import type { Variants } from 'motion/react';
import { motion } from 'motion/react';
import { useFormatter, useTranslations } from 'next-intl';
import type { LeaderboardEntry } from '@/lib/engagement/leaderboard';
import { cn } from '@/lib/utils';

const RANK_STYLES: Record<number, string> = {
  1: 'text-amber-500 font-bold',
  2: 'text-amber-500/80 font-semibold',
  3: 'text-amber-500/60 font-medium',
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 4, filter: 'blur(2px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', bounce: 0, duration: 0.3 },
  },
};

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserPosition?: number | null;
}

export function LeaderboardTable({ entries, currentUserPosition }: LeaderboardTableProps) {
  const t = useTranslations('leaderboard');
  const format = useFormatter();

  if (entries.length === 0) {
    return <div className="text-center py-16 text-secondary text-sm">{t('empty')}</div>;
  }

  return (
    <motion.div
      className="flex flex-col border-y border-border/40 bg-surface/20"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Table Header */}
      <div className="flex items-center gap-4 px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground border-b border-border/40">
        <div className="w-8 shrink-0 text-center">#</div>
        <div className="flex-1">Developer</div>
        <div className="text-right shrink-0">XP</div>
      </div>

      {entries.map((entry) => {
        const isCurrentUser = entry.position === currentUserPosition;
        const rankStyle = RANK_STYLES[entry.rank];

        return (
          <motion.div
            key={entry.position}
            variants={itemVariants}
            className={cn(
              'group flex items-center gap-4 px-3 py-2 text-sm transition-[background-color,border-color] duration-150 ease-out border-b border-border/40 last:border-b-0',
              isCurrentUser
                ? 'bg-primary/5 shadow-[inset_2px_0_0_0_rgba(245,158,11,1)]'
                : 'hover:bg-surface/50',
            )}
          >
            {/* Rank */}
            <div
              className={cn(
                'w-8 shrink-0 text-center font-mono text-xs',
                rankStyle ?? 'text-muted-foreground',
              )}
            >
              {entry.rank}
            </div>

            {/* Name + level */}
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <span
                className={cn(
                  'font-medium truncate',
                  isCurrentUser ? 'text-primary' : 'text-foreground',
                )}
              >
                {isCurrentUser ? t('you') : entry.displayName}
              </span>
              <span className="text-[11px] text-muted-foreground/70 font-mono hidden sm:inline-block">
                Lv.{entry.level}
              </span>
            </div>

            {/* XP */}
            <div className="text-right shrink-0">
              <span className="font-mono text-foreground tabular-nums tracking-tight">
                {format.number(entry.totalXP)}
              </span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
