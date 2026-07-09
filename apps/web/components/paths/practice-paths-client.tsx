'use client';

import { IconArrowRight, IconRoute } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { IntentPrefetchLink } from '@/components/intent-prefetch-link';
import { Button } from '@/components/ui/button';
import { getPathProgress, PRACTICE_PATHS } from '@/lib/content/practice-paths';
import { withLocale } from '@/lib/locale-paths';
import { useProgress } from '@/lib/progress/progress-context';

interface PracticePathsClientProps {
  locale: string;
}

export function PracticePathsClient({ locale }: PracticePathsClientProps) {
  const t = useTranslations('paths');
  const { state, ready } = useProgress();

  const answeredIds = new Set(
    Object.values(state.questions)
      .filter((item) => item.attempts.length > 0)
      .map((item) => item.questionId),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <span className="uppercase tracking-widest font-bold">{t('eyebrow')}</span>
        </div>
        <h1 className="font-display text-5xl font-normal tracking-tight text-foreground">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-lg text-secondary">{t('subtitle')}</p>
      </header>

      <div className="grid gap-5">
        {PRACTICE_PATHS.map((path) => {
          const progress = ready
            ? getPathProgress(path, answeredIds)
            : { done: 0, total: path.questionIds.length, nextId: path.questionIds[0] ?? null };
          const href = withLocale(locale, `/questions/${progress.nextId ?? path.questionIds[0]}`);

          return (
            <article
              key={path.id}
              className="rounded-2xl border border-border-subtle bg-surface/70 p-6 transition-colors hover:border-border-focus"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                    <IconRoute className="h-3.5 w-3.5" />
                    {t('questions', { count: path.questionIds.length })}
                  </div>
                  <h2 className="font-display text-2xl text-foreground">{t(path.titleKey)}</h2>
                  <p className="max-w-xl text-sm leading-relaxed text-secondary">
                    {t(path.descriptionKey)}
                  </p>
                  <p className="font-mono text-[11px] text-tertiary">
                    {t('progress', { done: progress.done, total: progress.total })}
                  </p>
                </div>
                <IntentPrefetchLink href={href}>
                  <Button className="gap-2">
                    {t('start')}
                    <IconArrowRight className="h-4 w-4" />
                  </Button>
                </IntentPrefetchLink>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
