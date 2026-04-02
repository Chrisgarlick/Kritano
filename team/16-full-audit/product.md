# Product Audit

**Overall Assessment:** STRONG
**Score:** 7.5/10

## What's Working Well

1. **Comprehensive audit engine with clear tier differentiation.** The core product -- website auditing across SEO, accessibility, security, performance, content, E-E-A-T, AEO, and structured data -- is well-structured. Each check category maps cleanly to a tier, creating genuine upgrade motivation without crippling the free experience.

2. **Deep feature comparison table on the Pricing page.** The `/pricing` page includes a full side-by-side comparison across all 5 tiers covering 7 dimensions (audit limits, checks, sites, scheduling, exports, API, teams). This is a best practice that many SaaS products skip, and it reduces pre-purchase friction.

3. **End-to-end user journeys for core workflows.** Register -> verify email -> add site -> verify domain -> run audit -> view results -> export PDF/CSV/JSON -> schedule recurring -> compare over time. Every step has both frontend pages and backend routes. The consent/liability flow for unverified domains is a thoughtful addition.

4. **Robust admin tooling built from day one.** The admin panel covers users, organizations, schedules, CRM leads, email campaigns, blog CMS, cold prospects, referrals, analytics (funnel/trends/revenue), SEO management, system settings, bug reports, and feature requests. This is unusually mature for a pre-launch product.

5. **Public API with proper documentation SPA.** Six dedicated documentation pages (overview, auth, rate limits, errors, endpoints, objects) built as React pages with shared layout components. The API key system uses `kt_live_` prefixes, scoped permissions, and tier-based rate limits -- all production-ready patterns.

## Issues Found

### Free tier feature description is inconsistent across surfaces
**Severity:** HIGH
**Location:** `/Users/chris/Herd/kritano/client/src/pages/public/Pricing.tsx` (line 39), `/Users/chris/Herd/kritano/client/src/pages/settings/Profile.tsx` (line 54), `/Users/chris/Herd/kritano/docs/TIERS.md` (line 17-19)
**Finding:** The Free tier describes available checks differently in three places:
- **Pricing page**: "SEO & Content checks" (correct per DB migration 035)
- **Profile page**: "SEO & Accessibility checks" (incorrect -- Accessibility is Starter+)
- **TIERS.md**: Lists SEO, Security, and Content as Free-tier checks (Security is included in DB but not mentioned on Pricing page)
- **Database** (migration 035): `ARRAY['seo', 'security', 'content']` for Free tier
**Impact:** Users on the Free tier may expect Accessibility checks (per Profile page) and be disappointed. The Pricing page omits Security, underselling the Free tier. This creates support burden and erodes trust.
**Recommendation:** Align all three surfaces to match the database truth: Free tier gets SEO, Security, and Content checks. Update Pricing page highlights, Profile page features list, and FAQ copy.

### No user-facing onboarding flow
**Severity:** HIGH
**Location:** `/Users/chris/Herd/kritano/client/src/pages/dashboard/Dashboard.tsx`
**Finding:** After registration and email verification, users land on a dashboard that shows recent audits and stats. There is no guided onboarding: no "add your first site" prompt, no walkthrough of features, no progressive disclosure of the audit workflow. The `NoAuditsEmptyState` component exists but is a minimal empty state, not an onboarding experience.
**Impact:** First-time users, especially on the Free tier, face a blank dashboard with no direction. This directly harms activation rate and time-to-value -- the most critical SaaS metrics. Users who do not complete their first audit within the first session rarely return.
**Recommendation:** Build a 3-step onboarding checklist (add site, verify domain, run first audit) that persists on the dashboard until completed. Consider adding a "quick audit" CTA that bypasses site creation for the very first scan.

### Schedules route directory is empty on the server
**Severity:** MEDIUM
**Location:** `/Users/chris/Herd/kritano/server/src/routes/schedules/` (empty directory)
**Finding:** The `schedules` directory under routes exists but contains no files. Schedule endpoints are actually served under `/api/audits/schedules` via the audits router. The empty directory is dead code and could cause confusion for developers.
**Impact:** Minor maintenance confusion. No user impact since the functionality works through the audits route.
**Recommendation:** Delete the empty `/server/src/routes/schedules/` directory.

### INNOVATION.md roadmap is stale and misaligned with actual implementation
**Severity:** MEDIUM
**Location:** `/Users/chris/Herd/kritano/docs/INNOVATION.md`
**Finding:** The document is dated 2026-01-29 and labeled "Phase 4: Innovation Roadmap" with "Status: Planning." However, the actual codebase is on phase-15 and has already implemented many items it describes (Public API, API keys, organizations, RBAC). Meanwhile, features it outlines as upcoming (AI fix suggestions, webhooks, Jira/Slack/Linear integrations, CLI tool, GitHub Action, anomaly detection) have not been built. The migration numbers it references (010-014) do not match the actual migration numbering.
**Impact:** Any team member referencing this document for roadmap decisions will be working from outdated context. It conflates "done" and "planned" without distinction.
**Recommendation:** Either archive this document with a DONE_ prefix and create a fresh roadmap, or update it with clear "Implemented" / "Planned" / "Deferred" status labels for each section.

### No in-app notification system for completed audits
**Severity:** MEDIUM
**Location:** `/Users/chris/Herd/kritano/client/src/pages/settings/NotificationSettings.tsx`
**Finding:** Notification settings only cover email preferences (audit notifications, product updates, educational, marketing). There is no in-app notification bell, no toast for audit completion when navigating away, and no real-time push. The audit progress uses SSE, but only on the audit detail page -- if a user navigates away, they have no visibility into audit completion.
**Impact:** Users who start audits and navigate away (common for longer scans of 1,000+ pages) must manually check back or wait for an email. This creates a disjointed experience, especially for Agency/Enterprise users running many concurrent audits.
**Recommendation:** Add a notification bell in the dashboard header that shows audit completions, schedule run results, and team activity. This can be backed by the existing SSE infrastructure.

### Pricing inconsistency: Enterprise tier has no "Contact Sales" flow
**Severity:** LOW
**Location:** `/Users/chris/Herd/kritano/client/src/pages/public/Pricing.tsx` (line 99-100)
**Finding:** The Enterprise tier is priced at a flat "$199/month" with a "Start Free Trial" CTA linking to `/register`. Enterprise features list includes "Custom integrations," "SLA guarantees," and "On-premise option" -- these are not self-service features. Having a fixed price with self-serve signup undercuts the Enterprise positioning and leaves money on the table.
**Impact:** Enterprise buyers expect a sales conversation. Showing a fixed price ($199) for "unlimited everything + SLA + on-premise" signals this is not a serious enterprise offering.
**Recommendation:** Replace the Enterprise CTA with "Contact Sales" linking to `/contact`. Remove the fixed price and replace with "Custom" or "Starting at $199/mo." This also opens the door for annual contracts and volume discounts.

### Free tier FAQ inconsistency
**Severity:** LOW
**Location:** `/Users/chris/Herd/kritano/client/src/pages/public/Pricing.tsx` (line 182)
**Finding:** The FAQ answer for "How does the free plan work?" states "You get SEO and content checks" but omits Security, which is actually included for Free tier users per the database.
**Impact:** Undersells the free tier; minor trust issue if users discover Security checks are available but weren't advertised.
**Recommendation:** Update to "You get SEO, security, and content checks" to match the actual tier configuration.

## Opportunities

1. **Webhooks for audit events.** The INNOVATION.md doc outlines webhooks (audit.completed, audit.failed, anomaly.detected) but they have not been built. This is the single highest-leverage feature for API-first users and CI/CD integration. It would differentiate Kritano from tools that require polling.

2. **AI-powered fix suggestions.** The roadmap describes generating code fixes per finding using Claude. This is a strong differentiator and natural upsell for paid tiers. Even a basic version (pre-written fix templates for common issues) would add significant value before a full LLM integration.

3. **Shareable audit reports via public link.** Currently audits are only visible to authenticated users. Adding a "Share report" feature that generates a time-limited public URL would unlock a viral loop -- agency users sharing reports with clients, developers sharing with stakeholders. This is a common pattern in tools like Lighthouse and GTmetrix.

4. **Dashboard widgets for scheduled audit health.** The dashboard shows recent audits but does not surface schedule status (e.g., "3 schedules active, 1 failing"). Adding a schedule health widget would make the dashboard actionable for returning users.

5. **Annual billing option.** The pricing page only shows monthly prices. Adding annual billing with a discount (common: 2 months free) would improve LTV and reduce churn. The Stripe integration is already in place, making this a backend-only change.

## Summary

Kritano has a mature, well-architected feature set that covers the full lifecycle of website auditing -- from one-off scans through scheduled monitoring, team collaboration, API access, and white-label exports. The tier structure is thoughtfully designed with genuine progression from Free through Enterprise. The admin panel and CRM tooling are unusually complete for a pre-launch product. The main product gaps are in activation (no onboarding flow), real-time feedback (no in-app notifications), and messaging consistency (Free tier features described differently across three surfaces). The Enterprise tier positioning needs a sales-led approach rather than self-serve pricing. The INNOVATION.md roadmap should be refreshed to reflect what has shipped versus what is planned. These are all fixable issues that do not undermine the core product quality.
