import { beforeEach, describe, expect, it } from 'vitest';
import { defaultProgressState, readProgress, writeProgress } from '@/lib/progress/storage';

const sid = 'test-session-abc';
const KEY = `jsq_progress_v2_${sid}`;

describe('progress storage (session-keyed)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('writes progress to a key scoped to the given SID', () => {
    const state = {
      version: 2,
      questions: {
        '1': {
          questionId: 1,
          attempts: [],
          bookmarked: false,
          updatedAt: '2026-04-06T00:00:00.000Z',
        },
      },
    };
    writeProgress(sid, state);
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify(state));
  });

  it('reads progress from a key scoped to the given SID', () => {
    const state = { version: 2, questions: {} };
    window.localStorage.setItem(KEY, JSON.stringify(state));
    expect(readProgress(sid)).toEqual(state);
  });

  it('returns default state when nothing is stored for the given SID', () => {
    expect(readProgress(sid)).toEqual(defaultProgressState);
  });

  it('does not read from the flat legacy key', () => {
    window.localStorage.setItem(
      'jsq_progress_v2',
      JSON.stringify({ version: 2, questions: { '99': {} } }),
    );
    expect(readProgress(sid)).toEqual(defaultProgressState);
  });

  it('returns default state when stored data is corrupt', () => {
    window.localStorage.setItem(KEY, 'not-valid-json{{');
    expect(readProgress(sid)).toEqual(defaultProgressState);
  });
});
