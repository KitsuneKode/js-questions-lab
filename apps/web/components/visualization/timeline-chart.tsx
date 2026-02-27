'use client';

import { motion } from 'framer-motion';

import type { TimelineEvent } from '@/lib/run/types';
import { Badge } from '@/components/ui/badge';

interface TimelineChartProps {
  events: TimelineEvent[];
}

const KIND_TO_TONE: Record<TimelineEvent['kind'], 'default' | 'success' | 'warning' | 'danger'> = {
  sync: 'default',
  macro: 'warning',
  micro: 'success',
  output: 'danger',
};

export function TimelineChart({ events }: TimelineChartProps) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Run code to generate an event timeline.</p>;
  }

  const minAt = events[0].at;
  const maxAt = events[events.length - 1].at;
  const span = Math.max(maxAt - minAt, 1);

  return (
    <div className="space-y-3">
      {events.map((event, idx) => {
        const offset = ((event.at - minAt) / span) * 100;

        return (
          <motion.div
            key={`${event.id}-${event.phase}-${event.at}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: idx * 0.02 }}
            className="rounded-lg border border-border bg-card/70 p-3"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <Badge tone={KIND_TO_TONE[event.kind]}>{event.kind}</Badge>
              <Badge>{event.phase}</Badge>
              <span className="text-muted-foreground">{event.label}</span>
              <span className="ml-auto text-muted-foreground">+{(event.at - minAt).toFixed(2)}ms</span>
            </div>
            <div className="relative h-2 rounded-full bg-muted/70">
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary/20" style={{ width: `${offset}%` }} />
              <div className="absolute inset-y-0 rounded-full bg-primary" style={{ left: `${offset}%`, width: '6px' }} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
