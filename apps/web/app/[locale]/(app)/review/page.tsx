import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/container';
import { ReviewStartClient } from '@/components/dashboard/review-start-client';
import { getQuestionSummaries } from '@/lib/content/loaders';
import type { LocaleCode } from '@/lib/i18n/config';
import { getCanonicalUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  const canonicalUrl = getCanonicalUrl(locale, 'review');

  return {
    title: `${t('reviewPageTitle')} — ${siteConfig.name}`,
    description: t('reviewPageDescription'),
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ReviewPage({ params }: { params: Promise<{ locale: LocaleCode }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const questions = getQuestionSummaries(locale);

  return (
    <main className="pt-32 pb-16 md:pt-40">
      <Container>
        <ReviewStartClient locale={locale} questions={questions} />
      </Container>
    </main>
  );
}
