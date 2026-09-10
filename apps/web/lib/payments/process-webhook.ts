import { clerkClient } from '@clerk/nextjs/server';
import {
  endsAtFromSubscription,
  extractCheckoutSessionId,
  extractMetadataUserId,
  extractProductId,
  isSubscriptionEvent,
  planFromStatus,
} from '@/lib/payments/plan-from-status';

export interface CheckoutRow {
  user_id: string;
  product_id: string;
}

export interface DodoWebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

export interface DodoWebhookStore {
  findCheckoutBySessionId: (sessionId: string) => Promise<CheckoutRow | null>;
  findCheckoutByUserId: (userId: string) => Promise<CheckoutRow | null>;
  setUserPlan: (userId: string, plan: 'pro' | 'free') => Promise<void>;
}

export type WebhookResult =
  | { status: 200; body: { received: true } }
  | { status: 400; body: { error: string } }
  | { status: 500; body: { error: string } };

export async function processDodoWebhook(
  event: DodoWebhookEvent,
  store: DodoWebhookStore,
  expectedProductId: string,
  now = Date.now(),
): Promise<WebhookResult> {
  if (!isSubscriptionEvent(event.type) && event.type !== 'payment.succeeded') {
    return { status: 200, body: { received: true } };
  }

  const productId = extractProductId(event.data);
  if (productId !== expectedProductId) {
    return { status: 400, body: { error: 'Product mismatch' } };
  }

  const userId = await resolveWebhookUser(event.data, store);
  if (!userId) {
    return { status: 500, body: { error: 'Unknown checkout' } };
  }

  if (!isSubscriptionEvent(event.type)) {
    return { status: 200, body: { received: true } };
  }

  const status = typeof event.data.status === 'string' ? event.data.status : undefined;
  const plan = planFromStatus(status, endsAtFromSubscription(event.data), now);
  await store.setUserPlan(userId, plan);
  return { status: 200, body: { received: true } };
}

export async function resolveWebhookUser(
  data: Record<string, unknown>,
  store: Pick<DodoWebhookStore, 'findCheckoutBySessionId' | 'findCheckoutByUserId'>,
): Promise<string | null> {
  const checkoutSessionId = extractCheckoutSessionId(data);
  const metadataUserId = extractMetadataUserId(data);

  if (checkoutSessionId) {
    const row = await store.findCheckoutBySessionId(checkoutSessionId);
    if (!row) return null;
    if (metadataUserId && metadataUserId !== row.user_id) return null;
    return row.user_id;
  }

  if (!metadataUserId) return null;

  const row = await store.findCheckoutByUserId(metadataUserId);
  return row ? row.user_id : null;
}

export async function setClerkPlan(userId: string, plan: 'pro' | 'free'): Promise<void> {
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { plan },
  });
}
