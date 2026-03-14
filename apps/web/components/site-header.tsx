import Link from 'next/link';
import { Sparkles, Library, BadgeCheck, LayoutDashboard } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { AuthControls } from '@/components/auth-controls';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group inline-flex items-center gap-2 no-underline">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-display text-lg text-foreground sm:text-xl">JS Interview Atlas</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/questions" className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm no-underline text-muted-foreground hover:bg-muted hover:text-foreground">
            <Library className="h-4 w-4" />
            Questions
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm no-underline text-muted-foreground hover:bg-muted hover:text-foreground">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/credits" className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm no-underline text-muted-foreground hover:bg-muted hover:text-foreground">
            <BadgeCheck className="h-4 w-4" />
            Credits
          </Link>
          <AuthControls />
          <Badge className="hidden sm:inline-flex">v1</Badge>
        </nav>
      </div>
    </header>
  );
}
