# Free Trial System - Implementation Plan

## Context

The pricing page promises a "14-day free trial" on paid plans, but **zero trial logic exists**. The database columns (`trial_start`, `trial_end`, `'trialing'` status enum) are scaffolded but never populated. Users who click "Start Free Trial" just create a free-tier account. This plan implements the full trial lifecycle: activation, enforcement, expiry, emails, and UI.

## Key Decisions

- **Activation**: User selects a paid tier (Starter/Pro/Agency) and clicks "Start Free Trial" from the Profile page. One trial per user, ever.
- **Enforcement**: `getUserTierLimits()` updated to recognize `'trialing'` status so users get paid-tier features during trial.
- **Expiry**: A worker polls every 5 minutes. Expired trials auto-downgrade to free. 3-day warning email sent beforehand.
- **Emails**: Auto-sent (no admin intervention). CRM triggers also fired for admin visibility.
- **No Stripe yet**: Trial doesn't collect payment. "Upgrade" CTA links to existing Profile page (Stripe is a separate future effort).

---

## Implementation Order

### 1. Database Migration (`server/src/db/migrations/066_add_trial_support.sql`)

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_warning_sent BOOLEAN DEFAULT FALSE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_trialing
  ON subscriptions(status, trial_end) WHERE status = 'trialing';
```

- `has_used_trial` on users prevents re-trial (survives subscription changes)
- `trial_warning_sent` prevents duplicate 3-day warning emails on each poll cycle
- Partial index for efficient expiry queries

### 2. Email Template Seeds (`server/src/db/migrations/067_seed_trial_email_templates.sql`)

Three templates following the existing pattern from migration 054:

| Slug | Category | When Sent |
|------|----------|-----------|
| `trial_started` | onboarding | Immediately on trial activation |
| `trial_expiring` | upgrade | 3 days before trial ends |
| `trial_expired` | upgrade | When trial expires and user is downgraded |

Variables: `firstName`, `tierName`, `trialEndDate`, `featureHighlight1-3` (started only), `appUrl`

### 3. CRM Trigger Types (`server/src/services/crm-trigger.service.ts`)

Add to `TriggerType` union (line 15): `'trial_started' | 'trial_expiring' | 'trial_expired'`

No new `checkTriggers` cases needed — the trial service calls `fireTrigger()` directly (same pattern as `checkStalledVerifications()`).

### 4. Trial Service (NEW: `server/src/services/trial.service.ts`)

Two main functions:

**`startTrial(userId, tier)`** — Activation:
- Validates tier is starter/pro/agency
- Checks `has_used_trial` flag (409 if already used)
- Checks for existing active/trialing paid subscription (409 if exists)
- Creates or updates user-level subscription with `status='trialing'`, `trial_end = NOW() + 14 days`
- Sets `has_used_trial = true`
- Sends `trial_started` email via `sendTemplate()`
- Fires `trial_started` CRM trigger

**`checkTrialExpiry()`** — Called by worker every 5 min:
- **Warnings**: Finds trialing subs where `trial_end <= NOW() + 3 days` and `trial_warning_sent = false`. Sends `trial_expiring` email, sets flag, fires trigger.
- **Expiry**: Finds trialing subs where `trial_end < NOW()`. Captures original tier, downgrades to `tier='free', status='active'`. Sends `trial_expired` email, fires trigger.

### 5. Fix `getUserTierLimits()` (`server/src/services/site.service.ts:334-360`)

**Critical change**: Replace `s.status = 'active'` with `s.status IN ('active', 'trialing')` in all three COALESCE branches. Without this, trialing users get free-tier limits.

### 6. Fix `GET /api/subscription` (`server/src/routes/index.ts:118-142`)

Replace hardcoded `status: 'active'` with actual subscription data from DB. Add `trialStart`, `trialEnd`, `daysRemaining` (computed) to the response. Query the subscriptions table for `status IN ('active', 'trialing')`.

### 7. Trial Activation Endpoint (`server/src/routes/index.ts`)

`POST /api/subscription/start-trial` — authenticated, requires verified email:
- Body: `{ tier: 'starter' | 'pro' | 'agency' }`
- Calls `startTrial(userId, tier)`
- Returns 200 with subscription details or 409 with error

### 8. Trial Worker (NEW: `server/src/services/queue/trial-worker.service.ts`)

Follows the identical pattern as `campaign-worker.service.ts`:
- `createTrialWorker({ pool })` returns `{ start(), stop() }`
- Polls every 5 minutes via `setTimeout`
- Calls `checkTrialExpiry()`

Integrate in `server/src/worker.ts`:
- Import and create alongside campaign worker
- Add to `Promise.all([worker.start(), campaignWorker.start(), trialWorker.start()])`
- Add to all shutdown/error handlers (lines 276, 291, 302, 313)

### 9. Frontend Type Updates (`client/src/types/site.types.ts`)

Add `daysRemaining: number | null` to the `Subscription` interface (trialStart/trialEnd already exist).

### 10. Frontend API Client (`client/src/services/api.ts`)

Add to `userApi`:
```typescript
startTrial: (tier: 'starter' | 'pro' | 'agency') =>
  api.post('/subscription/start-trial', { tier })
```

### 11. Trial Banner in DashboardLayout (`client/src/components/layout/DashboardLayout.tsx`)

Add below the email verification banner (line 29), following the same pattern:
- Shows when `subscription.status === 'trialing'`
- Displays days remaining with upgrade CTA
- Color shifts: indigo (>3 days) → amber (<=3 days) → red (expired)
- Uses `Clock` icon + `ArrowRight` for CTA link to `/settings/profile`

### 12. Sidebar Trial Badge (`client/src/components/layout/Sidebar.tsx`)

Below the existing tier badge, show `Trial: Xd left` in small amber text when trialing.

### 13. Profile Page Updates (`client/src/pages/settings/Profile.tsx`)

- Show trial status badge and days remaining in the subscription header
- Change `handleSelectPlan()` to call `userApi.startTrial(tier)` instead of showing the TODO toast
- Button text: "Start Free Trial" for plans above current tier (when trial not yet used)

### 14. Pricing Page CTA Update (`client/src/pages/public/Pricing.tsx`)

Update `ctaLink` for paid plans to `/register?trial=starter` etc., so the intent is preserved through registration. Post-registration, the Profile page handles trial activation.

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| User already has org-level paid sub | User-level trial takes COALESCE priority; after expiry falls through to org sub |
| User tries trial twice | Blocked by `has_used_trial` check, returns 409 |
| Trial expires mid-audit | Queued audit completes normally; user can't start new ones beyond free limits |
| Worker crashes mid-expiry | `checkTrialExpiry()` is idempotent; next poll picks up remaining |
| Duplicate warning emails | `trial_warning_sent` flag prevents re-sends |
| User upgrades during trial | Future Stripe integration changes status to 'active' with paid tier |

---

## Critical Files Summary

| File | Change |
|------|--------|
| `server/src/db/migrations/066_add_trial_support.sql` | NEW — has_used_trial, trial_warning_sent, index |
| `server/src/db/migrations/067_seed_trial_email_templates.sql` | NEW — 3 email templates |
| `server/src/services/trial.service.ts` | NEW — all trial logic |
| `server/src/services/queue/trial-worker.service.ts` | NEW — expiry polling worker |
| `server/src/services/site.service.ts` | FIX — trialing status in getUserTierLimits() |
| `server/src/services/crm-trigger.service.ts` | ADD — 3 trigger types |
| `server/src/routes/index.ts` | FIX — subscription endpoint + ADD trial endpoint |
| `server/src/worker.ts` | ADD — trial worker integration |
| `client/src/types/site.types.ts` | ADD — daysRemaining field |
| `client/src/services/api.ts` | ADD — startTrial API call |
| `client/src/components/layout/DashboardLayout.tsx` | ADD — trial banner |
| `client/src/components/layout/Sidebar.tsx` | ADD — trial badge |
| `client/src/pages/settings/Profile.tsx` | UPDATE — trial status + start trial CTA |
| `client/src/pages/public/Pricing.tsx` | UPDATE — CTA links with trial tier param |

## Verification

1. Run migrations: `psql -f 066_add_trial_support.sql && psql -f 067_seed_trial_email_templates.sql`
2. Start server + worker, verify trial worker logs "Trial worker started"
3. Register a new user, verify email, go to Profile → click "Start Free Trial" on Pro
4. Check: subscription status shows 'trialing', tier shows 'pro', 14 days remaining ----- <--- test
5. Check: trial banner appears in dashboard with indigo styling
6. Check: sidebar shows "Trial: 14d left"
7. Check Mailpit: trial_started email received
8. Manually set `trial_end = NOW() + INTERVAL '2 days'` in DB → restart worker → check Mailpit for trial_expiring email
9. Manually set `trial_end = NOW() - INTERVAL '1 hour'` → restart worker → check subscription reverted to free, trial_expired email sent
10. Try starting trial again → should get 409 "already used"
