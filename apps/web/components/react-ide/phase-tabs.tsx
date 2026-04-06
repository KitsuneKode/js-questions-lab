'use client';

import { cn } from '@/lib/utils';

export type ReactIDEPhase = 'read' | 'build' | 'review';

interface PhaseTabsProps {
  phase: ReactIDEPhase;
  onPhaseChange: (phase: ReactIDEPhase) => void;
  hasAttempted: boolean;
}

const PHASES: Array<{ id: ReactIDEPhase; label: string }> = [
  { id: 'read', label: 'Read' },
  { id: 'build', label: 'Build' },
  { id: 'review', label: 'Review' },
];

export function PhaseTabs({ phase, onPhaseChange, hasAttempted }: PhaseTabsProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-elevated/60 p-1">
      {PHASES.map(({ id, label }) => {
        const isActive = id === phase;
        const isLocked = id === 'review' && !hasAttempted;

        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (!isLocked) onPhaseChange(id);
            }}
            disabled={isLocked}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors',
              isActive
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-surface hover:text-foreground',
              isLocked && 'cursor-not-allowed opacity-40',
            )}
          >
            {label}
            {id === 'build' && !hasAttempted && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
