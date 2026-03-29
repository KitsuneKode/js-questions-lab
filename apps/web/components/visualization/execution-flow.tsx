'use client';

import { Pause, Play, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { QuestionRecord } from '@/lib/content/types';
import type { TimelineEvent, TimelineKind } from '@/lib/run/types';

interface ExecutionFlowProps {
  question: QuestionRecord;
  timeline: TimelineEvent[];
}

const KIND_COLORS: Record<TimelineKind, string> = {
  sync: 'hsl(var(--chart-1))',
  macro: 'hsl(var(--chart-2))',
  micro: 'hsl(var(--chart-3))',
  output: 'hsl(var(--chart-4))',
};

const KIND_LABELS: Record<TimelineKind, string> = {
  sync: 'sync',
  macro: 'setTimeout',
  micro: 'Promise.then',
  output: 'console.log',
};

function getConceptualSteps(tags: string[]): string[] {
  const lowerTags = tags.map((t) => t.toLowerCase());

  if (lowerTags.includes('async')) {
    return [
      'Synchronous execution starts',
      'Async tasks enqueue in micro/macro queues',
      'Call stack clears',
      'Microtasks resolve before macrotasks',
    ];
  }

  if (lowerTags.includes('scope')) {
    return [
      'Execution context is created',
      'Declarations are hoisted',
      'Scopes are resolved by lexical chain',
      'Runtime output follows scope rules',
    ];
  }

  if (lowerTags.includes('objects')) {
    return [
      'Values are assigned',
      'Reference/value behavior applies',
      'Mutations propagate by reference',
      'Output reflects object identity',
    ];
  }

  return [
    'Read question prompt',
    'Pick an answer option',
    'Reveal explanation',
    'Run and inspect behavior',
  ];
}

export function ExecutionFlow({ question, timeline }: ExecutionFlowProps) {
  const steps = useMemo(() => getConceptualSteps(question.tags), [question.tags]);
  const [activeStep, setActiveStep] = useState(-1);
  const [playing, setPlaying] = useState(false);

  // Auto-advance when playing
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= steps.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(timer);
  }, [playing, steps.length]);

  function togglePlay() {
    if (playing) {
      setPlaying(false);
    } else {
      // If at end, restart
      if (activeStep >= steps.length - 1) {
        setActiveStep(-1);
      }
      setPlaying(true);
    }
  }

  function reset() {
    setPlaying(false);
    setActiveStep(-1);
  }

  // Dedupe timeline events for display (only show key events)
  const keyTimelineEvents = useMemo(
    () => timeline.filter((e) => e.phase === 'start' || e.phase === 'instant'),
    [timeline],
  );

  return (
    <div className="space-y-4 rounded-lg border border-border bg-black/10 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Execution flow</p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={togglePlay}>
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Animated concept steps with connecting rail */}
      <ol className="space-y-0">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isPast = index < activeStep;

          return (
            <li key={step}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: index * 0.15,
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                }}
                onClick={() => {
                  setPlaying(false);
                  setActiveStep(index);
                }}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-all duration-200 ${
                  isActive
                    ? 'ring-2 ring-primary/50 bg-primary/10 border-primary/30 scale-[1.02]'
                    : isPast
                      ? 'border-border/60 bg-card/50 opacity-70'
                      : 'border-border bg-card/70'
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs transition-colors ${
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
                  }`}
                >
                  {index + 1}
                </span>
                <span>{step}</span>
              </motion.div>

              {/* Connecting rail between steps */}
              {index < steps.length - 1 && (
                <motion.div
                  className="ml-[11px] w-[2px] bg-linear-to-b from-primary/40 to-primary/10"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: index * 0.15 + 0.1, duration: 0.3 }}
                  style={{ transformOrigin: 'top', height: 24 }}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Timeline event markers (from Run tab data) */}
      {keyTimelineEvents.length > 0 ? (
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-xs font-medium text-muted-foreground">Runtime events captured</p>
          <div className="flex flex-wrap gap-1.5">
            {keyTimelineEvents.map((event) => (
              <Badge key={`${event.id}-${event.phase}`} className="text-[10px]">
                {event.kind}: {event.label}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Run the code in the Run tab to see actual execution events here.
        </p>
      )}

      {/* Event kind legend */}
      <div className="flex flex-wrap gap-3 border-t border-border pt-3">
        {(Object.keys(KIND_COLORS) as TimelineKind[]).map((kind) => (
          <div key={kind} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: KIND_COLORS[kind] }}
            />
            <span>{KIND_LABELS[kind]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
