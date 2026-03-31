'use client';

import { IconStack3 as Layers3 } from '@tabler/icons-react';
import { AnimatePresence, motion } from 'motion/react';

import { cn } from '@/lib/utils';
import type { StackFrame } from '@/lib/visualization/replay-engine';

const SPRING_TRANSITION = { type: 'spring', bounce: 0.15, duration: 0.4 } as const;
const EXIT_TRANSITION = { duration: 0.15, ease: 'easeOut' } as const;

const KIND_COLORS = {
  sync: {
    border: 'border-pink-500/30',
    bg: 'bg-pink-500/10',
    text: 'text-pink-200',
    glow: 'shadow-pink-500/10',
  },
  micro: {
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/10',
    text: 'text-violet-200',
    glow: 'shadow-violet-500/10',
  },
  macro: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-200',
    glow: 'shadow-amber-500/10',
  },
  raf: {
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-200',
    glow: 'shadow-cyan-500/10',
  },
} as const;

interface DebuggerCallStackProps {
  frames: StackFrame[];
  activeFrameId?: string | null;
  prefersReducedMotion?: boolean;
  className?: string;
}

export function DebuggerCallStack({
  frames,
  activeFrameId,
  prefersReducedMotion = false,
  className,
}: DebuggerCallStackProps) {
  return (
    <section
      className={cn(
        'flex flex-col rounded-xl border border-pink-500/20 bg-pink-500/5 p-4 relative overflow-hidden',
        className,
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-2 mb-4">
        <span className="h-2 w-2 rounded-full bg-pink-400" />
        <Layers3 className="h-4 w-4 text-pink-400/70" />
        <span className="text-xs font-semibold uppercase tracking-wider text-pink-400/80">
          Call Stack
        </span>
      </div>

      {/* Stack container - grows upward (flex-col-reverse) */}
      <div
        className={cn(
          'relative z-10 flex flex-1 flex-col-reverse gap-2 min-h-[200px] rounded-lg',
          'border border-dashed border-pink-500/20 bg-pink-500/5 p-3',
        )}
      >
        {frames.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm font-mono text-pink-400/30 italic">
            Stack is empty
          </div>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {frames.map((frame, index) => {
              const colors = KIND_COLORS[frame.kind];
              const isActive = frame.id === activeFrameId || index === frames.length - 1;

              return (
                <motion.div
                  key={frame.id}
                  layout
                  initial={
                    prefersReducedMotion
                      ? false
                      : {
                          opacity: 0,
                          y: -20,
                          scale: 0.9,
                          filter: 'blur(4px)',
                        }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    filter: 'blur(0px)',
                  }}
                  exit={
                    prefersReducedMotion
                      ? undefined
                      : {
                          opacity: 0,
                          y: -10,
                          scale: 0.95,
                          filter: 'blur(2px)',
                          transition: EXIT_TRANSITION,
                        }
                  }
                  transition={prefersReducedMotion ? { duration: 0 } : SPRING_TRANSITION}
                  className={cn(
                    'px-4 py-3 rounded-lg border font-mono text-sm transition-shadow',
                    colors.border,
                    colors.bg,
                    isActive && `shadow-lg ${colors.glow}`,
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('font-medium', colors.text)}>{frame.name}</span>
                    {frame.loc && (
                      <span className="text-xs text-muted-foreground/40">:{frame.loc.line}</span>
                    )}
                  </div>

                  {/* Variable preview */}
                  {frame.variables && Object.keys(frame.variables).length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
                      {Object.entries(frame.variables)
                        .slice(0, 3)
                        .map(([key, val]) => (
                          <div key={key} className="flex items-center gap-1 text-xs">
                            <span className={cn('font-medium', colors.text)}>{key}</span>
                            <span className="text-white/30">:</span>
                            <span className="text-muted-foreground truncate">{val.preview}</span>
                          </div>
                        ))}
                      {Object.keys(frame.variables).length > 3 && (
                        <div className="text-xs text-white/30">
                          +{Object.keys(frame.variables).length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Stack depth indicator */}
      <div className="relative z-10 mt-3 text-xs font-mono text-pink-400/50">
        Depth: {frames.length}
      </div>
    </section>
  );
}
