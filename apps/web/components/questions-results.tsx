'use client';

import { useEffect, useMemo, useState } from 'react';

import { QuestionCard } from '@/components/question-card';
import { defaultProgressState, readProgress, type ProgressState } from '@/lib/progress/storage';
import type { QuestionRecord } from '@/lib/content/types';

interface QuestionsResultsProps {
  questions: QuestionRecord[];
  status: 'all' | 'answered' | 'unanswered' | 'bookmarked';
}

export function QuestionsResults({ questions, status }: QuestionsResultsProps) {
  const [progress, setProgress] = useState<ProgressState>(defaultProgressState);

  useEffect(() => {
    setProgress(readProgress());
  }, []);

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
  }, [questions, status]);

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
