export interface PracticePath {
  id: string;
  titleKey: string;
  descriptionKey: string;
  /** Question IDs in recommended practice order */
  questionIds: number[];
  tags: string[];
}

/**
 * Curated guided paths over the existing JS corpus.
 * Content stays English-authoritative; UI chrome is localized via next-intl.
 */
export const PRACTICE_PATHS: PracticePath[] = [
  {
    id: 'scope-closures',
    titleKey: 'pathScopeTitle',
    descriptionKey: 'pathScopeDesc',
    questionIds: [1, 2, 3, 4, 5, 6],
    tags: ['scope', 'fundamentals'],
  },
  {
    id: 'prototypes-objects',
    titleKey: 'pathPrototypesTitle',
    descriptionKey: 'pathPrototypesDesc',
    questionIds: [7, 8, 9, 10, 11, 12],
    tags: ['prototypes', 'objects'],
  },
  {
    id: 'async-event-loop',
    titleKey: 'pathAsyncTitle',
    descriptionKey: 'pathAsyncDesc',
    questionIds: [2, 30, 42, 26],
    tags: ['async'],
  },
  {
    id: 'arrays-types',
    titleKey: 'pathArraysTitle',
    descriptionKey: 'pathArraysDesc',
    questionIds: [15, 17, 19, 20, 21],
    tags: ['arrays', 'types'],
  },
];

export function getPracticePath(id: string): PracticePath | undefined {
  return PRACTICE_PATHS.find((path) => path.id === id);
}

export function getPathProgress(
  path: PracticePath,
  answeredIds: Set<number>,
): { done: number; total: number; nextId: number | null } {
  const total = path.questionIds.length;
  const done = path.questionIds.filter((id) => answeredIds.has(id)).length;
  const nextId = path.questionIds.find((id) => !answeredIds.has(id)) ?? null;
  return { done, total, nextId };
}
