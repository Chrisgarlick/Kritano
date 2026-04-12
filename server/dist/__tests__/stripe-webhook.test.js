"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockPool = {
    query: vitest_1.vi.fn().mockResolvedValue({ rows: [] }),
};
const mockConstructWebhookEvent = vitest_1.vi.fn();
const mockGetTierForPriceId = vitest_1.vi.fn();
vitest_1.vi.mock('../services/stripe.service.js', () => ({
    constructWebhookEvent: (...args) => mockConstructWebhookEvent(...args),
    getTierForPriceId: (...args) => mockGetTierForPriceId(...args),
}));
vitest_1.vi.mock('../services/email.service.js', () => ({
    emailService: {
        sendPaymentFailedEmail: vitest_1.vi.fn().mockResolvedValue(undefined),
        sendSubscriptionCancelledEmail: vitest_1.vi.fn().mockResolvedValue(undefined),
    },
}));
const stripe_js_1 = require("../routes/webhooks/stripe.js");
function createApp() {
    const app = (0, express_1.default)();
    // Stripe webhooks need raw body
    app.use('/webhooks/stripe', express_1.default.raw({ type: 'application/json' }));
    app.use('/webhooks/stripe', (0, stripe_js_1.initializeStripeWebhooks)(mockPool));
    return app;
}
(0, vitest_1.describe)('Stripe Webhook Handler', () => {
    let app;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        app = createApp();
    });
    (0, vitest_1.describe)('Signature verification', () => {
        (0, vitest_1.it)('rejects requests without stripe-signature header', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/webhooks/stripe')
                .set('Content-Type', 'application/json')
                .send('{}');
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body.error).toBe('Missing stripe-signature header');
        });
        (0, vitest_1.it)('rejects requests with invalid signature', async () => {
            mockConstructWebhookEvent.mockImplementation(() => {
                throw new Error('Invalid signature');
            });
            const res = await (0, supertest_1.default)(app)
                .post('/webhooks/stripe')
                .set('Content-Type', 'application/json')
                .set('stripe-signature', 'invalid_sig')
                .send('{}');
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body.error).toBe('Invalid signature');
        });
    });
    (0, vitest_1.describe)('checkout.session.completed', () => {
        (0, vitest_1.it)('links Stripe customer to user subscription', async () => {
            mockConstructWebhookEvent.mockReturnValue({
                type: 'checkout.session.completed',
                data: {
                    object: {
                        metadata: { user_id: 'user-123' },
                        customer: 'cus_abc',
                        subscription: 'sub_xyz',
                    },
                },
            });
            const res = await (0, supertest_1.default)(app)
                .post('/webhooks/stripe')
                .set('Content-Type', 'application/json')
                .set('stripe-signature', 'valid_sig')
                .send('{}');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toEqual({ received: true });
            (0, vitest_1.expect)(mockPool.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('UPDATE subscriptions'), ['cus_abc', 'sub_xyz', 'user-123']);
        });
        (0, vitest_1.it)('skips when no user_id in metadata', async () => {
            mockConstructWebhookEvent.mockReturnValue({
                type: 'checkout.session.completed',
                data: { object: { metadata: {}, customer: 'cus_abc', subscription: 'sub_xyz' } },
            });
            const res = await (0, supertest_1.default)(app)
                .post('/webhooks/stripe')
                .set('Content-Type', 'application/json')
                .set('stripe-signature', 'valid_sig')
                .send('{}');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(mockPool.query).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('customer.subscription.updated', () => {
        (0, vitest_1.it)('syncs tier and status from subscription', async () => {
            mockGetTierForPriceId.mockReturnValue('pro');
            mockConstructWebhookEvent.mockReturnValue({
                type: 'customer.subscription.updated',
                data: {
                    object: {
                        id: 'sub_xyz',
                        customer: 'cus_abc',
                        metadata: { user_id: 'user-123' },
                        items: { data: [{ price: { id: 'price_pro_monthly' } }] },
                        status: 'active',
                        current_period_start: 1700000000,
                        current_period_end: 1702592000,
                        cancel_at_period_end: false,
                    },
                },
            });
            const res = await (0, supertest_1.default)(app)
                .post('/webhooks/stripe')
                .set('Content-Type', 'application/json')
                .set('stripe-signature', 'valid_sig')
                .send('{}');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(mockPool.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('UPDATE subscriptions'), vitest_1.expect.arrayContaining(['sub_xyz', 'cus_abc', 'active']));
        });
    });
    (0, vitest_1.describe)('customer.subscription.deleted', () => {
        (0, vitest_1.it)('downgrades user to free tier', async () => {
            mockConstructWebhookEvent.mockReturnValue({
                type: 'customer.subscription.deleted',
                data: {
                    object: {
                        id: 'sub_xyz',
                        metadata: { user_id: 'user-123' },
                    },
                },
            });
            const res = await (0, supertest_1.default)(app)
                .post('/webhooks/stripe')
                .set('Content-Type', 'application/json')
                .set('stripe-signature', 'valid_sig')
                .send('{}');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(mockPool.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining("tier = 'free'"), ['user-123', 'sub_xyz']);
        });
    });
    (0, vitest_1.describe)('invoice.payment_failed', () => {
        (0, vitest_1.it)('sets subscription to past_due', async () => {
            mockConstructWebhookEvent.mockReturnValue({
                type: 'invoice.payment_failed',
                data: {
                    object: {
                        subscription: 'sub_xyz',
                    },
                },
            });
            const res = await (0, supertest_1.default)(app)
                .post('/webhooks/stripe')
                .set('Content-Type', 'application/json')
                .set('stripe-signature', 'valid_sig')
                .send('{}');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(mockPool.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('past_due'), vitest_1.expect.arrayContaining(['sub_xyz']));
        });
    });
    (0, vitest_1.describe)('Unhandled event types', () => {
        (0, vitest_1.it)('acknowledges unknown events gracefully', async () => {
            mockConstructWebhookEvent.mockReturnValue({
                type: 'some.unknown.event',
                data: { object: {} },
            });
            const res = await (0, supertest_1.default)(app)
                .post('/webhooks/stripe')
                .set('Content-Type', 'application/json')
                .set('stripe-signature', 'valid_sig')
                .send('{}');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toEqual({ received: true });
            (0, vitest_1.expect)(mockPool.query).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Error resilience', () => {
        (0, vitest_1.it)('returns 200 even when handler throws to prevent Stripe retries', async () => {
            mockConstructWebhookEvent.mockReturnValue({
                type: 'checkout.session.completed',
                data: {
                    object: {
                        metadata: { user_id: 'user-123' },
                        customer: 'cus_abc',
                        subscription: 'sub_xyz',
                    },
                },
            });
            mockPool.query.mockRejectedValueOnce(new Error('DB connection lost'));
            const res = await (0, supertest_1.default)(app)
                .post('/webhooks/stripe')
                .set('Content-Type', 'application/json')
                .set('stripe-signature', 'valid_sig')
                .send('{}');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toEqual({ received: true });
        });
    });
});
//# sourceMappingURL=stripe-webhook.test.js.map