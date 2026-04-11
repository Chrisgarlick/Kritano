# App Route Prefix Refactor - Ultrathink Plan

## Overview

Prefix all authenticated/protected frontend routes with `/app/` to cleanly separate public and app routes. This simplifies layout selection, 404 handling, SiteModeGuard logic, and prerender blocking.

**Before:** `/dashboard`, `/sites`, `/audits/123`, `/settings/profile`
**After:** `/app/dashboard`, `/app/sites`, `/app/audits/123`, `/app/settings/profile`

Routes that do NOT change:
- `/` `/about` `/services` `/blog` `/contact` `/waitlist` `/faq` `/terms` `/privacy` `/pricing`
- `/login` `/register` `/forgot-password` `/reset-password` `/verify-email`
- `/admin/*`
- `/docs/*`
- `/auth/callback/*`
- `/public/reports/*`
- `/site-invitations/*`
- `/email/unsubscribe`
- `/error`

## Key Decisions

1. **No redirects from old paths.** We're in waitlist mode with 2 beta users. No need for backwards compatibility.
2. **`/admin` stays as `/admin`.** It's already a separate namespace and works fine.
3. **Auth routes stay at root level.** `/login`, `/register`, etc. are public-facing and don't belong under `/app/`.
4. **Settings sub-routes all move.** `/settings/profile` becomes `/app/settings/profile`.
5. **Post-login default redirect** changes from `/dashboard` to `/app/dashboard`.

---

## Impact Summary

| Area | Files | References |
|---|---|---|
| Route definitions (App.tsx) | 1 | ~21 route paths |
| Route registry | 1 | ~9 entries |
| SiteModeGuard | 1 | 1 array of app routes |
| NotFound page | 1 | 1 array + ~5 links |
| Sidebar navigation | 1 | ~17 references |
| Admin layout | 1 | 1 link |
| Public layout | 1 | 2 dashboard links |
| Settings layout | 1 | 4 sub-route links |
| Login form | 1 | 1 default redirect |
| OAuth callback | 1 | 2 navigates |
| GSC callback | 1 | 2 navigates |
| Verify email page | 1 | 1 link |
| Dashboard page | 1 | ~5 links/navigates |
| Keyboard shortcuts hook | 1 | 1 navigate |
| Onboarding checklist | 1 | 3 hrefs |
| New Audit page | 1 | 2 navigates |
| Audit Detail page | 1 | 3 links/navigates |
| Page Detail page | 1 | 1 link |
| Compliance Report | 1 | 2 navigates |
| Accessibility Statement | 1 | 2 navigates |
| Site Detail page | 1 | 3 links/navigates |
| Site Invitation page | 1 | 1 navigate |
| Schedule Detail page | 1 | 3 links/navigates |
| Analytics Dashboard | 1 | ~7 navigates |
| Site Analytics | 1 | ~6 links/navigates |
| URL Analytics | 1 | ~5 links/navigates |
| Audit Comparison | 1 | 2 links |
| Site Comparison | 1 | 1 link |
| Sites Settings | 1 | 2 hrefs |
| Branding Settings | 1 | 1 href |
| GenerateSchemaPanel | 1 | 1 href |
| ContentAnalysisPanel | 1 | 2 hrefs |
| IndexExposureTab | 1 | 1 href |
| AdminRoute | 1 | 1 redirect |
| **Server: Prerender service** | 1 | ~10 blocked prefixes |
| **Server: Email service** | 1 | 4 URLs |
| **Server: Email template service** | 1 | 2 URLs |
| **Server: Stripe routes** | 1 | 3 URLs |
| **Server: GDPR service** | 1 | 3 URLs |
| **Server: Site service** | 1 | 1 URL |
| **Server: Referral service** | 1 | 1 URL |
| **Server: Org middleware** | 1 | 2 URLs |
| **Server: Email template migrations** | 3 | ~11 URLs in seeded templates |
| **Total** | **~40 files** | **~150 references** |

---

## Database Changes

### Migration: Update seeded email template URLs

```sql
-- Migration: 106_update_email_template_app_prefix.sql

-- Update CRM email templates (054)
UPDATE email_templates SET body = REPLACE(body, '"href":"{{appUrl}}/audits"', '"href":"{{appUrl}}/app/audits"') WHERE body LIKE '%{{appUrl}}/audits%';
UPDATE email_templates SET body = REPLACE(body, '"href":"{{appUrl}}/audits/new"', '"href":"{{appUrl}}/app/audits/new"') WHERE body LIKE '%{{appUrl}}/audits/new%';
UPDATE email_templates SET body = REPLACE(body, '"href":"{{appUrl}}/settings/profile"', '"href":"{{appUrl}}/app/settings/profile"') WHERE body LIKE '%{{appUrl}}/app/settings/profile%' IS NOT TRUE AND body LIKE '%{{appUrl}}/settings/profile%';
UPDATE email_templates SET body = REPLACE(body, '"href":"{{appUrl}}/settings/sites"', '"href":"{{appUrl}}/app/settings/sites"') WHERE body LIKE '%{{appUrl}}/settings/sites%';
UPDATE email_templates SET body = REPLACE(body, '"href":"{{appUrl}}/sites"', '"href":"{{appUrl}}/app/sites"') WHERE body LIKE '%{{appUrl}}/sites%';
```

Note: This handles templates that were seeded by previous migrations. The migration SQL files themselves don't need changing (they only run once and have already run).

---

## Backend Changes

### File: `server/src/services/prerender.service.ts`

Update BLOCKED_PREFIXES:
```
Before: '/dashboard', '/settings', '/audits', '/sites', '/analytics', ...
After:  '/app/'
```

One prefix replaces ten. This is the simplification payoff.

### File: `server/src/services/email.service.ts`

Update 4 URLs:
- `${this.appUrl}/audits/${audit.id}` -> `${this.appUrl}/app/audits/${audit.id}`
- `${this.appUrl}/settings/billing` -> `${this.appUrl}/app/settings/billing`
- `${this.appUrl}/audits/${audit.id}` -> `${this.appUrl}/app/audits/${audit.id}`
- `${this.appUrl}/settings/notifications` -> `${this.appUrl}/app/settings/notifications`

### File: `server/src/services/email-template.service.ts`

Update 2 URLs:
- `${APP_URL}/settings/notifications` -> `${APP_URL}/app/settings/notifications`
- `${APP_URL}/audits/00000000-...` -> `${APP_URL}/app/audits/00000000-...`

### File: `server/src/routes/index.ts` (Stripe)

Update 3 URLs:
- `${appUrl}/settings/profile?checkout=success` -> `${appUrl}/app/settings/profile?checkout=success`
- `${appUrl}/settings/profile?checkout=canceled` -> `${appUrl}/app/settings/profile?checkout=canceled`
- `${appUrl}/settings/profile` (portal return) -> `${appUrl}/app/settings/profile`

### File: `server/src/services/gdpr.service.ts`

Update 3 URLs:
- `${appUrl}/settings/profile` -> `${appUrl}/app/settings/profile`
- `${appUrl}/settings/profile` -> `${appUrl}/app/settings/profile`
- `${appUrl}/dashboard` -> `${appUrl}/app/dashboard`

### File: `server/src/services/site.service.ts`

Update 1 URL:
- `${appUrl}/sites/${site.id}` -> `${appUrl}/app/sites/${site.id}`

### File: `server/src/services/referral.service.ts`

Update 1 URL:
- `${APP_URL}/dashboard` -> `${APP_URL}/app/dashboard`

### File: `server/src/middleware/organization.middleware.ts`

Update 2 URLs:
- `/org/${orgId}/settings/billing` -> `/app/settings/billing` (or keep org-based if still used)

---

## Frontend Changes

### File: `client/src/App.tsx` (~21 changes)

All protected route paths get `/app` prefix:
```
path="/dashboard"                    -> path="/app/dashboard"
path="/audits"                       -> path="/app/audits"
path="/audits/new"                   -> path="/app/audits/new"
path="/audits/:id"                   -> path="/app/audits/:id"
path="/audits/:id/pages/:pageId"     -> path="/app/audits/:id/pages/:pageId"
path="/audits/:id/statement"         -> path="/app/audits/:id/statement"
path="/audits/:id/compliance"        -> path="/app/audits/:id/compliance"
path="/sites"                        -> path="/app/sites"
path="/sites/:siteId"                -> path="/app/sites/:siteId"
path="/sites/:siteId/urls/:urlId"    -> path="/app/sites/:siteId/urls/:urlId"
path="/schedules"                    -> path="/app/schedules"
path="/schedules/:id"                -> path="/app/schedules/:id"
path="/referrals"                    -> path="/app/referrals"
path="/analytics"                    -> path="/app/analytics"
path="/analytics/sites/:siteId"      -> path="/app/analytics/sites/:siteId"
path="/analytics/sites/:siteId/urls/:urlId" -> path="/app/analytics/sites/:siteId/urls/:urlId"
path="/analytics/compare"            -> path="/app/analytics/compare"
path="/analytics/compare-sites"      -> path="/app/analytics/compare-sites"
path="/compare"                      -> path="/app/compare"
path="/search-console"               -> path="/app/search-console"
path="/settings"                     -> path="/app/settings"
path="/profile" redirect             -> path="/app/profile" redirect to /app/settings/profile
```

### File: `client/src/config/routeRegistry.ts` (~9 changes)

All app route paths get `/app` prefix.

### File: `client/src/components/SiteModeGuard.tsx` (simplified)

```typescript
// Before: array of 10 app routes to check
const appRoutes = ['/dashboard', '/sites', '/audits', ...];
if (appRoutes.some(route => path === route || path.startsWith(route + '/'))) {

// After: single prefix check
if (path.startsWith('/app/') || path.startsWith('/app')) {
```

### File: `client/src/pages/errors/NotFound.tsx` (simplified)

```typescript
// Before:
const appPrefixes = ['/dashboard', '/sites', '/audits', ...];
return appPrefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'));

// After:
return path.startsWith('/app');
```

### File: `client/src/components/layout/Sidebar.tsx` (~17 changes)

All `href` values and `startsWith` checks get `/app` prefix.

### File: `client/src/components/auth/LoginForm.tsx` (1 change)

```
const from = ... || '/dashboard'  ->  const from = ... || '/app/dashboard'
```

### All other component files (~25 files, ~70 references)

Every `navigate('/dashboard')`, `to="/sites"`, `href="/settings/billing"`, etc. gets the `/app` prefix. These are mechanical find-and-replace changes within each file.

---

## Critical Files Summary

| Priority | File | Change Type |
|---|---|---|
| 1 | `client/src/App.tsx` | Route definitions |
| 1 | `client/src/components/layout/Sidebar.tsx` | Navigation links |
| 1 | `client/src/components/auth/LoginForm.tsx` | Post-login redirect |
| 1 | `client/src/pages/auth/OAuthCallback.tsx` | Post-OAuth redirect |
| 2 | `client/src/components/SiteModeGuard.tsx` | Simplify guard |
| 2 | `client/src/pages/errors/NotFound.tsx` | Simplify detection |
| 2 | `client/src/config/routeRegistry.ts` | Route config |
| 2 | `client/src/components/layout/SettingsLayout.tsx` | Sub-nav links |
| 2 | `client/src/components/layout/AdminLayout.tsx` | Back link |
| 2 | `client/src/components/layout/PublicLayout.tsx` | Dashboard links |
| 2 | `client/src/routes/AdminRoute.tsx` | Redirect target |
| 3 | All page components (~20 files) | Links and navigates |
| 3 | `client/src/hooks/useKeyboardShortcuts.ts` | Navigate target |
| 3 | `client/src/components/onboarding/OnboardingChecklist.tsx` | Hrefs |
| 4 | `server/src/services/email.service.ts` | Email URLs |
| 4 | `server/src/services/email-template.service.ts` | Template URLs |
| 4 | `server/src/routes/index.ts` | Stripe redirects |
| 4 | `server/src/services/gdpr.service.ts` | Email URLs |
| 4 | `server/src/services/site.service.ts` | Email URLs |
| 4 | `server/src/services/referral.service.ts` | Email URLs |
| 4 | `server/src/services/prerender.service.ts` | Blocked prefixes |
| 5 | `server/src/db/migrations/106_...sql` | Fix seeded templates |

---

## Testing Plan

### Smoke Tests
- [ ] Navigate to `/app/dashboard` while logged in -- loads dashboard
- [ ] Navigate to `/dashboard` -- shows public 404 with nav/footer
- [ ] Navigate to `/test` -- shows public 404 with nav/footer
- [ ] Navigate to `/blog/nonexistent` -- shows 404 (blog handles this)
- [ ] Navigate to `/app/audits/nonexistent-id` -- shows app-style 404

### Auth Flow
- [ ] Login redirects to `/app/dashboard`
- [ ] OAuth callback redirects to `/app/dashboard`
- [ ] GSC callback redirects to `/app/search-console`
- [ ] Email verification link redirects to `/app/dashboard`
- [ ] Unauthenticated visit to `/app/dashboard` redirects to `/login`

### SiteModeGuard (Waitlist)
- [ ] `/app/*` routes blocked for unauthenticated users (redirect to `/`)
- [ ] `/app/*` routes allowed for beta_access users
- [ ] `/app/*` routes allowed for admins
- [ ] Public routes still work normally
- [ ] Login route still accessible

### Emails
- [ ] Audit completion email links to `/app/audits/:id`
- [ ] Payment failure email links to `/app/settings/billing`
- [ ] Referral welcome email links to `/app/dashboard`
- [ ] Unsubscribe link points to `/app/settings/notifications`

### Stripe
- [ ] Checkout success redirects to `/app/settings/profile?checkout=success`
- [ ] Checkout cancel redirects to `/app/settings/profile?checkout=canceled`
- [ ] Billing portal return URL is `/app/settings/profile`

### Sidebar
- [ ] All sidebar links work and highlight correctly
- [ ] Active state detection works with `/app/` prefix

### Navigation Within App
- [ ] "Back to audits" breadcrumbs work
- [ ] "New Audit" button navigates correctly
- [ ] Site detail back links work
- [ ] Schedule detail back links work
- [ ] Analytics drill-down navigation works
- [ ] Settings sub-navigation works

---

## Implementation Order

### Step 1: Frontend Route Definitions + Core Layout
1. `client/src/App.tsx` -- all route path definitions
2. `client/src/config/routeRegistry.ts` -- route registry
3. `client/src/components/layout/Sidebar.tsx` -- all nav links + active detection
4. `client/src/components/layout/SettingsLayout.tsx` -- settings sub-nav
5. `client/src/components/layout/AdminLayout.tsx` -- back to app link
6. `client/src/components/layout/PublicLayout.tsx` -- dashboard links
7. `client/src/routes/AdminRoute.tsx` -- redirect target

### Step 2: Auth + Guards
1. `client/src/components/auth/LoginForm.tsx` -- default redirect
2. `client/src/pages/auth/OAuthCallback.tsx` -- post-OAuth redirect
3. `client/src/pages/auth/GscCallback.tsx` -- post-GSC redirect
4. `client/src/pages/auth/VerifyEmail.tsx` -- post-verify redirect
5. `client/src/components/SiteModeGuard.tsx` -- simplify to `/app` prefix check
6. `client/src/pages/errors/NotFound.tsx` -- simplify detection

### Step 3: Page Components (mechanical replacements)
1. Dashboard, Onboarding Checklist
2. Audit pages (Detail, New, PageDetail, Compliance, Statement)
3. Site pages (Detail, Invitation)
4. Analytics pages (Dashboard, Site, URL, Comparison)
5. Schedule pages
6. Settings pages (Sites, Branding)
7. Audit sub-components (GenerateSchema, ContentAnalysis, IndexExposure)
8. Keyboard shortcuts hook

### Step 4: Server-Side URLs
1. `server/src/services/prerender.service.ts`
2. `server/src/services/email.service.ts`
3. `server/src/services/email-template.service.ts`
4. `server/src/routes/index.ts` (Stripe)
5. `server/src/services/gdpr.service.ts`
6. `server/src/services/site.service.ts`
7. `server/src/services/referral.service.ts`
8. `server/src/middleware/organization.middleware.ts`

### Step 5: Database Migration
1. `server/src/db/migrations/106_update_email_template_app_prefix.sql`

### Step 6: Verify
1. TypeScript compile check (both server and client)
2. Run through testing plan above
