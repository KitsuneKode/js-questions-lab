import type { Metadata } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/container';
import { getReactDiscoveryIndex, getReactManifest } from '@/lib/content/react-loaders';
import type { LocaleCode } from '@/lib/i18n/config';
import { getAlternateLanguages, getCanonicalUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-static';

const CATEGORY_LABELS = {
  component: 'Components',
  hook: 'Hooks',
  pattern: 'Patterns',
  debug: 'Debug',
  styling: 'Styling',
} as const;

const DIFFICULTY_BADGE_CLASS = {
  beginner: 'border-green-500/30 bg-green-500/10 text-green-400',
  intermediate: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  advanced: 'border-red-500/30 bg-red-500/10 text-red-400',
} as const;

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
  const byCategory = questions.reduce<Record<string, typeof questions>>((acc, question) => {
    const currentCategoryQuestions = acc[question.category];
    if (currentCategoryQuestions) {
      currentCategoryQuestions.push(question);
    } else {
      acc[question.category] = [question];
    }
    return acc;
  }, {});

  return (
    <main className="pt-32 pb-16 md:pt-40">
      <Container>
        <section className="space-y-8">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="uppercase tracking-widest font-bold">React Practice</span>
            </div>
            <h1 className="font-display text-5xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[clamp(3rem,2rem+3vw,4.5rem)]">
              Build real React skills
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-secondary">
              {manifest.totalQuestions} challenges across hooks, components, and patterns. Read the
              concept, build in the IDE, then review and grade your confidence.
            </p>
          </header>

          <div className="space-y-10">
            {Object.entries(byCategory).map(([category, items]) => (
              <section key={category} className="space-y-4">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((question) => (
                    <Link
                      key={question.id}
                      href={`/${locale}/react/${question.id}`}
                      className="group flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface/50 p-4 transition-colors hover:border-primary/30 hover:bg-elevated/80"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                          {question.title}
                        </p>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${DIFFICULTY_BADGE_CLASS[question.difficulty]}`}
                        >
                          {question.difficulty}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {question.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded border border-border/50 bg-surface/70 px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
