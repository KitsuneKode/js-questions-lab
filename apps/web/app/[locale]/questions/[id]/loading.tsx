import { Skeleton } from '@/components/ui/skeleton';

export default function QuestionDetailLoading() {
  return (
    <main className="min-h-screen bg-void overflow-x-hidden pt-12">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none -z-10" />

      <div className="h-[calc(100vh-3rem)] flex flex-col overflow-hidden">
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
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
        </div>

        {/* Two-panel layout — left: code editor, right: answer options */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel (~40%) — question prompt + Monaco editor + console */}
          <div className="w-[40%] flex flex-col overflow-hidden border-r border-border/40 p-6 space-y-5">
            <Skeleton className="h-7 w-4/5" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            {/* Code editor block — dark background to match Monaco */}
            <div
              className="rounded-xl border border-border/30 bg-[#1e1e1e] overflow-hidden"
              style={{ height: '22rem' }}
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
                <Skeleton className="h-3 w-24 bg-white/10" />
                <Skeleton className="h-5 w-16 rounded bg-white/10" />
              </div>
              <div className="p-4 space-y-2.5">
                <Skeleton className="h-3.5 w-3/4 bg-white/10" />
                <Skeleton className="h-3.5 w-1/2 bg-white/10" />
                <Skeleton className="h-3.5 w-2/3 bg-white/10" />
                <Skeleton className="h-3.5 w-2/5 bg-white/10" />
                <Skeleton className="h-3.5 w-1/2 bg-white/10" />
              </div>
            </div>

            {/* Console bar */}
            <div className="rounded-xl border border-border/30 bg-[#1e1e1e] overflow-hidden flex-1 min-h-[5rem]">
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/40" />
                </div>
                <Skeleton className="h-3 w-16 bg-white/10" />
              </div>
            </div>
          </div>

          {/* Right panel (~60%) — answer options */}
          <div className="flex-1 flex flex-col overflow-hidden p-8 space-y-6">
            <Skeleton className="h-4 w-28 uppercase" />

            <div className="space-y-3">
              {(['A', 'B', 'C', 'D'] as const).map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-4 rounded-xl border border-border/50 bg-surface/30 p-4"
                >
                  <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
