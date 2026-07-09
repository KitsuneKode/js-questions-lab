import { describe, expect, it } from 'vitest';
import { getPathProgress, getPracticePath, PRACTICE_PATHS } from '@/lib/content/practice-paths';

describe('practice paths', () => {
  it('exposes curated paths with stable ids', () => {
    expect(PRACTICE_PATHS.length).toBeGreaterThanOrEqual(3);
    expect(getPracticePath('scope-closures')?.questionIds.length).toBeGreaterThan(0);
  });

  it('computes path progress and next question', () => {
    const path = getPracticePath('scope-closures');
    expect(path).toBeTruthy();
    if (!path) return;

    const empty = getPathProgress(path, new Set());
    expect(empty.done).toBe(0);
    expect(empty.nextId).toBe(path.questionIds[0]);

    const partial = getPathProgress(path, new Set([path.questionIds[0]!]));
    expect(partial.done).toBe(1);
    expect(partial.nextId).toBe(path.questionIds[1]);

    const complete = getPathProgress(path, new Set(path.questionIds));
    expect(complete.done).toBe(path.questionIds.length);
    expect(complete.nextId).toBeNull();
  });
});
