'use client';

import { cn } from '@/lib/utils';

export type ReactIDEPhase = 'build' | 'review';

interface PhaseTabsProps {
  phase: ReactIDEPhase;
  onPhaseChange: (phase: ReactIDEPhase) => void;
  hasAttempted: boolean;
}

const PHASES: Array<{ id: ReactIDEPhase; label: string; step: string }> = [
  { id: 'build', label: 'Build', step: '01' },
  { id: 'review', label: 'Review', step: '02' },
];

export function PhaseTabs({ phase, onPhaseChange, hasAttempted }: PhaseTabsProps) {
  return (
    <div className="inline-flex items-center gap-px rounded-lg border border-border/50 bg-background/60 p-0.5">
      {PHASES.map(({ id, label, step }, _i) => {
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
              'group relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-[0.97]',
              isActive
                ? 'bg-primary/12 text-primary shadow-[0_1px_4px_rgba(0,0,0,0.4)]'
                : isLocked
                  ? 'cursor-not-allowed text-muted-foreground/30'
                  : 'text-muted-foreground hover:bg-surface/60 hover:text-foreground',
            )}
          >
            <span
              className={cn(
                'font-mono text-[9px] font-bold leading-none tabular-nums transition-colors',
                isActive ? 'text-primary/60' : 'text-muted-foreground/30',
              )}
            >
              {step}
            </span>
            <span className="tracking-wide">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
