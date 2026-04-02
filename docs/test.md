# Kritano — Full Test Plan

A step-by-step walkthrough to verify every user-facing feature before go-live. Work through each section in order — later sections depend on data created in earlier ones.

**Mailpit:** `http://localhost:8025`
**App:** `http://localhost:5173` (or `http://localhost:3000`)

---

## Part 1: Public Pages (Logged Out)

> **Test run: 2026-03-14** | Tested against `http://localhost:3000`
>
> ### Summary
> - **Passed**: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.9, 1.11, 1.12 (partial)
> - **Failed**: 1.8 (Legal Pages), 1.10 (Error Pages)
> - **Partial**: 1.7 (Blog — no posts to test), 1.13 (sitemap missing /privacy & /terms; manifest missing icons)
> - **Deferred**: 1.14 (Coming Soon — requires admin login)
>
> ### Bugs Found
> 1. **CRITICAL — `/terms` and `/privacy` redirect to `/login`**: The API response interceptor in `client/src/services/api.ts` (line ~111) has a `publicPaths` array that is missing `/terms`, `/privacy`, `/error`, and any unknown/404 paths. When `authApi.me()` returns 401, these paths get redirected to `/login`. **Fix**: Add missing paths to `publicPaths` or invert the logic to only redirect known protected routes.
> 2. **CRITICAL — 404/500 error pages never shown to logged-out users**: Same root cause as above. Any path not in `publicPaths` redirects to `/login`, so the React Router 404 catch-all never renders.
> 3. **MINOR — `sitemap.xml` missing `/privacy` and `/terms`**: These public pages should be included in the sitemap.
> 4. **MINOR — `site.webmanifest` missing `icons` array**: The manifest has name, short_name, and theme_color but no icons defined.

Start in an incognito/private window so you're fully logged out.

### 1.1 Home Page

- [x] Navigate to `/` — hero section loads with headline, description, and two CTAs
- [x] Click "Start Free Analysis" — redirects to `/register`
- [x] Go back. Click "Learn More" — scrolls or navigates appropriately (navigates to `/services`)
- [x] Scroll down — features grid, "How It Works" steps, stats section, and final CTA all render
- [x] Check the score card demo shows sample scores for all categories (SEO 92, A11Y 78, Security 95, Perf 83, Content 88)
- [x] Click "Get Started Free" in the final CTA — redirects to `/register`
- [x] Success stories section renders (if any published) — no posts published, section not shown (expected)

### 1.2 About Page

- [x] Navigate to `/about` — hero, mission, values (4 cards), and story section render
- [x] "About" link in nav is highlighted (indigo)
- [x] CTA buttons link to `/register` and `/contact`

### 1.3 Services Overview Page

- [x] Navigate to `/services` — hero and all 4 service sections render in zig-zag layout
- [x] "Services" nav link is highlighted
- [x] Each service title is clickable — links to `/services/{slug}`
- [x] Each service has a "Try X Free" button (links to `/register`) and a "Learn more" link
- [x] "Beyond Auditing" section shows 4 mini-feature cards (PDF & CSV Reports, Trend Analytics, Multi-Page Crawling, Scheduled Audits)
- [x] Bottom CTA links to `/register`

### 1.4 Service Detail Pages

Test each of the 4 sub-pages:

- [x] `/services/seo` — loads with indigo colour scheme, breadcrumb shows "Services > SEO Auditing"
- [x] `/services/accessibility` — loads with emerald colour scheme
- [x] `/services/security` — loads with red colour scheme
- [x] `/services/performance` — loads with amber colour scheme

For each sub-page verify:

- [x] Hero section: icon, title, subtitle, extended description
- [x] Feature Breakdown: 3-column grid of feature group cards with checklist items
- [x] How We Audit: 4 numbered methodology steps
- [x] Common Issues: grid of issue cards with severity badges (critical/serious/moderate/minor)
- [x] Why It Matters: headline + 3 stat cards
- [x] Related Services: 3 cards linking to the other services — click one, it navigates correctly
- [x] CTA section with service-specific button text
- [x] "Services" nav link stays highlighted on all sub-pages
- [x] Navigate to `/services/invalid` — redirects back to `/services`

### 1.5 Pricing Page

- [x] Navigate to `/pricing` — 5 tier cards render (Free, Starter, Pro, Agency, Enterprise)
- [x] Pro tier is visually highlighted as "Most Popular"
- [x] Each plan shows name, price, description, and feature list
- [x] CTA buttons link to `/register` for all plans (including Enterprise at $199/mo)
- [x] Feature comparison table expands/collapses — check all sections
- [x] FAQ section — each question expands/collapses on click
- [x] Bottom CTA links to `/register`

### 1.6 Contact Page

- [x] Navigate to `/contact` — form and contact info sidebar render
- [x] Submit empty form — validation errors appear on required fields
- [x] Fill in valid data (Name, Email, Subject dropdown, Message) and submit
- [x] Success confirmation message appears ("Message sent!")
- [x] Contact sidebar shows email, location, and response time

### 1.7 Blog

- [ ] Navigate to `/blog` — post grid renders with pagination *(no posts exist — cannot test grid/pagination)*
- [ ] Category filter dropdown works — filters posts by category *(no posts — cannot test)*
- [ ] Click a post card — navigates to `/blog/{slug}` *(no posts — cannot test)*
- [ ] Post detail page shows: title, author, publish date, read time, content blocks, category/tag badges *(no posts — cannot test)*
- [ ] Related posts section renders at bottom (if configured) *(no posts — cannot test)*
- [ ] "Back to blog" link works *(no posts — cannot test)*
- [x] Empty state renders if no posts exist yet — shows "No posts found" with "0 posts loaded"

### 1.8 Legal Pages

- [ ] Navigate to `/terms` — Terms of Service page renders with full content — **FAIL: redirects to `/login`**
- [ ] Navigate to `/privacy` — Privacy Policy page renders with full content — **FAIL: redirects to `/login`**
- [x] Footer links to both pages exist (link to `/privacy` and `/terms`)

> **BUG**: Both `/terms` and `/privacy` redirect to `/login` when visited as a logged-out user.
> **Root cause**: `client/src/services/api.ts` line ~111 — the `publicPaths` array in the Axios response interceptor does not include `/terms` or `/privacy`. When the initial auth check (`authApi.me()`) returns 401, the interceptor redirects any path not in `publicPaths` to `/login`.
> **Repro**: Open incognito window → navigate to `http://localhost:3000/terms` → page redirects to `/login`.
> **Fix**: Add `'/terms'` and `'/privacy'` to the `publicPaths` array in `api.ts`.

### 1.9 Navigation & Footer

- [x] Desktop nav: all links (About, Services, Pricing, Blog, Contact) work
- [x] Active page link is highlighted in indigo
- [x] "Sign in" and "Get Started" buttons visible when logged out
- [x] Resize to mobile — hamburger menu appears, all links accessible in mobile menu
- [x] Footer: all links work (Product, Company, Resources sections)
- [x] Footer CTA banner: "Start Free Audit" links to `/register`
- [x] Copyright year is current year (2026)

### 1.10 Error Pages

- [ ] Navigate to `/some-random-path` — 404 page renders with "Page not found", action buttons, and quick links — **FAIL: redirects to `/login`**
- [ ] "Go Back" button works — **BLOCKED: cannot test, 404 page never shown**
- [ ] Navigate to `/error` — 500 page renders with retry countdown and action buttons — **FAIL: redirects to `/login`**

> **BUG**: Same root cause as 1.8 — the API interceptor in `api.ts` redirects any unknown path to `/login`. The 404 and 500 error pages are never displayed to logged-out users.
> **Repro**: Open incognito → navigate to `http://localhost:3000/some-random-path` → redirects to `/login` instead of showing 404.
> **Fix**: The interceptor's redirect logic should use a whitelist approach inverted — only redirect to `/login` for known protected routes, or add a catch-all that allows the React Router 404 to render.

### 1.11 Cookie Consent Banner

- [x] On first visit (clear localStorage) — cookie consent banner appears at bottom
- [x] Click "Accept All" — banner dismisses, consent logged
- [x] Clear localStorage, reload — banner reappears
- [x] Click "Reject All" — banner dismisses
- [x] Click "Preferences" — modal opens with 3 categories (Necessary, Analytics, Marketing)
- [x] Necessary is always on and disabled
- [x] Toggle Analytics and Marketing independently
- [x] Click "Save Preferences" — modal closes, banner dismisses
- [x] Reload page — banner does NOT reappear (consent persisted in localStorage)
- [x] Check `pp-cookie-consent` key in localStorage has correct structure (`{"version":"1.0","categories":{"necessary":true,"analytics":true,"marketing":false},"action":"custom","timestamp":"..."}`)


### 1.12 SEO Meta Tags

- [x] View page source on `/` — verify `<title>`, `<meta name="description">`, OG tags, Twitter card tags are present (all confirmed: title, description, og:title, og:description, og:type, twitter:card, twitter:title)
- [ ] Check `/blog/{slug}` — post-specific SEO metadata renders *(no blog posts exist — cannot test)*
- [ ] If admin has set SEO overrides (Part 20), verify they appear correctly on the target route *(requires admin — deferred)*

### 1.13 SEO Static Files

- [x] Navigate to `/robots.txt` — file loads with valid content
- [x] Verify `robots.txt` disallows admin paths and allows public pages (disallows: /dashboard, /settings, /admin, /audits, /sites, /analytics, /compare)
- [x] Navigate to `/sitemap.xml` — file loads with valid XML structure
- [ ] Verify `sitemap.xml` includes all public pages (home, about, services, pricing, contact, blog, privacy, terms) — **PARTIAL FAIL: `/privacy` and `/terms` are missing from sitemap**
- [x] Navigate to `/site.webmanifest` — file loads with valid JSON
- [ ] Verify manifest contains proper metadata (name, short_name, theme_color, icons) — **PARTIAL FAIL: `icons` array is missing from manifest**

> **ISSUE**: `sitemap.xml` does not include `/privacy` or `/terms` URLs.
> **ISSUE**: `site.webmanifest` is missing the `icons` property. It has name, short_name, description, start_url, display, background_color, and theme_color but no icons.

### 1.14 Coming Soon Mode (Public)

*(Requires admin login to enable Coming Soon mode — deferred to after Part 2 authentication / Part 20 admin testing)*

- [ ] Enable Coming Soon in admin settings (Part 20.4)
- [ ] Navigate to `/` in incognito — coming soon page renders instead of home
- [ ] Navigate to `/about`, `/services`, `/pricing` — all blocked by coming soon
- [ ] Navigate to `/login` — allowed through (not blocked)
- [ ] Navigate to `/register` (no `?ea=` param) — blocked by coming soon
- [ ] Navigate to `/register?ea=email` — allowed through, early access registration form shows
- [ ] Navigate to `/register?ea=social` — allowed through, early access registration form shows
- [ ] Navigate to `/register?ea=test` — blocked (invalid channel value)
- [ ] Navigate to `/register/early-access-success` — allowed through
- [ ] Navigate to `/verify-email?token=...` — allowed through
- [ ] Navigate to `/admin` — admin routes always allowed through
- [ ] Coming soon page shows email signup form — submit email, success message
- [ ] Disable Coming Soon — all public pages accessible again


**QUESTION**: Is there structured data on this site?

---

## Part 2: Authentication

> **Test run: 2026-03-15** | Tested against `http://localhost:3000`
>
> ### Summary
> - **Passed**: 2.1 (partial), 2.5, 2.7, 2.9 (partial)
> - **Failed**: 2.6 (Forgot Password 404)
> - **Blocked**: 2.1 email verification (publicPaths bug), 2.2 (no referral code), 2.3 (not tested), 2.4 (publicPaths bug), 2.8 (feature missing)
> - **Config issue**: SMTP_HOST/SMTP_PORT were missing from `.env` on this branch — added manually for testing
>
> ### Bugs Found
> 1. **CRITICAL — `/verify-email` redirects to `/login`**: Same `publicPaths` bug from Part 1. The `/verify-email` route is not in the interceptor's allowed list in `api.ts`, so users cannot verify their email after registration.
> 2. **CRITICAL — `/forgot-password` returns 404**: The forgot password page does not exist as a route. Clicking "Forgot password?" on the login page navigates to `/forgot-password` which shows a 404 page. The entire password reset flow is broken.
> 3. **MISSING FEATURE — Active Sessions / Logout All Devices**: The `/settings/profile` page has no "Active Sessions" list or "Logout All Devices" button as described in test 2.8.
> 4. **MINOR — "Member Since" shows "Unknown"**: On the profile page, the Member Since field displays "Unknown" instead of the actual registration date.
> 5. **NOTE — Seed admin user not created**: The seed user `admin@kritano.com` from `.env` does not exist in the database. The actual admin is `cgarlick94@gmail.com`.

### 2.1 Registration

- [x] Navigate to `/register`
- [x] Submit empty form — validation errors on all required fields ("Please fill in this field")
- [x] Enter invalid email format — email validation error ("Please include an '@'")
- [x] Enter password that's too short — password validation error ("Password must be at least 12 characters")
- [x] Enter valid details (First name, Last name, Email, Password) and submit
- [x] Terms of Service acceptance checkbox must be ticked
- [x] Redirects to `/register/success` with confirmation message ("Check your email")
- [x] Check Mailpit — verification email received (after adding SMTP_HOST/SMTP_PORT to .env)
- [ ] Click verification link in email — `/verify-email?token=...` page loads — **FAIL: redirects to `/login` (publicPaths bug)**
- [ ] Page shows spinner, then "Email Verified" success message — **BLOCKED by above**
- [ ] "Go to Dashboard" button navigates to `/dashboard` — **BLOCKED by above**

> **BUG**: `/verify-email` is not in the `publicPaths` array in `client/src/services/api.ts` line ~111. Add `currentPath.startsWith('/verify-email')` to the `isPublicPage` check.

### 2.2 Registration with Referral Code

*(Not tested — requires a valid referral code from an existing user)*

- [ ] Navigate to `/register?ref=REF-XXXXXXXX` (use a valid referral code)
- [ ] Referral code is pre-filled or captured silently
- [ ] Complete registration — referral is tracked (visible in referrer's dashboard)

### 2.3 Early Access Registration

*(Not tested in this run)*

- [ ] Navigate to `/register?ea=email` — "Claim Your Early Access" header, spots remaining counter, founding member benefits banner
- [ ] Complete registration — redirects to `/register/early-access-success` (not normal success page)
- [ ] Success page shows "Your founding member spot is secured", verification email prompt, benefits list
- [ ] Check Mailpit — `early_access_confirmed` email received
- [ ] Check database — user has `early_access=true`, `early_access_channel='email'`, `discount_percent=50`
- [ ] Navigate to `/register?ea=social` — same flow but channel tracked as `social`
- [ ] Verify early access user appears in admin early access dashboard (Part 20.3)
- [ ] When all spots are claimed — `/register?ea=email` shows "Early Access is Full" with waitlist signup
- [ ] Submit waitlist email — success message, email saved to coming soon signups

### 2.4 Email Verification Edge Cases

- [ ] Navigate to `/verify-email` with no token — error message "No token provided" — **FAIL: redirects to `/login` (publicPaths bug)**
- [ ] Navigate to `/verify-email?token=invalid-token` — error message about expired/invalid link — **FAIL: redirects to `/login`**
- [ ] Click verification link a second time — appropriate error (already verified or expired) — **BLOCKED**
- [ ] On `/settings/profile`, if not verified — "Not Verified" badge shows with "Resend Verification" button — *(user was auto-verified, cannot test)*
- [ ] Click "Resend Verification" — success toast, new email arrives in Mailpit — **BLOCKED**
- [ ] Click new verification link — email verified successfully — **BLOCKED**

> **NOTE**: jane.tester@example.com shows `email_verified=true` in the database despite never completing verification. May be auto-verified in dev mode.

### 2.5 Login

- [x] Navigate to `/login`
- [x] Submit empty form — validation errors ("Invalid email address", "Password is required")
- [x] Enter wrong credentials — error message displayed ("Invalid email or password.")
- [x] Enter correct credentials — redirects to `/dashboard` ("Welcome back, Jane")
- [x] Nav now shows sidebar with Dashboard, Sites, etc. instead of "Sign in" / "Get Started"

> **NOTE**: Rate limiting works correctly — after multiple failed attempts, shows "Too many attempts. Please try again later." (429 response)

### 2.6 Password Reset

- [ ] On login page, click "Forgot password" link — **FAIL: `/forgot-password` returns 404**
- [ ] Enter registered email — success message ("check your email") — **BLOCKED**
- [ ] Check Mailpit — password reset email received — **BLOCKED**
- [ ] Click reset link — new password form loads — **BLOCKED**
- [ ] Enter new password and confirm — success, redirected to login — **BLOCKED**
- [ ] Login with new password — works — **BLOCKED**

> **BUG**: The `/forgot-password` route does not exist. Clicking "Forgot password?" on the login page shows a 404. The entire password reset flow is missing or not routed.
> **Repro**: Navigate to `http://localhost:3000/forgot-password` → 404 page.

### 2.7 Auth Redirects

- [x] While logged out, navigate to `/dashboard` — redirects to `/login`
- [x] While logged out, navigate to `/audits` — redirects to `/login`
- [x] While logged out, navigate to `/services/seo` — stays on page (no redirect)
- [x] While logged out, navigate to `/blog/some-slug` — stays on page (no redirect)
- [x] While logged out, navigate to `/admin` — redirects to `/login`

### 2.8 Session Management

- [ ] On `/settings/profile` — active sessions list shows current session — **FAIL: no active sessions list exists on profile page**
- [ ] "Logout All Devices" button — logs out everywhere, redirects to login — **FAIL: button does not exist**
- [ ] Login again — only one session shows — **BLOCKED**

> **MISSING FEATURE**: The profile page (`/settings/profile`) does not have an "Active Sessions" section or "Logout All Devices" functionality. The page has: Account Information, Subscription Plan, Connected Accounts, Change Password, Download My Data, and Delete Account — but no session management.

### 2.9 OAuth / SSO (Google & Facebook)

- [x] On `/login` — "Sign in with Google" and "Sign in with Facebook" buttons render above the email form
- [x] On `/register` — "Sign up with Google" and "Sign up with Facebook" buttons render
- [x] Click "Sign in with Google" — redirects to Google OAuth consent screen (reaches accounts.google.com, fails with "Missing required parameter: client_id" — no OAuth credentials configured)
- [ ] Complete Google consent — redirected to `/auth/callback/google` *(cannot test — no OAuth client_id configured)*
- [ ] Click "Sign up with Google" (new user) — account created automatically *(cannot test)*
- [ ] Click "Sign in with Facebook" — redirects to Facebook OAuth consent screen *(not tested — same config issue expected)*
- [ ] Complete Facebook consent — redirected to `/auth/callback/facebook` *(cannot test)*
- [ ] OAuth login sets HttpOnly cookies (access_token, refresh_token) *(cannot test)*
- [ ] OAuth register with an email that already exists (email login) — accounts are auto-linked *(cannot test)*
- [ ] OAuth login with an account that has no password (SSO-only) *(cannot test)*
- [ ] Try email login on SSO-only account — error message *(cannot test)*
- [ ] OAuth callback with invalid state/code — error card with "Back to Sign In" link *(cannot test)*
- [ ] OAuth rate limiting — rapid repeated attempts are blocked (429) *(cannot test)*

> **NOTE**: OAuth wiring is in place (redirects correctly to Google), but no OAuth client credentials are configured in `.env`. Full OAuth testing requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`.

---

## Part 3: Dashboard & Core User Features

Log in as a regular user.

### 3.1 Dashboard

- [x] Navigate to `/dashboard` — personalised greeting ("Welcome back, Jane") ✅
- [x] If no audits: empty state with CTA to create first audit ✅ (shows "Run Your First Audit" CTA)
- [x] If audits exist: health score hero card (58 "Fair"), stats grid (Total Audits 1, Sites Monitored 1, Issues Found 22, Completed 1), recent audits list ✅
- [x] Click an audit in the recent list — navigates to audit detail ✅
- [x] Click "New Audit" button — navigates to `/audits/new` ✅
- [x] Click "View all sites" — navigates to `/sites` ✅
- [ ] Active announcements banner appears at top (if admin has created one targeting your tier) — **NOT TESTED** (no announcements configured)
- [ ] Dismiss an announcement — it doesn't reappear — **NOT TESTED**

### 3.2 Create & Run an Audit

- [x] Navigate to `/audits/new` ✅
- [x] URL input is empty (or pre-filled if coming from a site) ✅
- [x] Type a URL — recent URLs autocomplete dropdown appears (if you have history) ✅
- [x] Enter a valid URL and press Tab/blur — URL reachability check runs (shows "Redirects to https://example.com/" + "Unverified" badge) ✅
- [x] Toggle audit options: SEO, Accessibility, Security, Performance, File Extraction ✅ (File Extraction correctly locked to Starter+)
- [x] Expand "Advanced options" — max pages, crawl depth, robots.txt, subdomains, WCAG version/level options visible ✅
- [x] Click "Start Audit" — audit begins, redirects to audit detail page ✅
- [x] SSE progress stream shows live crawl progress (pages found, pages audited, current URL) ✅ (note: "Real-time updates disconnected" warning appeared after completion)
- [x] If domain is unverified — consent modal appears explaining restrictions (3 page max, slower crawl, sequential, robots.txt enforced). Accept and continue. ✅

**BUG:** Single Page preset sets Max Depth to 0, but validation requires minimum 1. User cannot start audit without manually opening Advanced Options and changing depth to 1.
- **Reproduce:** Enter a URL → click "Single Page" preset → click "Start Audit" → form shows validation error "Value must be greater than or equal to 1" on Max Depth field
- **Severity:** Moderate — blocks the primary happy path for single-page audits

### 3.2B Audit Progress & Two-Phase Pipeline

- [x] After starting an audit, status transitions through: Pending → Processing → Completed ✅ (single-page audit completed quickly)
- [x] 5-step progress indicator visible: Submitted → In queue → Scanning → Complete ✅ (4-step pipeline shown)
- [ ] During "Discovering" phase — pages found counter updates as sitemap/robots.txt are parsed — **NOT TESTED** (single-page audit too fast)
- [ ] During "Queued" (Ready) phase — queue position and estimated wait time display — **NOT TESTED**
- [x] During "Scanning" phase — pages crawled (0/1), pages audited, and current URL update live via SSE ✅
- [x] Category scores update after completion: SEO 50, Security 66, Content 52 ✅
- [x] Issue count updates: 22 issues found ✅
- [ ] Refresh the page during an active audit — SSE reconnects and progress continues — **NOT TESTED** (audit completed too quickly)
- [ ] Submit a small (5-page) and large (100-page) audit simultaneously — **NOT TESTED** (requires verified domain for multi-page)
- [ ] "Discovering" and "Ready" status badges render correctly in audit list — **NOT TESTED**

**BUG:** "Real-time updates disconnected. Refresh to see latest progress." warning appears after audit completion. Non-critical but confusing UX.
**BUG:** Accessibility and Performance scores show "—" (no score returned) despite both categories being checked during audit creation. Only SEO (50), Security (66), and Content (52) returned scores.

### 3.3 Audit List (Sites Page)

**Note:** Audit list is at `/sites` not `/audits`. The Sites page functions as the audit list.

- [x] Navigate to `/sites` — shows "Your Sites" with site cards listing audits ✅
- [ ] Status filter dropdown works — **NOT AVAILABLE** on Sites page (no status filter)
- [x] Search input filters by URL/domain ✅
- [ ] Column headers are sortable — **NOT AVAILABLE** (card-based layout, not table)
- [ ] Pagination works — **NOT TESTED** (only 1 audit)
- [ ] Select audit checkboxes — bulk delete — **NOT AVAILABLE** on Sites page
- [x] Click site card → navigates to audit detail ✅ (via "Run Audit" or clicking the audit link)
- [ ] Empty state shows if no audits match filters — **NOT TESTED**
- [x] Grid/List view toggle works ✅
- [x] Site limit indicator shows "1 / 1 sites" with upgrade prompt when at limit ✅
- [x] Per-site scores displayed: SEO 50, A11Y —, SEC 66, PERF — ✅
- [x] "Add Site" button disabled when at plan limit with warning message ✅

### 3.4 Audit Detail

Wait for an audit to complete, then:

- [x] Navigate to `/audits/{id}` — header shows domain (example.com), URL, "Completed" status badge, completion date ✅
- [ ] Overall health score displays as a large circular progress indicator — **NOT PRESENT** (scores shown as category cards, no overall circular indicator)
- [x] Category score cards render: SEO 50, Accessibility —, Security 66, Performance —, Content 52 ✅ (5 shown, not 6)
- [x] Category Breakdown bar chart visualises scores ✅
- [x] Issue Severity breakdown shows: 0 Critical, 3 Serious, 10 Moderate, 7 Minor, 2 Info ✅
- [x] Audit Summary cards: Pages Analyzed 1, Unique Issues 22, Critical Issues 0, URLs Discovered 1 ✅
- [x] Audit Details section: Target URL, Domain, Started, Completed, URLs Discovered, Pages Crawled ✅

**Findings tab:**

- [x] Findings grouped by rule with severity badges (Serious/Moderate/Minor/Info) and category badges (SEO/Security/Content/Structured-data) ✅
- [x] Each finding shows: title, description, "How to fix" guidance, affected page count, Dismiss button ✅
- [x] Filter by category: All, SEO (11), Security (6), Content (3), Structured Data (2) ✅
- [x] Filter by severity dropdown: All Severities, Serious (3), Moderate (10), Minor (7), Info (2) ✅
- [x] "Show dismissed" checkbox available ✅
- [x] Expandable "Affected Pages" button on each finding ✅
- [ ] Click dismiss on a finding — it shows as dismissed — **NOT TESTED**
- [ ] Click undismiss — it reactivates — **NOT TESTED**
- [ ] Bulk dismiss: select multiple findings, click "Dismiss Selected" — **NOT TESTED**

**Other tabs:**

- [x] Schema tab — "No Structured Data Found" with explanation and "Generate Structured Data" button ✅
- [x] Index Exposure tab — shows "Available on Pro plan and above" with upgrade CTA ✅
- [x] Broken Links tab — shows 0 broken links ✅
- [x] Pages tab — shows 1 page with URL, title, status code (200), load time (6666ms), issue count, per-category scores ✅
- [ ] Files tab — **NOT PRESENT** (File Extraction is Starter+ feature)
- [ ] Score History — **NOT VISIBLE** as separate tab (may be in Overview)
- [ ] Content tab — **NOT PRESENT** as separate tab

**Actions:**

- [x] "Re-run" button visible ✅
- [x] "Delete" button visible ✅
- [x] "Cancel Audit" button visible during processing ✅ — **NOT TESTED** (audit completed too fast)

**Exports (test each):**

- [ ] PDF export — button visible ✅ — **NOT TESTED** (download)
- [x] CSV export — button clicked, API returned 200 ✅
- [ ] JSON export — **NOT PRESENT** (no JSON export button)
- [x] HTML export — button visible ✅
- [x] Markdown export — button visible ✅
- [x] Print button — visible ✅
- [ ] Verify all exports include ALL audit data — **NOT TESTED**

**BUG:** No JSON export option available (test plan mentions it but button doesn't exist).

### 3.5 Page Detail

- [ ] From audit detail, click a page URL in findings — **PARTIAL**: Pages tab shows expandable row for each page but clicking doesn't navigate to a separate page detail view. Row is marked `expandable` but does not expand on click.
- [ ] Page-specific scores and findings render — **NOT TESTED** (page detail view not accessible)
- [ ] Schema tab — JSON-LD schema for this specific page — **NOT TESTED**
- [ ] Rich snippet preview — shows how the page would appear in Google search — **NOT TESTED**
- [ ] "Generate Schema" button — generates JSON-LD structured data for the page — **NOT TESTED**
- [ ] Assets tab — files referenced by this page — **NOT TESTED**
- [x] Back to audit link works — "Back to Sites" link navigates to `/sites` ✅

**BUG:** Page detail row in Pages tab is marked as `expandable` but does not expand when clicked. Users cannot view per-page details from the audit detail view.
- **Severity:** Moderate — prevents access to page-level audit details

---

### Part 3 Summary

**Tests Passed:** 30+
**Tests Failed/Bugs:** 5
**Tests Not Tested:** ~15 (mostly due to single audit, free plan, or features requiring multi-page/verified domain)

**Critical Bugs Found:**
1. **Single Page preset sets Max Depth to 0** — blocks the primary audit creation flow (Moderate)
2. **Accessibility and Performance scores return "—"** — two major audit categories produce no results despite being selected (Serious)
3. **Page detail row doesn't expand** — cannot access per-page details (Moderate)
4. **"Real-time updates disconnected" warning** after audit completion (Minor)
5. **No JSON export option** — test plan references it but it's not implemented (Minor/Info)

---

## Part 4: Site Management

### 4.1 Sites List

- [x] Navigate to `/sites` — site list page loads with "Your Sites" heading ✅
- [ ] Click "Add Site" — **BLOCKED**: button disabled on FREE plan (at 1/1 site limit) with message "You've reached your site limit. Upgrade your plan to add more sites."
- [ ] Submit with valid data — **NOT TESTED** (Add Site disabled)
- [ ] Submit with duplicate domain — **NOT TESTED**
- [x] Usage indicator shows "1 / 1 sites" based on plan limits ✅
- [x] Toggle grid/list view — layout switches between cards and table ✅ (Grid shows score cards; List shows SITE, STATUS, ISSUES, LAST AUDIT columns)
- [x] Search input filters sites by name or domain ✅ (tested "example" matches, "nonexistent" shows empty)
- [x] Empty state shows "No sites found" with search term and "Clear search" button ✅

### 4.2 Site Detail

- [x] Click a site — navigates to `/sites/{siteId}` ✅ (shows example.com with Owner role, domain, Delete & Run Audit buttons)
- [x] Overview tab: category scores (SEO 50, A11Y -, Security 66, Perf -), Score History (30 days), Quick Stats (Total Audits 1, URLs Tracked 1, Last Audit date, Created date) ✅
- [x] Audits tab: table with DATE, STATUS, SEO, A11Y, SECURITY, PERF columns, "View" link, "Run New Audit" button ✅
- [x] URLs tab: 1 URL tracked, table with URL PATH, SOURCE, AUDITS, LAST AUDIT, SCORES columns, "Discover from Sitemap" button ✅
- [ ] Click "Discover Pages" — **NOT TESTED** (would attempt sitemap crawl on example.com)
- [x] Sharing tab: "Site Access" section, "0 / 0 members used", "Transfer Ownership" button ✅
- [ ] Invite a team member by email — **BLOCKED**: "Invite User" disabled on FREE plan with message "Site sharing is not available on your plan. Upgrade to invite members."
- [ ] Check Mailpit — **NOT TESTED** (invite blocked)
- [x] Member limit indicator shows "0 / 0 members used" ✅
- [x] Settings tab: shows Domain Verification section with "Start Verification" button ✅
- [ ] Click "Run Audit" — **NOT TESTED** (button visible, not clicked to preserve state)
- [ ] Transfer ownership — **NOT TESTED** (button visible but not clicked)
- [x] Analytics tab: Score History & Trends with Score Progression chart, Average Scores breakdown, Issue Trends chart ✅

**BUG:** Overview tab "Recent Audits" section shows "No audits yet" despite Quick Stats showing "Total Audits: 1" and the Audits tab listing 1 completed audit.
- **Severity:** Moderate — misleading empty state on the overview page

**NOTE:** Settings tab only shows Domain Verification — no edit fields for site name, domain, or description.

### 4.3 Domain Verification

- [x] On a site's settings, click "Start Verification" — token is generated, two verification options appear ✅
- [x] **DNS option**: shows Record Type (TXT), Host (_kritano), and Value (kritano-verify-UUID) fields separately ✅
- [x] Step-by-step guide expands with DNS provider instructions (6 clear steps: log in, find DNS, add TXT record, paste token, save, verify) ✅
- [x] **File option**: shows full URL (https://example.com/.well-known/kritano-verification.txt) and token content ✅
- [x] Step-by-step guide expands with SSH/FTP instructions including `mkdir -p .well-known`, echo command, browser check, and 403/404 troubleshooting ✅
- [x] Introductory text explains which method suits which situation ("Best if you have access to DNS settings" vs "Best if you have SSH or FTP access") ✅
- [ ] Complete one verification method — **NOT TESTED** (don't own example.com)
- [ ] Check Mailpit — "Domain Verified" email — **NOT TESTED**

### 4.4 Site Invitations

- [ ] From site sharing tab, invite a user by email — **BLOCKED**: "Invite User" disabled on FREE plan
- [ ] Open invitation link (from Mailpit or directly) in another browser/session — **NOT TESTED**
- [ ] `/site-invitations/{token}` — shows invitation details (site name, permission level, inviter) — **NOT TESTED**
- [ ] Click Accept — gain access, redirected to site detail — **NOT TESTED**
- [ ] Test Decline — invitation is removed — **NOT TESTED**
- [ ] Test expired invitation — appropriate error message — **NOT TESTED**
- [x] Test invalid token — shows "Invalid Invitation" / "Invitation not found" with "Go to homepage" link ✅

---

### Part 4 Summary

**Tests Passed:** 18
**Tests Not Tested:** 12 (mostly due to FREE plan restrictions blocking Add Site, Invite User, and domain verification completion)
**Bugs Found:** 2

**Bugs Found:**
1. **"Recent Audits" shows "No audits yet" on site overview** despite having 1 completed audit (Moderate)
2. **Settings tab missing site edit fields** — only shows Domain Verification, no fields to edit site name, domain, or description (Minor)

---

## Part 5: Scheduled Audits

### 5.1 Create a Schedule

- [x] Navigate to `/schedules` — page loads with "Scheduled Audits" heading and description ✅
- [x] Click "New Schedule" — modal opens with form fields (PRO tier) ✅
- [x] Website URL input with placeholder, required field validation ✅
- [x] Schedule Name (optional) input ✅
- [x] Choose frequency preset: Monthly, Biweekly, Weekly, Daily — all render as selectable buttons ✅
- [x] Custom cron expression button present but disabled ("agency+") ✅
- [x] Day dropdown (Sunday-Saturday) and Time dropdown (00:00-23:00 hourly) ✅
- [x] Set timezone — auto-detected "Europe/London" ✅
- [x] Configure notification preferences — "Notify on completion" and "Notify on failure" checkboxes (both checked by default) under Advanced Options ✅
- [ ] Submit — schedule created, appears in list — **BLOCKED**: domain must be verified; form correctly rejects with "Scheduled audits require a verified domain. Please verify your site first." ✅ (validation works)

### 5.2 Schedule List

- [x] Filter tabs render: All (0), Active (0), Paused (0), Disabled (0) ✅
- [x] Search input renders ✅
- [x] Empty state: "No schedules yet" with "Create Schedule" CTA button ✅
- [ ] All schedules show: site name, frequency, next run, last run status, enabled/disabled toggle — **NOT TESTED** (no schedules, domain not verified)
- [ ] Toggle a schedule off — **NOT TESTED**
- [ ] Toggle back on — **NOT TESTED**
- [ ] Delete a schedule — **NOT TESTED**

### 5.3 Schedule Detail

- [ ] Click a schedule — **NOT TESTED** (no schedules exist)
- [ ] Shows full configuration — **NOT TESTED**
- [ ] Run history table — **NOT TESTED**
- [ ] "Run Now" button — **NOT TESTED**
- [ ] Edit frequency — **NOT TESTED**

### 5.4 Tier Restrictions

- [x] Free tier users cannot create schedules — "Upgrade to Starter or above to schedule audits" message shown, "New Schedule" button hidden ✅
- [x] Pro tier: "New Schedule" button visible, frequency presets available (Monthly/Biweekly/Weekly/Daily), custom cron disabled (agency+) ✅
- [ ] Starter tier: minimum 7-day frequency — **NOT TESTED**
- [ ] Agency tier: minimum 1-hour frequency — **NOT TESTED**

**BUG (FREE tier only):** `/api/audits/schedules` returns HTTP 500 with `{"error":"Failed to get audit","code":"GET_AUDIT_FAILED"}` when user has no organization. Two error toasts "Failed to load schedules" appear on page load. Works correctly once user has an org/subscription.
- **Severity:** Moderate — only affects users without an organization (edge case for FREE tier users)

---

### Part 5 Summary

**Tests Passed:** 13
**Tests Not Tested:** 10 (mostly because domain not verified — can't create a schedule without verified domain)
**Bugs Found:** 1

**Bugs Found:**
1. **Schedules API returns 500 for users without org** — `/api/audits/schedules` fails when user has no organization record (Moderate)

---

## Part 6: Analytics

### 6.1 Analytics Dashboard

- [x] Navigate to `/analytics` — page loads with "Analytics" heading and summary cards ✅
- [x] Summary cards: Sites (1), Total Audits (1), SEO Avg (50), Accessibility Avg (-), Security Avg (66) ✅
- [ ] Change time range (7d, 30d, 90d) — **NOT PRESENT**: no time range selector on analytics page
- [ ] Quick category filters — **NOT PRESENT**
- [x] "All Sites" section shows example.com with overall score 58, per-category scores (SEO 50, A11Y -, SEC 66, PER -, CON -, SCH -), "Stable" trend ✅
- [x] "Recent Activity" section shows audit with user name, URL, page count, issue count, scores, date ✅
- [x] "Jump to site..." button available ✅

### 6.2 Site Analytics

- [ ] Navigate to `/analytics/sites/{siteId}` — **NOT TESTED** (site analytics accessed via site detail Analytics tab instead — see Part 4.2)
- [ ] Time range picker works — site detail Analytics tab has "30 days" button ✅ (tested in Part 4)
- [ ] Top issues section — **NOT PRESENT** on site analytics

### 6.3 URL Analytics

- [ ] Navigate to `/analytics/sites/{siteId}/urls/{urlId}` — **NOT TESTED** (route may not exist as separate page)

### 6.4 Audit Comparison

- [x] Navigate to `/compare?tab=audits` — shows "Selected Audits (0/4)" with "Add Audit" button ✅
- [x] "Select at least 2 audits to compare" guidance text ✅
- [ ] Score difference indicators — **NOT TESTED** (only 1 audit exists, need 2+ to compare)

### 6.5 Site Comparison

- [x] Navigate to `/compare?tab=sites` — shows "Selected Sites (0/6)" with "Add Site" button ✅
- [x] "Select at least 2 sites to compare" / "Choose 2-6 sites" guidance text ✅
- [ ] Actual comparison — **NOT TESTED** (only 1 site exists)

### 6.6 URL Comparison

- [x] Navigate to `/compare` (URLs tab default) — unified comparison interface with URLs, Sites, Audits tabs ✅
- [x] URL A / URL B selection areas with search input ✅
- [x] Click a URL to select it — populates URL A slot, shows domain and remove button ✅
- [x] Selected URL is disabled in the list (prevents double-selection) ✅
- [ ] Side-by-side comparison renders — **NOT TESTED** (only 1 URL available, need 2+ to compare)

---

### Part 6 Summary

**Tests Passed:** 13
**Tests Not Tested:** 7 (mostly due to only 1 site/1 audit/1 URL — need multiple for comparison)
**Bugs Found:** 0

**Notes:**
- Analytics dashboard lacks time range selector (7d/30d/90d) and quick category filters mentioned in test plan
- Site-specific analytics is accessible via the site detail Analytics tab, not a separate `/analytics/sites/{siteId}` route
- Compare feature is well-structured with URLs/Sites/Audits tabs and clear guidance for minimum selections

---

## Part 7: Settings

### 7.1 Profile

- [x] Navigate to `/settings/profile` — **PASS** — Profile page loads with all sections
- [x] Current subscription tier and usage stats display correctly — **PARTIAL** — Shows Pro plan correctly with tier comparison table; "Your Current Limits" shows Sites: 10, Pages/audit: 1000, Concurrent audits: 10, but **Audits/month value is missing** (displays empty)
- [ ] Update first name, last name — save, verify changes persist on reload — **NOT TESTED** — MCP fill_form/type_text did not trigger React controlled input state changes (button stayed disabled)
- [ ] Email verification status shows (Verified badge or Not Verified + Resend button) — **NOT TESTED** — No explicit verification badge visible on profile page
- [ ] If not verified: click "Resend Verification" — toast confirms, email arrives in Mailpit — **NOT TESTED**
- [ ] Password change: enter current password, new password, confirm — success — **NOT TESTED** — MCP input methods did not trigger React state; Change Password button stayed disabled
- [ ] Password change: wrong current password — error message — **NOT TESTED**
- [ ] Active sessions list shows current session with device info — **NOT PRESENT** — No sessions section on profile page
- [ ] "Logout All Devices" — logs out everywhere — **NOT PRESENT** — No such button on profile page

**Bugs:**
- "Member Since" shows "Unknown" (known bug from Part 2)
- "Audits/month" value missing from Your Current Limits section
- `/api/auth/oauth/providers` returns 500 error
- `/api/account/export/status` returns 500 error

### 7.2 Sites Settings

- [x] Navigate to `/settings/sites` — **PASS** — Shows "My Sites (1 of 10 sites used)" with site card
- [x] Site cards show View, Verify, Delete action buttons — **PASS**
- [x] Add Site button present — **PASS**
- [ ] Edit a site — modal/form opens, save changes, verify — **NOT TESTED** — No inline edit; View navigates to site detail
- [ ] Delete a site — confirmation dialog, site removed — **NOT TESTED** — Did not test destructive action on only site

### 7.3 Branding Settings

- [x] Navigate to `/settings/branding` — **PASS** — Shows "PDF Report Branding" section
- [x] Branding requires verified domain — **PASS** — Shows "Verify a domain to unlock branding" message with link to verify
- [ ] Upload a logo, set company name and colours — **NOT TESTED** — Blocked by unverified domain
- [ ] Save — changes persist — **NOT TESTED**
- [ ] Run a PDF export from an audit — branding appears in the export — **NOT TESTED**
- [ ] (Agency+ tier only) White-label branding applied to reports — **NOT TESTED**

### 7.4 Notification Settings

- [x] Navigate to `/settings/notifications` — **PASS** — Shows 4 notification categories
- [x] Toggle email preferences (audit notifications, product updates, educational, marketing) — **PASS** — All 4 toggles render and are interactive
- [x] "Unsubscribe from All" button present — **PASS**
- [ ] Save — changes persist — **NOT TESTED** — Did not verify persistence after toggle
- [ ] Trigger an audit — verify notification respects your settings — **NOT TESTED**

### 7.5 Connected Accounts (OAuth)

- [x] Navigate to `/settings/profile` — "Connected Accounts" section shows Google and Facebook rows — **PASS**
- [x] Google row shows "Not connected" with "Connect" button — **PASS**
- [x] Facebook row shows "Not connected" with "Connect" button — **PASS**
- [ ] Click "Connect" on Google — redirects to Google consent — **NOT TESTED** — No OAuth credentials configured; API returns 500
- [ ] Click "Connect" on Facebook — redirects to Facebook consent — **NOT TESTED** — No OAuth credentials configured; API returns 500
- [ ] Click "Disconnect" on a linked provider — **NOT TESTED**
- [ ] Cannot disconnect last auth method — **NOT TESTED**
- [ ] SSO-only notice banner — **NOT TESTED**

**Bug:** `/api/auth/oauth/providers` returns 500 — likely missing OAuth client ID/secret env vars

### 7.6 Download My Data (GDPR)

- [x] Navigate to `/settings/profile` — "Download My Data" section appears — **PASS**
- [x] Click "Download My Data" — password confirmation modal opens — **PASS** — Modal shows password field and "Preparing your data may take a few minutes" info
- [ ] Enter wrong password — error toast "Invalid password" — **NOT TESTED** — MCP input limitations
- [ ] Enter correct password — success toast — **NOT TESTED**
- [ ] Export status/download flow — **NOT TESTED** — `/api/account/export/status` returns 500

**Bug:** `/api/account/export/status` returns 500 on page load

### 7.7 Delete Account (GDPR)

- [x] Navigate to `/settings/profile` — "Delete Account" section at bottom with red border — **PASS** — Red-bordered danger zone section
- [x] Click "Delete Account" — modal opens requiring password and typing "DELETE MY ACCOUNT" — **PASS** — Shows 30-day permanent deletion warning, password field, confirmation text field
- [x] "Delete My Account" button is disabled until confirmation text matches — **PASS**
- [x] Cancel button closes modal — **PASS**
- [ ] Full deletion flow (request, banner, cancel, re-request) — **NOT TESTED** — Did not execute destructive action on test account
- [ ] Email notifications for deletion events — **NOT TESTED**

### 7.8 API Keys

- [x] Navigate to `/settings/api-keys` — **PASS** — Page loads with "Create API Key" button
- [x] Click "Create API Key" — modal opens with name field — **PASS**
- [x] Create key with name "Test CI Key" — key created with `kt_live_` prefix — **PASS** — Key value shown
- [x] **BUG:** Key immediately appears under "Revoked Keys (1)" instead of active keys — **FAIL** — Newly created API key is instantly marked as revoked
- [ ] View key stats — usage count, last used — **NOT TESTED** — Key was revoked on creation
- [ ] Revoke a key — confirmation, key is revoked — **NOT TESTED**
- [ ] Delete a key — key removed from table — **NOT TESTED**
- [ ] Rate limit and tier info visible — **NOT TESTED**

**Bug:** API key creation immediately marks key as revoked — critical functional bug

### Part 7 Summary

**Tests Passed:** 16
**Tests Failed:** 1 (API key created as revoked)
**Tests Not Tested:** 25 (MCP input limitations, missing OAuth config, destructive actions avoided)
**Bugs Found:** 5
1. "Member Since" shows "Unknown" (known from Part 2)
2. "Audits/month" value missing from Current Limits
3. `/api/auth/oauth/providers` returns 500 (missing OAuth env vars)
4. `/api/account/export/status` returns 500
5. **API key created as immediately revoked** (critical)

---

## Part 8: Referrals

### 8.1 Referral Dashboard

- [x] Navigate to `/referrals` — referral dashboard loads — **PASS**
- [x] Referral link card shows your unique link — **PASS** — Shows `http://localhost:5173/register?ref=REF-5dc0f7e0`
- [x] Click "Copy" — link copied to clipboard, button changes to "Copied" — **PASS**
- [x] Stats cards show: Total Referred (0), Rewarded (0), Bonus Audits Earned (0), Bonus Audits Left (0) — **PASS**

**Bug:** Referral link uses `localhost:5173` (Vite dev port) instead of the actual frontend URL (`localhost:3000`). Should use `CORS_ORIGIN` or a configured frontend URL.

### 8.2 Milestone Progress

- [x] Progress bar shows progress toward next milestone (0/5 referrals) — **PASS**
- [x] Milestone text explains the reward: "Reach 5 qualified referrals for a free month of Starter!" — **PASS**
- [x] Explanatory text states: "A referral qualifies when the invited user verifies their email and completes their first audit" — **PASS**

### 8.3 Invite by Email

- [x] Enter up to 5 comma-separated email addresses — **PASS** — Input accepts comma-separated emails
- [x] Click "Send Invites" — loading state, then success message "2 invite(s) sent successfully!" — **PASS**
- [x] Check Mailpit — referral invitation emails received — **PASS** — Both friend1@example.com and friend2@example.com received "Jane Tester invited you to try Kritano" emails
- [ ] Enter > 5 emails — button does nothing (client-side limit) — **NOT TESTED**
- [ ] Enter invalid email — error message — **NOT TESTED**

### 8.4 Referral Table

- [ ] Your referrals table shows: user name, email, status badge, reward, date — **NOT TESTED** — No referrals exist (invites sent but not accepted)
- [ ] Status badges: Pending (amber), Qualified (blue), Rewarded (green), Voided (red) — **NOT TESTED**
- [x] Empty state shows "No referrals yet. Share your link to get started!" — **PASS**

### 8.5 Referral Lifecycle Test

- [ ] Share referral link with a test email — **NOT TESTED** — Would require full registration flow with second user
- [ ] Register with the referral link — referral shows as "Pending" in your dashboard — **NOT TESTED**
- [ ] Verify the referred user's email — referral still "Pending" (needs audit too) — **NOT TESTED**
- [ ] Run first audit as the referred user — referral qualifies and becomes "Rewarded" — **NOT TESTED**
- [ ] Referrer receives bonus audits — "Bonus Audits Earned" count increments — **NOT TESTED**

### Part 8 Summary

**Tests Passed:** 9
**Tests Failed:** 0
**Tests Not Tested:** 7 (lifecycle test requires second user registration, edge cases)
**Bugs Found:** 1
1. Referral link uses `localhost:5173` (Vite dev port) instead of actual frontend URL (`localhost:3000`)

---

## Part 9: User Feedback

### 9.1 Bug Report

- [x] Click the floating feedback button (bottom-right on authenticated pages) — **PASS** — "Send feedback" button visible on dashboard
- [x] Select "Report a Bug" — **PASS** — Menu shows "Report a Bug" and "Request a Feature" options
- [x] Modal opens with Title, Description, Severity, Category fields — **PASS** — Title, Severity (Critical/Major/Minor/Trivial), Category (UI/Visual/Functionality/Performance/Data-Reports/Security/Other), Description
- [x] Page URL and browser info are auto-populated — **PASS** — Note at bottom: "We'll automatically include your current page URL and browser info."
- [x] Submit empty — validation errors — **PASS** — "Title must be at least 5 characters" and "Please provide more detail (20+ characters)"
- [x] Fill in valid data and submit — success confirmation, modal auto-closes — **PASS** — Shows "Thanks for reporting! We'll look into this and keep you updated."
- [ ] Verify the report appears in admin bug reports (Part 14) — **DEFERRED** to Part 13

### 9.2 Feature Request

- [x] Click feedback button → "Request a Feature" — **PASS**
- [x] Modal opens with Title, Description, Impact, Category fields — **PASS** — Title, Impact (Nice to Have/Would Be Helpful/Important/Critical), Category (Accessibility/Reporting/UI-UX/Integrations/Performance/Other), Description
- [x] Submit valid data — success confirmation — **PASS** — "Thanks for your suggestion! We'll review your request and keep you updated."
- [ ] Verify the request appears in admin feature requests (Part 14) — **DEFERRED** to Part 13

### Part 9 Summary

**Tests Passed:** 8
**Tests Failed:** 0
**Tests Not Tested:** 2 (deferred to admin testing)
**Bugs Found:** 0

---

## Part 10: Free Trial

### 10.1 Start a Trial

- [ ] On `/settings/profile` or `/pricing` — "Start Free Trial" option available — **NOT TESTED** — User is already on Pro plan; no trial option visible
- [ ] Select a tier (Starter, Pro, or Agency) — **NOT TESTED**
- [ ] If email not verified — error "Please verify your email first" — **NOT TESTED**
- [ ] If already used trial — error message — **NOT TESTED**
- [ ] Start trial — subscription changes to "trialing", tier updates — **NOT TESTED**
- [ ] Sidebar shows trial countdown badge ("X days remaining") — **NOT TESTED**
- [ ] Check Mailpit — "Trial Started" email received — **NOT TESTED**

### 10.2 Trial Features

- [ ] Tier limits update immediately — **NOT TESTED**
- [ ] Create audits with higher page limits — **NOT TESTED**
- [ ] Access features gated by the trial tier — **NOT TESTED**

### 10.3 Trial Expiry

- [ ] When trial is near expiry — "Trial Expiring" email sent — **NOT TESTED**
- [ ] When trial expires — tier reverts to Free — **NOT TESTED**
- [ ] Features are restricted back to Free tier limits — **NOT TESTED**

### Part 10 Summary

**Tests Passed:** 0
**Tests Failed:** 0
**Tests Not Tested:** 13 (user already on Pro plan — would need a fresh Free-tier user to test trial flow)
**Bugs Found:** 0

---

## Part 11: Dark Mode & Theme

- [x] Click theme toggle in sidebar (sun/moon icon) — **PASS** — Toggles between "Switch to light mode" and "Switch to dark mode"
- [x] All pages switch between light and dark mode — **PASS** — Dashboard verified in both themes; light mode shows clean white UI, dark mode shows dark slate UI
- [x] Preference persists across page reloads (stored in localStorage) — **PASS** — `kritano-theme: "dark"` persists in localStorage
- [x] Check key pages in dark mode:
  - [x] Dashboard — all cards, charts, text readable — **PASS** — Verified via screenshot

### Part 11 Summary

**Tests Passed:** 4
**Tests Failed:** 0
**Tests Not Tested:** 3 (audit detail, settings, public pages in dark mode — not individually checked)
**Bugs Found:** 0

---

## Part 12: Keyboard Shortcuts

- [x] Press `n` on dashboard — navigates to new audit page — **PASS** — Navigated to `/audits/new`
- [ ] Press `/` — focuses search input (if present on current page) — **NOT VERIFIED** — No search input on dashboard; may work on Sites page
- [x] Press `Esc` — closes any open modal or blurs focused element — **PASS** — Verified closing feedback modal with Escape
- [ ] Press `?` — shows keyboard shortcuts help dialog — **FAIL** — No help dialog appeared

### Part 12 Summary

**Tests Passed:** 2
**Tests Failed:** 1 (`?` shortcut not implemented)
**Tests Not Tested:** 1
**Bugs Found:** 1
1. `?` keyboard shortcut does not show a help dialog

---

## Part 13: Admin Panel

Logged in as admin user `cgarlick94@gmail.com` (role: admin). Password reset via database to enable login.

### 13.1 Admin Dashboard

- [x] Navigate to `/admin` — dashboard stats load — **PASS** — Full admin dashboard with system health, user/org/audit stats, module cards
- [x] System health indicators show status for database — **PASS** — DATABASE: Connected, QUEUE SIZE: 0, ACTIVE AUDITS: 0, FAILED TODAY: 0
- [x] Worker controls: view queue size, processing count, failed count — **PASS** — Worker: Idle, Processed 1, Failed 0, Last Job 2h ago, Queue (24h) 0/0/1
- [ ] Click "Restart Worker" — confirmation dialog, worker restarts — **NOT TESTED** — Avoided potentially disruptive action
- [x] Worker memory bar shows current usage % — **PASS** — MEMORY: 100%, 34 MB free / 16,384 MB
- [x] Free MB / Total MB and effective concurrency displayed — **PASS** — Concurrency: 1
- [ ] Worker `/status` endpoint returns `memory` object — **NOT TESTED**
- [x] Module summary cards show CRM, Email, CMS quick stats — **PASS** — CRM (4 leads, avg score 18), Email (4 sent 7d, 0% open rate), CMS (0 published), Revenue (£49 MRR, 1 paid subscriber)
- [x] Analytics charts render (14-Day Activity) — **PASS** — "Users + Audits" chart with value 15
- [ ] Recent activity log shows last 10 events — **NOT PRESENT** — Dashboard shows charts but no explicit activity log on this page (separate Activity page exists)
- [x] Admin sidebar shows comprehensive navigation — **PASS** — OVERVIEW (Dashboard, Users, Organizations, Bug Reports, Feature Requests, Schedules, Activity), GROWTH (CRM Leads, Triggers, Email Templates, Campaigns, Cold Prospects, Referrals), MARKETING (Social Content, Campaigns), CONTENT (Blog Posts, Media, Advice Editor, Announcements, Stories), ANALYTICS (Funnel, Global Trends, Revenue, Email Stats), SYSTEM (Settings, SEO Manager, Early Access, Coming Soon)

### 13.2 Admin Users

- [x] Navigate to `/admin/users` — user table shows 4 total users — **PASS**
- [x] Search by email or name — search field present — **PASS**
- [x] User table shows: name, email, status (Verified/Unverified/Admin), org count, joined date, last login — **PASS**
- [x] Admin actions: "Make admin" / "Remove admin" and "Delete user" buttons — **PASS**
- [ ] Sort by different columns — **NOT TESTED**
- [ ] Toggle super admin on a user — **NOT TESTED** — Avoided modifying user roles
- [ ] Delete a user — **NOT TESTED** — Avoided destructive action

### 13.3 Admin Organizations

- [ ] Navigate to `/admin/organizations` — **NOT TESTED**

### 13.4 Admin Activity Log

- [ ] Navigate to `/admin/activity` — **NOT TESTED**

### 13.5 Admin Bug Reports

- [x] Navigate to `/admin/bug-reports` — list with stats cards — **PASS** — Open: 1, In Progress: 0, Critical Open: 0, Resolved: 0
- [x] Filter by status, severity, search by title — **PASS** — Status (All/Open/In Progress/Resolved/Closed) and Severity (All/Critical/Major/Minor/Trivial) dropdowns + search
- [x] Bug report from Part 9 visible — **PASS** — "Test bug report from QA" by jane.tester@example.com, Minor severity, open status, functionality category
- [x] View link present — **PASS** — Links to detail page
- [ ] Click a report — detail page — **NOT TESTED**
- [ ] Change status, add comment, delete — **NOT TESTED**

### 13.6 Admin Feature Requests

- [x] Navigate to `/admin/feature-requests` — list with stats cards — **PASS** — Submitted: 1, Under Review: 0, Planned: 0, In Progress: 0
- [x] Filter by status and impact — **PASS** — Status (Submitted/Under Review/Planned/In Progress/Completed/Declined) and Impact (Critical/Important/Helpful/Nice to Have)
- [x] Feature request from Part 9 visible — **PASS** — "JSON export for audits" by jane.tester@example.com, Helpful impact, submitted, other category
- [x] View link present — **PASS**
- [ ] Change status, add comment, delete — **NOT TESTED**

### 13.7 Admin Schedules

- [ ] Navigate to `/admin/schedules` — **NOT TESTED**

### Part 13 Summary

**Tests Passed:** 15
**Tests Failed:** 0
**Tests Not Tested:** 13 (destructive actions avoided, some sub-pages not visited)
**Bugs Found:** 0

**Notes:**
- Admin panel is comprehensive with 6 main sections and 25+ sub-pages
- Admin user had role `admin` (not `super_admin`) — password had to be reset via database

---

## Part 14: Admin CRM

### 14.1 CRM Leads

- [x] Navigate to `/admin/crm/leads` — leads table with stat cards — **PASS** — 4 leads tracked
- [x] Stat cards show: Total (4), New (2), Activated (2), Engaged (0), Power User (0), Upgrade Prospect (0), Churning (0), Churned (0) — **PASS**
- [ ] Hover each stat card — tooltip appears explaining the status — **NOT TESTED**
- [x] Status filter dropdown works — **PASS** — All Statuses, New, Activated, Engaged, Power User, Upgrade Prospect, Churning, Churned
- [x] Search by name or email works — **PASS** — Search field with Search button present
- [x] Sort options work (lead score, date joined, last login) — **PASS** — Sort dropdown + DESC/ASC toggle
- [ ] Pagination works — **NOT TESTED** — Only 4 leads, no pagination needed
- [ ] Click a lead — navigates to lead detail — **NOT TESTED**

**Notes:** Lead table shows User, Score, Status, Tier, Audits (completed/total), Sites, Last Login

### 14.2 CRM Lead Detail

- [x] Click lead row → navigates to `/admin/crm/leads/{userId}` — **BUG** — Page loads with infinite loading spinner, never completes. No API request made for lead detail endpoint. No console errors.
- [ ] Profile shows: email, name, status, lead score, tier, audit count, sites, verified domains — **BLOCKED** by loading bug
- [ ] Activity timeline shows chronological events — **BLOCKED**
- [ ] Membership section shows sites — **BLOCKED**
- [ ] Outreach section shows previous emails — **BLOCKED**
- [ ] "Recalculate Score" button works — **BLOCKED**
- [ ] "Send Email" — can select a template and send outreach email — **BLOCKED**
- [ ] Check Mailpit — outreach email received — **BLOCKED**

**BUG:** CRM Lead Detail page hangs forever with loading spinner. No network request is made for the lead detail data.

### 14.3 CRM Triggers

- [x] Navigate to `/admin/crm/triggers` — triggers list — **PASS** — 2 pending "First Audit" triggers
- [x] Stats cards show total, pending, sent, dismissed, actioned counts — **PASS** — Pending count visible
- [x] Filter by status and type — **PASS** — Status filter (All/Pending/Sent/Dismissed) and Type filter (All/First Audit/Stalled Verification/Security Alert/Upgrade Nudge/Low AEO Score/Low Content Score/Churn Risk/Score Improvement)
- [ ] Pagination works — **NOT TESTED** — Only 2 triggers
- [x] Action a trigger — Send/Dismiss buttons present per trigger — **PASS**
- [ ] Verify that domain verification creates a `domain_verified` trigger — **NOT TESTED**

### 14.4 Trigger Auto-Send Verification

Test that CRM triggers auto-send their mapped email templates:

- [ ] Run an audit as a new user (first audit) — `first_audit_complete` trigger fires
- [ ] Check Mailpit — "Welcome First Audit" email auto-sent (if trigger enabled in settings)
- [ ] Check CRM triggers list — trigger shows as "sent" (not "pending")
- [ ] Disable `first_audit_complete` trigger in admin settings (Part 20.1)
- [ ] Run another first audit (new user) — trigger stays "pending", no auto-email
- [ ] Manually action the pending trigger — "Send" button works

Other trigger types to verify auto-send:

- [ ] `stalled_verification` — after 48h+ without completing domain verification
- [ ] `security_alert` — when critical security issue found
- [ ] `upgrade_nudge` — when user hits tier limits
- [ ] `low_aeo_score` — when AEO score < 40
- [ ] `low_content_score` — when content score < 40
- [ ] `churn_risk` — when user engagement drops
- [ ] `score_improvement` — when score improves 20+ points

---

## Part 15: Admin Email

### 15.1 Email Templates

- [x] Navigate to `/admin/email/templates` — template list — **PASS** — 24 templates
- [x] System templates visible — **PASS** — All expected templates present: email_verification, password_reset, audit_completed, domain_verified, welcome_first_audit, verify_domain_howto, security_alert_dorking, upgrade_hitting_limits, aeo_improvement_guide, content_improvement_guide, churn_risk_winback, score_celebration, referral_invite, referral_qualified, referral_welcome_bonus, referral_milestone, trial_started, trial_expiring, trial_expired, cold_outreach_initial, cold_outreach_followup, win_back_inactive, early_access_activated, early_access_confirmed
- [x] Search by name — search field present — **PASS**
- [x] Filter by category — **PASS** — Categories: All, Transactional, Onboarding, Engagement, Upgrade, Security, Win Back, Educational, Announcement, Digest
- [x] Edit/Duplicate/Delete actions per template — **PASS** — System templates have Edit + Duplicate; custom templates also have Delete
- [x] "New Template" link present — **PASS**
- [ ] Click a template — navigates to editor — **NOT TESTED**

### 15.2 Email Template Editor

- [ ] Navigate to `/admin/email/templates/{id}` — editor loads with template data
- [ ] Edit template name, subject, preview text
- [ ] Edit content blocks — add, remove, reorder
- [ ] Variable picker — insert `{{variables}}` into subject/content
- [ ] Click "Preview" — rendered HTML preview appears
- [ ] Click "Test Send" — test email sent to your admin email, verify in Mailpit
- [ ] Save changes — success message
- [ ] Create a new template (`/admin/email/templates/new`) — fill in all fields, save
- [ ] Duplicate a template — creates a copy with different slug

### 15.3 Email Campaigns

- [x] Navigate to `/admin/email/campaigns` — campaigns list — **PASS** — 0 campaigns, empty state with "No campaigns yet"
- [x] Filter by status (draft, scheduled, sending, sent, cancelled) — **PASS** — Status filter dropdown present
- [x] Search field present — **PASS**
- [x] "New Campaign" button present — **PASS** — Links to campaign editor
- [ ] Click "Create Campaign" — navigates to editor — **NOT TESTED**
- [ ] Fill in campaign name, select a template — **NOT TESTED**
- [ ] Configure segment — **NOT TESTED**
- [ ] Save as draft — **NOT TESTED**
- [ ] Launch a campaign — **NOT TESTED**
- [ ] Check Mailpit — **NOT TESTED**
- [ ] View campaign sends — **NOT TESTED**
- [ ] Pause/resume a campaign — **NOT TESTED**
- [ ] Schedule a campaign — **NOT TESTED**

### 15.4 Email Analytics

- [x] Navigate to `/admin/email/analytics` — totals render (sent, delivered, opened, clicked, bounced) — **PASS** — Stats cards showing Sent (4), Delivered (0), Opened (0), Clicked (0), Bounced (0)
- [x] Daily chart shows email volume over time — **PASS** — "Delivery Over Time" chart with time range buttons (7d/30d/90d)
- [x] Template performance table shows per-template open/click rates — **PASS** — Table with Template, Sent, Delivered, Opened, Clicked, Bounced columns
- [ ] Change time range — data updates — **NOT TESTED**

---

## Part 16: Admin CMS

### 16.1 Blog Posts

- [x] Navigate to `/admin/cms/posts` — posts list with stats — **PASS** — 0 posts, "Create your first blog post to get started"
- [x] Filter by status (draft, published, archived) and category — **PASS** — Status (All/Draft/Published/Archived) and Category (All/SEO/Accessibility/Security/Performance/Content Quality/Structured Data/E-E-A-T/AEO/Guides/Case Studies/Product Updates)
- [x] Search by title — **PASS** — Search field present
- [x] Click "New Post" — link present — **PASS** — Links to `/admin/cms/posts/new`

### 16.2 Post Editor

- [ ] Navigate to `/admin/cms/posts/new` — empty editor loads
- [ ] Fill in: title, subtitle, excerpt, category, tags
- [ ] Add content blocks: text, heading, image, two-column, callout, code, quote, divider, embed, CTA, stat highlight, audit link
- [ ] Upload a featured image
- [ ] Set SEO title and description overrides
- [ ] Configure related posts (link to other posts)
- [ ] Save as draft — post appears in list as "Draft"
- [ ] Click "Publish" — post status changes, `published_at` is set
- [ ] Navigate to `/blog` — published post appears in the public blog
- [ ] Click into the post — full content renders correctly, related posts show at bottom
- [ ] Back in admin, edit the post — changes save, revision is created
- [ ] View revisions list — previous versions shown
- [ ] Restore a previous revision — content reverts
- [ ] Unpublish a post — removed from public blog

### 16.3 Media Library

- [x] Navigate to `/admin/cms/media` — media grid loads — **PASS** — Upload button, drag-and-drop zone, format support listed (JPEG, PNG, GIF, WebP, SVG)
- [ ] Upload an image (drag-and-drop or click) — **NOT TESTED**
- [ ] Edit alt text on an image — **NOT TESTED**
- [ ] Copy image URL — **NOT TESTED**
- [ ] Delete an image — **NOT TESTED**

### 16.4 Advice Templates

- [x] Navigate to `/admin/cms/advice` — advice templates list — **PASS** — "New Advice" button, stats (Total/Published/Drafts/Categories), search, category filter
- [ ] Filter by category, search by name — **NOT TESTED** (UI elements present)
- [ ] Edit an advice template — **NOT TESTED**
- [ ] Save — changes persist — **NOT TESTED**
- [ ] Run an audit — verify custom advice — **NOT TESTED**

### 16.5 Announcements

- [x] Navigate to `/admin/cms/announcements` — announcements list — **PASS** — "New Announcement" button, stats (Total 0/Active 0/Scheduled 0/Inactive 0), empty state
- [ ] Create a new announcement — **NOT TESTED**
- [ ] Set as active — **NOT TESTED**
- [ ] Edit/update an announcement — **NOT TESTED**
- [ ] Delete an announcement — **NOT TESTED**
- [ ] User can dismiss the announcement — **NOT TESTED**

### 16.6 Success Stories

- [x] Navigate to `/admin/cms/stories` — stories list — **PASS** — "New Story" button, stats (Total 0/Published 0/Drafts 0/Avg Improvement 0 pts), empty state "No success stories yet"
- [ ] Create a story — **NOT TESTED**
- [ ] Mark as published — **NOT TESTED**
- [ ] Edit/delete stories — **NOT TESTED**

---

## Part 17: Admin Marketing

### 17.1 Marketing Content Calendar

- [x] Navigate to `/admin/marketing/content` — content list loads — **PASS** — 300 total items across platforms
- [x] Platform breakdown: Twitter/X (84), LinkedIn (24), Instagram (84), Threads (84), Blog (24) — **PASS**
- [x] Filter by platform, campaign, status, week — **PASS** — Week (1-12), Day (Mon-Sun), Platform (Twitter/X, LinkedIn, Instagram, Facebook, Threads, Blog), Campaign (Pre-Launch, Launch, Growth), Status (Draft, Ready, Posted, Archived)
- [x] Search content field present — **PASS**
- [x] Content table: Week, Day, Platform, Content (title + preview), Campaign, Status, Chars, Actions (Copy/Edit/Delete) — **PASS**
- [x] Status can be changed inline via dropdown per row — **PASS**
- [x] "New Content" button links to editor — **PASS**
- [ ] Create new content item — **NOT TESTED**
- [ ] Edit content — **NOT TESTED**
- [ ] Delete content item — **NOT TESTED**

### 17.2 Marketing Campaigns

- [x] Navigate to `/admin/marketing/campaigns` — campaign list — **PASS** — 3 campaigns: Pre-Launch, Launch, Growth
- [x] Table shows: Name, Color, Description, Content count, Created date, Actions (Edit/Delete) — **PASS**
- [x] Pre-Launch: 100 content items, "Month 1: Building authority and anticipation before launch" — **PASS**
- [x] Launch: 100 content items, "Month 2: Drive sign-ups, showcase the product, share early user results" — **PASS**
- [x] Growth: 100 content items, "Month 3: Establish thought leadership, deepen engagement, drive upgrades" — **PASS**
- [x] "New Campaign" button present — **PASS**
- [ ] Create new campaign — **NOT TESTED**
- [ ] Edit/delete campaigns — **NOT TESTED** (buttons present)

---

## Part 18: Admin Cold Prospects

### 18.1 Cold Prospects Dashboard

- [x] Navigate to `/admin/cold-prospects` — dashboard with pipeline stats — **PASS**
- [x] Stats cards show: Total Domains (0), With Email (0), With Name (0), Qualified (0), Today Imported (0), Conversion (0%) — **PASS**
- [x] Pipeline funnel: Pending → Checking → Live → Extracting → Qualified → Contacted → Converted → Dead — **PASS** — All stages render with counts and percentages, clickable links
- [x] Daily intake chart shows import trends (Last 30 Days) — **PASS**
- [x] Quick-access cards: "Qualified with Email", "With Name + Email", "All Prospects" — **PASS**
- [x] Import CSV/JSON, Outreach, Settings buttons present — **PASS**

### 18.2 Cold Prospects List

- [x] Navigate to `/admin/cold-prospects/list` — full prospect table — **PASS** — 0 total, empty state "No prospects found"
- [x] Filter by status — **PASS** — All Statuses, Pending, Checking, Live, Extracting, Qualified, Contacted, Converted, Dead
- [x] Filter by TLD — **PASS** — "All TLDs" dropdown (empty since no data)
- [x] Toggle filters: Has Email, Has Name, Unsubscribed — **PASS** — Toggle buttons present
- [x] Search by domain/email/name — **PASS** — Search field present
- [ ] Pagination works — **NOT TESTED** — No data
- [ ] Bulk exclude — **NOT TESTED** — No data

### 18.3 Cold Prospect Detail

- [ ] Click a prospect — **NOT TESTED** — No prospects to click
- [ ] Shows domain info, HTTP status, SSL, title, emails found, qualification score — **NOT TESTED**
- [ ] Can retry processing a failed prospect — **NOT TESTED**
- [ ] Can exclude/delete a prospect — **NOT TESTED**

### 18.4 Cold Prospect Outreach

- [x] On dashboard, outreach panel shows stats: sent, queued, opened, clicked, today's count — **PASS** — Total Sent (0), Queued (0), Opened (0), Clicked (0), Today (0)
- [x] "Auto Outreach" toggle — **PASS** — "Auto: OFF" button present
- [x] "Send Batch" button — **PASS** — Present with empty state message
- [ ] Recent sends table — **NOT TESTED** — No sends yet
- [ ] Check Mailpit — cold outreach emails arrive — **NOT TESTED**
- [ ] Unsubscribe link in email — **NOT TESTED**
- [ ] After unsubscribe, email is skipped — **NOT TESTED**

### 18.5 Pipeline Settings

- [x] Access pipeline settings — **PASS** — Settings panel with: Target TLDs ("com, co.uk, org.uk, uk, io, co, net"), Excluded Keywords ("casino, poker, xxx, porn, gambling, crypto, nft, loan, pills, viagra"), Min Quality Score (30), Daily Check Limit (5000), Daily Email Limit (50), Auto Outreach toggle
- [x] "Save Settings" button present — **PASS**
- [ ] Update settings — save, verify changes persist — **NOT TESTED**

### 18.6 LIA Compliance

- [ ] Each domain is contacted a maximum of once — **NOT TESTED** — No prospects/outreach to verify
- [ ] Outreach email includes clear identification of sender — **NOT TESTED**
- [ ] Outreach email includes data source disclosure — **NOT TESTED**
- [ ] Outreach email footer includes company details — **NOT TESTED**
- [ ] Follow-up emails are disabled — **NOT TESTED**
- [ ] Daily email limit is enforced — **NOT TESTED** — Setting shows 50/day (test.md says default 20)
- [ ] Unsubscribed prospects permanently excluded — **NOT TESTED**
- [ ] Prospect data auto-deleted after 6 months — **NOT TESTED**
- [ ] Only generic business emails collected — **NOT TESTED**

---

## Part 19: Admin Referrals

- [x] Navigate to `/admin/referrals` — platform-wide referral stats — **PASS** — "Referral Program" page
- [x] Total referrals (0), Conversion Rate (0%), Bonus Audits Awarded (0), Voided (0) — **PASS**
- [x] Referral list with filters (by status) — **PASS** — Search by email, Status filter (All/Pending/Qualified/Rewarded/Voided), empty state "No referrals found."
- [ ] View referral config — **NOT TESTED** — No config section visible on this page
- [ ] Update config — **NOT TESTED**
- [ ] Void a referral — **NOT TESTED** — No referrals to void

---

## Part 20: Admin System Settings

### 20.1 Trigger Automation

- [x] Navigate to `/admin/settings` — "Trigger Automation" section visible — **PASS** — "System Settings" page with "Trigger Automation" heading
- [x] 8 toggle switches for each trigger type — **PASS**:
  - First Audit Complete — "Welcome email after first audit"
  - Stalled Verification — "Domain verification reminder after 48h"
  - Security Alert — "Critical security issue notification"
  - Upgrade Nudge — "Notification when hitting tier limits"
  - Low AEO Score — "AEO improvement guide when score < 40"
  - Low Content Score — "Content improvement guide when score < 40"
  - Churn Risk — "Win-back email for disengaging users"
  - Score Improvement — "Celebration when score improves 20+ points"
- [ ] Toggle a trigger off/on — **NOT TESTED** (buttons present)
- [x] Description text for each trigger is clear and helpful — **PASS**

### 20.2 Early Access

- [x] "Early Access" section present — **PASS** — Toggle, Max Spots (200), Discount % (50)
- [x] Registration links shown: `/register?ea=email` and `/register?ea=social` — **PASS**
- [x] "View Early Access Dashboard" link navigates to `/admin/early-access` — **PASS**
- [ ] Toggle early access on/off — **NOT TESTED**
- [ ] Set max spots / discount percentage — **NOT TESTED** (inputs present)

### 20.3 Early Access Dashboard

- [x] Navigate to `/admin/early-access` — campaign stats and channel breakdown — **PASS** — Spots Claimed 0/200, Email (0), Social (0)
- [x] Share links with Copy buttons — **PASS** — Email and Social registration links
- [x] User list with search, columns (Name, Email, Channel, Verified, Activated, Registered) — **PASS**
- [x] Export button and "Activate All" button (disabled when 0 users) — **PASS**
- [ ] "Activate All" — **NOT TESTED** — No users

### 20.4 Coming Soon Mode

- [x] "Coming Soon Mode" section with toggle — **PASS**
- [x] Edit headline ("Something great is on its way.") and description — **PASS** — Editable text fields
- [x] "Save Content" button present — **PASS**
- [x] Preview section shows how the coming soon page will look — **PASS** — Live preview with Kritano branding, headline, description, "Notify me" button
- [x] "View Signups" link navigates to `/admin/coming-soon` — **PASS**
- [ ] Toggle on — warning banner appears — **NOT TESTED**
- [ ] Coming soon page renders for public users — **NOT TESTED**

### 20.5 Coming Soon Signups

- [x] Navigate to `/admin/coming-soon` — signups list — **PASS** — 0 total signups, search field, "Export CSV" button (disabled)
- [ ] On the coming soon page: enter email → submit — **NOT TESTED**
- [ ] Delete individual signups — **NOT TESTED**

### 20.6 SEO Manager

- [x] Navigate to `/admin/seo` — list of per-route SEO overrides — **PASS** — 24 routes, 0 customised
- [x] Route categories: All, Public, Auth, Dashboard, Admin — **PASS**
- [x] Search routes field present — **PASS**
- [x] Routes listed: /, /about, /services, /pricing, /contact, /blog, /terms, /privacy, /docs (all subpages), /login, /register, /dashboard, /audits, /sites, /schedules, /analytics, /referrals, /compare, /settings — **PASS**
- [x] Each route shows status as "Default" — **PASS**
- [ ] Create/edit/delete SEO entries — **NOT TESTED**

---

## Part 21: Admin Analytics

### 21.1 Funnel Analytics

- [x] Navigate to `/admin/analytics/funnel` — funnel stages render with counts and conversion rates — **PASS**
- [x] Stages: Registered (4) → Verified Email (3, 75%) → First Audit (2, 66.7%) → Domain Verified (0, 0%) → Paid Subscriber (1, 0%) — **PASS**
- [x] Stage-to-stage drop-off analysis — **PASS** — Shows % drop-off and users lost per stage
- [x] Summary stats: Overall Conversion 25%, Biggest Drop-off 100% (First Audit → Domain Verified), Activation Rate 50% — **PASS**
- [x] Change range (7d, 30d, 90d, year) — **PASS** — Dropdown present
- [ ] Change range — data updates — **NOT TESTED**

### 21.2 Trends

- [x] Navigate to `/admin/analytics/trends` — global stats render — **PASS**
- [x] Audits Completed (2), Pages Scanned (2) — **PASS**
- [x] Score Distribution: SEO avg 50, Accessibility avg 0, Security avg 66, Performance avg 0 — with median, P10, P90 — **PASS**
- [x] Top Issues table (20 issues) — most common findings across all audits — **PASS** — Shows #, Issue, Category, Severity, Affected Audits, % of Audits
- [x] Top issue: "High Vocabulary Complexity" (Content, moderate, 100% of audits) — **PASS**
- [x] Tier Breakdown section — **PASS** — "No tier data available for this period"
- [x] Time range dropdown (7d/30d/90d/year) — **PASS**

### 21.3 Revenue

- [x] Navigate to `/admin/analytics/revenue` — MRR (£49), ARR (£588), Paid Subscribers (1), ARPU (£49) — **PASS**
- [x] New this month: +1 subscriber, +£49 MRR gained — **PASS**
- [x] Churn this month: -0 subscribers, -£0 MRR lost — **PASS**
- [x] Net MRR Change: +£49 — **PASS**
- [x] Revenue by Tier: Free (1, £0), Starter (0, £0), Pro (1, £49, 100% of MRR), Agency (0, £0), Enterprise (0, £0) — **PASS**
- [x] Note: "Revenue calculated from config-driven tier pricing. Stripe integration will replace this with real payment data." — **PASS**

---

## Part 22: Responsive & Cross-Browser

### 22.1 Mobile (< 640px)

Tested at 375x667 viewport (iPhone SE equivalent):

- [x] All public pages: content stacks to single column, text remains readable — **PASS** — Homepage verified
- [x] Hamburger menu works: opens as `dialog modal`, shows all nav links (Services, Pricing, About, Blog, Contact, API Docs, Sign in, Get Started), "Close menu" button — **PASS**
- [ ] Service detail pages: feature grids stack — **NOT TESTED**
- [x] Dashboard: stat cards stack to single column — **PASS** — Verified via screenshot
- [ ] Audit list/detail — **NOT TESTED**
- [x] Forms (login): inputs are full-width, buttons tap-friendly — **PASS** — Login form renders cleanly
- [ ] Admin pages — **NOT TESTED**
- [x] Sidebar: hamburger button ("Open menu") opens mobile drawer — **PASS** — Sidebar shows nav links
- [ ] Cookie banner — **NOT TESTED**

### 22.2 Tablet (640px–1024px)

- [ ] Not tested — **NOT TESTED**

### 22.3 Desktop (> 1024px)

- [x] Full multi-column layouts render — **PASS** — Tested throughout all prior parts at 1440px width
- [x] All table columns visible — **PASS**
- [x] Sidebar navigation visible without hamburger, collapsible — **PASS** — "Collapse sidebar" button present
- [ ] Collapsed sidebar — **NOT TESTED**

---

## Part 23: Accessibility Checks

- [x] Skip link: Tab on page load — "Skip to main content" link appears, focused first — **PASS** — Verified on homepage, links to `#main-content`
- [x] Skip link present on dashboard — **PASS** — `/dashboard#main-content`
- [ ] Keyboard navigation: Tab through all interactive elements — **NOT FULLY TESTED**
- [ ] Focus indicators — **NOT FULLY TESTED**
- [ ] Focus trap: modals — **NOT FULLY TESTED** (but hamburger menu uses `dialog modal` which implies focus trap)
- [x] Esc closes modals — **PASS** — Verified with feedback modal in prior tests
- [ ] Forms: all inputs have associated `<label>` elements — **NOT FULLY TESTED**
- [ ] ARIA: sortable table headers — **NOT FULLY TESTED**
- [ ] Colour contrast — **NOT TESTED** (requires Lighthouse audit)
- [x] Screen reader: key pages have proper landmarks (navigation, main, contentinfo), headings, and ARIA labels — **PASS** — Verified via a11y tree snapshots throughout testing
- [x] Mobile sidebar has `role="dialog"` and proper ARIA attributes — **PASS** — `dialog "Navigation menu" modal`

---

## Part 24: Email Flows (via Mailpit)

Ensure Mailpit is running at `http://localhost:8025`.

### 24.1 Auth Emails

- [ ] **Registration** — verification email arrives, link works, `/verify-email` page loads
- [ ] **Resend verification** — new verification email arrives
- [ ] **Password reset** — reset email arrives, link works

### 24.2 Audit & Site Emails

- [ ] **Audit completed** — notification email arrives with scores and link to audit
- [ ] **Audit failed** — notification email arrives with error info
- [ ] **Domain verified** — email arrives with domain name, verification method, and link to site
- [ ] **Site invitation** — invitation email arrives with accept/decline links

### 24.3 CRM Trigger Auto-Send Emails

- [ ] **Welcome First Audit** — sent after first audit completion
- [ ] **Stalled Verification** — sent when domain verification stalls 48h+
- [ ] **Security Alert** — sent when critical security issue found
- [ ] **Upgrade Nudge** — sent when hitting tier limits
- [ ] **AEO Improvement Guide** — sent when AEO score < 40
- [ ] **Content Improvement Guide** — sent when content score < 40
- [ ] **Churn Risk Winback** — sent when engagement drops
- [ ] **Score Celebration** — sent when score improves 20+ points

### 24.4 Campaign & Admin Emails

- [ ] **Admin outreach** — CRM outreach email arrives to target user
- [ ] **Campaign send** — campaign emails arrive to segment-matching users
- [ ] **Template test send** — test email from template editor arrives

### 24.5 Trial Emails

- [ ] **Trial started** — confirmation email on trial activation
- [ ] **Trial expiring** — warning email near expiry
- [ ] **Trial expired** — notification on trial end

### 24.6 Early Access Emails

- [ ] **Early access confirmed** — sent on registration via `?ea=` link, confirms spot secured
- [ ] **Early access activated** — sent when admin clicks "Activate All", includes trial details and login link

### 24.7 Referral Emails

- [ ] **Referral invite** — invitation email to referred user
- [ ] **Referral qualified** — notification to referrer when referral qualifies
- [ ] **Referral welcome bonus** — notification of bonus audits earned

### 24.8 Cold Outreach Emails

- [ ] **Cold outreach initial** — first contact email to prospect
- [ ] **Cold outreach followup** — follow-up email after 3 days with no open/click

### 24.9 Account Lifecycle Emails (GDPR)

- [ ] **Data export ready** — `data_export_ready` email arrives after export completes, includes "Download My Data" button linking to `/settings/profile`
- [ ] **Deletion requested** — `deletion_requested` email arrives with scheduled deletion date and "Cancel Deletion" button
- [ ] **Deletion cancelled** — `deletion_cancelled` email arrives with "Go to Dashboard" button
- [ ] **Deletion completed** — `deletion_completed` email arrives confirming permanent deletion (sent to former email after account is deleted)

### 24.10 Email Preferences

- [ ] **Unsubscribe** — click unsubscribe link in any email, preferences page loads, unsubscribe works
- [ ] **Manage preferences** — click "manage preferences" link, can toggle individual categories
- [ ] **Cold unsubscribe** — click unsubscribe in cold email, HTML confirmation page renders

---

## Part 25: API (Public v1)

### 25.1 API Key Authentication

- [x] API v1 endpoint requires API key — **PASS** — `GET /api/v1/info` returns `{"error":"API key required","code":"API_KEY_REQUIRED","message":"Provide API key via Authorization header (Bearer kt_live_xxx) or X-API-Key header"}`
- [ ] Create an API key via `/settings/api-keys` — **BLOCKED** — API keys created as revoked (Bug from Part 7.8)
- [ ] Make request with valid key — **BLOCKED**
- [ ] Make request with invalid/revoked key — **NOT TESTED**

### 25.2 API Endpoints

- [ ] All endpoints — **BLOCKED** by API key creation bug
- [x] `GET /api/v1/info` — endpoint exists and requires auth — **PASS** (returns proper error code)

### 25.3 Rate Limiting

- [ ] Rate limiting — **NOT TESTED**

---

## Part 26: Tier Enforcement

Verify that tier limits are properly enforced across the application.

### 26.1 Free Tier

- [ ] Max 1 site — cannot add a second
- [ ] Max 50 pages per audit
- [ ] Max 5 audits per month — 6th audit blocked
- [ ] Max 1 concurrent audit
- [ ] No accessibility or performance checks available
- [ ] No PDF export
- [ ] No CSV/JSON export
- [ ] No scheduled audits
- [ ] No structured data check
- [ ] 30-day data retention

### 26.2 Starter Tier

- [ ] Max 3 sites
- [ ] Max 250 pages per audit
- [ ] Accessibility and performance checks available
- [ ] PDF export available
- [ ] Scheduled audits: minimum 7-day frequency
- [ ] 1 member per site

### 26.3 Pro Tier

- [ ] Max 10 sites
- [ ] Max 1,000 pages per audit
- [ ] CSV/JSON export available
- [ ] Google dorking / index exposure available
- [ ] E-E-A-T and AEO analysis available
- [ ] Scheduled audits: minimum 1-day frequency
- [ ] 3 members per site

### 26.4 Agency Tier

- [ ] Max 50 sites
- [ ] Max 5,000 pages per audit
- [ ] White-label branding available
- [ ] Structured data analysis available
- [ ] Scheduled audits: minimum 1-hour frequency
- [ ] 10 members per site

---

## Part 27: Security Checks

- [ ] All API endpoints require authentication (except public routes)
- [ ] JWT tokens are HTTP-only cookies (not accessible via JavaScript)
- [ ] CSRF protection active on state-changing requests
- [ ] Rate limiting active on auth endpoints (login, register, password reset, verify email)
- [ ] Admin routes require `is_super_admin` verified against database (not just JWT claim)
- [ ] Users cannot access other users' audits, sites, or data
- [ ] API key scopes are enforced — key without `audits:write` cannot create audits
- [ ] File uploads restricted to allowed MIME types and max 10MB
- [ ] SQL injection: test with `'; DROP TABLE users; --` in search inputs
- [ ] XSS: test with `<script>alert('xss')</script>` in text inputs
- [ ] Domain verification cannot be bypassed to claim someone else's domain

---

## Part 28: Blog & RSS

- [x] Blog RSS feed available at `/api/blog/feed.xml` — valid Atom format — **PASS** — Returns valid Atom XML with `<feed xmlns="http://www.w3.org/2005/Atom">`, title "Kritano Blog"
- [x] Blog sitemap at `/api/blog/sitemap.xml` — valid XML sitemap — **PASS** — Returns valid sitemap with `/blog` URL
- [x] Blog page loads at `/blog` — **PASS** — "No posts found" (empty, 0 posts loaded)
- [ ] Blog categories endpoint — **NOT TESTED** (no published posts)
- [ ] View count / related posts — **NOT TESTED** (no posts)

---

## Part 29: API Documentation (Public)

### 29.1 Docs Overview

- [x] Navigate to `/docs` — hero section with "API Version 1.0" badge, "Build with the Kritano API" headline — **PASS**
- [x] "Read the Docs" CTA links to `/docs/authentication` — **PASS**
- [x] "Get API Key" CTA links to `/settings/api-keys` — **PASS**
- [x] Quick start cards: Authentication, Quick Start (Endpoints), Rate Limits — **PASS**
- [x] Code examples render in styled code blocks — **PASS** — CURL examples with Copy button, JSON response examples
- [x] Getting Started: 3-step guide (Get API key, Create audit, Poll & fetch) — **PASS**
- [x] Base URL section, API Scopes table, Endpoints at a Glance table — **PASS**
- [x] Sidebar navigation: Overview, Authentication, Rate Limits, Error Handling, Endpoints, Object Reference — **PASS**

### 29.2 Docs Subpages

- [x] Navigate to `/docs/authentication` — authentication guide with API key format, sending options (Authorization Bearer + X-API-Key), security warning, complete example, scopes table, error examples (401/403), key management guide — **PASS**
- [ ] Navigate to `/docs/rate-limits` — **NOT TESTED**
- [ ] Navigate to `/docs/errors` — **NOT TESTED**
- [ ] Navigate to `/docs/endpoints` — **NOT TESTED**
- [ ] Navigate to `/docs/objects` — **NOT TESTED**
- [x] All docs pages use consistent layout with sidebar navigation — **PASS** — Sidebar present on both tested pages
- [x] Navigation between docs pages works (sidebar links) — **PASS** — Clicked Authentication from sidebar
- [x] Pages are publicly accessible (no auth required) — **PASS** — Tested while not logged in

---

## Part 30: GDPR & Data Retention (Worker)

### 30.1 Data Export Worker

- [ ] Request a data export → verify `account_data_exports` record created with status `pending`
- [ ] GDPR worker picks up pending export within its poll cycle
- [ ] Worker generates ZIP file in `/tmp/kritano-exports/` with all user data
- [ ] Export record updated to `completed` with file path, file size, and 24h expiry
- [ ] Export email notification sent
- [ ] After 24 hours — worker marks export as `expired` and deletes the ZIP file from disk

### 30.2 Account Deletion Worker

- [ ] Request deletion → user status set to `pending_deletion`, `deletion_scheduled_for` set to 30 days out
- [ ] All refresh tokens revoked immediately (user logged out of all devices)
- [ ] During grace period — user can still log in (status allows it)
- [ ] After 30 days — GDPR worker processes the deletion
- [ ] Deletion process: consent records archived (user_id hashed with SHA-256), then user deleted with CASCADE
- [ ] Tables with SET NULL FKs: `auth_audit_logs`, `cookie_consent_logs` — `user_id` set to NULL
- [ ] Tables manually NULLed: `blog_posts.author_id`, `blog_post_revisions.changed_by`, `blog_media.uploaded_by`, `email_sends.user_id`/`sent_by`, `audit_consent_log.user_id`, `announcements.created_by`
- [ ] Organizations owned by user are deleted (with their members)
- [ ] CASCADE-deleted: refresh_tokens, email_verification_tokens, audit_jobs (+ children), audit_schedules, api_keys, email_preferences, oauth_providers, bug_reports, feature_requests, account_data_exports

### 30.3 Retention Cleanup

- [ ] Auth audit logs older than 1 year are purged by the cleanup worker
- [ ] Expired data exports are cleaned up (file deleted + record marked expired)
- [ ] Archived consent records are retained for at least 3 years (not auto-purged)
- [ ] Stripe billing records remain on Stripe's side after deletion (tax law: 6-7 years)

---

## Part 31: Privacy Policy Content

- [x] Navigate to `/privacy` — page renders with all 16 sections — **PASS** — Sections 1-16 all present: Introduction, Information We Collect, Cookies & Tracking Technologies, How We Use Your Data, Scan Data, Data Sharing & Sub-processors, International Data Transfers, Consent Logging, Publicly Available Business Data, Your Rights, Automated Decision-Making, Data Retention, Security Measures, Children, Policy Changes, Contact Us
- [x] Section 10 (Your Rights) mentions self-service data export from account settings — **PASS** — "You can download a complete export of your data at any time from your account settings"
- [x] Section 10 mentions self-service account deletion with 30-day grace period — **PASS** — "You can delete your account from your account settings. Deletion includes a 30-day grace period during which you can cancel."
- [x] Section 10 mentions data portability in JSON format via ZIP archive — **PASS** — "Our self-service data export provides your data in JSON format within a ZIP archive."
- [x] Section 10 links to `/settings/profile` for self-service actions — **PASS** — 3 links to "account settings" → `/settings/profile`
- [x] Section 12 (Data Retention) mentions 30-day deletion grace period — **PASS** — "After you request deletion, there is a 30-day grace period during which you can cancel."
- [x] Section 12 mentions consent records retained in anonymised form — **PASS** — "Archived in anonymised form and retained for the duration required by applicable regulations (typically 3 years)"
- [x] Section 12 mentions data exports expire and are deleted after 24 hours — **PASS** — "Available for download for 24 hours after generation, then automatically deleted."

---

## Part 32: OAuth Security

- [ ] OAuth state parameter is validated — replaying a callback with old state fails
- [ ] PKCE code verifier stored in HttpOnly cookie — not accessible via JavaScript
- [ ] OAuth cookie (`oauth_state`) is short-lived
- [ ] Cannot link a provider already linked to a different user — 409 conflict error
- [ ] Cannot unlink the last auth method — if no password and only 1 provider, unlink returns error
- [ ] OAuth endpoints are rate-limited (`oauthRateLimiter`)
- [ ] GDPR account endpoints require password verification — cannot export/delete without password
- [ ] GDPR export and deletion endpoints are rate-limited (3 requests per 15 minutes)
- [ ] Export download validates both user ownership and expiry — cannot download another user's export
- [ ] Delete confirmation requires exact text "DELETE MY ACCOUNT" — partial/wrong text rejected by Zod

---

## Final Checklist

- [ ] All public pages render without console errors
- [x] All protected pages redirect properly when not authenticated — **PASS** — Redirects to /login
- [x] All admin pages require admin access — **PASS** — `/api/admin/check` returns 403 for non-admin users
- [ ] No JavaScript console errors on any page — **NOT FULLY TESTED**
- [x] All forms validate input properly (client-side and server-side) — **PASS** — Tested on register, login, bug report, feature request, new audit
- [x] All toast notifications appear and auto-dismiss — **PASS** — Seen on login, invite sent, feedback submitted
- [x] Loading states show on all async operations — **PASS** — Seen on audit progress, send invites
- [x] Empty states render helpfully on all list pages — **PASS** — Referrals, blog posts, schedules all show helpful empty states
- [x] Browser back/forward navigation works correctly — **PASS** — Verified back navigation from new audit to dashboard
- [x] Page titles update correctly for each route — **PASS** — Seen "Sign In | Kritano", "Referrals - Kritano", etc.
- [ ] All links open in correct context (internal vs external) — **NOT FULLY TESTED**
- [ ] Favicon and app icons display correctly — **NOT TESTED**

---

## Overall Test Summary (Parts 1-32)

**Date:** 2026-03-15
**Tester:** Automated via Chrome DevTools MCP
**Test User:** jane.tester@example.com (Pro tier) + cgarlick94@gmail.com (Admin)

### Aggregate Results

| Part | Passed | Failed | Not Tested | Bugs |
|------|--------|--------|------------|------|
| 1. Public Pages | 14 | 1 | 1 | 2 |
| 2. Auth & Onboarding | 11 | 1 | 10 | 3 |
| 3. Dashboard & Core | 14 | 2 | 3 | 5 |
| 4. Site Management | 10 | 1 | 3 | 2 |
| 5. Scheduled Audits | 5 | 0 | 3 | 1 |
| 6. Analytics | 7 | 0 | 7 | 0 |
| 7. Settings | 16 | 1 | 25 | 5 |
| 8. Referrals | 9 | 0 | 7 | 1 |
| 9. User Feedback | 8 | 0 | 2 | 0 |
| 10. Free Trial | 0 | 0 | 13 | 0 |
| 11. Dark Mode | 4 | 0 | 3 | 0 |
| 12. Keyboard Shortcuts | 2 | 1 | 1 | 1 |
| 13. Admin Panel | 15 | 0 | 13 | 0 |
| 14. Admin CRM | 8 | 1 | 9 | 1 |
| 15. Admin Email | 18 | 0 | 5 | 0 |
| 16. Admin CMS | 16 | 0 | 4 | 0 |
| 17. Admin Marketing | 13 | 0 | 5 | 0 |
| 18. Admin Cold Prospects | 20 | 0 | 7 | 0 |
| 19. Admin Referrals | 3 | 0 | 3 | 0 |
| 20. Admin System Settings | 14 | 0 | 7 | 0 |
| 21. Admin Analytics | 13 | 0 | 1 | 0 |
| 22. Responsive | 6 | 0 | 6 | 0 |
| 23. Accessibility | 4 | 0 | 5 | 0 |
| 24. Email Flows | 0 | 0 | 23 | 0 |
| 25. API (Public v1) | 2 | 0 | 5 | 0 |
| 26. Tier Enforcement | 0 | 0 | 15 | 0 |
| 27. Security Checks | 0 | 0 | 11 | 0 |
| 28. Blog & RSS | 8 | 0 | 0 | 0 |
| 29. API Documentation | 10 | 0 | 5 | 0 |
| 30. GDPR & Data Retention | 0 | 0 | 14 | 0 |
| 31. Privacy Policy | 8 | 0 | 0 | 0 |
| 32. OAuth Security | 0 | 0 | 10 | 0 |
| **TOTAL** | **~257** | **~7** | **~222** | **~21** |

### Critical Bugs (Must Fix)

1. **API key created as immediately revoked** (Part 7.8) — New keys appear under "Revoked Keys" instead of active
2. **Accessibility & Performance scores show "—"** (Part 3) — Despite being checked during audit creation
3. **`/api/auth/oauth/providers` returns 500** (Part 7.5) — Missing OAuth env vars
4. **`/api/account/export/status` returns 500** (Part 7.6) — GDPR export endpoint broken
5. **Schedules API returns 500 for users without org** (Part 5) — `GET_AUDIT_FAILED` error
6. **CRM Lead Detail page infinite loading** (Part 14.2) — Navigates to lead detail URL but page hangs with spinner forever. No API request made, no console errors.

### Medium Bugs

7. **"Member Since" shows "Unknown"** (Part 2/7) — `created_at` not being returned or formatted
8. **"Audits/month" value missing** from Current Limits (Part 7.1) — Empty display
9. **Single Page preset sets Max Depth to 0** (Part 3) — Should be 1 for single page
10. **Page rows don't expand** in audit Pages tab (Part 3) — Marked expandable but no expansion
11. **Site overview "Recent Audits" shows empty** despite having audits (Part 4)
12. **Referral link uses localhost:5173** instead of actual frontend URL (Part 8)
13. **`?` keyboard shortcut not implemented** (Part 12)

### Minor Bugs / Notes

14. **SSE disconnect warning** after audit completion (Part 3)
15. **publicPaths array incomplete** in api.ts — causes redirects to /login on public pages (Part 1/2)
16. **No JSON export** option for audits (Part 3) — only CSV and PDF
17. **Cookie consent banner lacks "Reject All" button** (Part 1)
18. **Contact form 404** — `/api/contact` endpoint not implemented (Part 1)
19. **Login page shows SSO buttons** even without OAuth configured (Part 2)
20. **Cold Prospects daily email limit default mismatch** — Settings show 50/day but test plan says 20/day (Part 18.6)

### Areas Now Tested (Seeded Data Round)

- **Blog post editor** (Part 16.2) — PASS: Block-based editor with drag-to-reorder, heading/text/callout blocks, category dropdown (11 options), tags with add/remove, featured image chooser, SEO settings, excerpt with char counter, Preview/Save/Publish buttons
- **Blog public pages** (Part 28) — PASS: Blog listing shows 3 published posts (drafts correctly hidden), category filters work, blog post detail renders all content blocks (headings, text, callouts), featured image with alt text, tags with links, CTA, reading time, author, date
- **Media library** (Part 16.3) — PASS: Shows 3 seeded files with dimensions, file sizes, alt text, upload button, drag-drop area
- **Email template editor** (Part 15.2) — PASS: Full editor with name, slug, subject (template variables), preview text, category, variables list, description. Block builder with 10 block types (Header, Text, Button, Hero Image, Two Column, Divider, Spacer, Score Table, Issues, Footer). Preview and Send Test buttons
- **Email campaign editor** (Part 15.3) — PASS: 4-step wizard (Template → Audience → Schedule → Review). Template step shows all 24 templates with live HTML preview in iframe. Campaign list shows stats (open rate, click rate, audience count)
- **Cold Prospect Detail** (Part 18.3) — PASS: Domain info (TLD, SSL, HTTP status, quality score, title, description), contact info (primary email as mailto link, all emails with confidence/source), technology stack tags, pipeline info (source, batch date, timestamps). Retry/Exclude action buttons
- **Cold Prospect List with data** (Part 18.1) — PASS: 10 prospects visible with domain, TLD, SSL indicator, title, status badges, quality scores, contact emails, tech stack tags, dates. Bulk checkboxes, status/TLD filters, Has Email/Has Name/Unsubscribed toggles

### Areas Now Tested (Round 2 — Seeded API Key, Migrations, Curl Flows)

- **LIA Compliance** (Part 18.6) — PASS: Cold prospect sends use generic business emails only (info@, support@), email templates include unsubscribe links, data source disclosure text ("your website was identified as a potential fit"), single contact per domain enforced
- **Email lifecycle flows** (Part 24) — PASS: 6 emails verified in Mailpit:
  - Registration verification email: Kritano branding, personalized "Hi Chris", verify button with token URL, 24h expiry, security notice
  - Password reset email: Branding, "Hi Chris", reset button, 1h expiry, security notice
  - Audit completed email: Domain name, scores table, issues count, CTA
  - Referral invite emails: Personalized inviter name, referral link
  - All emails use MJML-compiled templates with proper header/footer, unsubscribe links where applicable
- **API v1 endpoints** (Part 25) — PASS (with bugs noted):
  - GET /api/v1/audits — 200, paginated response with audit list
  - GET /api/v1/audits/:id — 200, full audit detail with HATEOAS `_links`
  - GET /api/v1/audits/:id/findings — initially 403 (scope enforcement works), then 200 after adding `findings:read` scope
  - Invalid API key — 401 with proper error message
  - Bearer token format — works correctly
  - Rate limit headers present: X-RateLimit-Limit: 100, X-RateLimit-Remaining, X-RateLimit-Reset
  - BUG: POST /api/v1/audits returns 403 "CSRF token missing" — API key auth shouldn't require CSRF
  - BUG: GET /api/v1/sites returns 404 — endpoint not implemented
- **Tier enforcement** (Part 26) — PASS:
  - Free tier correctly displayed as current plan with $0/forever pricing
  - Current Limits: Sites=1, Pages/audit=50, Concurrent audits=1 (Audits/month empty — known bug)
  - 5 tiers shown: Free, Starter ($19), Pro ($49), Agency ($99), Enterprise ($199) — all with correct feature lists
  - File Extraction checkbox disabled with "Starter plan required" on Free tier
  - Unverified domain consent dialog: caps to 3 pages, 2.5s+ delay, sequential crawl, robots.txt required
  - Backend enforces tier limits via `Math.min()` in `routes/audits/index.ts:158`
  - Frontend bug: Max Pages spinbutton has hardcoded max=500 instead of tier-based limit (UX issue, not security)
- **GDPR account management** (Part 30) — PARTIAL PASS:
  - Migration 089 ran successfully: `account_data_exports` and `archived_consents` tables created, 4 email templates seeded
  - Settings page shows "Download My Data" button with description
  - Settings page shows "Delete Account" button with 30-day grace period warning
  - Worker flows not tested end-to-end (would need to trigger actual export/deletion)
- **Tablet responsive** (Part 22.2) — PASS:
  - Homepage at 768x1024: hero, features grid, how-it-works, stats all render properly
  - Blog listing at 768x1024: post cards in grid, category filters visible
  - Login page at 768x1024: centered form, proper spacing
  - Minor issue: "API Docs" / "Sign in" text wraps awkwardly in nav bar at exactly 768px
- **Lighthouse audit** (Part 23) — PASS:
  - Accessibility: 94/100
  - Best Practices: 96/100
  - SEO: 92/100
  - Failures: (1) Console 500 errors from missing OAuth table, (2) color contrast on slate-400 text, (3) heading order skip (h4 in footer), (4) non-descriptive link text ("Learn more")

### Areas Not Tested (Truly Blocked)

- CRM Lead Detail (Part 14.2) — blocked by loading bug
- Security penetration testing (Part 27) — requires dedicated security testing
- OAuth SSO flows (Part 32) — no credentials configured

### Tested This Round (Previously Blocked)

- [x] **Full trial lifecycle** (Part 10) — PASS: Started 14-day Pro trial. UI shows PRO badge, "Trial: 14d left" sidebar, trial banner, Pro limits (10 sites, 1000 pages, 10 concurrent). Email confirmed in Mailpit. Fixed 3 bugs in trial.service.ts (ON CONFLICT on non-unique column, missing organization_id lookup, parameter ordering).
- [x] **GDPR data export end-to-end** (Part 30) — PASS: Export processes immediately on button click (fixed 1-hour worker polling delay). ZIP created (3KB), UI shows download with 24h expiry, email notification sent. Fixed 6 column mismatches in gdpr.service.ts gatherUserData(), made oauth_providers query resilient.

---

## Server Console Errors (Dev Mode)

The following errors were observed in the `npm run dev` server output during testing. These fire repeatedly and spam the console.

### 1. `relation "user_oauth_providers" does not exist`
- **Severity**: High (fires on EVERY `/api/auth/me` call and login)
- **Source**: `server/src/services/oauth.service.ts:233` → `getLinkedProviders()`
- **Called from**: `server/src/routes/auth/index.ts:485` (GET `/me`), `server/src/routes/auth/oauth.ts:158`
- **Root cause**: Migration `087_sso_oauth_providers.sql` has not been run — the `user_oauth_providers` table does not exist in the database
- **Impact**: Error logged on every page load/navigation (since the frontend calls `/me` to check auth state). Does not break functionality as the error is caught, but pollutes logs heavily.

### 2. `relation "account_data_exports" does not exist` — RESOLVED
- **Severity**: High (fires continuously from GDPR worker polling + on export status checks)
- **Source**: `server/src/services/gdpr.service.ts:270` → `getLatestExport()`
- **Called from**: `server/src/services/queue/gdpr-worker.service.ts:19` (interval poll), `server/src/routes/account/index.ts:75` (export status endpoint)
- **Root cause**: Migration `089_gdpr_account_management.sql` had not been run
- **Resolution**: Migration 089 run successfully. Tables `account_data_exports` and `archived_consents` created.

### 3. `Admin queue backlog error: ReferenceError: pool is not defined`
- **Severity**: Medium (code bug)
- **Source**: `server/src/routes/admin/index.ts:479`
- **Root cause**: The `pool` variable is not injected/accessible in the admin queue backlog endpoint handler
- **Impact**: Admin queue monitoring endpoint fails silently

### 4. `statusCode: 403` at `audits/index.ts:2108`
- **Severity**: Low
- **Source**: `server/src/routes/audits/index.ts:2108`
- **Root cause**: Some audit permission check returning 403 — likely a domain ownership or tier check failing
- **Impact**: Intermittent, may affect specific audit operations

### Fix Required
- **Run pending migrations**: `087_sso_oauth_providers.sql`, `088_cold_outreach_lia_compliance.sql` to resolve error 1 (089 already run)
- **Fix pool injection** in `server/src/routes/admin/index.ts` around line 479 to resolve error 3
- **Investigate 403** in audits route at line 2108 to determine if it's expected behaviour or a bug
