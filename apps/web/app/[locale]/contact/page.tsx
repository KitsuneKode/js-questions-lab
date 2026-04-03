import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ContactMe from '@/components/contact-me';
import { type LocaleCode, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { getCanonicalUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  const canonicalUrl = getCanonicalUrl(locale as LocaleCode, 'contact');
  const description =
    t('description') ??
    'Have questions about JS Questions Lab? Interested in sponsorships or collaborations? Reach out and get in touch.';

  return {
    title: `${t('title')} — ${siteConfig.name}`,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((loc) => [loc, getCanonicalUrl(loc, 'contact')]),
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

export const dynamic = 'force-static';

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="min-h-screen bg-void pt-32 pb-16 md:pt-40">
      <ContactMe />
    </main>
  );
}
