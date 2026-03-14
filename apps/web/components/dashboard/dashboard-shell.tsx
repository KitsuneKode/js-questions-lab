'use client';

import Link from 'next/link';
import { ArrowRight, Library, Sparkles } from 'lucide-react';

import type { QuestionRecord } from '@/lib/content/types';
import { useAnalytics } from '@/lib/progress/use-analytics';
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { TopicAccuracyChart } from '@/components/dashboard/topic-accuracy-chart';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { WeakestTopics } from '@/components/dashboard/weakest-topics';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { BookmarkedList } from '@/components/dashboard/bookmarked-list';
import { ReviewQueue } from '@/components/dashboard/review-queue';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DashboardShellProps {
  questions: QuestionRecord[];
}

export function DashboardShell({ questions }: DashboardShellProps) {
  const {
    ready,
    overall,
    tagStats,
    dailyActivity,
    weakestTopics,
    reviewQueue,
    continueLearning,
    recommended,
  } =
    useAnalytics(questions);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading progress data&hellip;</p>
      </div>
    );
  }

  const hasData = overall.totalAnswered > 0;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Practice hub</p>
        <h1 className="font-display text-3xl text-foreground md:text-4xl">Train JavaScript like an interview circuit.</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {hasData
            ? `${overall.totalAnswered} questions answered across ${tagStats.length} active topics. Use this hub to resume, review weak spots, and keep your streak alive.`
            : 'Start with one question, get feedback fast, and build a reliable JavaScript interview rhythm.'}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {[continueLearning, recommended].map((suggestion, index) => (
          <Card key={suggestion.label} className="overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-card/40">
            <CardContent className="flex h-full flex-col gap-4 p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary">
                {index === 0 ? <Library className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                {suggestion.label}
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-2xl text-foreground">
                  {suggestion.question ? suggestion.question.title : 'No question available yet'}
                </h2>
                <p className="text-sm text-muted-foreground">{suggestion.description}</p>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-3">
                <Link href={suggestion.question ? `/questions/${suggestion.question.id}` : '/questions'}>
                  <Button>
                    {index === 0 ? 'Resume practice' : 'Try recommendation'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/questions">
                  <Button variant="secondary">Browse library</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <OverviewCards overall={overall} />

      {hasData && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <TopicAccuracyChart tagStats={tagStats} />
            <ActivityChart dailyActivity={dailyActivity} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <WeakestTopics topics={weakestTopics} />
            <RecentActivity questions={questions} />
          </div>

          {reviewQueue.length > 0 && <ReviewQueue questions={reviewQueue} />}

          <BookmarkedList questions={questions} />
        </>
      )}
    </div>
  );
}
