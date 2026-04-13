'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface LeaderboardHeroStatsProps {
  totalParticipants: number;
  totalWeeklyXP: number;
  userRank: number | null;
  isAuthenticated: boolean;
}

export function LeaderboardHeroStats({
  totalParticipants,
  totalWeeklyXP,
  userRank,
  isAuthenticated,
}: LeaderboardHeroStatsProps) {
  const t = useTranslations('leaderboard');

  const stats = [
    {
      label: t('totalParticipants', { count: totalParticipants }),
      value: totalParticipants.toLocaleString(),
      mono: true,
    },
    {
      label: t('totalXpThisWeek', { count: totalWeeklyXP }),
      value: totalWeeklyXP.toLocaleString(),
      mono: true,
    },
    {
      label: t('yourRank'),
      value: isAuthenticated
        ? userRank
          ? t('position', { position: userRank })
          : '—'
        : t('signInToSee'),
      highlight: isAuthenticated && userRank !== null,
      mono: isAuthenticated,
    },
  ];

  return (
    <div className="flex items-stretch divide-x divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 px-4 py-3"
        >
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              stat.highlight ? 'text-primary' : 'text-zinc-100',
              stat.mono && 'font-mono',
            )}
          >
            {stat.value}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
