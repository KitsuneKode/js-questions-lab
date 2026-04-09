import { describe, expect, it } from 'vitest';
import {
  getReactDiscoveryIndex,
  getReactManifest,
  getReactQuestion,
  getReactQuestions,
} from '@/lib/content/react-loaders';

describe('react-loaders', () => {
  it('getReactQuestions returns an array of questions', () => {
    const questions = getReactQuestions();
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThan(0);
  });

  it('each question has required fields', () => {
    const questions = getReactQuestions();
    for (const question of questions) {
      expect(typeof question.id).toBe('string');
      expect(typeof question.title).toBe('string');
      expect(typeof question.prompt).toBe('string');
      expect(typeof question.starterCode).toBe('object');
      expect(typeof question.solutionCode).toBe('object');
      expect(typeof question.entryFile).toBe('string');
      expect(['beginner', 'intermediate', 'advanced']).toContain(question.difficulty);
      expect(typeof question.previewVisible).toBe('boolean');
    }
  });

  it('getReactQuestion returns a question by id', () => {
    const question = getReactQuestion('react-counter');
    expect(question).not.toBeNull();
    expect(question?.id).toBe('react-counter');
  });

  it('render props mouse challenge keeps a full-height preview container', () => {
    const question = getReactQuestion('react-render-props-mouse');
    expect(question).not.toBeNull();
    expect(question?.starterCode['App.tsx']).toContain('min-h-screen');
    expect(question?.solutionCode['App.tsx']).toContain('min-h-screen');
  });

  it('getReactQuestion returns null for unknown id', () => {
    expect(getReactQuestion('does-not-exist')).toBeNull();
  });

  it('getReactManifest returns manifest with totalQuestions', () => {
    const manifest = getReactManifest();
    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.totalQuestions).toBeGreaterThan(0);
    expect(Array.isArray(manifest.questions)).toBe(true);
  });

  it('getReactDiscoveryIndex returns summary items', () => {
    const index = getReactDiscoveryIndex();
    expect(index.length).toBeGreaterThan(0);
    expect(typeof index[0]?.id).toBe('string');
    expect(typeof index[0]?.title).toBe('string');
  });
});
