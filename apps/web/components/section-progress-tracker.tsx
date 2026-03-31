'use client';

import {
  IconCircleCheck as Check,
  IconCircleDashed as Circle,
  IconTrophy as Trophy,
} from '@tabler/icons-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MasteryLevel } from '@/lib/progress/section-progress-store';
import { useAllSectionStats, useSectionProgressStore } from '@/lib/progress/section-progress-store';
import { cn } from '@/lib/utils';

interface SectionProgressTrackerProps {
  availableTags: string[];
  questionCounts: Record<string, number>;
  onSectionClick?: (tag: string) => void;
}

const masteryConfig: Record<
  MasteryLevel,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
    description: string;
  }
> = {
  not_started: {
    label: 'Not Started',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/20',
    borderColor: 'border-border-subtle',
    icon: <Circle className="h-4 w-4" />,
    description: 'No attempts yet',
  },
  learning: {
    label: 'Learning',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    icon: <Circle className="h-4 w-4" />,
    description: 'Getting familiar',
  },
  practicing: {
    label: 'Practicing',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: <Check className="h-4 w-4" />,
    description: 'Making progress',
  },
  mastered: {
    label: 'Mastered',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: <Trophy className="h-4 w-4" />,
    description: 'Excellent!',
  },
};

export function SectionProgressTracker({
  availableTags,
  questionCounts,
  onSectionClick,
}: SectionProgressTrackerProps) {
  const allStats = useAllSectionStats();
  const resetSection = useSectionProgressStore((state) => state.resetSection);

  const statsByTag = useMemo(() => {
    const map = new Map<string, (typeof allStats)[number]>();
    allStats.forEach((stat) => void map.set(stat.tag, stat));
    return map;
  }, [allStats]);

  const overallProgress = useMemo(() => {
    const totalQuestions = availableTags.reduce((sum, tag) => sum + (questionCounts[tag] || 0), 0);
    const totalAnswered = allStats.reduce((sum, stat) => sum + stat.answeredQuestions, 0);
    const totalCorrect = allStats.reduce((sum, stat) => sum + stat.correctAnswers, 0);

    return {
      totalQuestions,
      totalAnswered,
      totalCorrect,
      overallAccuracy: totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0,
      overallCompletion: totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0,
    };
  }, [availableTags, questionCounts, allStats]);

  const masteredCount = allStats.filter((stat) => stat.masteryLevel === 'mastered').length;
  const inProgressCount = allStats.filter(
    (stat) => stat.masteryLevel === 'practicing' || stat.masteryLevel === 'learning',
  ).length;

  return (
    <div className="space-y-6">
      {/* Overall Progress Summary */}
      <div className="rounded-xl border border-border-subtle bg-surface/50 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Overall Progress
          </h3>
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px] px-2 py-0.5',
              masteredCount === availableTags.length
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-primary/10 text-primary',
            )}
          >
            {masteredCount}/{availableTags.length} Mastered
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Completed</p>
            <p className="text-lg font-semibold text-foreground">
              {overallProgress.totalAnswered}/{overallProgress.totalQuestions}
            </p>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress.overallCompletion}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
              />
            </div>
            <p className="text-[9px] text-muted-foreground">
              {overallProgress.overallCompletion.toFixed(0)}% complete
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Accuracy</p>
            <p className="text-lg font-semibold text-foreground">
              {overallProgress.overallAccuracy.toFixed(0)}%
            </p>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress.overallAccuracy}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
              />
            </div>
            <p className="text-[9px] text-muted-foreground">
              {overallProgress.totalCorrect} correct
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Status</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[9px] text-muted-foreground">{masteredCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[9px] text-muted-foreground">{inProgressCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                <span className="text-[9px] text-muted-foreground">
                  {availableTags.length - masteredCount - inProgressCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Section Progress */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Topic Breakdown
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
              <motion.button
                key={tag}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSectionClick?.(tag)}
                className={cn(
                  'group relative flex flex-col items-start gap-3 rounded-lg border p-3 text-left transition-all',
                  config.bgColor,
                  config.borderColor,
                  'hover:shadow-md hover:-translate-y-0.5',
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn('flex items-center justify-center', config.color)}
                      title={config.description}
                    >
                      {config.icon}
                    </div>
                    <span className="font-medium text-sm text-foreground capitalize">{tag}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px] px-1.5 py-0.5 h-auto',
                      config.color,
                      config.borderColor,
                    )}
                  >
                    {config.label}
                  </Badge>
                </div>

                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>
                      {stats.answeredQuestions}/{stats.totalQuestions} completed
                    </span>
                    <span>{stats.accuracy.toFixed(0)}% accuracy</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.completionPercentage}%` }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        'h-full rounded-full',
                        stats.masteryLevel === 'mastered'
                          ? 'bg-emerald-500'
                          : stats.masteryLevel === 'practicing'
                            ? 'bg-blue-500'
                            : stats.masteryLevel === 'learning'
                              ? 'bg-orange-500'
                              : 'bg-muted-foreground/20',
                      )}
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
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
