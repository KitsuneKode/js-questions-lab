import type { Difficulty } from '@/lib/content/types';
import type { SRSData } from '@/lib/progress/srs';
import type { AnswerStatus, AttemptRecord } from '@/lib/progress/storage';

export type AttemptSummary = Pick<AttemptRecord, 'status' | 'attemptedAt'>;

export interface XPEvent {
  questionId: number;
  xpDelta: number;
  eventType:
    | 'correct'
    | 'wrong'
    | 'precision_bonus'
    | 'streak_bonus'
    | 'mastery_cap'
    | 'cooldown'
    | 'srs_clear';
  timestamp: string;
}

export interface ComputeXPParams {
  questionId: number;
  status: AnswerStatus;
  difficulty: Difficulty;
  srsData: SRSData | undefined;
  /**
   * All prior attempts for this question (unfiltered).
   * Used for cooldown detection (time-based) and precision bonus (date-based).
   */
  todayAttempts: AttemptSummary[];
  /** Whether this is the first answer of the day across ALL questions. */
  isFirstAnswerToday: boolean;
}

const BASE_XP: Record<Difficulty, number> = {
  beginner: 10,
  intermediate: 20,
  advanced: 35,
};

const WRONG_XP = -5;
const PRECISION_BONUS = 10;
const STREAK_BONUS = 15;
const MASTERY_CAP_XP = 2;
const COOLDOWN_MINUTES = 10;

function isWithinCooldown(attempts: AttemptSummary[]): boolean {
  if (attempts.length === 0) return false;
  const last = attempts[attempts.length - 1];
  const elapsed = Date.now() - new Date(last.attemptedAt).getTime();
  return elapsed < COOLDOWN_MINUTES * 60 * 1000;
}

function isMastered(srsData: SRSData | undefined): boolean {
  return (srsData?.repetition ?? 0) >= 4;
}

/**
 * Compute XP events for a single answer submission.
 * Returns an array of events (base + any bonuses) to be recorded.
 * When within cooldown, returns a single cooldown event with xpDelta: 0.
 */
export function computeXP(params: ComputeXPParams): XPEvent[] {
  const { questionId, status, difficulty, srsData, todayAttempts, isFirstAnswerToday } = params;
  const now = new Date().toISOString();
  const todayStr = now.slice(0, 10);

  // Cooldown: same question answered within 10 minutes → 0 XP (time-based, not date-based)
  if (isWithinCooldown(todayAttempts)) {
    return [{ questionId, xpDelta: 0, eventType: 'cooldown', timestamp: now }];
  }

  const events: XPEvent[] = [];

  if (status === 'incorrect') {
    events.push({ questionId, xpDelta: WRONG_XP, eventType: 'wrong', timestamp: now });
    // Still apply the first-answer streak bonus even on a wrong answer
    if (isFirstAnswerToday) {
      events.push({ questionId, xpDelta: STREAK_BONUS, eventType: 'streak_bonus', timestamp: now });
    }
    return events;
  }

  // Correct answer
  const mastered = isMastered(srsData);
  const base = mastered ? MASTERY_CAP_XP : BASE_XP[difficulty];
  events.push({
    questionId,
    xpDelta: base,
    eventType: mastered ? 'mastery_cap' : 'correct',
    timestamp: now,
  });

  // Precision bonus: first attempt correct with no prior wrongs today on this question
  const attemptsToday = todayAttempts.filter((a) => a.attemptedAt.slice(0, 10) === todayStr);
  const hadWrongToday = attemptsToday.some((a) => a.status === 'incorrect');
  if (!mastered && !hadWrongToday && attemptsToday.length === 0) {
    events.push({
      questionId,
      xpDelta: PRECISION_BONUS,
      eventType: 'precision_bonus',
      timestamp: now,
    });
  }

  // Streak bonus: applied once on the first answer of each day
  if (isFirstAnswerToday) {
    events.push({ questionId, xpDelta: STREAK_BONUS, eventType: 'streak_bonus', timestamp: now });
  }

  return events;
}

/** Sum total XP delta from a list of events. */
export function sumXP(events: XPEvent[]): number {
  return events.reduce((acc, e) => acc + e.xpDelta, 0);
}
