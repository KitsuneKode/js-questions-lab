'use client';

import { IconArrowRight as ArrowRight, IconBrain as Brain } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

import { IntentPrefetchLink } from '@/components/intent-prefetch-link';
import { Button } from '@/components/ui/button';
import type { QuestionSummary } from '@/lib/content/types';
import { withLocale } from '@/lib/locale-paths';
import { useAnalytics } from '@/lib/progress/use-analytics';

export function ReviewStartClient({
  locale,
  questions,
}: {
  locale: string;
  questions: QuestionSummary[];
}) {
  const t = useTranslations('dashboard');
  const { ready, reviewQueue } = useAnalytics(questions);

  if (!ready) {
    return (
      <p className="font-mono text-xs uppercase tracking-widest text-secondary">{t('loading')}</p>
    );
  }

  if (reviewQueue.length === 0) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="font-display text-4xl text-foreground">{t('reviewPageTitle')}</h1>
        <p className="text-secondary">{t('reviewEmpty')}</p>
        <IntentPrefetchLink href={withLocale(locale, '/questions')}>
          <Button>{t('browseQuestions')}</Button>
        </IntentPrefetchLink>
      </div>
    );
  }

  const first = reviewQueue[0];
  if (!first) {
    return null;
  }
  const startHref = withLocale(locale, `/questions/${first.id}?status=review`);

  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
          <Brain className="h-4 w-4" />
          {t('reviewsDue')}
        </div>
        <h1 className="font-display text-4xl text-foreground">{t('reviewPageTitle')}</h1>
        <p className="text-secondary">{t('reviewsDueDesc', { count: reviewQueue.length })}</p>
      </div>
      <IntentPrefetchLink href={startHref}>
        <Button size="lg" className="gap-2">
          {t('startReview')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </IntentPrefetchLink>
      <ul className="space-y-2">
        {reviewQueue.slice(0, 10).map((q) => (
          <li key={q.id}>
            <IntentPrefetchLink
              href={withLocale(locale, `/questions/${q.id}?status=review`)}
              className="text-sm text-foreground hover:text-primary"
            >
              #{q.id} {q.title}
            </IntentPrefetchLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
