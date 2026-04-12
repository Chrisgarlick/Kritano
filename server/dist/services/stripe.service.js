"use strict";
/**
 * Stripe Service — Checkout, Portal, and Webhook helpers
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIER_PRICE_MAP = void 0;
exports.getTierForPriceId = getTierForPriceId;
exports.createCheckoutSession = createCheckoutSession;
exports.createPortalSession = createPortalSession;
exports.constructWebhookEvent = constructWebhookEvent;
const stripe_1 = __importDefault(require("stripe"));
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
    console.warn('⚠️  STRIPE_SECRET_KEY not set — Stripe features will be unavailable');
}
const stripe = stripeKey
    ? new stripe_1.default(stripeKey, { apiVersion: '2026-02-25.clover' })
    : null;
// Tier → Stripe Price ID (env vars)
exports.TIER_PRICE_MAP = {
    starter: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
    pro: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    agency: process.env.STRIPE_PRICE_AGENCY_MONTHLY || '',
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
};
// Reverse lookup: Price ID → tier name
function getTierForPriceId(priceId) {
    for (const [tier, id] of Object.entries(exports.TIER_PRICE_MAP)) {
        if (id === priceId)
            return tier;
    }
    return null;
}
function requireStripe() {
    if (!stripe)
        throw new Error('Stripe is not configured — set STRIPE_SECRET_KEY');
    return stripe;
}
async function createCheckoutSession(opts) {
    const priceId = exports.TIER_PRICE_MAP[opts.tier];
    if (!priceId)
        throw new Error(`No price ID configured for tier: ${opts.tier}`);
    const params = {
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
    }
    else {
        params.customer_email = opts.customerEmail;
    }
    // Early access discount
    if (opts.discountPercent && opts.discountPercent > 0 && process.env.STRIPE_COUPON_EARLY_ACCESS) {
        params.discounts = [{ coupon: process.env.STRIPE_COUPON_EARLY_ACCESS }];
    }
    return requireStripe().checkout.sessions.create(params);
}
async function createPortalSession(customerId, returnUrl) {
    return requireStripe().billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });
}
function constructWebhookEvent(rawBody, signature) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
    return requireStripe().webhooks.constructEvent(rawBody, signature, secret);
}
//# sourceMappingURL=stripe.service.js.map