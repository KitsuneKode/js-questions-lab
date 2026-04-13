'use client';

import { IconFlame } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { LeaderboardEntry } from '@/lib/engagement/leaderboard';
import { cn } from '@/lib/utils';

// ─── rank helpers ──────────────────────────────────────────────────────────
const RANK_COLOURS: Record<number, { ring: string; text: string; bg: string }> = {
  1: { ring: 'border-yellow-400/40', text: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  2: { ring: 'border-zinc-300/30', text: 'text-zinc-300', bg: 'bg-zinc-300/8' },
  3: { ring: 'border-amber-600/35', text: 'text-amber-600', bg: 'bg-amber-600/10' },
};

const RANK_NUMERALS: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' };

// ─── Avatar (initials fallback — no external dependency) ───────────────────
function Avatar({ name, rank }: { name: string; rank: number }) {
  const initials = name
    .replace(/^Anonymous.*/, 'AN')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colour = RANK_COLOURS[rank];

  return (
    <div
      aria-hidden
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold tracking-wider select-none',
        colour
          ? `${colour.ring} ${colour.text} ${colour.bg}`
          : 'border-zinc-700/60 bg-zinc-800 text-zinc-400',
      )}
    >
      {initials}
    </div>
  );
}

// ─── Rank badge ────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  const colour = RANK_COLOURS[rank];
  return (
    <div
      className={cn(
        'flex h-7 w-10 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold font-mono',
        colour
          ? `${colour.ring} ${colour.text} ${colour.bg}`
          : 'border-zinc-700/50 bg-transparent text-zinc-500',
      )}
    >
      {rank <= 3 ? RANK_NUMERALS[rank] : `#${rank}`}
    </div>
  );
}

// ─── Level badge ───────────────────────────────────────────────────────────
const LEVEL_COLOURS: Record<number, string> = {
  1: 'border-zinc-600/40 text-zinc-400',
  2: 'border-sky-600/40 text-sky-400',
  3: 'border-emerald-600/40 text-emerald-400',
  4: 'border-violet-600/40 text-violet-400',
  5: 'border-primary/40 text-primary',
  6: 'border-yellow-400/50 text-yellow-400',
};

function LevelBadge({ level, name }: { level: number; name: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'h-[18px] rounded border px-1.5 font-mono text-[9px] uppercase tracking-widest',
        LEVEL_COLOURS[level] ?? 'border-zinc-600/40 text-zinc-400',
      )}
    >
      Lv.{level}&nbsp;{name}
    </Badge>
  );
}

// ─── Streak pill ───────────────────────────────────────────────────────────
function StreakPill({ streak }: { streak: number }) {
  if (streak < 1) return null;
  return (
    <span className="inline-flex items-center gap-0.5 font-mono text-[11px] text-amber-400/80">
      <IconFlame className="h-3 w-3 text-amber-500" aria-hidden />
      {streak}
    </span>
  );
}

// ─── Pro badge ─────────────────────────────────────────────────────────────
function ProBadge() {
  return (
    <span
      className="font-mono text-[9px] font-bold uppercase tracking-widest text-amber-400 opacity-80"
      title="Pro subscriber"
    >
      PRO
    </span>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-zinc-700 text-zinc-600">
        <IconFlame className="h-5 w-5" />
      </div>
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}

// ─── Entry row ─────────────────────────────────────────────────────────────
interface LeaderboardEntryRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  index: number;
}

function LeaderboardEntryRow({ entry, isCurrentUser, index }: LeaderboardEntryRowProps) {
  const format = useFormatter();
  const t = useTranslations('leaderboard');

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay: index * 0.04,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl border px-4 py-3',
        'transition-colors duration-150 ease-out',
        isCurrentUser
          ? 'border-primary/30 bg-primary/5 shadow-[0_0_24px_rgba(245,158,11,0.07)]'
          : 'border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700/60 hover:bg-zinc-900',
      )}
    >
      {/* Rank badge */}
      <RankBadge rank={entry.rank} />

      {/* Avatar */}
      <Avatar name={isCurrentUser ? t('you') : entry.displayName} rank={entry.rank} />

      {/* Name + level */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'truncate text-sm font-medium leading-tight',
              isCurrentUser ? 'text-primary' : 'text-zinc-100',
            )}
          >
            {isCurrentUser ? t('you') : entry.displayName}
          </span>
          {entry.isPro && <ProBadge />}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <LevelBadge level={entry.level} name={entry.levelName} />
          {entry.currentStreak > 0 && <StreakPill streak={entry.currentStreak} />}
        </div>
      </div>

      {/* XP */}
      <div className="shrink-0 text-right">
        <div className="font-mono text-sm font-semibold tabular-nums text-zinc-100">
          {format.number(entry.totalXP)}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">XP</div>
      </div>
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserPosition?: number | null;
}

export function LeaderboardTable({ entries, currentUserPosition }: LeaderboardTableProps) {
  const t = useTranslations('leaderboard');

  if (entries.length === 0) {
    return <EmptyState message={t('empty')} />;
  }

  return (
    <div className="space-y-1.5">
      {entries.map((entry, index) => {
        const isCurrentUser = entry.position === currentUserPosition;
        return (
          <LeaderboardEntryRow
            key={entry.position}
            entry={entry}
            isCurrentUser={isCurrentUser}
            index={index}
          />
        );
      })}
    </div>
  );
}
