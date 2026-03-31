'use client';

import {
  IconPlayerPause as Pause,
  IconPlayerPlay as Play,
  IconRotateClockwise2 as RotateCcw,
  IconPlayerSkipBack as SkipBack,
  IconPlayerSkipForward as SkipForward,
  IconPlayerTrackPrev as StepBack,
  IconPlayerTrackNext as StepForward,
} from '@tabler/icons-react';
import { motion } from 'motion/react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReplayStep } from '@/lib/visualization/replay-engine';

const SPRING_TRANSITION = { type: 'spring', bounce: 0.15, duration: 0.4 } as const;

interface DebuggerControlsProps {
  steps: ReplayStep[];
  activeIndex: number;
  isPlaying: boolean;
  prefersReducedMotion?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onRestart: () => void;
  onJumpToStart: () => void;
  onJumpToEnd: () => void;
  onStepClick: (index: number) => void;
  className?: string;
}

export function DebuggerControls({
  steps,
  activeIndex,
  isPlaying,
  prefersReducedMotion = false,
  onPrevious,
  onNext,
  onTogglePlay,
  onRestart,
  onJumpToStart,
  onJumpToEnd,
  onStepClick,
  className,
}: DebuggerControlsProps) {
  const currentStep = steps[activeIndex];
  const progress = steps.length <= 1 ? 100 : (activeIndex / (steps.length - 1)) * 100;

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Main controls */}
      <div className="rounded-xl border border-border/50 bg-surface p-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Playback
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
            {prefersReducedMotion ? 'Reduced' : isPlaying ? 'Playing' : 'Paused'}
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onJumpToStart}
            disabled={activeIndex === 0}
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
            title="Jump to start"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={onPrevious}
            disabled={activeIndex === 0}
            className="h-9 w-9 rounded-md bg-white/5 hover:bg-white/10"
            title="Previous step"
          >
            <StepBack className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={onTogglePlay}
            disabled={prefersReducedMotion || steps.length < 2}
            className="h-10 w-10 rounded-lg bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current ml-0.5" />
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={onNext}
            disabled={activeIndex >= steps.length - 1}
            className="h-9 w-9 rounded-md bg-white/5 hover:bg-white/10"
            title="Next step"
          >
            <StepForward className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onJumpToEnd}
            disabled={activeIndex >= steps.length - 1}
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
            title="Jump to end"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-6 bg-border/50 mx-2" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRestart}
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
            title="Restart"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mt-5 space-y-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={prefersReducedMotion ? { duration: 0 } : SPRING_TRANSITION}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground/60">
            <span>
              Step {activeIndex + 1} / {steps.length}
            </span>
            <span>+{currentStep?.atOffset.toFixed(1) ?? 0}ms</span>
          </div>
        </div>
      </div>

      {/* Step list */}
      <div className="mt-4 rounded-xl border border-border/50 bg-surface p-4 flex-1 flex flex-col min-h-[200px] max-h-[400px]">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Execution Log
          </div>
          <div className="text-[10px] font-mono text-muted-foreground/50">
            {steps.length} events
          </div>
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
          {steps.map((step, index) => (
            <button
              key={step.key}
              type="button"
              onClick={() => onStepClick(index)}
              className={cn(
                'w-full rounded-md border px-2.5 py-2 text-left transition-all duration-200',
                'hover:bg-white/5 active:scale-[0.98]',
                index === activeIndex
                  ? 'border-primary/30 bg-primary/10 shadow-sm'
                  : 'border-transparent bg-transparent',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-[10px] font-mono',
                    index === activeIndex ? 'text-primary' : 'text-muted-foreground/70',
                  )}
                >
                  {step.badge}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground/40">
                  +{step.atOffset.toFixed(0)}ms
                </span>
              </div>
              <div
                className={cn(
                  'mt-1 text-[11px] truncate',
                  index === activeIndex
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground/80',
                )}
              >
                {step.title}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
