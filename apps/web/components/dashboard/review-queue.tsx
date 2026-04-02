'use client';

import {
  IconArrowRight as ArrowRight,
  IconRotateClockwise2 as RotateCcw,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { QuestionRecord } from '@/lib/content/types';

interface ReviewQueueProps {
  questions: QuestionRecord[];
}

export function ReviewQueue({ questions }: ReviewQueueProps) {
  const t = useTranslations('dashboard');
  if (questions.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-6 h-full flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.08] transition-opacity duration-500">
        <RotateCcw className="w-32 h-32 text-primary" />
      </div>

      <div className="mb-6 relative z-10 flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl text-foreground">{t('labelReviewQueue')}</h3>
          <p className="text-xs text-secondary mt-1">{t('reviewQueueSub')}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 relative z-10">
        {questions.slice(0, 6).map((q) => (
          <Link
            key={q.id}
            href={`/questions/${q.id}`}
            className="group/item flex flex-col justify-between rounded-xl border border-border-subtle bg-background p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow min-h-[110px]"
          >
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="font-mono text-[10px] text-tertiary bg-surface border border-border-subtle px-1.5 py-0.5 rounded">
                  #{q.id}
                </span>
                <span className="inline-block px-1.5 py-0.5 rounded border border-border-subtle bg-surface text-[9px] font-bold uppercase tracking-wider text-tertiary">
                  {q.difficulty}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover/item:text-primary transition-colors">
                {q.title}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-end border-t border-border-subtle/50 pt-2">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary opacity-0 transition-all group-hover/item:opacity-100 transform translate-x-2 group-hover/item:translate-x-0">
                {t('labelReviewAction')} <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
