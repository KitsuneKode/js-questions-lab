'use client';

import { useFilterPending } from '@/lib/filters/filter-pending-context';
import { cn } from '@/lib/utils';

export function FilterLoadingOverlay({ children }: { children: React.ReactNode }) {
  const { isPending } = useFilterPending();

  return (
    // Unconditional wrapper needed so the absolute overlay has a positioned ancestor
    <div className="relative">
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-start justify-center pt-12 rounded-xl bg-void/50 backdrop-blur-[2px] pointer-events-none">
          <div className="flex items-center gap-2 rounded-full bg-surface border border-border-subtle px-4 py-2 shadow-lg">
            <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Filtering
            </span>
          </div>
        </div>
      )}
      {/* Content wrapper is always present so no layout nodes are added/removed during filter */}
      <div
        className={cn(
          'transition-opacity duration-150',
          isPending && 'pointer-events-none select-none opacity-50',
        )}
      >
        {children}
      </div>
    </div>
  );
}
