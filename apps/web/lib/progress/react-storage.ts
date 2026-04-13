import type { SRSData } from '@/lib/progress/srs';
import type { AttemptRecord } from '@/lib/progress/storage';

export interface ReactProgressItem {
  questionId: string;
  attempts: AttemptRecord[];
  srsData?: SRSData;
  updatedAt: string;
}

export interface ReactProgressState {
  version: 1;
  questions: Record<string, ReactProgressItem>;
}

const BASE_KEY = 'jsq_react_progress_v1';
const key = (sid: string) => `${BASE_KEY}_${sid}`;

export const defaultReactProgressState: ReactProgressState = {
  version: 1,
  questions: {},
};

function isValidReactProgressState(value: unknown): value is ReactProgressState {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as ReactProgressState).version === 1 &&
    typeof (value as ReactProgressState).questions === 'object' &&
    (value as ReactProgressState).questions !== null
  );
}

export function readReactProgress(sid: string): ReactProgressState {
  if (typeof window === 'undefined') {
    return defaultReactProgressState;
  }

  try {
    const raw = window.localStorage.getItem(key(sid));
    if (!raw) return defaultReactProgressState;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidReactProgressState(parsed)) {
      return defaultReactProgressState;
    }

    return parsed;
  } catch {
    return defaultReactProgressState;
  }
}

export function writeReactProgress(sid: string, state: ReactProgressState) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key(sid), JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to persist react progress state:', err);
  }
}
