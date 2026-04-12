"use strict";
/**
 * Stripe Webhook Handler
 *
 * Processes subscription lifecycle events from Stripe.
 * Signature-verified, returns 200 to Stripe even on app errors.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeStripeWebhooks = initializeStripeWebhooks;
const express_1 = require("express");
const stripe_service_js_1 = require("../../services/stripe.service.js");
const email_service_js_1 = require("../../services/email.service.js");
function initializeStripeWebhooks(pool) {
    const router = (0, express_1.Router)();
    router.post('/', async (req, res) => {
        let event;
        try {
            const rawBody = req.body;
            const signature = req.headers['stripe-signature'];
            if (!signature) {
                res.status(400).json({ error: 'Missing stripe-signature header' });
                return;
            }
            event = (0, stripe_service_js_1.constructWebhookEvent)(rawBody, signature);
        }
        catch (err) {
            console.error('Stripe webhook signature verification failed:', err);
            res.status(400).json({ error: 'Invalid signature' });
            return;
        }
        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    await handleCheckoutCompleted(pool, event.data.object);
                    break;
                case 'customer.subscription.created':
                case 'customer.subscription.updated':
                    await handleSubscriptionUpdated(pool, event.data.object);
                    break;
                case 'customer.subscription.deleted':
                    await handleSubscriptionDeleted(pool, event.data.object);
                    break;
                case 'invoice.payment_failed':
                    await handlePaymentFailed(pool, event.data.object);
                    break;
                case 'invoice.paid':
                    await handleInvoicePaid(pool, event.data.object);
                    break;
                default:
                    // Unhandled event type — acknowledge it
                    break;
            }
        }
        catch (err) {
            // Log but still return 200 to prevent Stripe retries for non-transient failures
            console.error(`Stripe webhook handler error for ${event.type}:`, err);
        }
        res.json({ received: true });
    });
    return router;
}
/**
 * checkout.session.completed
 * Store stripe_customer_id + stripe_subscription_id on the subscription row.
 */
async function handleCheckoutCompleted(pool, session) {
    const userId = session.metadata?.user_id;
    if (!userId) {
        console.warn('checkout.session.completed: no user_id in metadata');
        return;
    }
    const stripeCustomerId = session.customer;
    const stripeSubscriptionId = session.subscription;
    if (!stripeCustomerId || !stripeSubscriptionId)
        return;
    await pool.query(`UPDATE subscriptions
     SET stripe_customer_id = $1,
         stripe_subscription_id = $2,
         updated_at = NOW()
     WHERE user_id = $3
       AND status IN ('active', 'trialing')
     ORDER BY created_at DESC
     LIMIT 1`, [stripeCustomerId, stripeSubscriptionId, userId]);
    console.log(`checkout.session.completed: linked user ${userId} → customer ${stripeCustomerId}`);
}
/**
 * customer.subscription.created / updated
 * Sync tier, status, price_id, period dates, cancel_at_period_end.
 */
async function handleSubscriptionUpdated(pool, subscription) {
    const userId = subscription.metadata?.user_id;
    if (!userId) {
        console.warn('subscription.updated: no user_id in metadata');
        return;
    }
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const tier = priceId ? (0, stripe_service_js_1.getTierForPriceId)(priceId) : null;
    const status = mapStripeStatus(subscription.status);
    const periodStart = subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000)
        : null;
    const periodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end || false;
    const updates = [
        'stripe_subscription_id = $1',
        'stripe_customer_id = $2',
        'status = $3',
        'updated_at = NOW()',
    ];
    const values = [
        subscription.id,
        subscription.customer,
        status,
    ];
    let paramIdx = 4;
    if (tier) {
        updates.push(`tier = $${paramIdx}`);
        values.push(tier);
        paramIdx++;
    }
    if (priceId) {
        updates.push(`stripe_price_id = $${paramIdx}`);
        values.push(priceId);
        paramIdx++;
    }
    if (periodStart) {
        updates.push(`current_period_start = $${paramIdx}`);
        values.push(periodStart);
        paramIdx++;
    }
    if (periodEnd) {
        updates.push(`current_period_end = $${paramIdx}`);
        values.push(periodEnd);
        paramIdx++;
    }
    updates.push(`cancel_at_period_end = $${paramIdx}`);
    values.push(cancelAtPeriodEnd);
    paramIdx++;
    values.push(userId);
    await pool.query(`UPDATE subscriptions
     SET ${updates.join(', ')}
     WHERE user_id = $${paramIdx}
       AND status IN ('active', 'trialing', 'past_due')
     ORDER BY created_at DESC
     LIMIT 1`, values);
    console.log(`subscription.updated: user ${userId} → tier=${tier}, status=${status}`);
}
/**
 * customer.subscription.deleted
 * Downgrade to free, clear Stripe IDs.
 */
async function handleSubscriptionDeleted(pool, subscription) {
    const userId = subscription.metadata?.user_id;
    if (!userId) {
        console.warn('subscription.deleted: no user_id in metadata');
        return;
    }
    await pool.query(`UPDATE subscriptions
     SET tier = 'free',
         status = 'active',
         stripe_subscription_id = NULL,
         stripe_price_id = NULL,
         cancel_at_period_end = false,
         current_period_start = NULL,
         current_period_end = NULL,
         updated_at = NOW()
     WHERE user_id = $1
       AND stripe_subscription_id = $2`, [userId, subscription.id]);
    console.log(`subscription.deleted: user ${userId} downgraded to free`);
}
/**
 * invoice.payment_failed
 * Set subscription status to past_due.
 */
async function handlePaymentFailed(pool, invoice) {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId)
        return;
    await pool.query(`UPDATE subscriptions
     SET status = 'past_due', updated_at = NOW()
     WHERE stripe_subscription_id = $1`, [subscriptionId]);
    console.log(`invoice.payment_failed: subscription ${subscriptionId} → past_due`);
    // Send dunning notification email
    try {
        const userResult = await pool.query(`SELECT u.email, u.first_name
       FROM users u
       JOIN subscriptions s ON s.user_id = u.id
       WHERE s.stripe_subscription_id = $1
       LIMIT 1`, [subscriptionId]);
        if (userResult.rows.length > 0) {
            const { email, first_name } = userResult.rows[0];
            await email_service_js_1.emailService.sendPaymentFailedEmail(email, first_name || 'there');
            console.log(`invoice.payment_failed: dunning email sent to ${email}`);
        }
    }
    catch (err) {
        // Don't let email failure break the webhook
        console.error('invoice.payment_failed: failed to send dunning email:', err);
    }
}
/**
 * invoice.paid
 * Re-activate if currently past_due.
 */
async function handleInvoicePaid(pool, invoice) {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId)
        return;
    await pool.query(`UPDATE subscriptions
     SET status = 'active', updated_at = NOW()
     WHERE stripe_subscription_id = $1
       AND status = 'past_due'`, [subscriptionId]);
    console.log(`invoice.paid: subscription ${subscriptionId} → active (if was past_due)`);
}
/**
 * Map Stripe subscription status to our internal statuses.
 */
function mapStripeStatus(stripeStatus) {
    switch (stripeStatus) {
        case 'active':
            return 'active';
        case 'trialing':
            return 'trialing';
        case 'past_due':
            return 'past_due';
        case 'canceled':
        case 'unpaid':
        case 'incomplete_expired':
            return 'canceled';
        case 'incomplete':
            return 'past_due';
        default:
            return 'active';
    }
}
//# sourceMappingURL=stripe.js.map