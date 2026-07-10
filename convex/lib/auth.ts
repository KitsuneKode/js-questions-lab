import type { MutationCtx, QueryCtx } from '../_generated/server';

export interface AuthenticatedIdentity {
  userId: string;
}

export async function requireIdentity(ctx: QueryCtx | MutationCtx): Promise<AuthenticatedIdentity> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Not authenticated');
  }

  return { userId: identity.subject };
}
