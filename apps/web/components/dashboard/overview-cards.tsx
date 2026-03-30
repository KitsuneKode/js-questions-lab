'use client';

import {
  IconActivity as Activity,
  IconCompass as Compass,
  IconTarget as Target,
} from '@tabler/icons-react';
import type { OverallStats } from '@/lib/progress/analytics';
import { cn } from '@/lib/utils';

interface OverviewCardsProps {
  overall: OverallStats;
}

export function OverviewCards({ overall }: OverviewCardsProps) {
  const totalQuestions = 155; // Hardcoded or passed down
  const progressPercent = Math.round((overall.totalAnswered / totalQuestions) * 100);
  const accuracyPercent = overall.totalAttempts > 0 ? Math.round(overall.overallAccuracy * 100) : 0;

  // Trend indicator based on a naive metric for demo purposes
  const accuracyTrend = accuracyPercent > 60 ? 'up' : accuracyPercent < 40 ? 'down' : 'neutral';
  const accuracyColor =
    accuracyTrend === 'up'
      ? 'text-status-correct'
      : accuracyTrend === 'down'
        ? 'text-status-wrong'
        : 'text-[#F59E0B]';

  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {/* Journey Card with Progress Ring */}
      <div className="col-span-1 rounded-2xl border border-border-subtle bg-surface p-6 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Compass className="w-24 h-24 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-tertiary mb-1">
            Journey
          </p>
          <p className="font-display text-3xl text-foreground">
            {overall.totalAnswered}{' '}
            <span className="text-lg text-secondary">/ {totalQuestions}</span>
          </p>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="relative h-12 w-12 flex-shrink-0">
            <svg
              className="h-full w-full -rotate-90 transform"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              <circle
                className="text-elevated stroke-current"
                strokeWidth="8"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
              />
              <circle
                className="text-primary stroke-current transition-all duration-1000 ease-out-expo"
                strokeWidth="8"
                strokeLinecap="round"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-bold text-primary">{progressPercent}%</span>
            </div>
          </div>
          <p className="text-xs text-secondary leading-snug">
            Questions answered.
            <br />
            Keep pushing.
          </p>
        </div>
      </div>

      {/* Accuracy Card */}
      <div className="col-span-1 rounded-2xl border border-border-subtle bg-surface p-6 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Target className="w-24 h-24 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-tertiary mb-1">
            Accuracy
          </p>
          <div className="flex items-baseline gap-2">
            <p className={cn('font-display text-4xl', accuracyColor)}>{accuracyPercent}%</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full bg-opacity-20',
                accuracyTrend === 'up'
                  ? 'bg-status-correct text-status-correct'
                  : accuracyTrend === 'down'
                    ? 'bg-status-wrong text-status-wrong'
                    : 'bg-[#F59E0B] text-[#F59E0B]',
              )}
            >
              <Activity className="h-3 w-3" />
            </div>
            <p className="text-xs text-secondary">
              {overall.totalCorrect} correct out of {overall.totalAttempts} attempts
            </p>
          </div>
        </div>
      </div>

      {/* Time Invested / Streak */}
      <div className="col-span-1 rounded-2xl border border-border-subtle bg-surface p-6 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Activity className="w-24 h-24 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-tertiary mb-1">
            Consistency
          </p>
          <p className="font-display text-4xl text-foreground">
            {overall.currentStreak} <span className="text-lg text-secondary">days</span>
          </p>
        </div>

        <div className="mt-6">
          <p className="text-xs text-secondary leading-snug">
            Best streak: <strong className="text-foreground">{overall.longestStreak} days</strong>.
            <br />
            Practice daily to build mastery.
          </p>
        </div>
      </div>
    </div>
  );
}
