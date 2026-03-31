import { Skeleton } from '@/components/ui/skeleton';

export default function QuestionDetailLoading() {
  return (
    <main className="min-h-screen bg-void overflow-x-hidden pt-12">
      {/* Decorative ambient background placeholder */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none -z-10" />

      {/* IDE skeleton — fixed height to match actual page */}
      <div className="h-[calc(100vh-3rem)] flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
          {/* Left panel - Question prompt */}
          <div className="flex-1 rounded-xl border border-border bg-surface/50 p-6 space-y-4 overflow-hidden">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            
            {/* Code block skeleton */}
            <div className="rounded-lg bg-muted/50 p-4 font-mono text-sm">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>

            {/* Options skeleton */}
            <div className="space-y-3 pt-4">
              {Array.from({ length: 4 }, (_, i) => i).map((i) => (
                <div key={`option-${i}`} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Right panel - Code playground / visualization */}
          <div className="flex-1 rounded-xl border border-border bg-surface/50 p-4 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
            
            {/* Editor skeleton */}
            <Skeleton className="flex-1 w-full rounded-lg bg-muted/50" />
            
            {/* Terminal/Output skeleton */}
            <Skeleton className="h-32 w-full rounded-lg bg-muted/50" />
          </div>
        </div>
      </div>

      {/* Related questions section skeleton */}
      <div className="relative border-t border-border-subtle bg-surface/30 backdrop-blur-sm">
        <Container>
          <section className="pt-12 pb-24 max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-48" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => i).map((i) => (
                <div key={`related-${i}`} className="rounded-xl border border-border bg-surface/50 p-4 space-y-3">
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
      </div>
    </main>
  );
}

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6">{children}</div>;
}
