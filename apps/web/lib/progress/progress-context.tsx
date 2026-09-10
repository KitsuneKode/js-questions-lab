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
  applyServerSelfGrade,
  awardSrsClearBonus,
  fetchStreak,
  fetchXPState,
  recordAttempt,
  replayGuestAttempts,
} from '@/lib/engagement/actions';
import { listGuestAttemptsToReplay } from '@/lib/engagement/guest-replay';
import {
  fetchServerProgress,
  syncProgressToServer,
  upsertSingleQuestion,
} from '@/lib/progress/actions';
import { countDueReviews } from '@/lib/progress/analytics';
import { clearGuestData, getOrCreateGuestSid, rotateGuestSid } from '@/lib/progress/guest-session';
import {
  defaultReactProgressState,
  type ReactProgressItem,
  type ReactProgressState,
  readReactProgress,
  writeReactProgress,
} from '@/lib/progress/react-storage';
import { useSectionProgressStore } from '@/lib/progress/section-progress-store';
import { calculateNextReview, type Grade } from '@/lib/progress/srs';
import {
  type AnswerStatus,
  type AttemptErrorType,
  type AttemptMode,
  createAttemptRecord,
  defaultProgressState,
  type ProgressItem,
  type ProgressState,
  readProgress,
  writeProgress,
} from '@/lib/progress/storage';
import { getQuestionTags, getTagQuestionCounts } from '@/lib/progress/tag-metadata';
import { defaultStreakState, type StreakState, updateStreak } from '@/lib/streaks/calculator';
import { readStreak, writeStreak } from '@/lib/streaks/storage';
import { buildSrsClearEvent, computeXP } from '@/lib/xp/scoring';
import type { XPState } from '@/lib/xp/storage';
import { applyXPEvents, defaultXPState, readXP, writeXP } from '@/lib/xp/storage';

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type ProgressAction =
  | { type: 'init'; state: ProgressState }
  | {
      type: 'attempt';
      questionId: number;
      selected: 'A' | 'B' | 'C' | 'D' | null;
      status: AnswerStatus;
      mode?: AttemptMode;
      responseText?: string;
      timeMs?: number;
      submissionId?: string;
      unjudgeable?: boolean;
    }
  | { type: 'bookmark'; questionId: number }
  | {
      type: 'grade';
      questionId: number;
      grade: Grade;
      errorType?: AttemptErrorType;
    }
  | { type: 'replace'; item: ProgressItem }
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
              createAttemptRecord({
                selected: action.selected,
                status: action.status,
                attemptedAt: now,
                mode: action.mode,
                responseText: action.responseText,
                timeMs: action.timeMs,
                submissionId: action.submissionId,
                unjudgeable: action.unjudgeable,
              }),
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
      const attempts =
        prev.attempts.length === 0
          ? prev.attempts
          : prev.attempts.map((attempt, index) =>
              index === prev.attempts.length - 1
                ? createAttemptRecord({
                    ...attempt,
                    selfGrade: action.grade,
                    ...(action.errorType ? { errorType: action.errorType } : {}),
                  })
                : attempt,
            );
      return {
        ...state,
        questions: {
          ...state.questions,
          [String(action.questionId)]: {
            ...prev,
            attempts,
            srsData: newSrsData,
            updatedAt: now,
          },
        },
      };
    }

    case 'replace': {
      return {
        ...state,
        questions: {
          ...state.questions,
          [String(action.item.questionId)]: action.item,
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
// React progress (string IDs, local-first; server sync is not implemented yet)
// ---------------------------------------------------------------------------

type ReactProgressAction =
  | { type: 'init'; state: ReactProgressState }
  | { type: 'attempt'; questionId: string; status: AnswerStatus }
  | { type: 'complete'; questionId: string }
  | { type: 'grade'; questionId: string; grade: Grade };

function ensureReactItem(state: ReactProgressState, questionId: string): ReactProgressItem {
  return (
    state.questions[questionId] ?? {
      questionId,
      attempts: [],
      updatedAt: new Date(0).toISOString(),
    }
  );
}

function reactProgressReducer(
  state: ReactProgressState,
  action: ReactProgressAction,
): ReactProgressState {
  switch (action.type) {
    case 'init':
      return action.state;
    case 'attempt': {
      const now = new Date().toISOString();
      const prev = ensureReactItem(state, action.questionId);
      return {
        ...state,
        questions: {
          ...state.questions,
          [action.questionId]: {
            ...prev,
            attempts: [
              ...prev.attempts,
              { selected: null, status: action.status, attemptedAt: now },
            ],
            updatedAt: now,
          },
        },
      };
    }
    case 'complete': {
      const now = new Date().toISOString();
      const prev = ensureReactItem(state, action.questionId);
      return {
        ...state,
        questions: {
          ...state.questions,
          [action.questionId]: {
            ...prev,
            completed: true,
            updatedAt: now,
          },
        },
      };
    }
    case 'grade': {
      const now = new Date().toISOString();
      const prev = ensureReactItem(state, action.questionId);
      const newSrsData = calculateNextReview(action.grade, prev.srsData);
      return {
        ...state,
        questions: {
          ...state.questions,
          [action.questionId]: {
            ...prev,
            srsData: newSrsData,
            updatedAt: now,
          },
        },
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ProgressContextValue {
  state: ProgressState;
  reactState: ReactProgressState;
  ready: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  saveAttempt: (
    questionId: number,
    selected: 'A' | 'B' | 'C' | 'D' | null,
    status: AnswerStatus,
    options?: {
      difficulty?: Difficulty;
      recallAnswer?: string;
      locale?: string;
      mode?: AttemptMode;
      timeMs?: number;
      errorType?: AttemptErrorType;
      unjudgeable?: boolean;
    },
  ) => void;
  saveSelfGrade: (questionId: number, grade: Grade, errorType?: AttemptErrorType) => void;
  saveReactAttempt: (questionId: string, status: AnswerStatus) => void;
  saveReactComplete: (questionId: string) => void;
  saveReactSelfGrade: (questionId: string, grade: Grade) => void;
  toggleBookmark: (questionId: number) => void;
  xpState: XPState;
  streakState: StreakState;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(progressReducer, defaultProgressState);
  const [reactState, reactDispatch] = useReducer(reactProgressReducer, defaultReactProgressState);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [xpState, setXPState] = useState<XPState>(defaultXPState);
  const [streakState, setStreakState] = useState<StreakState>(defaultStreakState);
  const prevStateRef = useRef(state);
  const prevReactStateRef = useRef(reactState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Holds the guest session ID for the lifetime of this session.
  // Created on mount, consumed (cleared + rotated) on sign-in,
  // rotated on sign-out / session expiry.
  const guestSidRef = useRef<string | null>(null);

  const { isSignedIn } = useSafeAuth();
  // Track the previous isSignedIn value to detect sign-out transitions.
  const prevSignedInRef = useRef(isSignedIn);
  // Tracks whether sign-in merge already ran this session (hydrate on re-run, merge on false→true).
  const wasSignedInForMergeRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Init: load guest data from session-keyed localStorage on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const sid = getOrCreateGuestSid();
    guestSidRef.current = sid;
    dispatch({ type: 'init', state: readProgress(sid) });
    reactDispatch({ type: 'init', state: readReactProgress(sid) });
    setXPState(readXP(sid));
    setStreakState(readStreak(sid));
    setReady(true);
  }, []);

  // ---------------------------------------------------------------------------
  // Sign-out / session expiry detection
  // Reset in-memory state and rotate the guest SID so the next session
  // starts completely clean.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (prevSignedInRef.current && !isSignedIn) {
      const newSid = rotateGuestSid();
      guestSidRef.current = newSid;
      dispatch({ type: 'init', state: defaultProgressState });
      reactDispatch({ type: 'init', state: defaultReactProgressState });
      setXPState(defaultXPState);
      setStreakState(defaultStreakState);
    }
    prevSignedInRef.current = isSignedIn;
  }, [isSignedIn]);

  // ---------------------------------------------------------------------------
  // Sign-in: merge guest session into server, then consume the guest session
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isSignedIn || !ready) {
      if (!isSignedIn) {
        wasSignedInForMergeRef.current = false;
      }
      return;
    }

    const isSignInTransition = !wasSignedInForMergeRef.current;
    wasSignedInForMergeRef.current = true;

    let cancelled = false;
    setSyncStatus('syncing');

    (async () => {
      try {
        if (!isSignInTransition) {
          const [serverItems, serverXP, serverStreak] = await Promise.all([
            fetchServerProgress(),
            fetchXPState(),
            fetchStreak(),
          ]);
          if (cancelled) return;
          dispatch({ type: 'merge', serverItems });
          setXPState(serverXP);
          setStreakState(serverStreak ?? defaultStreakState);
          setSyncStatus('idle');
          return;
        }

        const guestSid = guestSidRef.current;
        const guestProgress = guestSid ? readProgress(guestSid) : defaultProgressState;

        const [serverItems, serverXP, serverStreak] = await Promise.all([
          fetchServerProgress(),
          fetchXPState(),
          fetchStreak(),
        ]);

        if (cancelled) return;

        dispatch({ type: 'merge', serverItems });

        const toReplay = listGuestAttemptsToReplay(guestProgress, serverItems);
        let nextXP = serverXP;
        let nextStreak = serverStreak ?? defaultStreakState;

        if (toReplay.length > 0) {
          const replayed = await replayGuestAttempts(toReplay);
          if (replayed) {
            nextXP = replayed.xpState;
            nextStreak = replayed.streakState;
          }
        }

        const bookmarkDeltas: ProgressItem[] = [];
        for (const localItem of Object.values(guestProgress.questions)) {
          const serverItem = serverItems.find((item) => item.questionId === localItem.questionId);
          if (Boolean(localItem.bookmarked) !== Boolean(serverItem?.bookmarked)) {
            bookmarkDeltas.push({
              questionId: localItem.questionId,
              attempts: [],
              bookmarked: localItem.bookmarked,
              updatedAt: new Date().toISOString(),
            });
          }
        }

        if (bookmarkDeltas.length > 0) {
          await syncProgressToServer(bookmarkDeltas);
        }

        if (cancelled) return;

        setXPState(nextXP);
        setStreakState(nextStreak);

        // 4) Consume guest session
        if (guestSid) {
          clearGuestData(guestSid);
          guestSidRef.current = rotateGuestSid();
        }

        setSyncStatus('idle');
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

  // ---------------------------------------------------------------------------
  // Persist guest progress to session-keyed localStorage on state changes.
  // Authenticated users are skipped — server is the source of truth for them.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!ready) return;
    if (isSignedIn) return;
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;
    if (guestSidRef.current) {
      writeProgress(guestSidRef.current, state);
    }
  }, [ready, state, isSignedIn]);

  // React progress is local-first for now (server schema is numeric JS question IDs).
  useEffect(() => {
    if (!ready) return;
    if (reactState === prevReactStateRef.current) return;
    prevReactStateRef.current = reactState;
    if (guestSidRef.current) {
      writeReactProgress(guestSidRef.current, reactState);
    }
  }, [ready, reactState]);

  // ---------------------------------------------------------------------------
  // Mutations — dispatch to reducer + immediate server sync if signed in
  // ---------------------------------------------------------------------------

  const saveAttempt = useCallback(
    (
      questionId: number,
      selected: 'A' | 'B' | 'C' | 'D' | null,
      status: AnswerStatus,
      options?: {
        difficulty?: Difficulty;
        recallAnswer?: string;
        locale?: string;
        mode?: AttemptMode;
        timeMs?: number;
        errorType?: AttemptErrorType;
        unjudgeable?: boolean;
      },
    ) => {
      const now = new Date().toISOString();
      const submissionId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${questionId}:${now}:${selected ?? 'recall'}`;
      const difficulty = options?.difficulty ?? 'beginner';
      const mode: AttemptMode =
        options?.mode ??
        (typeof options?.recallAnswer === 'string' && options.recallAnswer.trim().length > 0
          ? 'recall'
          : 'quiz');
      const prev = ensureItem(stateRef.current, questionId);
      dispatch({
        type: 'attempt',
        questionId,
        selected,
        status,
        mode,
        responseText: options?.recallAnswer,
        timeMs: options?.timeMs,
        submissionId,
        unjudgeable: options?.unjudgeable,
      });

      const questionTags = getQuestionTags(questionId);
      const tagCounts = getTagQuestionCounts();

      for (const tag of questionTags) {
        const store = useSectionProgressStore.getState();
        if (!store.sections[tag]) {
          store.updateSection(tag, { totalQuestions: tagCounts[tag] || 1 });
        }
        store.markQuestionAnswered(tag, status === 'correct');
      }

      if (isSignedIn) {
        setSyncStatus('syncing');
        recordAttempt({
          questionId,
          selected,
          submissionId,
          recallAnswer: options?.recallAnswer,
          locale: options?.locale,
          mode,
          timeMs: options?.timeMs,
          errorType: options?.errorType,
        })
          .then((result) => {
            if (!result) return;
            dispatch({ type: 'replace', item: result.progressItem });
            // Server is authoritative for authenticated users — update in-memory
            // state only, no localStorage write.
            setXPState(result.xpState);
            setStreakState(result.streakState);
            setSyncStatus('idle');
          })
          .catch((err) => {
            console.error('Failed to sync authoritative attempt:', err);
            setSyncStatus('error');
          });
        return;
      }

      // Guest path: compute XP and streak locally and persist to session storage.
      const today = new Date().toISOString().slice(0, 10);
      const sid = guestSidRef.current;

      setXPState((prevXP) => {
        const isFirstAnswerToday = prevXP.lastEarnedDate !== today;
        const computedXPEvents = computeXP({
          questionId,
          status,
          difficulty,
          srsData: prev.srsData,
          priorAttempts: prev.attempts,
          isFirstAnswerToday,
        });
        const next = applyXPEvents(prevXP, computedXPEvents);
        if (sid) writeXP(sid, next);
        return next;
      });

      setStreakState((prevStreak) => {
        const { state: next } = updateStreak(prevStreak, today);
        if (sid) writeStreak(sid, next);
        return next;
      });
    },
    [isSignedIn],
  );

  const saveSelfGrade = useCallback(
    (questionId: number, grade: Grade, errorType?: AttemptErrorType) => {
      const dueBefore = countDueReviews(stateRef.current);

      const prev = ensureItem(stateRef.current, questionId);
      const nextItem = {
        ...prev,
        srsData: calculateNextReview(grade, prev.srsData),
        updatedAt: new Date().toISOString(),
      };
      const predictedState = {
        ...stateRef.current,
        questions: {
          ...stateRef.current.questions,
          [String(questionId)]: nextItem,
        },
      };
      const dueAfter = countDueReviews(predictedState);
      const clearedQueue = dueBefore > 0 && dueAfter === 0;

      dispatch({ type: 'grade', questionId, grade, errorType });

      const awardClearBonus = () => {
        if (!clearedQueue) return;
        const event = buildSrsClearEvent(questionId);
        if (isSignedIn) {
          awardSrsClearBonus(questionId)
            .then((nextXP) => {
              if (nextXP) setXPState(nextXP);
            })
            .catch((err) => console.error('Failed to award srs_clear XP:', err));
          return;
        }
        const sid = guestSidRef.current;
        setXPState((prevXP) => {
          const next = applyXPEvents(prevXP, [event]);
          if (sid) writeXP(sid, next);
          return next;
        });
      };

      if (isSignedIn) {
        setSyncStatus('syncing');
        applyServerSelfGrade(questionId, grade, errorType)
          .then((serverItem) => {
            if (serverItem) {
              dispatch({ type: 'replace', item: serverItem });
            }
            awardClearBonus();
            setSyncStatus('idle');
          })
          .catch((err) => {
            console.error('Failed to sync grade:', err);
            setSyncStatus('error');
          });
        return;
      }

      awardClearBonus();
    },
    [isSignedIn],
  );

  const saveReactAttempt = useCallback((questionId: string, status: AnswerStatus) => {
    reactDispatch({ type: 'attempt', questionId, status });
  }, []);

  const saveReactComplete = useCallback((questionId: string) => {
    reactDispatch({ type: 'complete', questionId });
  }, []);

  const saveReactSelfGrade = useCallback((questionId: string, grade: Grade) => {
    reactDispatch({ type: 'grade', questionId, grade });
  }, []);

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
    reactState,
    ready,
    syncStatus,
    saveAttempt,
    saveSelfGrade,
    saveReactAttempt,
    saveReactComplete,
    saveReactSelfGrade,
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
