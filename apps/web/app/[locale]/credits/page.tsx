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
import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/container';
import { getLocaleIndex, getManifest } from '@/lib/content/loaders';
import { LOCALE_LABELS, type LocaleCode, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { withLocale } from '@/lib/locale-paths';
import { siteConfig } from '@/lib/site-config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'credits' });
  return { title: `${t('label')} — ${siteConfig.name}` };
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

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
    <main className="bg-void min-h-screen pt-24 pb-20 md:pt-32">
      <Container>
        {/* ── Hero card ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-[32px] border border-border-subtle bg-surface/80 px-6 py-10 shadow-[0_32px_80px_rgba(0,0,0,0.28)] md:px-12 md:py-14">
          {/* ambient glow */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.1)_0%,transparent_40%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.06)_0%,transparent_45%)]" />
          {/* subtle grid texture */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[40px_40px]" />

          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-primary">
            {t('label')}
          </p>
          <h1 className="mt-5 max-w-4xl font-display text-4xl tracking-[-0.03em] text-foreground md:text-6xl">
            {t('heroTitle', { creator: siteConfig.creator.displayHandle })}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-secondary md:text-lg">
            {t('heroBody', {
              name: siteConfig.name,
              source: siteConfig.source.name,
            })}
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">{t('heroNote')}</p>

          <div className="mt-8 flex flex-wrap gap-3">
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
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="flex flex-col rounded-[28px] border border-border-subtle bg-surface/75 p-8 shadow-[0_18px_56px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <IconHammer className="h-4 w-4" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                {t('whyLabel')}
              </p>
            </div>
            <h2 className="mt-6 font-display text-2xl tracking-[-0.02em] text-foreground lg:text-3xl">
              {t('whyTitle')}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{t('whyBody1')}</p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{t('whyBody2')}</p>
          </article>

          <article className="flex flex-col rounded-[28px] border border-border-subtle bg-surface/75 p-8 shadow-[0_18px_56px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <IconLayersIntersect className="h-4 w-4" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                {t('addedLabel')}
              </p>
            </div>
            <ul className="mt-6 flex flex-1 flex-col justify-center gap-3">
              {additions.map((item) => (
                <li
                  key={item.slice(0, 30)}
                  className="flex items-start gap-3 rounded-2xl border border-border/50 bg-elevated/50 px-4 py-3 text-sm leading-relaxed text-muted-foreground"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] font-bold text-primary">
                    +
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </section>

        {/* ── Source Integrity / Original Credits ─────────────────────────── */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <article className="flex flex-col rounded-[28px] border border-border-subtle bg-surface/75 p-8 shadow-[0_18px_56px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <IconHeartHandshake className="h-4 w-4" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                {t('originalLabel')}
              </p>
            </div>
            <p className="mt-6 text-sm leading-7 text-muted-foreground">
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
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{t('originalBody1')}</p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{t('originalBody2')}</p>
            <div className="mt-auto pt-6 flex flex-wrap gap-3">
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

          <article className="flex flex-col rounded-[28px] border border-border-subtle bg-surface/75 p-8 shadow-[0_18px_56px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <IconQuote className="h-4 w-4" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                {t('integrityLabel')}
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
                  className="rounded-[18px] border border-border/50 bg-elevated/40 p-4"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {label}
                  </p>
                  <p
                    className={`mt-2 text-sm text-foreground ${mono ? 'font-mono break-all' : ''}`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Upstream commit status */}
            {manifest.source.upstreamCommit && (
              <div className="mt-3 rounded-[18px] border border-border/50 bg-elevated/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {t('integrityUpstreamCommit')}
                    </p>
                    <p className="mt-2 font-mono text-sm text-foreground">
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
        <section className="mt-6 rounded-[28px] border border-border-subtle bg-surface/75 p-8 shadow-[0_18px_56px_rgba(0,0,0,0.22)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                {t('languagesLabel')}
              </p>
              <h2 className="mt-4 font-display text-2xl tracking-[-0.02em] text-foreground lg:text-3xl">
                {t('languagesTitle')}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                {t('languagesBody')}
              </p>
            </div>
            <Link
              href={withLocale(locale, '/questions')}
              className="inline-flex items-center gap-2 text-sm text-primary transition-colors hover:text-primary/80"
            >
              {t('startPracticing')}
              <IconArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Pilot locales — always shown */}
          <ul className="mt-8 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
            {appLocales.map((entry) => {
              const isCurrent = entry.code === locale;
              return (
                <li key={entry.code}>
                  <Link
                    href={withLocale(entry.code, '/credits')}
                    className={`group flex h-full items-center justify-between gap-4 rounded-[18px] border px-4 py-3 transition-colors ${
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
            <ul className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
              {enManifest.translations.map((translation) => (
                <li
                  key={translation.href}
                  className="rounded-[18px] border border-border/50 bg-elevated/40 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-elevated"
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
