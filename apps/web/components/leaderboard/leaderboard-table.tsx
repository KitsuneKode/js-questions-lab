'use client';

import { IconFlame, IconTrophy } from '@tabler/icons-react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { getDisplayInitials, type LeaderboardEntry } from '@/lib/engagement/leaderboard-shared';
import { cn } from '@/lib/utils';

const RANK_STYLES: Record<number, string> = {
  1: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  2: 'text-zinc-300 bg-zinc-300/10 border-zinc-300/30',
  3: 'text-amber-600 bg-amber-600/10 border-amber-600/30',
};

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserPosition?: number | null;
  showGuestCta?: boolean;
  signUpHref?: string;
}

export function LeaderboardTable({
  entries,
  currentUserPosition,
  showGuestCta,
  signUpHref,
}: LeaderboardTableProps) {
  const t = useTranslations('leaderboard');
  const format = useFormatter();

  if (entries.length === 0) {
    return <div className="text-center py-16 text-secondary text-sm">{t('empty')}</div>;
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const isCurrentUser = entry.position === currentUserPosition;
        const rankStyle = RANK_STYLES[entry.rank];
        const initials = getDisplayInitials(entry.displayName);

        return (
          <div
            key={entry.position}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors sm:gap-4 sm:px-4',
              isCurrentUser
                ? 'border-primary/40 bg-primary/5'
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

            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-elevated text-[11px] font-semibold uppercase tracking-wide text-secondary"
              aria-hidden
            >
              {entry.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn('text-sm font-medium truncate', isCurrentUser && 'text-primary')}
                >
                  {isCurrentUser ? t('you') : entry.displayName}
                </span>
                {entry.isPro ? (
                  <span className="shrink-0 rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
                    {t('proBadge')}
                  </span>
                ) : null}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-[11px] text-tertiary font-mono">
                  Lv.{entry.level} {entry.levelName}
                </span>
                {typeof entry.streakDays === 'number' ? (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-primary"
                    title={t('streakLabel', { count: entry.streakDays })}
                  >
                    <IconFlame className="h-3 w-3 fill-primary/20" />
                    {t('streakLabel', { count: entry.streakDays })}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-sm font-semibold font-mono text-foreground tabular-nums">
                {format.number(entry.totalXP)}
              </div>
              <div className="text-[10px] text-tertiary uppercase tracking-wider">XP</div>
            </div>
          </div>
        );
      })}

      {showGuestCta && signUpHref && (
        <div className="pt-2 text-center">
          <Link
            href={signUpHref}
            className="text-sm text-primary hover:text-primary/80 transition-colors no-underline"
          >
            {t('guestCta')}
          </Link>
        </div>
      )}
    </div>
  );
}
