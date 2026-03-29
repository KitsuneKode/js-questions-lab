'use client';

import { IconSearch as Search } from '@tabler/icons-react';
import { useState } from 'react';
import { QuestionCard } from '@/components/question-card';
import type { QuestionRecord } from '@/lib/content/types';
import { useProgress } from '@/lib/progress/progress-context';

interface QuestionsResultsProps {
  questions: QuestionRecord[];
  status: 'all' | 'answered' | 'unanswered' | 'bookmarked';
  locale: string;
}

export function QuestionsResults({ questions, status, locale }: QuestionsResultsProps) {
  const { state: progress } = useProgress();
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const filtered = questions.filter((question) => {
    if (status === 'all') return true;
    const item = progress.questions[String(question.id)];
    const hasAttempts = Boolean(item?.attempts?.length);
    const bookmarked = Boolean(item?.bookmarked);

    if (status === 'answered') return hasAttempts;
    if (status === 'unanswered') return !hasAttempts;
    if (status === 'bookmarked') return bookmarked;
    return true;
  });

  if (filtered.length === 0) {
    return (
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
    );
  }

  return (
    <div
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      onMouseLeave={() => setHoveredId(null)}
    >
      {filtered.map((question) => (
        <div
          key={question.id}
          onMouseEnter={() => setHoveredId(question.id)}
          className="transition-all duration-300"
          style={{
            opacity: hoveredId !== null && hoveredId !== question.id ? 0.6 : 1,
            transform: hoveredId !== null && hoveredId !== question.id ? 'scale(0.98)' : 'scale(1)',
          }}
        >
          <QuestionCard question={question} locale={locale} isHovered={hoveredId === question.id} />
        </div>
      ))}
    </div>
  );
}
