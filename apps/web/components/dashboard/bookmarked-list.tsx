'use client';

import {
  IconArrowRight as ArrowRight,
  IconBookmark as Bookmark,
  IconCircleCheck as CheckCircle2,
  IconCircleX as XCircle,
} from '@tabler/icons-react';
import { useLocale, useTranslations } from 'next-intl';
import { IntentPrefetchLink } from '@/components/intent-prefetch-link';
import { Button } from '@/components/ui/button';
import type { QuestionSummary } from '@/lib/content/types';
import { withLocale } from '@/lib/locale-paths';
import { useProgress } from '@/lib/progress/progress-context';

interface BookmarkedListProps {
  questions: QuestionSummary[];
}

export function BookmarkedList({ questions }: BookmarkedListProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const { state } = useProgress();

  const bookmarked = questions.filter((q) => state.questions[String(q.id)]?.bookmarked);

  if (bookmarked.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-surface/40 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_32px_rgba(0,0,0,0.12)] p-6 relative overflow-hidden group">
      <div className="mb-6 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h3 className="font-display text-2xl text-foreground flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary fill-primary/20" />
            {t('labelSaved')}
          </h3>
          <p className="text-sm text-secondary mt-1">{t('savedSub')}</p>
        </div>
        <span className="font-mono text-sm text-tertiary bg-background px-4 py-1.5 rounded-lg border border-white/5 shadow-sm tabular-nums">
          <span className="text-foreground font-medium">{bookmarked.length}</span>{' '}
          {t('savedCount', { count: '' }).replace('()', '').trim()}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 relative z-10">
        {bookmarked.slice(0, 6).map((q) => {
          const item = state.questions[String(q.id)];
          const lastStatus = item?.attempts[item.attempts.length - 1]?.status;

          return (
            <IntentPrefetchLink
              key={q.id}
              href={withLocale(locale, `/questions/${q.id}`)}
              className="group/item flex flex-col justify-between rounded-xl border border-white/5 bg-background/50 p-5 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:shadow-[0_4px_20px_rgba(245,158,11,0.08)] active:scale-[0.98] min-h-[120px]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-medium text-foreground line-clamp-2 leading-snug group-hover/item:text-primary transition-colors text-pretty">
                  {q.title}
                </p>
                {lastStatus && (
                  <div
                    className={`shrink-0 h-6 w-6 flex items-center justify-center rounded-full ${lastStatus === 'correct' ? 'bg-status-correct/10 text-status-correct' : 'bg-status-wrong/10 text-status-wrong'}`}
                  >
                    {lastStatus === 'correct' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border-subtle/50 pt-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-tertiary bg-surface px-1.5 py-0.5 rounded border border-border-subtle tabular-nums">
                    #{q.id}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-tertiary border border-border-subtle px-1.5 py-0.5 rounded bg-surface">
                    {q.difficulty}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-tertiary group-hover/item:text-primary transition-colors group-hover/item:translate-x-0.5" />
              </div>
            </IntentPrefetchLink>
          );
        })}
      </div>

      {bookmarked.length > 6 && (
        <div className="mt-8 flex justify-center relative z-10">
          <IntentPrefetchLink href={withLocale(locale, '/questions?status=bookmarked')}>
            <Button
              variant="outline"
              className="gap-2 h-10 px-6 rounded-full border-border-subtle bg-background hover:bg-elevated hover:text-primary transition-[transform,box-shadow,border-color,background-color,color] duration-200 ease-out active:scale-[0.96] group/btn"
            >
              {t('viewAllSaved', { count: bookmarked.length })}
              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </IntentPrefetchLink>
        </div>
      )}
    </div>
  );
}
