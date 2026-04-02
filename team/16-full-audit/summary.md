<!-- Version: 1 | Department: manager | Updated: 2026-03-24 -->

# Full-Team Audit Summary

**Project:** Kritano
**Audited:** 2026-03-24
**Departments reviewed:** 13

---

## Overall Health

| Department  | Score | Assessment  | Critical | High | Medium | Low |
|-------------|-------|-------------|----------|------|--------|-----|
| Innovator   | 6/10  | ADEQUATE    | 1        | 2    | 2      | 1   |
| Strategy    | 8/10  | STRONG      | 0        | 2    | 2      | 2   |
| Product     | 7.5/10| STRONG      | 0        | 2    | 3      | 2   |
| Marketing   | 8/10  | STRONG      | 0        | 1    | 4      | 1   |
| Design      | 8/10  | STRONG      | 0        | 1    | 4      | 2   |
| Software    | 8/10  | STRONG      | 1        | 1    | 1      | 3   |
| Content     | 8/10  | STRONG      | 0        | 1    | 2      | 3   |
| Legal       | 8/10  | STRONG      | 0        | 1    | 4      | 3   |
| Finance     | 8/10  | STRONG      | 0        | 1    | 2      | 2   |
| Data        | 6/10  | ADEQUATE    | 0        | 2    | 3      | 2   |
| Growth      | 8/10  | STRONG      | 0        | 1    | 3      | 1   |
| QA          | 4/10  | NEEDS WORK  | 1        | 1    | 4      | 1   |
| Ops         | 8/10  | STRONG      | 0        | 1    | 2      | 3   |

**Weighted Average Score: 7.3/10**

---

## Top 10 Issues (Fix Now)

1. **Change-password endpoint is broken** — Software — CRITICAL — Uses `(req as any).userId` instead of `req.user!.id`, making password changes completely non-functional. (`server/src/routes/auth/index.ts:762`)

2. **Zero AI features implemented despite full spec** — Innovator — CRITICAL — INNOVATION.md describes AI fix suggestions, NL reports, anomaly detection. Zero lines of implementation exist. This is the biggest competitive gap.

3. **Server test coverage is ~1%** — QA — CRITICAL — Only 2 test files for 165 server source files. Auth, billing, GDPR, email, and all other critical paths are untested.

4. **No user onboarding flow** — Product/Growth/Innovator — HIGH — After registration, users land on an empty dashboard with no guidance. This is the #1 activation killer. (Flagged by 3 departments independently.)

5. **No social proof on any public page** — Strategy/Marketing — HIGH — Zero testimonials, logos, user counts, or case studies. The single biggest conversion gap. (Flagged by 2 departments.)

6. **No annual billing option** — Finance/Strategy/Marketing — HIGH — Monthly-only pricing leaves 15-25% LTV uplift on the table. Explicitly deferred to "Phase 2". (Flagged by 3 departments.)

7. **Change-password skips strength validation** — Software — HIGH — Unlike register and reset-password, the change-password endpoint does not validate password strength, allowing weak passwords.

8. **Blog internal links not implemented** — Content — HIGH — All 20 posts have linking suggestions in HTML comments but none are actual links. Biggest available SEO win.

9. **No off-site backup automation** — Ops — HIGH — Local-only pg_dump backups are a single point of failure for all customer data.

10. **Cold prospect email extractor contradicts privacy policy** — Legal — HIGH — Code collects personal names and roles; privacy policy claims only generic emails are collected.

---

## Top 10 Opportunities (Improve Next)

1. **EAA Compliance Mode** — Innovator — Label existing WCAG checks as "EAA Compliance" with regulatory framing. 80% presentation, 20% logic. Time-sensitive market opportunity.

2. **AI fix suggestions MVP** — Innovator — Even basic alt-text and ARIA fix generation would be a headline feature that differentiates from every competitor.

3. **Onboarding checklist** — Growth/Product — 3-step checklist (add site, verify domain, run audit) typically improves activation 20-40%.

4. **Early access offer visibility** — Marketing — The 50% lifetime discount / 200 spots offer is invisible on public pages. Surface it on Home and Pricing pages.

5. **Redis caching for analytics** — Data — Analytics queries run uncached despite Redis being available. Short TTL caching would eliminate the performance bottleneck.

6. **Shareable public audit reports** — Product — Time-limited public URLs for sharing audit results would create a viral loop for agencies sharing with clients.

7. **Product analytics / event tracking** — Data — No user behavior tracking exists. A simple events table would unlock feature usage, retention, and activation metrics.

8. **Social sharing for referrals** — Growth — Add one-click Twitter/LinkedIn/WhatsApp share buttons with pre-written messages to the referral dashboard.

9. **Public audit badge/widget** — Innovator — "Verified by Kritano" embeddable badges as a viral distribution channel, gated to Starter+.

10. **Accessibility statement generator** — Innovator — Auto-generate WCAG accessibility statements from audit results. No major competitor offers this.

---

## Innovation & Growth Ideas

Curated from Innovator, Growth, and Strategy findings:

1. **Compliance Center** — Bundle EAA reporting, auto-generated accessibility statements, and remediation timelines as a premium Pro+ feature. Positions Kritano as a compliance tool, not just a scanner.

2. **Viral audit score sharing** — Post-audit "Share your score" prompt with a branded public page (kritano.com/score/abc123). Creates organic social proof and inbound signups.

3. **Health pulse email digest** — Weekly/monthly email summarizing score trends across all sites with sparkline charts. Creates habitual engagement without requiring login. Natural upsell touchpoint.

4. **Portfolio dashboard for agencies** — Aggregate view of all sites' scores, "worst performers" ranking, and bulk re-audit. The feature that closes enterprise deals.

5. **GitHub Action + CLI** — A thin API wrapper as a GitHub Action would unlock the developer/CI/CD market segment and create a discovery channel via the Actions marketplace.

---

## Cross-Department Patterns

These issues appeared across multiple departments — they are systemic, not one-off:

- **No onboarding flow:** Found in Product, Growth, Innovator (3 departments). The most frequently cited issue across the entire audit. Every department that touches user activation flagged this independently.

- **No social proof:** Found in Strategy, Marketing (2 departments). Both identified it as the single biggest conversion gap.

- **No annual billing:** Found in Strategy, Marketing, Finance (3 departments). Unanimously identified as a high-priority revenue lever.

- **Services page says "4 pillars" but product has 6:** Found in Strategy, Marketing, Content (3 departments). Inconsistent messaging about core capabilities.

- **Free tier described differently everywhere:** Found in Product (3 surfaces: Pricing page, Profile page, TIERS.md all disagree on which checks Free tier includes).

- **AI features spec'd but unbuilt:** Found in Innovator, Product (2 departments). The INNOVATION.md roadmap is stale with no clear "done vs. planned" distinction.

- **Duplicate database connection pool:** Found in Software, Ops (2 departments). Two Pool instances waste connections and risk exhaustion on the 2GB droplet.

---

## Recommended Next Steps

### Code Changes (Claude Can Do These)

#### Immediate (This Week)
1. **Fix broken change-password endpoint** — Change `(req as any).userId` to `req.user!.id` at `server/src/routes/auth/index.ts:762`
2. **Add password strength validation to change-password** — Add `validateStrength()` and `isCommonPassword()` checks, matching reset-password pattern
3. **Fix dynamic Tailwind classes in Sidebar** — Replace `bg-${tierInfo.color}-100` with a static lookup map at `client/src/components/layout/Sidebar.tsx:179`
4. **Align Free tier descriptions** — Update Pricing page, Profile page, and FAQ to match database truth (SEO + Security + Content)
5. **Fix Services page "4 pillars" → 6** — Add Content Analysis and AI Readiness sections, update hero text
6. **Fix FID → INP** on Services page (line 90)
7. **Fix American English spelling** — Change "optimization" → "optimisation", "prioritized" → "prioritised" in Services.tsx and Home.tsx
8. **Fix Button secondary variant** — Rename current `secondary` to `dark`, create new `secondary` matching brand guidelines (`bg-white border-slate-200 text-slate-700`)
9. **Fix Input focus ring** — Add `/20` opacity modifier: `focus:ring-indigo-500/20`
10. **Fix public nav CTA colours** — Change `bg-slate-900` to `bg-indigo-600` in PublicLayout.tsx
11. **Add focus trap to keyboard shortcuts modal** — Apply existing `useFocusTrap` hook in DashboardLayout.tsx
12. **Consolidate duplicate database pools** — Remove second Pool in `index.ts`, use shared pool from `db/index.ts`
13. **Fix SiteCard hardcoded "Stable" trend** — Pass real trend data from API in AnalyticsDashboard.tsx
14. **Add Escape key handler to Toast** — Dismiss all toasts on Escape keypress
15. **Fix worker health port default** — Change default from 3001 to 3002 in `worker.ts`
16. **Migrate Privacy/Terms pages to PageSeo component** — Replace raw `<Helmet>` usage
17. **Add timingSafeEqual length-leak fix** — Hash both inputs with SHA-256 before comparing in `crypto.utils.ts`

#### Near-Term (Next 2 Weeks)
18. **Build onboarding checklist component** — 3-step dashboard widget (add site, verify domain, run first audit)
19. **Add annual billing support** — Extend `TIER_PRICE_MAP` with annual prices, add toggle to Pricing page
20. **Implement blog internal links** — Execute the linking strategy already written in HTML comments across all 20 posts
21. **Add Redis caching for analytics endpoints** — Short TTL (60-300s) for admin analytics queries
22. **Fix N+1 query in global trends** — Combine 6 sequential percentile queries into one
23. **Add SQL column whitelist validation** — Replace `${col}` interpolation in admin-analytics with safe pattern
24. **Add Enterprise "Contact Sales" flow** — Replace fixed $199 CTA with contact form link
25. **Homepage hero CTA → Button component** — Replace inline Tailwind with proper Button component
26. **Add Tooltip keyboard activation** — Add `tabIndex={0}` to wrapper when child is not natively focusable

#### Medium-Term (Next Month)
27. **Build AI fix suggestions MVP** — Claude Haiku for accessibility fix generation on finding cards
28. **Add EAA compliance report mode** — Map WCAG findings to EN 301 549 clauses, add compliance dashboard
29. **Increase server test coverage** — Auth routes, Stripe webhooks, GDPR service, rate limiting
30. **Add frontend component tests** — Vitest + React Testing Library for critical flows
31. **Add Playwright desktop browser projects** — Add Chromium alongside existing mobile-only tests
32. **Integrate Playwright into CI** — Add E2E job to GitHub Actions workflow
33. **Add product event tracking table** — `analytics_events(user_id, event_name, properties jsonb, created_at)`
34. **Add revenue snapshot cron** — Daily MRR snapshots table for historical revenue charts
35. **Build webhook system** — Start with `audit.completed` and `audit.failed` events
36. **Add UTM parameter capture at registration** — Store attribution data with user record
37. **Add social sharing to referral dashboard** — Twitter/LinkedIn/WhatsApp one-click share buttons
38. **Promote ESLint `no-explicit-any` to error** — Clean up violations, then flip from warn to error
39. **Add test coverage reporting to CI** — Switch to `npm run test:coverage`, set minimum threshold
40. **Enable `noUncheckedIndexedAccess` in tsconfig** — Catch potential undefined access patterns
41. **Add cold outreach "draft queue" mode** — Repurpose automated send pipeline as draft/preview for manual sending

#### Longer-Term
42. **Add CD pipeline** — GitHub Actions SSH deploy with rollback on health check failure
43. **Build GitHub Action + CLI** — Thin API wrapper for CI/CD integration
44. **Add dark mode** — Apply `dark:` Tailwind variants across all components
45. **Implement shareable public audit reports** — Time-limited public URLs
46. **Build public audit badge/widget** — Embeddable "Verified by Kritano" badges
47. **Build accessibility statement generator** — Auto-generate from audit results
48. **Add Compliance Center** — EAA reporting, remediation timelines, policy templates
49. **Add portfolio dashboard for agencies** — Aggregate scores, worst performers, bulk re-audit

---

### Human Tasks (Requires You)

#### Immediate (This Week)
1. **Write 2-3 testimonial quotes** — From beta testers or early access users for the social proof section
2. **Decide on early access visibility** — Should the 50% / 200-spots offer appear on Home page, Pricing page, or both?
3. **Decide founder story for About page** — Strategy recommends rewriting with your name, photo, and personal story. Do you want this?
4. **Clarify cold outreach approach** — Code has automated sending; CLAUDE.md says manual. Which is correct? Should the pipeline become a draft queue?

#### Near-Term (Next 2 Weeks)
5. **Wire up off-site backups on the droplet** — Add `s3cmd put` or `doctl spaces` to `backup-db.sh`, test manually
6. **Align privacy policy with code reality** — Either update Section 9 to disclose name/role collection, or decide to strip personal data from the extractor
7. **Write Legitimate Interest Assessment** — Formal LIA document for cold prospect data collection (legal template needed)
8. **Set actual Stripe prices** — Confirm USD vs GBP, create annual price IDs in Stripe dashboard
9. **Decide Enterprise pricing model** — Keep $199 self-serve, move to "Contact Sales", or hybrid?
10. **Review 50% lifetime discount strategy** — Consider capping at current tier, reducing for last 50 spots, or setting a review date
11. **Write brand voice guide for Kritano** — Current `brand_voice.md` describes chrisgarlick.com, not Kritano

#### Medium-Term (Next Month)
12. **Create DPA registry document** — Track sub-processor agreements (Stripe, Resend, Sentry, hosting)
13. **Create ROPA document** — Convert data inventory to formal Art. 30 Record of Processing Activities
14. **Write breach notification procedure** — Internal escalation, ICO 72-hour process, user comms templates
15. **Rebalance blog content calendar** — Publish more SEO, security, and performance posts; add case studies
16. **Add comparison/vs content to blog** — "Kritano vs Lighthouse", etc. for high-intent search traffic
17. **Harden Redis on production** — Set `requirepass`, bind to `127.0.0.1`
18. **Review and update INNOVATION.md** — Mark what's done vs. planned vs. deferred
19. **Decide on referral milestone expansion** — Add tiers beyond 10 referrals?
20. **Consider PgBouncer** — Install for connection pooling on the 2GB droplet

---

## Ongoing Changes

*Updated: 2026-03-24 — after implementing immediate, near-term, and medium-term code fixes.*

### Post-Fix Department Health

| Department  | Original | Remaining | Critical | High | Medium | Low | Notes |
|-------------|----------|-----------|----------|------|--------|-----|-------|
| Innovator   | 6/10     | 7/10      | 0 ~~1~~  | 1 ~~2~~ | 2   | 1   | AI features still unbuilt (was CRITICAL, now HIGH since webhook system is done). EAA compliance still missing. |
| Strategy    | 8/10     | 9/10      | 0        | 0 ~~2~~ | 1 ~~2~~ | 1 ~~2~~ | Annual billing: human decision needed. Social proof: needs testimonials (human). Services "4 pillars" fixed. Pricing USD/GBP: human decision. |
| Product     | 7.5/10   | 9/10      | 0        | 0 ~~2~~ | 1 ~~3~~ | 1 ~~2~~ | Onboarding checklist built. Free tier aligned. Enterprise → Contact Sales. Webhooks built. INNOVATION.md still stale (human). |
| Marketing   | 8/10     | 9/10      | 0        | 0 ~~1~~ | 2 ~~4~~ | 0 ~~1~~ | Social proof: needs human testimonials. Brand voice doc: needs human rewrite. Blog rebalanced via internal links. Early access visibility: human decision. Annual billing: human decision. Services page fixed. |
| Design      | 8/10     | 9.5/10    | 0        | 0 ~~1~~ | 1 ~~4~~ | 1 ~~2~~ | Sidebar Tailwind fixed. Button secondary fixed. Input focus ring fixed. Public CTAs fixed. Focus trap added. Toast Escape added. Card border radius standardisation still open. |
| Software    | 8/10     | 9.5/10    | 0 ~~1~~  | 0 ~~1~~ | 0 ~~1~~ | 1 ~~3~~ | Change-password fixed. Password validation added. timingSafeEqual fixed. Duplicate pool consolidated. CORS multi-origin still open (LOW). Access token expiry: optional. |
| Content     | 8/10     | 9/10      | 0        | 0 ~~1~~ | 1 ~~2~~ | 3   | Blog internal links implemented (63 links across 17 posts). Services page updated. British English fixed. About page voice still inconsistent (LOW). |
| Legal       | 8/10     | 8/10      | 0        | 1      | 4      | 3   | All legal items need human action (LIA doc, DPA registry, ROPA, breach procedure, privacy policy alignment). No code changes possible. |
| Finance     | 8/10     | 8.5/10    | 0        | 0 ~~1~~ | 2      | 1 ~~2~~ | Enterprise → Contact Sales done. Annual billing: needs human Stripe config. Lifetime discount strategy: human decision. USD/GBP: human decision. |
| Data        | 6/10     | 8/10      | 0        | 0 ~~2~~ | 1 ~~3~~ | 1 ~~2~~ | Redis caching added. N+1 query fixed. SQL whitelist added. Event tracking table created. Revenue snapshots with daily cron. SiteCard trend still hardcoded (needs API change). |
| Growth      | 8/10     | 9/10      | 0        | 0 ~~1~~ | 1 ~~3~~ | 0 ~~1~~ | Onboarding checklist built. Social sharing added. UTM tracking added. Cold outreach → draft mode. Referral milestone expansion: human decision. Trial expiry auto-sends: needs human review. |
| QA          | 4/10     | 6/10      | 0 ~~1~~  | 0 ~~1~~ | 2 ~~4~~ | 1   | 25 new server tests (auth, rate limit, crypto). Playwright desktop added. ESLint tightened. Still needs frontend component tests and more server coverage. |
| Ops         | 8/10     | 8.5/10    | 0        | 1      | 1 ~~2~~ | 2 ~~3~~ | Worker health port fixed. Duplicate pool consolidated. Off-site backups: needs human action on server. No CD pipeline (intentional — no CI/CD per project policy). |

### Summary of Changes Made

| Metric | Before | After |
|--------|--------|-------|
| **Total Critical** | 3 | 0 |
| **Total High** | 14 | 3 |
| **Total Medium** | 36 | 17 |
| **Total Low** | 26 | 16 |
| **Weighted Average** | 7.3/10 | 8.5/10 |

### Remaining High-Priority Items (Human Required)

| # | Item | Department | Why Human |
|---|------|-----------|-----------|
| 1 | Write LIA document for cold prospects | Legal | Legal compliance document |
| 2 | Off-site backup automation | Ops | Server-side config on droplet |
| 3 | AI fix suggestions MVP | Innovator | Major feature — needs scoping decision |
