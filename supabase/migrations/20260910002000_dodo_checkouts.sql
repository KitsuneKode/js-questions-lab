-- Checkout-to-user mapping for Dodo Payments. Service role only; no client policies.

CREATE TABLE public.dodo_checkouts (
  checkout_session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX dodo_checkouts_user_id_idx ON public.dodo_checkouts (user_id);

CREATE TABLE public.dodo_webhook_events (
  webhook_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.dodo_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dodo_webhook_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.dodo_checkouts IS
  'Maps Dodo checkout session ids to Clerk user ids. Written at checkout create; read by the webhook.';
