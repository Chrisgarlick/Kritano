# Kritano — Phased Deployment Plan

> **Purpose**: Break the entire Kritano codebase into standalone branches that can be pushed to GitHub incrementally. Each phase builds on the previous one, progressing from bare-bones MVP to the full production platform.

---

## Branch Naming Convention

```
phase-1    Foundation & Infrastructure
phase-2    Authentication & User Management
phase-3    Core Audit Engine
phase-4    Sites & Domain Verification
phase-5    Audit Results, Exports & Content Engine
phase-6    Billing, Subscriptions & Tier Enforcement
phase-7    Scheduling & Analytics
phase-8    Teams & Site Sharing
phase-9    Admin Panel
phase-10   Email System & CRM
phase-11   CMS, Blog & Marketing Content
phase-12   Public API, Referrals & Final Polish
phase-13   Public API Docs SPA & API Key Rebrand
```

---

## Phase 1 — Foundation & Infrastructure

**Branch**: `phase-1`

The skeleton. No features — just the project scaffolding, tooling, and local dev environment.

### Included
- Root: `package.json`, `docker-compose.yml`, `.gitignore`, `.env.example`, `CLAUDE.md`
- Server: Express app bootstrap, DB connection pool, Redis setup, migration runner, initial `users` migration, base middleware (Helmet, CORS, CSRF, rate limiting), health check endpoint
- Client: Vite + React + TypeScript scaffold, Tailwind CSS with brand tokens, base UI component library (Button, Input, Alert, Skeleton, Toast, Typography, etc.), app shell with React Router (placeholder routes), ThemeContext (dark/light mode), brand font loading
- Docs: BRAND_GUIDELINES.md, TIERS.md, phases.md

---

## Phase 2 — Authentication & User Management

**Branch**: `phase-2`

Users can register, log in, verify email, and manage their account.

### Included
- Migrations: `users` (full), `refresh_tokens`, `email_tokens`, `auth_audit_logs`, `rate_limits`
- Server: Auth routes (register, login, verify-email, refresh, logout, forgot-password, reset-password), JWT middleware, auth services
- Client: Login, Register, Verify Email pages, AuthContext, Dashboard layout shell, Settings/Profile page

---

## Phase 3 — Core Audit Engine

**Branch**: `phase-3`

The crawler and audit engines that scan pages.

### Included
- Migrations: `audit_jobs`, `audit_pages`, `audit_findings`, `crawl_queue`, `crawl_errors`
- Server: Spider/crawler (Playwright), SEO/Accessibility/Security/Performance engines, BullMQ job queue, audit worker, audit service, SSE progress endpoint
- Client: New Audit, Audit List, Audit Detail, Page Detail pages

---

## Phase 4 — Sites & Domain Verification

**Branch**: `phase-4`

Site management, domain verification, and consent flows.

### Included
- Migrations: `sites`, `site_urls`, `domain_verification_records`, `verified_domains`, `consent_logs`, `cookie_consent_logs`
- Server: Site CRUD routes, domain verification (DNS/HTTP), consent service, liability protection
- Client: Site List, Site Detail, verification flow, consent modal, cookie banner

---

## Phase 5 — Audit Results, Exports & Content Engine

**Branch**: `phase-5`

Rich results with PDF/CSV/JSON export and content analysis.

### Included
- Server: Content engine (readability, keywords, E-E-A-T, AEO), structured data engine, PDF/CSV/JSON export, file extraction, Google index exposure
- Client: Content Analysis Panel, Keyword Panel, Schema tab, Files tab, export buttons

---

## Phase 6 — Billing, Subscriptions & Tier Enforcement

**Branch**: `phase-6`

Stripe integration and tier-based feature gating.

### Included
- Migrations: `subscriptions`, `tier_limits` seed, `early_access_signups`, `coming_soon_signups`
- Server: Stripe service, webhook handler, trial service, tier enforcement middleware, early access/coming soon routes
- Client: Pricing page, subscription management, upgrade prompts, Coming Soon guard

---

## Phase 7 — Scheduling & Analytics

**Branch**: `phase-7`

Recurring audits and trend analytics.

### Included
- Migrations: `audit_schedules`, `activity_log`
- Server: Schedule CRUD, schedule poller worker, analytics routes/service
- Client: Schedule pages, Analytics Dashboard, Site/URL Analytics, Audit/Site Comparison

---

## Phase 8 — Teams & Site Sharing

**Branch**: `phase-8`

Multi-user collaboration with roles.

### Included
- Migrations: `site_members`, `site_invitations`, `site_sharing`, `organizations`
- Server: Team member CRUD, invitation flow, permission middleware, role-based access
- Client: Team members UI, invite modal, permission-aware components

---

## Phase 9 — Admin Panel

**Branch**: `phase-9`

Super-admin dashboard for platform management.

### Included
- Migrations: `admin_activity_log`, `system_settings`, `audit_advice_templates`, `announcements`
- Server: Admin routes (users, orgs, activity, analytics, settings, announcements, advice templates, SEO manager)
- Client: Full admin layout and pages

---

## Phase 10 — Email System & CRM

**Branch**: `phase-10`

Email campaigns, CRM triggers, and lead scoring.

### Included
- Migrations: `email_templates`, `email_campaigns`, `email_events`, `email_preferences`, `crm_triggers`, `lead_scores`
- Server: Email service (Resend/Mailpit), template engine, campaign service, CRM triggers, lead scoring, campaign worker
- Client: Admin email/CRM sections, user notification preferences

---

## Phase 11 — CMS, Blog & Marketing Content

**Branch**: `phase-11`

Blog, CMS, success stories, marketing assets, and cold prospect pipeline.

### Included
- Migrations: `blog_posts`, `blog_media`, `blog_post_revisions`, `blog_related_posts`, `marketing_content`, `success_stories`, `cold_prospects`, `cold_prospect_outreach`
- Server: Blog service, CMS routes, cold prospect pipeline (domain checker, email extractor, outreach), discovery worker
- Client: Public blog, admin CMS, cold prospects dashboard

---

## Phase 12 — Public API, Referrals & Final Polish

**Branch**: `phase-12`

Developer API, referral program, and production readiness.

### Included
- Migrations: `api_keys`, `api_audit_jobs`, `referrals`
- Server: Public API v1 (key auth, rate limiting), API key management, referral service, bug/feature report services, schema generator
- Client: API Keys settings, Referral Dashboard, Bug Report/Feature Request modals, final polish

---

## Phase 13 — Public API Docs SPA & API Key Rebrand

**Branch**: `phase-13`

Replaces the inline HTML API documentation with proper React SPA pages and rebrands API key prefixes from `aa_` to `pp_` (Kritano).

### Included

#### Public API Documentation Pages (6 pages)
- **Shared components**: `DocsLayout` (sidebar nav + mobile collapse), `CodeBlock` (dark code block with copy button), `EndpointCard` (expandable method badge + path + examples), `ParamTable` (parameter reference table)
- **`/docs`** — Overview page with hero, step-by-step getting started guide, base URL, scopes table, endpoints-at-a-glance
- **`/docs/authentication`** — API key format, both auth header methods, scopes-to-endpoint mapping, all auth error responses (401/403 with exact JSON), key management guide
- **`/docs/rate-limits`** — Tier limits table, rate limit headers explained, 429 handling with JavaScript retry example, concurrent audit limits with `AUDIT_LIMIT_REACHED` error
- **`/docs/errors`** — All HTTP status codes, error response format (standard, validation with `details` array, scope with `requiredScopes`/`yourScopes`), full error code reference table, troubleshooting FAQ
- **`/docs/endpoints`** — All 7 v1 endpoints with full request/response examples, parameter tables, status lifecycle diagram, polling guidance, per-endpoint error responses
- **`/docs/objects`** — Audit object (all fields including `config`, `_links`, `progress.currentUrl`), Finding object (all 6 categories, 5 severity levels, 3 statuses), Pagination object, status lifecycle with per-state descriptions

#### Routing & Navigation
- 6 public routes added to `App.tsx` (no auth required)
- 6 entries added to `routeRegistry.ts` (category: `public`) for admin SEO manager visibility
- "API Docs" link added to `PublicLayout` nav bar and footer resources section
- All pages use `PageSeo` with `useOverrides={true}` for admin SEO control

#### Server Changes
- `GET /api/docs` replaced with 301 redirect to `/docs` (removed 2000+ line inline HTML)
- `GET /api/v1/info` documentation URL changed from `docs.kritano.io/api` to `/docs`

#### API Key Prefix Rebrand (`aa_` → `pp_`)
- `apiKey.service.ts` — Key generation now produces `kt_live_` prefix
- `apiAuth.middleware.ts` — Auth header detection updated to check for `kt_live_`
- Migration `015_create_api_keys.sql` — Comment updated
- All documentation files updated (`API_DOCS.md`, `INNOVATION.md`, `test.md`)
- All 6 frontend docs pages use `kt_live_` in examples

#### Content Corrections (from original inline docs)
- Added missing `content` and `file-extraction` check types to Create Audit
- Added missing `respectRobotsTxt` and `includeSubdomains` options
- Added missing audit statuses: `discovering`, `ready`
- Added missing finding severity: `info`
- Added missing finding categories: `content`, `structured-data`
- Added missing finding status: `acknowledged`
- Removed non-existent `_links.pages` reference
- Noted `findings:write` and `exports:read` scopes as reserved/future

### Files Created
```
client/src/components/docs/DocsLayout.tsx
client/src/components/docs/CodeBlock.tsx
client/src/components/docs/EndpointCard.tsx
client/src/components/docs/ParamTable.tsx
client/src/pages/docs/DocsOverviewPage.tsx
client/src/pages/docs/DocsAuthPage.tsx
client/src/pages/docs/DocsRateLimitsPage.tsx
client/src/pages/docs/DocsErrorsPage.tsx
client/src/pages/docs/DocsEndpointsPage.tsx
client/src/pages/docs/DocsObjectsPage.tsx
```

### Files Modified
```
client/src/App.tsx
client/src/config/routeRegistry.ts
client/src/components/layout/PublicLayout.tsx
server/src/routes/docs/index.ts
server/src/routes/v1/index.ts
server/src/services/apiKey.service.ts
server/src/middleware/apiAuth.middleware.ts
server/src/db/migrations/015_create_api_keys.sql
docs/API_DOCS.md
docs/INNOVATION.md
docs/test.md
```

---

## Summary

| Phase | Key Deliverable | Depends On |
|-------|----------------|------------|
| 1 | Project scaffold, Docker, UI kit | — |
| 2 | Auth system, JWT, user accounts | Phase 1 |
| 3 | Crawler, 4 audit engines, BullMQ | Phase 2 |
| 4 | Sites, domain verification, consent | Phase 3 |
| 5 | Content engine, exports (PDF/CSV/JSON) | Phase 4 |
| 6 | Stripe, subscriptions, tier gating | Phase 5 |
| 7 | Scheduling, trend analytics | Phase 6 |
| 8 | Teams, site sharing, roles | Phase 7 |
| 9 | Admin panel, system settings | Phase 8 |
| 10 | Email campaigns, CRM, lead scoring | Phase 9 |
| 11 | Blog, CMS, cold prospects, marketing | Phase 10 |
| 12 | Public API, referrals, launch polish | Phase 11 |
| 13 | API Docs SPA, API key rebrand (pp_) | Phase 12 |

Each branch is **cumulative** — Phase N includes everything from Phases 1 through N-1.
