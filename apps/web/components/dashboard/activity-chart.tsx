'use client';

import { IconActivity as Activity, IconShare3 as Share3 } from '@tabler/icons-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { DailyActivity } from '@/lib/progress/analytics';

interface ActivityChartProps {
  dailyActivity: DailyActivity[];
}

export function ActivityChart({ dailyActivity }: ActivityChartProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const [isExporting, setIsExporting] = useState(false);
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

  // Calculate intensity levels
  const maxAttempts = Math.max(1, ...cells.map((c) => c.attempts));
  const totalAttempts = cells.reduce((sum, cell) => sum + cell.attempts, 0);
  const activeDays = cells.filter((cell) => cell.attempts > 0).length;
  const overallAccuracy =
    totalAttempts > 0
      ? Math.round((cells.reduce((sum, cell) => sum + cell.correct, 0) / totalAttempts) * 100)
      : 0;

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
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  };

  const getIntensityColor = (attempts: number) => {
    if (attempts === 0) return '#1a1d23';
    const ratio = attempts / maxAttempts;
    if (ratio < 0.25) return '#5c3c05';
    if (ratio < 0.5) return '#9a6507';
    if (ratio < 0.75) return '#d88a09';
    return '#f59e0b';
  };

  const exportActivitySnapshot = async () => {
    if (typeof document === 'undefined') {
      return;
    }

    setIsExporting(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 900;

      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      context.fillStyle = '#09090b';
      context.fillRect(0, 0, canvas.width, canvas.height);

      const gradient = context.createRadialGradient(1250, 120, 80, 1250, 120, 420);
      gradient.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
      gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = '#f59e0b';
      context.font = '600 18px ui-monospace, SFMono-Regular, Menlo, monospace';
      context.fillText('JS QUESTIONS LAB', 96, 96);

      context.fillStyle = '#fafafa';
      context.font = '600 56px system-ui, sans-serif';
      context.fillText(t('labelActivity'), 96, 168);

      context.fillStyle = '#a1a1aa';
      context.font = '400 24px system-ui, sans-serif';
      context.fillText(t('activitySub'), 96, 212);

      const stats = [
        { label: 'Attempts', value: String(totalAttempts) },
        { label: 'Active days', value: String(activeDays) },
        { label: 'Accuracy', value: `${overallAccuracy}%` },
      ];

      stats.forEach((stat, index) => {
        const x = 96 + index * 206;
        context.fillStyle = '#111318';
        roundRect(context, x, 258, 176, 92, 20);
        context.fill();
        context.strokeStyle = 'rgba(245, 158, 11, 0.18)';
        context.lineWidth = 2;
        roundRect(context, x, 258, 176, 92, 20);
        context.stroke();

        context.fillStyle = '#71717a';
        context.font = '500 16px ui-monospace, SFMono-Regular, Menlo, monospace';
        context.fillText(stat.label.toUpperCase(), x + 20, 292);

        context.fillStyle = '#fafafa';
        context.font = '600 32px system-ui, sans-serif';
        context.fillText(stat.value, x + 20, 332);
      });

      const gridX = 96;
      const gridY = 418;
      const cellSize = 34;
      const gap = 10;
      const dayLabels = ['M', 'W', 'F'];

      context.fillStyle = '#71717a';
      context.font = '500 15px ui-monospace, SFMono-Regular, Menlo, monospace';
      dayLabels.forEach((label, index) => {
        context.fillText(label, 50, gridY + (index * 2 + 1) * (cellSize + gap) - 8);
      });

      cells.forEach((cell, index) => {
        const column = Math.floor(index / 7);
        const row = index % 7;
        const x = gridX + column * (cellSize + gap);
        const y = gridY + row * (cellSize + gap);

        context.fillStyle = getIntensityColor(cell.attempts);
        roundRect(context, x, y, cellSize, cellSize, 9);
        context.fill();

        context.strokeStyle =
          cell.attempts > 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.06)';
        context.lineWidth = 1.5;
        roundRect(context, x, y, cellSize, cellSize, 9);
        context.stroke();
      });

      context.fillStyle = '#71717a';
      context.font = '500 16px ui-monospace, SFMono-Regular, Menlo, monospace';
      context.fillText(
        formatDate(cells[0]?.date ?? new Date().toISOString().slice(0, 10)),
        96,
        794,
      );
      context.fillText(
        formatDate(cells[cells.length - 1]?.date ?? new Date().toISOString().slice(0, 10)),
        96 + WEEKS * (cellSize + gap) - 86,
        794,
      );

      context.fillText(t('labelLess').toUpperCase(), 96, 848);
      [0, 1, 2, 3, 4].forEach((level) => {
        const attempts = level === 0 ? 0 : Math.max(1, Math.round((level / 4) * maxAttempts));
        const x = 176 + level * 48;
        context.fillStyle = getIntensityColor(attempts);
        roundRect(context, x, 824, 28, 28, 8);
        context.fill();
      });
      context.fillText(t('labelMore').toUpperCase(), 430, 848);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      if (!blob) {
        return;
      }

      const filename = `js-questions-lab-activity-${new Date().toISOString().slice(0, 10)}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      if (
        typeof navigator !== 'undefined' &&
        'share' in navigator &&
        'canShare' in navigator &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: t('labelActivity'),
          text: t('activitySub'),
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  if (dailyActivity.length === 0) {
    return null;
  }
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-6 flex flex-col justify-between h-full group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
        <Activity className="w-32 h-32 text-primary" />
      </div>

      <div className="mb-6 relative z-10 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl text-foreground">{t('labelActivity')}</h3>
          <p className="text-xs text-secondary">{t('activitySub')}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void exportActivitySnapshot()}
          disabled={isExporting}
          className="h-8 gap-2 text-[10px] uppercase tracking-wider"
        >
          <Share3 className="h-3.5 w-3.5" />
          {isExporting ? t('preparingPng') : t('sharePng')}
        </Button>
      </div>

      <div className="relative z-10 w-full overflow-x-auto pb-2 scrollbar-thin">
        <div className="inline-grid grid-rows-7 gap-1.5 grid-flow-col auto-cols-max">
          {cells.map((cell) => {
            const accuracy =
              cell.attempts > 0 ? Math.round((cell.correct / cell.attempts) * 100) : 0;
            return (
              <div
                key={cell.date}
                className={`w-3 h-3 rounded-sm border transition-all duration-300 hover:scale-125 hover:z-20 ${getIntensityClass(cell.attempts)}`}
                title={t('activityTitle', {
                  date: formatDate(cell.date),
                  count: cell.attempts,
                  accuracy,
                })}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-widest text-tertiary relative z-10">
        <span>{t('labelLess')}</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-elevated border border-border-subtle" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/20 border border-primary/20" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/40 border border-primary/40" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/70 border border-primary/60" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary border border-primary" />
        </div>
        <span>{t('labelMore')}</span>
      </div>
    </div>
  );
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}
