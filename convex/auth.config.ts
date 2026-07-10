const clerkIssuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;

export default {
  providers: [
    {
      // Set CLERK_JWT_ISSUER_DOMAIN in the Convex dashboard (Clerk Frontend API URL).
      // Empty string until configured — `convex dev` will fail auth until this is set.
      domain: clerkIssuerDomain ?? '',
      applicationID: 'convex',
    },
  ],
};
