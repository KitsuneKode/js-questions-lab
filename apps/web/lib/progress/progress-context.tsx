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
  appendXPEvents,
  applyServerSelfGrade,
  fetchStreak,
  fetchXPState,
  recordAttempt,
  replayGuestAttempts,
  upsertStreak,
} from '@/lib/engagement/actions';
import { listGuestAttemptsToReplay } from '@/lib/engagement/guest-replay';
import {
  fetchServerProgress,
  syncProgressToServer,
  upsertSingleQuestion,
} from '@/lib/progress/actions';
import { countDueReviews } from '@/lib/progress/analytics';
import { clearGuestData, getOrCreateGuestSid, rotateGuestSid } from '@/lib/progress/guest-session';
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
import { mergeStreakStates } from '@/lib/streaks/merge';
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
// Context
// ---------------------------------------------------------------------------

interface ProgressContextValue {
  state: ProgressState;
  ready: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  saveAttempt: (
    questionId: number,
    selected: 'A' | 'B' | 'C' | 'D' | null,
    status: AnswerStatus,
    options?: { difficulty?: Difficulty; recallAnswer?: string; locale?: string },
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
  const [streakState, setStreakState] = useState<StreakState>(defaultStreakState);
  const prevStateRef = useRef(state);
  const stateRef = useRef(state);
  stateRef.current = state;

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
        const guestProgress = guestSid ? readProgress(guestSid) : defaultProgressState;
        const guestXP = guestSid ? readXP(guestSid) : defaultXPState;
        const guestStreak = guestSid ? readStreak(guestSid) : defaultStreakState;

        const [serverItems, serverXP, serverStreak] = await Promise.all([
          fetchServerProgress(),
          fetchXPState(),
          fetchStreak(),
        ]);

        if (cancelled) return;

        dispatch({ type: 'merge', serverItems });

        const localNewer: ProgressItem[] = [];
        for (const localItem of Object.values(guestProgress.questions)) {
          const serverItem = serverItems.find((s) => s.questionId === localItem.questionId);
          if (!serverItem || new Date(localItem.updatedAt) > new Date(serverItem.updatedAt)) {
            localNewer.push(localItem);
          }
        }

        // 1) Replay FIRST → authoritative XP + streak from engine (avoids duplicate attempts)
        const toReplay = listGuestAttemptsToReplay(guestProgress, serverItems);
        let nextXP = serverXP;
        let nextStreak = serverStreak ?? defaultStreakState;

        if (toReplay.length > 0) {
          const replayed = await replayGuestAttempts(toReplay);
          if (replayed) {
            nextXP = replayed.xpState;
            nextStreak = replayed.streakState;
          }
        } else if (guestXP.events.length > 0 && serverXP.events.length === 0) {
          // Edge: guest has XP events but no replayable attempt delta (rare).
          // Prefer server; do not invent XP without attempts.
          nextXP = serverXP;
        }

        // 2) Sync newer progress rows AFTER replay (SRS/bookmarks/attempt arrays upsert)
        if (localNewer.length > 0) {
          await syncProgressToServer(localNewer);
        }

        // 3) Merge streaks (guest calendar streak vs post-replay server streak)
        const today = new Date().toISOString().slice(0, 10);
        const mergedStreak = mergeStreakStates(guestStreak, nextStreak, today);
        await upsertStreak(mergedStreak);

        if (cancelled) return;

        setXPState(nextXP);
        setStreakState(mergedStreak);

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

      dispatch({ type: 'grade', questionId, grade });

      const awardClearBonus = () => {
        if (!clearedQueue) return;
        const event = buildSrsClearEvent(questionId);
        if (isSignedIn) {
          const submissionId = `srs-clear:${new Date().toISOString().slice(0, 10)}:${questionId}`;
          appendXPEvents([event], submissionId)
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
        applyServerSelfGrade(questionId, grade)
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
