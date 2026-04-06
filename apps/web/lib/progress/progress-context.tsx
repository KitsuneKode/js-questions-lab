'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useSafeAuth } from '@/lib/auth-utils';
import type { Difficulty } from '@/lib/content/types';
import {
  fetchServerProgress,
  syncProgressToServer,
  upsertSingleQuestion,
} from '@/lib/progress/actions';
import { useSectionProgressStore } from '@/lib/progress/section-progress-store';
import { calculateNextReview, type Grade } from '@/lib/progress/srs';
import {
  type AnswerStatus,
  defaultProgressState,
  type ProgressItem,
  type ProgressState,
  readProgress,
  writeProgress,
} from '@/lib/progress/storage';
import { getQuestionTags, getTagQuestionCounts } from '@/lib/progress/tag-metadata';
import type { StreakState } from '@/lib/streaks/calculator';
import { updateStreak } from '@/lib/streaks/calculator';
import { readStreak, writeStreak } from '@/lib/streaks/storage';
import { computeXP } from '@/lib/xp/scoring';
import type { XPState } from '@/lib/xp/storage';
import { applyXPEvents, defaultXPState, readXP, writeXP } from '@/lib/xp/storage';

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type ProgressAction =
  | { type: 'init'; state: ProgressState }
  | { type: 'attempt'; questionId: number; selected: 'A' | 'B' | 'C' | 'D'; status: AnswerStatus }
  | { type: 'bookmark'; questionId: number }
  | { type: 'grade'; questionId: number; grade: Grade }
  | { type: 'merge'; serverItems: ProgressItem[] };

function ensureItem(state: ProgressState, questionId: number): ProgressItem {
  return (
    state.questions[String(questionId)] ?? {
      questionId,
      attempts: [],
      bookmarked: false,
      updatedAt: new Date(0).toISOString(),
    }
  );
}

function mergeItems(local: ProgressItem | undefined, server: ProgressItem): ProgressItem {
  if (!local) return server;
  const localTime = new Date(local.updatedAt).getTime();
  const serverTime = new Date(server.updatedAt).getTime();
  if (serverTime > localTime) return server;
  if (localTime > serverTime) return local;
  return server.attempts.length >= local.attempts.length ? server : local;
}

function progressReducer(state: ProgressState, action: ProgressAction): ProgressState {
  switch (action.type) {
    case 'init':
      return action.state;

    case 'attempt': {
      const now = new Date().toISOString();
      const prev = ensureItem(state, action.questionId);
      return {
        ...state,
        questions: {
          ...state.questions,
          [String(action.questionId)]: {
            ...prev,
            attempts: [
              ...prev.attempts,
              { selected: action.selected, status: action.status, attemptedAt: now },
            ],
            updatedAt: now,
          },
        },
      };
    }

    case 'bookmark': {
      const now = new Date().toISOString();
      const prev = ensureItem(state, action.questionId);
      return {
        ...state,
        questions: {
          ...state.questions,
          [String(action.questionId)]: {
            ...prev,
            bookmarked: !prev.bookmarked,
            updatedAt: now,
          },
        },
      };
    }

    case 'grade': {
      const now = new Date().toISOString();
      const prev = ensureItem(state, action.questionId);
      const newSrsData = calculateNextReview(action.grade, prev.srsData);
      return {
        ...state,
        questions: {
          ...state.questions,
          [String(action.questionId)]: {
            ...prev,
            srsData: newSrsData,
            updatedAt: now,
          },
        },
      };
    }

    case 'merge': {
      const merged = { ...state.questions };
      for (const serverItem of action.serverItems) {
        const key = String(serverItem.questionId);
        merged[key] = mergeItems(merged[key], serverItem);
      }
      return { ...state, questions: merged };
    }
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ProgressContextValue {
  state: ProgressState;
  ready: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  saveAttempt: (
    questionId: number,
    selected: 'A' | 'B' | 'C' | 'D',
    status: AnswerStatus,
    difficulty?: Difficulty,
  ) => void;
  saveSelfGrade: (questionId: number, grade: Grade) => void;
  toggleBookmark: (questionId: number) => void;
  xpState: XPState;
  streakState: StreakState;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(progressReducer, defaultProgressState);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [xpState, setXPState] = useState<XPState>(defaultXPState);
  const [streakState, setStreakState] = useState<StreakState>({
    version: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
  });
  const xpStateRef = useRef(xpState);
  xpStateRef.current = xpState;
  const streakStateRef = useRef(streakState);
  streakStateRef.current = streakState;
  const prevStateRef = useRef(state);
  // Always-fresh state reference — assigned at render time so callbacks
  // can read current state without needing state in their dependency arrays.
  const stateRef = useRef(state);
  stateRef.current = state;
  const { isSignedIn } = useSafeAuth();

  // Init: load from localStorage on mount
  useEffect(() => {
    const loaded = readProgress();
    dispatch({ type: 'init', state: loaded });
    setXPState(readXP());
    setStreakState(readStreak());
    setReady(true);
  }, []);

  // Merge server progress on sign-in
  useEffect(() => {
    if (!isSignedIn || !ready) return;

    let cancelled = false;
    setSyncStatus('syncing');

    (async () => {
      try {
        const serverItems = await fetchServerProgress();
        const localState = readProgress();

        if (!cancelled) {
          dispatch({ type: 'merge', serverItems });

          const localNewer: ProgressItem[] = [];
          for (const localItem of Object.values(localState.questions)) {
            const serverItem = serverItems.find((s) => s.questionId === localItem.questionId);
            if (!serverItem || new Date(localItem.updatedAt) > new Date(serverItem.updatedAt)) {
              localNewer.push(localItem);
            }
          }

          if (localNewer.length > 0) {
            await syncProgressToServer(localNewer);
          }

          setSyncStatus('idle');
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Sign-in sync failed:', error);
          setSyncStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, ready]);

  // Persist to localStorage on every state change
  useEffect(() => {
    if (!ready) return;
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;
    writeProgress(state);
  }, [ready, state]);

  // ---------------------------------------------------------------------------
  // Mutations — dispatch to reducer + immediate server sync if signed in
  // ---------------------------------------------------------------------------

  const saveAttempt = useCallback(
    (
      questionId: number,
      selected: 'A' | 'B' | 'C' | 'D',
      status: AnswerStatus,
      difficulty: Difficulty = 'beginner',
    ) => {
      const now = new Date().toISOString();
      const prev = ensureItem(stateRef.current, questionId);
      const updated: ProgressItem = {
        ...prev,
        attempts: [...prev.attempts, { selected, status, attemptedAt: now }],
        updatedAt: now,
      };
      dispatch({ type: 'attempt', questionId, selected, status });
      if (isSignedIn) {
        setSyncStatus('syncing');
        upsertSingleQuestion(updated)
          .then(() => setSyncStatus('idle'))
          .catch((err) => {
            console.error('Failed to sync attempt:', err);
            setSyncStatus('error');
          });
      }

      // Auto-sync section progress
      const questionTags = getQuestionTags(questionId);
      const tagCounts = getTagQuestionCounts();

      for (const tag of questionTags) {
        const store = useSectionProgressStore.getState();
        // Initialize if first time
        if (!store.sections[tag]) {
          store.updateSection(tag, { totalQuestions: tagCounts[tag] || 1 });
        }
        store.markQuestionAnswered(tag, status === 'correct');
      }

      // XP computation
      const today = new Date().toISOString().slice(0, 10);
      const allQuestions = stateRef.current.questions;
      const isFirstAnswerToday = !Object.values(allQuestions).some((item) =>
        item.attempts.some((a) => a.attemptedAt.slice(0, 10) === today),
      );
      const todayAttempts = prev.attempts.filter((a) => a.attemptedAt.slice(0, 10) === today);
      const xpEvents = computeXP({
        questionId,
        status,
        difficulty,
        srsData: prev.srsData,
        todayAttempts,
        isFirstAnswerToday,
      });
      const newXPState = applyXPEvents(xpStateRef.current, xpEvents);
      setXPState(newXPState);
      writeXP(newXPState);

      // Streak update
      const { state: newStreakState } = updateStreak(streakStateRef.current, today);
      setStreakState(newStreakState);
      writeStreak(newStreakState);
    },
    [isSignedIn],
  );

  const saveSelfGrade = useCallback(
    (questionId: number, grade: Grade) => {
      const now = new Date().toISOString();
      const prev = ensureItem(stateRef.current, questionId);
      const newSrsData = calculateNextReview(grade, prev.srsData);
      const updated: ProgressItem = {
        ...prev,
        srsData: newSrsData,
        updatedAt: now,
      };
      dispatch({ type: 'grade', questionId, grade });
      if (isSignedIn) {
        setSyncStatus('syncing');
        upsertSingleQuestion(updated)
          .then(() => setSyncStatus('idle'))
          .catch((err) => {
            console.error('Failed to sync grade:', err);
            setSyncStatus('error');
          });
      }
    },
    [isSignedIn],
  );

  const toggleBookmark = useCallback(
    (questionId: number) => {
      const now = new Date().toISOString();
      const prev = ensureItem(stateRef.current, questionId);
      const updated: ProgressItem = {
        ...prev,
        bookmarked: !prev.bookmarked,
        updatedAt: now,
      };
      dispatch({ type: 'bookmark', questionId });
      if (isSignedIn) {
        setSyncStatus('syncing');
        upsertSingleQuestion(updated)
          .then(() => setSyncStatus('idle'))
          .catch((err) => {
            console.error('Failed to sync bookmark:', err);
            setSyncStatus('error');
          });
      }
    },
    [isSignedIn],
  );

  const value: ProgressContextValue = {
    state,
    ready,
    syncStatus,
    saveAttempt,
    saveSelfGrade,
    toggleBookmark,
    xpState,
    streakState,
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return ctx;
}
