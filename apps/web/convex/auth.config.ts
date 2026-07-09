/**
 * Clerk JWT validation for Convex.
 * Set CLERK_JWT_ISSUER_DOMAIN in the Convex dashboard (e.g. https://xxx.clerk.accounts.dev).
 *
 * @see https://docs.convex.dev/auth/clerk
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: 'convex',
    },
  ],
};
