/**
 * Stripe Service — Checkout, Portal, and Webhook helpers
 */

import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY not set — Stripe features will be unavailable');
}
const stripe = stripeKey
  ? new Stripe(stripeKey, { apiVersion: '2026-02-25.clover' })
  : null;

// Tier → Stripe Price ID (env vars)
export const TIER_PRICE_MAP: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
  pro: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
  agency: process.env.STRIPE_PRICE_AGENCY_MONTHLY || '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
};

// Reverse lookup: Price ID → tier name
export function getTierForPriceId(priceId: string): string | null {
  for (const [tier, id] of Object.entries(TIER_PRICE_MAP)) {
    if (id === priceId) return tier;
  }
  return null;
}

function requireStripe(): Stripe {
  if (!stripe) throw new Error('Stripe is not configured — set STRIPE_SECRET_KEY');
  return stripe;
}

interface CheckoutOptions {
  userId: string;
  tier: string;
  customerId?: string;
  customerEmail: string;
  discountPercent?: number;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(opts: CheckoutOptions): Promise<Stripe.Checkout.Session> {
  const priceId = TIER_PRICE_MAP[opts.tier];
  if (!priceId) throw new Error(`No price ID configured for tier: ${opts.tier}`);

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    subscription_data: {
      metadata: { user_id: opts.userId },
    },
    metadata: { user_id: opts.userId },
  };

  // Attach existing customer or set email for new customer creation
  if (opts.customerId) {
    params.customer = opts.customerId;
  } else {
    params.customer_email = opts.customerEmail;
  }

  // Early access discount
  if (opts.discountPercent && opts.discountPercent > 0 && process.env.STRIPE_COUPON_EARLY_ACCESS) {
    params.discounts = [{ coupon: process.env.STRIPE_COUPON_EARLY_ACCESS }];
  }

  return requireStripe().checkout.sessions.create(params);
}

export async function createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
  return requireStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  return requireStripe().webhooks.constructEvent(rawBody, signature, secret);
}
