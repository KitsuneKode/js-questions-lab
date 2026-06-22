import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/container';
import { ReactQuestionGrid } from '@/components/react-ide/react-question-grid';
import { getReactDiscoveryIndex, getReactManifest } from '@/lib/content/react-loaders';
import type { LocaleCode } from '@/lib/i18n/config';
import { getAlternateLanguages, getCanonicalUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonicalUrl = getCanonicalUrl(locale, 'react');
  const path = 'react';

  return {
    title: `React Practice | ${siteConfig.name}`,
    description:
      'Practice React components, hooks, and patterns in a live editor. Build, review, and revisit with spaced repetition.',
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguages(path),
    },
    openGraph: {
      title: `React Practice | ${siteConfig.name}`,
      description: 'Build React components and hooks in a live in-browser IDE.',
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale,
      type: 'website',
    },
  };
}

export default async function ReactLibraryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as LocaleCode);

  const questions = getReactDiscoveryIndex();
  const manifest = getReactManifest();

  return (
    <main className="pt-28 pb-16 md:pt-36">
      <Container>
        <section className="space-y-10">
          <header className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              React Practice
            </div>
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-normal leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Build real React skills
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-secondary">
                {manifest.totalQuestions} challenges across hooks, components, and patterns. Read
                the concept, build in the IDE, review your confidence.
              </p>
            </div>

            {/* Flow indicator */}
            <div className="flex items-center gap-2 pt-1">
              {[
                { step: '01', label: 'Read the concept' },
                { step: '02', label: 'Build in the IDE' },
                { step: '03', label: 'Self-grade' },
              ].map(({ step, label }, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold text-primary/50">{step}</span>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                  {i < 2 && <span className="text-border/60">→</span>}
                </div>
              ))}
            </div>
          </header>

          <ReactQuestionGrid
            questions={questions}
            totalQuestions={manifest.totalQuestions}
            locale={locale}
          />
        </section>
      </Container>
    </main>
  );
}
