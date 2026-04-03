import { IconArrowRight as ArrowRight, IconSparkles as Sparkles } from '@tabler/icons-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Container } from '@/components/container';
import { QuestionIDEDynamic as QuestionIDEClient } from '@/components/ide/question-ide-dynamic';
import { QuestionCard } from '@/components/question-card';
import { RelatedTopics } from '@/components/related-topics';
import { BreadcrumbJsonLd } from '@/components/seo/breadcrumb-json-ld';
import { QuestionJsonLd } from '@/components/seo/question-json-ld';
import { getQuestionById, getQuestions, getRelatedQuestions } from '@/lib/content/loaders';
import { DEFAULT_LOCALE, type LocaleCode, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { getAlternateLanguages, getCanonicalUrl, truncateDescription } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

/**
 * Pre-generate all locale × question-id combinations at build time.
 * English is the authoritative id set.
 */
export async function generateStaticParams() {
  const enQuestions = getQuestions(DEFAULT_LOCALE);
  return SUPPORTED_LOCALES.flatMap((locale) =>
    enQuestions.map((q) => ({ locale, id: String(q.id) })),
  );
}

interface QuestionDetailPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateMetadata({ params }: QuestionDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as LocaleCode;
  const id = Number.parseInt(resolvedParams.id, 10);
  const question = getQuestionById(locale, id);

  if (!question) return { title: siteConfig.name };

  const questionPath = `questions/${id}`;
  const canonicalUrl = getCanonicalUrl(locale, questionPath);
  const alternateLanguages = getAlternateLanguages(questionPath);
  const description = truncateDescription(question.promptMarkdown ?? question.title);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jsquestionslab.kitsunelabs.xyz';

  return {
    title: `${question.title} | ${siteConfig.name}`,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },
    openGraph: {
      title: question.title,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: locale,
      type: 'article',
      tags: question.tags,
      publishedTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString(),
      authors: [siteConfig.source.creatorName],
      images: [
        {
          url: `${baseUrl}/${locale}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: question.title,
        },
      ],
    },
    twitter: {
      title: question.title,
      description,
      card: 'summary_large_image',
    },
    keywords: [...question.tags, 'javascript', 'interview question', question.difficulty],
  };
}

export default async function QuestionDetailPage({ params }: QuestionDetailPageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as LocaleCode;
  setRequestLocale(locale);
  const id = Number.parseInt(resolvedParams.id, 10);

  if (!Number.isFinite(id)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'question' });

  const question = getQuestionById(locale, id);
  if (!question) {
    notFound();
  }

  const all = getQuestions(locale);
  const related = getRelatedQuestions(locale, question, 3);

  const questionPath = `questions/${id}`;
  const canonicalUrl = getCanonicalUrl(locale, questionPath);

  return (
    <main className="min-h-screen bg-void overflow-x-hidden pt-24 flex flex-col">
      <QuestionJsonLd question={question} locale={locale} />
      <BreadcrumbJsonLd
        items={[
          { name: t('breadcrumb.home'), url: canonicalUrl.replace(`/questions/${id}`, '') },
          {
            name: t('breadcrumb.questions'),
            url: canonicalUrl.replace(`/questions/${id}`, 'questions'),
          },
          { name: question.title, url: canonicalUrl },
        ]}
      />

      {/* Decorative ambient background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none -z-10" />

      {/* English fallback notice */}
      {question.isFallback && (
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pt-2 pb-1 shrink-0">
          <div className="flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-400/80">
            <span>ⓘ</span>
            <span>{t('fallbackNotice', { locale })}</span>
          </div>
        </div>
      )}

      {/* IDE — fixed height to fill viewport approximately, with internal scrolling */}
      <div className="h-[calc(100vh-5rem)] min-h-[600px] flex flex-col overflow-hidden shrink-0">
        <QuestionIDEClient
          key={question.id}
          question={question}
          locale={locale}
          allQuestions={all}
          breadcrumbs={
            <Breadcrumbs
              items={[
                { label: t('breadcrumb.home'), href: `/${locale}` },
                { label: t('breadcrumb.questions'), href: `/${locale}/questions` },
                { label: question.title, href: `/${locale}/questions/${id}` },
              ]}
              className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border/50 shadow-sm w-max"
            />
          }
        />
      </div>

      {related.length > 0 && (
        <div className="relative border-t border-border-subtle bg-surface/30 backdrop-blur-sm">
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
          <Container>
            <section className="pt-12 pb-24 max-w-[1200px] mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
                    <Sparkles className="h-3 w-3" />
                    {t('keepPracticing')}
                  </div>
                  <h2 className="font-display text-2xl text-foreground">{t('relatedConcepts')}</h2>
                </div>
                <Link
                  href={`/${locale}/questions?tag=${question.tags[0]}`}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary transition-colors hover:text-primary"
                >
                  {t('viewAll')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <QuestionCard key={item.id} question={item} locale={locale} />
                ))}
              </div>

              {question.tags.length > 0 && (
                <div className="mt-10 pt-6 border-t border-border-subtle">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4">
                    {t('relatedConcepts')}
                  </h3>
                  <RelatedTopics tags={question.tags} locale={locale} />
                </div>
              )}
            </section>
          </Container>
        </div>
      )}
    </main>
  );
}
