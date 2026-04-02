'use client';

import {
  IconCircleCheck as Check,
  IconCircleDashed as Circle,
  IconTrophy as Trophy,
} from '@tabler/icons-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { computeOverallStats } from '@/lib/progress/analytics';
import { useProgress } from '@/lib/progress/progress-context';
import type { MasteryLevel } from '@/lib/progress/section-progress-store';
import { useAllSectionStats, useSectionProgressStore } from '@/lib/progress/section-progress-store';
import { cn } from '@/lib/utils';

interface SectionProgressTrackerProps {
  availableTags: string[];
  questionCounts: Record<string, number>;
  onSectionClick?: (tag: string) => void;
  totalQuestions?: number;
}

const masteryConfig: Record<
  MasteryLevel,
  {
    translationKey: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
    descKey: string;
  }
> = {
  not_started: {
    translationKey: 'notStarted',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/20',
    borderColor: 'border-border-subtle',
    icon: <Circle className="h-4 w-4" />,
    descKey: 'descNotStarted',
  },
  learning: {
    translationKey: 'learning',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    icon: <Circle className="h-4 w-4" />,
    descKey: 'descLearning',
  },
  practicing: {
    translationKey: 'practicing',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: <Check className="h-4 w-4" />,
    descKey: 'descPracticing',
  },
  mastered: {
    translationKey: 'mastered',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: <Trophy className="h-4 w-4" />,
    descKey: 'descMastered',
  },
};

export function SectionProgressTracker({
  availableTags,
  questionCounts,
  onSectionClick,
  totalQuestions: totalUniqueQuestions = 155,
}: SectionProgressTrackerProps) {
  const allStats = useAllSectionStats();
  const resetSection = useSectionProgressStore((state) => state.resetSection);
  const t = useTranslations('progress');
  const { state: progressState } = useProgress();

  const statsByTag = useMemo(() => {
    const map = new Map<string, (typeof allStats)[number]>();
    allStats.forEach((stat) => void map.set(stat.tag, stat));
    return map;
  }, [allStats]);

  const overallProgress = useMemo(() => {
    const overall = computeOverallStats(progressState);
    const totalQuestions = totalUniqueQuestions;
    const totalAnswered = overall.totalAnswered;
    const totalCorrect = overall.totalCorrect;

    return {
      totalQuestions,
      totalAnswered,
      totalCorrect,
      overallAccuracy: overall.overallAccuracy * 100,
      overallCompletion: totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0,
    };
  }, [progressState, totalUniqueQuestions]);

  const masteredCount = allStats.filter((stat) => stat.masteryLevel === 'mastered').length;
  const inProgressCount = allStats.filter(
    (stat) => stat.masteryLevel === 'practicing' || stat.masteryLevel === 'learning',
  ).length;

  return (
    <div className="space-y-6">
      {/* Overall Progress Summary */}
      <div className="rounded-xl border border-border-subtle bg-surface/50 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t('overall')}
          </h3>
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px] px-2.5 py-1',
              masteredCount === availableTags.length
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-primary/10 text-primary',
            )}
          >
            {masteredCount}/{availableTags.length} {t('mastered')}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">{t('completed')}</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {overallProgress.totalAnswered}
              <span className="text-base text-muted-foreground font-normal">
                /{overallProgress.totalQuestions}
              </span>
            </p>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress.overallCompletion}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {t('complete', { percent: overallProgress.overallCompletion.toFixed(0) })}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">{t('accuracy')}</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {overallProgress.overallAccuracy.toFixed(0)}%
            </p>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress.overallAccuracy}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {overallProgress.totalCorrect} {t('correctAnswers')}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">{t('masteryStatus')}</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">
                  {masteredCount} {t('mastered')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="text-xs text-muted-foreground">
                  {inProgressCount} {t('inProgress')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <span className="text-xs text-muted-foreground">
                {availableTags.length - masteredCount - inProgressCount} {t('notStarted')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Section Progress */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {t('topicBreakdown')}
        </h3>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {availableTags.map((tag) => {
            const stats = statsByTag.get(tag) || {
              totalQuestions: questionCounts[tag] || 0,
              answeredQuestions: 0,
              correctAnswers: 0,
              masteryLevel: 'not_started' as MasteryLevel,
              accuracy: 0,
              completionPercentage: 0,
            };

            const config = masteryConfig[stats.masteryLevel || 'not_started'];

            return (
              <motion.div
                key={tag}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSectionClick?.(tag)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSectionClick?.(tag);
                  }
                }}
                role="button"
                tabIndex={0}
                className={cn(
                  'group relative flex flex-col gap-3 rounded-lg border p-4 text-left transition-all cursor-pointer',
                  config.bgColor,
                  config.borderColor,
                  'hover:shadow-md hover:-translate-y-0.5',
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn('flex items-center justify-center', config.color)}
                      title={t(config.descKey as any)}
                    >
                      {config.icon}
                    </div>
                    <span className="font-medium text-sm text-foreground capitalize">{tag}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-2 py-0.5 h-auto font-medium',
                      config.color,
                      config.borderColor,
                    )}
                  >
                    {t(config.translationKey as any)}
                  </Badge>
                </div>

                <div className="w-full space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      {stats.answeredQuestions}/{stats.totalQuestions} {t('completed')}
                    </span>
                    <span className="font-bold">{Math.round(stats.accuracy * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.completionPercentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={cn('h-full rounded-full', config.color.replace('text-', 'bg-'))}
                    />
                  </div>
                </div>

                {/* Reset button (appears on hover) */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity',
                    'text-muted-foreground hover:text-danger hover:bg-danger/10',
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    resetSection(tag);
                  }}
                  title={`Reset ${tag} progress`}
                >
                  <span className="sr-only">Reset progress</span>×
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
