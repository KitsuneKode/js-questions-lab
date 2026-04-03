'use client';

import {
  IconActivity as Activity,
  IconChevronLeft as ChevronLeft,
  IconChevronRight as ChevronRight,
  IconClock as Clock3,
  IconStack3 as Layers3,
  IconPlayerPause as Pause,
  IconPlayerPlay as Play,
  IconRotateClockwise2 as RotateCcw,
  IconSparkles as Sparkles,
  IconTerminal2 as Terminal,
} from '@tabler/icons-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TimelineEvent } from '@/lib/run/types';
import { cn } from '@/lib/utils';

type TFunction = ReturnType<typeof useTranslations>;

interface TimelineChartProps {
  events: TimelineEvent[];
}

type ReplayLaneId = 'call-stack' | 'web-apis' | 'microtask-queue' | 'task-queue' | 'console';
type ReplayTone = TimelineEvent['kind'];

interface LaneChip {
  id: string;
  label: string;
  tone: ReplayTone;
}

interface ReplaySnapshot {
  callStack: LaneChip[];
  webApis: LaneChip[];
  microtaskQueue: LaneChip[];
  taskQueue: LaneChip[];
  console: LaneChip[];
}

interface ReplayStep {
  key: string;
  event: TimelineEvent;
  lane: ReplayLaneId;
  title: string;
  caption: string;
  badge: string;
  durationMs: number;
  atOffset: number;
  snapshot: ReplaySnapshot;
}

interface LaneMeta {
  id: ReplayLaneId;
  title: string;
  hint: string;
  idleLabel: string;
  icon: typeof Layers3;
}

// Spring configuration per emil-design-eng
const SPRING_TRANSITION = { type: 'spring', bounce: 0.15, duration: 0.4 } as const;
const EXIT_TRANSITION = { duration: 0.15, ease: 'easeOut' } as const;

const LANE_META: LaneMeta[] = [
  {
    id: 'call-stack',
    title: 'Call Stack',
    hint: 'LIFO: Active execution frames.',
    idleLabel: 'Stack is empty',
    icon: Layers3,
  },
  {
    id: 'web-apis',
    title: 'Web APIs',
    hint: 'Off-thread browser work.',
    idleLabel: 'Idle',
    icon: Clock3,
  },
  {
    id: 'microtask-queue',
    title: 'Microtask Queue',
    hint: 'FIFO: Drained entirely before next task.',
    idleLabel: 'Empty',
    icon: Sparkles,
  },
  {
    id: 'task-queue',
    title: 'Task Queue',
    hint: 'FIFO: Runs one per loop tick.',
    idleLabel: 'Empty',
    icon: Activity,
  },
  {
    id: 'console',
    title: 'Console',
    hint: 'Standard output.',
    idleLabel: 'No output',
    icon: Terminal,
  },
];

const LANE_THEME: Record<
  ReplayLaneId,
  {
    border: string;
    active: string;
    dot: string;
    chipBorder: string;
    chipBg: string;
  }
> = {
  'call-stack': {
    border: 'border-slate-500/20',
    active:
      'border-slate-400/40 shadow-[0_0_0_1px_rgba(148,163,184,0.1),0_8px_30px_rgba(0,0,0,0.3)]',
    dot: 'bg-slate-400',
    chipBorder: 'border-slate-500/20',
    chipBg: 'bg-slate-500/5',
  },
  'web-apis': {
    border: 'border-amber-500/20',
    active:
      'border-amber-400/40 shadow-[0_0_0_1px_rgba(251,191,36,0.1),0_8px_30px_rgba(0,0,0,0.3)]',
    dot: 'bg-amber-400',
    chipBorder: 'border-amber-500/20',
    chipBg: 'bg-amber-500/5',
  },
  'microtask-queue': {
    border: 'border-emerald-500/20',
    active:
      'border-emerald-400/40 shadow-[0_0_0_1px_rgba(52,211,153,0.1),0_8px_30px_rgba(0,0,0,0.3)]',
    dot: 'bg-emerald-400',
    chipBorder: 'border-emerald-500/20',
    chipBg: 'bg-emerald-500/5',
  },
  'task-queue': {
    border: 'border-orange-500/20',
    active:
      'border-orange-400/40 shadow-[0_0_0_1px_rgba(251,146,60,0.1),0_8px_30px_rgba(0,0,0,0.3)]',
    dot: 'bg-orange-400',
    chipBorder: 'border-orange-500/20',
    chipBg: 'bg-orange-500/5',
  },
  console: {
    border: 'border-lime-500/20',
    active: 'border-lime-400/40 shadow-[0_0_0_1px_rgba(163,230,53,0.1),0_8px_30px_rgba(0,0,0,0.3)]',
    dot: 'bg-lime-400',
    chipBorder: 'border-lime-500/20',
    chipBg: 'bg-lime-500/5',
  },
};

const CHIP_THEME: Record<ReplayTone, string> = {
  sync: 'border-slate-500/30 bg-slate-500/10 text-slate-200',
  macro: 'border-orange-500/30 bg-orange-500/10 text-orange-200',
  micro: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  output: 'border-lime-500/30 bg-lime-500/10 text-lime-200',
};

function createEmptySnapshot(): ReplaySnapshot {
  return {
    callStack: [],
    webApis: [],
    microtaskQueue: [],
    taskQueue: [],
    console: [],
  };
}

function cloneSnapshot(snapshot: ReplaySnapshot): ReplaySnapshot {
  return {
    callStack: [...snapshot.callStack],
    webApis: [...snapshot.webApis],
    microtaskQueue: [...snapshot.microtaskQueue],
    taskQueue: [...snapshot.taskQueue],
    console: [...snapshot.console],
  };
}

function normalizeLabel(label: string) {
  return label
    .replace(/\bcallback\b/gi, 'Callback')
    .replace(/\bpromise\.then\b/gi, 'Promise.then')
    .replace(/\bpromise\.catch\b/gi, 'Promise.catch')
    .replace(/\bscript\b/gi, 'Script')
    .trim();
}

function pushPending(map: Map<string, string[]>, key: string, value: string) {
  const queue = map.get(key) ?? [];
  queue.push(value);
  map.set(key, queue);
}

function shiftPending(map: Map<string, string[]>, key: string) {
  const queue = map.get(key) ?? [];
  const next = queue.shift();

  if (queue.length === 0) {
    map.delete(key);
  } else {
    map.set(key, queue);
  }

  return next;
}

function removeChipById(chips: LaneChip[], id: string | undefined) {
  if (!id) {
    return chips;
  }

  return chips.filter((chip) => chip.id !== id);
}

function removeLastMatchingTone(chips: LaneChip[], tone: ReplayTone) {
  const index = [...chips].reverse().findIndex((chip) => chip.tone === tone);

  if (index === -1) {
    return chips;
  }

  const actualIndex = chips.length - 1 - index;
  return chips.filter((_, chipIndex) => chipIndex !== actualIndex);
}

function trimConsole(chips: LaneChip[]) {
  return chips.slice(-4);
}

function describeEvent(
  event: TimelineEvent,
  t: TFunction,
): Pick<ReplayStep, 'lane' | 'title' | 'caption' | 'badge' | 'durationMs'> {
  const prettyLabel = normalizeLabel(event.label);

  if (event.kind === 'sync' && event.phase === 'start') {
    return {
      lane: 'call-stack',
      title: t('titleBegins'),
      caption: t('captionBegins'),
      badge: t('badgeSync'),
      durationMs: 950,
    };
  }

  if (event.kind === 'sync' && event.phase === 'end') {
    return {
      lane: 'call-stack',
      title: t('titleEmpty'),
      caption: t('captionEmpty'),
      badge: t('badgeSync'),
      durationMs: 900,
    };
  }

  if (event.kind === 'micro' && event.phase === 'enqueue') {
    return {
      lane: 'microtask-queue',
      title: `${prettyLabel} enqueued (Microtask)`,
      caption: 'Added to Microtask Queue. Will execute immediately after current stack clears.',
      badge: t('badgeMicro'),
      durationMs: 1050,
    };
  }

  if (event.kind === 'micro' && event.phase === 'start') {
    return {
      lane: 'microtask-queue',
      title: `${prettyLabel} pulled from queue`,
      caption: 'Event loop drains the Microtask Queue, pushing callbacks to the Call Stack.',
      badge: t('badgeMicro'),
      durationMs: 1150,
    };
  }

  if (event.kind === 'micro' && event.phase === 'end') {
    return {
      lane: 'call-stack',
      title: `${prettyLabel} resolved`,
      caption: 'Microtask finishes execution and pops off the Call Stack.',
      badge: t('badgeMicro'),
      durationMs: 900,
    };
  }

  if (event.kind === 'macro' && event.phase === 'enqueue') {
    return {
      lane: 'web-apis',
      title: `${prettyLabel} registered in Web APIs`,
      caption: 'Timer or external API is handed off to the browser environment.',
      badge: t('badgeTask'),
      durationMs: 1150,
    };
  }

  if (event.kind === 'macro' && event.phase === 'start') {
    return {
      lane: 'task-queue',
      title: `${prettyLabel} dispatched (Macrotask)`,
      caption:
        'Moved from Task Queue to Call Stack. Happens only when stack and microtasks are clear.',
      badge: t('badgeTask'),
      durationMs: 1250,
    };
  }

  if (event.kind === 'macro' && event.phase === 'end') {
    return {
      lane: 'call-stack',
      title: `${prettyLabel} completes`,
      caption: 'Macrotask finishes execution and pops off the Call Stack.',
      badge: t('badgeTask'),
      durationMs: 950,
    };
  }

  return {
    lane: 'console',
    title: 'Console output emitted',
    caption: 'Process hit a log statement, flushing to standard output.',
    badge: t('badgeConsole'),
    durationMs: 820,
  };
}

function buildReplaySteps(events: TimelineEvent[], t: TFunction): ReplayStep[] {
  if (events.length === 0) {
    return [];
  }

  const orderedEvents = [...events].sort((a, b) => a.at - b.at);
  const minAt = orderedEvents[0].at;
  const pendingMicro = new Map<string, string[]>();
  const activeMicro = new Map<string, string>();
  const pendingMacro = new Map<string, string[]>();
  const activeMacro = new Map<string, string>();

  let snapshot = createEmptySnapshot();

  return orderedEvents.map((event) => {
    snapshot = cloneSnapshot(snapshot);
    snapshot.taskQueue = [];

    const meta = describeEvent(event, t);
    const prettyLabel = normalizeLabel(event.label);

    if (event.kind === 'sync' && event.phase === 'start') {
      snapshot.callStack = [
        ...snapshot.callStack,
        { id: `sync-${event.id}`, label: prettyLabel, tone: 'sync' },
      ];
    }

    if (event.kind === 'sync' && event.phase === 'end') {
      snapshot.callStack = removeLastMatchingTone(snapshot.callStack, 'sync');
    }

    if (event.kind === 'micro' && event.phase === 'enqueue') {
      const tokenId = `micro-${event.id}`;
      pushPending(pendingMicro, event.label, tokenId);
      snapshot.microtaskQueue = [
        ...snapshot.microtaskQueue,
        { id: tokenId, label: prettyLabel, tone: 'micro' },
      ];
    }

    if (event.kind === 'micro' && event.phase === 'start') {
      const tokenId = shiftPending(pendingMicro, event.label) ?? `micro-active-${event.id}`;
      activeMicro.set(event.label, tokenId);
      snapshot.microtaskQueue = removeChipById(snapshot.microtaskQueue, tokenId);
      snapshot.callStack = [
        ...snapshot.callStack,
        { id: tokenId, label: prettyLabel, tone: 'micro' },
      ];
    }

    if (event.kind === 'micro' && event.phase === 'end') {
      const tokenId = activeMicro.get(event.label);
      snapshot.callStack = removeChipById(snapshot.callStack, tokenId);
      activeMicro.delete(event.label);
    }

    if (event.kind === 'macro' && event.phase === 'enqueue') {
      const tokenId = `macro-${event.id}`;
      pushPending(pendingMacro, event.label, tokenId);
      snapshot.webApis = [...snapshot.webApis, { id: tokenId, label: prettyLabel, tone: 'macro' }];
    }

    if (event.kind === 'macro' && event.phase === 'start') {
      const tokenId = shiftPending(pendingMacro, event.label) ?? `macro-active-${event.id}`;
      activeMacro.set(event.label, tokenId);
      snapshot.webApis = removeChipById(snapshot.webApis, tokenId);
      snapshot.taskQueue = [{ id: tokenId, label: prettyLabel, tone: 'macro' }];
      snapshot.callStack = [
        ...snapshot.callStack,
        { id: tokenId, label: prettyLabel, tone: 'macro' },
      ];
    }

    if (event.kind === 'macro' && event.phase === 'end') {
      const tokenId = activeMacro.get(event.label);
      snapshot.callStack = removeChipById(snapshot.callStack, tokenId);
      snapshot.taskQueue = removeChipById(snapshot.taskQueue, tokenId);
      activeMacro.delete(event.label);
    }

    if (event.kind === 'output' && event.phase === 'instant') {
      snapshot.console = trimConsole([
        ...snapshot.console,
        { id: `output-${event.id}`, label: prettyLabel, tone: 'output' },
      ]);
    }

    return {
      key: `${event.id}-${event.phase}-${event.at}`,
      event,
      lane: meta.lane,
      title: meta.title,
      caption: meta.caption,
      badge: meta.badge,
      durationMs: meta.durationMs,
      atOffset: event.at - minAt,
      snapshot: cloneSnapshot(snapshot),
    };
  });
}

function getLaneChips(snapshot: ReplaySnapshot, lane: ReplayLaneId) {
  switch (lane) {
    case 'call-stack':
      return snapshot.callStack;
    case 'web-apis':
      return snapshot.webApis;
    case 'microtask-queue':
      return snapshot.microtaskQueue;
    case 'task-queue':
      return snapshot.taskQueue;
    case 'console':
      return snapshot.console;
    default:
      return [];
  }
}

export function TimelineChart({ events }: TimelineChartProps) {
  const t = useTranslations('debugger');
  const steps = useMemo(() => buildReplaySteps(events, t), [events, t]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(media.matches);

    updatePreference();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', updatePreference);

      return () => {
        media.removeEventListener('change', updatePreference);
      };
    }

    media.addListener(updatePreference);

    return () => {
      media.removeListener(updatePreference);
    };
  }, []);

  if (steps.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noData')}</p>;
  }

  const replayKey = `${steps.length}-${steps[0]?.key ?? 'start'}-${steps[steps.length - 1]?.key ?? 'end'}-${prefersReducedMotion ? 'reduce' : 'motion'}`;

  return (
    <ReplayExperience key={replayKey} steps={steps} prefersReducedMotion={prefersReducedMotion} />
  );
}

interface ReplayExperienceProps {
  steps: ReplayStep[];
  prefersReducedMotion: boolean;
}

function ReplayExperience({ steps, prefersReducedMotion }: ReplayExperienceProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(!prefersReducedMotion && steps.length > 1);

  useEffect(() => {
    if (
      !isPlaying ||
      prefersReducedMotion ||
      steps.length <= 1 ||
      activeIndex >= steps.length - 1
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActiveIndex((currentIndex) => {
        if (currentIndex >= steps.length - 1) {
          setIsPlaying(false);
          return currentIndex;
        }

        const nextIndex = currentIndex + 1;

        if (nextIndex >= steps.length - 1) {
          setIsPlaying(false);
        }

        return nextIndex;
      });
    }, steps[activeIndex]?.durationMs ?? 1000);

    return () => window.clearTimeout(timeout);
  }, [activeIndex, isPlaying, prefersReducedMotion, steps]);

  const activeStep = steps[Math.min(activeIndex, steps.length - 1)];
  const progress = steps.length === 1 ? 100 : (activeIndex / (steps.length - 1)) * 100;

  const handlePrevious = () => {
    setIsPlaying(false);
    setActiveIndex((currentIndex) => Math.max(0, currentIndex - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setActiveIndex((currentIndex) => Math.min(steps.length - 1, currentIndex + 1));
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setActiveIndex(0);
  };

  const handleTogglePlayback = () => {
    if (prefersReducedMotion) {
      return;
    }

    if (activeIndex >= steps.length - 1) {
      setActiveIndex(0);
      setIsPlaying(true);
      return;
    }

    setIsPlaying((currentState) => !currentState);
  };

  const bgPattern =
    'bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px] [background-position:-8px_-8px]';

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-[#0A0A0A] font-sans shadow-2xl">
      <div className="border-b border-border/50 bg-[#111] px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Activity className="h-3 w-3" />
              Runtime Diagnostics
            </div>
            <h3 className="text-sm font-medium text-foreground">Event Loop Execution Trace</h3>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-border/60 bg-transparent px-2 py-0.5 text-[10px] font-mono tracking-wider text-muted-foreground"
            >
              {steps.length} EVENTS
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5 md:p-6 xl:grid-cols-[minmax(0,1.25fr)_300px]">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Call Stack: Vertical LIFO Representation */}
          <motion.section
            layout
            transition={prefersReducedMotion ? { duration: 0 } : SPRING_TRANSITION}
            className={cn(
              'flex flex-col rounded-lg border bg-[#111] p-4 transition-colors duration-300 lg:w-64 shrink-0 relative overflow-hidden',
              LANE_THEME['call-stack'].border,
              activeStep.lane === 'call-stack' && LANE_THEME['call-stack'].active,
            )}
          >
            <div className={cn('absolute inset-0 opacity-[0.03]', bgPattern)} />
            <div className="relative z-10 flex items-start justify-between gap-3 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span className={cn('h-2 w-2 rounded-full', LANE_THEME['call-stack'].dot)} />
                  <Layers3 className="h-3.5 w-3.5 text-foreground/70" />
                  <span>Call Stack</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-1 flex-col justify-end">
              <div
                className={cn(
                  'flex flex-col-reverse gap-2 rounded-md border border-dashed min-h-[240px] p-3',
                  LANE_THEME['call-stack'].chipBorder,
                  LANE_THEME['call-stack'].chipBg,
                )}
              >
                {activeStep.snapshot.callStack.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs font-mono text-muted-foreground/40">
                    {LANE_META.find((m) => m.id === 'call-stack')?.idleLabel}
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {activeStep.snapshot.callStack.map((chip) => (
                      <motion.div
                        key={chip.id}
                        layout
                        initial={
                          prefersReducedMotion
                            ? false
                            : { opacity: 0, scale: 0.95, filter: 'blur(4px)', y: -10 }
                        }
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
                        exit={
                          prefersReducedMotion
                            ? undefined
                            : {
                                opacity: 0,
                                scale: 0.95,
                                filter: 'blur(2px)',
                                transition: EXIT_TRANSITION,
                              }
                        }
                        transition={prefersReducedMotion ? { duration: 0 } : SPRING_TRANSITION}
                        className={cn(
                          'flex items-center rounded border px-3 py-2 text-xs font-mono font-medium shadow-sm transition-transform active:scale-[0.98]',
                          CHIP_THEME[chip.tone],
                        )}
                      >
                        {chip.label}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.section>

          {/* Queues and Console */}
          <div className="flex flex-1 flex-col gap-4">
            {/* Active Step Narrator */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeStep.key}
                initial={
                  prefersReducedMotion ? false : { opacity: 0, scale: 0.97, filter: 'blur(2px)' }
                }
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={
                  prefersReducedMotion
                    ? undefined
                    : { opacity: 0, scale: 0.98, transition: EXIT_TRANSITION }
                }
                transition={prefersReducedMotion ? { duration: 0 } : SPRING_TRANSITION}
                className="rounded-lg border border-border/50 bg-[#161616] p-4"
              >
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2 font-mono">
                  <span className="text-primary/80">+{activeStep.atOffset.toFixed(2)}ms</span>
                  <span>•</span>
                  <span>{activeStep.badge}</span>
                </div>
                <h4 className="text-base font-semibold text-foreground">{activeStep.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground/80">{activeStep.caption}</p>
              </motion.div>
            </AnimatePresence>

            {/* Queues */}
            {LANE_META.filter((lane) => lane.id !== 'console' && lane.id !== 'call-stack').map(
              (lane) => {
                const laneChips = getLaneChips(activeStep.snapshot, lane.id);
                const theme = LANE_THEME[lane.id];
                const isActiveLane = activeStep.lane === lane.id;
                const Icon = lane.icon;

                return (
                  <motion.section
                    key={lane.id}
                    layout
                    transition={prefersReducedMotion ? { duration: 0 } : SPRING_TRANSITION}
                    className={cn(
                      'rounded-lg border bg-[#111] p-3 transition-colors duration-300 relative overflow-hidden',
                      theme.border,
                      isActiveLane && theme.active,
                    )}
                  >
                    <div className={cn('absolute inset-0 opacity-[0.02]', bgPattern)} />
                    <div className="relative z-10 flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className={cn('h-1.5 w-1.5 rounded-full', theme.dot)} />
                        <Icon className="h-3 w-3 text-foreground/70" />
                        <span>{lane.title}</span>
                      </div>
                    </div>

                    <div
                      className={cn(
                        'min-h-[56px] rounded flex items-center border border-dashed px-3 py-2',
                        theme.chipBorder,
                        theme.chipBg,
                      )}
                    >
                      {laneChips.length === 0 ? (
                        <div className="text-[11px] font-mono text-muted-foreground/40">
                          {lane.idleLabel}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 w-full">
                          <AnimatePresence initial={false}>
                            {laneChips.map((chip, i) => (
                              <motion.div
                                key={chip.id}
                                layout
                                initial={
                                  prefersReducedMotion ? false : { opacity: 0, x: -10, scale: 0.95 }
                                }
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={
                                  prefersReducedMotion
                                    ? undefined
                                    : { opacity: 0, scale: 0.95, transition: EXIT_TRANSITION }
                                }
                                transition={
                                  prefersReducedMotion
                                    ? { duration: 0 }
                                    : { ...SPRING_TRANSITION, delay: i * 0.05 }
                                }
                                className={cn(
                                  'inline-flex items-center rounded border px-2.5 py-1 text-[11px] font-mono font-medium shadow-sm transition-transform active:scale-[0.97]',
                                  CHIP_THEME[chip.tone],
                                )}
                              >
                                {chip.label}
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </motion.section>
                );
              },
            )}

            {/* Console */}
            <motion.section
              layout
              transition={prefersReducedMotion ? { duration: 0 } : SPRING_TRANSITION}
              className={cn(
                'rounded-lg border bg-[#0a0a0a] p-3 transition-colors duration-300',
                LANE_THEME.console.border,
                activeStep.lane === 'console' && LANE_THEME.console.active,
              )}
            >
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                <span className={cn('h-1.5 w-1.5 rounded-full', LANE_THEME.console.dot)} />
                <Terminal className="h-3 w-3 text-foreground/70" />
                <span>Console</span>
              </div>

              <div
                className={cn(
                  'min-h-[72px] rounded border border-dashed p-2 font-mono',
                  LANE_THEME.console.chipBorder,
                  LANE_THEME.console.chipBg,
                )}
              >
                {activeStep.snapshot.console.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground/40 flex h-full items-center pl-2">
                    No output yet
                  </div>
                ) : (
                  <div className="space-y-1">
                    <AnimatePresence initial={false}>
                      {activeStep.snapshot.console.map((chip) => (
                        <motion.div
                          key={chip.id}
                          layout
                          initial={prefersReducedMotion ? false : { opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={
                            prefersReducedMotion
                              ? undefined
                              : { opacity: 0, transition: EXIT_TRANSITION }
                          }
                          transition={prefersReducedMotion ? { duration: 0 } : SPRING_TRANSITION}
                          className={cn(
                            'flex items-start gap-2 rounded-sm px-2 py-1 text-[11px]',
                            CHIP_THEME.output,
                          )}
                        >
                          <span className="text-lime-500/50 mt-[1px]">{'>'}</span>
                          <span>{chip.label}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.section>
          </div>
        </div>

        {/* Sidebar Controls */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-border/50 bg-[#111] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Playback
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
                {prefersReducedMotion ? 'Reduced' : isPlaying ? 'Playing' : 'Paused'}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handlePrevious}
                disabled={activeIndex === 0}
                className="h-8 w-8 rounded-md transition-transform active:scale-[0.94] bg-white/5 hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="default"
                size="icon"
                onClick={handleTogglePlayback}
                disabled={prefersReducedMotion || steps.length < 2}
                className="h-9 w-9 rounded-md transition-transform active:scale-[0.94] bg-primary text-primary-foreground shadow-md"
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
                onClick={handleNext}
                disabled={activeIndex === steps.length - 1}
                className="h-8 w-8 rounded-md transition-transform active:scale-[0.94] bg-white/5 hover:bg-white/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRestart}
                className="ml-auto h-8 w-8 rounded-md transition-transform active:scale-[0.94]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>

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
                  {activeIndex + 1} / {steps.length}
                </span>
                <span>+{activeStep.atOffset.toFixed(1)}ms</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-[#111] p-4 flex-1 flex flex-col min-h-[300px] max-h-[500px]">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Execution Log
              </div>
            </div>

            <div
              className="flex-1 space-y-1.5 overflow-y-auto pr-1 -mr-1 custom-scrollbar"
              id="execution-log-container"
            >
              {steps.map((step, index) => (
                <button
                  key={step.key}
                  type="button"
                  ref={(el) => {
                    if (el && index === activeIndex) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  }}
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveIndex(index);
                  }}
                  className={cn(
                    'w-full rounded-md border px-2.5 py-2 text-left transition-all duration-200 active:scale-[0.98]',
                    index === activeIndex
                      ? 'border-primary/30 bg-primary/10 shadow-sm'
                      : 'border-transparent bg-transparent hover:bg-white/5',
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
        </aside>
      </div>
    </div>
  );
}
