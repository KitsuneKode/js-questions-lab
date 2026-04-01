import { Container } from '@/components/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="bg-void min-h-screen">
      <Container>
        {/* Hero section skeleton */}
        <section className="py-24 max-w-6xl mx-auto px-4">
          <Skeleton className="h-16 w-80 mb-4" />
          <Skeleton className="h-6 w-64 mb-12" />
          <Skeleton className="h-12 w-96 mb-4" />
          <Skeleton className="h-6 w-72 mb-8" />
          <div className="flex gap-3 mb-16">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </section>

        {/* Continue learning skeleton */}
        <section className="py-12 max-w-6xl mx-auto px-4 border-t border-border">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => i).map((i) => (
              <Skeleton key={`continue-${i}`} className="h-24" />
            ))}
          </div>
        </section>

        {/* Features section skeleton */}
        <section className="py-24 max-w-6xl mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => i).map((i) => (
              <div key={`feature-${i}`} className="space-y-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </section>

        {/* Featured questions skeleton */}
        <section className="py-24 max-w-6xl mx-auto px-4 border-t border-border">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => i).map((i) => (
              <div
                key={`featured-${i}`}
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
        </section>
      </Container>
    </main>
  );
}
