import { Container } from '@/components/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReactLibraryLoading() {
  return (
    <main className="pt-32 pb-16 md:pt-40">
      <Container>
        <section className="space-y-8">
          <header className="space-y-4">
            <Skeleton className="h-6 w-36 rounded-full" />
            <Skeleton className="h-14 w-[min(780px,95%)]" />
            <Skeleton className="h-5 w-[min(640px,90%)]" />
          </header>

          <div className="space-y-10">
            {[0, 1].map((section) => (
              <section key={section} className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[0, 1, 2, 3, 4, 5].map((card) => (
                    <div
                      key={`${section}-${card}`}
                      className="rounded-xl border border-border-subtle bg-surface/50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Skeleton className="h-4 w-14 rounded-full" />
                        <Skeleton className="h-4 w-20 rounded-full" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
