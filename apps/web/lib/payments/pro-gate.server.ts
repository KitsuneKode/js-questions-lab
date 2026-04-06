import { auth, clerkClient } from '@clerk/nextjs/server';

/**
 * Returns `true` when the authenticated server-side user has the Pro plan.
 * Must be called inside a Server Component, Server Action, or Route Handler.
 */
export async function requiresPro(): Promise<boolean> {
  const { sessionClaims, userId } = await auth();
  if (!userId) return false;

  // Fast-path when a custom Clerk session token claim is configured.
  const claimMetadata = sessionClaims?.metadata as { plan?: string } | undefined;
  if (claimMetadata?.plan) {
    return claimMetadata.plan === 'pro';
  }

  // Fallback: fetch canonical user metadata from Clerk.
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const plan = user.publicMetadata?.plan;
  return plan === 'pro';
}
