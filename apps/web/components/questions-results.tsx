'use client';

import { useMemo } from 'react';

import { QuestionCard } from '@/components/question-card';
import type { QuestionRecord } from '@/lib/content/types';
import { useProgress } from '@/lib/progress/progress-context';

interface QuestionsResultsProps {
  questions: QuestionRecord[];
  status: 'all' | 'answered' | 'unanswered' | 'bookmarked';
}

export function QuestionsResults({ questions, status }: QuestionsResultsProps) {
  const { state: progress } = useProgress();

  const filtered = useMemo(() => {
    if (status === 'all') {
      return questions;
    }

    return questions.filter((question) => {
      const item = progress.questions[String(question.id)];
      const hasAttempts = Boolean(item?.attempts?.length);
      const bookmarked = Boolean(item?.bookmarked);

      if (status === 'answered') {
        return hasAttempts;
      }

      if (status === 'unanswered') {
        return !hasAttempts;
      }

      if (status === 'bookmarked') {
        return bookmarked;
      }

      return true;
    });
  }, [progress, questions, status]);

  if (filtered.length === 0) {
    return <p className="rounded-lg border border-border bg-card/60 p-6 text-sm text-muted-foreground">No questions on this page match the selected status filter.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {filtered.map((question) => (
        <QuestionCard key={question.id} question={question} />
      ))}
    </div>
  );
}
