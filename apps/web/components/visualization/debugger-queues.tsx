'use client';

import { IconActivity as Activity, IconSparkles as Sparkles } from '@tabler/icons-react';
import { AnimatePresence, motion } from 'motion/react';

import { cn } from '@/lib/utils';
import type { QueueItem } from '@/lib/visualization/replay-engine';

const SPRING_TRANSITION = { type: 'spring', bounce: 0.15, duration: 0.4 } as const;
const EXIT_TRANSITION = { duration: 0.15, ease: 'easeOut' } as const;

const QUEUE_COLORS = {
  micro: {
    border: 'border-violet-500/20',
    activeBorder: 'border-violet-400/40',
    bg: 'bg-violet-500/5',
    chipBorder: 'border-violet-500/30',
    chipBg: 'bg-violet-500/10',
    chipText: 'text-violet-200',
    dot: 'bg-violet-400',
    glow: 'shadow-[0_0_0_1px_rgba(139,92,246,0.1),0_8px_30px_rgba(0,0,0,0.3)]',
  },
  macro: {
    border: 'border-amber-500/20',
    activeBorder: 'border-amber-400/40',
    bg: 'bg-amber-500/5',
    chipBorder: 'border-amber-500/30',
    chipBg: 'bg-amber-500/10',
    chipText: 'text-amber-200',
    dot: 'bg-amber-400',
    glow: 'shadow-[0_0_0_1px_rgba(245,158,11,0.1),0_8px_30px_rgba(0,0,0,0.3)]',
  },
} as const;

interface DebuggerQueueProps {
  items: QueueItem[];
  type: 'micro' | 'macro';
  isActive?: boolean;
  prefersReducedMotion?: boolean;
  className?: string;
}

function DebuggerQueue({
  items,
  type,
  isActive = false,
  prefersReducedMotion = false,
  className,
}: DebuggerQueueProps) {
  const colors = QUEUE_COLORS[type];
  const Icon = type === 'micro' ? Sparkles : Activity;
  const title = type === 'micro' ? 'Microtask Queue' : 'Task Queue';
  const hint =
    type === 'micro'
      ? 'FIFO: Drained entirely before next task'
      : 'FIFO: One task per event loop tick';

  return (
    <section
      className={cn(
        'rounded-xl border p-4 transition-all duration-300 relative overflow-hidden',
        colors.border,
        colors.bg,
        isActive && colors.activeBorder,
        isActive && colors.glow,
        className,
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
          <Icon className="h-3.5 w-3.5 text-foreground/70" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/50">{items.length} items</span>
      </div>

      {/* Queue container */}
      <div
        className={cn(
          'relative z-10 min-h-[56px] rounded-lg flex items-center',
          'border border-dashed px-3 py-2',
          colors.chipBorder,
          colors.chipBg,
        )}
      >
        {items.length === 0 ? (
          <div className="text-xs font-mono text-muted-foreground/40">{hint}</div>
        ) : (
          <div className="flex flex-wrap gap-2 w-full">
            <AnimatePresence initial={false} mode="popLayout">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={
                    prefersReducedMotion
                      ? undefined
                      : { opacity: 0, scale: 0.95, transition: EXIT_TRANSITION }
                  }
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { ...SPRING_TRANSITION, delay: index * 0.03 }
                  }
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5',
                    'text-xs font-mono font-medium shadow-sm',
                    colors.chipBorder,
                    colors.chipBg,
                    colors.chipText,
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
                  <span className="truncate max-w-[120px]">{item.label}</span>
                  {item.delay !== undefined && (
                    <span className="text-[10px] text-white/30">{item.delay}ms</span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}

interface DebuggerQueuesProps {
  microtaskQueue: QueueItem[];
  taskQueue: QueueItem[];
  activeLane?: 'micro' | 'macro' | null;
  prefersReducedMotion?: boolean;
  className?: string;
}

export function DebuggerQueues({
  microtaskQueue,
  taskQueue,
  activeLane,
  prefersReducedMotion = false,
  className,
}: DebuggerQueuesProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <DebuggerQueue
        items={microtaskQueue}
        type="micro"
        isActive={activeLane === 'micro'}
        prefersReducedMotion={prefersReducedMotion}
      />
      <DebuggerQueue
        items={taskQueue}
        type="macro"
        isActive={activeLane === 'macro'}
        prefersReducedMotion={prefersReducedMotion}
      />
    </div>
  );
}
