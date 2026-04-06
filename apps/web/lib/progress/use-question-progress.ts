'use client';

import { useMemo } from 'react';
import type { Difficulty } from '@/lib/content/types';
import { useProgress } from '@/lib/progress/progress-context';
import type { Grade } from '@/lib/progress/srs';
import type { AnswerStatus, ProgressItem } from '@/lib/progress/storage';

function ensureItem(questions: Record<string, ProgressItem>, questionId: number): ProgressItem {
  return (
    questions[String(questionId)] ?? {
      questionId,
      attempts: [],
      bookmarked: false,
      updatedAt: new Date(0).toISOString(),
    }
  );
}

export function useQuestionProgress(questionId: number) {
  const { ready, state, saveAttempt, toggleBookmark, saveSelfGrade } = useProgress();

  const item = useMemo(() => ensureItem(state.questions, questionId), [questionId, state]);

  return {
    ready,
    item,
    saveAttempt: (selected: 'A' | 'B' | 'C' | 'D', status: AnswerStatus, difficulty?: Difficulty) =>
      saveAttempt(questionId, selected, status, difficulty),
    saveSelfGrade: (grade: Grade) => saveSelfGrade(questionId, grade),
    toggleBookmark: () => toggleBookmark(questionId),
  };
}
