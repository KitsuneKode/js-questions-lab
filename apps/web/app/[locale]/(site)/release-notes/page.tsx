import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ReleaseNotesPage } from '@/components/releases/release-notes-page';
import { type LocaleCode, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { getAppVersion, getReleases } from '@/lib/releases/loaders';
import type { ReleaseChangeType } from '@/lib/releases/types';
import { getCanonicalUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'releaseNotes' });
  const canonicalUrl = getCanonicalUrl(locale, 'release-notes');
  const description = t('description');

  return {
    title: `${t('title')} — ${siteConfig.name}`,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((loc) => [loc, getCanonicalUrl(loc, 'release-notes')]),
      ),
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

export const dynamic = 'force-static';

interface PageProps {
  params: Promise<{ locale: LocaleCode }>;
}

export default async function ReleaseNotesRoute({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'releaseNotes' });

  const releases = getReleases();
  const appVersion = getAppVersion();

  const sectionTypes: ReleaseChangeType[] = [
    'added',
    'fixed',
    'changed',
    'performance',
    'security',
  ];

  const sectionLabels = Object.fromEntries(
    sectionTypes.map((type) => [type, t(`sections.${type}`)]),
  ) as Partial<Record<ReleaseChangeType, string>>;

  return (
    <ReleaseNotesPage
      releases={releases}
      appVersion={appVersion}
      copy={{
        eyebrow: t('eyebrow'),
        title: t('title'),
        intro: t('intro'),
        englishNote: t('englishNote'),
        emptyTitle: t('emptyTitle'),
        emptyBody: t('emptyBody'),
        navigateLabel: t('navigateLabel'),
        currentVersionLabel: t('currentVersionLabel'),
        githubRelease: t('githubRelease'),
        compareChanges: t('compareChanges'),
        sectionLabels,
      }}
    />
  );
}
