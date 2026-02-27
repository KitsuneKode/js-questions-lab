import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <p>
          Built from Lydia Hallie&apos;s JavaScript Questions repository. Explore, run, and visualize concepts with an interactive study experience.
        </p>
        <p className="mt-2">
          Source: <Link href="https://github.com/lydiahallie/javascript-questions">github.com/lydiahallie/javascript-questions</Link>
        </p>
      </div>
    </footer>
  );
}
