import { auth, clerkClient } from '@clerk/nextjs/server';

function isClerkConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) return false;
  return (
    key.startsWith('pk_') && !key.includes('REPLACE') && !key.toLowerCase().includes('placeholder')
  );
}

/**
 * Best-effort display name for the signed-in viewer.
 * Used for the sticky "you" row on the leaderboard — not for other users.
 */
export async function getViewerDisplayName(): Promise<string | null> {
  if (!isClerkConfigured()) return null;

  try {
    const { userId } = await auth();
    if (!userId) return null;

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    if (user.firstName) {
      return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
    }
    if (user.username) return user.username;

    const email = user.primaryEmailAddress?.emailAddress;
    if (email) return email.split('@')[0] ?? null;

    return null;
  } catch (error) {
    console.error('Failed to resolve viewer display name:', error);
    return null;
  }
}
