import { NextResponse } from 'next/server';
import { createDodoClient, getDodoProductId } from '@/lib/payments/dodo-client';
import {
  type DodoWebhookStore,
  processDodoWebhook,
  setClerkPlan,
} from '@/lib/payments/process-webhook';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/service-role';

export async function POST(request: Request): Promise<Response> {
  if (!process.env.DODO_PAYMENTS_WEBHOOK_KEY) {
    return NextResponse.json({ error: 'Webhook key is not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const webhookId = request.headers.get('webhook-id');
  const headers = {
    'webhook-id': webhookId ?? '',
    'webhook-signature': request.headers.get('webhook-signature') ?? '',
    'webhook-timestamp': request.headers.get('webhook-timestamp') ?? '',
  };

  let event: { type: string; data: Record<string, unknown> };
  try {
    const dodo = createDodoClient();
    const unwrapped = dodo.webhooks.unwrap(rawBody, { headers });
    event = {
      type: unwrapped.type,
      data: unwrapped.data as unknown as Record<string, unknown>,
    };
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  if (!webhookId) {
    return NextResponse.json({ error: 'Missing webhook-id' }, { status: 400 });
  }

  try {
    const writer = createServiceRoleSupabaseClient();
    const { data: alreadyProcessed } = await writer
      .from('dodo_webhook_events')
      .select('webhook_id')
      .eq('webhook_id', webhookId)
      .maybeSingle();

    if (alreadyProcessed) {
      return NextResponse.json({ received: true });
    }

    const result = await processDodoWebhook(event, createWebhookStore(writer), getDodoProductId());

    if (result.status === 200) {
      const { error } = await writer.from('dodo_webhook_events').insert({ webhook_id: webhookId });
      if (error && error.code !== '23505') {
        console.error('Failed to record webhook id', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    console.error('Failed to apply Dodo webhook', {
      eventType: event.type,
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function createWebhookStore(
  writer: ReturnType<typeof createServiceRoleSupabaseClient>,
): DodoWebhookStore {
  return {
    async findCheckoutBySessionId(sessionId) {
      const { data } = await writer
        .from('dodo_checkouts')
        .select('user_id, product_id')
        .eq('checkout_session_id', sessionId)
        .maybeSingle();
      return data;
    },
    async findCheckoutByUserId(userId) {
      const { data } = await writer
        .from('dodo_checkouts')
        .select('user_id, product_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      return data;
    },
    setUserPlan: setClerkPlan,
  };
}
