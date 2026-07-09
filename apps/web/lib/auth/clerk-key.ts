/**
 * Shared Clerk publishable-key validation (safe for middleware + client).
 * Placeholder / REPLACE keys disable Clerk so guest-first local/CI can run.
 */
export function isValidClerkKey(key?: string): boolean {
  if (!key) return false;
  return (
    key.startsWith('pk_') && !key.includes('REPLACE') && !key.toLowerCase().includes('placeholder')
  );
}

export function isClerkEnabled(publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  return isValidClerkKey(publishableKey);
}
