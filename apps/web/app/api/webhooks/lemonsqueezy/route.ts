import { clerkClient } from '@clerk/nextjs/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LsWebhookMeta {
  event_name: string;
  custom_data?: {
    user_id?: string;
  };
}

interface LsWebhookPayload {
  meta: LsWebhookMeta;
  data?: {
    attributes?: {
      status?: string;
    };
  };
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

async function verifySignature(rawBody: string, signature: string): Promise<boolean> {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('LEMONSQUEEZY_WEBHOOK_SECRET is not set');
    return false;
  }

  const hmac = createHmac('sha256', secret);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');

  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Plan helpers
// ---------------------------------------------------------------------------

async function setUserPlan(userId: string, plan: 'pro' | 'free'): Promise<void> {
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { plan },
  });
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get('x-signature') ?? '';

  const isValid = await verifySignature(rawBody, signature);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: LsWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LsWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  const userId = payload.meta?.custom_data?.user_id;

  if (!userId) {
    // No user to update — acknowledge and move on
    return NextResponse.json({ received: true });
  }

  try {
    switch (eventName) {
      case 'subscription_created':
        await setUserPlan(userId, 'pro');
        break;

      case 'subscription_cancelled':
      case 'subscription_expired':
        await setUserPlan(userId, 'free');
        break;

      default:
        // Unhandled event — acknowledge without action
        break;
    }
  } catch (err) {
    console.error(`Failed to update plan for user ${userId} on event ${eventName}:`, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
