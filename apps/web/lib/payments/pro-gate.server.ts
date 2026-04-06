import { auth } from '@clerk/nextjs/server';

/**
 * Returns `true` when the authenticated server-side user has the Pro plan.
 * Must be called inside a Server Component, Server Action, or Route Handler.
 */
export async function requiresPro(): Promise<boolean> {
  const { sessionClaims } = await auth();
  const metadata = sessionClaims?.metadata as { plan?: string } | undefined;
  return metadata?.plan === 'pro';
}
