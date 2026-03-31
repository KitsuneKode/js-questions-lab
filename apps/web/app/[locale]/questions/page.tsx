import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/container';
import { FilterLoadingOverlay } from '@/components/filter-loading-overlay';
import { FiltersBar } from '@/components/filters-bar';
import { NextRecommendedBanner } from '@/components/next-recommended-banner';
import { PaginationNav } from '@/components/pagination-nav';
import { QuestionsResults } from '@/components/questions-results';
import { getManifest, getQuestions } from '@/lib/content/loaders';
import { applyServerFilters, paginate } from '@/lib/content/query';
import { FilterPendingProvider } from '@/lib/filters/filter-pending-context';
import { type LocaleCode, SUPPORTED_LOCALES } from '@/lib/i18n/config';

const PAGE_SIZE = 18;

type SearchParams = Record<string, string | string[] | undefined>;
type ListingStatus = 'all' | 'answered' | 'unanswered' | 'bookmarked';

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

function getArrayValues(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value) {
    return [value];
  }
  return [];
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function QuestionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: LocaleCode }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations({ locale, namespace: 'questions' });

  const allQuestions = getQuestions(locale);
  const manifest = getManifest(locale);

  const pageParam = Number.parseInt(firstValue(resolvedSearchParams.page), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const q = firstValue(resolvedSearchParams.q);
  const selectedTags = getArrayValues(resolvedSearchParams.tags);
  const runnable = firstValue(resolvedSearchParams.runnable);
  const selectedDifficulties = getArrayValues(resolvedSearchParams.difficulties);
  const rawStatus = firstValue(resolvedSearchParams.status);
  const status: ListingStatus =
    rawStatus === 'answered' || rawStatus === 'unanswered' || rawStatus === 'bookmarked'
      ? rawStatus
      : 'all';

  const filtered = applyServerFilters(allQuestions, {
    q,
    tags: selectedTags,
    runnable: runnable === 'true' ? true : undefined,
    difficulties: selectedDifficulties,
  });

  const paged = paginate(filtered, page, PAGE_SIZE);

  const createHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (targetPage > 1) params.set('page', String(targetPage));
    if (q) params.set('q', q);
    if (selectedTags.length > 0) {
      selectedTags.forEach((tag) => void params.append('tags', tag));
    }
    if (runnable === 'true') params.set('runnable', 'true');
    if (status && status !== 'all') params.set('status', status);
    if (selectedDifficulties.length > 0) {
      selectedDifficulties.forEach((diff) => void params.append('difficulties', diff));
    }

    const query = params.toString();
    return query ? `/${locale}/questions?${query}` : `/${locale}/questions`;
  };

  return (
    <main className="pt-24 pb-16 md:pt-32">
      <Container>
        <div className="space-y-8">
          {/* Header */}
          <header className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                {t('count', { count: allQuestions.length })}
              </span>
              <span className="h-px flex-1 bg-linear-to-r from-border/60 to-transparent" />
            </div>
            <h1 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
              {t('title')}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground/80">
              {t('description')}
            </p>
          </header>

          {/* Recommended Banner */}
          <NextRecommendedBanner questions={allQuestions} locale={locale} />

          {/* Filters and Results */}
          <section className="space-y-6">
            <FilterPendingProvider>
              <FiltersBar
                tags={manifest.tags}
                selectedTags={selectedTags}
                search={q}
                runnable={runnable}
                status={status}
                difficulties={selectedDifficulties}
                allQuestions={allQuestions}
                locale={locale}
              />

              <FilterLoadingOverlay>
                {/* Results count bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/50">
                  <p>
                    <span className="text-foreground/70">{paged.items.length}</span>
                    <span className="mx-1.5 text-muted-foreground/30">/</span>
                    <span>{paged.total} questions</span>
                  </p>
                  <p className="flex items-center gap-1.5 font-mono">
                    <span className="text-foreground/70">{paged.page}</span>
                    <span className="text-muted-foreground/30">/</span>
                    <span>{paged.pageCount}</span>
                  </p>
                </div>

                <QuestionsResults questions={paged.items} status={status} locale={locale} />

                <PaginationNav
                  page={paged.page}
                  pageCount={paged.pageCount}
                  createHref={createHref}
                />
              </FilterLoadingOverlay>
            </FilterPendingProvider>
          </section>
        </div>
      </Container>
    </main>
  );
}
