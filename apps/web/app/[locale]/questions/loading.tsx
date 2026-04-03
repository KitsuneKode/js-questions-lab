import { Container } from '@/components/container';
import { QuestionsLibrarySectionSkeleton } from '@/components/questions-library-section-skeleton';
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

          <QuestionsLibrarySectionSkeleton />
        </div>
      </Container>
    </main>
  );
}
