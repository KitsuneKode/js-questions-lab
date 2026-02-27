export type AnswerStatus = 'correct' | 'incorrect';

export interface AttemptRecord {
  selected: 'A' | 'B' | 'C' | 'D';
  status: AnswerStatus;
  attemptedAt: string;
}

export interface ProgressItem {
  questionId: number;
  attempts: AttemptRecord[];
  bookmarked: boolean;
  updatedAt: string;
}

export interface ProgressState {
  version: number;
  questions: Record<string, ProgressItem>;
}

const KEY = 'jsq_progress_v1';

export const defaultProgressState: ProgressState = {
  version: 1,
  questions: {},
};

export function readProgress(): ProgressState {
  if (typeof window === 'undefined') {
    return defaultProgressState;
  }

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      return defaultProgressState;
    }

    const parsed = JSON.parse(raw) as ProgressState;
    if (parsed.version !== 1 || typeof parsed.questions !== 'object') {
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
