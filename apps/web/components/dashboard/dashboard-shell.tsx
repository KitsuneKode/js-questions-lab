'use client';

import { ArrowRight, Library, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { BookmarkedList } from '@/components/dashboard/bookmarked-list';
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { ReviewQueue } from '@/components/dashboard/review-queue';
import { TopicAccuracyChart } from '@/components/dashboard/topic-accuracy-chart';
import { WeakestTopics } from '@/components/dashboard/weakest-topics';
import { Button } from '@/components/ui/button';
import type { QuestionRecord } from '@/lib/content/types';
import { withLocale } from '@/lib/locale-paths';
import { useAnalytics } from '@/lib/progress/use-analytics';

interface DashboardShellProps {
  questions: QuestionRecord[];
  locale: string;
}

export function DashboardShell({ questions, locale }: DashboardShellProps) {
  const t = useTranslations('dashboard');
  const {
    ready,
    overall,
    tagStats,
    dailyActivity,
    weakestTopics,
    reviewQueue,
    continueLearning,
    recommended,
  } = useAnalytics(questions);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center flex-col gap-6">
        <div className="relative flex items-center justify-center h-16 w-16">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-secondary">
          Loading your progress...
        </p>
      </div>
    );
  }

  const hasData = overall.totalAnswered > 0;
  const questionsHref = withLocale(locale, '/questions');

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
            {t('title')}
          </span>
          <span className="h-px flex-1 bg-linear-to-r from-border-subtle to-transparent" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl text-foreground">Welcome back.</h1>
        <p className="max-w-2xl text-lg text-secondary">
          {hasData
            ? `You've answered ${overall.totalAnswered} questions across ${tagStats.length} topics. Maintain your momentum.`
            : 'Start with one question, get immediate feedback, and build consistent practice habits.'}
        </p>
      </header>

      {/* Stats overview */}
      <OverviewCards overall={overall} />

      {/* Charts and lists — only show when there's data */}
      {hasData && (
        <>
          {/* Radar + Activity Heatmap */}
          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <TopicAccuracyChart tagStats={tagStats} />
            </div>
            <div className="lg:col-span-4">
              <ActivityChart dailyActivity={dailyActivity} />
            </div>
          </div>

          {/* Quick action cards */}
          <div className="grid gap-5 sm:grid-cols-2">
            {[continueLearning, recommended].map((suggestion, index) => (
              <div
                key={suggestion.label}
                className="group relative overflow-hidden rounded-2xl border border-border-subtle bg-surface p-6 transition-all hover:border-border-focus hover:shadow-glow"
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  {index === 0 ? (
                    <Library className="h-24 w-24 text-primary" />
                  ) : (
                    <Sparkles className="h-24 w-24 text-primary" />
                  )}
                </div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                      {index === 0 ? (
                        <Library className="h-3.5 w-3.5" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      {suggestion.label}
                    </div>
                    <h2 className="font-display text-2xl text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {suggestion.question
                        ? suggestion.question.title
                        : 'Start your first question'}
                    </h2>
                    <p className="text-sm text-secondary">{suggestion.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-border-subtle">
                    <Link
                      href={
                        suggestion.question
                          ? withLocale(locale, `/questions/${suggestion.question.id}`)
                          : questionsHref
                      }
                    >
                      <Button
                        size="sm"
                        className="h-9 gap-2 text-xs font-semibold px-4 bg-primary text-background hover:bg-primary/90"
                      >
                        {index === 0 ? 'Resume' : 'Try this'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Link href={questionsHref}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-xs font-medium text-secondary hover:text-foreground"
                      >
                        Browse all
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Row: Weakest Topics + Review Queue */}
          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <WeakestTopics topics={weakestTopics} />
            </div>
            <div className="lg:col-span-6">
              {reviewQueue.length > 0 ? (
                <ReviewQueue questions={reviewQueue} />
              ) : (
                <RecentActivity questions={questions} />
              )}
            </div>
          </div>

          <div className="pt-8">
            <BookmarkedList questions={questions} />
          </div>
        </>
      )}
    </div>
  );
}
