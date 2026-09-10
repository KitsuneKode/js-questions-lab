'use client';

import { useUser } from '@clerk/nextjs';

/**
 * Returns true when the signed-in user has an active Pro plan.
 * Guests and missing Clerk state are free.
 */
export function useIsPro(): boolean {
  const { user } = useUser();
  const metadata = user?.publicMetadata as Record<string, unknown> | undefined;
  return metadata?.plan === 'pro';
}
