'use client';

import { IconTrophy } from '@tabler/icons-react';
import { useFormatter, useTranslations } from 'next-intl';
import {
  type CurrentUserRank,
  currentUserRankToEntry,
  type LeaderboardEntry,
} from '@/lib/engagement/leaderboard-types';
import { cn } from '@/lib/utils';

const RANK_STYLES: Record<number, string> = {
  1: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  2: 'text-zinc-300 bg-zinc-300/10 border-zinc-300/30',
  3: 'text-amber-600 bg-amber-600/10 border-amber-600/30',
};

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUser?: CurrentUserRank | null;
  currentUserDisplayName?: string | null;
  error?: string | null;
  limit?: number;
}

function LeaderboardRow({
  entry,
  isCurrentUser,
  label,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  label: string;
}) {
  const format = useFormatter();
  const rankStyle = RANK_STYLES[entry.rank];

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors',
        isCurrentUser
          ? 'border-primary/40 bg-primary/5 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
          : 'border-border-subtle bg-surface hover:bg-elevated',
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold',
          rankStyle ?? 'text-tertiary bg-elevated border-border-subtle',
        )}
      >
        {entry.rank <= 3 ? (
          <IconTrophy className="h-3.5 w-3.5" />
        ) : (
          <span className="font-mono">{entry.rank}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-medium truncate', isCurrentUser && 'text-primary')}>
            {label}
          </span>
        </div>
        <span className="text-[11px] text-tertiary font-mono">
          Lv.{entry.level} {entry.levelName}
        </span>
      </div>

      <div className="text-right shrink-0">
        <div className="text-sm font-semibold font-mono text-foreground tabular-nums">
          {format.number(entry.totalXP)}
        </div>
        <div className="text-[10px] text-tertiary uppercase tracking-wider">XP</div>
      </div>
    </div>
  );
}

export function LeaderboardTable({
  entries,
  currentUser = null,
  currentUserDisplayName = null,
  error = null,
  limit = 50,
}: LeaderboardTableProps) {
  const t = useTranslations('leaderboard');

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-6 text-center text-sm text-danger"
      >
        {t('loadError')}
      </div>
    );
  }

  if (entries.length === 0 && !currentUser) {
    return <div className="text-center py-16 text-secondary text-sm">{t('empty')}</div>;
  }

  const userInList = currentUser
    ? entries.some((entry) => entry.position === currentUser.position)
    : false;

  const stickyEntry =
    currentUser && !userInList
      ? currentUserRankToEntry(currentUser, currentUserDisplayName ?? t('you'))
      : null;

  return (
    <div className="relative space-y-2">
      {entries.map((entry) => {
        const isCurrentUser = entry.position === currentUser?.position;
        return (
          <LeaderboardRow
            key={entry.position}
            entry={entry}
            isCurrentUser={isCurrentUser}
            label={isCurrentUser ? (currentUserDisplayName ?? t('you')) : entry.displayName}
          />
        );
      })}

      {stickyEntry && currentUser && (
        <div className="sticky bottom-0 z-10 space-y-2 border-t border-primary/20 bg-void/95 pt-3 backdrop-blur-sm">
          <p className="text-[11px] text-tertiary px-1">
            {t('outsideTop', { position: currentUser.position, limit })}
          </p>
          <LeaderboardRow
            entry={stickyEntry}
            isCurrentUser
            label={currentUserDisplayName ?? t('you')}
          />
        </div>
      )}
    </div>
  );
}
