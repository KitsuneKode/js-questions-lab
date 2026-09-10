import { Skeleton } from '@/components/ui/skeleton';

export default function ReactQuestionLoading() {
  return (
    <main className="min-h-dvh bg-void overflow-hidden pt-26">
      <div className="h-[calc(100dvh-6.5rem)] min-h-[640px] overflow-hidden">
        <div className="relative flex h-full flex-col overflow-hidden bg-void text-foreground">
          <div className="shrink-0 flex flex-wrap items-center gap-3 border-b border-border/50 bg-background px-4 py-2 lg:px-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <div className="ml-auto flex gap-1">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </div>

          <div className="flex flex-1 min-h-0 divide-x divide-border/30">
            <div className="hidden lg:flex w-[20%] flex-col border-r border-border/40 bg-code">
              <Skeleton className="h-8 w-full rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4 bg-white/10" />
                <Skeleton className="h-4 w-2/3 bg-white/10" />
                <Skeleton className="h-4 w-4/5 bg-white/10" />
              </div>
            </div>

            <div className="flex w-full lg:w-[35%] flex-col bg-code">
              <Skeleton className="h-8 w-full rounded-none" />
              <div className="flex-1 space-y-2 p-4">
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-5/6 bg-white/10" />
                <Skeleton className="h-4 w-4/6 bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
              </div>
            </div>

            <div className="hidden lg:flex w-[45%] flex-col bg-code">
              <Skeleton className="h-8 w-full rounded-none" />
              <div className="flex-1 bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
