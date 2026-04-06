'use server';

import { createCheckout, lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

function initLemonSqueezy() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error('LEMONSQUEEZY_API_KEY is not set');
  }
  lemonSqueezySetup({ apiKey });
}

/**
 * Creates a Lemon Squeezy checkout session for the Pro monthly plan.
 * Passes userId as custom data so the webhook can match the user.
 *
 * @returns The hosted checkout URL to redirect the user to.
 */
export async function createProCheckout(
  userId: string,
  userEmail: string,
): Promise<{ checkoutUrl: string }> {
  if (!userEmail) {
    throw new Error('User primary email is required for checkout');
  }

  initLemonSqueezy();

  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;

  if (!storeId || !variantId) {
    throw new Error('LEMONSQUEEZY_STORE_ID or LEMONSQUEEZY_VARIANT_ID is not set');
  }

  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: userEmail,
      custom: {
        user_id: userId,
      },
    },
    productOptions: {
      redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/dashboard?upgraded=1`,
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
