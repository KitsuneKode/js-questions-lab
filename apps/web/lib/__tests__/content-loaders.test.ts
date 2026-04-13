import { beforeEach, describe, expect, it, vi } from 'vitest';

const existsSyncMock = vi.hoisted(() => vi.fn<(path: string) => boolean>());
const readFileSyncMock = vi.hoisted(() => vi.fn<(path: string) => string>());

vi.mock('node:fs', () => ({
  default: {
    existsSync: existsSyncMock,
    readFileSync: readFileSyncMock,
  },
  existsSync: existsSyncMock,
  readFileSync: readFileSyncMock,
}));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    cache: <T extends (...args: any[]) => any>(fn: T) => fn,
  };
});

function createQuestion() {
  return {
    id: 1,
    slug: 'closures',
    locale: 'en',
    title: 'Closures',
    promptMarkdown: 'Explain closures.',
    codeBlocks: [],
    explanationCodeBlocks: [],
    options: [],
    correctOption: null,
    explanationMarkdown: 'Closures keep lexical scope alive.',
    images: [],
    tags: ['functions'],
    difficulty: 'beginner' as const,
    runnable: false,
    runtime: { kind: 'static' as const },
    source: { startLineHint: null },
  };
}

describe('getQuestions', () => {
  beforeEach(() => {
    vi.resetModules();
    existsSyncMock.mockReset();
    readFileSyncMock.mockReset();
  });

  it('merges resource data even when the locale file is missing and English fallback is used', async () => {
    existsSyncMock.mockImplementation((filePath) => {
      if (filePath.includes('locales/fr/questions.v1.json')) return false;
      if (filePath.includes('locales/en/questions.v1.json')) return true;
      if (filePath.endsWith('content/resources.json')) return true;
      return false;
    });

    readFileSyncMock.mockImplementation((filePath) => {
      if (filePath.includes('locales/en/questions.v1.json')) {
        return JSON.stringify([createQuestion()]);
      }
      if (filePath.endsWith('content/resources.json')) {
        return JSON.stringify({
          '1': [
            {
              type: 'docs',
              title: 'MDN Closures',
              url: 'https://developer.mozilla.org/docs/Web/JavaScript/Closures',
            },
          ],
        });
      }
      throw new Error(`Unexpected file read: ${filePath}`);
    });

    const { getQuestions } = await import('@/lib/content/loaders');
    const questions = getQuestions('fr');

    expect(questions).toHaveLength(1);
    expect(questions[0]?.isFallback).toBe(true);
    expect(questions[0]?.resources).toEqual([
      {
        type: 'docs',
        title: 'MDN Closures',
        url: 'https://developer.mozilla.org/docs/Web/JavaScript/Closures',
      },
    ]);
  });
});
