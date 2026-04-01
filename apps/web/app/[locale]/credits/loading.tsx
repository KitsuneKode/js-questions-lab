import { Container } from '@/components/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function CreditsLoading() {
  return (
    <main className="bg-void min-h-screen pt-24 pb-20 md:pt-32">
      <Container>
        {/* Hero card skeleton */}
        <section className="relative overflow-hidden rounded-[32px] border border-border-subtle bg-surface/80 px-6 py-10 shadow-[0_32px_80px_rgba(0,0,0,0.28)] md:px-12 md:py-14">
          <Skeleton className="h-3 w-32 mb-5" />
          <Skeleton className="h-14 w-full max-w-4xl mb-6 md:h-20" />
          <Skeleton className="h-5 w-full max-w-3xl mb-3" />
          <Skeleton className="h-5 w-3/4 max-w-3xl mb-4" />
          <Skeleton className="h-4 w-full max-w-3xl mb-8" />

          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-9 w-36 rounded-full" />
            <Skeleton className="h-9 w-32 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </section>

        {/* Why / What I Added section skeleton */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="flex flex-col rounded-[28px] border border-border-subtle bg-surface/75 p-8 shadow-[0_18px_56px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-3/4 mt-6 mb-4" />
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-5/6" />
          </article>

          <article className="flex flex-col rounded-[28px] border border-border-subtle bg-surface/75 p-8 shadow-[0_18px_56px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-3 w-20" />
            </div>
            <ul className="mt-6 flex-1 space-y-3">
              {Array.from({ length: 4 }, (_, i) => i).map((i) => (
                <li key={`addition-${i}`} className="flex items-start gap-3">
                  <Skeleton className="h-5 w-5 rounded-full shrink-0 mt-0.5" />
                  <Skeleton className="h-4 w-full" />
                </li>
              ))}
            </ul>
          </article>
        </section>

        {/* Source Integrity section skeleton */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <article className="flex flex-col rounded-[28px] border border-border-subtle bg-surface/75 p-8 shadow-[0_18px_56px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-full mt-6 mb-3" />
            <Skeleton className="h-4 w-5/6 mb-3" />
            <Skeleton className="h-4 w-full mb-3" />
            <div className="mt-auto pt-6 flex flex-wrap gap-3">
              <Skeleton className="h-9 w-32 rounded-full" />
              <Skeleton className="h-9 w-32 rounded-full" />
            </div>
          </article>

          <article className="flex flex-col rounded-[28px] border border-border-subtle bg-surface/75 p-8 shadow-[0_18px_56px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => i).map((i) => (
                <div
                  key={`stat-${i}`}
                  className="rounded-[18px] border border-border/50 bg-elevated/40 p-4"
                >
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
            <Skeleton className="mt-3 rounded-[18px] border border-border/50 bg-elevated/40 h-16" />
          </article>
        </section>

        {/* Supported Languages section skeleton */}
        <section className="mt-6 rounded-[28px] border border-border-subtle bg-surface/75 p-8 shadow-[0_18px_56px_rgba(0,0,0,0.22)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Skeleton className="h-3 w-28 mb-4" />
              <Skeleton className="h-8 w-64 mb-3" />
              <Skeleton className="h-4 w-full max-w-2xl" />
            </div>
            <Skeleton className="h-8 w-32" />
          </div>

          {/* Pilot locales skeleton */}
          <ul className="mt-8 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => i).map((i) => (
              <li key={`locale-${i}`}>
                <div className="flex h-full items-center justify-between gap-4 rounded-[18px] border border-border/50 bg-elevated/40 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
              </li>
            ))}
          </ul>

          {/* Upstream translations skeleton */}
          <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => i).map((i) => (
              <li
                key={`translation-${i}`}
                className="rounded-[18px] border border-border/50 bg-elevated/40 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </main>
  );
}
