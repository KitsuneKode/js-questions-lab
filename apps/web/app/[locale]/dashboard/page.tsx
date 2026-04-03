import { auth } from '@clerk/nextjs/server';
import { IconArrowRight, IconRefresh, IconUserCircle } from '@tabler/icons-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/container';
import { type LocaleCode, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { withLocale } from '@/lib/locale-paths';
import { getCanonicalUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'accountDashboard' });
  const canonicalUrl = getCanonicalUrl(locale, 'dashboard');

  return {
    title: `${t('title')} — ${siteConfig.name}`,
    description: t('description'),
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
      description: t('description'),
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: locale,
      type: 'website',
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'accountDashboard' });
  const { userId } = await auth();
  const progressHref = withLocale(locale, '/progress');

  return (
    <main className="bg-void min-h-screen pt-32 pb-16 md:pt-40">
      <Container>
        <div className="mx-auto max-w-5xl space-y-8">
          <header className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <span className="uppercase tracking-widest font-bold">{t('eyebrow')}</span>
            </div>
            <div className="space-y-3">
              <h1 className="font-display text-5xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-6xl">
                {t('title')}
              </h1>
              <p className="max-w-3xl text-lg leading-relaxed text-secondary">{t('description')}</p>
            </div>
          </header>

          <section className="grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-border-subtle bg-surface/60 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <IconRefresh className="h-5 w-5" />
              </div>
              <h2 className="font-display text-2xl text-foreground">{t('progressTitle')}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t('progressBody')}
              </p>
              <Link
                href={progressHref}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                {t('openProgress')}
                <IconArrowRight className="h-4 w-4" />
              </Link>
            </article>

            <article className="rounded-2xl border border-border-subtle bg-surface/60 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <IconUserCircle className="h-5 w-5" />
              </div>
              <h2 className="font-display text-2xl text-foreground">{t('syncTitle')}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t('syncBody')}</p>
              <div className="mt-6 rounded-xl border border-border/60 bg-background/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary">
                  {t('memberIdLabel')}
                </p>
                <p className="mt-2 font-mono text-sm text-foreground">
                  {userId ?? t('memberIdUnavailable')}
                </p>
              </div>
            </article>
          </section>
        </div>
      </Container>
    </main>
  );
}
