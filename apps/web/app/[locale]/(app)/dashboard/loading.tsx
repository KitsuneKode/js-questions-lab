import { Container } from '@/components/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  const statSkeletonIds = ['stats-1', 'stats-2', 'stats-3', 'stats-4'];

  return (
    <main className="pt-32 pb-16 md:pt-40">
      <Container>
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <header className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <Skeleton className="h-4 w-24 rounded-sm" />
            </div>
            <Skeleton className="h-14 w-3/4 max-w-lg" />
            <Skeleton className="h-6 w-full max-w-2xl" />
          </header>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statSkeletonIds.map((id) => (
              <Skeleton key={id} className="h-28" />
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </Container>
    </main>
  );
}
