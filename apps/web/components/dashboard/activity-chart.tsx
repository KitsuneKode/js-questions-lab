'use client';

import { IconActivity as Activity } from '@tabler/icons-react';
import { useMemo } from 'react';
import type { DailyActivity } from '@/lib/progress/analytics';

interface ActivityChartProps {
  dailyActivity: DailyActivity[];
}

export function ActivityChart({ dailyActivity }: ActivityChartProps) {
  // Generate last 119 days (17 weeks * 7 days) to fit well in the container
  const WEEKS = 17;
  const DAYS = WEEKS * 7;

  const cells = useMemo(() => {
    const dayMap = new Map(dailyActivity.map((d) => [d.date, d]));
    const result: DailyActivity[] = [];
    const now = new Date();

    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push(dayMap.get(key) ?? { date: key, attempts: 0, correct: 0 });
    }

    return result;
  }, [dailyActivity, DAYS]);

  if (dailyActivity.length === 0) {
    return null;
  }

  // Calculate intensity levels
  const maxAttempts = Math.max(1, ...cells.map((c) => c.attempts));

  const getIntensityClass = (attempts: number) => {
    if (attempts === 0) return 'bg-elevated border-border-subtle';
    const ratio = attempts / maxAttempts;
    if (ratio < 0.25) return 'bg-primary/20 border-primary/20';
    if (ratio < 0.5) return 'bg-primary/40 border-primary/40';
    if (ratio < 0.75) return 'bg-primary/70 border-primary/60';
    return 'bg-primary border-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-6 flex flex-col justify-between h-full group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
        <Activity className="w-32 h-32 text-primary" />
      </div>

      <div className="mb-6 relative z-10">
        <h3 className="font-display text-xl text-foreground">Activity</h3>
        <p className="text-xs text-secondary">Consistency is the key to mastery.</p>
      </div>

      <div className="relative z-10 w-full overflow-x-auto pb-2 scrollbar-thin">
        <div className="inline-grid grid-rows-7 gap-1.5 grid-flow-col auto-cols-max">
          {cells.map((cell) => {
            const accuracy =
              cell.attempts > 0 ? Math.round((cell.correct / cell.attempts) * 100) : 0;
            return (
              <div
                key={cell.date}
                className={`w-3 h-3 rounded-sm border transition-all duration-300 hover:scale-125 hover:z-20 \${getIntensityClass(cell.attempts)}`}
                title={`${formatDate(cell.date)} — ${cell.attempts} questions, ${accuracy}% accuracy`}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-widest text-tertiary relative z-10">
        <span>Less</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-elevated border border-border-subtle" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/20 border border-primary/20" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/40 border border-primary/40" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/70 border border-primary/60" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary border border-primary" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
