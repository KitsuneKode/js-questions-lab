'use client';

import { IconSearch as Search } from '@tabler/icons-react';
import { useCallback, useMemo, useState } from 'react';
import { PaginationNav } from '@/components/pagination-nav';
import { QuestionCard } from '@/components/question-card';
import {
  applyStatusFilter,
  buildQuestionScopeQuery,
  paginate,
  type QuestionScope,
} from '@/lib/content/query';
import type { QuestionRecord } from '@/lib/content/types';
import { useProgress } from '@/lib/progress/progress-context';

interface QuestionsResultsProps {
  questions: QuestionRecord[];
  scope: QuestionScope;
  locale: string;
  pageSize?: number;
}

export function QuestionsResults({
  questions,
  scope,
  locale,
  pageSize = 18,
}: QuestionsResultsProps) {
  const { state: progress, ready } = useProgress();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const scopeQuery = useMemo(() => buildQuestionScopeQuery(scope, { includePage: false }), [scope]);

  const scopedQuestions = useMemo(() => {
    if (scope.status !== 'all' && !ready) {
      return null;
    }

    return applyStatusFilter(questions, scope.status, progress.questions);
  }, [questions, scope.status, progress.questions, ready]);

  const paged = useMemo(() => {
    if (!scopedQuestions) {
      return null;
    }

    return paginate(scopedQuestions, scope.page, pageSize);
  }, [pageSize, scope.page, scopedQuestions]);

  const createHref = useCallback(
    (page: number) => {
      const query = buildQuestionScopeQuery({ ...scope, page }, { includePage: true });
      return query ? `/${locale}/questions?${query}` : `/${locale}/questions`;
    },
    [locale, scope],
  );

  if (scope.status !== 'all' && !ready) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border-subtle bg-surface/30 px-6 py-20 text-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <div className="space-y-2">
          <p className="font-display text-xl text-foreground">Loading your progress</p>
          <p className="text-sm text-secondary">
            Rebuilding this filtered view from your local progress data.
          </p>
        </div>
      </div>
    );
  }

  if (!paged) {
    return null;
  }

  const detailPrefix = `/${locale}/questions/`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/50">
        <p>
          <span className="text-foreground/70">{paged.items.length}</span>
          <span className="mx-1.5 text-muted-foreground/30">/</span>
          <span>{paged.total} questions</span>
        </p>
        <p className="flex items-center gap-1.5 font-mono">
          <span className="text-foreground/70">{paged.page}</span>
          <span className="text-muted-foreground/30">/</span>
          <span>{paged.pageCount}</span>
        </p>
      </div>

      {paged.total === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border-subtle bg-surface/30 px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-elevated border border-border-subtle shadow-inner">
            <Search className="h-6 w-6 text-tertiary" />
          </div>
          <div className="space-y-2">
            <p className="font-display text-xl text-foreground">No questions found</p>
            <p className="text-sm text-secondary">
              Adjust your filters or try a different search term.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: visual-only hover effect, no interaction */}
          <div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            onMouseLeave={() => setHoveredId(null)}
          >
            {paged.items.map((question) => (
              // biome-ignore lint/a11y/noStaticElementInteractions: visual-only hover effect, no interaction
              <div
                key={question.id}
                onMouseEnter={() => setHoveredId(question.id)}
                style={{
                  opacity: hoveredId !== null && hoveredId !== question.id ? 0.6 : 1,
                  transform:
                    hoveredId !== null && hoveredId !== question.id ? 'scale(0.98)' : 'scale(1)',
                }}
              >
                <QuestionCard
                  question={question}
                  locale={locale}
                  isHovered={hoveredId === question.id}
                  href={`${detailPrefix}${question.id}${scopeQuery ? `?${scopeQuery}` : ''}`}
                />
              </div>
            ))}
          </div>

          <PaginationNav page={paged.page} pageCount={paged.pageCount} createHref={createHref} />
        </>
      )}
    </div>
  );
}
