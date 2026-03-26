<!-- Version: 1 | Department: innovator | Updated: 2026-03-24 -->

# Iteration 1 — Innovator Brief

**Project:** PagePulser (EXISTING — iteration, not fresh start)
**Current state:** Post full-audit, most code fixes applied. Weighted score 7.3 → 8.5/10.
**Phase:** Pre-launch, building toward founding member launch (200 spots)
**Core focus:** SEO, content, and accessibility auditing (not accessibility-only)

---

## Current State Summary

PagePulser is an SEO, content, and accessibility auditing SaaS — its core value proposition spans all three disciplines, not just accessibility. It has shipped 15 phases of development with a comprehensive audit engine (SEO, accessibility, security, performance, content/E-E-A-T, AEO, structured data), tiered billing, team collaboration, public API, blog CMS, CRM, cold prospect pipeline, referral program, and admin tooling. A full-team audit identified 79 issues; most code-addressable ones have been fixed. The platform is functionally complete but lacks the differentiating polish and features that would make the founding member launch compelling.

### What's Been Fixed Since Audit
- Change-password endpoint (CRITICAL → fixed)
- Password strength validation added
- Onboarding checklist component built
- Button/Input/Sidebar/PublicLayout design fixes applied
- Blog internal links implemented (63 links across 17 posts)
- Server test coverage: 2 → 9 test files
- Client tests: 0 → 6 component test files
- Redis caching utility built
- Event tracking + revenue snapshots migration created
- Webhook service built
- Social sharing added to referral dashboard
- timingSafeEqual SHA-256 fix applied
- Duplicate database pool consolidated

### What's Still Missing (Code-Addressable)
- UTM parameter capture at registration
- Homepage hero CTA not using Button component
- Tooltip keyboard activation (tabIndex for non-focusable children)
- Card border radius inconsistencies
- SiteCard hardcoded "Stable" trend
- ESLint `no-explicit-any` still on `warn`
- Dark mode (scaffolded, not implemented)
- AI features (zero implementation)
- EAA compliance reporting mode
- In-app notification bell
- Shareable public audit reports
- Annual billing toggle (frontend — Stripe config is human task)

---

## Iteration Recommendations

### Bug Fixes
*None remaining — all code bugs from the audit have been resolved.*

### Polish (High Impact, Low-Medium Effort)

1. **UTM parameter capture at registration** — Store utm_source, utm_medium, utm_campaign with user record. Required for measuring which blog posts and campaigns drive signups. Without this, growth decisions are blind.
   - **Impact:** HIGH | **Effort:** SMALL | **Departments:** Software

2. **Homepage hero → Button component** — Replace inline Tailwind on hero CTAs with the `Button` component. Ensures design system consistency and future-proofs style updates.
   - **Impact:** LOW | **Effort:** SMALL | **Departments:** Software

3. **Tooltip keyboard activation** — Add `tabIndex={0}` to Tooltip wrapper when children aren't natively focusable. WCAG compliance gap in our own accessibility tool.
   - **Impact:** MEDIUM | **Effort:** SMALL | **Departments:** Software, Design

4. **SiteCard hardcoded "Stable" trend** — Pass real trend data from API instead of hardcoded string. Currently every site shows "Stable" regardless of actual score trajectory.
   - **Impact:** MEDIUM | **Effort:** SMALL | **Departments:** Software

5. **ESLint `no-explicit-any` → error** — Clean up violations and promote to error. Prevents type safety regression.
   - **Impact:** MEDIUM | **Effort:** MEDIUM | **Departments:** Software, QA

### Enhancements (High Impact, Medium Effort)

6. **Shareable public audit reports** — Time-limited public URLs for sharing audit results. Agencies share with clients, developers share with stakeholders. Creates a viral loop — every shared report is a PagePulser ad.
   - **Impact:** HIGH | **Effort:** MEDIUM | **Departments:** Product, Software

7. **EAA Compliance Report mode** — Map existing WCAG findings to EN 301 549 clauses. Add "EAA Ready / At Risk / Non-Compliant" status badge. 80% presentation, 20% logic. The European Accessibility Act is already in force — this is time-sensitive positioning.
   - **Impact:** HIGH | **Effort:** MEDIUM | **Departments:** Product, Software, Design

8. **In-app notification bell** — Dashboard header notification for audit completions, schedule results, team activity. Backed by existing SSE infrastructure. Users who start audits and navigate away currently have no feedback loop.
   - **Impact:** HIGH | **Effort:** MEDIUM | **Departments:** Product, Software, Design

9. **Annual billing toggle** — Add frontend toggle on Pricing page showing annual prices (2 months free). Backend `TIER_PRICE_MAP` extension. Stripe price IDs need human setup, but the frontend/backend work can be pre-built.
   - **Impact:** HIGH | **Effort:** MEDIUM | **Departments:** Software, Design

### New Features (High Impact, Large Effort)

10. **AI fix suggestions MVP** — Generate fix code snippets using Claude Haiku across SEO (meta tags, structured data, heading hierarchy), content (readability, keyword density), and accessibility (alt text, ARIA). Show "Generate Fix" button on finding cards for paid tiers. This is the single biggest competitive differentiator available.
    - **Impact:** CRITICAL | **Effort:** LARGE | **Departments:** Product, Software, Design

11. **Accessibility statement generator** — Auto-generate a WCAG-conformant accessibility statement from audit results. Lists known issues, remediation timeline, contact info. No major competitor offers this. Natural conversion driver from free to paid.
    - **Impact:** HIGH | **Effort:** MEDIUM | **Departments:** Product, Software

12. **Public audit badge/widget** — Embeddable "Verified by PagePulser" badges linking to public score pages. Viral distribution channel. Gated to Starter+ tier.
    - **Impact:** HIGH | **Effort:** MEDIUM | **Departments:** Product, Software, Design, Growth

### Technical Debt

13. **Increase server test coverage** — Priority areas: Stripe webhook handler, email service, organization service, PDF report service. Currently 9 test files for 165 source files.
    - **Impact:** HIGH | **Effort:** LARGE | **Departments:** QA, Testing

14. **Add more frontend component tests** — 6 UI component tests exist. Critical flows (auth forms, audit creation, dashboard rendering) still untested.
    - **Impact:** MEDIUM | **Effort:** MEDIUM | **Departments:** QA, Testing

---

## What NOT to Change This Iteration
- Core audit engine — working well, don't touch
- Auth system — recently hardened, stable
- Billing/Stripe integration — working, risky to modify
- Cold prospect pipeline — human-managed per project policy
- Blog content — 20 posts with links, sufficient for launch
