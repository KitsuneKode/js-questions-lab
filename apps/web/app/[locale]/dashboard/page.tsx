import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/container';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getQuestions } from '@/lib/content/loaders';
import { type LocaleCode, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { getCanonicalUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  const canonicalUrl = getCanonicalUrl(locale, 'dashboard');
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
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((loc) => [loc, getCanonicalUrl(loc, 'dashboard')]),
      ),
    },
    openGraph: {
      title: `${t('title')} — ${siteConfig.name}`,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: locale,
      type: 'website',
    },
  };
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const questions = getQuestions(locale);

  return (
    <main className="pt-32 pb-16 md:pt-40">
      <Container>
        <DashboardShell questions={questions} locale={locale} />
      </Container>
    </main>
  );
}
