'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { createDodoClient, getDodoProductId } from '@/lib/payments/dodo-client';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/service-role';

/**
 * Creates a Dodo Payments checkout session for the authenticated user.
 * Identity is taken from Clerk, never from the client.
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error('NEXT_PUBLIC_SITE_URL is not set');
  }

  const productId = getDodoProductId();
  const dodo = createDodoClient();
  const session = await dodo.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: {
      email: userEmail,
      name: user.fullName ?? user.firstName ?? 'JS Questions Lab',
    },
    return_url: new URL('/dashboard?upgraded=1', siteUrl).toString(),
    metadata: { user_id: userId },
  });

  const checkoutUrl = session.checkout_url;
  if (!checkoutUrl) {
    throw new Error('No checkout URL returned from Dodo Payments');
  }

  const writer = createServiceRoleSupabaseClient();
  const { error } = await writer.from('dodo_checkouts').insert({
    checkout_session_id: session.session_id,
    user_id: userId,
    product_id: productId,
  });

  if (error) {
    throw new Error(`Failed to record checkout: ${error.message}`);
  }

  return { checkoutUrl };
}
