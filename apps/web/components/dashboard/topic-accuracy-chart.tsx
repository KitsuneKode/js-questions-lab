'use client';

import {
  IconArrowRight as ArrowRight,
  IconChartPie as PieChart,
} from '@tabler/icons-react';
import Link from 'next/link';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Button } from '@/components/ui/button';
import type { TagStats } from '@/lib/progress/analytics';

interface TopicAccuracyChartProps {
  tagStats: TagStats[];
}

export function TopicAccuracyChart({ tagStats }: TopicAccuracyChartProps) {
  // Only plot topics that have been attempted
  const activeTopics = tagStats.filter((t) => t.totalAttempts > 0);

  if (activeTopics.length < 3) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
        <PieChart className="h-8 w-8 text-tertiary mb-3" />
        <p className="font-display text-lg text-foreground">Not enough data</p>
        <p className="text-sm text-secondary mt-1">
          Practice at least 3 topics to unlock your mastery radar.
        </p>
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-elevated border border-border-subtle p-3 rounded-xl shadow-lg backdrop-blur-xl">
          <p className="font-medium text-foreground text-sm mb-1">{data.subject}</p>
          <p className="text-xs text-secondary">
            {data.raw.correctAttempts}/{data.raw.totalAttempts} correct ({data.A}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="col-span-2 rounded-2xl border border-border-subtle bg-surface p-6 lg:col-span-1 flex flex-col">
      <div className="mb-2">
        <h3 className="font-display text-xl text-foreground">Topic Mastery</h3>
        <p className="text-xs text-secondary">Your accuracy across core concepts.</p>
      </div>

      <div className="h-[280px] w-full mt-4 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="var(--border-subtle)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Mastery"
              dataKey="A"
              stroke="var(--accent-primary)"
              fill="var(--accent-primary)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-auto pt-6 border-t border-border-subtle space-y-3">
        <h4 className="text-xs font-semibold text-tertiary uppercase tracking-widest mb-2">
          Needs Practice
        </h4>
        {sortedByWeakness.map((tag) => (
          <div key={tag.tag} className="flex items-center justify-between">
            <span className="text-sm text-foreground capitalize">{tag.tag}</span>
            <Link href={`/questions?tag=${tag.tag}`}>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/10"
              >
                Practice <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
