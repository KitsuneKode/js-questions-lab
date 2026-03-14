'use client';

import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { Show, UserButton } from '@clerk/nextjs';
import { clerkEnabled } from '@/lib/auth-utils';

export function AuthControls() {
  if (!clerkEnabled) return null;

  return (
    <>
      <Show when="signed-in" fallback={
        <Link href="/sign-in" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm no-underline text-muted-foreground hover:bg-muted hover:text-foreground">
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Sign In</span>
        </Link>
      }>
        <UserButton />
      </Show>
    </>
  );
}
