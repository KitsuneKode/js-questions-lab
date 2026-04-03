'use client';

import { IconArrowRight as ArrowRight, IconSparkles as Sparkles } from '@tabler/icons-react';
import { IntentPrefetchLink } from '@/components/intent-prefetch-link';
import { Button } from '@/components/ui/button';
import type { QuestionSummary } from '@/lib/content/types';
import { useAnalytics } from '@/lib/progress/use-analytics';

interface NextRecommendedBannerProps {
  questions: QuestionSummary[];
  locale: string;
}

export function NextRecommendedBanner({ questions, locale }: NextRecommendedBannerProps) {
  const { ready, recommended } = useAnalytics(questions);

  if (!ready || !recommended.question) return null;

  const q = recommended.question;

  return (
    <section className="animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="group relative overflow-hidden rounded-xl border border-primary/20 bg-linear-to-r from-primary/5 via-card/60 to-card/40 p-5">
        {/* Subtle glow */}
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-medium uppercase tracking-widest text-primary">
                  Recommended
                </p>
                <span className="text-[9px] text-muted-foreground/50">{recommended.label}</span>
              </div>
              <h2 className="font-display text-base font-medium text-foreground transition-colors group-hover:text-primary sm:text-lg">
                {q.title}
              </h2>
            </div>
          </div>
          <IntentPrefetchLink
            href={`/${locale}/questions/${q.id}`}
            className="w-full shrink-0 sm:w-auto"
          >
            <Button size="sm" className="w-full gap-2 sm:w-auto">
              Practice
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </IntentPrefetchLink>
        </div>
      </div>
    </section>
  );
}
