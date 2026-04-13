import { Skeleton } from '@/components/ui/skeleton';

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Podium skeleton */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 px-5 py-6"
          >
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>

      {/* Stats bar skeleton */}
      <div className="flex items-stretch divide-x divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1 px-4 py-3">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* List skeleton */}
      <div className="space-y-1.5">
        {['sk-row-1', 'sk-row-2', 'sk-row-3', 'sk-row-4', 'sk-row-5', 'sk-row-6', 'sk-row-7'].map(
          (id) => (
            <div
              key={id}
              className="flex items-center gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/30 px-4 py-3"
            >
              <Skeleton className="h-7 w-10 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-14" />
            </div>
          ),
        )}
      </div>
    </div>
  );
}
