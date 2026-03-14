# PagePulser Admin Panel — Plan of Action

## 1. Executive Summary

This is the **master implementation plan** for the PagePulser admin panel. It unifies four workstreams into a single phased rollout:

1. **Existing Admin Panel** — Dashboard, user/org management, bug reports, activity log (already built)
2. **CRM Module** — Lead scoring, automated triggers, one-click outreach (`ADMIN_CRM.md`)
3. **CMS Module** — Block-based blog editor, public blog, audit advice editor, announcements (`ADMIN_CMS.md`)
4. **Email Template System** — MJML block editor, campaign sending, preferences, tracking (`ADMIN_EMAIL_TEMPLATES.md`)

Each module has its own detailed spec. This document is the **execution guide** — it shows what exists, what's shared, what depends on what, and the order to build it all.

---

## 2. Current State — What's Already Built

### 2.1 Admin Backend (Complete)

| Endpoint | Purpose | Service Method |
|---|---|---|
| `GET /api/admin/check` | Verify super admin status | — |
| `GET /api/admin/dashboard` | Stats + system health | `getDashboardStats()` + `getSystemHealth()` |
| `GET /api/admin/analytics?days=30` | Historical daily analytics | `getAnalyticsHistory(days)` |
| `GET /api/admin/users` | Paginated user list (search, sort) | `listUsers()` |
| `GET /api/admin/users/:id` | User detail | `getUserDetails()` |
| `PATCH /api/admin/users/:id` | Toggle super admin | `updateUserSuperAdmin()` |
| `DELETE /api/admin/users/:id` | Delete user | `deleteUser()` |
| `GET /api/admin/organizations` | Paginated org list (search, tier filter, sort) | `listOrganizations()` |
| `GET /api/admin/organizations/:id` | Org detail | `getOrganizationDetails()` |
| `PATCH /api/admin/organizations/:id/subscription` | Change tier or status | `updateOrganizationTier()` / `updateSubscriptionStatus()` |
| `GET /api/admin/activity` | Admin audit trail | `getAdminActivityLog()` |
| `GET /api/admin/bug-reports` | Bug report list (status, severity, category, search) | `bugReportService.listAll()` |
| `GET /api/admin/bug-reports/stats` | Bug report aggregate counts | `bugReportService.getStats()` |
| `GET /api/admin/bug-reports/:id` | Bug report with comments | `bugReportService.getWithComments()` |
| `PATCH /api/admin/bug-reports/:id` | Update status/priority/notes | `bugReportService.update()` |
| `POST /api/admin/bug-reports/:id/comments` | Add admin comment | `bugReportService.addComment()` |
| `DELETE /api/admin/bug-reports/:id` | Soft delete report | `bugReportService.softDelete()` |

**Key files:**
- Routes: `server/src/routes/admin/index.ts`
- Service: `server/src/services/admin.service.ts`
- Middleware: `server/src/middleware/admin.middleware.ts`
- Bug reports: `server/src/services/bug-report.service.ts`

### 2.2 Admin Frontend (Complete)

| Route | Page | File |
|---|---|---|
| `/admin` | Dashboard (health, stats, 14-day chart) | `client/src/pages/admin/AdminDashboard.tsx` |
| `/admin/users` | User management (search, sort, super admin toggle, delete) | `client/src/pages/admin/AdminUsers.tsx` |
| `/admin/organizations` | Org management (search, tier filter, tier/status editing) | `client/src/pages/admin/AdminOrganizations.tsx` |
| `/admin/bug-reports` | Bug report list (status/severity/category filters, stats) | `client/src/pages/admin/AdminBugReports.tsx` |
| `/admin/bug-reports/:id` | Bug report detail (status/priority, comments, notes) | `client/src/pages/admin/AdminBugReportDetail.tsx` |
| `/admin/activity` | Admin activity audit log | `client/src/pages/admin/AdminActivity.tsx` |

**Infrastructure:**
- `AdminLayout` — Dark-themed layout with header nav tabs (`client/src/components/layout/AdminLayout.tsx`)
- `AdminContext` — Checks `/api/admin/check` on mount (`client/src/contexts/AdminContext.tsx`)
- `AdminRoute` — Route guard redirecting non-admins (`client/src/routes/AdminRoute.tsx`)
- Types — `DashboardStats`, `SystemHealth`, `AdminUser`, `AdminOrganization`, `AdminActivity`, `AnalyticsDataPoint` (`client/src/types/admin.types.ts`)
- API — `adminApi` namespace in `client/src/services/api.ts`

### 2.3 Supporting Infrastructure (Complete)

| Capability | Where | Reused By |
|---|---|---|
| Email delivery (Resend API) | `server/src/services/email.service.ts` | Email Templates, CRM |
| PDF rendering (Playwright) | `server/src/services/pdf-report.service.ts` | CMS (blog PDF export) |
| Tier-aware branding | `server/src/services/pdf-branding.service.ts` | Email Templates (email branding) |
| PostgreSQL job queue | `server/src/services/queue/job-queue.service.ts` | Email Campaigns |
| Worker process | `server/src/worker.ts` | Email Campaign sending |
| Redis | `server/src/db/redis.ts` | Rate limiting, caching |
| Domain verification | `server/src/services/domain-verification.service.ts` | CRM triggers |
| Consent tracking | `server/src/services/consent.service.ts` | Email preferences |
| Activity logging | `admin.middleware.ts` → `logAdminActivity()` | All new modules |

### 2.4 Database Tables (Already Exist)

| Table | Used By Admin |
|---|---|
| `users` | User management, CRM lead scoring |
| `organizations` | Org management |
| `subscriptions` | Tier management, CRM lead targeting |
| `organization_members` | CRM membership view |
| `sites` | CRM lead profile |
| `audit_jobs` | Dashboard stats, CRM triggers |
| `audit_findings` | CRM triggers, CMS audit advice |
| `admin_activity_log` | Activity page |
| `platform_analytics` | Dashboard chart |
| `bug_reports` + `bug_report_comments` | Bug report management |
| `tier_limits` | Tier management, branding resolution |

---

## 3. Target State — Full Admin Panel

### 3.1 Complete Route Map

```
/admin
│
├── /admin                              ← Dashboard (existing + enhanced)
│
├── /admin/users                        ← User management (existing)
├── /admin/organizations                ← Org management (existing)
├── /admin/bug-reports                  ← Bug report list (existing)
├── /admin/bug-reports/:id              ← Bug report detail (existing)
├── /admin/activity                     ← Activity log (existing)
│
├── /admin/crm                          ← NEW: CRM Module
│   ├── /admin/crm/leads               ← Lead board (filterable by status, sortable by score)
│   ├── /admin/crm/leads/:id           ← Lead profile (scores, timeline, memberships, triggers, outreach)
│   ├── /admin/crm/triggers            ← Pending trigger queue
│   └── /admin/crm/templates           ← Quick link to email template editor
│
├── /admin/email                        ← NEW: Email Module
│   ├── /admin/email/templates          ← Template library grid
│   ├── /admin/email/templates/new      ← Block editor (create)
│   ├── /admin/email/templates/:id      ← Block editor (edit)
│   ├── /admin/email/campaigns          ← Campaign list
│   ├── /admin/email/campaigns/new      ← Campaign builder wizard
│   ├── /admin/email/campaigns/:id      ← Campaign detail (stats, per-recipient)
│   └── /admin/email/analytics          ← Email performance dashboard
│
├── /admin/cms                          ← NEW: CMS Module
│   ├── /admin/cms/posts                ← Blog post list
│   ├── /admin/cms/posts/new            ← Block editor (create)
│   ├── /admin/cms/posts/:id/edit       ← Block editor (edit)
│   ├── /admin/cms/media                ← Media library
│   ├── /admin/cms/advice               ← Audit advice template editor
│   ├── /admin/cms/announcements        ← Banner manager
│   ├── /admin/cms/stories              ← Success story publisher
│   └── /admin/cms/stats                ← Publishing analytics
│
└── /admin/analytics                    ← NEW: Founder Analytics
    ├── /admin/analytics/funnel         ← Conversion funnel
    ├── /admin/analytics/trends         ← Global audit trends
    └── /admin/analytics/revenue        ← MRR/ARR dashboard
```

### 3.2 Navigation Evolution

The current `AdminLayout` has a flat tab bar with 5 items. With 4 new modules, this needs to become a grouped navigation.

**Current** (flat tabs):
```
Dashboard | Users | Organizations | Bug Reports | Activity
```

**Target** (grouped with section headers):

```
┌─────────────────────────────────────────────────────────────────────┐
│  PagePulser Admin                                     ← Back to App│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  OVERVIEW                                                           │
│    Dashboard    Users    Organizations    Bug Reports    Activity    │
│                                                                     │
│  GROWTH                                                             │
│    CRM Leads    Triggers    Email Templates    Campaigns            │
│                                                                     │
│  CONTENT                                                            │
│    Blog Posts    Media    Advice Editor    Announcements    Stories  │
│                                                                     │
│  ANALYTICS                                                          │
│    Funnel    Global Trends    Revenue    Email Analytics             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Implementation approach:** Replace the flat `adminNavItems` array in `AdminLayout.tsx` with grouped sections. Keep the dark theme (`bg-slate-900`). Switch the header nav to a sidebar or collapsible sub-nav when the module count exceeds what fits in a single row.

---

## 4. New Database Tables — Complete List

### 4.1 CRM Tables

| Table | Purpose | Key Columns |
|---|---|---|
| Columns on `users` | Lead scoring | `lead_score INT`, `lead_status VARCHAR(20)`, `lead_score_updated_at` |
| `crm_triggers` | Automated behavior alerts | `user_id`, `trigger_type`, `status`, `context JSONB` |

### 4.2 Email Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `email_templates` | Template definitions with blocks | `slug`, `subject`, `blocks JSONB`, `compiled_html`, `category`, `is_system` |
| `email_sends` | Per-recipient send log | `template_id`, `campaign_id`, `user_id`, `status`, `resend_message_id` |
| `email_campaigns` | Campaign metadata + targeting | `template_id`, `segment JSONB`, `status`, `stats JSONB` |
| `email_preferences` | User opt-in/opt-out by category | `user_id PK`, `transactional`, `marketing`, `unsubscribed_all` |
| `email_events` | Webhook-driven tracking | `email_send_id`, `event_type`, `metadata JSONB` |

### 4.3 CMS Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `blog_posts` | Blog content with blocks | `slug`, `title`, `content JSONB`, `category`, `status`, `published_at` |
| `blog_media` | Media library | `storage_key`, `mime_type`, `thumbnail_key`, `webp_key` |
| `blog_post_revisions` | Revision history | `post_id`, `content JSONB`, `revision_note` |
| `audit_advice_templates` | Editable audit finding text | `rule_id UNIQUE`, `description`, `recommendation`, `is_custom` |
| `announcements` | Dashboard banners | `title`, `type`, `target_tiers[]`, `starts_at`, `ends_at` |
| `announcement_dismissals` | Track who dismissed what | `announcement_id + user_id PK` |
| `success_stories` | Public showcase | `domain`, `category`, `score_before`, `score_after`, `is_published` |

### 4.4 Migration Numbering

Current highest migration: `048_add_keyword_data.sql`

| Migration | Table(s) | Module |
|---|---|---|
| `049_add_lead_scoring.sql` | `ALTER users` + indexes | CRM |
| `050_create_crm_triggers.sql` | `crm_triggers` | CRM |
| `051_create_email_templates.sql` | `email_templates` | Email |
| `052_create_email_campaigns.sql` | `email_campaigns` + `email_sends` | Email |
| `053_create_email_preferences.sql` | `email_preferences` | Email |
| `054_create_email_events.sql` | `email_events` | Email |
| `055_create_blog_posts.sql` | `blog_posts` | CMS |
| `056_create_blog_media.sql` | `blog_media` | CMS |
| `057_create_blog_revisions.sql` | `blog_post_revisions` | CMS |
| `058_create_audit_advice.sql` | `audit_advice_templates` | CMS |
| `059_create_announcements.sql` | `announcements` + `announcement_dismissals` | CMS |
| `060_create_success_stories.sql` | `success_stories` | CMS |

**Total: 12 new migrations, 14 new tables/alterations.**

---

## 5. New Backend Services — Complete List

| Service File | Module | Responsibility |
|---|---|---|
| `lead-scoring.service.ts` | CRM | Score calculation, status derivation, batch recalc |
| `crm-trigger.service.ts` | CRM | Trigger evaluation, firing, deduplication |
| `email-template.service.ts` | Email | Template CRUD, MJML compilation, variable substitution, sending |
| `email-campaign.service.ts` | Email | Campaign lifecycle, segment resolution, queue processing |
| `email-branding.service.ts` | Email | Tier-aware branding resolution for emails |
| `email-preference.service.ts` | Email | User opt-in/opt-out, unsubscribe tokens |
| `blog.service.ts` | CMS | Post CRUD, slug generation, revisions, reading time |
| `blog-media.service.ts` | CMS | Upload handling, Sharp processing, storage |
| `cms.service.ts` | CMS | Audit advice, announcements, success stories |
| `admin-analytics.service.ts` | Analytics | Funnel, global trends, revenue calculations |

**Modified services:**

| Existing Service | Change |
|---|---|
| `email.service.ts` | Replace inline HTML templates with template service calls; add `sendTemplateEmail()` |
| `admin.service.ts` | Add lead board queries |
| Worker (`worker.ts`) | Add campaign send processing, call `recalculateScore()` after audit completion |

---

## 6. New Backend Routes — Complete List

### 6.1 CRM Routes (`/api/admin/crm/*`)

```
GET    /api/admin/crm/leads?status=&sort=lead_score&order=desc&page=1&limit=50
GET    /api/admin/crm/leads/:userId
POST   /api/admin/crm/leads/:userId/recalc
GET    /api/admin/crm/stats
GET    /api/admin/crm/leads/:userId/memberships
GET    /api/admin/crm/triggers?status=pending&type=&page=1&limit=50
PATCH  /api/admin/crm/triggers/:id
GET    /api/admin/crm/triggers/stats
POST   /api/admin/crm/outreach/:userId     Body: { templateSlug, variables }
GET    /api/admin/crm/outreach?userId=&page=1
```

### 6.2 Email Routes (`/api/admin/email/*` + public)

```
-- Admin
GET    /api/admin/email/templates
GET    /api/admin/email/templates/:id
POST   /api/admin/email/templates
PUT    /api/admin/email/templates/:id
DELETE /api/admin/email/templates/:id
POST   /api/admin/email/templates/:id/preview
POST   /api/admin/email/templates/:id/test
POST   /api/admin/email/templates/:id/duplicate
GET    /api/admin/email/campaigns
GET    /api/admin/email/campaigns/:id
POST   /api/admin/email/campaigns
PUT    /api/admin/email/campaigns/:id
POST   /api/admin/email/campaigns/:id/preview
POST   /api/admin/email/campaigns/:id/launch
POST   /api/admin/email/campaigns/:id/cancel
DELETE /api/admin/email/campaigns/:id
GET    /api/admin/email/sends?userId=&templateId=&campaignId=&status=&page=1&limit=50
GET    /api/admin/email/analytics
GET    /api/admin/email/analytics/templates

-- Public
GET    /api/email/unsubscribe?token=...
GET    /api/email/preferences?token=...
POST   /api/email/preferences?token=...
GET    /api/email/preferences  (authenticated)
PUT    /api/email/preferences  (authenticated)

-- Webhook
POST   /api/webhooks/resend
```

### 6.3 CMS Routes (`/api/admin/cms/*` + public blog)

```
-- Admin
GET    /api/admin/cms/posts?status=&category=&search=&page=1&limit=20
GET    /api/admin/cms/posts/:id
POST   /api/admin/cms/posts
PUT    /api/admin/cms/posts/:id
DELETE /api/admin/cms/posts/:id
POST   /api/admin/cms/posts/:id/publish
POST   /api/admin/cms/posts/:id/unpublish
GET    /api/admin/cms/posts/:id/revisions
POST   /api/admin/cms/posts/:id/revisions/:revId/restore
POST   /api/admin/cms/posts/:id/export?format=markdown|pdf
GET    /api/admin/cms/media?page=1&limit=24
POST   /api/admin/cms/media
DELETE /api/admin/cms/media/:id
PATCH  /api/admin/cms/media/:id
GET    /api/admin/cms/stats
GET    /api/admin/cms/advice?category=&search=&page=1&limit=50
GET    /api/admin/cms/advice/:ruleId
PUT    /api/admin/cms/advice/:ruleId
DELETE /api/admin/cms/advice/:ruleId
GET    /api/admin/cms/announcements?active=true&page=1
POST   /api/admin/cms/announcements
PUT    /api/admin/cms/announcements/:id
DELETE /api/admin/cms/announcements/:id
GET    /api/admin/cms/success-stories
POST   /api/admin/cms/success-stories
PUT    /api/admin/cms/success-stories/:id
DELETE /api/admin/cms/success-stories/:id

-- Public blog (no auth)
GET    /api/blog/posts?category=&tag=&page=1&limit=12
GET    /api/blog/posts/:slug
GET    /api/blog/categories
GET    /api/blog/sitemap.xml
GET    /api/blog/feed.xml

-- Public stories (no auth)
GET    /api/public/success-stories?limit=6

-- User-facing
GET    /api/announcements/active
POST   /api/announcements/:id/dismiss
```

### 6.4 Founder Analytics Routes (`/api/admin/analytics/*`)

```
GET    /api/admin/analytics/funnel?range=30d
GET    /api/admin/analytics/global-trends?range=30d
GET    /api/admin/analytics/revenue
```

---

## 7. New Frontend Pages — Complete List

### 7.1 CRM Pages

| Route | Component | Purpose |
|---|---|---|
| `/admin/crm/leads` | `AdminCrmLeads.tsx` | Lead board — filterable by status, sortable by score |
| `/admin/crm/leads/:id` | `AdminCrmLeadProfile.tsx` | Full lead profile with timeline, memberships, triggers, outreach |
| `/admin/crm/triggers` | `AdminCrmTriggers.tsx` | Pending trigger queue with action buttons |

### 7.2 Email Pages

| Route | Component | Purpose |
|---|---|---|
| `/admin/email/templates` | `AdminEmailTemplates.tsx` | Template library grid with category filters |
| `/admin/email/templates/new` | `AdminEmailEditor.tsx` | Block-based email editor (create) |
| `/admin/email/templates/:id` | `AdminEmailEditor.tsx` | Block-based email editor (edit) |
| `/admin/email/campaigns` | `AdminEmailCampaigns.tsx` | Campaign list with status/stats |
| `/admin/email/campaigns/new` | `AdminEmailCampaignBuilder.tsx` | 4-step campaign wizard |
| `/admin/email/campaigns/:id` | `AdminEmailCampaignDetail.tsx` | Campaign stats, per-recipient status |
| `/admin/email/analytics` | `AdminEmailAnalytics.tsx` | Delivery/open/click/bounce rate dashboard |

### 7.3 CMS Pages

| Route | Component | Purpose |
|---|---|---|
| `/admin/cms/posts` | `AdminCmsPosts.tsx` | Post list with status/category filters |
| `/admin/cms/posts/new` | `AdminCmsPostEditor.tsx` | Block-based blog editor (create) |
| `/admin/cms/posts/:id/edit` | `AdminCmsPostEditor.tsx` | Block-based blog editor (edit) |
| `/admin/cms/media` | `AdminCmsMedia.tsx` | Media library with upload |
| `/admin/cms/advice` | `AdminCmsAdvice.tsx` | Audit advice template editor |
| `/admin/cms/announcements` | `AdminCmsAnnouncements.tsx` | Banner manager |
| `/admin/cms/stories` | `AdminCmsStories.tsx` | Success story publisher |
| `/admin/cms/stats` | `AdminCmsStats.tsx` | Publishing analytics |

### 7.4 Analytics Pages

| Route | Component | Purpose |
|---|---|---|
| `/admin/analytics/funnel` | `AdminAnalyticsFunnel.tsx` | Conversion funnel visualization |
| `/admin/analytics/trends` | `AdminAnalyticsTrends.tsx` | Global audit trends + top issues |
| `/admin/analytics/revenue` | `AdminAnalyticsRevenue.tsx` | MRR/ARR by tier |

### 7.5 Public Pages (New)

| Route | Component | Purpose |
|---|---|---|
| `/blog` | `BlogListPage.tsx` | Public blog listing (paginated, category filtered) |
| `/blog/:slug` | `BlogPostPage.tsx` | Public article view |
| `/blog/category/:category` | `BlogListPage.tsx` | Category-filtered listing |
| `/email/unsubscribe` | `UnsubscribePage.tsx` | One-click unsubscribe confirmation |
| `/settings/notifications` | `NotificationSettings.tsx` | Email preference management |

### 7.6 Shared Components (New)

| Component | Shared By | Purpose |
|---|---|---|
| `BlockList.tsx` | CMS editor, Email editor | `@dnd-kit/sortable` container |
| `BlockWrapper.tsx` | CMS editor, Email editor | Drag handle, type label, delete |
| `BlockRenderer.tsx` | CMS editor | Switch on block type → editor component |
| `BlockDisplay.tsx` | CMS preview, public blog | Read-only block renderer |
| `AddBlockMenu.tsx` | CMS editor, Email editor | Block type picker grid |
| `MediaPicker.tsx` | CMS editor | Upload + select modal |
| `EmailCanvas.tsx` | Email editor | 600px email preview container |
| `EmailBlockRenderer.tsx` | Email editor | Switch on email block type |
| `EmailBlockSettings.tsx` | Email editor | Per-block settings panel |
| `PreviewToggle.tsx` | Email editor | Desktop/Mobile toggle |

---

## 8. Dependency Changes

### 8.1 Server (`server/package.json`)

```
mjml: ^5.0.0-alpha.4        — MJML → HTML email compilation
handlebars: ^4.7.8           — Email variable substitution
multer: ^1.4.5-lts.1         — File upload handling (CMS media)
sharp: ^0.33.x               — Image resize, WebP, thumbnails
sanitize-html: ^2.x          — HTML sanitization for markdown
@types/multer: ^1.4.x        — TypeScript types (devDependency)
```

### 8.2 Client (`client/package.json`)

```
@dnd-kit/core: ^6.1.0        — Drag-drop foundation (CMS + Email editors)
@dnd-kit/sortable: ^8.0.0    — Sortable lists
@dnd-kit/utilities: ^3.2.2   — Drag-drop helpers
react-markdown: ^9.x         — Markdown rendering (blog)
remark-gfm: ^4.x             — GitHub Flavored Markdown
rehype-highlight: ^7.x       — Syntax highlighting
rehype-sanitize: ^6.x        — XSS protection
react-helmet-async: ^2.x     — Per-page meta tags (blog SEO)
```

Already installed: `resend` (v2.0.0), `ioredis` (v5.9.2), Playwright (for PDF).

---

## 9. Cross-Module Dependencies

Understanding what depends on what is critical for sequencing. Arrows show "depends on":

```
                    ┌──────────────────┐
                    │  Existing Admin   │
                    │  (Dashboard,      │
                    │   Users, Orgs)    │
                    └────────┬─────────┘
                             │
              ┌──────────────┼───────────────┐
              │              │               │
              ▼              ▼               ▼
    ┌─────────────┐  ┌──────────────┐  ┌──────────┐
    │  CRM Module  │  │ Email Module │  │ Founder  │
    │             │  │              │  │ Analytics │
    │  lead_score ─┼──▶ campaigns    │  │          │
    │  triggers  ──┼──▶ outreach     │  │  funnel  │
    │             │  │              │  │  trends   │
    └─────────────┘  └──────┬───────┘  │  revenue  │
                            │          └──────────┘
                            │
                    ┌───────▼───────┐
                    │  CMS Module    │
                    │               │
                    │  blog posts   │
                    │  media library│
                    │  advice editor│
                    │  announcements│
                    └───────────────┘
```

**Key dependency chain:**

1. **Email Templates** must be built before CRM outreach (CRM sends emails via template service)
2. **Email Templates** must be built before CMS newsletter (publish notifications use email campaigns)
3. **CRM lead scoring** and **Email Templates** are independent of each other at the data layer
4. **CMS** is independent of both CRM and Email at the data layer but shares UI components (`@dnd-kit`, block editors)
5. **Founder Analytics** is pure query work — no dependencies, can be built at any point
6. **Email Preferences** must be built before any campaign sending

---

## 10. Implementation Phases

### Phase 0: Shared Infrastructure (Week 1) — DONE

Before any module, set up shared pieces that multiple modules need.

| # | Task | Module | Files | Status |
|---|---|---|---|---|
| 0.1 | Install server dependencies (`mjml`, `handlebars`, `multer`, `sharp`, `sanitize-html`) | All | `server/package.json` | **DONE** |
| 0.2 | Install client dependencies (`@dnd-kit/*`, `react-markdown`, `rehype-*`, `react-helmet-async`) | All | `client/package.json` | **DONE** |
| 0.3 | Refactor `AdminLayout.tsx` to grouped sidebar navigation | All | `client/src/components/layout/AdminLayout.tsx` | **DONE** |
| 0.4 | Add new admin route groups in `App.tsx` (17 placeholder pages) | All | `client/src/App.tsx` + `client/src/pages/admin/{crm,email,cms,analytics}/*` | **DONE** |
| 0.5 | Add new admin route mounts in server (4 sub-routers) | All | `server/src/routes/admin/{crm,email,cms,analytics}.ts` | **DONE** |

### Phase 1: Email Template Engine (Weeks 2-3) — DONE

Build the template engine first because CRM outreach and CMS newsletters both depend on it.

| # | Task | Detail | Status |
|---|---|---|---|
| 1.1 | **Migration 049:** `email_templates` + `email_sends` tables | Full schema with blocks JSONB, compiled_html, category, branding_mode | **DONE** |
| 1.2 | **Migration 050:** `email_preferences` table | Per-user preference toggles with CAN-SPAM compliance | **DONE** |
| 1.3 | **Types:** `email-template.types.ts` | 10 block types, template/send/preference interfaces, branding types | **DONE** |
| 1.4 | **Service:** `email-template.service.ts` | CRUD, MJML compilation, Handlebars substitution, dynamic blocks, sending | **DONE** |
| 1.5 | **Service:** `email-branding.service.ts` | Tier-aware branding resolution mirroring pdf-branding.service.ts | **DONE** |
| 1.6 | **Service:** `email-preference.service.ts` | Preferences CRUD, JWT unsubscribe tokens, category send checks | **DONE** |
| 1.7 | **Seed 051:** 3 system templates | `email_verification`, `password_reset`, `audit_completed` with full block JSON | **DONE** |
| 1.8 | **Refactor:** `email.service.ts` → use template service | Optional userId param, delegates to template service, falls back to inline HTML | **DONE** |
| 1.9 | **Routes:** `/api/admin/email/templates/*` | CRUD, preview, test send, duplicate with Zod validation + activity logging | **DONE** |
| 1.10 | **Routes:** `/api/email/unsubscribe`, `/api/email/preferences` | Public token-based + authenticated preference routes | **DONE** |
| 1.11 | **Frontend:** Template library page | `TemplatesPage.tsx` — grid with category filters, search, pagination, CRUD | **DONE** |
| 1.12 | **Frontend:** Template editor page | `TemplateEditorPage.tsx` — block palette, canvas, settings panel, preview | **DONE** |
| 1.13 | **Frontend:** Notification settings page | `NotificationSettings.tsx` — toggle UI in /settings/notifications | **DONE** |
| 1.14 | **Frontend:** Unsubscribe page | `UnsubscribePage.tsx` — token processing with success/error states | **DONE** |
| 1.15 | **Verify:** TypeScript compilation clean | Server + client compile with no new errors | **DONE** |

### Phase 2: CRM Foundation (Weeks 3-4) — DONE

Build lead scoring and triggers. Outreach depends on Phase 1 templates.

| # | Task | Detail | Status |
|---|---|---|---|
| 2.1 | **Migration 052:** Add `lead_score`, `lead_status` to `users` | Schema with indexes, CHECK constraint for 7 statuses | **DONE** |
| 2.2 | **Migration 053:** `crm_triggers` table | UUID PK, JSONB context, dedup index | **DONE** |
| 2.3 | **Service:** `lead-scoring.service.ts` | `recalculateScore()`, `batchRecalculate()`, `getLeadBoard()`, `getLeadProfile()`, `getLeadTimeline()`, `getLeadMemberships()`, `getLeadStats()` | **DONE** |
| 2.4 | **Service:** `crm-trigger.service.ts` | `checkTriggers()`, `fireTrigger()`, 30-day deduplication, `checkStalledVerifications()` | **DONE** |
| 2.5 | **Hooks:** Wire `recalculateScore()` into auth (register + verify), audit worker, site-sharing | Fire-and-forget pattern with `.catch()` | **DONE** |
| 2.6 | **Routes:** `/api/admin/crm/leads/*`, `/api/admin/crm/triggers/*`, `/api/admin/crm/stats` | Full CRUD with Zod validation + activity logging | **DONE** |
| 2.7 | **Routes:** `/api/admin/crm/outreach/*` | Uses email template service from Phase 1, 50/day rate limit | **DONE** |
| 2.8 | **Seed 054:** Default CRM email templates | 7 templates: welcome, verify, security, upgrade, AEO, win-back, celebration | **DONE** |
| 2.9 | **Backfill 055:** Backfill lead scores for existing users | 10-step migration: base scores, bonuses, decay, status derivation | **DONE** |
| 2.10 | **Frontend:** Lead board page | `LeadsPage.tsx` — stats bar, search/filter/sort, paginated table | **DONE** |
| 2.11 | **Frontend:** Lead profile page | `LeadDetailPage.tsx` — header, stats cards, timeline, memberships, outreach history, send modal | **DONE** |
| 2.12 | **Frontend:** Trigger queue page | `TriggersPage.tsx` — stats, type breakdown, filter by status/type, action buttons, pagination | **DONE** |
| 2.13 | **Verify:** TypeScript compilation clean | Server + client compile with no new errors | **DONE** |

### Phase 3: Email Campaigns (Weeks 4-5) — DONE

Build campaign sending on top of the template engine.

| # | Task | Detail | Status |
|---|---|---|---|
| 3.1 | **Migration 056:** `email_campaigns` + `email_sends` tables | Schema from `ADMIN_EMAIL_TEMPLATES.md` §4.2-4.3 | **DONE** |
| 3.2 | **Migration 057:** `email_events` table | Webhook tracking schema from §4.5 | **DONE** |
| 3.3 | **Service:** `email-campaign.service.ts` | Segment resolution, campaign lifecycle, queue processing | **DONE** |
| 3.4 | **Worker:** Campaign send processing | `campaign-worker.service.ts` — polling worker with rate limiting | **DONE** |
| 3.5 | **Route:** `/api/webhooks/resend` | Webhook handler with Svix signature verification, all 7 event types | **DONE** |
| 3.6 | **Routes:** `/api/admin/email/campaigns/*` | CRUD, launch, schedule, pause, resume, cancel, audience-count | **DONE** |
| 3.7 | **Routes:** `/api/admin/email/sends`, `/api/admin/email/analytics` | Send history + aggregate stats + template performance | **DONE** |
| 3.8 | **Frontend:** Campaign list page | `CampaignsPage.tsx` — stats, search/filter, lifecycle actions | **DONE** |
| 3.9 | **Frontend:** Campaign builder wizard | `CampaignEditorPage.tsx` — 4-step (template, segment, schedule, review) | **DONE** |
| 3.10 | **Frontend:** Campaign detail page | `CampaignEditorPage.tsx` — stats, progress bar, per-recipient table | **DONE** |
| 3.11 | **Frontend:** Email analytics dashboard | `EmailAnalyticsPage.tsx` — delivery/open/click/bounce rates, template table | **DONE** |

### Phase 4: CMS Core (Weeks 5-7) — DONE

Build the blog system. This is the largest module.

| # | Task | Detail | Status |
|---|---|---|---|
| 4.1 | **Migration 058:** `blog_posts` table | Full schema with JSONB content, 11 categories, tags, SEO fields | **DONE** |
| 4.2 | **Migration 059:** `blog_media` table | Schema with storage keys, dimensions, thumbnail/WebP variants | **DONE** |
| 4.3 | **Migration 060:** `blog_post_revisions` table | Schema with post FK, JSONB content, revision notes | **DONE** |
| 4.4 | **Types:** `blog.types.ts` | Post, block (12 types), media, revision, stats interfaces | **DONE** |
| 4.5 | **Validators:** `blog.validators.ts` | Zod schemas for all 12 block types including recursive two_column | **DONE** |
| 4.6 | **Service:** `blog.service.ts` | Post CRUD, slug generation, revisions, reading time, view counts, sitemap | **DONE** |
| 4.7 | **Service:** `blog-media.service.ts` | Upload with Sharp processing (resize, thumbnail, WebP), delete, list | **DONE** |
| 4.8 | **Routes:** `/api/admin/cms/posts/*`, `/api/admin/cms/media/*` | Full admin CMS endpoints + stats | **DONE** |
| 4.9 | **Routes:** `/api/blog/*` | Public blog list, detail, categories, sitemap.xml, feed.xml | **DONE** |
| 4.10 | **Frontend:** Post list page | `PostsPage.tsx` — stats cards, search, status/category filters, pagination | **DONE** |
| 4.11 | **Frontend:** Block editor components | `BlockWrapper`, `BlockRenderer`, `AddBlockMenu` (BlockList inline in editor) | **DONE** |
| 4.12 | **Frontend:** Block type editors | All 12 types in `BlockRenderer.tsx` (two_column nested editing is stub) | **DONE** |
| 4.13 | **Frontend:** Media picker modal | `MediaPicker.tsx` — drag-drop upload + library grid | **DONE** |
| 4.14 | **Frontend:** Post editor page | `PostEditorPage.tsx` — dnd-kit blocks, auto-save, preview, SEO fields | **DONE** |
| 4.15 | **Frontend:** Media library page | `MediaPage.tsx` — upload, grid, preview modal, alt text editing | **DONE** |
| 4.16 | **Frontend:** Public blog pages | `PostListPage.tsx`, `PostDetailPage.tsx` — responsive cards, full article | **DONE** |
| 4.17 | **Frontend:** `BlockDisplay.tsx` | Read-only renderer for all 12 types with ReactMarkdown + sanitize | **DONE** |
| 4.18 | **SEO:** Meta tags, OG, structured data | Full OG + Article schema.org JSON-LD on detail page | **DONE** |
| 4.19 | **Sitemap + RSS** | `/api/blog/sitemap.xml` (XML Sitemap 0.9), `/api/blog/feed.xml` (Atom 1.0) | **DONE** |

### Phase 5: CMS Extras (Week 7-8) — DONE

Build the smaller CMS features: audit advice, announcements, success stories.

| # | Task | Detail | Status |
|---|---|---|---|
| 5.1 | **Migration 061:** `audit_advice_templates` table | Schema from `ADMIN_CRM.md` §4.1 | **DONE** |
| 5.2 | **Migration 062:** `announcements` + `announcement_dismissals` | Schema from §4.2 | **DONE** |
| 5.3 | **Migration 063:** `success_stories` table | Schema from §4.3 | **DONE** |
| 5.4 | **Service:** `cms.service.ts` | Advice CRUD, announcement CRUD, success story CRUD | **DONE** |
| 5.5 | **Seed:** Extract existing audit engine advice into `audit_advice_templates` | Scan `seo.engine.ts`, `content.engine.ts`, etc. | Deferred |
| 5.6 | **Routes:** `/api/admin/cms/advice/*`, `/api/admin/cms/announcements/*`, `/api/admin/cms/stories/*` | Full CRUD with Zod validation + activity logging | **DONE** |
| 5.7 | **Routes:** `/api/announcements/active`, `/api/announcements/:id/dismiss`, `/api/public/success-stories` | Public + authenticated endpoints | **DONE** |
| 5.8 | **Integration:** Dashboard checks announcements on load | Frontend calls `/api/announcements/active` | **DONE** (API ready) |
| 5.9 | **Integration:** Audit detail checks `audit_advice_templates` for custom text | Override engine defaults | Deferred |
| 5.10 | **Frontend:** Advice editor page | `AdvicePage.tsx` — search, category filter, inline editor modal | **DONE** |
| 5.11 | **Frontend:** Announcements manager page | `AnnouncementsPage.tsx` — CRUD, scheduling, tier targeting, toggle | **DONE** |
| 5.12 | **Frontend:** Success story publisher page | `StoriesPage.tsx` — cards grid, score visualization, publish toggle | **DONE** |
| 5.13 | **Frontend:** CMS stats page | `AdminCmsStats.tsx` — view counts, top posts | Already in Phase 4 via `getCmsStats()` |

#### Phase 5 Deferred Items

These items were intentionally deferred as they require deeper integration with other subsystems:

1. **5.5 — Seed audit engine advice:** Requires scanning all audit engine files (`seo.engine.ts`, `content.engine.ts`, `accessibility.engine.ts`, etc.) to extract every `ruleName`, `message`, and `recommendation` into `audit_advice_templates` rows. This is a data migration task — the CRUD infrastructure is ready, just needs the initial data populated.

2. **5.8 — Dashboard announcement integration:** The API endpoint `GET /api/announcements/active` is built and ready. The remaining work is calling it from the user-facing dashboard component on load and rendering the banners. This is a small frontend change in the dashboard page.

3. **5.9 — Audit detail advice override:** When rendering audit findings (in the frontend detail view and PDF exports), the system should check `audit_advice_templates` for a matching `rule_id` and use custom text (`is_custom = true`) instead of the engine default. This requires changes to the audit finding rendering pipeline in both the frontend and `pdf-report.service.ts`.

### Phase 6: Founder Analytics (Week 8-9) — DONE

Pure query work — no new tables, just aggregation over existing data.

| # | Task | Detail | Status |
|---|---|---|---|
| 6.1 | **Service:** `admin-analytics.service.ts` | Funnel, global trends, revenue calculations | DONE |
| 6.2 | **Routes:** `/api/admin/analytics/funnel`, `trends`, `revenue` | Replaced placeholder routes with real endpoints | DONE |
| 6.3 | **Frontend:** Funnel page | `FunnelPage.tsx` — staged conversion visualization with drop-off cards | DONE |
| 6.4 | **Frontend:** Trends page | `TrendsPage.tsx` — top issues table, score distribution, tier breakdown | DONE |
| 6.5 | **Frontend:** Revenue page | `RevenuePage.tsx` — MRR/ARR by tier, churn, net growth, ARPU | DONE |

#### Phase 6 Implementation Notes

- **No new migrations** — pure query aggregation over existing tables
- **Tier pricing** is config-driven (`TIER_PRICING` constant in service), ready for Stripe replacement
- **Funnel** tracks cohorted conversion: Registered → Verified Email → First Audit → Domain Verified → Paid Subscriber (all scoped to range)
- **Trends** includes percentile score distributions (P10/median/P90), top 20 issues by affected-audits count, and tier-level audit breakdown
- **Revenue** calculates MRR/ARR from active subscription counts × tier pricing, with churn/new metrics for current month
- **Service initialization** added to `routes/index.ts` via `initializeAdminAnalyticsService(pool)`

### Phase 7: Dashboard Enhancement (Week 9) — DONE

Enhance the existing dashboard to surface data from all new modules.

| # | Task | Detail | Status |
|---|---|---|---|
| 7.1 | Add CRM summary to dashboard | Total leads, avg score, pending triggers badge, churn risk badge | DONE |
| 7.2 | Add email summary to dashboard | Sent (7d), open rate, delivered, clicked, bounced | DONE |
| 7.3 | Add CMS summary to dashboard | Published posts, total views, drafts awaiting publish, media count | DONE |
| 7.4 | Add revenue summary to dashboard | MRR, paid subscriber count, net MRR change, churn/new counts | DONE |
| 7.5 | Enhance system health | Existing health section preserved; module summaries surface health-adjacent data (queue in worker, triggers in CRM, bounces in email) | DONE |

#### Phase 7 Implementation Notes

- **No backend changes** — all data comes from existing API endpoints loaded in parallel via `Promise.allSettled`
- Module summaries load non-blocking (separate from main dashboard load) so the page renders fast
- Individual module failures are caught independently — one module API error doesn't affect others
- Each module card links to its full admin page
- CRM card highlights pending triggers (amber badge) and churn risk users (red badge) for immediate attention
- Revenue card shows net MRR change with green/red indicator
- Email card calculates open rate from delivered vs opened counts

#### Phase 7 Deferred Items

- **7.5 extended health**: Email queue size, blog storage used, and template compilation status require new backend queries not yet implemented. The existing system health section plus module-level metrics (bounces, pending triggers, draft posts) cover most use cases.

### Phase 8: Stripe Integration (Future)

Not part of the initial build. When ready:

| # | Task |
|---|---|
| 8.1 | Stripe webhook handler for `customer.subscription.created/updated/deleted` |
| 8.2 | Replace manual MRR calculation with real Stripe data |
| 8.3 | Checkout flow for tier upgrades |
| 8.4 | Payment history per organization |
| 8.5 | Dunning emails for `past_due` subscriptions (via email template system) |

---

## 11. Security Checklist

Every new module inherits the existing security model (`requireSuperAdmin` middleware + activity logging). Additional requirements per module:

| Requirement | Implementation | Module |
|---|---|---|
| All admin routes require `is_super_admin` | `requireSuperAdmin` middleware on every route group | All |
| Every admin write action is logged | `logAdminActivity()` after create/update/delete | All |
| System email templates cannot be deleted | `is_system = true` check in DELETE handler | Email |
| Email variables are HTML-escaped | Handlebars default escaping | Email |
| Unsubscribe uses signed tokens | JWT with `purpose: 'unsubscribe'`, no expiry | Email |
| Campaign rate limiting | Max 10,000 recipients, 5/sec send rate | Email |
| Admin outreach limiting | Max 50 emails per admin per day | Email + CRM |
| Resend webhook signature verified | Signature check before processing | Email |
| Email preferences enforced before every non-transactional send | `canSendCategory()` check | Email |
| Blog content sanitized | `sanitize-html` on markdown output | CMS |
| Media upload validated | Mime type allowlist, 10MB limit, EXIF stripping | CMS |
| Segment criteria parameterized | No string interpolation in SQL | Email Campaigns |
| Admin role expansion ready | `is_super_admin` extensible to `admin_role` enum (`super_admin`, `support`, `marketing`) | Future |
| Support role: CRM read-only, no revenue | Role check on revenue endpoints | Future |
| Marketing role: CMS + Email, no tier changes | Role check on subscription endpoints | Future |

---

## 12. Testing Strategy

### 12.1 Critical Paths to Test

| Test | What It Verifies |
|---|---|
| Create template → preview → send test email | Template compilation pipeline end-to-end |
| Existing verification/reset/audit emails still work | Migration from inline HTML to template service didn't break anything |
| Lead score recalculates on audit completion | Worker → `recalculateScore()` → score updates in DB |
| Trigger fires on churn risk | Status transition → `checkTriggers()` → `crm_triggers` row created |
| Campaign launch → queued sends → delivery | Full campaign lifecycle |
| Unsubscribe → preference saved → marketing email blocked | CAN-SPAM compliance |
| Resend webhook → `email_events` → status updated | Webhook integration |
| Blog post create → publish → public visible | CMS lifecycle |
| Media upload → Sharp processing → 3 variants stored | Upload pipeline |
| Announcement created → user sees on dashboard → dismisses → gone | Announcement lifecycle |

### 12.2 Integration Test Setup

Each module should have its own test file in `server/src/__tests__/`:

```
admin-crm.test.ts             — Lead scoring, triggers, outreach
email-template.test.ts        — Template CRUD, compilation, sending
email-campaign.test.ts         — Campaign lifecycle, segment resolution
email-preference.test.ts       — Preferences, unsubscribe
blog.test.ts                  — Post CRUD, media upload, public API
cms.test.ts                   — Advice, announcements, success stories
admin-analytics.test.ts        — Funnel, trends, revenue queries
```

---

## 13. Timeline Summary

| Phase | Module | Duration | Depends On |
|---|---|---|---|
| **0** | Shared infrastructure | 1 week | — |
| **1** | Email Template Engine | 2 weeks | Phase 0 |
| **2** | CRM Foundation | 2 weeks | Phase 0, Phase 1 (for outreach) |
| **3** | Email Campaigns | 2 weeks | Phase 1 |
| **4** | CMS Core (Blog) | 3 weeks | Phase 0 |
| **5** | CMS Extras (Advice, Announcements, Stories) | 2 weeks | Phase 4 |
| **6** | Founder Analytics | 1 week | — (can run in parallel) |
| **7** | Dashboard Enhancement | 1 week | Phases 1-6 |
| **8** | Stripe Integration | TBD | Phase 6 (revenue) |

**Total estimate: ~10-12 weeks** for Phases 0-7.

Phases 1-3 (Email + CRM) and Phase 4 (CMS) can run in parallel if two developers are available.

---

## 14. File Count Summary

| Category | New Files | Modified Files |
|---|---|---|
| Migrations | 12 | 0 |
| Server services | 10 | 3 |
| Server routes | 5 | 2 |
| Server types | 3 | 0 |
| Server validators | 1 | 0 |
| Server seeds | 2 | 0 |
| Client pages (admin) | 17 | 1 |
| Client pages (public) | 4 | 0 |
| Client components | 16 | 2 |
| Client types | 2 | 1 |
| **Total** | **72** | **9** |

---

## 15. Deferred Items — Implementation Plan

These items were deferred during Phases 5 and 7 because they require deeper integration with other subsystems. They can be tackled independently in any order.

### D1: Seed Audit Advice Templates (from Phase 5.5)

**Goal:** Populate `audit_advice_templates` with every rule defined across the audit engines, so admins can immediately browse and customise advice without manually creating entries.

**Approach:** A one-time seed migration (SQL or script) that extracts rules from the engine source and inserts them with `is_custom = false`.

| # | Task | Detail |
|---|---|---|
| D1.1 | Catalogue all engine rules | Scan `seo.engine.ts` (~33 rules), `security.engine.ts` (~23), `performance.engine.ts` (~22), `structured-data.engine.ts` (~11), `content.engine.ts` (variable). For each, extract: `rule_id`, `rule_name`, `category`, `severity`, `description`, `recommendation`, `help_url`. |
| D1.2 | Create seed SQL migration | `server/src/db/migrations/064_seed_audit_advice_templates.sql` — `INSERT INTO audit_advice_templates (...) VALUES (...) ON CONFLICT (rule_id) DO NOTHING`. Uses `is_custom = false` so admin overrides aren't clobbered. |
| D1.3 | Handle accessibility (axe-core) rules | Axe-core rules are dynamic (WCAG version + level dependent). Two options: **(a)** run axe-core at build time to dump all rule metadata into seed SQL, or **(b)** skip seeding accessibility and let the custom advice override flow (D3) handle them lazily. **Recommend (b)** — axe-core has 100+ rules that change across versions; seeding them creates maintenance burden. |
| D1.4 | Verify in AdvicePage | After running migration, the admin Advice page should show ~89 pre-populated rows filterable by category. |

**Key files:**
- Source: `server/src/services/audit-engines/*.engine.ts`
- Target: `server/src/db/migrations/064_seed_audit_advice_templates.sql`
- Verification: `client/src/pages/admin/cms/AdvicePage.tsx`

**Gotchas:**
- Rule IDs must match exactly what the engines emit into `audit_findings.rule_id` — check each engine carefully
- `ON CONFLICT (rule_id) DO NOTHING` ensures re-running the migration is safe and doesn't overwrite admin customisations
- Content engine rules may be harder to extract (less structured) — may need manual curation

---

### D2: User-Facing Announcement Banners (from Phase 5.8)

**Goal:** Show active announcements as dismissible banners on the user dashboard so admins can communicate maintenance windows, feature launches, etc.

**Approach:** The entire backend is already built (`GET /api/announcements/active`, `POST /api/announcements/:id/dismiss`, client methods `announcementsApi.getActive()` / `.dismiss()`). This is purely a small frontend addition.

| # | Task | Detail |
|---|---|---|
| D2.1 | Create `AnnouncementBanner` component | `client/src/components/ui/AnnouncementBanner.tsx` — renders a list of announcements as coloured banners (info=blue, success=green, warning=amber, maintenance=slate). Includes dismiss button (if `is_dismissible`), optional CTA button (`cta_label` / `cta_url`). |
| D2.2 | Integrate into Dashboard | In `client/src/pages/dashboard/Dashboard.tsx`, call `announcementsApi.getActive()` on mount. Render `<AnnouncementBanner>` above the health score hero section. |
| D2.3 | Handle dismiss | On dismiss click, call `announcementsApi.dismiss(id)`, remove from local state. Dismissal persists server-side in `announcement_dismissals` table. |

**Key files:**
- New: `client/src/components/ui/AnnouncementBanner.tsx`
- Modified: `client/src/pages/dashboard/Dashboard.tsx`
- Already built: `announcementsApi` in `client/src/services/api.ts`, routes in `server/src/routes/index.ts`

**Gotchas:**
- The API already filters by user tier (`target_tiers` array) and excludes previously dismissed announcements — no client filtering needed
- Announcements have `type` field for colour mapping: `info | success | warning | maintenance`
- `cta_label` and `cta_url` are optional — only show CTA button when both are present
- User dashboard uses light theme (`bg-white dark:bg-slate-900`) unlike admin dark theme — style accordingly

---

### D3: Custom Advice Override in Finding Display (from Phase 5.9)

**Goal:** When a finding is displayed (in the UI or PDF export), check `audit_advice_templates` for a custom override (`is_custom = true`) and use that text instead of the engine default.

**Approach:** Override at the API layer so both frontend and PDF get the custom text automatically.

| # | Task | Detail |
|---|---|---|
| D3.1 | Add advice lookup to findings query | In `server/src/routes/audits/index.ts` (the `GET /audits/:id/findings` endpoint), LEFT JOIN `audit_advice_templates` on `rule_id` where `is_custom = true`. Use `COALESCE(aat.description, af.description)` and `COALESCE(aat.recommendation, af.recommendation)` to prefer custom text. |
| D3.2 | Add advice lookup to PDF findings | In `server/src/services/pdf-report.service.ts`, the findings are fetched separately for PDF generation. Apply the same LEFT JOIN logic when querying findings for PDF output. |
| D3.3 | Add advice lookup to page detail findings | The `GET /audits/:id/pages/:pageId` endpoint also returns findings — apply the same JOIN there. |
| D3.4 | Verify in UI and PDF | Create a custom advice entry via admin, then view an audit that has that rule — confirm the custom text appears in both the web UI and exported PDF. |

**Key files:**
- Modified: `server/src/routes/audits/index.ts` (findings queries)
- Modified: `server/src/services/pdf-report.service.ts` (PDF findings rendering)
- Reference: `server/src/services/cms.service.ts` (`getAdviceByRuleId()` — available but the JOIN approach is more efficient than per-rule lookups)

**Gotchas:**
- Use LEFT JOIN, not INNER JOIN — most findings won't have custom advice
- Only override when `is_custom = true` — seeded defaults (`is_custom = false`) should NOT override engine text (they're the same text anyway)
- The `help_url` / `learn_more_url` field can also be overridden from the advice template
- No frontend component changes needed — the API response already has `description` and `recommendation` fields, they'll just contain custom text when available
- Consider caching: if the advice table is small, a single query at the start of the findings fetch to load all custom rules into a Map is faster than a JOIN on every finding row

---

### D4: Enhanced System Health Metrics (from Phase 7.5)

**Goal:** Add email queue size, blog storage usage, and template compilation status to the admin dashboard health section.

**Approach:** Add a new `getExtendedHealth()` function to `admin.service.ts` and expose it alongside the existing `getSystemHealth()` response.

| # | Task | Detail |
|---|---|---|
| D4.1 | Add `getExtendedHealth()` to service | In `server/src/services/admin.service.ts`, add a function that queries: **(a)** `SELECT COUNT(*) FROM email_sends WHERE status = 'queued'` for email queue size, **(b)** `SELECT COALESCE(SUM(file_size_bytes), 0) FROM blog_media` for blog storage, **(c)** `SELECT COUNT(*) as total, COUNT(compiled_html) as compiled FROM email_templates WHERE is_active = true` for template compilation. |
| D4.2 | Extend dashboard API response | In `server/src/routes/admin/index.ts` (`GET /api/admin/dashboard`), call `getExtendedHealth()` alongside existing `getSystemHealth()` and include in response. |
| D4.3 | Update `SystemHealth` type | Add new fields to `SystemHealth` in `client/src/types/admin.types.ts`: `emailQueueSize`, `blogStorageBytes`, `templatesCompiled`, `templatesTotal`. |
| D4.4 | Update dashboard UI | In `AdminDashboard.tsx`, add 3 new cards to the system health grid: email queue (amber if > 0), blog storage (formatted as MB/GB), template compilation (green if all compiled, amber if pending). |

**Key files:**
- Modified: `server/src/services/admin.service.ts` (new query function)
- Modified: `server/src/routes/admin/index.ts` (dashboard endpoint)
- Modified: `client/src/types/admin.types.ts` (SystemHealth type)
- Modified: `client/src/pages/admin/AdminDashboard.tsx` (health grid)

**Gotchas:**
- `email_sends` may not exist if no emails have been sent — use `COALESCE` / handle missing table gracefully
- Blog storage should include all variants (original + thumbnail + webp) — the `blog_media` table stores only the original `file_size_bytes`, but thumbnails/webp are separate files on disk. For now, query the DB column; true disk usage is a future enhancement
- Template compilation is synchronous in the current system (compiled on save) — so `compiled_html IS NULL` typically means a template was never saved/compiled, not that it's "in queue"
- Make the extended health call non-blocking (similar to how module summaries load in Phase 7) so it doesn't slow down the main dashboard load

---

### Implementation Priority

| Priority | Item | Effort | Impact |
|---|---|---|---|
| 1 | **D2** — Announcement banners | Small (1-2 hours) | High — immediately useful for communicating to users |
| 2 | **D4** — Enhanced health metrics | Small (2-3 hours) | Medium — better ops visibility |
| 3 | **D1** — Seed advice templates | Medium (3-4 hours) | Medium — makes the Advice page useful out of the box |
| 4 | **D3** — Custom advice override | Medium (3-4 hours) | Medium — depends on D1 having data to override; the real value comes when admins customise rules |

**Total estimated effort:** ~10-12 hours for all four items.

D2 and D4 are independent and can be done in parallel. D3 benefits from D1 being done first (so there's advice data to override with), but is not strictly dependent.

---

## 16. Reference Documents

| Document | Covers |
|---|---|
| `ADMIN_CRM.md` | Lead scoring rules, trigger definitions, outreach templates, membership view |
| `ADMIN_CMS.md` | Block types, blog schema, media pipeline, editor UI, public blog, SEO, export |
| `ADMIN_EMAIL_TEMPLATES.md` | Email blocks, MJML compilation, campaigns, preferences, webhooks, branding |
| `BRAND_GUIDELINES.md` | Colors, typography, spacing, component patterns — used by all modules |
| `TIERS.md` | Tier limits, feature flags, pricing — used by CRM targeting and email branding |
