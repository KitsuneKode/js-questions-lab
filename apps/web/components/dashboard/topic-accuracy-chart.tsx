'use client';

import { IconArrowRight as ArrowRight, IconChartPie as PieChart } from '@tabler/icons-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, Tooltip } from 'recharts';
import { IntentPrefetchLink } from '@/components/intent-prefetch-link';
import { Button } from '@/components/ui/button';
import { withLocale } from '@/lib/locale-paths';
import type { TagStats } from '@/lib/progress/analytics';

interface TopicAccuracyChartProps {
  tagStats: TagStats[];
}

export function TopicAccuracyChart({ tagStats }: TopicAccuracyChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const t = useTranslations('dashboard');
  const locale = useLocale();

  useEffect(() => {
    const element = chartRef.current;
    if (!element) return;

    const setMeasuredWidth = (width: number) => {
      setChartWidth(Math.max(Math.round(width), 0));
    };
    const measure = () => setMeasuredWidth(element.clientWidth);

    measure();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver((entries) => {
      setMeasuredWidth(entries[0]?.contentRect.width ?? element.clientWidth);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Only plot topics that have been attempted
  const activeTopics = tagStats.filter((t) => t.totalAttempts > 0);

  if (activeTopics.length < 3) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
        <PieChart className="h-8 w-8 text-tertiary mb-3" />
        <p className="font-display text-lg text-foreground">{t('notEnoughData')}</p>
        <p className="text-sm text-secondary mt-1">{t('radarUnlock')}</p>
      </div>
    );
  }

  // Format data for Recharts
  const data = activeTopics.slice(0, 8).map((tag) => ({
    subject: tag.tag.charAt(0).toUpperCase() + tag.tag.slice(1),
    A: Math.round(tag.accuracy * 100),
    fullMark: 100,
    raw: tag,
  }));

  // Sort weakest to strongest for the list below
  const sortedByWeakness = [...activeTopics].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
  const chartHeight = 280;

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: {
      payload: {
        subject: string;
        raw: { correctAttempts: number; totalAttempts: number };
        A: number;
      };
    }[];
  }) => {
    if (active && payload?.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-elevated border border-border-subtle p-3 rounded-xl shadow-lg backdrop-blur-xl">
          <p className="font-medium text-foreground text-sm mb-1">{data.subject}</p>
          <p className="text-xs text-secondary">
            {t('correctRatio', {
              correct: data.raw.correctAttempts,
              total: data.raw.totalAttempts,
              accuracy: data.A,
            })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="col-span-2 flex min-w-0 flex-col rounded-2xl border border-border-subtle bg-surface p-6 lg:col-span-1">
      <div className="mb-2">
        <h3 className="font-display text-xl text-foreground">{t('topicMastery')}</h3>
        <p className="text-xs text-secondary">{t('topicMasteryDesc')}</p>
      </div>

      <div ref={chartRef} className="relative mt-4 h-[280px] min-h-[280px] min-w-0 w-full">
        {chartWidth > 0 ? (
          <RadarChart
            width={chartWidth}
            height={chartHeight}
            cx="50%"
            cy="50%"
            outerRadius="70%"
            data={data}
          >
            <PolarGrid stroke="var(--border-subtle)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name={t('radarLabel')}
              dataKey="A"
              stroke="var(--accent-primary)"
              fill="var(--accent-primary)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        ) : (
          <div className="h-full w-full rounded-2xl bg-elevated/30" aria-hidden="true" />
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-border-subtle space-y-3">
        <h4 className="text-xs font-semibold text-tertiary uppercase tracking-widest mb-2">
          {t('needsPractice')}
        </h4>
        {sortedByWeakness.map((tag) => (
          <div key={tag.tag} className="flex items-center justify-between">
            <span className="text-sm text-foreground capitalize">{tag.tag}</span>
            <IntentPrefetchLink href={withLocale(locale, `/questions?tag=${tag.tag}`)}>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/10"
              >
                {t('practice')} <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </IntentPrefetchLink>
          </div>
        ))}
      </div>
    </div>
  );
}
