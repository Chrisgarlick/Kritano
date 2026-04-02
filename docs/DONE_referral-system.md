# Referral System Implementation

**Status:** Implemented
**Date:** 2026-03-06

---

## Overview

A referral system that drives organic user growth. Existing users share a unique referral link, new users sign up through it, and both parties get rewarded with bonus audits once the referred user verifies their email AND completes their first audit.

---

## How It Works

1. User gets a unique referral code (e.g. `REF-a8kd3m2x`) and shareable link
2. New user clicks link → registers with `?ref=REF-a8kd3m2x` in URL
3. Referral tracked as **pending**
4. Referred user verifies email AND completes first audit → referral **qualifies**
5. Both users get bonus audits credited automatically
6. Referrer earns more per referral based on their tier

### Reward Structure

| Referrer Tier | Bonus Audits per Referral |
|---|---|
| Free | 5 |
| Starter | 5 |
| Pro | 8 |
| Agency | 12 |
| Enterprise | 12 |

- **Referred user** always gets **3 bonus audits**
- **Milestones**: 5 qualified referrals → free month Starter; 10 → free month Pro
- Bonus audits stack and are consumed when the user exceeds their tier's monthly limit

### Anti-Abuse

- Referral only qualifies after email verification + first completed audit (prevents bots)
- Self-referral blocked (same user ID or same email)
- Max 50 referrals per user per month (configurable via `referral_config` table)
- Admin can void fraudulent referrals (reverses rewards)
- All IPs logged for fraud investigation (referrer IP from last login, referred IP from registration request)

---

## Database Changes

### Migration: `075_referral_system.sql`

**Users table additions:**

| Column | Type | Description |
|---|---|---|
| `referral_code` | `VARCHAR(20) UNIQUE` | User's unique referral code (e.g. `REF-a8kd3m2x`) |
| `referred_by_code` | `VARCHAR(20)` | The referral code used when this user signed up |
| `referred_by_user_id` | `UUID REFERENCES users(id)` | The user who referred this user |
| `referral_bonus_audits` | `INTEGER NOT NULL DEFAULT 0` | Current bonus audit balance |

**New table: `referrals`**

Tracks each individual referral relationship and its lifecycle.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID PRIMARY KEY` | Unique referral ID |
| `referrer_id` | `UUID NOT NULL REFERENCES users(id)` | The user who made the referral |
| `referred_id` | `UUID NOT NULL REFERENCES users(id)` | The user who was referred (unique constraint) |
| `referral_code` | `VARCHAR(20) NOT NULL` | The code used |
| `status` | `VARCHAR(20) NOT NULL DEFAULT 'pending'` | `pending` → `qualified` → `rewarded` → `voided` |
| `email_verified_at` | `TIMESTAMPTZ` | When referred user verified email |
| `first_audit_completed_at` | `TIMESTAMPTZ` | When referred user completed first audit |
| `qualified_at` | `TIMESTAMPTZ` | When both conditions met |
| `rewarded_at` | `TIMESTAMPTZ` | When bonus audits were credited |
| `voided_at` | `TIMESTAMPTZ` | When admin voided |
| `void_reason` | `TEXT` | Admin's reason for voiding |
| `referrer_reward_type` | `VARCHAR(30)` | e.g. `bonus_audits` |
| `referrer_reward_value` | `INTEGER` | Number of bonus audits given to referrer |
| `referred_reward_type` | `VARCHAR(30)` | e.g. `bonus_audits` |
| `referred_reward_value` | `INTEGER` | Number of bonus audits given to referred user |
| `referrer_ip` | `INET` | Referrer's IP (from last login) |
| `referred_ip` | `INET` | Referred user's IP (from registration) |
| `referrer_tier` | `VARCHAR(20)` | Referrer's tier at time of referral (determines reward amount) |
| `created_at` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | |

Indexes: `idx_referrals_referrer`, `idx_referrals_status`

**New table: `referral_rewards`**

Full audit trail / ledger of all bonus audit credits and debits.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID PRIMARY KEY` | |
| `user_id` | `UUID NOT NULL REFERENCES users(id)` | User who received/lost the credit |
| `referral_id` | `UUID REFERENCES referrals(id)` | Associated referral (null for admin adjustments) |
| `type` | `VARCHAR(30) NOT NULL` | `bonus_audits`, `tier_upgrade`, `admin_adjustment`, `consumed` |
| `amount` | `INTEGER NOT NULL` | Positive = credit, negative = consumed/reversed |
| `balance_after` | `INTEGER NOT NULL` | User's bonus audit balance after this transaction |
| `description` | `TEXT` | Human-readable description |
| `created_at` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | |

Index: `idx_referral_rewards_user`

**New table: `referral_config`**

Key-value config for the referral program (admin-editable).

| Key | Default Value | Description |
|---|---|---|
| `enabled` | `true` | Whether referral program is active |
| `max_referrals_per_month` | `50` | Per-user monthly limit |
| `rewards` | `{"referrer":{"free":5,...},"referred":3,"milestones":{"5":{"tier":"starter","days":30},"10":{"tier":"pro","days":30}}}` | Full reward configuration |

### Migration: `076_seed_referral_email_templates.sql`

Seeds 4 email templates into the existing `email_templates` table using the block-based MJML system:

| Slug | Name | When Sent | Variables |
|---|---|---|---|
| `referral_invite` | Referral Invite | User sends invite by email | `referrerName`, `referrerEmail`, `referralUrl` |
| `referral_qualified` | Referral Qualified | Referral qualifies (email verified + first audit) | `firstName`, `referredName`, `bonusAudits`, `totalBonusAudits`, `referralsUrl` |
| `referral_welcome_bonus` | Referral Welcome Bonus | Referred user gets their bonus | `firstName`, `referrerName`, `bonusAudits`, `dashboardUrl` |
| `referral_milestone` | Referral Milestone | Referrer hits 5 or 10 qualified referrals | `firstName`, `milestoneCount`, `rewardTier`, `rewardDays`, `referralsUrl` |

---

## Backend Files

### New: `server/src/types/referral.types.ts`

TypeScript interfaces:
- `Referral` — DB row for the referrals table
- `ReferralWithUser` — Referral joined with user email/name
- `ReferralStats` — User-facing dashboard stats
- `AdminReferralStats` — Admin program-wide stats (includes top referrers, conversion rate)
- `ReferralConfig` — Parsed config from referral_config table
- `ReferralReward` — DB row for referral_rewards table

### New: `server/src/services/referral.service.ts`

Core service with `setPool(dbPool)` pattern. Functions:

| Function | Description |
|---|---|
| `getConfig()` | Reads referral_config table, returns parsed `ReferralConfig` |
| `updateConfig(key, value)` | Upserts a config key |
| `getOrCreateReferralCode(userId)` | Returns existing code or generates `REF-` + 8 hex chars |
| `resolveReferralCode(code)` | Validates code, returns `{userId, email}` or null |
| `createReferral(referrerId, referredId, code, ip)` | Creates pending referral with all anti-abuse checks (self-referral, monthly limit, same email) |
| `checkAndQualifyReferral(referredUserId)` | Checks if pending referral can qualify (email verified + first completed audit), applies rewards if yes |
| `applyRewards(referralId)` | Credits both users in a transaction, updates referral to rewarded, sends emails, checks milestones |
| `consumeBonusAudit(userId)` | Decrements bonus audits by 1, logs to ledger. Returns false if none left |
| `getReferralStats(userId)` | Dashboard stats for a user |
| `getUserReferrals(userId, page, limit)` | Paginated list of user's referrals with referred user info |
| `sendInviteEmails(userId, emails)` | Sends referral_invite template to up to 5 emails. Blocks self-invite and already-registered emails |
| `adminGetStats()` | Program-wide stats: totals, conversion rate, top 10 referrers |
| `adminListReferrals(page, limit, status?, search?)` | Paginated list with referrer + referred info, filterable by status and email search |
| `adminVoidReferral(referralId, reason, adminId)` | Voids referral in a transaction, reverses bonus audits for both users (clamped to 0), logs admin_adjustment rewards |

Internal helpers:
- `generateCode()` — Generates `REF-` + 8 random hex chars
- `sendReferralEmails()` — Sends referral_qualified and referral_welcome_bonus emails
- `checkMilestones()` — Checks if referrer hit 5 or 10 qualified referrals, awards tier upgrade subscription, sends referral_milestone email

### New: `server/src/routes/referrals/index.ts`

User-facing endpoints (all require `authenticate` middleware):

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/referrals/code` | Get or generate referral code + link |
| `GET` | `/api/referrals/stats` | Dashboard stats (totals, bonus audits earned/remaining) |
| `GET` | `/api/referrals/list` | Paginated referral list (query: `page`, `limit`) |
| `POST` | `/api/referrals/invite` | Send invite emails. Body: `{ emails: string[] }` (max 5, Zod validated) |

### New: `server/src/routes/admin/referrals.ts`

Admin endpoints (protected by `authenticate` + `requireSuperAdmin`):

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/referrals/stats` | Program-wide stats with top referrers |
| `GET` | `/api/admin/referrals` | List all referrals (query: `page`, `limit`, `status`, `search`) |
| `POST` | `/api/admin/referrals/:id/void` | Void a referral + reverse rewards. Body: `{ reason: string }`. Logs admin activity |
| `GET` | `/api/admin/referrals/config` | Get referral config |
| `PATCH` | `/api/admin/referrals/config` | Update config key. Body: `{ key: 'enabled'|'max_referrals_per_month'|'rewards', value: any }`. Logs admin activity |

---

## Modified Backend Files

### `server/src/schemas/auth.schemas.ts`

Added optional `referralCode` field to `registerSchema`:
```typescript
referralCode: z.string().max(20).optional(),
```
This makes `referralCode` part of the `RegisterInput` type.

### `server/src/routes/auth/index.ts`

**Two integration points:**

1. **POST `/register`** (after user creation, after ToS recording): If `input.referralCode` is present, resolves the code to a referrer, blocks self-referral, and creates a pending referral record. Errors are caught silently — registration never fails due to referral issues.

2. **POST `/verify-email`** (after `userService.verifyEmail`): Calls `checkAndQualifyReferral(userId)` in the background. If the referred user has also completed an audit, the referral qualifies and rewards are applied.

Import added: `resolveReferralCode`, `createReferral`, `checkAndQualifyReferral` from referral.service.

### `server/src/worker.ts`

**One integration point:**

In `onJobComplete` callback (after CRM processing): Calls `checkAndQualifyReferral(job.user_id)` in the background. This is the second trigger — if the user's email was already verified, completing their first audit qualifies the referral.

Imports added: `checkAndQualifyReferral`, `setPool as setReferralServicePool`.
Pool initialization added: `setReferralServicePool(pool)`.

### `server/src/routes/index.ts`

- Imported `referralsRouter` from `./referrals/index.js`
- Mounted: `router.use('/referrals', referralsRouter)`
- Imported and called `setReferralServicePool(pool)` in `initializeRoutes()`

### `server/src/routes/admin/index.ts`

- Imported `adminReferralsRouter` from `./referrals.js`
- Mounted: `router.use('/referrals', adminReferralsRouter)`

---

## Frontend Files

### New: `client/src/pages/referrals/ReferralDashboard.tsx`

User-facing referral page with:
- **Referral link card** — Shows the link with a copy button (clipboard API)
- **Stats cards** — Total referred, rewarded, bonus audits earned, bonus audits remaining
- **Milestone progress bar** — Shows progress toward 5 or 10 referrals with reward description
- **Email invite form** — Text input for up to 5 comma-separated emails, sends via `referralsApi.invite()`
- **Referrals table** — Lists all referrals with referred user name/email, status badge (color-coded with icon), reward amount, date
- **How It Works section** — 3-step visual guide

Uses `Sidebar` layout. Follows brand guidelines (indigo primary, slate backgrounds, proper card patterns).

### New: `client/src/pages/admin/referrals/AdminReferralsDashboard.tsx`

Admin referral management page with dark theme (`AdminLayout`):
- **Stats cards** — Total referrals, conversion rate, bonus audits awarded, voided count
- **Top referrers section** — Top 5 referrers with name, email, and referral count
- **Filters** — Search by email, filter by status dropdown
- **Referrals table** — Shows referrer + referred user info, status badge, reward amounts (referrer/referred), date, void action button
- **Pagination** — Previous/Next with page count
- **Void modal** — Confirmation dialog with reason textarea, calls `adminReferralsApi.void()`

---

## Modified Frontend Files

### `client/src/services/api.ts`

**Updated `authApi.register`:** Added optional `referralCode?: string` to the data parameter.

**New `referralsApi` namespace:**

| Method | Description |
|---|---|
| `getCode()` | `GET /api/referrals/code` |
| `getStats()` | `GET /api/referrals/stats` |
| `list(page, limit)` | `GET /api/referrals/list` |
| `invite(emails)` | `POST /api/referrals/invite` |

**New `adminReferralsApi` namespace:**

| Method | Description |
|---|---|
| `getStats()` | `GET /api/admin/referrals/stats` |
| `list(params)` | `GET /api/admin/referrals` with query params |
| `void(id, reason)` | `POST /api/admin/referrals/:id/void` |
| `getConfig()` | `GET /api/admin/referrals/config` |
| `updateConfig(key, value)` | `PATCH /api/admin/referrals/config` |

### `client/src/types/auth.types.ts`

Added `referralCode?: string` to `RegisterData` interface.

### `client/src/components/auth/RegisterForm.tsx`

- Added `useSearchParams` import from react-router-dom
- Reads `ref` query parameter from URL: `const referralCode = searchParams.get('ref') || undefined`
- Passes `referralCode` to `registerUser()` call
- Shows an indigo info banner when a referral code is present: "You were referred by a friend! Complete registration and your first audit to earn bonus audits."

### `client/src/components/layout/Sidebar.tsx`

- Added `Gift` icon import from lucide-react
- Added nav item: `{ href: '/referrals', label: 'Referrals', icon: Gift }` — positioned before API Keys
- Added `isActive` check for `/referrals` path

### `client/src/components/layout/AdminLayout.tsx`

- Added `Gift` icon import from lucide-react
- Added nav item under the **Growth** group: `{ href: '/admin/referrals', label: 'Referrals', icon: Gift }`

### `client/src/App.tsx`

- Imported `ReferralDashboard` from `./pages/referrals/ReferralDashboard`
- Imported `AdminReferralsDashboard` from `./pages/admin/referrals/AdminReferralsDashboard`
- Added protected route: `/referrals` → `<ReferralDashboard />`
- Added admin route: `/admin/referrals` → `<AdminReferralsDashboard />`

### `docs/TIERS.md`

Added new **Referrals** section with tier table showing:
- Bonus audits per referral (5/5/8/12/12)
- Referred user bonus (3 across all tiers)
- Max referrals/month (50 across all tiers)
- Milestone rewards (5 → Starter 30d, 10 → Pro 30d)

---

## Referral Lifecycle Flow

```
1. User A shares link: https://app.kritano.com/register?ref=REF-a8kd3m2x

2. User B clicks link → RegisterForm reads ?ref param → shows referral banner

3. User B submits registration form
   → POST /api/auth/register { ...fields, referralCode: "REF-a8kd3m2x" }
   → Backend: resolveReferralCode("REF-a8kd3m2x") → finds User A
   → createReferral(userA.id, userB.id, code, ip)
   → Referral created with status: "pending"
   → users.referred_by_code and referred_by_user_id set on User B

4. User B verifies email
   → POST /api/auth/verify-email
   → checkAndQualifyReferral(userB.id) fires
   → email_verified = true, but no completed audit yet → stays "pending"
   → referrals.email_verified_at set

5. User B runs and completes first audit
   → Worker onJobComplete fires
   → checkAndQualifyReferral(userB.id) fires again
   → email_verified = true ✓, completed audit exists ✓
   → Status: "pending" → "qualified" → "rewarded"
   → applyRewards():
     - User A gets +N bonus audits (based on their tier)
     - User B gets +3 bonus audits
     - referral_rewards ledger entries created for both
     - referral_qualified email sent to User A
     - referral_welcome_bonus email sent to User B
     - checkMilestones(): if User A now has 5 or 10 rewarded referrals, upgrade their subscription

6. Admin can void at any time
   → POST /api/admin/referrals/:id/void { reason: "Fraud" }
   → Reverses bonus audits for both users (clamped to 0)
   → admin_adjustment entries in referral_rewards ledger
   → Status: "voided", voided_at and void_reason set
```

---

## File Summary

### New Files (10)

| File | Purpose |
|---|---|
| `server/src/db/migrations/075_referral_system.sql` | DB tables + user columns |
| `server/src/db/migrations/076_seed_referral_email_templates.sql` | 4 email templates |
| `server/src/types/referral.types.ts` | TypeScript interfaces |
| `server/src/services/referral.service.ts` | Core business logic |
| `server/src/routes/referrals/index.ts` | User API endpoints |
| `server/src/routes/admin/referrals.ts` | Admin API endpoints |
| `client/src/pages/referrals/ReferralDashboard.tsx` | User referral page |
| `client/src/pages/admin/referrals/AdminReferralsDashboard.tsx` | Admin referral page |
| `docs/DONE_referral-system.md` | This documentation |

### Modified Files (12)

| File | Changes |
|---|---|
| `server/src/schemas/auth.schemas.ts` | Added `referralCode` to register schema |
| `server/src/routes/auth/index.ts` | Referral processing on register + verify-email |
| `server/src/worker.ts` | Referral qualification check on audit complete |
| `server/src/routes/index.ts` | Mount referrals router + init pool |
| `server/src/routes/admin/index.ts` | Mount admin referrals router |
| `client/src/services/api.ts` | Added `referralsApi` + `adminReferralsApi` + referralCode on register |
| `client/src/types/auth.types.ts` | Added `referralCode` to RegisterData |
| `client/src/components/auth/RegisterForm.tsx` | Read ?ref param, pass to registration, show banner |
| `client/src/components/layout/Sidebar.tsx` | Added Referrals nav item |
| `client/src/components/layout/AdminLayout.tsx` | Added Referrals under Growth group |
| `client/src/App.tsx` | Added /referrals and /admin/referrals routes |
| `docs/TIERS.md` | Added Referrals tier table |

---

## Verification Checklist

- [ ] Run migration `075_referral_system.sql`
- [ ] Run migration `076_seed_referral_email_templates.sql`
- [ ] Register a new user with `?ref=REF-xxxxx` — check referral created as pending
- [ ] Verify email — check `checkAndQualifyReferral` fires (shouldn't qualify yet, no audit)
- [ ] Run first audit — check referral qualifies, both users credited
- [ ] Check referral dashboard shows correct stats at `/referrals`
- [ ] Admin panel at `/admin/referrals`: void a referral, verify rewards reversed
- [ ] Test self-referral blocked (same email or same user ID)
- [ ] Test monthly limit (50 referrals)
- [ ] Test invite emails (max 5, blocks self, blocks existing users)
- [ ] TypeScript compilation: `npx tsc --noEmit` (no new errors)
