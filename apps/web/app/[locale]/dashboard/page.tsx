import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/container';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getQuestions } from '@/lib/content/loaders';
import { type LocaleCode, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { siteConfig } from '@/lib/site-config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  return { title: `${t('title')} — ${siteConfig.name}` };
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}) {
  const { locale } = await params;
  const questions = getQuestions(locale);

  return (
    <main className="pt-24 pb-16 md:pt-32">
      <Container>
        <DashboardShell questions={questions} locale={locale} />
      </Container>
    </main>
  );
}
