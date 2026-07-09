'use client';

import { IconLock as Lock } from '@tabler/icons-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { MasteryState, TopicMastery } from '@/lib/progress/mastery';
import { cn } from '@/lib/utils';

const STATE_STYLES: Record<MasteryState, string> = {
  locked: 'border-border-subtle bg-elevated/40 text-tertiary',
  exploring: 'border-sky-500/30 bg-sky-500/5 text-sky-300',
  developing: 'border-amber-500/30 bg-amber-500/5 text-amber-300',
  proficient: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300',
  mastered: 'border-primary/40 bg-primary/10 text-primary shadow-[0_0_20px_rgba(245,158,11,0.08)]',
};

interface MasteryPathsGridProps {
  topics: TopicMastery[];
  locale: string;
}

export function MasteryPathsGrid({ topics, locale }: MasteryPathsGridProps) {
  const t = useTranslations('dashboard');

  if (topics.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-foreground">{t('masteryTitle')}</h2>
        <p className="text-sm text-secondary mt-1">{t('masterySubtitle')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {topics.map((topic) => {
          const accuracyPct = Math.round(topic.accuracy * 100);
          const href = `/${locale}/questions?tag=${encodeURIComponent(topic.tag)}`;

          return (
            <Link
              key={topic.tag}
              href={href}
              className={cn(
                'rounded-xl border p-4 transition-colors hover:bg-elevated/60',
                STATE_STYLES[topic.state],
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize truncate text-foreground">
                    {topic.tag.replace(/-/g, ' ')}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest mt-1 opacity-80">
                    {t(`mastery.${topic.state}`)}
                  </p>
                </div>
                {topic.state === 'locked' ? (
                  <Lock className="h-4 w-4 shrink-0 opacity-60" />
                ) : (
                  <span className="font-mono text-xs tabular-nums shrink-0">
                    {topic.state === 'exploring' && topic.answered < 5
                      ? `${topic.answered}/${Math.min(5, topic.totalInCatalog)}`
                      : `${accuracyPct}%`}
                  </span>
                )}
              </div>
              <p className="text-[11px] mt-3 opacity-70">
                {t('masteryProgress', {
                  answered: topic.answered,
                  total: topic.totalInCatalog,
                })}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
