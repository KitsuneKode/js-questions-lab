import type { Grade, SRSData } from '@/lib/progress/srs';

export type AnswerStatus = 'correct' | 'incorrect';

export type AttemptMode = 'quiz' | 'recall';

export type AttemptErrorType = 'misread' | 'forgot' | 'wrong_concept' | 'guess';

export interface AttemptRecord {
  selected: 'A' | 'B' | 'C' | 'D' | null;
  status: AnswerStatus;
  attemptedAt: string;
  /** How the answer was submitted. Optional for legacy records. */
  mode?: AttemptMode;
  /** Freeform recall text (capped). Optional for legacy / quiz records. */
  responseText?: string;
  /** Self-diagnosed error reason after an incorrect answer. */
  errorType?: AttemptErrorType;
  /** Hard / Good / Easy self-grade attached to this attempt. */
  selfGrade?: Grade;
  /** Time from question open / reset to submit, in milliseconds. */
  timeMs?: number;
  /** Client submission id for idempotent sync / analytics joins. */
  submissionId?: string;
  /**
   * True when no ground truth exists to judge this attempt (open-ended recall
   * on questions without a correct option). Excluded from accuracy/mastery
   * scoring; kept for history and SRS self-grading.
   */
  unjudgeable?: boolean;
}

export interface ProgressItem {
  questionId: number;
  attempts: AttemptRecord[];
  bookmarked: boolean;
  srsData?: SRSData;
  updatedAt: string;
}

const MAX_RESPONSE_TEXT_LENGTH = 2000;

export function createAttemptRecord(input: AttemptRecord): AttemptRecord {
  const record: AttemptRecord = {
    selected: input.selected,
    status: input.status,
    attemptedAt: input.attemptedAt,
  };

  if (input.mode) record.mode = input.mode;
  if (typeof input.responseText === 'string' && input.responseText.length > 0) {
    record.responseText = input.responseText.slice(0, MAX_RESPONSE_TEXT_LENGTH);
  }
  if (input.errorType) record.errorType = input.errorType;
  if (input.selfGrade) record.selfGrade = input.selfGrade;
  if (typeof input.timeMs === 'number' && Number.isFinite(input.timeMs) && input.timeMs >= 0) {
    record.timeMs = Math.round(input.timeMs);
  }
  if (input.submissionId) record.submissionId = input.submissionId;
  if (input.unjudgeable) record.unjudgeable = true;

  return record;
}

export function getLastAttempt(attempts: AttemptRecord[]): AttemptRecord | undefined {
  return attempts.length > 0 ? attempts[attempts.length - 1] : undefined;
}

export function patchLastAttempt(
  attempts: AttemptRecord[],
  patch: Partial<Pick<AttemptRecord, 'errorType' | 'selfGrade' | 'responseText' | 'mode'>>,
): AttemptRecord[] {
  if (attempts.length === 0) return attempts;

  const lastIndex = attempts.length - 1;
  const last = attempts[lastIndex];
  if (!last) return attempts;

  const next = [...attempts];
  next[lastIndex] = createAttemptRecord({ ...last, ...patch });
  return next;
}

export function isAttemptErrorType(value: string): value is AttemptErrorType {
  return (
    value === 'misread' || value === 'forgot' || value === 'wrong_concept' || value === 'guess'
  );
}

export interface ProgressState {
  version: number;
  questions: Record<string, ProgressItem>;
}

const BASE_KEY = 'jsq_progress_v2';
const key = (sid: string) => `${BASE_KEY}_${sid}`;

export const defaultProgressState: ProgressState = {
  version: 2,
  questions: {},
};

function isValidProgressState(value: unknown): value is ProgressState {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ProgressState).version === 'number' &&
    (value as ProgressState).version === 2 &&
    typeof (value as ProgressState).questions === 'object' &&
    (value as ProgressState).questions !== null
  );
}

export function readProgress(sid: string): ProgressState {
  if (typeof window === 'undefined') {
    return defaultProgressState;
  }

  try {
    const raw = window.localStorage.getItem(key(sid));
    if (!raw) return defaultProgressState;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidProgressState(parsed)) {
      return defaultProgressState;
    }

    return parsed;
  } catch {
    return defaultProgressState;
  }
}

export function writeProgress(sid: string, state: ProgressState) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key(sid), JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to persist progress state:', err);
  }
}
