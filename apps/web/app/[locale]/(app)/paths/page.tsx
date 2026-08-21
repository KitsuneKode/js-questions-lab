import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/container';
import { PracticePathsClient } from '@/components/paths/practice-paths-client';
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
  const t = await getTranslations({ locale, namespace: 'paths' });
  const canonicalUrl = getCanonicalUrl(locale, 'paths');

  return {
    title: `${t('title')} — ${siteConfig.name}`,
    description: t('subtitle'),
    alternates: { canonical: canonicalUrl },
  };
}

export default async function PathsPage({ params }: { params: Promise<{ locale: LocaleCode }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="bg-void min-h-screen pt-32 pb-16 md:pt-40">
      <Container>
        <PracticePathsClient locale={locale} />
      </Container>
    </main>
  );
}
