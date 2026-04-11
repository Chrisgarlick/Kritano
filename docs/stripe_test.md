# Stripe Testing Plan - Live Server

## Overview

Test the full Stripe subscription flow on the live production server using Stripe's **test mode** keys, restricted to only your admin account and a dedicated test user. No real payments, no risk of random visitors subscribing.

## Key Principle

Stripe has two completely separate environments: **test mode** and **live mode**. They use different API keys, different webhook secrets, and different customer/subscription data. You can safely run test mode on a live server -- test keys will never charge real money.

---

## Setup

### Step 1: Use Stripe Test Mode Keys

In your production `server/.env`, temporarily swap to test keys:

```ini
# LIVE keys (comment out during testing)
# STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
# STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
# STRIPE_WEBHOOK_SECRET=whsec_live_xxxxxxxxxxxx

# TEST keys (uncomment during testing)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxxxxxxxxx
```

Get these from: Stripe Dashboard > toggle "Test mode" (top right) > Developers > API keys

### Step 2: Create Test Mode Products & Prices

In Stripe **test mode** dashboard:

1. Go to Products > Add product for each tier:
   - **Starter**: $19/mo recurring
   - **Pro**: $49/mo recurring
   - **Agency**: $99/mo recurring
   - **Enterprise**: $199/mo recurring

2. Copy each price ID (`price_test_xxxx`) into your `.env`:

```ini
STRIPE_PRICE_STARTER_MONTHLY=price_test_xxxxxxxxxxxx
STRIPE_PRICE_PRO_MONTHLY=price_test_xxxxxxxxxxxx
STRIPE_PRICE_AGENCY_MONTHLY=price_test_xxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_test_xxxxxxxxxxxx
```

### Step 3: Create Test Mode Webhook

In Stripe test mode dashboard:

1. Developers > Webhooks > Add endpoint
2. URL: `https://kritano.com/api/webhooks/stripe`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

### Step 4: Restrict Access (CRITICAL)

The checkout route already requires authentication (`authenticate` middleware), so unauthenticated visitors can't hit it. But to be extra safe during testing, add a server-side guard so only your accounts can trigger checkout.

**Add to `server/.env`:**

```ini
# Comma-separated list of email addresses allowed to test Stripe checkout
STRIPE_TEST_EMAILS=cgarlick94@gmail.com,owenlambert@hotmail.co.uk
```

**Modify the checkout route** in `server/src/routes/index.ts` (the `POST /subscription/checkout` handler):

```typescript
// At the top of the handler, after getting userId:
const testEmails = process.env.STRIPE_TEST_EMAILS;
if (testEmails) {
  const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
  const userEmail = userResult.rows[0]?.email;
  const allowed = testEmails.split(',').map(e => e.trim().toLowerCase());
  if (!allowed.includes(userEmail?.toLowerCase())) {
    res.status(403).json({ error: 'Subscription checkout is not yet available.' });
    return;
  }
}
```

When `STRIPE_TEST_EMAILS` is set, only those accounts can initiate checkout. When you go live, simply remove the env var and restart -- the guard disappears.

### Step 5: Restart the Server

```bash
pm2 restart all
```

---

## Pricing-to-Checkout Flow (Needs Building)

The current flow has too much friction -- user signs up, verifies email, logs in, then has to manually find the upgrade button. We need two seamless flows:

### Flow A: Paid Plan (Pricing > Register > Checkout > App)

```
Pricing page (/test-pricing)
  -> Click "Get Started" on Starter/Pro/Agency
  -> Register page (/register?plan=starter)
  -> User creates account, verifies email
  -> On first login, detect ?plan= param stored during registration
  -> Auto-redirect to Stripe checkout for that plan
  -> After payment, land on /app/dashboard with paid tier active
```

**Implementation:**

1. **Pricing page**: Each tier button links to `/register?plan=starter` (or pro/agency)
2. **Register page**: Store the `plan` param in the user record or localStorage
3. **Registration handler (backend)**: Save `pending_plan` on the user row (new column) or in a `registration_meta` JSONB column
4. **Post-login redirect (frontend)**: In `LoginForm.tsx` / `AuthContext`, after successful login:
   - Check if user has a `pending_plan` (via `/auth/me` response or separate endpoint)
   - If yes, auto-trigger `POST /subscription/checkout` with that plan
   - Redirect to Stripe checkout URL
   - After checkout success, clear `pending_plan`
   - If no, redirect to `/app/dashboard` as normal
5. **Webhook handler**: On `checkout.session.completed`, clear the `pending_plan` column

### Flow B: Free Trial (Pricing > Register > App > Pay Later)

```
Pricing page (/test-pricing)
  -> Click "Start Free Trial" on Starter
  -> Register page (/register?trial=starter)
  -> User creates account, verifies email
  -> On first login, auto-create trialing subscription for that tier
  -> Land on /app/dashboard with trial active
  -> After trial expires, prompt to add payment method via Stripe portal
```

**Implementation:**

1. **Pricing page**: Free trial button links to `/register?trial=starter`
2. **Register page**: Store `trial` param same as above
3. **Post-registration (backend)**: When `pending_trial` is set, create subscription with `status = 'trialing'` and `trial_end = NOW() + 14 days` (or whatever trial length)
4. **Post-login redirect**: No Stripe redirect needed -- user goes straight to `/app/dashboard`
5. **Trial expiry handling**: Existing `customer.subscription.updated` webhook handles trial-to-active transition. If no payment method, subscription gets cancelled and user drops to free.
6. **In-app prompt**: When trial is active, show a banner: "Your trial ends in X days. Add a payment method to keep your plan." Links to Stripe portal.

### Test Pricing Page (/test-pricing)

For testing, create a hidden test pricing page that:
- Is NOT linked from the public nav
- Has `noindex` meta tag
- Only accessible if you know the URL
- Mirrors the real pricing page but routes through the test flow
- Protected by `STRIPE_TEST_EMAILS` guard on the backend checkout route

This page is temporary -- when Stripe goes live, the real `/pricing` page replaces it.

### Database Changes

```sql
-- Add pending plan tracking to users table
ALTER TABLE users ADD COLUMN pending_plan VARCHAR(20);
-- Values: NULL (no pending), 'starter', 'pro', 'agency', 'enterprise'
-- Cleared after successful checkout or if user dismisses
```

### Files to Create/Modify

| File | Change |
|---|---|
| `server/src/db/migrations/107_pending_plan.sql` | Add `pending_plan` column |
| `server/src/routes/auth/index.ts` | Save `plan`/`trial` param during registration |
| `server/src/routes/auth/index.ts` | Return `pending_plan` in `/auth/me` response |
| `server/src/routes/webhooks/stripe.ts` | Clear `pending_plan` on checkout complete |
| `client/src/types/auth.types.ts` | Add `pendingPlan` to User type |
| `client/src/components/auth/LoginForm.tsx` | Post-login: check pending_plan, redirect to checkout |
| `client/src/pages/public/Pricing.tsx` | Update tier buttons to link with `?plan=` param |
| `client/src/pages/auth/Register.tsx` | Capture and display selected plan |
| `client/src/pages/test/TestPricing.tsx` | New hidden test pricing page |
| `client/src/App.tsx` | Add `/test-pricing` route |

---

## Test Cases

### Test 1: Pricing > Register > Checkout > App (Paid Plan)

1. Go to `/test-pricing` (not logged in)
2. Click "Get Started" on **Starter**
3. Register a new account (or use test account)
4. Verify email
5. Log in
6. Should auto-redirect to Stripe checkout for Starter
7. Use test card `4242 4242 4242 4242`, complete payment
8. Land on `/app/dashboard`

**Expected:**
- [ ] Registration captures `pending_plan = 'starter'`
- [ ] After login, immediately redirected to Stripe checkout (no manual navigation)
- [ ] After payment, `pending_plan` cleared
- [ ] Subscription in DB: `tier = 'starter'`, `status = 'active'`
- [ ] Dashboard shows Starter tier badge

### Test 2: Pricing > Register > Free Trial > App

1. Go to `/test-pricing`
2. Click "Start Free Trial" on **Starter**
3. Register a new account
4. Verify email
5. Log in
6. Should land directly on `/app/dashboard` with trial active

**Expected:**
- [ ] No Stripe checkout redirect
- [ ] Subscription in DB: `tier = 'starter'`, `status = 'trialing'`, `trial_end` set
- [ ] Dashboard shows "Trial: Xd left" badge
- [ ] Trial expiry banner visible

### Test 3: Free Trial Expiry > Payment Required

1. After Test 2, manually set `trial_end = NOW() - INTERVAL '1 day'` in DB
2. Trigger Stripe's trial-end webhook (or simulate)

**Expected:**
- [ ] Subscription status changes to `past_due` or `canceled`
- [ ] User sees prompt to add payment method
- [ ] If no payment added, tier drops to `free`

### Test 4: Successful In-App Upgrade (Existing User)

1. Log in as `cgarlick94@gmail.com`
2. Go to `/app/settings/profile`
3. Click upgrade to **Starter** tier
4. On the Stripe checkout page, use test card: `4242 4242 4242 4242`
   - Any future expiry (e.g. 12/30)
   - Any CVC (e.g. 123)
   - Any name/postcode
5. Complete checkout

**Expected:**
- [ ] Redirected to `/app/settings/profile?checkout=success`
- [ ] Subscription in DB updated: `tier = 'starter'`, `status = 'active'`
- [ ] `stripe_customer_id` and `stripe_subscription_id` populated
- [ ] Webhook log shows `checkout.session.completed` and `customer.subscription.created`
- [ ] UI shows Starter tier badge

### Test 5: Declined Card

1. Attempt checkout with test card: `4000 0000 0000 0002` (always declines)

**Expected:**
- [ ] Stripe shows "Your card was declined" message
- [ ] No subscription created in DB
- [ ] No webhook events fired

### Test 6: Requires Authentication (3D Secure)

1. Use test card: `4000 0027 6000 3184` (triggers 3DS)
2. Complete the 3DS authentication challenge

**Expected:**
- [ ] 3DS modal appears on Stripe checkout
- [ ] After authenticating, subscription is created
- [ ] Webhook flow works normally

### Test 7: Subscription Upgrade

1. With active Starter subscription, click upgrade to **Pro**
2. Complete checkout

**Expected:**
- [ ] Old subscription updated (or new one created)
- [ ] Tier changes to `pro` in DB
- [ ] `customer.subscription.updated` webhook received

### Test 8: Cancel Subscription

1. Go to Settings > click "Manage Billing"
2. In Stripe portal, cancel the subscription

**Expected:**
- [ ] `customer.subscription.updated` webhook with `cancel_at_period_end = true`
- [ ] At period end: `customer.subscription.deleted` webhook fires
- [ ] DB updates: tier reverts to `free`, Stripe IDs cleared

### Test 9: Payment Failure

1. In Stripe test dashboard, find the test customer
2. Update their default payment method to `4000 0000 0000 0341` (attaches but fails on charge)
3. Trigger a manual invoice or wait for next billing cycle

**Expected:**
- [ ] `invoice.payment_failed` webhook fires
- [ ] Subscription status set to `past_due` in DB
- [ ] Dunning email sent to user

### Test 10: Payment Recovery

1. After test 6, update the customer's card back to `4242 4242 4242 4242`
2. Retry the failed invoice in Stripe dashboard

**Expected:**
- [ ] `invoice.paid` webhook fires
- [ ] Subscription status reverts to `active`

### Test 11: Early Access Discount

1. Set `discount_percent = 50` on your test user in the DB
2. Create a Stripe test mode coupon (50% off forever) and set `STRIPE_COUPON_EARLY_ACCESS` in `.env`
3. Go through checkout

**Expected:**
- [ ] Checkout page shows 50% discount applied
- [ ] Subscription created at discounted price
- [ ] Coupon visible in Stripe dashboard on the customer

### Test 12: Portal Access

1. With an active subscription, click "Manage Billing"

**Expected:**
- [ ] Redirected to Stripe billing portal
- [ ] Can view invoices, update payment method, cancel
- [ ] Return URL goes back to `/app/settings/profile`

### Test 13: Non-Allowed User Blocked

1. Log in as a different user (not in `STRIPE_TEST_EMAILS`)
2. Try to access checkout

**Expected:**
- [ ] Returns 403: "Subscription checkout is not yet available."
- [ ] No Stripe session created

---

## Stripe Test Card Reference

| Card Number | Scenario |
|---|---|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 0002` | Declined |
| `4000 0027 6000 3184` | Requires 3D Secure |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 0341` | Attaches but fails on charge |
| `4000 0000 0000 3220` | 3DS required on all transactions |

Full list: https://docs.stripe.com/testing#cards

---

## Going Live Checklist

When testing is complete and you're ready for real payments:

1. [ ] Swap `.env` back to **live** Stripe keys (`sk_live_`, `pk_live_`)
2. [ ] Create live products/prices in Stripe (matching test ones)
3. [ ] Update `STRIPE_PRICE_*` env vars to live price IDs
4. [ ] Create live webhook endpoint in Stripe dashboard
5. [ ] Update `STRIPE_WEBHOOK_SECRET` to live signing secret
6. [ ] Remove `STRIPE_TEST_EMAILS` from `.env` (removes the access guard)
7. [ ] If using early access coupon, create it in live mode and set `STRIPE_COUPON_EARLY_ACCESS`
8. [ ] Restart: `pm2 restart all`
9. [ ] Do one real $19 purchase with your own card to verify end-to-end
10. [ ] Refund yourself in Stripe dashboard after confirming

---

## Webhook Debugging

If webhooks aren't arriving:

```bash
# Check PM2 logs for webhook events
pm2 logs kritano-api --lines 50 | grep -i stripe

# Verify webhook endpoint is reachable
curl -X POST https://kritano.com/api/webhooks/stripe -d '{}' -H 'Content-Type: application/json'
# Should return 400 "Missing stripe-signature header" (meaning it's reachable)

# In Stripe dashboard: Developers > Webhooks > click your endpoint > Recent events
# Shows delivery status and response codes
```

For local testing with Stripe CLI:
```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
# Copy the webhook signing secret it prints and use that in .env
```
