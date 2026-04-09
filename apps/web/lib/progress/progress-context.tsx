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
  fetchStreak,
  fetchXPState,
  recordAttempt,
} from '@/lib/engagement/actions';
import {
  fetchServerProgress,
  syncProgressToServer,
  upsertSingleQuestion,
} from '@/lib/progress/actions';
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
  defaultProgressState,
  type ProgressItem,
  type ProgressState,
  readProgress,
  writeProgress,
} from '@/lib/progress/storage';
import { getQuestionTags, getTagQuestionCounts } from '@/lib/progress/tag-metadata';
import { defaultStreakState, type StreakState, updateStreak } from '@/lib/streaks/calculator';
import { readStreak, writeStreak } from '@/lib/streaks/storage';
import { computeXP } from '@/lib/xp/scoring';
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
    }
  | { type: 'bookmark'; questionId: number }
  | { type: 'grade'; questionId: number; grade: Grade }
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
    options?: { difficulty?: Difficulty; recallAnswer?: string; locale?: string },
  ) => void;
  saveSelfGrade: (questionId: number, grade: Grade) => void;
  saveReactAttempt: (questionId: string, status: AnswerStatus) => void;
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
  const reactStateRef = useRef(reactState);
  reactStateRef.current = reactState;

  // Holds the guest session ID for the lifetime of this session.
  // Created on mount, consumed (cleared + rotated) on sign-in,
  // rotated on sign-out / session expiry.
  const guestSidRef = useRef<string | null>(null);

  const { isSignedIn } = useSafeAuth();
  // Track the previous isSignedIn value to detect sign-out transitions.
  const prevSignedInRef = useRef(isSignedIn);

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
      setXPState(defaultXPState);
      setStreakState(defaultStreakState);
    }
    prevSignedInRef.current = isSignedIn;
  }, [isSignedIn]);

  // ---------------------------------------------------------------------------
  // Sign-in: merge guest session into server, then consume the guest session
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isSignedIn || !ready) return;

    let cancelled = false;
    setSyncStatus('syncing');

    (async () => {
      try {
        const guestSid = guestSidRef.current;
        // Read guest progress before fetching server data so we capture
        // exactly what was accumulated in this guest session.
        const guestProgress = guestSid ? readProgress(guestSid) : defaultProgressState;

        const [serverItems, serverXP, serverStreak] = await Promise.all([
          fetchServerProgress(),
          fetchXPState(),
          fetchStreak(),
        ]);

        if (!cancelled) {
          dispatch({ type: 'merge', serverItems });
          setXPState(serverXP);
          // Streak: server is authoritative for authenticated state
          const authoritativeStreak = serverStreak ?? defaultStreakState;
          setStreakState(authoritativeStreak);

          // Push any guest progress that is newer than what's on the server
          const localNewer: ProgressItem[] = [];
          for (const localItem of Object.values(guestProgress.questions)) {
            const serverItem = serverItems.find((s) => s.questionId === localItem.questionId);
            if (!serverItem || new Date(localItem.updatedAt) > new Date(serverItem.updatedAt)) {
              localNewer.push(localItem);
            }
          }

          if (localNewer.length > 0) {
            await syncProgressToServer(localNewer);
          }

          // Consume the guest session: delete its data and rotate to a fresh SID.
          // Any future sign-out will start with a clean guest session.
          if (guestSid) {
            clearGuestData(guestSid);
            const newSid = rotateGuestSid();
            guestSidRef.current = newSid;
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

  // React progress is always local-first for now (even when signed in),
  // because the server schema/actions currently assume numeric question IDs.
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
      options?: { difficulty?: Difficulty; recallAnswer?: string; locale?: string },
    ) => {
      const now = new Date().toISOString();
      const submissionId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${questionId}:${now}:${selected ?? 'recall'}`;
      const difficulty = options?.difficulty ?? 'beginner';
      const prev = ensureItem(stateRef.current, questionId);
      dispatch({ type: 'attempt', questionId, selected, status });

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
    (questionId: number, grade: Grade) => {
      dispatch({ type: 'grade', questionId, grade });
      if (isSignedIn) {
        setSyncStatus('syncing');
        applyServerSelfGrade(questionId, grade)
          .then((serverItem) => {
            if (serverItem) {
              dispatch({ type: 'replace', item: serverItem });
            }
            setSyncStatus('idle');
          })
          .catch((err) => {
            console.error('Failed to sync grade:', err);
            setSyncStatus('error');
          });
        return;
      }
    },
    [isSignedIn],
  );

  const saveReactAttempt = useCallback((questionId: string, status: AnswerStatus) => {
    reactDispatch({ type: 'attempt', questionId, status });
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
