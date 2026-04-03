import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { Container } from '@/components/container';
import { NextRecommendedBanner } from '@/components/next-recommended-banner';
import { QuestionsClientWrapper } from '@/components/questions-client-wrapper';
import {
  getManifest,
  getQuestionDiscoveryIndex,
  getQuestionSummaries,
} from '@/lib/content/loaders';
import type { LocaleCode } from '@/lib/i18n/config';
import { getAlternateLanguages, getCanonicalUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-static';

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
}: {
  params: Promise<{ locale: LocaleCode }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'questions' });

  const allQuestions = getQuestionDiscoveryIndex(locale);
  const questionSummaries = getQuestionSummaries(locale);
  const manifest = getManifest(locale);

  return (
    <main className="pt-32 pb-16 md:pt-40">
      <Container>
        <div className="space-y-8">
          {/* Header */}
          <header className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <span className="uppercase tracking-widest font-bold">
                {t('count', { count: questionSummaries.length })}
              </span>
            </div>
            <h1 className="font-display text-5xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[clamp(3rem,2rem+3vw,4.5rem)]">
              {t('title')}
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-secondary">{t('description')}</p>
          </header>

          {/* Recommended Banner */}
          <NextRecommendedBanner questions={questionSummaries} locale={locale} />

          {/* Filters and Results */}
          <section className="space-y-6">
            <Suspense fallback={null}>
              <QuestionsClientWrapper
                allQuestions={allQuestions}
                manifest={manifest}
                locale={locale}
              />
            </Suspense>
          </section>
        </div>
      </Container>
    </main>
  );
}
