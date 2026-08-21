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

/**
 * Fail-closed guard for production builds.
 *
 * A missing/placeholder key legitimately disables Clerk locally and in CI
 * (guest-first e2e), but in production it would silently remove dashboard
 * route protection. Refuse to boot the auth boundary in that case.
 *
 * Escape hatch: CI and local prod-mode builds run with placeholder keys by
 * design, so they must set CLERK_ALLOW_PLACEHOLDER_KEY=true explicitly.
 *
 * Note: NEXT_PUBLIC_* vars are inlined at build time — production images must
 * be built with the real key present (build-time invariant, not runtime).
 */
export function assertClerkKeySafeForEnvironment(
  nodeEnv = process.env.NODE_ENV,
  publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  allowPlaceholder = process.env.CLERK_ALLOW_PLACEHOLDER_KEY,
): void {
  if (isValidClerkKey(publishableKey)) return;
  if (nodeEnv !== 'production') return;
  if (allowPlaceholder === 'true') return;
  throw new Error(
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing or a placeholder in a production build. Refusing to disable auth middleware; build with a real publishable key or set CLERK_ALLOW_PLACEHOLDER_KEY=true for CI/local prod-mode runs.',
  );
}
