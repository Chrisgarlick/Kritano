# PagePulser — Full Test Plan

A step-by-step walkthrough to verify every user-facing feature before go-live. Work through each section in order — later sections depend on data created in earlier ones.

**Mailpit:** `http://localhost:8025`
**App:** `http://localhost:5173` (or `http://localhost:3000`)

---

## Part 1: Public Pages (Logged Out)

Start in an incognito/private window so you're fully logged out.

### 1.1 Home Page

- [ ] Navigate to `/` — hero section loads with headline, description, and two CTAs
- [ ] Click "Start Free Analysis" — redirects to `/register`
- [ ] Go back. Click "Learn More" — scrolls or navigates appropriately
- [ ] Scroll down — features grid, "How It Works" steps, stats section, and final CTA all render
- [ ] Check the score card demo shows sample scores for all categories
- [ ] Click "Get Started Free" in the final CTA — redirects to `/register`
- [ ] Success stories section renders (if any published)

### 1.2 About Page

- [ ] Navigate to `/about` — hero, mission, values (4 cards), and story section render
- [ ] "About" link in nav is highlighted (indigo)
- [ ] CTA buttons link to `/register` and `/contact`

### 1.3 Services Overview Page

- [ ] Navigate to `/services` — hero and all 4 service sections render in zig-zag layout
- [ ] "Services" nav link is highlighted
- [ ] Each service title is clickable — links to `/services/{slug}`
- [ ] Each service has a "Try X Free" button (links to `/register`) and a "Learn more" link
- [ ] "Beyond Auditing" section shows 4 mini-feature cards
- [ ] Bottom CTA links to `/register`

### 1.4 Service Detail Pages

Test each of the 4 sub-pages:

- [ ] `/services/seo` — loads with indigo colour scheme, breadcrumb shows "Services > SEO Auditing"
- [ ] `/services/accessibility` — loads with emerald colour scheme
- [ ] `/services/security` — loads with red colour scheme
- [ ] `/services/performance` — loads with amber colour scheme

For each sub-page verify:

- [ ] Hero section: icon, title, subtitle, extended description
- [ ] Feature Breakdown: 3-column grid of feature group cards with checklist items
- [ ] How We Audit: 4 numbered methodology steps
- [ ] Common Issues: grid of issue cards with severity badges (critical/serious/moderate/minor)
- [ ] Why It Matters: headline + 3 stat cards
- [ ] Related Services: 3 cards linking to the other services — click one, it navigates correctly
- [ ] CTA section with service-specific button text
- [ ] "Services" nav link stays highlighted on all sub-pages
- [ ] Navigate to `/services/invalid` — redirects back to `/services`

### 1.5 Pricing Page

- [ ] Navigate to `/pricing` — 5 tier cards render (Free, Starter, Pro, Agency, Enterprise)
- [ ] Pro tier is visually highlighted as "Most Popular"
- [ ] Each plan shows name, price, description, and feature list
- [ ] CTA buttons link to `/register` for all plans (including Enterprise at $199/mo)
- [ ] Feature comparison table expands/collapses — check all sections
- [ ] FAQ section — each question expands/collapses on click
- [ ] Bottom CTA links to `/register`

### 1.6 Contact Page

- [ ] Navigate to `/contact` — form and contact info sidebar render
- [ ] Submit empty form — validation errors appear on required fields
- [ ] Fill in valid data (Name, Email, Subject dropdown, Message) and submit
- [ ] Success confirmation message appears
- [ ] Contact sidebar shows email, location, and response time

### 1.7 Blog

- [ ] Navigate to `/blog` — post grid renders with pagination
- [ ] Category filter dropdown works — filters posts by category
- [ ] Click a post card — navigates to `/blog/{slug}`
- [ ] Post detail page shows: title, author, publish date, read time, content blocks, category/tag badges
- [ ] Related posts section renders at bottom (if configured)
- [ ] "Back to blog" link works
- [ ] Empty state renders if no posts exist yet

### 1.8 Legal Pages

- [ ] Navigate to `/terms` — Terms of Service page renders with full content
- [ ] Navigate to `/privacy` — Privacy Policy page renders with full content
- [ ] Footer links to both pages work

### 1.9 Navigation & Footer

- [ ] Desktop nav: all links (About, Services, Pricing, Blog, Contact) work
- [ ] Active page link is highlighted in indigo
- [ ] "Sign in" and "Get Started" buttons visible when logged out
- [ ] Resize to mobile — hamburger menu appears, all links accessible in mobile menu
- [ ] Footer: all links work (Product, Company, Resources sections)
- [ ] Footer CTA banner: "Start Free Audit" links to `/register`
- [ ] Copyright year is current year

### 1.10 Error Pages

- [ ] Navigate to `/some-random-path` — 404 page renders with "Page not found", action buttons, and quick links
- [ ] "Go Back" button works
- [ ] Navigate to `/error` — 500 page renders with retry countdown and action buttons

### 1.11 Cookie Consent Banner

- [ ] On first visit (clear localStorage) — cookie consent banner appears at bottom
- [ ] Click "Accept All" — banner dismisses, consent logged
- [ ] Clear localStorage, reload — banner reappears
- [ ] Click "Reject All" — banner dismisses
- [ ] Click "Preferences" — modal opens with 3 categories (Necessary, Analytics, Marketing)
- [ ] Necessary is always on and disabled
- [ ] Toggle Analytics and Marketing independently
- [ ] Click "Save Preferences" — modal closes, banner dismisses
- [ ] Reload page — banner does NOT reappear (consent persisted in localStorage)
- [ ] Check `pp-cookie-consent` key in localStorage has correct structure

### 1.12 SEO Meta Tags

- [ ] View page source on `/` — verify `<title>`, `<meta name="description">`, OG tags, Twitter card tags are present
- [ ] Check `/blog/{slug}` — post-specific SEO metadata renders
- [ ] If admin has set SEO overrides (Part 20), verify they appear correctly on the target route

### 1.13 SEO Static Files

- [ ] Navigate to `/robots.txt` — file loads with valid content
- [ ] Verify `robots.txt` disallows admin paths and allows public pages
- [ ] Navigate to `/sitemap.xml` — file loads with valid XML structure
- [ ] Verify `sitemap.xml` includes all public pages (home, about, services, pricing, contact, blog, privacy, terms)
- [ ] Navigate to `/site.webmanifest` — file loads with valid JSON
- [ ] Verify manifest contains proper metadata (name, short_name, theme_color, icons)

### 1.14 Coming Soon Mode (Public)

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

---

## Part 2: Authentication

### 2.1 Registration

- [ ] Navigate to `/register`
- [ ] Submit empty form — validation errors on all required fields
- [ ] Enter invalid email format — email validation error
- [ ] Enter password that's too short — password validation error
- [ ] Enter valid details (First name, Last name, Email, Password) and submit
- [ ] Terms of Service acceptance checkbox must be ticked
- [ ] Redirects to `/register/success` with confirmation message
- [ ] Check Mailpit — verification email received
- [ ] Click verification link in email — `/verify-email?token=...` page loads
- [ ] Page shows spinner, then "Email Verified" success message
- [ ] "Go to Dashboard" button navigates to `/dashboard`

### 2.2 Registration with Referral Code

- [ ] Navigate to `/register?ref=REF-XXXXXXXX` (use a valid referral code)
- [ ] Referral code is pre-filled or captured silently
- [ ] Complete registration — referral is tracked (visible in referrer's dashboard)

### 2.3 Early Access Registration

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

- [ ] Navigate to `/verify-email` with no token — error message "No token provided"
- [ ] Navigate to `/verify-email?token=invalid-token` — error message about expired/invalid link
- [ ] Click verification link a second time — appropriate error (already verified or expired)
- [ ] On `/settings/profile`, if not verified — "Not Verified" badge shows with "Resend Verification" button
- [ ] Click "Resend Verification" — success toast, new email arrives in Mailpit
- [ ] Click new verification link — email verified successfully

### 2.5 Login

- [ ] Navigate to `/login`
- [ ] Submit empty form — validation errors
- [ ] Enter wrong credentials — error message displayed
- [ ] Enter correct credentials — redirects to `/dashboard`
- [ ] Nav now shows "Dashboard" button instead of "Sign in" / "Get Started"

### 2.6 Password Reset

- [ ] On login page, click "Forgot password" link
- [ ] Enter registered email — success message ("check your email")
- [ ] Check Mailpit — password reset email received
- [ ] Click reset link — new password form loads
- [ ] Enter new password and confirm — success, redirected to login
- [ ] Login with new password — works

### 2.7 Auth Redirects

- [ ] While logged out, navigate to `/dashboard` — redirects to `/login`
- [ ] While logged out, navigate to `/audits` — redirects to `/login`
- [ ] While logged out, navigate to `/services/seo` — stays on page (no redirect)
- [ ] While logged out, navigate to `/blog/some-slug` — stays on page (no redirect)
- [ ] While logged out, navigate to `/admin` — redirects to `/login`

### 2.8 Session Management

- [ ] On `/settings/profile` — active sessions list shows current session
- [ ] "Logout All Devices" button — logs out everywhere, redirects to login
- [ ] Login again — only one session shows

---

## Part 3: Dashboard & Core User Features

Log in as a regular user.

### 3.1 Dashboard

- [ ] Navigate to `/dashboard` — personalised greeting ("Welcome back, [Name]")
- [ ] If no audits: empty state with CTA to create first audit
- [ ] If audits exist: health score hero card, stats grid (Total Audits, Sites Monitored, Issues Found, Completed), recent audits list
- [ ] Click an audit in the recent list — navigates to audit detail
- [ ] Click "New Audit" button — navigates to `/audits/new`
- [ ] Click "View all sites" — navigates to `/sites`
- [ ] Active announcements banner appears at top (if admin has created one targeting your tier)
- [ ] Dismiss an announcement — it doesn't reappear

### 3.2 Create & Run an Audit

- [ ] Navigate to `/audits/new`
- [ ] URL input is empty (or pre-filled if coming from a site)
- [ ] Type a URL — recent URLs autocomplete dropdown appears (if you have history)
- [ ] Enter a valid URL and press Tab/blur — URL reachability check runs (green tick or red X)
- [ ] Toggle audit options: SEO, Accessibility, Security, Performance, File Extraction
- [ ] Expand "Advanced options" — max pages, crawl depth, robots.txt, subdomains options visible
- [ ] Click "Start Audit" — audit begins, redirects to audit detail page
- [ ] SSE progress stream shows live crawl progress (pages found, pages audited, current URL)
- [ ] If domain is unverified — consent modal appears explaining restrictions. Accept and continue.

### 3.2B Audit Progress & Two-Phase Pipeline

- [ ] After starting an audit, status transitions through: Pending → Discovering → Queued (Ready) → Scanning (Processing) → Complete
- [ ] 5-step progress indicator updates in real-time on the audit detail page
- [ ] During "Discovering" phase — pages found counter updates as sitemap/robots.txt are parsed
- [ ] During "Queued" (Ready) phase — queue position and estimated wait time display
- [ ] During "Scanning" phase — pages crawled, pages audited, and current URL update live via SSE
- [ ] Category scores (SEO, Accessibility, Security, Performance) update in real-time as pages are scanned
- [ ] Issue count updates as findings are discovered
- [ ] Refresh the page during an active audit — SSE reconnects and progress continues
- [ ] Submit a small (5-page) and large (100-page) audit simultaneously — small audit should be claimed first (page budget priority)
- [ ] "Discovering" and "Ready" status badges render correctly in audit list

### 3.3 Audit List

- [ ] Navigate to `/audits` — table of all your audits
- [ ] Status filter dropdown works (All, Pending, Processing, Completed, Failed, Cancelled)
- [ ] Search input filters by URL/domain
- [ ] Column headers are sortable (click Issues, Started)
- [ ] Pagination works — next/previous pages
- [ ] Select audit checkboxes — bulk delete button appears
- [ ] Click "View" on an audit — navigates to audit detail
- [ ] Empty state shows if no audits match filters

### 3.4 Audit Detail

Wait for an audit to complete, then:

- [ ] Navigate to `/audits/{id}` — header shows URL, domain, status badge, dates, page counts
- [ ] Overall health score displays as a large circular progress indicator
- [ ] 6 category score cards render (SEO, Accessibility, Security, Performance, Content, Structured Data)
- [ ] Category radar chart visualises scores
- [ ] Severity donut chart shows issue breakdown

**Findings tab:**

- [ ] Findings are grouped by rule with severity and category badges
- [ ] Expand a finding — affected pages, page-specific messages, code snippets, recommendation, help URL
- [ ] Click dismiss on a finding — it shows as dismissed
- [ ] Click undismiss — it reactivates
- [ ] Bulk dismiss: select multiple findings, click "Dismiss Selected"

**Other tabs:**

- [ ] Schema tab — structured data findings render (if check was run)
- [ ] Index Exposure tab — exposed pages render (if available, Pro+ tier)
- [ ] Files tab — extracted files with types and sizes render
- [ ] Score History — line chart showing score trends over time
- [ ] Content tab — readability, engagement, keywords, E-E-A-T, AEO analysis (if Pro+ tier)

**Actions:**

- [ ] Click "Re-run Audit" — new audit starts for the same URL
- [ ] Click "Delete" — confirmation dialog, audit is removed
- [ ] Click "Cancel" on a running audit — audit stops, status changes to cancelled

**Exports (test each):**

- [ ] PDF export — downloads a PDF file, open it, verify content matches the audit
- [ ] CSV export — downloads CSV, open in spreadsheet, verify columns and data
- [ ] JSON export — downloads JSON, open it, verify structure
- [ ] HTML export — downloads HTML file
- [ ] Markdown export — downloads .md file
- [ ] Print — print dialog opens with formatted content
- [ ] Verify all exports include ALL audit data (scores, findings, content analysis, schema, etc.)

### 3.5 Page Detail

- [ ] From audit detail, click a page URL in findings — navigates to `/audits/{id}/pages/{pageId}`
- [ ] Page-specific scores and findings render
- [ ] Schema tab — JSON-LD schema for this specific page
- [ ] Rich snippet preview — shows how the page would appear in Google search
- [ ] "Generate Schema" button — generates JSON-LD structured data for the page
- [ ] Assets tab — files referenced by this page
- [ ] Back to audit link works

---

## Part 4: Site Management

### 4.1 Sites List

- [ ] Navigate to `/sites` — site list page loads
- [ ] Click "Add Site" — modal opens with name, domain, description inputs
- [ ] Submit with valid data — site created, appears in list
- [ ] Submit with duplicate domain — error message
- [ ] Usage indicator shows "X / Y sites" based on plan limits
- [ ] Toggle grid/list view — layout switches, preference persists on reload
- [ ] Search input filters sites by name or domain
- [ ] Empty state shows CTA if no sites

### 4.2 Site Detail

- [ ] Click a site — navigates to `/sites/{siteId}`
- [ ] Overview tab: health score card, category scores, score history charts, latest audit summary
- [ ] Audits tab: paginated list of audits for this site, click one to view detail
- [ ] URLs tab: list of discovered pages, pagination, can add a URL manually
- [ ] Click "Discover Pages" — sitemap crawl runs, new URLs appear
- [ ] Sharing tab: shows current members and permissions
- [ ] Invite a team member by email — invitation sent
- [ ] Check Mailpit — invitation email received
- [ ] Member limit indicator shows usage vs plan limit
- [ ] Settings tab: edit site name, domain, description
- [ ] Click "Run Audit" — navigates to new audit page pre-filled with site domain
- [ ] Transfer ownership — transfer site to another user by email

### 4.3 Domain Verification

- [ ] On a site's settings, click "Start Verification" — token is generated, instructions appear
- [ ] **DNS option**: shows Record Type (TXT), Host (_pagepulser), and Value fields separately
- [ ] Step-by-step guide expands with DNS provider instructions
- [ ] **File option**: shows full URL and token content
- [ ] Step-by-step guide expands with SSH/FTP instructions including `.well-known` creation
- [ ] Introductory text explains which method suits which situation
- [ ] Complete one verification method — success message, site marked as verified
- [ ] Check Mailpit — "Domain Verified" email received with domain name and method used

### 4.4 Site Invitations

- [ ] From site sharing tab, invite a user by email
- [ ] Open invitation link (from Mailpit or directly) in another browser/session
- [ ] `/site-invitations/{token}` — shows invitation details (site name, permission level, inviter)
- [ ] Click Accept — gain access, redirected to site detail
- [ ] Test Decline — invitation is removed
- [ ] Test expired invitation — appropriate error message
- [ ] Test invalid token — appropriate error message

---

## Part 5: Scheduled Audits

### 5.1 Create a Schedule

- [ ] Navigate to `/schedules` — schedule list page loads
- [ ] Click "New Schedule" — modal opens
- [ ] Select a site from dropdown
- [ ] Choose frequency preset (daily, weekly, biweekly, monthly)
- [ ] Or set custom cron expression
- [ ] Set timezone
- [ ] Configure notification preferences (email on complete, email on failure)
- [ ] Submit — schedule created, appears in list with next run time

### 5.2 Schedule List

- [ ] All schedules show: site name, frequency, next run, last run status, enabled/disabled toggle
- [ ] Toggle a schedule off — status updates to "Paused"
- [ ] Toggle back on — status updates to "Active", next run recalculates
- [ ] Delete a schedule — confirmation, removed from list

### 5.3 Schedule Detail

- [ ] Click a schedule — navigates to `/schedules/{id}`
- [ ] Shows full configuration: site, frequency, timezone, notifications
- [ ] Run history table shows past automated runs with status and links to audits
- [ ] "Run Now" button — triggers immediate audit
- [ ] Edit frequency — save, next run updates

### 5.4 Tier Restrictions

- [ ] Free tier users cannot create schedules (UI should show upgrade prompt)
- [ ] Starter tier: minimum 7-day frequency
- [ ] Pro tier: minimum 1-day frequency
- [ ] Agency tier: minimum 1-hour frequency

---

## Part 6: Analytics

### 6.1 Analytics Dashboard

- [ ] Navigate to `/analytics` — summary cards, time range selector, score trend chart load
- [ ] Change time range (7d, 30d, 90d) — chart updates
- [ ] Quick category filters work
- [ ] Site ranking table shows sites ordered by overall score
- [ ] Audited URL count displays

### 6.2 Site Analytics

- [ ] Navigate to `/analytics/sites/{siteId}` — score line chart, issue trends, category breakdown render
- [ ] Time range picker works
- [ ] Top issues section shows most critical findings

### 6.3 URL Analytics

- [ ] Navigate to `/analytics/sites/{siteId}/urls/{urlId}` — page-specific score trends and findings

### 6.4 Audit Comparison

- [ ] Navigate to `/analytics/compare` — select 2+ audits, side-by-side scores and findings compare
- [ ] Score difference indicators show improvement/regression

### 6.5 Site Comparison

- [ ] Navigate to `/analytics/compare-sites` — select 2+ sites, metrics compare

### 6.6 URL Comparison

- [ ] Navigate to `/compare` — unified URL comparison interface
- [ ] Search and select two URLs from different sites
- [ ] Side-by-side score comparison renders with trend indicators

---

## Part 7: Settings

### 7.1 Profile

- [ ] Navigate to `/settings/profile`
- [ ] Update first name, last name — save, verify changes persist on reload
- [ ] Current subscription tier and usage stats display correctly
- [ ] Email verification status shows (Verified badge or Not Verified + Resend button)
- [ ] If not verified: click "Resend Verification" — toast confirms, email arrives in Mailpit
- [ ] Password change: enter current password, new password, confirm — success
- [ ] Password change: wrong current password — error message
- [ ] Active sessions list shows current session with device info
- [ ] "Logout All Devices" — logs out everywhere

### 7.2 Sites Settings

- [ ] Navigate to `/settings/sites` — list of all your sites with edit/delete actions
- [ ] Edit a site — modal/form opens, save changes, verify
- [ ] Delete a site — confirmation dialog, site removed

### 7.3 Branding Settings

- [ ] Navigate to `/settings/branding`
- [ ] Upload a logo, set company name and colours
- [ ] Save — changes persist
- [ ] Run a PDF export from an audit — branding appears in the export
- [ ] (Agency+ tier only) White-label branding applied to reports

### 7.4 Notification Settings

- [ ] Navigate to `/settings/notifications`
- [ ] Toggle email preferences (audit notifications, product updates, educational, marketing)
- [ ] Save — changes persist
- [ ] Trigger an audit — verify notification respects your settings

### 7.5 API Keys

- [ ] Navigate to `/settings/api-keys`
- [ ] Click "Create API Key" — modal opens, enter name, select scopes
- [ ] Create — full key shown (copy warning). Copy it.
- [ ] Key appears in table with name, masked key, creation date
- [ ] View key stats — usage count, last used
- [ ] Revoke a key — confirmation, key is revoked
- [ ] Delete a key — key removed from table
- [ ] Rate limit and tier info visible

---

## Part 8: Referrals

### 8.1 Referral Dashboard

- [ ] Navigate to `/referrals` — referral dashboard loads
- [ ] Referral link card shows your unique link (e.g., `https://pagepulser.com/register?ref=REF-XXXXXXXX`)
- [ ] Click "Copy" — link copied to clipboard, button changes to "Copied"
- [ ] Stats cards show: Total Referred, Rewarded, Bonus Audits Earned, Bonus Audits Left

### 8.2 Milestone Progress

- [ ] Progress bar shows progress toward next milestone (5 or 10 qualified referrals)
- [ ] Milestone text explains the reward (free month of Starter at 5, free month of Pro at 10)
- [ ] Explanatory text states: "A referral qualifies when the invited user verifies their email and completes their first audit"

### 8.3 Invite by Email

- [ ] Enter up to 5 comma-separated email addresses
- [ ] Click "Send Invites" — loading state, then success message with count
- [ ] Check Mailpit — referral invitation emails received
- [ ] Enter > 5 emails — button does nothing (client-side limit)
- [ ] Enter invalid email — error message

### 8.4 Referral Table

- [ ] Your referrals table shows: user name, email, status badge, reward, date
- [ ] Status badges: Pending (amber), Qualified (blue), Rewarded (green), Voided (red)
- [ ] Empty state shows "No referrals yet" message

### 8.5 Referral Lifecycle Test

- [ ] Share referral link with a test email
- [ ] Register with the referral link — referral shows as "Pending" in your dashboard
- [ ] Verify the referred user's email — referral still "Pending" (needs audit too)
- [ ] Run first audit as the referred user — referral qualifies and becomes "Rewarded"
- [ ] Referrer receives bonus audits — "Bonus Audits Earned" count increments

---

## Part 9: User Feedback

### 9.1 Bug Report

- [ ] Click the floating feedback button (bottom-right on authenticated pages)
- [ ] Select "Report a Bug"
- [ ] Modal opens with Title, Description, Severity, Category fields
- [ ] Page URL and browser info are auto-populated
- [ ] Submit empty — validation errors
- [ ] Fill in valid data and submit — success confirmation, modal auto-closes
- [ ] Verify the report appears in admin bug reports (Part 14)

### 9.2 Feature Request

- [ ] Click feedback button → "Request a Feature"
- [ ] Modal opens with Title, Description, Impact, Category fields
- [ ] Submit valid data — success confirmation
- [ ] Verify the request appears in admin feature requests (Part 14)

---

## Part 10: Free Trial

### 10.1 Start a Trial

- [ ] On `/settings/profile` or `/pricing` — "Start Free Trial" option available
- [ ] Select a tier (Starter, Pro, or Agency)
- [ ] If email not verified — error "Please verify your email first"
- [ ] If already used trial — error message
- [ ] Start trial — subscription changes to "trialing", tier updates
- [ ] Sidebar shows trial countdown badge ("X days remaining")
- [ ] Check Mailpit — "Trial Started" email received

### 10.2 Trial Features

- [ ] Tier limits update immediately — can access higher-tier features
- [ ] Create audits with higher page limits
- [ ] Access features gated by the trial tier (accessibility, performance, etc.)

### 10.3 Trial Expiry

- [ ] When trial is near expiry — "Trial Expiring" email sent (check worker runs)
- [ ] When trial expires — tier reverts to Free, "Trial Expired" email sent
- [ ] Features are restricted back to Free tier limits

---

## Part 11: Dark Mode & Theme

- [ ] Click theme toggle in sidebar (sun/moon icon)
- [ ] All pages switch between light and dark mode
- [ ] Preference persists across page reloads (stored in localStorage)
- [ ] Check key pages in dark mode:
  - [ ] Dashboard — all cards, charts, text readable
  - [ ] Audit detail — findings, tabs, scores all properly themed
  - [ ] Settings pages — forms, inputs, labels properly themed
  - [ ] Public pages — hero sections, cards, footer properly themed

---

## Part 12: Keyboard Shortcuts

- [ ] Press `n` on dashboard — navigates to new audit page
- [ ] Press `/` — focuses search input (if present on current page)
- [ ] Press `Esc` — closes any open modal or blurs focused element
- [ ] Press `?` — shows keyboard shortcuts help dialog

---

## Part 13: Admin Panel

Log in as a super admin user.

### 13.1 Admin Dashboard

- [ ] Navigate to `/admin` — dashboard stats load (users, orgs, audits, system health)
- [ ] System health indicators show status for database, API, worker, cache
- [ ] Worker controls: view queue size, processing count, failed count
- [ ] Click "Restart Worker" — confirmation dialog, worker restarts
- [ ] Worker memory bar shows current usage % with colour coding (green < 60%, amber 60-85%, red > 85%)
- [ ] Free MB / Total MB and effective concurrency displayed below the worker stats
- [ ] Worker `/status` endpoint returns `memory` object (check via curl or browser)
- [ ] Module summary cards show CRM, Email, CMS quick stats
- [ ] Analytics charts render (user growth, audits/day)
- [ ] Recent activity log shows last 10 events

### 13.2 Admin Users

- [ ] Navigate to `/admin/users` — paginated user table
- [ ] Search by email or name — results filter
- [ ] Sort by different columns
- [ ] Toggle super admin on a user — confirmation, badge updates
- [ ] Delete a user — confirmation dialog, user removed

### 13.3 Admin Organizations

- [ ] Navigate to `/admin/organizations` — paginated list
- [ ] Search and filter by tier
- [ ] View organization detail — members, subscription, usage
- [ ] Update subscription tier — change tier, confirm, verify

### 13.4 Admin Activity Log

- [ ] Navigate to `/admin/activity` — chronological log of actions
- [ ] Filter by user or action type
- [ ] Pagination works

### 13.5 Admin Bug Reports

- [ ] Navigate to `/admin/bug-reports` — list with stats cards (total, open, in progress, resolved)
- [ ] Filter by status, severity, search by title
- [ ] Click a report — detail page with full info, browser data, page URL
- [ ] Change status (open → in progress → resolved)
- [ ] Add an admin comment — appears in comments thread
- [ ] Delete a report — confirmation, removed from list

### 13.6 Admin Feature Requests

- [ ] Navigate to `/admin/feature-requests` — list with stats cards
- [ ] Filter by status, impact, category
- [ ] Click a request — detail page with full info
- [ ] Change status (submitted → under review → planned → completed)
- [ ] Add an admin comment
- [ ] Delete a request

### 13.7 Admin Schedules

- [ ] Navigate to `/admin/schedules` — all schedules across all users
- [ ] Stats cards show total, active, paused counts
- [ ] View schedule detail — full config, run history
- [ ] Edit/delete a schedule as admin

---

## Part 14: Admin CRM

### 14.1 CRM Leads

- [ ] Navigate to `/admin/crm/leads` — leads table with stat cards at top
- [ ] Hover each stat card — tooltip appears explaining the status:
  - Total: "Total number of leads across all statuses"
  - New: "Registered but hasn't run an audit or verified a domain yet"
  - Activated: "Has completed at least one audit — showing initial interest"
  - Engaged: "Regularly running audits and actively using the platform"
  - Power User: "Heavy usage — multiple sites, team members, or frequent audits"
  - Upgrade Prospect: "Hitting plan limits or using features available on higher tiers"
  - Churning: "Activity has dropped significantly — at risk of leaving"
  - Churned: "No activity for an extended period — considered inactive"
- [ ] Status filter dropdown works
- [ ] Search by name or email works
- [ ] Sort options work (lead score, date joined, last login)
- [ ] Pagination works
- [ ] Click a lead — navigates to lead detail

### 14.2 CRM Lead Detail

- [ ] Navigate to `/admin/crm/leads/{userId}` — lead profile loads
- [ ] Profile shows: email, name, status, lead score, tier, audit count, sites, verified domains
- [ ] Activity timeline shows chronological events (registration, first audit, logins, etc.)
- [ ] Membership section shows sites the user belongs to
- [ ] Outreach section shows previous emails sent to this user
- [ ] "Recalculate Score" button works — score updates
- [ ] "Send Email" — can select a template and send outreach email
- [ ] Check Mailpit — outreach email received

### 14.3 CRM Triggers

- [ ] Navigate to `/admin/crm/triggers` — triggers list
- [ ] Stats cards show total, pending, sent, dismissed, actioned counts
- [ ] Filter by status and type
- [ ] Pagination works
- [ ] Action a trigger — mark as sent, dismissed, or actioned
- [ ] Verify that domain verification creates a `domain_verified` trigger (from Part 4.3)

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

- [ ] Navigate to `/admin/email/templates` — template list
- [ ] System templates visible: email_verification, password_reset, audit_completed, domain_verified, welcome_first_audit, verify_domain_howto, security_alert_dorking, upgrade_hitting_limits, aeo_improvement_guide, content_improvement_guide, churn_risk_winback, score_celebration, referral_invite, trial_started, trial_expiring, trial_expired
- [ ] Search by name works
- [ ] Filter by category works
- [ ] Click a template — navigates to editor

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

- [ ] Navigate to `/admin/email/campaigns` — campaigns list
- [ ] Filter by status (draft, scheduled, sending, sent, cancelled)
- [ ] Click "Create Campaign" — navigates to editor
- [ ] Fill in campaign name, select a template
- [ ] Configure segment (by tier, lead status, score range, domain verified, audit count, date ranges)
- [ ] Check audience count — updates based on segment criteria
- [ ] Save as draft — campaign appears in list as "Draft"
- [ ] Launch a campaign — confirmation, status changes to "Sending"
- [ ] Check Mailpit — campaign emails arrive for matching users
- [ ] View campaign sends — list of individual sends with statuses
- [ ] Pause/resume a campaign — status updates accordingly
- [ ] Schedule a campaign — set future date, status shows "Scheduled"

### 15.4 Email Analytics

- [ ] Navigate to `/admin/email/analytics` — totals render (sent, delivered, opened, clicked, bounced)
- [ ] Daily chart shows email volume over time
- [ ] Template performance table shows per-template open/click rates
- [ ] Change time range — data updates

---

## Part 16: Admin CMS

### 16.1 Blog Posts

- [ ] Navigate to `/admin/cms/posts` — posts list with stats
- [ ] Filter by status (draft, published, archived) and category
- [ ] Search by title
- [ ] Click "New Post" — navigates to editor

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

- [ ] Navigate to `/admin/cms/media` — media grid loads
- [ ] Upload an image (drag-and-drop or click) — appears in grid with thumbnail
- [ ] Edit alt text on an image — save, verify
- [ ] Copy image URL — paste in browser, image loads
- [ ] Delete an image — confirmation, removed from grid

### 16.4 Advice Templates

- [ ] Navigate to `/admin/cms/advice` — advice templates list
- [ ] Filter by category, search by name
- [ ] Edit an advice template — update description, recommendation, learn more URL
- [ ] Save — changes persist
- [ ] Run an audit — verify custom advice appears in findings for matching rules

### 16.5 Announcements

- [ ] Navigate to `/admin/cms/announcements` — announcements list
- [ ] Create a new announcement: title, body, type (info/success/warning/maintenance), target tiers, CTA, date range
- [ ] Set as active — announcement appears to targeted users in the app (check dashboard)
- [ ] Edit/update an announcement — changes persist
- [ ] Delete an announcement — removed
- [ ] User can dismiss the announcement — doesn't reappear

### 16.6 Success Stories

- [ ] Navigate to `/admin/cms/stories` — stories list
- [ ] Create a story: domain, category, score before/after, headline
- [ ] Mark as published — appears in public-facing success stories (home page)
- [ ] Edit/delete stories

---

## Part 17: Admin Marketing

### 17.1 Marketing Content Calendar

- [ ] Navigate to `/admin/marketing/content` — content list/calendar view
- [ ] Filter by platform, campaign, status, week
- [ ] Create new content item — fill in platform, copy, scheduled date, campaign
- [ ] Edit content — save changes
- [ ] Update status (draft → scheduled → published)
- [ ] Delete content item

### 17.2 Marketing Campaigns

- [ ] Navigate to `/admin/marketing/campaigns` — campaign list
- [ ] Create new campaign — name, description, date range
- [ ] Edit/delete campaigns
- [ ] Content items can be associated with campaigns

---

## Part 18: Admin Cold Prospects

### 18.1 Cold Prospects Dashboard

- [ ] Navigate to `/admin/cold-prospects` — dashboard with pipeline stats
- [ ] Stats cards show: total, checked, qualified, contacted, excluded
- [ ] Daily stats chart shows import/qualification trends
- [ ] TLD breakdown visible

### 18.2 Cold Prospects List

- [ ] Navigate to `/admin/cold-prospects/list` — full prospect table
- [ ] Filter by status, TLD, score, email availability
- [ ] Search by domain
- [ ] Pagination works
- [ ] Bulk exclude — select multiple, click exclude

### 18.3 Cold Prospect Detail

- [ ] Click a prospect — navigates to `/admin/cold-prospects/{id}`
- [ ] Shows domain info, HTTP status, SSL, title, emails found, qualification score
- [ ] Can retry processing a failed prospect
- [ ] Can exclude/delete a prospect

### 18.4 Cold Prospect Outreach

- [ ] On dashboard, outreach panel shows stats: sent, queued, opened, clicked, today's count
- [ ] Open/click rates display
- [ ] "Auto Outreach" toggle — enable/disable automatic sending
- [ ] "Send Batch" button — manually trigger outreach batch
- [ ] Recent sends table shows: email, template, status, sent time
- [ ] Check Mailpit — cold outreach emails arrive
- [ ] Unsubscribe link in email — click it → `/api/cold-unsubscribe?token=...` renders HTML confirmation
- [ ] After unsubscribe, that email is skipped in future batches

### 18.5 Pipeline Settings

- [ ] Access pipeline settings — daily email limit, check interval, qualification criteria
- [ ] Update settings — save, verify changes persist

---

## Part 19: Admin Referrals

- [ ] Navigate to `/admin/referrals` — platform-wide referral stats
- [ ] Total referrals, conversion rate, top referrers visible
- [ ] Referral list with filters (by status)
- [ ] View referral config — enabled, max referrals, reward values
- [ ] Update config — save
- [ ] Void a referral — confirmation, status changes, rewards reversed

---

## Part 20: Admin System Settings

### 20.1 Trigger Automation

- [ ] Navigate to `/admin/settings` — "Trigger Automation" section visible with Zap icon
- [ ] 8 toggle switches for each trigger type:
  - First Audit Complete
  - Stalled Verification
  - Security Alert
  - Upgrade Nudge
  - Low AEO Score
  - Low Content Score
  - Churn Risk
  - Score Improvement
- [ ] Toggle a trigger off — toggle animates, saves automatically
- [ ] Toggle back on — saves, loading spinner shows briefly
- [ ] Description text for each trigger is clear and helpful

### 20.2 Early Access

- [ ] "Early Access" section with Rocket icon
- [ ] Toggle early access on/off
- [ ] Set max spots (number input, saves on blur)
- [ ] Set discount percentage (number input, saves on blur)
- [ ] "View Early Access Dashboard" link navigates to `/admin/early-access`

### 20.3 Early Access Dashboard

- [ ] Navigate to `/admin/early-access` — campaign stats and channel breakdown
- [ ] User list with pagination and export
- [ ] "Activate All" button — activates all early access users (30-day Agency trial)

### 20.4 Coming Soon Mode

- [ ] "Coming Soon Mode" section with toggle
- [ ] Toggle on — warning banner appears ("Coming Soon Mode is active")
- [ ] Edit headline and description
- [ ] Click "Save Content" — saves, preview updates
- [ ] Preview section shows how the coming soon page will look
- [ ] Navigate to `/` in another incognito window — coming soon page renders
- [ ] Admin routes still accessible when coming soon is on
- [ ] Auth routes (login, register, verify-email) still accessible
- [ ] Click "View Signups" — navigates to `/admin/coming-soon`

### 20.5 Coming Soon Signups

- [ ] Navigate to `/admin/coming-soon` — signups list
- [ ] Export signups as CSV
- [ ] Delete individual signups
- [ ] On the coming soon page: enter email → submit → success message
- [ ] Reload admin signups — new signup appears

### 20.6 SEO Manager

- [ ] Navigate to `/admin/seo` — list of per-route SEO overrides
- [ ] Create a new SEO entry: route path (e.g., `/pricing`), title, description
- [ ] Set OG image, Twitter card, canonical URL, noindex flag
- [ ] Add structured data JSON-LD
- [ ] Save — entry appears in list
- [ ] Navigate to the target route — verify custom SEO tags in page source
- [ ] Edit an existing override — changes persist
- [ ] Delete an override — default metadata returns

---

## Part 21: Admin Analytics

### 21.1 Funnel Analytics

- [ ] Navigate to `/admin/analytics/funnel` — funnel stages render with counts and conversion rates
- [ ] Stages: Registered → Verified → First Audit → Domain Verified → Paid
- [ ] Change range (7d, 30d, 90d) — data updates
- [ ] Each stage shows count and conversion % from previous stage

### 21.2 Trends

- [ ] Navigate to `/admin/analytics/trends` — global stats render
- [ ] Total audits completed, total pages scanned
- [ ] Top issues table — most common findings across all audits
- [ ] Score distribution shows avg, median, p10, p90
- [ ] Tier breakdown shows audits and avg score per tier

### 21.3 Revenue

- [ ] Navigate to `/admin/analytics/revenue` — MRR, ARR, by-tier breakdown
- [ ] Churn this month — count and MRR lost
- [ ] New this month — count and MRR gained

---

## Part 22: Responsive & Cross-Browser

### 22.1 Mobile (< 640px)

- [ ] All public pages: content stacks to single column, text remains readable
- [ ] Hamburger menu works: opens, shows all nav links, closes on link click or X
- [ ] Service detail pages: feature grids stack, methodology steps stack
- [ ] Dashboard: stat cards stack to 2-column grid
- [ ] Audit list: table columns collapse, essential info (status, domain, score) still visible
- [ ] Audit detail: score cards stack, tabs work, findings expandable
- [ ] Forms (login, register, contact, new audit): inputs are full-width, buttons are tap-friendly (44px+ tap targets)
- [ ] Admin pages: tables scroll horizontally or columns collapse
- [ ] Sidebar: hamburger button opens mobile drawer, closes on navigation or X
- [ ] Cookie banner: stacks nicely, buttons are tappable

### 22.2 Tablet (640px–1024px)

- [ ] Public pages: 2-column layouts where appropriate
- [ ] Dashboard and lists: comfortable spacing, all key data visible
- [ ] Admin: sidebar navigation works alongside content

### 22.3 Desktop (> 1024px)

- [ ] Full multi-column layouts render
- [ ] All table columns visible
- [ ] Sidebar navigation visible without hamburger, collapsible
- [ ] Collapsed sidebar: only icons visible, hover shows tooltip labels

---

## Part 23: Accessibility Checks

- [ ] Skip link: Tab on page load — "Skip to main content" link appears, activating it jumps to `#main-content`
- [ ] Keyboard navigation: Tab through all interactive elements on key pages (home, dashboard, audit detail, settings)
- [ ] Focus indicators: visible focus ring on all buttons, links, inputs, tabs
- [ ] Focus trap: open a modal (e.g., bug report, cookie preferences) — Tab cycles within the modal only
- [ ] Esc closes modals
- [ ] Forms: all inputs have associated `<label>` elements
- [ ] ARIA: sortable table headers have `aria-sort`, status badges have appropriate labels
- [ ] Colour contrast: text is readable on all backgrounds (use browser devtools audit)
- [ ] Screen reader: key pages make sense when read linearly (headings, landmarks, button labels)
- [ ] Mobile sidebar has `role="dialog"` and proper ARIA attributes

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

### 24.9 Email Preferences

- [ ] **Unsubscribe** — click unsubscribe link in any email, preferences page loads, unsubscribe works
- [ ] **Manage preferences** — click "manage preferences" link, can toggle individual categories
- [ ] **Cold unsubscribe** — click unsubscribe in cold email, HTML confirmation page renders

---

## Part 25: API (Public v1)

### 25.1 API Key Authentication

- [ ] Create an API key via `/settings/api-keys`
- [ ] Make request with `Authorization: Bearer pp_live_...` header — authenticated
- [ ] Make request with `X-API-Key: pp_live_...` header — authenticated
- [ ] Make request with invalid key — 401 error
- [ ] Make request with revoked key — 401 error

### 25.2 API Endpoints

- [ ] `POST /api/v1/audits` — creates and queues audit (requires `audits:write` scope)
- [ ] `GET /api/v1/audits` — lists audits (requires `audits:read` scope)
- [ ] `GET /api/v1/audits/:id` — get audit detail
- [ ] `GET /api/v1/audits/:id/findings` — get findings
- [ ] `DELETE /api/v1/audits/:id` — delete audit (requires `audits:write` scope)
- [ ] `GET /api/v1/info` — returns API metadata (no auth required)

### 25.3 Rate Limiting

- [ ] Exceed rate limit — 429 response with retry-after header
- [ ] Rate limit tier matches API key tier

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

- [ ] Blog RSS feed available at `/api/blog/feed.xml` — valid Atom format
- [ ] Blog sitemap at `/api/blog/sitemap.xml` — valid XML sitemap with all published posts
- [ ] Blog categories endpoint returns only categories with published posts
- [ ] View count increments on post detail page load
- [ ] Related posts show at bottom of post detail (if configured)

---

## Final Checklist

- [ ] All public pages render without console errors
- [ ] All protected pages redirect properly when not authenticated
- [ ] All admin pages require super admin access
- [ ] No JavaScript console errors on any page
- [ ] All forms validate input properly (client-side and server-side)
- [ ] All toast notifications appear and auto-dismiss
- [ ] Loading states show on all async operations
- [ ] Empty states render helpfully on all list pages
- [ ] Browser back/forward navigation works correctly
- [ ] Page titles update correctly for each route (check browser tab)
- [ ] All links open in correct context (internal vs external)
- [ ] Favicon and app icons display correctly
