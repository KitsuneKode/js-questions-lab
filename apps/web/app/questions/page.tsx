import { Container } from '@/components/container';
import { FiltersBar } from '@/components/filters-bar';
import { PaginationNav } from '@/components/pagination-nav';
import { QuestionsResults } from '@/components/questions-results';
import { applyServerFilters, paginate } from '@/lib/content/query';
import { getManifest, getQuestions } from '@/lib/content/loaders';

const PAGE_SIZE = 18;

type SearchParams = Record<string, string | string[] | undefined>;
type ListingStatus = 'all' | 'answered' | 'unanswered' | 'bookmarked';

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const allQuestions = getQuestions();
  const manifest = getManifest();

  const pageParam = Number.parseInt(firstValue(resolvedSearchParams.page), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const q = firstValue(resolvedSearchParams.q);
  const tag = firstValue(resolvedSearchParams.tag);
  const runnable = firstValue(resolvedSearchParams.runnable);
  const rawStatus = firstValue(resolvedSearchParams.status);
  const status: ListingStatus =
    rawStatus === 'answered' || rawStatus === 'unanswered' || rawStatus === 'bookmarked' ? rawStatus : 'all';

  const filtered = applyServerFilters(allQuestions, {
    q,
    tag,
    runnable: runnable === 'true' ? true : undefined,
  });

  const paged = paginate(filtered, page, PAGE_SIZE);

  const createHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (targetPage > 1) params.set('page', String(targetPage));
    if (q) params.set('q', q);
    if (tag && tag !== 'all') params.set('tag', tag);
    if (runnable === 'true') params.set('runnable', 'true');
    if (status && status !== 'all') params.set('status', status);

    const query = params.toString();
    return query ? `/questions?${query}` : '/questions';
  };

  return (
    <main className="py-8 md:py-10">
      <Container>
        <section className="space-y-6">
          <header className="space-y-2">
            <h1 className="font-display text-4xl text-foreground md:text-5xl">Question Library</h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              Search by keyword, filter by concept cloak, and jump through paginated sections of the dataset.
            </p>
          </header>

          <FiltersBar tags={manifest.tags} selectedTag={tag || 'all'} search={q} runnable={runnable} status={status} />

          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>
              Showing {paged.items.length} of {paged.total} matching questions on this page before local status filtering
            </p>
            <p>Page {paged.page}</p>
          </div>

          <QuestionsResults questions={paged.items} status={status} />

          <PaginationNav page={paged.page} pageCount={paged.pageCount} createHref={createHref} />
        </section>
      </Container>
    </main>
  );
}
