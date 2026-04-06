import type { QuestionRecord } from '@/lib/content/types';
import { calculateNextReview, type Grade } from '@/lib/progress/srs';
import type { AnswerStatus, AttemptRecord, ProgressItem } from '@/lib/progress/storage';
import { defaultStreakState, type StreakState, updateStreak } from '@/lib/streaks/calculator';
import { computeXP, type XPEvent } from '@/lib/xp/scoring';
import { applyXPEvents, defaultXPState, type XPState } from '@/lib/xp/storage';

type QuestionForAttempt = Pick<QuestionRecord, 'id' | 'difficulty' | 'correctOption' | 'options'>;

export interface AttemptInput {
  question: QuestionForAttempt;
  previousProgress?: ProgressItem;
  previousXPState?: XPState;
  previousStreakState?: StreakState;
  selected: AttemptRecord['selected'];
  recallAnswer?: string | null;
  answeredAt?: string;
}

export interface AttemptResult {
  progressItem: ProgressItem;
  xpState: XPState;
  streakState: StreakState;
  xpEvents: XPEvent[];
  status: AnswerStatus;
}

export interface SelfGradeInput {
  questionId: number;
  previousProgress?: ProgressItem;
  grade: Grade;
  gradedAt?: string;
}

function ensureProgressItem(questionId: number, progress: ProgressItem | undefined): ProgressItem {
  return (
    progress ?? {
      questionId,
      attempts: [],
      bookmarked: false,
      updatedAt: new Date(0).toISOString(),
    }
  );
}

function evaluateRecallAnswer(question: QuestionForAttempt, recallAnswer: string): AnswerStatus {
  if (!question.correctOption) return 'incorrect';

  const correctKey = question.correctOption.toLowerCase();
  const correctOption = question.options.find((option) => option.key === question.correctOption);
  const normalized = recallAnswer.trim().toLowerCase();

  const isStrictMatch =
    normalized === correctKey ||
    normalized === `option ${correctKey}` ||
    (correctOption !== undefined && normalized === correctOption.text.toLowerCase().trim());

  return isStrictMatch ? 'correct' : 'incorrect';
}

export function resolveAttemptStatus(
  question: QuestionForAttempt,
  selected: AttemptRecord['selected'],
  recallAnswer?: string | null,
): AnswerStatus {
  if (typeof recallAnswer === 'string' && recallAnswer.trim().length > 0) {
    return evaluateRecallAnswer(question, recallAnswer);
  }

  if (!question.correctOption || selected === null) {
    return 'incorrect';
  }

  return selected === question.correctOption ? 'correct' : 'incorrect';
}

export function rebuildXPState(events: XPEvent[]): XPState {
  return events
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .reduce((state, event) => applyXPEvents(state, [event]), defaultXPState);
}

export function buildAttemptSummariesFromXPEvents(
  events: XPEvent[],
  questionId?: number,
): Array<Pick<AttemptRecord, 'status' | 'attemptedAt'>> {
  const grouped = new Map<
    string,
    { questionId: number; attemptedAt: string; status: AnswerStatus }
  >();

  for (const event of events) {
    if (questionId !== undefined && event.questionId !== questionId) continue;
    const existing = grouped.get(event.timestamp);
    if (!existing) {
      grouped.set(event.timestamp, {
        questionId: event.questionId,
        attemptedAt: event.timestamp,
        status: event.eventType === 'wrong' ? 'incorrect' : 'correct',
      });
      continue;
    }

    if (event.eventType === 'wrong') {
      existing.status = 'incorrect';
    }
  }

  return [...grouped.values()]
    .sort((a, b) => new Date(a.attemptedAt).getTime() - new Date(b.attemptedAt).getTime())
    .map(({ attemptedAt, status }) => ({ attemptedAt, status }));
}

export function buildAuthoritativeAttemptResult({
  question,
  previousProgress,
  previousXPState = defaultXPState,
  previousStreakState = defaultStreakState,
  selected,
  recallAnswer,
  answeredAt = new Date().toISOString(),
}: AttemptInput): AttemptResult {
  const baseProgress = ensureProgressItem(question.id, previousProgress);
  const status = resolveAttemptStatus(question, selected, recallAnswer);
  const today = answeredAt.slice(0, 10);
  const isFirstAnswerToday = previousXPState.events.every(
    (event) => event.timestamp.slice(0, 10) !== today,
  );
  const priorAttemptSummaries = buildAttemptSummariesFromXPEvents(
    previousXPState.events,
    question.id,
  );

  const xpEvents = computeXP({
    questionId: question.id,
    status,
    difficulty: question.difficulty,
    srsData: baseProgress.srsData,
    todayAttempts: priorAttemptSummaries,
    isFirstAnswerToday,
  }).map((event) => ({ ...event, timestamp: answeredAt }));

  const progressItem: ProgressItem = {
    ...baseProgress,
    attempts: [
      ...baseProgress.attempts,
      {
        selected,
        status,
        attemptedAt: answeredAt,
      },
    ],
    updatedAt: answeredAt,
  };

  const xpState = applyXPEvents(previousXPState, xpEvents);
  const { state: streakState } = updateStreak(previousStreakState, today);

  return {
    progressItem,
    xpState,
    streakState,
    xpEvents,
    status,
  };
}

export function buildAuthoritativeSelfGradeResult({
  questionId,
  previousProgress,
  grade,
  gradedAt = new Date().toISOString(),
}: SelfGradeInput): ProgressItem {
  const baseProgress = ensureProgressItem(questionId, previousProgress);

  return {
    ...baseProgress,
    srsData: calculateNextReview(grade, baseProgress.srsData),
    updatedAt: gradedAt,
  };
}
