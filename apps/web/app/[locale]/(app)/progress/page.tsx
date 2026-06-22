import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/container';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
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
  const canonicalUrl = getCanonicalUrl(locale, 'progress');
  const description =
    t('description') ??
    'Track your JavaScript interview practice progress, review weak topics, and maintain your learning streak.';

  return {
    title: `${t('title')} — ${siteConfig.name}`,
    description,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${t('title')} — ${siteConfig.name}`,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale,
      type: 'website',
    },
  };
}

export default async function ProgressPage({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const questions = getQuestionSummaries(locale);

  return (
    <main className="pt-32 pb-16 md:pt-40">
      <Container>
        <DashboardShell questions={questions} locale={locale} />
      </Container>
    </main>
  );
}
