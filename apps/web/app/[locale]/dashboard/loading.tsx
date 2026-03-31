import { Container } from '@/components/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  const statSkeletonIds = ['stats-1', 'stats-2', 'stats-3', 'stats-4'];

  return (
    <main className="py-8 md:py-10">
      <Container>
        <Skeleton className="mb-8 h-10 w-48" />
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
      </Container>
    </main>
  );
}
