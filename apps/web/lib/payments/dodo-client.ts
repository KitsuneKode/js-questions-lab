import 'server-only';
import DodoPayments from 'dodopayments';

export function getDodoEnvironment(): 'test_mode' | 'live_mode' {
  return process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' ? 'live_mode' : 'test_mode';
}

export function createDodoClient(): DodoPayments {
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
  if (!bearerToken) {
    throw new Error('DODO_PAYMENTS_API_KEY is not set');
  }

  return new DodoPayments({
    bearerToken,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? null,
    environment: getDodoEnvironment(),
  });
}

export function getDodoProductId(): string {
  const productId = process.env.DODO_PAYMENTS_PRODUCT_ID;
  if (!productId) {
    throw new Error('DODO_PAYMENTS_PRODUCT_ID is not set');
  }
  return productId;
}
