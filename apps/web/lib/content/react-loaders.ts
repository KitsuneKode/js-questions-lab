import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import type {
  ReactDiscoveryItem,
  ReactQuestion,
  ReactQuestionsManifest,
} from '@/lib/content/types';

const DATA_ROOTS = [
  path.resolve(/* turbopackIgnore: true */ process.cwd(), 'content', 'generated', 'react'),
  path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    '..',
    '..',
    'content',
    'generated',
    'react',
  ),
];

function resolveGeneratedFile(relativePath: string): string | null {
  for (const root of DATA_ROOTS) {
    const candidate = path.join(root, relativePath);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function readJson<T>(relativePath: string): T | null {
  const resolved = resolveGeneratedFile(relativePath);
  if (!resolved) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(resolved, 'utf8')) as T;
  } catch {
    return null;
  }
}

export const getReactManifest = cache((): ReactQuestionsManifest => {
  return (
    readJson<ReactQuestionsManifest>('manifest.json') ?? {
      schemaVersion: 1,
      generatedAt: new Date(0).toISOString(),
      totalQuestions: 0,
      questions: [],
    }
  );
});

export const getReactQuestions = cache((): ReactQuestion[] => {
  const manifest = getReactManifest();
  const questions: ReactQuestion[] = [];

  for (const entry of manifest.questions) {
    const question = readJson<ReactQuestion>(`en/${entry.id}.json`);
    if (question) {
      questions.push(question);
    }
  }

  return questions;
});

export function getReactQuestion(id: string): ReactQuestion | null {
  return readJson<ReactQuestion>(`en/${id}.json`);
}

export const getReactDiscoveryIndex = cache((): ReactDiscoveryItem[] => {
  return getReactManifest().questions.map((question) => ({
    id: question.id,
    title: question.title,
    difficulty: question.difficulty,
    category: question.category,
    tags: question.tags,
  }));
});
