# Early Access System — Implementation Plan

## Context

The pricing page promises free trials, and a coming soon toggle exists, but there's no early access campaign system. We need a way to give 200 founding users exclusive benefits (1-month Agency trial + 50% lifetime discount) before public launch. Two trackable links (`?ea=email` and `?ea=social`) draw from the same 200-slot pool. Once full, visitors see a "coming soon" page with email waitlist. Admin activates all early access users at once when ready.

## Key Decisions

1. **Single pool, two tracked channels** — `/register?ea=email` and `/register?ea=social` both draw from 200 slots. Channel is tracked for analytics. Links are interchangeable.
2. **Claim spot, activate later** — Users register and claim a spot but can't use the app yet. Admin clicks "Activate" to grant all early access users a 30-day Agency trial at once.
3. **Flag on user record** — `early_access`, `early_access_channel`, `discount_percent` columns on `users` table. Stripe will read `discount_percent` when payments are added later.
4. **Reuse existing coming soon system** — `coming_soon_signups` table for waitlist after spots fill. `ComingSoonGuard` extended to allow `?ea=` registration through.
5. **Modify `startTrial()` to accept custom duration** — Add optional `durationDays` param (default 14, early access uses 30).

---

## Implementation Order

### 1. Database Migration

**New file:** `server/src/db/migrations/081_early_access.sql`

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS early_access BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS early_access_channel VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS early_access_activated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_early_access ON users(early_access) WHERE early_access = true;

INSERT INTO system_settings (key, value) VALUES
  ('early_access_enabled', 'false'),
  ('early_access_max_spots', '200'),
  ('early_access_discount_percent', '50'),
  ('early_access_activated', 'false')
ON CONFLICT (key) DO NOTHING;
```

### 2. Email Template Seeds

**New file:** `server/src/db/migrations/082_seed_early_access_email_templates.sql`

Two templates following migration 076 pattern:
- `early_access_confirmed` — "You're in! Your early access spot is secured."
- `early_access_activated` — "Your early access is live — 30 days of Agency, free."

Variables: `firstName`, `tierName`, `trialEndDate`, `discountPercent`, `loginUrl`

### 3. Early Access Service

**New file:** `server/src/services/early-access.service.ts`

Functions:
- `isEarlyAccessEnabled()` — reads `early_access_enabled` setting
- `getEarlyAccessStatus()` → `{ enabled, maxSpots, claimed, remaining, activated }`
- `canClaimSpot()` — enabled + remaining > 0
- `claimSpot(userId, channel)` — atomic UPDATE with CTE count check (race-safe). Sets `early_access=true`, `early_access_channel`, `discount_percent` from settings
- `getChannelBreakdown()` → `{ email, social, total }`
- `getEarlyAccessUsers(page, limit)` — paginated list for admin
- `activateAll(adminId)` — finds users where `early_access=true AND early_access_activated_at IS NULL`, calls `startTrial(userId, 'agency', 30)` for each, sets `early_access_activated_at`, sends `early_access_activated` email. Idempotent.

### 4. Modify Trial Service

**File:** `server/src/services/trial.service.ts`

Add optional `durationDays` parameter to `startTrial()`:

```typescript
export async function startTrial(
  userId: string,
  tier: 'starter' | 'pro' | 'agency',
  durationDays?: number
)
```

Line 84: `trialEnd.setDate(trialEnd.getDate() + (durationDays ?? TRIAL_DURATION_DAYS));`

### 5. Modify Auth Schema + Registration Route

**File:** `server/src/schemas/auth.schemas.ts`
- Add `earlyAccessChannel: z.enum(['email', 'social']).optional()` to `registerSchema`

**File:** `server/src/routes/auth/index.ts`
- After user creation, if `input.earlyAccessChannel` is present: call `claimSpot(user.id, input.earlyAccessChannel)`, send `early_access_confirmed` email (non-blocking, don't fail registration)
- Add `earlyAccess: boolean` to the 201 response

### 6. Public API Endpoint

**File:** `server/src/routes/index.ts`

```
GET /api/early-access/status → { enabled, spotsRemaining, maxSpots, isFull }
```

### 7. Admin API Routes

**New file:** `server/src/routes/admin/early-access.ts`

- `GET /api/admin/early-access/stats` — total, remaining, channel breakdown, activated status
- `GET /api/admin/early-access/users` — paginated list with search
- `POST /api/admin/early-access/activate` — triggers `activateAll()`, logs admin activity
- `GET /api/admin/early-access/users/export` — CSV download

**File:** `server/src/routes/admin/index.ts` — mount the new router

### 8. Frontend API Client

**File:** `client/src/services/api.ts`

```typescript
export const earlyAccessApi = {
  getStatus: () => api.get('/early-access/status'),
};

export const adminEarlyAccessApi = {
  getStats: () => api.get('/admin/early-access/stats'),
  getUsers: (params?) => api.get('/admin/early-access/users', { params }),
  activate: () => api.post('/admin/early-access/activate', { confirm: true }),
  exportUsers: () => api.get('/admin/early-access/users/export', { responseType: 'blob' }),
};
```

Also add `earlyAccessChannel` to the register function params.

### 9. Frontend Auth Types

**File:** `client/src/types/auth.types.ts`
- Add `earlyAccessChannel?: 'email' | 'social'` to `RegisterData`

### 10. ComingSoonGuard Changes

**File:** `client/src/components/ComingSoonGuard.tsx`

Allow through when:
- Admin routes (existing)
- `/register` with `?ea=` param present
- `/register/early-access-success`
- `/login`, `/verify-email/*`, `/forgot-password/*`

### 11. RegisterForm + Register Page Changes

**File:** `client/src/components/auth/RegisterForm.tsx`
- Read `ea` query param alongside existing `ref` param
- Validate it's `email` or `social`
- Pass as `earlyAccessChannel` to `registerUser()`
- Show early access banner when `ea` param present
- On success with early access, navigate to `/register/early-access-success`

**File:** `client/src/pages/auth/Register.tsx`
- When `?ea=` param present, show different header: "Claim Your Early Access"
- Show benefits list: 30-day Agency trial, 50% lifetime discount
- Fetch `earlyAccessApi.getStatus()` on mount — if full, show "full" message with waitlist email signup (reuse `comingSoonApi.signup()`)

### 12. Early Access Success Page

**New file:** `client/src/pages/auth/EarlyAccessSuccess.tsx`

Simple confirmation: "You're in! We'll notify you when early access begins." Check icon, similar layout to `RegisterSuccessPage.tsx`.

### 13. App.tsx Routing

**File:** `client/src/App.tsx`

Add routes:
- `/register/early-access-success` → `EarlyAccessSuccessPage`
- `/admin/early-access` → `AdminEarlyAccessPage`

### 14. Admin Early Access Page

**New file:** `client/src/pages/admin/AdminEarlyAccess.tsx`

Dashboard showing:
- Stats cards: spots claimed/200, remaining, email count, social count
- Copyable share links (`/register?ea=email`, `/register?ea=social`)
- "Activate All" button with confirmation modal (disabled if already activated or 0 users)
- Paginated user table: name, email, channel, registered, email verified, activated
- CSV export button

### 15. Admin Settings + Sidebar

**File:** `client/src/pages/admin/settings/SystemSettingsPage.tsx`
- Add "Early Access" section: toggle for `early_access_enabled`, number inputs for max spots and discount percent, link to full admin page

**File:** `client/src/components/layout/AdminLayout.tsx`
- Add nav item: `{ href: '/admin/early-access', label: 'Early Access', icon: Rocket }`

---

## Critical Files Summary

| # | File | Change |
|---|------|--------|
| 1 | `server/src/db/migrations/081_early_access.sql` | NEW — user columns + settings |
| 2 | `server/src/db/migrations/082_seed_early_access_email_templates.sql` | NEW — 2 email templates |
| 3 | `server/src/services/early-access.service.ts` | NEW — all early access logic |
| 4 | `server/src/services/trial.service.ts` | MODIFY — add `durationDays` param |
| 5 | `server/src/schemas/auth.schemas.ts` | MODIFY — add `earlyAccessChannel` |
| 6 | `server/src/routes/auth/index.ts` | MODIFY — claim spot on register |
| 7 | `server/src/routes/index.ts` | ADD — `/early-access/status` endpoint |
| 8 | `server/src/routes/admin/early-access.ts` | NEW — admin API routes |
| 9 | `server/src/routes/admin/index.ts` | MODIFY — mount early access router |
| 10 | `client/src/services/api.ts` | ADD — earlyAccessApi + adminEarlyAccessApi |
| 11 | `client/src/types/auth.types.ts` | ADD — earlyAccessChannel field |
| 12 | `client/src/components/ComingSoonGuard.tsx` | MODIFY — allow EA routes through |
| 13 | `client/src/components/auth/RegisterForm.tsx` | MODIFY — read `?ea=` param |
| 14 | `client/src/pages/auth/Register.tsx` | MODIFY — EA variant UI |
| 15 | `client/src/pages/auth/EarlyAccessSuccess.tsx` | NEW — success page |
| 16 | `client/src/App.tsx` | ADD — new routes |
| 17 | `client/src/pages/admin/AdminEarlyAccess.tsx` | NEW — admin dashboard |
| 18 | `client/src/pages/admin/settings/SystemSettingsPage.tsx` | MODIFY — EA config section |
| 19 | `client/src/components/layout/AdminLayout.tsx` | ADD — sidebar nav item |

## Verification

1. Run migrations 081 + 082
2. Enable early access in admin settings
3. Visit `/register?ea=social` while coming soon is enabled → should see EA registration form
4. Register → verify `early_access=true`, `early_access_channel='social'`, `discount_percent=50` on user record
5. Check Mailpit for `early_access_confirmed` email
6. Visit `/register` (no `?ea=`) while coming soon enabled → should see coming soon page
7. Admin panel: verify stats show 1 claimed, channel breakdown correct
8. Register 200 users → verify 201st sees "full" message with waitlist signup
9. Admin clicks "Activate All" → verify all users get 30-day Agency trial subscription
10. Check Mailpit for `early_access_activated` emails
11. Verify activated users can see dashboard with Agency features
12. Try activate again → should be idempotent (no duplicates)
