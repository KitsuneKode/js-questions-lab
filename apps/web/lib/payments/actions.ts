'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { createCheckout, lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

function initLemonSqueezy() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error('LEMONSQUEEZY_API_KEY is not set');
  }
  lemonSqueezySetup({ apiKey });
}

/**
 * Creates a Lemon Squeezy checkout session for the authenticated user.
 * Identity is derived server-side to prevent client-side impersonation.
 *
 * @returns The hosted checkout URL to redirect the user to.
 */
export async function createProCheckout(): Promise<{ checkoutUrl: string }> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('You must be signed in to start checkout');
  }

  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  if (!userEmail) {
    throw new Error('User primary email is required for checkout');
  }

  initLemonSqueezy();

  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!storeId || !variantId) {
    throw new Error('LEMONSQUEEZY_STORE_ID or LEMONSQUEEZY_VARIANT_ID is not set');
  }
  if (!siteUrl) {
    throw new Error('NEXT_PUBLIC_SITE_URL is not set');
  }

  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: userEmail,
      custom: {
        user_id: userId,
      },
    },
    productOptions: {
      redirectUrl: new URL('/dashboard?upgraded=1', siteUrl).toString(),
    },
  });

  if (error) {
    throw new Error(`Failed to create checkout: ${error.message}`);
  }

  const checkoutUrl = data?.data?.attributes?.url;
  if (!checkoutUrl) {
    throw new Error('No checkout URL returned from Lemon Squeezy');
  }

  return { checkoutUrl };
}
