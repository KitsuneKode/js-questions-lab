'use client';

import { useUser } from '@clerk/nextjs';

/**
 * Returns `true` when the signed-in user has the Pro plan.
 * Safe to call in guest mode — returns `false` when Clerk is not available
 * or the user is not signed in.
 */
export function useIsPro(): boolean {
  const { user } = useUser();
  return (user?.publicMetadata as { plan?: string } | undefined)?.plan === 'pro';
}
