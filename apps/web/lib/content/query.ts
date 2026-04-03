import type { QuestionDiscoveryItem, QuestionRecord, QuestionSummary } from '@/lib/content/types';
import type { ProgressState } from '@/lib/progress/storage';

export type ListingStatus = 'all' | 'answered' | 'unanswered' | 'bookmarked';
type SearchParamValue = string | string[] | undefined;
type SearchParamRecord = Record<string, SearchParamValue>;
interface SearchParamsLike {
  get(name: string): string | null;
  getAll(name: string): string[];
}
type SearchParamInput = SearchParamRecord | SearchParamsLike;

export interface ListingFilters {
  q?: string;
  tags?: string[];
  runnable?: boolean;
  difficulties?: string[];
}

export interface QuestionScope {
  q: string;
  tags: string[];
  runnable?: boolean;
  difficulties: string[];
  status: ListingStatus;
  page: number;
}

type SearchableQuestion = QuestionSummary &
  Partial<Pick<QuestionDiscoveryItem, 'searchText'>> &
  Partial<Pick<QuestionRecord, 'promptMarkdown' | 'explanationMarkdown'>>;

const DEFAULT_SCOPE: QuestionScope = {
  q: '',
  tags: [],
  runnable: undefined,
  difficulties: [],
  status: 'all',
  page: 1,
};

function isSearchParamsLike(value: SearchParamInput): value is SearchParamsLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as SearchParamsLike).get === 'function' &&
    typeof (value as SearchParamsLike).getAll === 'function'
  );
}

function firstValue(params: SearchParamInput, key: string): string {
  if (isSearchParamsLike(params)) {
    return params.get(key) ?? '';
  }

  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function arrayValues(params: SearchParamInput, key: string, legacyKey?: string): string[] {
  if (isSearchParamsLike(params)) {
    const values = params.getAll(key);
    if (values.length > 0) return values;
    if (!legacyKey) return [];

    const legacyValues = params.getAll(legacyKey);
    if (legacyValues.length > 0) return legacyValues;

    const legacySingle = params.get(legacyKey);
    return legacySingle ? [legacySingle] : [];
  }

  const primary = params[key];
  if (Array.isArray(primary)) return primary;
  if (typeof primary === 'string') return [primary];

  if (!legacyKey) return [];

  const legacy = params[legacyKey];
  if (Array.isArray(legacy)) return legacy;
  if (typeof legacy === 'string') return [legacy];

  return [];
}

function normalizeStatus(value: string): ListingStatus {
  if (value === 'answered' || value === 'unanswered' || value === 'bookmarked') {
    return value;
  }

  return 'all';
}

export function parseQuestionScope(params: SearchParamInput): QuestionScope {
  const q = firstValue(params, 'q').trim();
  const tags = arrayValues(params, 'tags', 'tag');
  const difficulties = arrayValues(params, 'difficulties', 'difficulty');
  const runnable = firstValue(params, 'runnable') === 'true' ? true : undefined;
  const status = normalizeStatus(firstValue(params, 'status'));
  const pageValue = Number.parseInt(firstValue(params, 'page'), 10);
  const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;

  return {
    ...DEFAULT_SCOPE,
    q,
    tags,
    runnable,
    difficulties,
    status,
    page,
  };
}

export function buildQuestionScopeQuery(
  scope: Partial<QuestionScope>,
  options: { includePage?: boolean } = {},
) {
  const params = new URLSearchParams();

  if (scope.q?.trim()) {
    params.set('q', scope.q.trim());
  }

  scope.tags?.forEach((tag) => void params.append('tags', tag));

  if (scope.runnable) {
    params.set('runnable', 'true');
  }

  scope.difficulties?.forEach((difficulty) => void params.append('difficulties', difficulty));

  if (scope.status && scope.status !== 'all') {
    params.set('status', scope.status);
  }

  if (options.includePage && (scope.page ?? 1) > 1) {
    params.set('page', String(scope.page));
  }

  return params.toString();
}

export function applyServerFilters<T extends SearchableQuestion>(
  questions: T[],
  filters: ListingFilters,
): T[] {
  const q = filters.q?.trim().toLowerCase();

  return questions.filter((question) => {
    if (q) {
      const haystack = (
        question.searchText ??
        `${question.title} ${question.promptMarkdown ?? ''} ${question.explanationMarkdown ?? ''}`
      ).toLowerCase();
      if (!haystack.includes(q)) {
        return false;
      }
    }

    // Multi-select tags filter (OR logic - question must match at least one selected tag)
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some((tag) => question.tags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }

    if (typeof filters.runnable === 'boolean' && question.runnable !== filters.runnable) {
      return false;
    }

    // Multi-select difficulties filter (OR logic - question must match at least one selected difficulty)
    if (filters.difficulties && filters.difficulties.length > 0) {
      const hasMatchingDifficulty = filters.difficulties.some(
        (diff) => question.difficulty?.toLowerCase() === diff.toLowerCase(),
      );
      if (!hasMatchingDifficulty) {
        return false;
      }
    }

    return true;
  });
}

export function applyStatusFilter<T extends Pick<QuestionSummary, 'id'>>(
  questions: T[],
  status: ListingStatus,
  progressQuestions: ProgressState['questions'],
): T[] {
  if (status === 'all') {
    return questions;
  }

  return questions.filter((question) => {
    const item = progressQuestions[String(question.id)];
    const hasAttempts = Boolean(item?.attempts?.length);
    const bookmarked = Boolean(item?.bookmarked);

    if (status === 'answered') return hasAttempts;
    if (status === 'unanswered') return !hasAttempts;
    if (status === 'bookmarked') return bookmarked;

    return true;
  });
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;

  return {
    total,
    pageCount,
    page: safePage,
    items: items.slice(start, end),
  };
}
