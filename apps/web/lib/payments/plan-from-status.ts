export type Plan = 'pro' | 'free';

const PRO_STATUSES = new Set(['active', 'past_due']);
const PAUSED_STATUSES = new Set(['on_hold', 'paused', 'failed', 'expired', 'pending']);

/**
 * Map a Dodo subscription status onto Clerk `publicMetadata.plan`.
 * Cancelled stays Pro until `endsAt` (usually `next_billing_date`).
 */
export function planFromStatus(
  status: string | undefined,
  endsAt: string | null,
  now = Date.now(),
): Plan {
  if (!status) return 'free';
  if (PRO_STATUSES.has(status)) return 'pro';
  if (status === 'cancelled' && endsAt && Date.parse(endsAt) > now) return 'pro';
  if (PAUSED_STATUSES.has(status)) return 'free';
  return 'free';
}

export function endsAtFromSubscription(data: Record<string, unknown>): string | null {
  if (typeof data.next_billing_date === 'string' && data.next_billing_date.length > 0) {
    return data.next_billing_date;
  }
  if (typeof data.past_due_ends_at === 'string' && data.past_due_ends_at.length > 0) {
    return data.past_due_ends_at;
  }
  return null;
}

export function extractProductId(data: Record<string, unknown>): string | null {
  if (typeof data.product_id === 'string' && data.product_id.length > 0) {
    return data.product_id;
  }

  const cart = data.product_cart;
  if (Array.isArray(cart) && cart[0] && typeof cart[0] === 'object') {
    const productId = (cart[0] as { product_id?: unknown }).product_id;
    if (typeof productId === 'string' && productId.length > 0) return productId;
  }

  return null;
}

export function extractCheckoutSessionId(data: Record<string, unknown>): string | null {
  if (typeof data.checkout_session_id === 'string' && data.checkout_session_id.length > 0) {
    return data.checkout_session_id;
  }
  return null;
}

export function extractMetadataUserId(data: Record<string, unknown>): string | null {
  const metadata = data.metadata;
  if (!metadata || typeof metadata !== 'object') return null;
  const userId = (metadata as { user_id?: unknown }).user_id;
  return typeof userId === 'string' && userId.length > 0 ? userId : null;
}

export function isSubscriptionEvent(type: string): boolean {
  return type.startsWith('subscription.');
}
