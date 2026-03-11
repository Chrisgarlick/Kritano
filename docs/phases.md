# PagePulser — Phased Deployment Plan

> **Purpose**: Break the entire PagePulser codebase into 12 standalone branches that can be pushed to GitHub incrementally. Each phase builds on the previous one, progressing from bare-bones MVP to the full production platform.

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

Each branch is **cumulative** — Phase N includes everything from Phases 1 through N-1.
