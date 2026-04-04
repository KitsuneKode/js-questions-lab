'use client';

import {
  IconArrowRight as ArrowRight,
  IconBrain as Brain,
  IconLibrary as Library,
  IconSparkles as Sparkles,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { BookmarkedList } from '@/components/dashboard/bookmarked-list';
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { ReviewQueue } from '@/components/dashboard/review-queue';
import { TopicAccuracyChart } from '@/components/dashboard/topic-accuracy-chart';
import { WeakestTopics } from '@/components/dashboard/weakest-topics';
import { IntentPrefetchLink } from '@/components/intent-prefetch-link';
import { Button } from '@/components/ui/button';
import type { QuestionSummary } from '@/lib/content/types';
import { withLocale } from '@/lib/locale-paths';
import { useAnalytics } from '@/lib/progress/use-analytics';

interface DashboardShellProps {
  questions: QuestionSummary[];
  locale: string;
}

export function DashboardShell({ questions, locale }: DashboardShellProps) {
  const t = useTranslations('dashboard');
  const tQuestions = useTranslations('questions');
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
        <p className="font-mono text-xs uppercase tracking-widest text-secondary">{t('loading')}</p>
      </div>
    );
  }

  const hasData = overall.totalAnswered > 0;
  const questionsHref = withLocale(locale, '/questions');

  // Dynamic secondary suggestion: Prioritize reviews if they exist
  const secondarySuggestion =
    reviewQueue.length > 0
      ? {
          labelKey: 'dashboard.reviewsDue',
          description: t('reviewsDueDesc', { count: reviewQueue.length }),
          question: reviewQueue[0],
          icon: Brain,
          isUrgent: true,
        }
      : {
          ...recommended,
          icon: Sparkles,
          isUrgent: false,
        };

  const topSuggestions = [
    { ...continueLearning, icon: Library, isUrgent: false },
    secondarySuggestion,
  ] as const;

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <header className="space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <span className="uppercase tracking-widest font-bold">{t('title')}</span>
        </div>
        <h1 className="font-display text-5xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[clamp(3rem,2rem+3vw,4.5rem)]">
          {t('welcome')}
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-secondary">
          {hasData
            ? t('statSummary', { count: overall.totalAnswered, topics: tagStats.length })
            : t('statHero')}
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
            {topSuggestions.map((suggestion, index) => {
              const Icon = suggestion.icon;
              return (
                <div
                  key={suggestion.question?.id ?? suggestion.labelKey}
                  className={`group relative overflow-hidden rounded-2xl border border-border-subtle bg-surface p-6 transition-all hover:border-border-focus hover:shadow-glow ${suggestion.isUrgent ? 'ring-1 ring-primary/30 bg-primary/5' : ''}`}
                >
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <Icon className="h-24 w-24 text-primary" />
                  </div>

                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                        <Icon
                          className={`h-3.5 w-3.5 ${suggestion.isUrgent ? 'animate-pulse' : ''}`}
                        />
                        {suggestion.labelKey.startsWith('dashboard.')
                          ? t(suggestion.labelKey.replace('dashboard.', ''))
                          : suggestion.labelKey.startsWith('questions.')
                            ? tQuestions(
                                suggestion.labelKey.replace('questions.', ''),
                                suggestion.labelParams,
                              )
                            : t(suggestion.labelKey)}
                      </div>
                      <h2 className="font-display text-2xl text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {suggestion.question ? suggestion.question.title : t('startFirst')}
                      </h2>
                      <p className="text-sm text-secondary">{suggestion.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-border-subtle">
                      <IntentPrefetchLink
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
                          {suggestion.isUrgent
                            ? t('reviewNow')
                            : index === 0
                              ? t('resume')
                              : t('tryThis')}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </IntentPrefetchLink>
                      <IntentPrefetchLink href={questionsHref}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 text-xs font-medium text-secondary hover:text-foreground"
                        >
                          Browse all
                        </Button>
                      </IntentPrefetchLink>
                    </div>
                  </div>
                </div>
              );
            })}
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
