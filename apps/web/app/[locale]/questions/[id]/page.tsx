import { IconArrowRight as ArrowRight, IconSparkles as Sparkles } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/container';
import { QuestionIDEClient } from '@/components/ide/question-ide-client';
import { QuestionCard } from '@/components/question-card';
import { getQuestionById, getQuestions, getRelatedQuestions } from '@/lib/content/loaders';
import { DEFAULT_LOCALE, type LocaleCode, SUPPORTED_LOCALES } from '@/lib/i18n/config';

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

export default async function QuestionDetailPage({ params }: QuestionDetailPageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as LocaleCode;
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
  const prev = all.find((item) => item.id === id - 1) ?? null;
  const next = all.find((item) => item.id === id + 1) ?? null;
  const related = getRelatedQuestions(locale, question, 3);

  return (
    <main className="min-h-screen bg-void overflow-x-hidden pt-12 flex flex-col">
      {/* Decorative ambient background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none -z-10" />

      {/* English fallback notice */}
      {question.isFallback && (
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pt-2 pb-1">
          <div className="flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-400/80">
            <span>ⓘ</span>
            <span>{t('fallbackNotice', { locale })}</span>
          </div>
        </div>
      )}

      {/* IDE — fills all remaining vertical space */}
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
        <QuestionIDEClient
          key={question.id}
          question={question}
          prevId={prev?.id ?? null}
          nextId={next?.id ?? null}
          locale={locale}
        />
      </div>

      {related.length > 0 && (
        <div className="relative border-t border-border-subtle bg-surface/30 backdrop-blur-sm mt-auto">
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
            </section>
          </Container>
        </div>
      )}
    </main>
  );
}
