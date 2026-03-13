# Stripe Integration Plan

## Overview

PagePulser uses a 5-tier per-organization subscription model (Free, Starter, Pro, Agency, Enterprise). The database schema already has Stripe columns (`stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`) on the `subscriptions` table, types are defined, and tier limits are enforced via middleware and DB functions. What's missing: the Stripe SDK, checkout flow, webhook handler, and customer portal integration.

### Architecture Flow

```
User clicks "Upgrade"
  → Frontend calls POST /api/organizations/:orgId/checkout
  → Backend creates Stripe Checkout Session (server-side price lookup)
  → Backend returns Checkout Session URL
  → Frontend redirects to Stripe-hosted Checkout
  → User completes payment on Stripe
  → Stripe redirects user to /settings/profile?session_id=...
  → Stripe fires webhook → POST /api/webhooks/stripe
  → Backend verifies signature, updates subscriptions table
  → UI reflects new tier on next page load
```

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Payment form | Stripe Checkout (hosted) | Reduces PCI scope, faster to ship, Stripe handles card UI |
| Subscription management | Stripe Customer Portal | Handles upgrades, downgrades, cancellations, invoice history |
| State authority | Webhook-driven | Never trust the client; all subscription state changes flow through webhooks |
| Billing model | Per-organization | Matches existing schema — subscription belongs to organization |
| Price enforcement | Server-side only | Frontend displays prices for UX but backend resolves Stripe Price IDs (per CLAUDE.md security requirement) |
| Enterprise tier | Self-serve at $199/mo | Fixed price, same checkout flow as other tiers |
| Annual billing | Phase 2 | Launch with monthly only, add annual toggle later |

---

## 1. Stripe Dashboard Setup

### 1.1 Create Products & Prices

In the Stripe Dashboard (or via CLI), create one **Product** per paid tier, each with a **monthly recurring Price**:

| Product Name | Monthly Price | Stripe Product ID (example) | Stripe Price ID (example) |
|-------------|--------------|-------|---------|
| PagePulser Starter | £19/mo | `prod_starter_xxx` | `price_starter_monthly_xxx` |
| PagePulser Pro | £49/mo | `prod_pro_xxx` | `price_pro_monthly_xxx` |
| PagePulser Agency | £99/mo | `prod_agency_xxx` | `price_agency_monthly_xxx` |
| PagePulser Enterprise | £199/mo | `prod_enterprise_xxx` | `price_enterprise_monthly_xxx` |

Store each Price ID in environment variables (see Section 3.1).

### 1.2 Configure Customer Portal

In **Stripe Dashboard → Settings → Billing → Customer Portal**:

- Enable subscription upgrades/downgrades
- Enable cancellation (at period end)
- Enable invoice history
- Set allowed products to: Starter, Pro, Agency, Enterprise
- Set proration behavior to: `create_prorations` (charge/credit immediately)

### 1.3 Register Webhook Endpoint

In **Stripe Dashboard → Developers → Webhooks**:

- **Endpoint URL** (production): `https://app.pagepulser.com/api/webhooks/stripe`
- **Events to send**:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.paid`

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

### 1.4 Enable Payment Methods

In **Stripe Dashboard → Settings → Payment methods**, enable the following:

| Method | Notes |
|--------|-------|
| **Cards** | Enabled by default (Visa, Mastercard, Amex, etc.) |
| **Apple Pay** | Requires domain verification in Stripe Dashboard (add your live domain). Shows automatically on Safari/iOS for Checkout sessions. |
| **Google Pay** | No extra setup — shows automatically on Chrome/Android when cards are enabled. |
| **PayPal** | Enable in Payment methods → PayPal. Requires connecting a PayPal business account. Shows as an option alongside cards in Checkout. |
| **Link** | Stripe's one-click checkout. Enabled by default on Checkout. Saves card details for returning customers. |

> **No code changes required.** Because we use Stripe's hosted Checkout page, all enabled payment methods appear automatically. Apple Pay and Google Pay show only on supported devices/browsers. PayPal shows as a separate payment option.

**Apple Pay domain verification (required for production):**

1. Go to **Stripe Dashboard → Settings → Payment methods → Apple Pay**
2. Click "Add new domain"
3. Enter your production domain (e.g., `app.pagepulser.com`)
4. Download the verification file and serve it at `https://app.pagepulser.com/.well-known/apple-developer-merchantid-domain-association`
5. Click "Verify" — Apple Pay will then work on your domain

This can only be done once the app is on a live domain with HTTPS.

---

## 2. Sandbox / Test Environment

### 2.1 Test vs Live Keys

Stripe provides separate API keys for test and live modes. **Never use live keys in development.**

| Variable | Test Mode Example | Where |
|----------|-------------------|-------|
| `STRIPE_SECRET_KEY` | `sk_test_51...` | `.env` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_51...` | `.env` (passed to frontend) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | `.env` |
| `STRIPE_PRICE_STARTER_MONTHLY` | `price_1Qx...` | `.env` |
| `STRIPE_PRICE_PRO_MONTHLY` | `price_1Qy...` | `.env` |
| `STRIPE_PRICE_AGENCY_MONTHLY` | `price_1Qz...` | `.env` |
| `STRIPE_PRICE_ENTERPRISE_MONTHLY` | `price_1Qa...` | `.env` |

### 2.2 Stripe CLI for Local Webhooks

```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# The CLI prints a webhook signing secret — use it as STRIPE_WEBHOOK_SECRET locally
# Example output: whsec_1234567890abcdef...
```

### 2.3 Test Card Numbers

| Card Number | Scenario |
|------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 3220` | 3D Secure authentication required |
| `4000 0000 0000 9995` | Payment declined (insufficient funds) |
| `4000 0000 0000 0341` | Attaching card fails |

Use any future expiry date, any 3-digit CVC, any postcode.

### 2.4 Docker Compose Environment

Add to `docker-compose.yml` under the server service's `environment`:

```yaml
STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
STRIPE_PUBLISHABLE_KEY: ${STRIPE_PUBLISHABLE_KEY}
STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
STRIPE_PRICE_STARTER_MONTHLY: ${STRIPE_PRICE_STARTER_MONTHLY}
STRIPE_PRICE_PRO_MONTHLY: ${STRIPE_PRICE_PRO_MONTHLY}
STRIPE_PRICE_AGENCY_MONTHLY: ${STRIPE_PRICE_AGENCY_MONTHLY}
STRIPE_PRICE_ENTERPRISE_MONTHLY: ${STRIPE_PRICE_ENTERPRISE_MONTHLY}
```

### 2.5 Simulating Subscription Lifecycle

```bash
# Trigger a specific event for testing
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
stripe trigger invoice.paid

# Or use the Stripe Dashboard test clocks for advanced lifecycle testing
# (Settings → Test Clocks → create a clock → advance time)
```

---

## 3. Backend Implementation

### 3.1 Install Stripe SDK

```bash
cd server
npm install stripe
```

### 3.2 New File: `server/src/services/stripe.service.ts`

Core Stripe SDK wrapper — all Stripe API calls go through here.

```typescript
import Stripe from 'stripe';
import type { SubscriptionTier } from '../types/organization.types.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Server-side tier → price mapping (NEVER expose to frontend)
const TIER_PRICE_MAP: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
  pro: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  agency: process.env.STRIPE_PRICE_AGENCY_MONTHLY!,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
};

// Reverse lookup: Stripe price ID → tier
const PRICE_TIER_MAP: Record<string, SubscriptionTier> = Object.entries(
  TIER_PRICE_MAP
).reduce(
  (acc, [tier, priceId]) => {
    acc[priceId] = tier as SubscriptionTier;
    return acc;
  },
  {} as Record<string, SubscriptionTier>
);

/**
 * Create a Stripe Checkout Session for a new subscription.
 * The tier is validated server-side — the frontend only sends the desired tier name.
 */
export async function createCheckoutSession(params: {
  organizationId: string;
  tier: SubscriptionTier;
  customerId?: string | null;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const priceId = TIER_PRICE_MAP[params.tier];
  if (!priceId) {
    throw new Error(`No Stripe price configured for tier: ${params.tier}`);
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      organization_id: params.organizationId,
      tier: params.tier,
    },
    subscription_data: {
      metadata: {
        organization_id: params.organizationId,
        tier: params.tier,
      },
    },
  };

  // Reuse existing Stripe customer if available
  if (params.customerId) {
    sessionParams.customer = params.customerId;
  } else {
    sessionParams.customer_email = params.customerEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session.url!;
}

/**
 * Create a Stripe Customer Portal session for managing an existing subscription.
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

/**
 * Construct and verify a webhook event from the raw body and signature.
 */
export function constructWebhookEvent(
  rawBody: Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

/**
 * Look up the tier for a Stripe price ID.
 */
export function getTierForPriceId(priceId: string): SubscriptionTier | null {
  return PRICE_TIER_MAP[priceId] || null;
}

/**
 * Retrieve a Stripe subscription by ID.
 */
export async function getStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId);
}

export { stripe };
```

### 3.3 New File: `server/src/routes/webhooks/stripe.ts`

Webhook handler — raw body parsing and signature verification.

```typescript
import { Router, Request, Response } from 'express';
import express from 'express';
import Stripe from 'stripe';
import {
  constructWebhookEvent,
  getTierForPriceId,
  getStripeSubscription,
} from '../../services/stripe.service.js';
import {
  getSubscription,
} from '../../services/organization.service.js';
import { Pool } from 'pg';

let pool: Pool;

export function initializeStripeWebhooks(dbPool: Pool): Router {
  pool = dbPool;

  const router = Router();

  // CRITICAL: Use raw body parser for webhook signature verification
  router.post(
    '/',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response): Promise<void> => {
      const signature = req.headers['stripe-signature'] as string;

      let event: Stripe.Event;
      try {
        event = constructWebhookEvent(req.body, signature);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        res.status(400).json({ error: 'Invalid signature' });
        return;
      }

      try {
        await handleWebhookEvent(event);
        res.json({ received: true });
      } catch (err: any) {
        console.error('Webhook handler error:', err);
        // Return 200 to prevent Stripe from retrying on app-level errors
        // (log the error for investigation)
        res.json({ received: true, error: err.message });
      }
    }
  );

  return router;
}

async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session
      );
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(
        event.data.object as Stripe.Subscription
      );
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(
        event.data.object as Stripe.Subscription
      );
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;

    default:
      console.log(`Unhandled webhook event type: ${event.type}`);
  }
}

/**
 * checkout.session.completed
 * User completed Stripe Checkout — link Stripe customer to our organization.
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const orgId = session.metadata?.organization_id;
  if (!orgId) {
    console.error('Checkout session missing organization_id metadata');
    return;
  }

  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

  if (!customerId || !subscriptionId) return;

  // Store the Stripe customer ID on the subscription row
  await pool.query(
    `UPDATE subscriptions
     SET stripe_customer_id = $1,
         stripe_subscription_id = $2,
         updated_at = NOW()
     WHERE organization_id = $3`,
    [customerId, subscriptionId, orgId]
  );

  // The subscription.created/updated webhook will handle tier + status sync
}

/**
 * customer.subscription.created / customer.subscription.updated
 * Sync tier, status, and period dates from Stripe to our DB.
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const orgId = subscription.metadata?.organization_id;
  if (!orgId) return;

  const priceId = subscription.items.data[0]?.price?.id;
  const tier = priceId ? getTierForPriceId(priceId) : null;

  // Map Stripe status to our status enum
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    trialing: 'trialing',
    paused: 'paused',
    incomplete: 'past_due',
    incomplete_expired: 'canceled',
    unpaid: 'past_due',
  };
  const status = statusMap[subscription.status] || 'active';

  // Get max_seats for the new tier
  let includedSeats = 1;
  if (tier) {
    const limitsResult = await pool.query(
      'SELECT max_seats FROM tier_limits WHERE tier = $1',
      [tier]
    );
    includedSeats = limitsResult.rows[0]?.max_seats || 1;
  }

  await pool.query(
    `UPDATE subscriptions
     SET tier = COALESCE($1, tier),
         status = $2,
         stripe_price_id = $3,
         stripe_subscription_id = $4,
         stripe_customer_id = COALESCE($5, stripe_customer_id),
         current_period_start = to_timestamp($6),
         current_period_end = to_timestamp($7),
         cancel_at_period_end = $8,
         canceled_at = $9,
         included_seats = CASE WHEN $1 IS NOT NULL THEN $10 ELSE included_seats END,
         updated_at = NOW()
     WHERE organization_id = $11`,
    [
      tier,
      status,
      priceId || null,
      subscription.id,
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id || null,
      subscription.current_period_start,
      subscription.current_period_end,
      subscription.cancel_at_period_end,
      subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
      includedSeats,
      orgId,
    ]
  );
}

/**
 * customer.subscription.deleted
 * Subscription canceled and expired — downgrade to free.
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const orgId = subscription.metadata?.organization_id;
  if (!orgId) return;

  await pool.query(
    `UPDATE subscriptions
     SET tier = 'free',
         status = 'canceled',
         stripe_subscription_id = NULL,
         stripe_price_id = NULL,
         cancel_at_period_end = FALSE,
         canceled_at = NOW(),
         included_seats = 1,
         updated_at = NOW()
     WHERE organization_id = $1`,
    [orgId]
  );
}

/**
 * invoice.payment_failed
 * Mark subscription as past_due.
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id;
  if (!subscriptionId) return;

  await pool.query(
    `UPDATE subscriptions
     SET status = 'past_due', updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  );
}

/**
 * invoice.paid
 * Restore subscription to active after successful retry.
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id;
  if (!subscriptionId) return;

  await pool.query(
    `UPDATE subscriptions
     SET status = 'active', updated_at = NOW()
     WHERE stripe_subscription_id = $1 AND status = 'past_due'`,
    [subscriptionId]
  );
}
```

### 3.4 Modified File: `server/src/routes/organizations/index.ts`

Add two new endpoints for checkout and portal.

```typescript
// POST /api/organizations/:orgId/checkout
// Creates a Stripe Checkout Session for upgrading to a paid tier.
// Requires: billing:write permission (owner or admin)
router.post(
  '/:orgId/checkout',
  authenticate,
  requireOrgPermission('billing:write'),
  async (req: Request, res: Response): Promise<void> => {
    const { orgId } = req.params;
    const { tier } = req.body; // Only tier name, NOT price — price resolved server-side

    // Validate tier
    const allowedTiers = ['starter', 'pro', 'agency', 'enterprise'];
    if (!allowedTiers.includes(tier)) {
      res.status(400).json({ error: 'Invalid tier for checkout' });
      return;
    }

    const subscription = await getSubscription(orgId);
    if (!subscription) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const user = req.user!;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const checkoutUrl = await createCheckoutSession({
      organizationId: orgId,
      tier: tier as SubscriptionTier,
      customerId: subscription.stripe_customer_id,
      customerEmail: user.email,
      successUrl: `${process.env.CLIENT_URL}/settings/profile?checkout=success`,
      cancelUrl: `${process.env.CLIENT_URL}/settings/profile?checkout=canceled`,
    });

    res.json({ url: checkoutUrl });
  }
);

// POST /api/organizations/:orgId/portal
// Creates a Stripe Customer Portal session for managing billing.
// Requires: billing:write permission and an existing Stripe customer
router.post(
  '/:orgId/portal',
  authenticate,
  requireOrgPermission('billing:write'),
  async (req: Request, res: Response): Promise<void> => {
    const { orgId } = req.params;

    const subscription = await getSubscription(orgId);
    if (!subscription?.stripe_customer_id) {
      res.status(400).json({
        error: 'No billing account found. Please subscribe to a plan first.',
      });
      return;
    }

    const portalUrl = await createPortalSession(
      subscription.stripe_customer_id,
      `${process.env.CLIENT_URL}/settings/profile`
    );

    res.json({ url: portalUrl });
  }
);
```

### 3.5 Modified File: `server/src/services/admin-analytics.service.ts`

Replace hardcoded `TIER_PRICING` with Stripe price lookup or env-based config.

```typescript
// Replace lines 21-27 with:
const TIER_PRICING: Record<string, number> = {
  free: 0,
  starter: parseInt(process.env.TIER_PRICE_STARTER || '19', 10),
  pro: parseInt(process.env.TIER_PRICE_PRO || '49', 10),
  agency: parseInt(process.env.TIER_PRICE_AGENCY || '99', 10),
  enterprise: parseInt(process.env.TIER_PRICE_ENTERPRISE || '199', 10),
};
```

> This keeps revenue analytics working with correct prices. In a later phase, these could be fetched from Stripe's Price API at startup.

### 3.6 Modified File: `server/package.json`

```bash
npm install stripe
```

### 3.7 Raw Body Middleware

The webhook route **must** receive the raw body (Buffer) for signature verification. This means the webhook route must be registered **before** the global `express.json()` middleware, OR use a route-specific raw parser.

**Approach: Register webhook route before JSON parser in `server/src/app.ts`:**

```typescript
// BEFORE app.use(express.json())
import { initializeStripeWebhooks } from './routes/webhooks/stripe.js';
app.use('/api/webhooks/stripe', initializeStripeWebhooks(pool));

// AFTER — normal JSON parsing for all other routes
app.use(express.json());
```

---

## 4. Frontend Implementation

### 4.1 Modified File: `client/src/services/api.ts`

Add checkout and portal API calls to the existing `userApi` or a new `billingApi`:

```typescript
export const billingApi = {
  // Create a Stripe Checkout Session
  createCheckout: (orgId: string, tier: string) =>
    api.post<{ url: string }>(`/organizations/${orgId}/checkout`, { tier }),

  // Create a Stripe Customer Portal session
  createPortal: (orgId: string) =>
    api.post<{ url: string }>(`/organizations/${orgId}/portal`),
};
```

### 4.2 Modified File: `client/src/pages/settings/Profile.tsx`

Replace the `handleSelectPlan` function (currently lines 174-185):

```typescript
const handleSelectPlan = async (tier: SubscriptionTier) => {
  if (tier === currentTier) return;

  // Enterprise is now self-serve at $199/mo — same checkout flow as other paid tiers

  if (tier === 'free') {
    // Downgrade via Customer Portal (if they have a Stripe subscription)
    // or show info message
    toast(
      'To downgrade, manage your subscription in the billing portal.',
      'info'
    );
    return;
  }

  try {
    // Get the user's active organization ID
    const orgId = user.organizationId; // or from context
    const response = await billingApi.createCheckout(orgId, tier);
    // Redirect to Stripe Checkout
    window.location.href = response.data.url;
  } catch (error: any) {
    toast(
      error.response?.data?.error || 'Failed to start checkout',
      'error'
    );
  }
};
```

Add a "Manage Billing" button for users who already have a Stripe subscription:

```typescript
// In the subscription section, after the plan grid:
{subscription?.stripe_customer_id && (
  <div className="mt-4 flex justify-end">
    <Button
      variant="secondary"
      onClick={async () => {
        const response = await billingApi.createPortal(orgId);
        window.location.href = response.data.url;
      }}
    >
      Manage Billing
    </Button>
  </div>
)}
```

### 4.3 Success/Cancel Handling

When the user returns from Stripe Checkout, the URL will contain `?checkout=success` or `?checkout=canceled`. Handle this in `Profile.tsx`:

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('checkout') === 'success') {
    toast('Subscription activated! Your plan will update shortly.', 'success');
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
    // Reload subscription data (webhook may take a moment)
    setTimeout(() => loadSubscription(), 2000);
  } else if (params.get('checkout') === 'canceled') {
    toast('Checkout was canceled.', 'info');
    window.history.replaceState({}, '', window.location.pathname);
  }
}, []);
```

---

## 5. Database Changes

### 5.1 Existing Schema (No Changes Needed)

The `subscriptions` table already has all required columns:

| Column | Type | Purpose |
|--------|------|---------|
| `stripe_customer_id` | VARCHAR(50) | Links org to Stripe Customer |
| `stripe_subscription_id` | VARCHAR(50) | Links to Stripe Subscription |
| `stripe_price_id` | VARCHAR(50) | Current Stripe Price ID |
| `current_period_start` | TIMESTAMPTZ | Billing period start |
| `current_period_end` | TIMESTAMPTZ | Billing period end |
| `cancel_at_period_end` | BOOLEAN | Whether sub cancels at period end |
| `canceled_at` | TIMESTAMPTZ | When cancellation was requested |
| `trial_start` / `trial_end` | TIMESTAMPTZ | Trial period (future use) |

**Source:** `server/src/db/migrations/016_create_organizations.sql` lines 94-126.

### 5.2 Tier → Price ID Mapping

Use **environment variables** rather than a database table for mapping tiers to Stripe Price IDs. This keeps config in one place and makes test/live switching trivial.

```
STRIPE_PRICE_STARTER_MONTHLY=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_yyy
STRIPE_PRICE_AGENCY_MONTHLY=price_zzz
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_aaa
```

The reverse mapping (price ID → tier) is derived at startup in `stripe.service.ts`.

---

## 6. Webhook Events — Detailed Mapping

| Stripe Event | When It Fires | What We Do |
|-------------|---------------|------------|
| `checkout.session.completed` | User completes Checkout | Store `stripe_customer_id` and `stripe_subscription_id` on the org's subscription |
| `customer.subscription.created` | Stripe creates the subscription | Sync `tier`, `status`, `stripe_price_id`, period dates |
| `customer.subscription.updated` | Plan change, renewal, status change | Sync `tier`, `status`, `stripe_price_id`, period dates, `cancel_at_period_end` |
| `customer.subscription.deleted` | Subscription fully canceled/expired | Downgrade to `free`, clear Stripe IDs, set `status = 'canceled'` |
| `invoice.payment_failed` | Payment retry failed | Set `status = 'past_due'` |
| `invoice.paid` | Invoice successfully paid (including retries) | Set `status = 'active'` (only if currently `past_due`) |

### Idempotency

Stripe may deliver the same event multiple times. Our handlers are idempotent:
- All updates use `UPDATE ... SET` with the latest values (not increments)
- `invoice.paid` only transitions from `past_due` → `active` (no-op if already active)
- `checkout.session.completed` sets customer/subscription IDs (safe to repeat)

---

## 7. Security Considerations

### 7.1 Webhook Signature Verification

Every webhook request is verified using `stripe.webhooks.constructEvent()` with the `STRIPE_WEBHOOK_SECRET`. Requests with invalid signatures are rejected with 400.

### 7.2 Server-Side Price Enforcement

**Critical (per CLAUDE.md):** The frontend sends only the **tier name** (e.g., `"pro"`), never a price or price ID. The backend resolves the tier to a Stripe Price ID from environment variables. This prevents users from manipulating prices.

```
Frontend: POST /checkout { tier: "pro" }
Backend:  tier → STRIPE_PRICE_PRO_MONTHLY → price_yyy → Stripe Checkout Session
```

### 7.3 Raw Body Parsing

The webhook route uses `express.raw()` instead of `express.json()` because Stripe signature verification requires the raw request body. This route must be registered **before** global JSON middleware.

### 7.4 Permission Checks

- Checkout and portal endpoints require `billing:write` permission (owner or admin role)
- Regular members and viewers cannot initiate billing changes
- Existing permission system in `organization.types.ts` already defines `billing:read` and `billing:write`

### 7.5 Rate Limiting

Add rate limiting to the checkout endpoint to prevent abuse:

```typescript
// 5 checkout attempts per org per hour
rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.params.orgId,
})
```

### 7.6 Environment Variable Security

- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` must never be exposed to the frontend
- `STRIPE_PUBLISHABLE_KEY` can be sent to the frontend (it's designed to be public)
- All Stripe env vars should be in `.env` (gitignored) and set as secrets in production

---

## 8. Migration Strategy

### 8.1 Existing Free Users

**No forced migration.** Existing organizations remain on the `free` tier with no Stripe customer. A Stripe customer is created **lazily** when they first click "Upgrade" (via Checkout Session's `customer_email` field — Stripe creates the customer automatically).

### 8.2 Admin-Upgraded Users

The admin panel (`PATCH /api/admin/organizations/:orgId/subscription`) continues to work for manual tier changes. This is useful for:
- Enterprise customers with custom deals
- Support-initiated upgrades/downgrades
- Testing and debugging

Admin changes update the `tier` and `status` columns directly — they bypass Stripe entirely. This is intentional: admin overrides are a safety valve.

### 8.3 Transition Period

During the transition:
1. Deploy Stripe integration (test mode)
2. Test full checkout → webhook → tier-update flow with test cards
3. Verify admin manual overrides still work alongside Stripe
4. Switch to live keys (see Go-Live Checklist)

---

## 9. Go-Live Checklist

### Pre-Launch

- [ ] Create Stripe products and prices in **live mode**
- [ ] Configure Customer Portal in live mode
- [ ] Register production webhook endpoint (`https://app.pagepulser.com/api/webhooks/stripe`)
- [ ] Set production environment variables:
  - `STRIPE_SECRET_KEY` → live key (`sk_live_...`)
  - `STRIPE_PUBLISHABLE_KEY` → live key (`pk_live_...`)
  - `STRIPE_WEBHOOK_SECRET` → live webhook signing secret
  - `STRIPE_PRICE_STARTER_MONTHLY` → live price ID
  - `STRIPE_PRICE_PRO_MONTHLY` → live price ID
  - `STRIPE_PRICE_AGENCY_MONTHLY` → live price ID
  - `STRIPE_PRICE_ENTERPRISE_MONTHLY` → live price ID
- [ ] Update admin analytics tier pricing to match live prices
- [ ] Verify raw body middleware ordering in production

### Launch Day

- [ ] Deploy with live keys
- [ ] Complete a real test purchase with a real card (then refund)
- [ ] Verify webhook delivery in Stripe Dashboard → Developers → Webhooks → Events
- [ ] Verify subscription row updated correctly in the database
- [ ] Test upgrade flow (free → starter → pro)
- [ ] Test Customer Portal (manage billing, cancel, view invoices)
- [ ] Test failed payment handling (if possible with test clock)
- [ ] Verify Apple Pay appears on Safari/iOS
- [ ] Verify Google Pay appears on Chrome
- [ ] Verify PayPal option appears in Checkout
- [ ] Verify Link (one-click) option appears in Checkout

### Post-Launch

- [ ] Monitor webhook delivery success rate in Stripe Dashboard
- [ ] Set up Stripe email notifications for failed payments
- [ ] Add Stripe revenue to admin analytics dashboard (replace hardcoded estimates)
- [ ] Consider adding annual pricing as Phase 2

---

## 10. Critical Files Summary

| File | Action | Description |
|------|--------|-------------|
| `server/src/services/stripe.service.ts` | **NEW** | Stripe SDK wrapper, checkout sessions, portal sessions, webhook verification |
| `server/src/routes/webhooks/stripe.ts` | **NEW** | Webhook handler with raw body parsing and event routing |
| `server/src/routes/organizations/index.ts` | **MODIFY** | Add `POST /:orgId/checkout` and `POST /:orgId/portal` endpoints |
| `server/src/app.ts` (or equivalent) | **MODIFY** | Register webhook route before `express.json()` middleware |
| `server/src/services/admin-analytics.service.ts` | **MODIFY** | Replace hardcoded `TIER_PRICING` with env-based config |
| `server/package.json` | **MODIFY** | Add `stripe` dependency |
| `client/src/services/api.ts` | **MODIFY** | Add `billingApi.createCheckout()` and `billingApi.createPortal()` |
| `client/src/pages/settings/Profile.tsx` | **MODIFY** | Replace "coming soon" toast with checkout redirect, add billing portal button |
| `.env.example` | **MODIFY** | Add all Stripe environment variables |
| `docker-compose.yml` | **MODIFY** | Pass Stripe env vars to server service |

---

## 11. Implementation Order

### Phase A: Local Development (Test Mode — No Live Domain Needed)

Everything in this phase uses Stripe **test mode** keys and can be done locally.

1. **Create Stripe account** — Sign up at stripe.com, stay in test mode
2. **Stripe Dashboard: Create products & prices** (Section 1.1) — 4 products (Starter, Pro, Agency, Enterprise) with monthly recurring prices in test mode
3. **Stripe Dashboard: Configure Customer Portal** (Section 1.2) — Enable upgrades, downgrades, cancellation, invoice history
4. **Stripe Dashboard: Enable payment methods** (Section 1.4) — Enable cards, Google Pay, Link, PayPal (Apple Pay domain verification deferred to Phase B)
5. **Install Stripe CLI** (Section 2.2) — `brew install stripe/stripe-cli/stripe && stripe login`
6. **Set up env vars** (Section 2.1) — Add all `STRIPE_*` vars to `.env` using test mode keys
7. **Backend: Install Stripe SDK** — `cd server && npm install stripe`
8. **Backend: `stripe.service.ts`** (Section 3.2) — SDK wrapper, checkout sessions, portal sessions, webhook verification
9. **Backend: Webhook route** (Section 3.3) — Raw body parsing, signature verification, event routing
10. **Backend: Raw body middleware** (Section 3.7) — Register webhook route before `express.json()`
11. **Backend: Organization routes** (Section 3.4) — `POST /:orgId/checkout` and `POST /:orgId/portal`
12. **Frontend: `api.ts`** (Section 4.1) — Add `billingApi.createCheckout()` and `billingApi.createPortal()`
13. **Frontend: `Profile.tsx`** (Section 4.2-4.3) — Checkout redirect, portal button, success/cancel handling
14. **Test locally** — Start `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, run full checkout flow with test cards (Section 2.3), verify webhook events, tier updates, portal access
15. **Admin analytics** (Section 3.5) — Update hardcoded tier pricing to env-based config

### Phase B: Go Live (Requires Live Domain with HTTPS)

Only do this once the app is deployed to a production domain.

1. **Create live products & prices** — Duplicate test products in Stripe live mode with real GBP prices
2. **Register production webhook** (Section 1.3) — `https://app.pagepulser.com/api/webhooks/stripe`
3. **Apple Pay domain verification** (Section 1.4) — Add domain, serve verification file at `/.well-known/apple-developer-merchantid-domain-association`
4. **PayPal live connection** — Connect live PayPal business account in Stripe Dashboard
5. **Set production env vars** — Swap all `STRIPE_*` vars to live keys and price IDs
6. **Deploy** — Push code with live config
7. **Smoke test** — Complete a real purchase with a real card, verify webhook delivery, verify tier update, then refund
8. **Monitor** — Check Stripe Dashboard → Webhooks → Events for delivery success rate over the first few days

---

## 12. Testing Plan

### Unit Tests

- `stripe.service.ts`: Mock Stripe SDK, verify correct params passed to `checkout.sessions.create` and `billingPortal.sessions.create`
- Webhook handler: Mock events for each type, verify correct DB queries executed
- Permission checks: Verify only owner/admin can hit checkout/portal endpoints

### Integration Tests

- Full checkout flow with Stripe CLI forwarding webhooks
- Verify subscription row updates after each webhook event type
- Verify downgrade to free when subscription deleted
- Verify `past_due` status on payment failure, `active` on recovery

### Manual QA Checklist

- [ ] Free user clicks Upgrade → redirected to Stripe Checkout
- [ ] Complete payment with test card → redirected back, tier updates
- [ ] Click "Manage Billing" → Stripe Customer Portal opens
- [ ] Upgrade from Starter to Pro via portal → tier updates
- [ ] Cancel subscription → tier remains until period end, then downgrades
- [ ] Simulate payment failure → status shows `past_due`
- [ ] Admin can still manually override tier in admin panel
- [ ] Enterprise tier shows $199/mo and uses standard checkout flow

---

## Next Steps — Stripe Dashboard Setup (Phase A)

Phase A code is implemented. Follow these steps to get test keys and wire everything up.

### Step 1: Create a Stripe Account

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) and sign up (or log in)
2. Stay in **Test Mode** (toggle in the top-right)

### Step 2: Create Products & Prices

1. Go to **Product catalog → + Add product**
2. Create 4 products with monthly recurring prices:

| Product Name | Monthly Price |
|---|---|
| PagePulser Starter | £19.00 |
| PagePulser Pro | £49.00 |
| PagePulser Agency | £99.00 |
| PagePulser Enterprise | £199.00 |

3. For each product, click into it and copy the **Price ID** (starts with `price_`)

### Step 3: Get Your API Keys

1. Go to **Developers → API keys**
2. Copy the **Secret key** (`sk_test_...`) → paste into `.env` as `STRIPE_SECRET_KEY`
3. Copy the **Publishable key** (`pk_test_...`) → paste into `.env` as `STRIPE_PUBLISHABLE_KEY`

### Step 4: Add Price IDs to .env

Paste the 4 price IDs you copied in Step 2:

```
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_AGENCY_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
```

### Step 5: Configure the Customer Portal

1. Go to **Settings → Billing → Customer portal**
2. Enable:
   - Subscription cancellation (at period end)
   - Invoice history
3. Under **Products**, add all 4 PagePulser products so users can switch plans
4. Save

### Step 6: (Optional) Create Early Access Coupon

If you want founding members to get a discount:

1. Go to **Product catalog → Coupons → + Create coupon**
2. Set: 50% off, forever duration, give it a name like "Founding Member"
3. Copy the **Coupon ID** → paste into `.env` as `STRIPE_COUPON_EARLY_ACCESS`

### Step 7: Install Stripe CLI & Forward Webhooks

```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

The CLI will print a webhook signing secret (`whsec_...`) — paste it into `.env` as `STRIPE_WEBHOOK_SECRET`.

Keep this terminal open while testing.

### Step 8: Test the Flow

1. Start the server (`npm run dev`)
2. Go to Profile page, click Upgrade on a tier
3. If trial is available → trial starts (existing behaviour)
4. If trial used → redirected to Stripe Checkout
5. Pay with test card `4242 4242 4242 4242` (any future expiry, any CVC)
6. Redirected back → success toast → subscription updated in DB
7. Click "Manage Billing" → Stripe Customer Portal opens
8. Cancel in portal → webhook fires → tier reverts to free

### Test Card Numbers

| Card | Scenario |
|---|---|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 3220` | 3D Secure required |
| `4000 0000 0000 9995` | Declined (insufficient funds) |

Use any future expiry, any 3-digit CVC, any postcode.
