/**
 * Shared auth helpers for Convex functions.
 * Requires `npx convex codegen` / `convex dev` before `_generated` imports resolve.
 *
 * Until cutover, Supabase remains the live backend — these helpers are ready for
 * Phase 1 shadow writes.
 */

export function requireUserId(identity: { subject: string } | null): string {
  if (!identity?.subject) {
    throw new Error('Not authenticated');
  }
  return identity.subject;
}
