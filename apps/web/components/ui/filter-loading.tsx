'use client';

import { IconBrain as Brain } from '@tabler/icons-react';

interface FilterLoadingProps {
  message?: string;
}

export function FilterLoading({ message = 'Filtering questions...' }: FilterLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-border-subtle bg-surface/40 px-6 py-16 text-center">
      {/* Animated icons */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 animate-spin-slow">
          <div className="h-full w-full rounded-full border-2 border-dashed border-primary/30" />
        </div>

        {/* Middle counter-rotating ring */}
        <div className="absolute inset-2 animate-spin-reverse-slow">
          <div className="h-full w-full rounded-full border-2 border-dotted border-secondary/40" />
        </div>

        {/* Center icon cycle */}
        <div className="relative z-10 flex h-12 w-12 items-center justify-center">
          <div className="animate-pulse">
            <Brain className="h-6 w-6 text-primary" />
          </div>
        </div>

        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-spin">
          <div className="absolute top-0 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 rounded-full bg-primary shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
        </div>
        <div className="absolute inset-0 animate-spin-reverse animation-delay-500">
          <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1 rounded-full bg-secondary shadow-[0_0_10px_rgba(56,189,248,0.6)]" />
        </div>
      </div>

      {/* Loading message with animated dots */}
      <div className="space-y-2">
        <p className="font-display text-lg text-foreground">{message}</p>
        <div className="flex items-center justify-center gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-tertiary" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-48 overflow-hidden rounded-full bg-muted/50">
        <div className="h-1 animate-progress rounded-full bg-linear-to-r from-primary via-secondary to-primary bg-size-200" />
      </div>
    </div>
  );
}
