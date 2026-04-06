import type { SRSData } from '@/lib/progress/srs';

export type AnswerStatus = 'correct' | 'incorrect';

export interface AttemptRecord {
  selected: 'A' | 'B' | 'C' | 'D' | null;
  status: AnswerStatus;
  attemptedAt: string;
}

export interface ProgressItem {
  questionId: number;
  attempts: AttemptRecord[];
  bookmarked: boolean;
  srsData?: SRSData;
  updatedAt: string;
}

export interface ProgressState {
  version: number;
  questions: Record<string, ProgressItem>;
}

const KEY = 'jsq_progress_v2';

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

export function readProgress(): ProgressState {
  if (typeof window === 'undefined') {
    return defaultProgressState;
  }

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      // Check for v1 data to migrate
      const v1Raw = window.localStorage.getItem('jsq_progress_v1');
      if (v1Raw) {
        const v1Parsed = JSON.parse(v1Raw);
        window.localStorage.removeItem('jsq_progress_v1');
        return {
          version: 2,
          questions: v1Parsed.questions || {},
        };
      }
      return defaultProgressState;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isValidProgressState(parsed)) {
      return defaultProgressState;
    }

    return parsed;
  } catch {
    return defaultProgressState;
  }
}

export function writeProgress(state: ProgressState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(KEY, JSON.stringify(state));
}
