import { Container } from '@/components/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function QuestionsLoading() {
  return (
    <main className="pt-32 pb-16 md:pt-40">
      <Container>
        <div className="space-y-8">
          {/* Header skeleton */}
          <header className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <Skeleton className="h-4 w-24 rounded-sm" />
            </div>
            <Skeleton className="h-14 w-3/4 max-w-lg" />
            <Skeleton className="h-6 w-full max-w-2xl" />
          </header>

          {/* Recommended banner skeleton */}
          <Skeleton className="h-20 w-full rounded-xl" />

          {/* Filters and Results skeleton */}
          <section className="space-y-6">
            {/* Filters bar skeleton */}
            <Skeleton className="h-14 w-full rounded-xl" />

            {/* Results count bar skeleton */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>

            {/* Loading animation in the middle of the grid */}
            <div className="relative">
              {/* Question cards grid skeleton - top row */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                {Array.from({ length: 6 }, (_, i) => i).map((i) => (
                  <div
                    key={`question-${i}`}
                    className="rounded-xl border border-border bg-surface/50 p-4 space-y-3"
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

              {/* Center loading indicator */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Outer ring */}
                  <div className="h-24 w-24 animate-spin-slow rounded-full border-2 border-dashed border-primary/30" />
                  {/* Inner ring */}
                  <div className="absolute inset-2 h-20 w-20 animate-spin-reverse-slow rounded-full border-2 border-dotted border-secondary/40" />
                  {/* Center dot */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-primary shadow-[0_0_20px_rgba(245,158,11,0.8)]" />
                  </div>
                </div>
              </div>

              {/* Fade out bottom rows to emphasize loading center */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 opacity-30 blur-[1px]">
                {Array.from({ length: 12 }, (_, i) => i).map((i) => (
                  <div
                    key={`question-blur-${i}`}
                    className="rounded-xl border border-border bg-surface/50 p-4 space-y-3"
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

            {/* Pagination skeleton */}
            <div className="flex justify-center gap-2">
              {Array.from({ length: 7 }, (_, i) => i).map((i) => (
                <Skeleton key={`page-${i}`} className="h-9 w-9 rounded-md" />
              ))}
            </div>
          </section>
        </div>
      </Container>
    </main>
  );
}
