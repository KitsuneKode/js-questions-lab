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
    <main className="pt-32 pb-16 md:pt-40">
      <Container>
        <div className="space-y-8">
          {/* Header */}
          <header className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <span className="uppercase tracking-widest font-bold">
                {t('count', { count: allQuestions.length })}
              </span>
            </div>
            <h1 className="font-display text-5xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[clamp(3rem,2rem+3vw,4.5rem)]">
              {t('title')}
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-secondary">{t('description')}</p>
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
