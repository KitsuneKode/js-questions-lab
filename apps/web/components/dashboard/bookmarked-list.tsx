'use client';

import {
  IconArrowRight as ArrowRight,
  IconBookmark as Bookmark,
  IconCircleCheck as CheckCircle2,
  IconCircleX as XCircle,
} from '@tabler/icons-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { QuestionRecord } from '@/lib/content/types';
import { useProgress } from '@/lib/progress/progress-context';

interface BookmarkedListProps {
  questions: QuestionRecord[];
}

export function BookmarkedList({ questions }: BookmarkedListProps) {
  const { state } = useProgress();

  const bookmarked = questions.filter((q) => state.questions[String(q.id)]?.bookmarked);

  if (bookmarked.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-6 relative overflow-hidden group">
      <div className="mb-6 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h3 className="font-display text-2xl text-foreground flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary fill-primary/20" />
            Saved Questions
          </h3>
          <p className="text-sm text-secondary mt-1">
            Questions you've set aside for later review.
          </p>
        </div>
        <span className="font-mono text-sm text-tertiary bg-background px-4 py-1.5 rounded-lg border border-border-subtle shadow-sm">
          <span className="text-foreground font-medium">{bookmarked.length}</span> saved
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 relative z-10">
        {bookmarked.slice(0, 6).map((q) => {
          const item = state.questions[String(q.id)];
          const lastStatus = item?.attempts[item.attempts.length - 1]?.status;

          return (
            <Link
              key={q.id}
              href={`/questions/${q.id}`}
              className="group/item flex flex-col justify-between rounded-xl border border-border-subtle bg-background p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow min-h-[120px]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-medium text-foreground line-clamp-2 leading-snug group-hover/item:text-primary transition-colors">
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
                  <span className="font-mono text-[11px] text-tertiary bg-surface px-1.5 py-0.5 rounded border border-border-subtle">
                    #{q.id}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-tertiary border border-border-subtle px-1.5 py-0.5 rounded bg-surface">
                    {q.difficulty}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-tertiary group-hover/item:text-primary transition-colors group-hover/item:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {bookmarked.length > 6 && (
        <div className="mt-8 flex justify-center relative z-10">
          <Link href="/questions?status=bookmarked">
            <Button
              variant="outline"
              className="gap-2 h-10 px-6 rounded-full border-border-subtle bg-background hover:bg-elevated hover:text-primary transition-all group/btn"
            >
              View all {bookmarked.length} saved
              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
