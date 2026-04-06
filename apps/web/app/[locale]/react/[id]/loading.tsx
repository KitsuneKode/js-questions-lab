import { Skeleton } from '@/components/ui/skeleton';

export default function ReactQuestionLoading() {
  return (
    <main className="min-h-screen overflow-hidden bg-void pt-24">
      <div className="h-[calc(100vh-6rem)] min-h-[620px] overflow-hidden">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border/60 bg-surface/60 px-4 py-3">
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-elevated/60 p-1">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-7 w-16" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
            <div className="flex h-1/2 flex-col border-b border-border/60 lg:h-auto lg:w-1/2 lg:border-r lg:border-b-0">
              <div className="flex items-center border-b border-border/60 bg-surface/70">
                <Skeleton className="h-9 w-24 rounded-none" />
                <Skeleton className="h-9 w-24 rounded-none" />
                <Skeleton className="h-9 w-24 rounded-none" />
              </div>
              <div className="flex-1 bg-[#111113] p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4 bg-white/10" />
                  <Skeleton className="h-4 w-2/3 bg-white/10" />
                  <Skeleton className="h-4 w-4/5 bg-white/10" />
                  <Skeleton className="h-4 w-1/2 bg-white/10" />
                  <Skeleton className="h-4 w-2/5 bg-white/10" />
                </div>
              </div>
            </div>

            <div className="flex h-1/2 flex-col lg:h-auto lg:w-1/2">
              <div className="flex-1 border-b border-border/60 bg-white p-4">
                <Skeleton className="h-full w-full bg-black/5" />
              </div>
              <div className="h-40 bg-black/70 p-3">
                <Skeleton className="h-4 w-32 bg-white/10" />
                <Skeleton className="mt-3 h-3 w-4/5 bg-white/5" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-border/60 bg-surface/60 px-4 py-3">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
      </div>
    </main>
  );
}
