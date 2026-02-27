'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  defaultProgressState,
  readProgress,
  writeProgress,
  type AnswerStatus,
  type ProgressItem,
  type ProgressState,
} from '@/lib/progress/storage';

function ensureItem(state: ProgressState, questionId: number): ProgressItem {
  const existing = state.questions[String(questionId)];
  if (existing) {
    return existing;
  }

  return {
    questionId,
    attempts: [],
    bookmarked: false,
    updatedAt: new Date(0).toISOString(),
  };
}

export function useQuestionProgress(questionId: number) {
  const [state, setState] = useState<ProgressState>(defaultProgressState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = readProgress();
    setState(loaded);
    setReady(true);
  }, []);

  const item = useMemo(() => ensureItem(state, questionId), [questionId, state]);

  function persist(next: ProgressState) {
    setState(next);
    writeProgress(next);
  }

  function saveAttempt(selected: 'A' | 'B' | 'C' | 'D', status: AnswerStatus) {
    const now = new Date().toISOString();

    const next: ProgressState = {
      ...state,
      questions: {
        ...state.questions,
        [String(questionId)]: {
          ...item,
          attempts: [...item.attempts, { selected, status, attemptedAt: now }],
          updatedAt: now,
        },
      },
    };

    persist(next);
  }

  function toggleBookmark() {
    const now = new Date().toISOString();

    const next: ProgressState = {
      ...state,
      questions: {
        ...state.questions,
        [String(questionId)]: {
          ...item,
          bookmarked: !item.bookmarked,
          updatedAt: now,
        },
      },
    };

    persist(next);
  }

  return {
    ready,
    item,
    saveAttempt,
    toggleBookmark,
  };
}
