import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { getQuestionTags, getTagQuestionCounts } from '@/lib/progress/tag-metadata';

describe('tag-metadata', () => {
  it('does not import full questions.v1.json', () => {
    const source = readFileSync(resolve(process.cwd(), 'lib/progress/tag-metadata.ts'), 'utf8');
    expect(source).not.toContain('questions.v1.json');
    expect(source).toContain('question-index.v1.json');
  });

  it('returns tags for a known question id', () => {
    const tags = getQuestionTags(1);
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
  });

  it('returns tag counts with positive values', () => {
    const counts = getTagQuestionCounts();
    expect(Object.keys(counts).length).toBeGreaterThan(0);
    expect(Object.values(counts).every((count) => count > 0)).toBe(true);
  });

  it('returns empty tags for unknown question id', () => {
    expect(getQuestionTags(999_999)).toEqual([]);
  });
});
