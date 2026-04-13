'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';
import { PLAYBACK_SPEEDS, type ReplaySpeed } from '@/lib/visualization/playback-speed';

interface PlaybackSpeedToggleProps {
  value: ReplaySpeed;
  onChange: (speed: ReplaySpeed) => void;
  disabled?: boolean;
  className?: string;
}

export function PlaybackSpeedToggle({
  value,
  onChange,
  disabled = false,
  className,
}: PlaybackSpeedToggleProps) {
  const groupId = useId();

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Speed</span>
        <span className="font-mono text-muted-foreground/60">
          {PLAYBACK_SPEEDS.find((speed) => speed.value === value)?.label ?? 'Normal'}
        </span>
      </div>

      <div role="radiogroup" aria-label="Replay speed" className="grid grid-cols-3 gap-1.5">
        {PLAYBACK_SPEEDS.map((speed) => {
          const inputId = `${groupId}-${speed.value}`;

          return (
            <label
              key={speed.value}
              htmlFor={inputId}
              className={cn(
                'cursor-pointer rounded-md border px-2 py-1.5 text-center text-[11px] font-medium transition-all duration-200',
                'disabled:cursor-not-allowed disabled:opacity-45',
                value === speed.value
                  ? 'border-primary/40 bg-primary/15 text-primary shadow-sm'
                  : 'border-border/50 bg-white/5 text-muted-foreground hover:border-border hover:bg-white/10 hover:text-foreground',
                disabled && 'cursor-not-allowed opacity-45',
              )}
            >
              <input
                id={inputId}
                type="radio"
                name={groupId}
                value={speed.value}
                checked={value === speed.value}
                disabled={disabled}
                onChange={() => onChange(speed.value)}
                className="sr-only"
              />
              {speed.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}
