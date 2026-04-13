import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/container';
import { LeaderboardTabsClient } from '@/components/leaderboard/leaderboard-tabs-client';
import {
  getAllTimeCurrentUserPosition,
  getAllTimeLeaderboard,
  getWeeklyCurrentUserPosition,
  getWeeklyLeaderboard,
} from '@/lib/engagement/leaderboard';
import type { LocaleCode } from '@/lib/i18n/config';
import { withLocale } from '@/lib/locale-paths';
import { getCanonicalUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'leaderboard' });
  const canonicalUrl = getCanonicalUrl(locale, 'leaderboard');
  return {
    title: `${t('title')} — ${siteConfig.name}`,
    description: t('description'),
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true, noarchive: true },
  };
}

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await auth();

  const [weekly, allTime, weeklyPos, allTimePos] = await Promise.all([
    getWeeklyLeaderboard(50),
    getAllTimeLeaderboard(50),
    getWeeklyCurrentUserPosition(),
    getAllTimeCurrentUserPosition(),
  ]);

  const t = await getTranslations({ locale, namespace: 'leaderboard' });

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('title'),
    description: t('description'),
    url: getCanonicalUrl(locale, 'leaderboard'),
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  return (
    <main className="bg-void min-h-screen pt-32 pb-24 md:pt-40">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD SEO structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container>
        <div className="mx-auto max-w-2xl space-y-10">
          {/* ─── Header ──────────────────────────────────────────────── */}
          <header className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
              {t('eyebrow')}
            </div>
            <h1 className="font-display text-4xl font-normal tracking-tight text-zinc-50 md:text-5xl">
              {t('title')}
            </h1>
            <p className="text-base text-zinc-400">{t('subtitle')}</p>
          </header>

          {/* ─── Guest CTA (unauthenticated only) ────────────────────── */}
          {!userId && (
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 px-6 py-5">
              {/* decorative amber glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-8 left-1/2 h-24 w-48 -translate-x-1/2 rounded-full bg-primary/15 blur-2xl"
              />
              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-zinc-100">{t('guestCtaHeading')}</p>
                  <p className="text-xs text-zinc-400">{t('guestCtaBody')}</p>
                </div>
                <Link
                  href={withLocale(locale, '/sign-up')}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-transform duration-150 ease-out hover:brightness-110 active:scale-[0.97]"
                >
                  {t('guestCtaAction')}
                </Link>
              </div>
            </div>
          )}

          {/* ─── Tabs (Weekly / All-Time) ─────────────────────────────── */}
          <LeaderboardTabsClient
            weekly={weekly}
            allTime={allTime}
            weeklyCurrentUserPosition={weeklyPos}
            allTimeCurrentUserPosition={allTimePos}
            isAuthenticated={!!userId}
          />
        </div>
      </Container>
    </main>
  );
}
