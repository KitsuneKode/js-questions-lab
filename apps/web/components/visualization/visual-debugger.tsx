'use client';

import { IconActivity as Activity, IconTerminal2 as Terminal } from '@tabler/icons-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import type { EnhancedTimelineEvent } from '@/lib/run/types';
import { cn } from '@/lib/utils';
import { buildEnhancedReplaySteps } from '@/lib/visualization/replay-engine';

import { DebuggerCallStack } from './debugger-call-stack';
import { DebuggerCodePanel } from './debugger-code-panel';
import { DebuggerControls } from './debugger-controls';
import { DebuggerEventLoop } from './debugger-event-loop';
import { DebuggerQueues } from './debugger-queues';
import { DebuggerWebApis } from './debugger-web-apis';

const SPRING_TRANSITION = { type: 'spring', bounce: 0.15, duration: 0.4 } as const;

interface VisualDebuggerProps {
  code: string;
  enhancedTimeline: EnhancedTimelineEvent[];
  logs?: string[];
  className?: string;
}

export function VisualDebugger({
  code,
  enhancedTimeline,
  logs = [],
  className,
}: VisualDebuggerProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Build replay steps from timeline
  const steps = useMemo(
    () => buildEnhancedReplaySteps(enhancedTimeline, logs),
    [enhancedTimeline, logs],
  );

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(media.matches);
    updatePreference();

    media.addEventListener('change', updatePreference);
    return () => media.removeEventListener('change', updatePreference);
  }, []);

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying || prefersReducedMotion || steps.length <= 1) return;
    if (activeIndex >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const currentStep = steps[activeIndex];
    const timeout = window.setTimeout(() => {
      setActiveIndex((idx) => {
        const next = idx + 1;
        if (next >= steps.length - 1) {
          setIsPlaying(false);
        }
        return Math.min(next, steps.length - 1);
      });
    }, currentStep?.durationMs ?? 1000);

    return () => window.clearTimeout(timeout);
  }, [activeIndex, isPlaying, prefersReducedMotion, steps]);

  // Reset when timeline changes
  useEffect(() => {
    setActiveIndex(0);
    setIsPlaying(false);
  }, []);

  const handlePrevious = useCallback(() => {
    setIsPlaying(false);
    setActiveIndex((idx) => Math.max(0, idx - 1));
  }, []);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    setActiveIndex((idx) => Math.min(steps.length - 1, idx + 1));
  }, [steps.length]);

  const handleTogglePlay = useCallback(() => {
    if (prefersReducedMotion) return;

    if (activeIndex >= steps.length - 1) {
      setActiveIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((playing) => !playing);
    }
  }, [activeIndex, prefersReducedMotion, steps.length]);

  const handleRestart = useCallback(() => {
    setIsPlaying(false);
    setActiveIndex(0);
  }, []);

  const handleJumpToStart = useCallback(() => {
    setIsPlaying(false);
    setActiveIndex(0);
  }, []);

  const handleJumpToEnd = useCallback(() => {
    setIsPlaying(false);
    setActiveIndex(steps.length - 1);
  }, [steps.length]);

  const handleStepClick = useCallback((index: number) => {
    setIsPlaying(false);
    setActiveIndex(index);
  }, []);

  // Empty state
  if (steps.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-12 text-center', className)}>
        <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Execution Data</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Run your code to see a step-by-step visualization of the event loop, call stack, and task
          queues.
        </p>
      </div>
    );
  }

  const currentStep = steps[Math.min(activeIndex, steps.length - 1)];
  const { snapshot } = currentStep;

  // Determine which lane is active based on current step
  const getActiveLane = (): 'micro' | 'macro' | null => {
    if (currentStep.event.kind === 'micro') return 'micro';
    if (currentStep.event.kind === 'macro') return 'macro';
    return null;
  };

  return (
    <div className={cn('font-sans', className)}>
      {/* Header */}
      <div className="border-b border-border/50 bg-[#111] px-5 py-4 rounded-t-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Activity className="h-3 w-3" />
              Visual Debugger
            </div>
            <h3 className="text-sm font-medium text-foreground">JavaScript Execution Visualizer</h3>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-border/60 bg-transparent px-2 py-0.5 text-[10px] font-mono tracking-wider text-muted-foreground"
            >
              {steps.length} STEPS
            </Badge>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-4 p-4 md:p-5 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Code Panel */}
          <DebuggerCodePanel
            code={code}
            currentLine={currentStep.currentLine}
            className="lg:w-[48%]"
          />

          {/* Runtime Visualization */}
          <div className="flex flex-1 flex-col gap-4">
            {/* Current Step Narrator */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentStep.key}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -5 }}
                transition={prefersReducedMotion ? { duration: 0 } : SPRING_TRANSITION}
                className="rounded-xl border border-border/50 bg-[#161616] p-4"
              >
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2 font-mono">
                  <span className="text-primary/80">+{currentStep.atOffset.toFixed(2)}ms</span>
                  <span>|</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'border-transparent px-1.5 py-0 text-[9px] font-semibold',
                      currentStep.badgeColor === 'pink' && 'bg-pink-500/20 text-pink-300',
                      currentStep.badgeColor === 'violet' && 'bg-violet-500/20 text-violet-300',
                      currentStep.badgeColor === 'amber' && 'bg-amber-500/20 text-amber-300',
                      currentStep.badgeColor === 'cyan' && 'bg-cyan-500/20 text-cyan-300',
                      currentStep.badgeColor === 'lime' && 'bg-lime-500/20 text-lime-300',
                      currentStep.badgeColor === 'slate' && 'bg-slate-500/20 text-slate-300',
                    )}
                  >
                    {currentStep.badge}
                  </Badge>
                </div>
                <h4 className="text-base font-semibold text-foreground">{currentStep.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground/80 leading-relaxed">
                  {currentStep.caption}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Visualization Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Call Stack */}
              <DebuggerCallStack
                frames={snapshot.callStack}
                prefersReducedMotion={prefersReducedMotion}
                className="md:row-span-2"
              />

              {/* Web APIs */}
              <DebuggerWebApis
                items={snapshot.webApis}
                currentTime={currentStep.event.at}
                isActive={currentStep.event.kind === 'raf' || currentStep.event.kind === 'macro'}
                prefersReducedMotion={prefersReducedMotion}
              />
            </div>

            {/* Queues */}
            <DebuggerQueues
              microtaskQueue={snapshot.microtaskQueue}
              taskQueue={snapshot.taskQueue}
              activeLane={getActiveLane()}
              prefersReducedMotion={prefersReducedMotion}
            />

            {/* Event Loop */}
            <DebuggerEventLoop
              phase={snapshot.eventLoopPhase}
              prefersReducedMotion={prefersReducedMotion}
            />

            {/* Console Output */}
            {snapshot.console.length > 0 && (
              <section className="rounded-xl border border-lime-500/20 bg-lime-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
                  <Terminal className="h-3.5 w-3.5 text-lime-400/70" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-lime-400/80">
                    Console
                  </span>
                </div>
                <div className="space-y-1 font-mono text-xs">
                  {snapshot.console.map((entry) => (
                    <div
                      key={entry.id}
                      className={cn(
                        'flex items-start gap-2 px-2 py-1 rounded',
                        entry.level === 'error' && 'bg-red-500/10 text-red-300',
                        entry.level === 'warn' && 'bg-amber-500/10 text-amber-300',
                        entry.level === 'log' && 'bg-lime-500/10 text-lime-200',
                        entry.level === 'info' && 'bg-blue-500/10 text-blue-300',
                      )}
                    >
                      <span className="text-lime-500/50 select-none">{'>'}</span>
                      <span className="flex-1 break-all">{entry.message}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Controls Sidebar */}
        <DebuggerControls
          steps={steps}
          activeIndex={activeIndex}
          isPlaying={isPlaying}
          prefersReducedMotion={prefersReducedMotion}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onTogglePlay={handleTogglePlay}
          onRestart={handleRestart}
          onJumpToStart={handleJumpToStart}
          onJumpToEnd={handleJumpToEnd}
          onStepClick={handleStepClick}
        />
      </div>
    </div>
  );
}
