import { Skeleton } from '@/components/ui/skeleton';

export default function QuestionDetailLoading() {
  return (
    <main className="min-h-screen bg-void overflow-x-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none -z-10" />

      <div className="h-[calc(100vh-3rem)] flex flex-col overflow-hidden pt-2">
        {/* Header bar — mirrors the actual IDE header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-background px-6 py-4 shrink-0">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-10 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
        </div>

        {/* Two-panel layout using ResizablePanel structure mimic */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel (~40%) — question prompt + Monaco editor + terminal */}
          <div className="w-[40%] flex flex-col border-r border-border/60">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Question title and prompt */}
              <div className="space-y-4">
                <Skeleton className="h-8 w-4/5" />
              </div>

              {/* Code editor block — matches actual responsive height */}
              <div className="flex h-[18rem] flex-col overflow-hidden rounded-xl border border-border/30 bg-[#1e1e1e] md:h-[22rem]">
                <div className="flex items-center justify-between px-3 py-1.5 bg-muted/20 border-b border-border/30">
                  <Skeleton className="h-3 w-24 bg-white/10" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-20 rounded bg-white/10" />
                    <Skeleton className="h-6 w-16 rounded bg-white/10" />
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden p-4 space-y-2.5">
                  <Skeleton className="h-3.5 w-3/4 bg-white/10" />
                  <Skeleton className="h-3.5 w-1/2 bg-white/10" />
                  <Skeleton className="h-3.5 w-2/3 bg-white/10" />
                  <Skeleton className="h-3.5 w-2/5 bg-white/10" />
                  <Skeleton className="h-3.5 w-1/2 bg-white/10" />
                </div>
              </div>

              {/* Helper text skeleton */}
              <div className="space-y-1">
                <Skeleton className="h-3 w-full bg-white/5" />
                <Skeleton className="h-3 w-3/4 bg-white/5" />
              </div>

              {/* Terminal output area — matches TerminalOutput height */}
              <div className="flex flex-col h-48 rounded-lg overflow-hidden border border-border/30 bg-black/40">
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/40" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500/40" />
                  </div>
                  <Skeleton className="h-3 w-16 bg-white/10" />
                </div>
                <div className="flex-1 p-3">
                  <Skeleton className="h-3 w-2/3 bg-white/5" />
                </div>
              </div>
            </div>
          </div>

          {/* Right panel (~60%) — answer options */}
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {/* Practice area header */}
            <div className="border-b border-border/40 bg-muted/10 py-4 px-6 shrink-0">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>

            {/* Practice content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid gap-2">
                {(['A', 'B', 'C', 'D'] as const).map((label) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 rounded-lg border border-border/40 bg-black/20 p-3"
                  >
                    <Skeleton className="h-5 w-5 rounded border shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
