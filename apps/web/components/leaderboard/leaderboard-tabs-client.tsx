'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { LeaderboardEntry } from '@/lib/engagement/leaderboard';
import { cn } from '@/lib/utils';
import { LeaderboardHeroStats } from './leaderboard-hero-stats';
import { LeaderboardPodium } from './leaderboard-podium';
import { computeStats, extractPodium, LeaderboardTable } from './leaderboard-table';
import { LeaderboardUserPosition } from './leaderboard-user-position';

interface LeaderboardTabsClientProps {
  weekly: LeaderboardEntry[];
  allTime: LeaderboardEntry[];
  weeklyCurrentUserPosition: number | null;
  allTimeCurrentUserPosition: number | null;
  isAuthenticated: boolean;
}

// ─── Tab definitions ───────────────────────────────────────────────────────
const TABS = [
  { value: 'weekly', labelKey: 'weeklyTitle' },
  { value: 'alltime', labelKey: 'allTimeTitle' },
] as const;

export function LeaderboardTabsClient({
  weekly,
  allTime,
  weeklyCurrentUserPosition,
  allTimeCurrentUserPosition,
  isAuthenticated,
}: LeaderboardTabsClientProps) {
  const t = useTranslations('leaderboard');
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<string>('weekly');

  const entries = activeTab === 'weekly' ? weekly : allTime;
  const currentUserPosition =
    activeTab === 'weekly' ? weeklyCurrentUserPosition : allTimeCurrentUserPosition;
  const { podium, rest } = extractPodium(entries);
  const stats = computeStats(entries);

  // Find user's entry if they're outside the visible list
  const userEntry =
    currentUserPosition && currentUserPosition > 3
      ? entries.find((e) => e.position === currentUserPosition)
      : null;
  const showStickyPosition = userEntry && currentUserPosition && currentUserPosition > 10;

  // Guest blur: show entries 4-5 normally, 6+ blurred
  const visibleRest = !isAuthenticated ? rest.slice(0, 2) : rest;
  const blurredRest = !isAuthenticated ? rest.slice(2) : [];

  return (
    <div className="space-y-6">
      {/* ─── Animated tab indicator ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="relative flex gap-4" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'relative px-1 py-2 text-sm font-medium transition-colors duration-150',
                activeTab === tab.value ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300',
              )}
            >
              {t(tab.labelKey)}
              {activeTab === tab.value && (
                <motion.div
                  layoutId="leaderboard-tab-indicator"
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-100"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
        <span className="hidden font-mono text-[10px] uppercase tracking-wider text-zinc-500 sm:inline">
          {t('resetsMonday')}
        </span>
      </div>

      {/* ─── Tab content ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className="space-y-6"
        >
          {/* Podium */}
          <LeaderboardPodium entries={podium} />

          {/* Stats bar */}
          <LeaderboardHeroStats
            totalParticipants={stats.totalParticipants}
            totalWeeklyXP={stats.totalWeeklyXP}
            userRank={currentUserPosition}
            isAuthenticated={isAuthenticated}
          />

          {/* List (entries 4+, visible portion) */}
          {visibleRest.length > 0 && (
            <LeaderboardTable entries={visibleRest} currentUserPosition={currentUserPosition} />
          )}

          {/* Guest blur gate */}
          {blurredRest.length > 0 && (
            <div className="relative">
              {/* Blurred entries */}
              <div className="pointer-events-none select-none blur-[6px] brightness-75 saturate-50">
                <LeaderboardTable entries={blurredRest.slice(0, 5)} />
              </div>

              {/* Gradient overlay */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent"
              />

              {/* CTA */}
              <div className="absolute inset-x-0 bottom-6 flex justify-center">
                <Link
                  href={`/${locale}/sign-up`}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-zinc-950/90 px-5 py-2.5',
                    'font-mono text-xs font-bold uppercase tracking-wider text-primary',
                    'backdrop-blur-xl transition-all duration-150 ease-out',
                    'hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
                    'active:scale-[0.97]',
                  )}
                >
                  {t('guestBlurCta')}
                </Link>
              </div>
            </div>
          )}

          {/* Sticky user position */}
          {showStickyPosition && userEntry && <LeaderboardUserPosition entry={userEntry} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
