'use client';

import { IconRefresh as RefreshCw } from '@tabler/icons-react';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';
import type { EventLoopPhase } from '@/lib/visualization/replay-engine';

const SPRING_TRANSITION = { type: 'spring', bounce: 0.15, duration: 0.4 } as const;

const PHASE_CONFIG = {
  idle: {
    label: 'Waiting for tasks...',
    color: 'slate',
    borderColor: 'border-slate-500',
    textColor: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
  },
  executing: {
    label: 'Executing on call stack',
    color: 'pink',
    borderColor: 'border-pink-500',
    textColor: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
  },
  'checking-microtasks': {
    label: 'Draining microtask queue',
    color: 'violet',
    borderColor: 'border-violet-500',
    textColor: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
  },
  'checking-tasks': {
    label: 'Picking next task',
    color: 'amber',
    borderColor: 'border-amber-500',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
} as const;

interface DebuggerEventLoopProps {
  phase: EventLoopPhase;
  prefersReducedMotion?: boolean;
  className?: string;
}

export function DebuggerEventLoop({
  phase,
  prefersReducedMotion = false,
  className,
}: DebuggerEventLoopProps) {
  const config = PHASE_CONFIG[phase];

  return (
    <section
      className={cn(
        'flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-300',
        'border-slate-700 bg-slate-800/50',
        className,
      )}
    >
      {/* Animated loop indicator */}
      <div className="relative">
        <motion.div
          className={cn(
            'w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center',
            config.borderColor,
            config.bgColor,
          )}
          animate={prefersReducedMotion ? {} : phase === 'idle' ? { rotate: 0 } : { rotate: 360 }}
          transition={
            phase === 'idle'
              ? { duration: 0.3 }
              : { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }
          }
        >
          <RefreshCw className={cn('h-4 w-4', config.textColor)} />
        </motion.div>

        {/* Activity pulse */}
        {phase !== 'idle' && !prefersReducedMotion && (
          <motion.div
            className={cn('absolute inset-0 rounded-full border', config.borderColor)}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
          />
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
          Event Loop
        </div>
        <motion.div
          key={phase}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : SPRING_TRANSITION}
          className={cn('text-sm font-medium truncate', config.textColor)}
        >
          {config.label}
        </motion.div>
      </div>

      {/* Phase indicator dots */}
      <div className="flex gap-1">
        {(['executing', 'checking-microtasks', 'checking-tasks'] as const).map((p) => (
          <motion.div
            key={p}
            className={cn(
              'w-2 h-2 rounded-full transition-colors duration-200',
              phase === p ? PHASE_CONFIG[p].borderColor.replace('border-', 'bg-') : 'bg-slate-700',
            )}
            animate={phase === p && !prefersReducedMotion ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, repeat: phase === p ? Number.POSITIVE_INFINITY : 0 }}
          />
        ))}
      </div>
    </section>
  );
}
