import { Skeleton } from '@/components/ui/skeleton';

export default function ReactQuestionLoading() {
  return (
    <main className="min-h-screen overflow-hidden bg-void pt-20 md:pt-[5.5rem]">
      <div className="h-[calc(100svh-5rem)] min-h-[640px] overflow-hidden">
        <div className="relative flex h-full flex-col overflow-hidden bg-void text-foreground">
          <div className="border-b border-border/60 bg-surface/75 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-end lg:justify-between lg:px-6">
              <div className="space-y-3">
                <Skeleton className="h-3 w-36" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-72" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <div className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-elevated/60 p-1">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <div className="inline-flex items-center rounded-full border border-border/50 bg-background/70 p-1">
                  <Skeleton className="h-8 w-20 rounded-full" />
                  <Skeleton className="h-8 w-20 rounded-full" />
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col overflow-hidden px-3 py-3 md:px-4 md:py-4 lg:px-6">
            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-border/60 bg-surface/90 shadow-[0_32px_90px_-60px_rgba(0,0,0,1)]">
              <div className="border-b border-border/50 bg-linear-to-r from-background/96 via-surface/90 to-background/82 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-4 w-80" />
                  </div>
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
              </div>

              <div className="border-b border-border/50 bg-[#111113]">
                <div className="flex items-center overflow-x-auto">
                  <Skeleton className="h-10 w-24 rounded-none" />
                  <Skeleton className="h-10 w-24 rounded-none" />
                  <Skeleton className="h-10 w-24 rounded-none" />
                </div>
              </div>

              <div className="min-h-0 flex-1 bg-[#0d0d12] p-5">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-2/3 bg-white/10" />
                  <Skeleton className="h-4 w-3/4 bg-white/10" />
                  <Skeleton className="h-4 w-3/5 bg-white/10" />
                  <Skeleton className="h-4 w-4/5 bg-white/10" />
                  <Skeleton className="h-4 w-1/2 bg-white/10" />
                  <Skeleton className="h-4 w-3/4 bg-white/10" />
                  <Skeleton className="h-4 w-2/5 bg-white/10" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
