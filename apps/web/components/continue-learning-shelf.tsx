'use client';

import {
  IconArrowRight as ArrowRight,
  IconPlayerPlay as Play,
} from '@tabler/icons-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { QuestionRecord } from '@/lib/content/types';
import { useAnalytics } from '@/lib/progress/use-analytics';

interface ContinueLearningShelfProps {
  questions: QuestionRecord[];
  locale: string;
}

export function ContinueLearningShelf({ questions, locale }: ContinueLearningShelfProps) {
  const { ready, continueLearning, overall } = useAnalytics(questions);

  if (!ready || overall.totalAnswered === 0 || !continueLearning.question) {
    return null;
  }

  const q = continueLearning.question;

  return (
    <section className="mb-12">
      <div className="overflow-hidden rounded-lg border border-primary/20 bg-linear-to-r from-primary/5 via-surface to-surface">
        <div className="flex flex-col items-center justify-between gap-4 p-5 md:flex-row md:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Play className="h-4 w-4 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  Resume Practice
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  #{q.id}
                </Badge>
              </div>
              <h2 className="mt-0.5 truncate font-display text-lg font-medium text-foreground">
                {q.title}
              </h2>
            </div>
          </div>

          <div className="flex w-full shrink-0 items-center gap-2 md:w-auto">
            <Link href={`/${locale}/questions/${q.id}`} className="flex-1 md:flex-none">
              <Button className="w-full gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard`} className="hidden md:block">
              <Button variant="secondary">Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
