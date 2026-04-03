'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import { FilterLoadingOverlay } from '@/components/filter-loading-overlay';
import { FiltersBar } from '@/components/filters-bar';
import { QuestionsResults } from '@/components/questions-results';
import { applyServerFilters, parseQuestionScope } from '@/lib/content/query';
import type { QuestionDiscoveryItem, QuestionsManifest } from '@/lib/content/types';
import { FilterPendingProvider } from '@/lib/filters/filter-pending-context';
import type { LocaleCode } from '@/lib/i18n/config';

const PAGE_SIZE = 18;

interface QuestionsClientWrapperProps {
  allQuestions: QuestionDiscoveryItem[];
  manifest: QuestionsManifest;
  locale: LocaleCode;
}

export function QuestionsClientWrapper({
  allQuestions,
  manifest,
  locale,
}: QuestionsClientWrapperProps) {
  const searchParams = useSearchParams();

  const scope = useMemo(() => {
    const params: Record<string, string | string[]> = {};
    for (const key of searchParams.keys()) {
      const values = searchParams.getAll(key);
      params[key] = values.length > 1 ? values : (values[0] ?? '');
    }
    return parseQuestionScope(params);
  }, [searchParams]);

  const filtered = useMemo(() => applyServerFilters(allQuestions, scope), [allQuestions, scope]);

  return (
    <FilterPendingProvider>
      <FiltersBar
        tags={manifest.tags}
        selectedTags={scope.tags}
        search={scope.q}
        runnable={scope.runnable ? 'true' : ''}
        status={scope.status}
        difficulties={scope.difficulties}
        allQuestions={allQuestions}
        locale={locale}
      />

      <FilterLoadingOverlay>
        <QuestionsResults questions={filtered} scope={scope} locale={locale} pageSize={PAGE_SIZE} />
      </FilterLoadingOverlay>
    </FilterPendingProvider>
  );
}
