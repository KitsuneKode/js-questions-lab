import type { QuestionRecord } from '@/lib/content/types';

export type ListingStatus = 'all' | 'answered' | 'unanswered' | 'bookmarked';

export interface ListingFilters {
  q?: string;
  tags?: string[];
  runnable?: boolean;
  difficulties?: string[];
}

export function applyServerFilters(
  questions: QuestionRecord[],
  filters: ListingFilters,
): QuestionRecord[] {
  const q = filters.q?.trim().toLowerCase();

  return questions.filter((question) => {
    if (q) {
      const haystack =
        `${question.title} ${question.promptMarkdown} ${question.explanationMarkdown}`.toLowerCase();
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
