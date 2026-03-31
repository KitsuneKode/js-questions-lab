'use client';

import { IconClock as Clock } from '@tabler/icons-react';
import { AnimatePresence, motion } from 'motion/react';

import { cn } from '@/lib/utils';
import type { WebApiItem } from '@/lib/visualization/replay-engine';

const SPRING_TRANSITION = { type: 'spring', bounce: 0.15, duration: 0.4 } as const;
const EXIT_TRANSITION = { duration: 0.15, ease: 'easeOut' } as const;

const _TYPE_ICONS = {
  timer: 'hourglass',
  raf: 'video',
  fetch: 'cloud',
  event: 'pointer',
} as const;

const TYPE_COLORS = {
  timer: {
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-200',
    progressBg: 'bg-cyan-500/30',
    progressFill: 'bg-cyan-400',
  },
  raf: {
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/10',
    text: 'text-sky-200',
    progressBg: 'bg-sky-500/30',
    progressFill: 'bg-sky-400',
  },
  fetch: {
    border: 'border-teal-500/30',
    bg: 'bg-teal-500/10',
    text: 'text-teal-200',
    progressBg: 'bg-teal-500/30',
    progressFill: 'bg-teal-400',
  },
  event: {
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-200',
    progressBg: 'bg-indigo-500/30',
    progressFill: 'bg-indigo-400',
  },
} as const;

interface DebuggerWebApisProps {
  items: WebApiItem[];
  currentTime?: number;
  isActive?: boolean;
  prefersReducedMotion?: boolean;
  className?: string;
}

export function DebuggerWebApis({
  items,
  currentTime = 0,
  isActive = false,
  prefersReducedMotion = false,
  className,
}: DebuggerWebApisProps) {
  return (
    <section
      className={cn(
        'rounded-xl border p-4 transition-all duration-300 relative overflow-hidden',
        'border-cyan-500/20 bg-cyan-500/5',
        isActive &&
          'border-cyan-400/40 shadow-[0_0_0_1px_rgba(6,182,212,0.1),0_8px_30px_rgba(0,0,0,0.3)]',
        className,
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <Clock className="h-3.5 w-3.5 text-foreground/70" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Web APIs
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/50">
          {items.length} pending
        </span>
      </div>

      {/* APIs container */}
      <div
        className={cn(
          'relative z-10 min-h-[80px] rounded-lg',
          'border border-dashed border-cyan-500/20 bg-cyan-500/5 p-3',
        )}
      >
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs font-mono text-cyan-400/30 italic">
            No pending APIs
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false} mode="popLayout">
              {items.map((item, index) => {
                const colors = TYPE_COLORS[item.type];
                const progress = item.delay
                  ? Math.min(100, ((currentTime - item.startTime) / item.delay) * 100)
                  : 50;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={prefersReducedMotion ? false : { opacity: 0, x: -10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={
                      prefersReducedMotion
                        ? undefined
                        : { opacity: 0, x: 10, scale: 0.95, transition: EXIT_TRANSITION }
                    }
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { ...SPRING_TRANSITION, delay: index * 0.05 }
                    }
                    className={cn('rounded-lg border px-3 py-2', colors.border, colors.bg)}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={cn('text-xs font-mono font-medium', colors.text)}>
                        {item.label}
                      </span>
                      {item.delay !== undefined && (
                        <span className="text-[10px] font-mono text-muted-foreground/50">
                          {item.delay}ms
                        </span>
                      )}
                      {item.url && (
                        <span className="text-[10px] font-mono text-muted-foreground/50 truncate max-w-[100px]">
                          {item.url}
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {item.delay !== undefined && (
                      <div className={cn('h-1 rounded-full overflow-hidden', colors.progressBg)}>
                        <motion.div
                          className={cn('h-full rounded-full', colors.progressFill)}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(5, progress)}%` }}
                          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
                        />
                      </div>
                    )}

                    {/* Pulsing indicator for non-timer APIs */}
                    {item.delay === undefined && (
                      <div className="flex items-center gap-1.5">
                        <motion.span
                          className={cn('h-1.5 w-1.5 rounded-full', colors.progressFill)}
                          animate={prefersReducedMotion ? {} : { opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                        />
                        <span className="text-[10px] text-muted-foreground/50">Waiting...</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
