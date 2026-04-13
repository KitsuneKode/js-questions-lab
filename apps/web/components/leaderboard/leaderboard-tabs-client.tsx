'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LeaderboardEntry } from '@/lib/engagement/leaderboard';
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

export function LeaderboardTabsClient({
  weekly,
  allTime,
  weeklyCurrentUserPosition,
  allTimeCurrentUserPosition,
  isAuthenticated,
}: LeaderboardTabsClientProps) {
  const t = useTranslations('leaderboard');
  const [activeTab, setActiveTab] = useState('weekly');

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

  return (
    <Tabs defaultValue="weekly" onValueChange={setActiveTab}>
      <div className="flex items-center justify-between">
        <TabsList variant="line" className="gap-4">
          <TabsTrigger value="weekly" className="text-sm">
            {t('weeklyTitle')}
          </TabsTrigger>
          <TabsTrigger value="alltime" className="text-sm">
            {t('allTimeTitle')}
          </TabsTrigger>
        </TabsList>
        <span className="hidden font-mono text-[10px] uppercase tracking-wider text-zinc-500 sm:inline">
          {t('resetsMonday')}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className="mt-6 space-y-6"
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

          {/* List (entries 4+) */}
          {rest.length > 0 && (
            <LeaderboardTable entries={rest} currentUserPosition={currentUserPosition} />
          )}

          {/* Sticky user position */}
          {showStickyPosition && userEntry && <LeaderboardUserPosition entry={userEntry} />}
        </motion.div>
      </AnimatePresence>
    </Tabs>
  );
}
