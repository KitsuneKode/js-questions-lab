import type { QuestionRecord } from '@/lib/content/types';

export type ListingStatus = 'all' | 'answered' | 'unanswered' | 'bookmarked';

export interface ListingFilters {
  q?: string;
  tag?: string;
  runnable?: boolean;
}

export function applyServerFilters(questions: QuestionRecord[], filters: ListingFilters): QuestionRecord[] {
  const q = filters.q?.trim().toLowerCase();

  return questions.filter((question) => {
    if (q) {
      const haystack = `${question.title} ${question.promptMarkdown} ${question.explanationMarkdown}`.toLowerCase();
      if (!haystack.includes(q)) {
        return false;
      }
    }

    if (filters.tag && filters.tag !== 'all' && !question.tags.includes(filters.tag)) {
      return false;
    }

    if (typeof filters.runnable === 'boolean' && question.runnable !== filters.runnable) {
      return false;
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
