'use client';

import {
  IconArrowRight,
  IconBolt,
  IconBrandGithub,
  IconChevronRight,
  IconCircleCheck,
  IconCircleX,
} from '@tabler/icons-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { withLocale } from '@/lib/locale-paths';
import { siteConfig } from '@/lib/site-config';
import { cn } from '@/lib/utils';

interface LandingHeroProps {
  total: number;
  runnable: number;
  tagCount: number;
  locale: string;
}

const tickerLabels = ['ticker-a', 'ticker-b'] as const;

const TextGenerateEffect = ({ words }: { words: string }) => {
  const wordsArray = words.split(' ');

  return (
    <motion.div>
      {wordsArray.map((word) => (
        <motion.span
          key={word}
          initial={{ opacity: 0, filter: 'blur(8px)', y: 10 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{
            duration: 0.8,
            delay: wordsArray.indexOf(word) * 0.08,
            type: 'spring',
            bounce: 0.1,
          }}
          className="mr-[0.25em] inline-block"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
};

export function LandingHero({ total, runnable, tagCount, locale }: LandingHeroProps) {
  const t = useTranslations('landing');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const demoQuestion = {
    options: [
      { id: 1, text: '21' },
      { id: 2, text: 'ReferenceError' },
      { id: 3, text: 'undefined' },
      { id: 4, text: 'TypeError' },
    ],
    correctId: 2,
    explanation:
      "With 'use strict', you cannot accidentally declare global variables. Since 'age' is not declared with let, const, or var, it throws a ReferenceError.",
  };

  const handleSelect = (id: number) => {
    if (selectedAnswer === null) {
      setSelectedAnswer(id);
    }
  };

  return (
    <section className="relative flex flex-col overflow-hidden px-4 pt-32 pb-20 sm:px-6 lg:px-8 md:pt-40 md:pb-32">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: 'easeOut' }}
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute right-0 top-0 h-[80vh] w-[80vw] translate-x-1/4 -translate-y-1/4 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.12)_0%,transparent_60%)]" />
        <div className="absolute bottom-0 left-0 h-[60vh] w-[60vw] -translate-x-1/3 translate-y-1/3 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08)_0%,transparent_60%)]" />
        <div className="absolute left-1/2 top-1/2 h-[50vh] w-[50vw] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03)_0%,transparent_50%)]" />
      </motion.div>

      <div className="mx-auto grid w-full max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: 'spring', bounce: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-[0_0_15px_rgba(245,158,11,0.1)]"
          >
            <IconBolt className="h-3 w-3" />
            {siteConfig.name}
          </motion.div>

          <h1 className="font-display text-5xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[clamp(3rem,2rem+3vw,4.5rem)]">
            <TextGenerateEffect words={t('headline')} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, type: 'spring', bounce: 0.1 }}
            className="max-w-[540px] text-lg leading-relaxed text-secondary"
          >
            {t('subline')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, type: 'spring', bounce: 0.1 }}
            className="flex flex-wrap items-center gap-4 pt-4"
          >
            <Link href={withLocale(locale, '/questions')}>
              <Button
                size="lg"
                className="relative h-12 gap-2 rounded-md bg-primary px-8 font-medium text-primary-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] active:scale-[0.97]"
              >
                {t('cta')}
                <IconArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={siteConfig.repoUrl} target="_blank" rel="noreferrer">
              <Button
                variant="ghost"
                size="lg"
                className="h-12 gap-2 px-8 font-medium text-secondary transition-all duration-300 hover:bg-white/5 hover:text-foreground active:scale-[0.97]"
              >
                <IconBrandGithub className="h-4 w-4" />
                {t('ctaGithub')}
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.62, type: 'spring', bounce: 0.1 }}
            className="text-sm text-muted-foreground"
          >
            {t('builtBy')}{' '}
            <Link
              href={siteConfig.creator.xUrl}
              target="_blank"
              rel="noreferrer"
              className="text-foreground transition-colors hover:text-primary"
            >
              {siteConfig.creator.displayHandle}
            </Link>
            {'. '}
            {t('basedOn')}{' '}
            <Link
              href={siteConfig.source.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-foreground transition-colors hover:text-primary"
            >
              {t('lydiaQuestions')}
            </Link>
            .
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.5, type: 'spring', bounce: 0.15 }}
          className="group relative z-10 w-full max-w-[500px] lg:ml-auto"
        >
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 6, ease: 'easeInOut' }}
            className="flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-border-focus group-hover:shadow-[0_20px_50px_rgba(245,158,11,0.1)]"
          >
            <div className="flex items-center gap-2 border-b border-border-subtle bg-elevated/50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-border-subtle" />
                <div className="h-3 w-3 rounded-full bg-border-subtle" />
                <div className="h-3 w-3 rounded-full bg-border-subtle" />
              </div>
              <span className="ml-2 font-mono text-xs text-tertiary">demo.js</span>
            </div>

            <div className="bg-code p-5 font-mono text-[13px] leading-relaxed text-primary">
              <pre>
                <code>
                  <span className="text-code-accent">function</span>{' '}
                  <span className="text-primary">getAge</span>() {'{\n'}
                  {'  '}
                  <span className="text-status-correct">'use strict'</span>;{'\n  '}age ={' '}
                  <span className="text-[#F59E0B]">21</span>;{'\n  '}console.
                  <span className="text-code-accent">log</span>(age);{'\n}\n\n'}
                  <span className="text-primary">getAge</span>();
                </code>
              </pre>
            </div>

            <div className="relative flex flex-col gap-2 bg-surface p-5">
              <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent to-background/50" />

              {demoQuestion.options.map((opt) => {
                const isSelected = selectedAnswer === opt.id;
                const isCorrect = opt.id === demoQuestion.correctId;
                const showStatus = selectedAnswer !== null;

                let stateClass =
                  'border-border-subtle text-secondary hover:border-tertiary hover:bg-elevated';
                if (showStatus) {
                  if (isSelected && isCorrect) {
                    stateClass =
                      'border-status-correct bg-status-correct/10 text-status-correct shadow-[0_0_15px_rgba(34,197,94,0.15)]';
                  } else if (isSelected && !isCorrect) {
                    stateClass = 'border-status-wrong bg-status-wrong/10 text-status-wrong';
                  } else if (isCorrect) {
                    stateClass = 'border-status-correct/50 bg-status-correct/5 text-status-correct';
                  } else {
                    stateClass = 'border-border-subtle/30 text-ghost opacity-40';
                  }
                }

                return (
                  <motion.button
                    key={opt.id}
                    initial={false}
                    animate={
                      showStatus && !isSelected && !isCorrect ? { scale: 0.98, opacity: 0.6 } : {}
                    }
                    onClick={() => handleSelect(opt.id)}
                    disabled={selectedAnswer !== null}
                    className={cn(
                      'relative z-10 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left font-mono text-sm transition-all duration-300 active:scale-[0.98]',
                      stateClass,
                    )}
                  >
                    <span>{opt.text}</span>
                    {showStatus && isSelected ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', bounce: 0.5 }}
                      >
                        {isCorrect ? (
                          <IconCircleCheck className="h-4 w-4" />
                        ) : (
                          <IconCircleX className="h-4 w-4" />
                        )}
                      </motion.div>
                    ) : null}
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {selectedAnswer !== null ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.6 }}
                  className="relative overflow-hidden border-t border-border-subtle bg-elevated/80"
                >
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-primary" />
                  <div className="space-y-3 p-5 pl-6">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <IconChevronRight className="h-4 w-4" /> Explanation
                    </h4>
                    <p className="text-[13px] leading-relaxed text-secondary">
                      {demoQuestion.explanation}
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1, ease: 'easeOut' }}
        className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-border-subtle bg-surface/80 py-4 backdrop-blur-xl"
      >
        <div className="flex animate-marquee whitespace-nowrap">
          {tickerLabels.map((tickerId) => (
            <div
              key={tickerId}
              className="flex items-center gap-12 px-6 text-[13px] font-medium text-tertiary"
            >
              <span className="text-primary">{total} Questions</span>
              <span>•</span>
              <span className="text-foreground">{tagCount} Topics</span>
              <span>•</span>
              <span>100% Free</span>
              <span>•</span>
              <span>Open Source</span>
              <span>•</span>
              <span className="text-foreground">{runnable} Runnable Snippets</span>
              <span>•</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
