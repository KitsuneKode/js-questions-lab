import { IconArrowRight } from '@tabler/icons-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/container';
import { ContinueLearningShelf } from '@/components/continue-learning-shelf';
import { LandingHero } from '@/components/landing-hero';
import { LandingSections } from '@/components/landing-sections';
import { QuestionCard } from '@/components/question-card';
import { getManifest, getQuestions } from '@/lib/content/loaders';
import { type LocaleCode, SUPPORTED_LOCALES } from '@/lib/i18n/config';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

interface HomePageProps {
  params: Promise<{ locale: LocaleCode }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing' });

  const manifest = getManifest(locale);
  const questions = getQuestions(locale);

  const featured = questions.slice(0, 6);

  const tagCounts = Object.entries(
    questions
      .flatMap((question) => question.tags)
      .reduce<Record<string, number>>((acc, tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1;
        return acc;
      }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9)
    .map(([tag, count]) => ({ tag, count }));

  return (
    <main className="bg-void min-h-screen">
      <Container>
        <LandingHero
          total={manifest.totals.questions}
          runnable={manifest.totals.runnable}
          tagCount={manifest.tags.length}
          locale={locale}
        />

        <ContinueLearningShelf questions={questions} locale={locale} />

        <LandingSections tagCounts={tagCounts} locale={locale} />

        {/* Featured questions */}
        <section className="py-24 max-w-6xl mx-auto px-4 border-t border-border">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="font-display text-4xl text-foreground tracking-tight">
                {t('featuredTitle')}
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">{t('featuredSubline')}</p>
            </div>
            <Link
              href={`/${locale}/questions`}
              className="group inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {t('viewAll', { count: questions.length })}
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((question) => (
              <QuestionCard key={question.id} question={question} locale={locale} />
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
