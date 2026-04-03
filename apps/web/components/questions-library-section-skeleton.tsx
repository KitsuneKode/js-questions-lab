import { Skeleton } from '@/components/ui/skeleton';

export function QuestionsLibrarySectionSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-14 w-full rounded-xl" />

      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="relative">
        <div className="mb-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => i).map((i) => (
            <div
              key={`question-${i}`}
              className="space-y-3 rounded-xl border border-border bg-surface/50 p-4"
            >
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="h-24 w-24 animate-spin-slow rounded-full border-2 border-dashed border-primary/30" />
            <div className="absolute inset-2 h-20 w-20 animate-spin-reverse-slow rounded-full border-2 border-dotted border-secondary/40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-3 w-3 animate-pulse rounded-full bg-primary shadow-[0_0_20px_rgba(245,158,11,0.8)]" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 opacity-30 blur-[1px] sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }, (_, i) => i).map((i) => (
            <div
              key={`question-blur-${i}`}
              className="space-y-3 rounded-xl border border-border bg-surface/50 p-4"
            >
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2">
        {Array.from({ length: 7 }, (_, i) => i).map((i) => (
          <Skeleton key={`page-${i}`} className="h-9 w-9 rounded-md" />
        ))}
      </div>
    </div>
  );
}
