import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/container';
import { FilterLoadingOverlay } from '@/components/filter-loading-overlay';
import { FiltersBar } from '@/components/filters-bar';
import { NextRecommendedBanner } from '@/components/next-recommended-banner';
import { QuestionsResults } from '@/components/questions-results';
import { getManifest, getQuestions } from '@/lib/content/loaders';
import { applyServerFilters, parseQuestionScope } from '@/lib/content/query';
import { FilterPendingProvider } from '@/lib/filters/filter-pending-context';
import { type LocaleCode, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { getAlternateLanguages, getCanonicalUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

const PAGE_SIZE = 18;

type SearchParams = Record<string, string | string[] | undefined>;

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'questions' });
  const canonicalUrl = getCanonicalUrl(locale, 'questions');
  const alternateLanguages = getAlternateLanguages('questions');

  return {
    title: `${t('title')} | ${siteConfig.name}`,
    description: t('description'),
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },
    openGraph: {
      title: `${t('title')} | ${siteConfig.name}`,
      description: t('description'),
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: locale,
      type: 'website',
    },
  };
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
  const scope = parseQuestionScope(resolvedSearchParams);
  const filtered = applyServerFilters(allQuestions, scope);

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
                selectedTags={scope.tags}
                search={scope.q}
                runnable={scope.runnable ? 'true' : ''}
                status={scope.status}
                difficulties={scope.difficulties}
                allQuestions={allQuestions}
                locale={locale}
              />

              <FilterLoadingOverlay>
                <QuestionsResults
                  questions={filtered}
                  scope={scope}
                  locale={locale}
                  pageSize={PAGE_SIZE}
                />
              </FilterLoadingOverlay>
            </FilterPendingProvider>
          </section>
        </div>
      </Container>
    </main>
  );
}
