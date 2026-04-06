import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import type {
  LocaleIndex,
  QuestionDiscoveryItem,
  QuestionRecord,
  QuestionResource,
  QuestionSummary,
  QuestionsManifest,
} from '@/lib/content/types';
import { DEFAULT_LOCALE, type LocaleCode } from '@/lib/i18n/config';

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

/**
 * Two candidate roots: running from within apps/web (dev/build) or from repo
 * root (e.g. tests). Probes both and returns the first that contains the file.
 */
const DATA_ROOTS = [
  path.resolve(/* turbopackIgnore: true */ process.cwd(), 'content', 'generated'),
  path.resolve(/* turbopackIgnore: true */ process.cwd(), '..', '..', 'content', 'generated'),
];

function resolveGeneratedFile(relativePath: string): string | null {
  for (const root of DATA_ROOTS) {
    const candidate = path.join(root, relativePath);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function readJson<T>(relativePath: string): T | null {
  const resolved = resolveGeneratedFile(relativePath);
  if (!resolved) return null;
  return JSON.parse(fs.readFileSync(resolved, 'utf8')) as T;
}

function toQuestionSummary(question: QuestionRecord): QuestionSummary {
  return {
    id: question.id,
    slug: question.slug,
    locale: question.locale,
    isFallback: question.isFallback,
    title: question.title,
    tags: question.tags,
    difficulty: question.difficulty,
    runnable: question.runnable,
  };
}

function stripMarkdownToText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[*_>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getPreviewCode(question: QuestionRecord): string {
  return question.codeBlocks[0]?.code.split('\n').slice(0, 3).join('\n') ?? '';
}

function toQuestionDiscoveryItem(question: QuestionRecord): QuestionDiscoveryItem {
  const summary = toQuestionSummary(question);
  const textParts = [
    question.title,
    question.tags.join(' '),
    stripMarkdownToText(question.promptMarkdown),
    stripMarkdownToText(question.explanationMarkdown),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return {
    ...summary,
    searchText: textParts,
    previewCode: getPreviewCode(question),
  };
}

// ---------------------------------------------------------------------------
// Core loaders
// ---------------------------------------------------------------------------

/**
 * Returns all questions for a locale. Missing question ids (relative to English)
 * are back-filled with the English record annotated with `isFallback: true`.
 */
const getResourcesMap = cache((): Record<string, QuestionResource[]> => {
  // Resolve from repo root, not generated/ subdir
  for (const root of DATA_ROOTS.map((r) => path.resolve(r, '..', '..'))) {
    const candidate = path.join(root, 'content', 'resources.json');
    if (fs.existsSync(candidate)) {
      return JSON.parse(fs.readFileSync(candidate, 'utf8')) as Record<string, QuestionResource[]>;
    }
  }
  return {};
});

function mergeResources(questions: QuestionRecord[]): QuestionRecord[] {
  const map = getResourcesMap();
  if (Object.keys(map).length === 0) return questions;
  return questions.map((q) => ({ ...q, resources: map[String(q.id)] ?? q.resources }));
}

export const getQuestions = cache((locale: LocaleCode = DEFAULT_LOCALE): QuestionRecord[] => {
  const localePath = `locales/${locale}/questions.v1.json`;
  const localeQuestions = readJson<QuestionRecord[]>(localePath);

  // English is always the authoritative set
  if (locale === DEFAULT_LOCALE) {
    return mergeResources(localeQuestions ?? []);
  }

  const enQuestions = readJson<QuestionRecord[]>(`locales/en/questions.v1.json`) ?? [];

  if (!localeQuestions) {
    // Entire locale is missing — return English fallback for all questions
    return enQuestions.map((q) => ({ ...q, isFallback: true }));
  }

  // Merge: locale records take precedence; missing ids get English fallback
  const localeById = new Map<number, QuestionRecord>(localeQuestions.map((q) => [q.id, q]));

  return mergeResources(
    enQuestions.map((enQ) => {
      const localeQ = localeById.get(enQ.id);
      if (localeQ) return localeQ;
      return { ...enQ, isFallback: true };
    }),
  );
});

export const getManifest = cache((locale: LocaleCode = DEFAULT_LOCALE): QuestionsManifest => {
  const manifest = readJson<QuestionsManifest>(`locales/${locale}/manifest.v1.json`);
  if (manifest) return manifest;

  // Fallback: try legacy flat path for English
  const legacy = readJson<QuestionsManifest>('manifest.v1.json');
  if (legacy) return legacy;

  throw new Error(`Manifest not found for locale: ${locale}`);
});

export const getLocaleIndex = cache((): LocaleIndex | null => {
  return readJson<LocaleIndex>('locales/index.json');
});

export const getQuestionById = cache(
  (locale: LocaleCode = DEFAULT_LOCALE, id: number): QuestionRecord | null => {
    const question = getQuestions(locale).find((item) => item.id === id);
    return question ?? null;
  },
);

export const getQuestionSummaries = cache(
  (locale: LocaleCode = DEFAULT_LOCALE): QuestionSummary[] => {
    return getQuestions(locale).map(toQuestionSummary);
  },
);

export const getQuestionDiscoveryIndex = cache(
  (locale: LocaleCode = DEFAULT_LOCALE): QuestionDiscoveryItem[] => {
    return getQuestions(locale).map(toQuestionDiscoveryItem);
  },
);

export const getRelatedQuestions = cache(
  (locale: LocaleCode = DEFAULT_LOCALE, question: QuestionRecord, limit = 3): QuestionRecord[] => {
    const all = getQuestions(locale);
    return all
      .filter((q) => q.id !== question.id)
      .map((q) => {
        const commonTags = q.tags.filter((tag) => question.tags.includes(tag));
        return { q, commonTagsCount: commonTags.length };
      })
      .filter((item) => item.commonTagsCount > 0)
      .sort((a, b) => b.commonTagsCount - a.commonTagsCount)
      .slice(0, limit)
      .map((item) => item.q);
  },
);
