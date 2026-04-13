'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LeaderboardEntry } from '@/lib/engagement/leaderboard';
import { LeaderboardTable } from './leaderboard-table';

interface LeaderboardTabsClientProps {
  weekly: LeaderboardEntry[];
  allTime: LeaderboardEntry[];
  weeklyCurrentUserPosition: number | null;
  allTimeCurrentUserPosition: number | null;
}

export function LeaderboardTabsClient({
  weekly,
  allTime,
  weeklyCurrentUserPosition,
  allTimeCurrentUserPosition,
}: LeaderboardTabsClientProps) {
  const t = useTranslations('leaderboard');

  return (
    <Tabs defaultValue="weekly">
      <div className="flex items-center justify-between">
        <TabsList variant="line" className="gap-4">
          <TabsTrigger value="weekly" className="text-sm">
            {t('weeklyTitle')}
          </TabsTrigger>
          <TabsTrigger value="alltime" className="text-sm">
            {t('allTimeTitle')}
          </TabsTrigger>
        </TabsList>
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          {t('resetsMonday')}
        </span>
      </div>

      <TabsContent value="weekly" className="mt-4">
        <LeaderboardTable entries={weekly} currentUserPosition={weeklyCurrentUserPosition} />
      </TabsContent>

      <TabsContent value="alltime" className="mt-4">
        <LeaderboardTable entries={allTime} currentUserPosition={allTimeCurrentUserPosition} />
      </TabsContent>
    </Tabs>
  );
}
