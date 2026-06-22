import enIndex from '../../../../content/generated/locales/en/question-index.v1.json';

export interface QuestionIndex {
  schemaVersion: number;
  locale: string;
  byId: Record<string, { tags: string[] }>;
  tagCounts: Record<string, number>;
}

const defaultIndex = enIndex as QuestionIndex;

/**
 * @param _locale - Currently unused. Always returns English index data.
 * Locale-aware tag counts are not yet supported due to bundle size constraints.
 */
export function getTagQuestionCounts(_locale = 'en'): Record<string, number> {
  return { ...defaultIndex.tagCounts };
}

/**
 * @param _locale - Currently unused. Always returns English index data.
 */
export function getQuestionTags(id: number, _locale = 'en'): string[] {
  return [...(defaultIndex.byId[String(id)]?.tags ?? [])];
}
