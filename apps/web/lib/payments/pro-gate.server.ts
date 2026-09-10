import { auth, clerkClient } from '@clerk/nextjs/server';

/**
 * Returns true when the authenticated user has an active Pro plan.
 * Always reads Clerk `users.getUser` — session claims are not a source of truth.
 */
export async function requiresPro(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const metadata = user.publicMetadata as Record<string, unknown> | undefined;
  return metadata?.plan === 'pro';
}
