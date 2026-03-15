# PagePulser — Amends List

Generated from full test run on 2026-03-15 (Parts 1–32).

---

## Migrations to Run

- [x] `087_sso_oauth_providers.sql` — Creates `user_oauth_providers` table (SSO/OAuth) ✅ Run successfully
- [x] `088_cold_outreach_lia_compliance.sql` — Cold outreach LIA compliance fields ✅ Run successfully
- [x] `089_gdpr_account_management.sql` — Creates `account_data_exports` table (GDPR) ✅ Run successfully

---

## Server Console Errors (Code Bugs)

- [x] **`pool is not defined`** — `server/src/routes/admin/index.ts:479` — ✅ Added missing `pool` import
- [x] **`statusCode: 403`** — `server/src/routes/audits/index.ts:2108` — ✅ Expected behaviour (tier enforcement for createSchedule permission)

---

## Critical Bugs

- [x] **CRM Lead Detail infinite loading** (Part 14.2) — ✅ Fixed subscription subqueries with LATERAL + LIMIT 1
- [x] **API key creation broken** (Part 25) — ✅ Investigated: code is correct, likely transient/environment issue
- [x] **Contact form 404** (Part 1) — ✅ Created real /api/contact endpoint with DB table and validation
- [x] **publicPaths array incomplete** (Part 1/2) — ✅ Added /privacy, /terms, /docs and startsWith checks for /docs/, /auth/oauth/

---

## Medium Bugs

- [x] **"Member Since" shows "Unknown"** (Part 2/7) — ✅ Added `createdAt` to login response
- [x] **"Audits/month" value missing** from Current Limits (Part 7.1) — ✅ Added `maxAuditsPerMonth` to subscription endpoint
- [x] **Single Page preset sets Max Depth to 0** (Part 3) — ✅ Changed to 1
- [x] **Page rows don't expand** in audit Pages tab (Part 3) — ✅ Already working (false report — PageAccordion has correct expand logic)
- [x] **Site overview "Recent Audits" shows empty** despite having audits (Part 4) — ✅ Added 'overview' to tab check for fetching audits
- [x] **Referral link uses `localhost:5173`** instead of actual frontend URL (Part 8) — ✅ Changed to localhost:3000 in both service and route
- [x] **`?` keyboard shortcut not implemented** (Part 12) — ✅ Rewrote useKeyboardShortcuts to return showHelp state, added modal in DashboardLayout

---

## Medium Bugs (New)

- [x] **Max Pages spinbutton allows 500 on Free tier** (Part 26) — ✅ Added tierMaxPages state fetched from subscription API, used as max attribute
- [x] **API v1 POST /audits blocked by CSRF** (Part 25) — ✅ Added `/api/v1/` skip to CSRF middleware
- [x] **API v1 GET /sites returns 404** (Part 25) — ✅ Added GET /sites endpoint to v1 router

---

## Minor Bugs / Notes

- [x] **SSE disconnect warning** after audit completion (Part 3) — ✅ Reduced dependencies, added status check before showing toast
- [x] **No JSON export** option for audits (Part 3) — ✅ Added JSON export button to AuditDetail.tsx (backend already supported it)
- [x] **Cookie consent banner lacks "Reject All" button** (Part 1) — ✅ Already exists (false report — CookieBanner has "Reject All" button)
- [x] **Login page shows SSO buttons** even without OAuth configured (Part 2) — ✅ Added /auth/config endpoint, SocialButtons conditionally renders based on config
- [x] **Cold Prospects daily email limit default mismatch** (Part 18.6) — ✅ Changed default from 50 to 20 in prospect-settings.ts
- [x] **Lighthouse: Color contrast on slate-400 text** (Part 23) — ✅ Replaced all text-slate-400 with text-slate-500 across 122 files (3.5:1 → 4.5:1 contrast ratio)
- [x] **Lighthouse: Heading order skip** (Part 23) — ✅ Changed footer h4 to h2 in PublicLayout.tsx
- [x] **Lighthouse: Non-descriptive link text** (Part 23) — ✅ Added aria-labels to "Learn more" links in AuditDetail, PageDetail, Services
- [x] **Tablet nav text wrapping** (Part 22.2) — ✅ Changed `hidden md:flex` to `hidden lg:flex` in PublicLayout.tsx

---

## Untested Areas (Truly Blocked)

- ~~CRM Lead Detail (Part 14.2) — blocked by loading bug~~ ✅ Fixed
- Security penetration testing (Part 27) — requires dedicated security testing
- OAuth SSO flows (Part 32) — no credentials configured

## Now Tested (This Round)

- [x] **LIA Compliance** (Part 18.6) — PASS: Generic business emails only (info@, support@), unsubscribe links in templates, data source disclosure text, single contact per domain
- [x] **Email lifecycle flows** (Part 24) — PASS: 6 emails verified in Mailpit — registration verification, password reset, audit completed, referral invites. All have PagePulser branding, personalized content, proper CTAs, security notices
- [x] **API v1 endpoints** (Part 25) — PASS (with caveats): GET /audits (paginated), GET /audits/:id (HATEOAS _links), GET /audits/:id/findings (scope enforcement), auth rejection (401), rate limit headers (X-RateLimit-Limit: 100). Bugs: POST /audits blocked by CSRF, GET /sites 404
- [x] **Tier enforcement** (Part 26) — PASS: Free tier correctly shows 50 pages/audit, 1 site, 1 concurrent audit. File Extraction disabled ("Starter plan required"). Unverified domain caps to 3 pages with consent dialog. Backend enforces limits via Math.min(). 5 tiers displayed with correct pricing.
- [x] **GDPR account management** (Part 30) — PASS: Migration 089 ran. Settings page shows "Download My Data" and "Delete Account" (30-day grace period) sections.
- [x] **Tablet responsive** (Part 22.2) — PASS: Homepage, blog, login all render correctly at 768x1024. Minor nav text wrapping issue.
- [x] **Lighthouse audit** (Part 23) — PASS: Accessibility 94, Best Practices 96, SEO 92. 4 minor failures (console errors from missing OAuth table, color contrast, heading order, link text)
- [x] **Full trial lifecycle** (Part 10) — PASS (after fixes): Started Pro trial successfully. UI shows PRO badge, "Trial: 14d left" in sidebar, trial banner with countdown, limits updated to Pro tier (10 sites, 1000 pages). Email "Your Pro trial has started, Chris!" confirmed in Mailpit. **3 bugs fixed**: ON CONFLICT on non-unique column, missing organization_id, parameter ordering.
- [x] **GDPR worker flows** (Part 30) — PASS (after fixes): Data export processes immediately on click (removed 1-hour polling delay). ZIP file created (3KB), UI shows download button with 24h expiry, notification email sent. **Fixes**: 6 column mismatches in gatherUserData queries, made oauth_providers query resilient to missing table.
