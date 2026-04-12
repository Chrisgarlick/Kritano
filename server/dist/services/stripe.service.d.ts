/**
 * Stripe Service — Checkout, Portal, and Webhook helpers
 */
import Stripe from 'stripe';
export declare const TIER_PRICE_MAP: Record<string, string>;
export declare function getTierForPriceId(priceId: string): string | null;
interface CheckoutOptions {
    userId: string;
    tier: string;
    customerId?: string;
    customerEmail: string;
    discountPercent?: number;
    successUrl: string;
    cancelUrl: string;
}
export declare function createCheckoutSession(opts: CheckoutOptions): Promise<Stripe.Checkout.Session>;
export declare function createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session>;
export declare function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event;
export {};
//# sourceMappingURL=stripe.service.d.ts.map