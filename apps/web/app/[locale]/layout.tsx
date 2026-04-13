import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';

import { Provider } from '@/app/provider';
import { SiteJsonLd } from '@/components/seo/site-json-ld';
import { isValidLocale, LOCALE_DIRS, type LocaleCode, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { getAlternateLanguages, getBaseUrl, getCanonicalUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';
import { cn } from '@/lib/utils';

// Japanese CJK fallback font — only loaded for ja locale
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const t = await getTranslations({ locale, namespace: 'meta' });
  const canonicalUrl = getCanonicalUrl(locale as LocaleCode);
  const alternateLanguages = getAlternateLanguages();

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      siteName: siteConfig.name,
      url: canonicalUrl,
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      creator: siteConfig.creator.displayHandle,
    },
    other: {
      // next-intl reads lang from here; root layout sets the html tag
      'x-locale': locale,
      'og:logo': `${getBaseUrl()}/icon`,
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!isValidLocale(locale)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = LOCALE_DIRS[locale as LocaleCode];
  const isJapanese = locale === 'ja';

  return (
    // next-intl's plugin handles setting html lang/dir via the root layout.
    // We wrap content only.
    <div lang={locale} dir={dir} className={cn('contents', isJapanese && notoSansJP.variable)}>
      <SiteJsonLd />
      <NextIntlClientProvider messages={messages}>
        <Provider>{children}</Provider>
      </NextIntlClientProvider>
    </div>
  );
}
