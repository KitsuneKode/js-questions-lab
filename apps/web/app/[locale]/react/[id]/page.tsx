import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ReactIDEDynamic } from '@/components/react-ide/react-ide-dynamic';
import { getReactDiscoveryIndex, getReactQuestion } from '@/lib/content/react-loaders';
import type { LocaleCode } from '@/lib/i18n/config';
import { SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { getAlternateLanguages, getCanonicalUrl, truncateDescription } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

export async function generateStaticParams() {
  const ids = getReactDiscoveryIndex().map((question) => question.id);
  return SUPPORTED_LOCALES.flatMap((locale) => ids.map((id) => ({ locale, id })));
}

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocaleCode; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const question = getReactQuestion(id);
  if (!question) {
    return { title: siteConfig.name };
  }

  const path = `react/${id}`;
  const canonicalUrl = getCanonicalUrl(locale, path);
  const description = truncateDescription(question.prompt);

  return {
    title: `${question.title} | React Practice | ${siteConfig.name}`,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguages(path),
    },
    openGraph: {
      title: question.title,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale,
      type: 'article',
      tags: question.tags,
    },
  };
}

export default async function ReactQuestionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale as LocaleCode);

  const question = getReactQuestion(id);
  if (!question) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-void overflow-hidden pt-26">
      <div className="h-[calc(100dvh-6.5rem)] min-h-[640px] overflow-hidden">
        <ReactIDEDynamic question={question} />
      </div>
    </main>
  );
}
