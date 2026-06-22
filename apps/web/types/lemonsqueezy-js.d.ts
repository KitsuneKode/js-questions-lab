declare module '@lemonsqueezy/lemonsqueezy.js' {
  export function lemonSqueezySetup(config: { apiKey: string }): void;

  export interface CheckoutRequestOptions {
    checkoutData?: {
      email?: string;
      custom?: Record<string, string>;
    };
    productOptions?: {
      redirectUrl?: string;
    };
  }

  export interface CreateCheckoutResult {
    data?: {
      data?: {
        attributes?: {
          url?: string;
        };
      };
    };
    error?: {
      message: string;
    };
  }

  export function createCheckout(
    storeId: string,
    variantId: string,
    options?: CheckoutRequestOptions,
  ): Promise<CreateCheckoutResult>;
}
