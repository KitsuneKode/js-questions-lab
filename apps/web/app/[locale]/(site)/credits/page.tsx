import {
  IconArrowUpRight,
  IconBrandGithub,
  IconBrandX,
  IconGitCommit,
  IconHammer,
  IconHeartHandshake,
  IconLayersIntersect,
  IconQuote,
} from '@tabler/icons-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/container';
import { getLocaleIndex, getManifest } from '@/lib/content/loaders';
import { LOCALE_LABELS, type LocaleCode, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { withLocale } from '@/lib/locale-paths';
import { getCanonicalUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'credits' });
  const canonicalUrl = getCanonicalUrl(locale, 'credits');
  const description =
    t('description') ??
    "Learn about the creators and contributors behind JS Questions Lab, including Lydia Hallie's original JavaScript questions.";

  return {
    title: `${t('label')} — ${siteConfig.name}`,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((loc) => [loc, getCanonicalUrl(loc, 'credits')]),
      ),
    },
    openGraph: {
      title: `${t('label')} — ${siteConfig.name}`,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: locale,
      type: 'website',
    },
  };
}

export const dynamic = 'force-static';

interface CreditsPageProps {
  params: Promise<{ locale: LocaleCode }>;
}

const LOCALE_FLAGS: Record<LocaleCode, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  ja: '🇯🇵',
  'pt-BR': '🇧🇷',
};

export default async function CreditsPage({ params }: CreditsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const manifest = getManifest(locale);
  const enManifest = getManifest('en'); // always load EN for upstream translations list
  const localeIndex = getLocaleIndex();
  const t = await getTranslations({ locale, namespace: 'credits' });

  const additions = [t('addition1'), t('addition2'), t('addition3'), t('addition4')] as const;
  const localeAvailability = new Map(
    (localeIndex?.available ?? []).map((entry) => [entry.code, entry]),
  );
  const appLocales = SUPPORTED_LOCALES.map((code) => ({
    code,
    flag: LOCALE_FLAGS[code],
    label: localeAvailability.get(code)?.label ?? LOCALE_LABELS[code],
    questionCount: localeAvailability.get(code)?.questionCount,
  }));

  return (
    <main className="bg-void min-h-screen pt-32 pb-16 md:pt-40 md:pb-24">
      <Container>
        {/* ── Hero card ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface/50 px-6 py-10 md:px-10 md:py-12">
          {/* subtle ambient glow */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08)_0%,transparent_50%)]" />

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            {t('label')}
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            {t('heroTitle', { creator: siteConfig.creator.displayHandle })}
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-secondary md:text-base">
            {t('heroBody', {
              name: siteConfig.name,
              source: siteConfig.source.name,
            })}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {t('heroNote')}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={siteConfig.creator.xUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/20"
            >
              <IconBrandX className="h-4 w-4" />
              {siteConfig.creator.displayHandle}
            </Link>
            <Link
              href={siteConfig.creator.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-elevated/60 px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <IconBrandGithub className="h-4 w-4" />
              {t('githubProfile')}
            </Link>
            <Link
              href={siteConfig.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-elevated/60 px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {t('projectRepo')}
              <IconArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ── Why / What I Added ──────────────────────────────────────────── */}
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="flex flex-col rounded-xl border border-border-subtle bg-surface/50 p-6 md:p-7">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <IconHammer className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                {t('whyLabel')}
              </p>
            </div>
            <h2 className="mt-5 font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
              {t('whyTitle')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t('whyBody1')}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t('whyBody2')}</p>
          </article>

          <article className="flex flex-col rounded-xl border border-border-subtle bg-surface/50 p-6 md:p-7">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <IconLayersIntersect className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                {t('addedLabel')}
              </p>
            </div>
            <ul className="mt-5 flex flex-1 flex-col justify-center gap-2.5">
              {additions.map((item) => (
                <li
                  key={item.slice(0, 30)}
                  className="flex items-start gap-3 rounded-lg border border-border/50 bg-elevated/50 px-3.5 py-2.5 text-sm leading-relaxed text-muted-foreground"
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[9px] font-bold text-primary">
                    +
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </section>

        {/* ── Source Integrity / Original Credits ─────────────────────────── */}
        <section className="mt-8 grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <article className="flex flex-col rounded-xl border border-border-subtle bg-surface/50 p-6 md:p-7">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <IconHeartHandshake className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                {t('originalLabel')}
              </p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t('originalThanks')}{' '}
              <Link
                href={siteConfig.source.creatorUrl}
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary"
              >
                {siteConfig.source.creatorName}
              </Link>{' '}
              {t('originalFor')}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t('originalBody1')}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t('originalBody2')}
            </p>
            <div className="mt-auto pt-5 flex flex-wrap gap-3">
              <Link
                href={siteConfig.source.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-elevated/60 px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {t('originalRepo')}
                <IconArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href={siteConfig.source.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-elevated/60 px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {t('originalCreator')}
              </Link>
            </div>
          </article>

          <article className="flex flex-col rounded-xl border border-border-subtle bg-surface/50 p-6 md:p-7">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <IconQuote className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                {t('integrityLabel')}
              </p>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {[
                {
                  label: t('integritySourceFile'),
                  value: manifest.source.upstreamPath ?? manifest.source.localPath ?? 'n/a',
                  mono: true,
                  href: null,
                },
                {
                  label: t('integrityGenerated'),
                  value: new Date(manifest.generatedAt).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }),
                  mono: false,
                  href: null,
                },
                {
                  label: t('integrityLocale'),
                  value: manifest.locale.label,
                  mono: true,
                  href: null,
                },
                {
                  label: t('integrityQuestions'),
                  value: String(manifest.totals.questions),
                  mono: true,
                  href: null,
                },
              ].map(({ label, value, mono }) => (
                <div
                  key={label}
                  className="rounded-lg border border-border/50 bg-elevated/40 p-3.5"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    {label}
                  </p>
                  <p
                    className={`mt-1.5 text-sm text-foreground ${mono ? 'font-mono break-all' : ''}`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Upstream commit status */}
            {manifest.source.upstreamCommit && (
              <div className="mt-2.5 rounded-lg border border-border/50 bg-elevated/40 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      {t('integrityUpstreamCommit')}
                    </p>
                    <p className="mt-1.5 font-mono text-sm text-foreground">
                      {manifest.source.upstreamCommit.slice(0, 7)}
                    </p>
                  </div>
                  <Link
                    href={`${siteConfig.source.repoUrl}/commit/${manifest.source.upstreamCommit}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/15"
                  >
                    <IconGitCommit className="h-3.5 w-3.5" />
                    latest
                  </Link>
                </div>
              </div>
            )}
          </article>
        </section>

        {/* ── Supported Languages ─────────────────────────────── */}
        <section className="mt-8 rounded-xl border border-border-subtle bg-surface/50 p-6 md:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                {t('languagesLabel')}
              </p>
              <h2 className="mt-4 font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                {t('languagesTitle')}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {t('languagesBody')}
              </p>
            </div>
            <Link
              href={withLocale(locale, '/questions')}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              {t('startPracticing')}
              <IconArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Pilot locales — always shown */}
          <ul className="mt-7 grid gap-2.5 text-sm sm:grid-cols-2 xl:grid-cols-3">
            {appLocales.map((entry) => {
              const isCurrent = entry.code === locale;
              return (
                <li key={entry.code}>
                  <Link
                    href={withLocale(entry.code, '/credits')}
                    className={`group flex h-full items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors ${
                      isCurrent
                        ? 'border-primary/35 bg-primary/8'
                        : 'border-border/50 bg-elevated/40 hover:border-primary/30 hover:bg-elevated'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg leading-none">{entry.flag}</span>
                      <div>
                        <p className="font-medium text-foreground">{entry.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {entry.code}
                          {entry.questionCount
                            ? ` • ${entry.questionCount} ${t('integrityQuestions').toLowerCase()}`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <IconArrowUpRight
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isCurrent
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover:text-primary'
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Upstream community translations — always from EN manifest */}
          {enManifest.translations.length > 0 && (
            <ul className="mt-6 grid gap-2.5 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
              {enManifest.translations.map((translation) => (
                <li
                  key={translation.href}
                  className="rounded-lg border border-border/50 bg-elevated/40 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-elevated"
                >
                  <Link
                    href={`https://github.com/lydiahallie/javascript-questions/blob/master/${translation.href.replace('./', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 text-foreground transition-colors hover:text-primary"
                  >
                    <span className="min-w-0 font-medium">{translation.label}</span>
                    <IconArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Container>
    </main>
  );
}
