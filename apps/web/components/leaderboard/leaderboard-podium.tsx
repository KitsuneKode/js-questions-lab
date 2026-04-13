'use client';

import { IconFlame } from '@tabler/icons-react';
import { motion, useReducedMotion } from 'motion/react';
import { useFormatter } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { LeaderboardEntry } from '@/lib/engagement/leaderboard';
import { cn } from '@/lib/utils';

// ─── constants ─────────────────────────────────────────────────────────────
const ORDINALS: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' };

const PODIUM_STYLES: Record<
  number,
  { text: string; border: string; bg: string; glow: string; ordinal: string }
> = {
  1: {
    text: 'text-yellow-400',
    border: 'border-yellow-400/30',
    bg: 'bg-yellow-400/5',
    glow: 'shadow-[0_0_40px_rgba(250,204,21,0.08)]',
    ordinal: 'text-yellow-400',
  },
  2: {
    text: 'text-zinc-300',
    border: 'border-zinc-400/20',
    bg: 'bg-zinc-400/5',
    glow: '',
    ordinal: 'text-zinc-400',
  },
  3: {
    text: 'text-amber-600',
    border: 'border-amber-600/25',
    bg: 'bg-amber-600/5',
    glow: '',
    ordinal: 'text-amber-600',
  },
};

const LEVEL_COLOURS: Record<number, string> = {
  1: 'border-zinc-600/40 text-zinc-400',
  2: 'border-sky-600/40 text-sky-400',
  3: 'border-emerald-600/40 text-emerald-400',
  4: 'border-violet-600/40 text-violet-400',
  5: 'border-primary/40 text-primary',
  6: 'border-yellow-400/50 text-yellow-400',
};

// ─── avatar ────────────────────────────────────────────────────────────────
function PodiumAvatar({ name, rank }: { name: string; rank: number }) {
  const initials = name
    .replace(/^Anonymous.*/, 'AN')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const style = PODIUM_STYLES[rank];
  const size = rank === 1 ? 'h-14 w-14 text-base' : 'h-11 w-11 text-xs';

  return (
    <div
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border font-bold tracking-wider select-none',
        size,
        style
          ? `${style.border} ${style.text} ${style.bg}`
          : 'border-zinc-700/60 bg-zinc-800 text-zinc-400',
      )}
    >
      {initials}
    </div>
  );
}

// ─── single podium column ──────────────────────────────────────────────────
function PodiumColumn({
  entry,
  shouldReduceMotion,
}: {
  entry: LeaderboardEntry;
  shouldReduceMotion: boolean;
}) {
  const format = useFormatter();
  const style = PODIUM_STYLES[entry.rank] ?? PODIUM_STYLES[3];

  // Center card (#1) animates first; sides animate after
  const staggerOrder = entry.rank === 1 ? 0 : entry.rank === 2 ? 1 : 2;
  const isFirst = entry.rank === 1;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: shouldReduceMotion ? 0 : staggerOrder * 0.08,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={cn(
        'relative flex flex-col items-center gap-3 rounded-2xl border px-5 py-6 text-center',
        'transition-colors duration-150 ease-out',
        style.border,
        style.bg,
        style.glow,
        isFirst && 'md:-translate-y-2',
      )}
    >
      {/* Radial glow behind #1 */}
      {isFirst && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              'radial-gradient(circle at center, rgba(245,158,11,0.06) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Ordinal */}
      <span
        className={cn(
          'font-display text-3xl font-normal tracking-tight',
          isFirst ? 'md:text-5xl' : 'md:text-4xl',
          style.ordinal,
        )}
      >
        {ORDINALS[entry.rank]}
      </span>

      {/* Avatar */}
      <PodiumAvatar name={entry.displayName} rank={entry.rank} />

      {/* Name */}
      <span className={cn('text-sm font-medium leading-tight', style.text)}>
        {entry.displayName}
      </span>

      {/* Meta row: level + streak */}
      <div className="flex items-center justify-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            'h-[18px] rounded border px-1.5 font-mono text-[9px] uppercase tracking-widest',
            LEVEL_COLOURS[entry.level] ?? 'border-zinc-600/40 text-zinc-400',
          )}
        >
          Lv.{entry.level}&nbsp;{entry.levelName}
        </Badge>
        {entry.currentStreak > 0 && (
          <span className="inline-flex items-center gap-0.5 font-mono text-[11px] text-amber-400/80">
            <IconFlame className="h-3 w-3 text-amber-500" aria-hidden />
            {entry.currentStreak}
          </span>
        )}
      </div>

      {/* XP */}
      <div className="mt-1">
        <span className="font-mono text-lg font-semibold tabular-nums text-zinc-100">
          {format.number(entry.totalXP)}
        </span>
        <span className="ml-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          XP
        </span>
      </div>

      {/* Pro badge */}
      {entry.isPro && (
        <span
          className="font-mono text-[9px] font-bold uppercase tracking-widest text-amber-400 opacity-80"
          title="Pro subscriber"
        >
          PRO
        </span>
      )}
    </motion.div>
  );
}

// ─── main export ───────────────────────────────────────────────────────────
interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardPodium({ entries }: LeaderboardPodiumProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  if (entries.length === 0) return null;

  // Ensure we only render up to 3
  const top3 = entries.slice(0, 3);

  // Reorder for visual layout: #2 / #1 / #3 (center-first on desktop)
  const ordered =
    top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : top3;

  return (
    <div
      className={cn(
        'grid gap-3',
        ordered.length === 3 && 'grid-cols-1 md:grid-cols-3',
        ordered.length === 2 && 'grid-cols-1 md:grid-cols-2',
        ordered.length === 1 && 'max-w-sm mx-auto',
      )}
    >
      {ordered.map((entry) => {
        const safeEntry = entry as LeaderboardEntry;
        return (
          <PodiumColumn
            key={safeEntry.position}
            entry={safeEntry}
            shouldReduceMotion={shouldReduceMotion}
          />
        );
      })}
    </div>
  );
}
