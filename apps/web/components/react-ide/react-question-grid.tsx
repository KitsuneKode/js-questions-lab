'use client';

import { IconCheck, IconCircleFilled, IconFlame } from '@tabler/icons-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ReactDiscoveryItem, ReactQuestionCategory } from '@/lib/content/types';
import { useProgress } from '@/lib/progress/progress-context';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReactQuestionGridProps {
  questions: ReactDiscoveryItem[];
  totalQuestions: number;
  locale: string;
}

type FilterCategory = 'all' | ReactQuestionCategory;

const CATEGORY_LABELS: Record<FilterCategory, string> = {
  all: 'All',
  component: 'Components',
  hook: 'Hooks',
  pattern: 'Patterns',
  debug: 'Debug',
  styling: 'Styling',
};

// Category accent colors aligned to Dark Forge palette
const CATEGORY_ACCENT: Record<ReactQuestionCategory, string> = {
  component: 'text-[#61afef] border-[#61afef]/20 bg-[#61afef]/8',
  hook: 'text-[#c678dd] border-[#c678dd]/20 bg-[#c678dd]/8',
  pattern: 'text-primary border-primary/20 bg-primary/8',
  debug: 'text-danger border-danger/20 bg-danger/8',
  styling: 'text-[#ec4899] border-[#ec4899]/20 bg-[#ec4899]/8',
};

const CATEGORY_HOVER: Record<ReactQuestionCategory, string> = {
  component: 'hover:border-[#61afef]/25 hover:shadow-[0_8px_30px_-10px_rgba(97,175,239,0.12)]',
  hook: 'hover:border-[#c678dd]/25 hover:shadow-[0_8px_30px_-10px_rgba(198,120,221,0.12)]',
  pattern: 'hover:border-primary/25 hover:shadow-[0_8px_30px_-10px_rgba(245,158,11,0.12)]',
  debug: 'hover:border-danger/25 hover:shadow-[0_8px_30px_-10px_rgba(239,68,68,0.12)]',
  styling: 'hover:border-[#ec4899]/25 hover:shadow-[0_8px_30px_-10px_rgba(236,72,153,0.12)]',
};

const DIFFICULTY_BADGE_CLASS = {
  beginner: 'border-green-500/30 bg-green-500/10 text-green-400',
  intermediate: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  advanced: 'border-red-500/30 bg-red-500/10 text-red-400',
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReactQuestionGrid({ questions, totalQuestions, locale }: ReactQuestionGridProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const { reactState } = useProgress();

  // Derive progress stats
  const { completedCount, attemptedCount } = useMemo(() => {
    let completed = 0;
    let attempted = 0;
    for (const q of questions) {
      const progress = reactState.questions[q.id];
      if (progress && progress.attempts.length > 0) {
        attempted++;
        if (progress.srsData) completed++;
      }
    }
    return { completedCount: completed, attemptedCount: attempted };
  }, [questions, reactState.questions]);

  // Available categories (only show tabs for categories that have questions)
  const availableCategories = useMemo(() => {
    const cats = new Set(questions.map((q) => q.category));
    return ['all' as const, ...Array.from(cats)] as FilterCategory[];
  }, [questions]);

  // Filtered questions
  const filtered = useMemo(
    () =>
      activeFilter === 'all' ? questions : questions.filter((q) => q.category === activeFilter),
    [questions, activeFilter],
  );

  const progressPercent = totalQuestions > 0 ? (completedCount / totalQuestions) * 100 : 0;
  const inProgress = attemptedCount - completedCount;

  return (
    <div className="space-y-7">
      {/* Stats row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-medium text-foreground tabular-nums">
              {completedCount}
            </span>
            <span className="text-sm text-muted-foreground">/ {totalQuestions} completed</span>
          </div>
          {inProgress > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/8 px-2.5 py-1">
              <IconFlame className="h-3 w-3 text-amber-400" />
              <span className="text-[11px] font-medium text-amber-400">
                {inProgress} in progress
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="group flex w-full items-center gap-2.5 sm:w-56">
          <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-border/30">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="w-8 text-right font-mono text-[10px] font-semibold tabular-nums text-muted-foreground">
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {availableCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveFilter(cat)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-150 active:scale-[0.97]',
              activeFilter === cat
                ? cat === 'all'
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : cn('border', CATEGORY_ACCENT[cat as ReactQuestionCategory])
                : 'border-border/40 text-muted-foreground hover:border-border/70 hover:text-foreground',
            )}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Question cards grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((question) => {
          const progress = reactState.questions[question.id];
          const isAttempted = progress && progress.attempts.length > 0;
          const isCompleted = isAttempted && progress?.srsData;
          const catHover = CATEGORY_HOVER[question.category];

          return (
            <Link
              key={question.id}
              href={`/${locale}/react/${question.id}`}
              className={cn(
                'group relative flex flex-col gap-3 rounded-xl border border-border/40 bg-surface/50 p-4',
                'transition-all duration-200 hover:-translate-y-0.5',
                catHover,
              )}
            >
              {/* Completed / in-progress indicator */}
              {isCompleted ? (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/25">
                  <IconCheck className="h-3 w-3 text-green-400" />
                </div>
              ) : isAttempted ? (
                <div className="absolute right-3 top-3">
                  <IconCircleFilled className="h-2 w-2 text-amber-400" />
                </div>
              ) : null}

              <div className="flex items-start justify-between gap-3 pr-7">
                <p className="text-sm font-medium leading-snug text-foreground/90 transition-colors group-hover:text-foreground">
                  {question.title}
                </p>
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                    DIFFICULTY_BADGE_CLASS[question.difficulty],
                  )}
                >
                  {question.difficulty}
                </span>
              </div>

              {/* Bottom row: category pill + tags */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                    CATEGORY_ACCENT[question.category],
                  )}
                >
                  {CATEGORY_LABELS[question.category]}
                </span>
                {question.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-border/40 bg-surface/70 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">No questions in this category yet.</p>
        </div>
      )}
    </div>
  );
}
