export function HeroSkeleton() {
  return (
    <section className="relative min-h-[70vh] flex flex-col justify-center py-20 animate-pulse">
      <div className="h-4 w-32 rounded bg-muted mb-6" />
      <div className="h-16 w-full max-w-3xl rounded bg-muted mb-4" />
      <div className="h-16 w-full max-w-2xl rounded bg-muted mb-8" />
      <div className="h-5 w-full max-w-xl rounded bg-muted/70 mb-10" />
      <div className="flex gap-4">
        <div className="h-11 w-36 rounded-md bg-muted" />
        <div className="h-11 w-36 rounded-md bg-muted/70" />
      </div>
    </section>
  );
}
