# Kritano Admin Command Center

## 1. Vision

A single admin interface that answers three questions every day:

1. **Who should I talk to?** (CRM — lead scoring, churn alerts, outreach triggers)
2. **What should I publish?** (CMS — audit advice templates, announcements, success stories)
3. **How is the business doing?** (Analytics — funnel, MRR, global audit trends)

The admin panel already exists at `/api/admin/*` behind `requireSuperAdmin` middleware with full activity logging. This spec extends it from an ops tool into a growth engine.

---

## 2. What Already Exists

Before building anything new, inventory what's already working:

| Capability | Status | Where |
|---|---|---|
| Dashboard stats (users, orgs, audits, tier counts) | Done | `GET /api/admin/dashboard` |
| User list with search/sort/pagination | Done | `GET /api/admin/users` |
| Org list with tier filtering | Done | `GET /api/admin/organizations` |
| Tier management (change org tier) | Done | `PATCH /api/admin/organizations/:orgId/subscription` |
| Admin activity audit log | Done | `GET /api/admin/activity` + `admin_activity_log` table |
| Bug report management | Done | `GET/PATCH/DELETE /api/admin/bug-reports/*` |
| System health (DB, queue, active audits) | Done | Returned with dashboard |
| Historical analytics (daily users, audits, pages) | Done | `GET /api/admin/analytics?days=30` |
| Email service (Resend — verification, password reset, audit complete) | Done | `email.service.ts` |
| Domain verification (DNS + file) | Done | `domain-verification.service.ts` |
| Stripe fields in subscriptions table | Schema only | `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id` |
| Organization audit log (user actions) | Done | `organization_audit_log` table |

**Key takeaway:** The read-only admin panel is solid. What's missing is the _intelligence layer_ — lead scoring, automated triggers, outreach, and the CMS.

---

## 3. Module A: Smart CRM

### 3.1 Lead Scoring

Each user gets a `lead_score` (integer) and a `lead_status` enum that updates automatically based on behavior. No manual data entry.

#### Database

```sql
-- Migration: add_lead_scoring.sql
ALTER TABLE users
  ADD COLUMN lead_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN lead_status VARCHAR(20) NOT NULL DEFAULT 'new'
    CHECK (lead_status IN ('new', 'activated', 'engaged', 'power_user', 'upgrade_prospect', 'churning', 'churned')),
  ADD COLUMN lead_score_updated_at TIMESTAMPTZ;

CREATE INDEX idx_users_lead_score ON users (lead_score DESC);
CREATE INDEX idx_users_lead_status ON users (lead_status);
```

#### Scoring Rules

Scores are recalculated on relevant events (not on a cron). Each rule is idempotent — it checks current state, not event count.

| Signal | Points | Detection | Source Table |
|---|---|---|---|
| Account created | +5 | On registration | `users` |
| Email verified | +10 | `email_verified = true` | `users` |
| First audit completed | +15 | `COUNT(audit_jobs) >= 1 WHERE status = 'completed'` | `audit_jobs` |
| Domain verified | +30 | `verified = true` on any `organization_domains` row | `organization_domains` |
| 3+ completed audits | +20 | Audit count check | `audit_jobs` |
| 3+ URLs on a single site (agency signal) | +25 | `COUNT(DISTINCT target_url) >= 3` per site | `audit_jobs` |
| 10+ completed audits | +30 | Audit count check | `audit_jobs` |
| Hit site limit for tier | +40 | `sites.count >= tier_limits.max_domains` | `sites` + `tier_limits` |
| Hit audit limit for month | +35 | `usage_records.audits_count >= tier_limits.max_audits_per_month` | `usage_records` |
| Added team member | +15 | `organization_members.count > 1` | `organization_members` |
| Exported PDF | +10 | Track in `usage_records` or new event | `usage_records` |
| 7 days inactive | -10 | `last_login_at < NOW() - INTERVAL '7 days'` | `users` |
| 14 days inactive | -20 | Same check, 14 days | `users` |
| 30 days inactive | -30 | Same check, 30 days | `users` |

#### Status Derivation

Status is derived from score + behavior, not set manually:

```
churned:           last_login_at > 60 days ago
churning:          last_login_at > 14 days ago AND lead_score was previously > 30
new:               lead_score < 15
activated:         lead_score 15–39 (verified, ran first audit)
engaged:           lead_score 40–69
power_user:        lead_score 70+ AND tier != 'free'
upgrade_prospect:  lead_score 50+ AND tier = 'free' (or hit any tier limit)
```

#### Implementation

Create `server/src/services/lead-scoring.service.ts`:

- `recalculateScore(userId)` — full recalc from source tables (idempotent)
- `batchRecalculate()` — nightly job for decay and status updates
- `getLeadBoard(filters)` — paginated list for the admin CRM view

Call `recalculateScore()` from:
- `auth.routes` after registration and email verification
- `audit-worker.service.ts` after audit completion
- `domain-verification.service.ts` after successful verification
- `organization.service.ts` after member invite accepted

#### Admin API

```
GET  /api/admin/crm/leads?status=upgrade_prospect&sort=lead_score&order=desc&page=1&limit=50
GET  /api/admin/crm/leads/:userId          — full lead profile with timeline
POST /api/admin/crm/leads/:userId/recalc   — force recalculate
GET  /api/admin/crm/stats                  — lead funnel counts by status
```

### 3.2 Automated Triggers

Triggers fire when a user enters a specific state. Each trigger creates a row in a new `crm_triggers` table and optionally sends an email.

#### Database

```sql
CREATE TABLE crm_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  trigger_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'dismissed', 'actioned')),
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actioned_at TIMESTAMPTZ,
  actioned_by UUID REFERENCES users(id)
);

CREATE INDEX idx_crm_triggers_status ON crm_triggers (status, created_at DESC);
CREATE INDEX idx_crm_triggers_user ON crm_triggers (user_id, created_at DESC);
```

#### Trigger Definitions

| Trigger Type | Fires When | Default Action | Context Data |
|---|---|---|---|
| `stalled_verification` | Site created 48h+ ago, domain not verified | Email: "How to verify your domain" | `{ siteId, domain }` |
| `security_alert` | Audit finds `google-dorking` critical issue (e.g. `wp-admin` exposed) | Email: "Security issue detected" | `{ auditId, ruleId, domain }` |
| `upgrade_nudge` | User hits site/audit/page limit | Dashboard banner + email | `{ limitType, currentUsage, tierLimit }` |
| `low_aeo_score` | AEO score < 40 on any page | Email: "Improve your AI citability" | `{ auditId, pageUrl, aeoScore }` |
| `low_content_score` | Content score < 40 on any page | Email: "Content quality guide" | `{ auditId, pageUrl, contentScore }` |
| `churn_risk` | Status transitions to `churning` | Admin alert (no auto-email) | `{ lastLoginAt, previousScore }` |
| `score_improvement` | Any category score improves 20+ points between audits | Email: congratulations | `{ auditId, category, oldScore, newScore }` |
| `first_audit_complete` | First ever completed audit | Email: "Here's what to do next" | `{ auditId, topIssueCategory }` |

#### Implementation

Create `server/src/services/crm-trigger.service.ts`:

- `checkTriggers(userId, event, context)` — evaluates all trigger rules for the event
- `fireTrigger(userId, triggerType, context)` — creates row, optionally sends email
- `getPendingTriggers(filters)` — admin view of pending triggers
- `actionTrigger(triggerId, adminId, action)` — mark as sent/dismissed

Triggers are deduplicated: same `(user_id, trigger_type)` won't fire again within 30 days unless the previous was dismissed.

#### Admin API

```
GET   /api/admin/crm/triggers?status=pending&type=churn_risk&page=1&limit=50
PATCH /api/admin/crm/triggers/:id   — { status: 'sent' | 'dismissed' }
GET   /api/admin/crm/triggers/stats — counts by type and status
```

### 3.3 One-Click Outreach

Pre-defined email templates that admins can send directly from the CRM lead profile.

#### Database

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  body_html TEXT NOT NULL,
  category VARCHAR(30) NOT NULL
    CHECK (category IN ('onboarding', 'engagement', 'upgrade', 'security', 'win_back', 'educational')),
  variables JSONB DEFAULT '[]',   -- e.g. ["firstName", "domain", "aeoScore"]
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES email_templates(id),
  user_id UUID NOT NULL REFERENCES users(id),
  sent_by UUID NOT NULL REFERENCES users(id),  -- admin who triggered
  variables JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  resend_message_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Default Templates

| Slug | Category | Subject | Variables |
|---|---|---|---|
| `welcome_first_audit` | onboarding | "Your first audit results are in" | `firstName`, `domain`, `topIssueCount` |
| `verify_domain_howto` | onboarding | "Verify {{domain}} in 2 minutes" | `firstName`, `domain` |
| `security_alert_dorking` | security | "Security issue found on {{domain}}" | `firstName`, `domain`, `issueCount` |
| `upgrade_hitting_limits` | upgrade | "You're growing fast, {{firstName}}" | `firstName`, `currentTier`, `limitHit` |
| `aeo_improvement_guide` | educational | "Boost your AI Engine score" | `firstName`, `domain`, `aeoScore` |
| `win_back_inactive` | win_back | "We miss you, {{firstName}}" | `firstName`, `lastAuditDate`, `domain` |
| `score_celebration` | engagement | "{{domain}} just hit {{score}}!" | `firstName`, `domain`, `category`, `score` |

#### Admin API

```
GET  /api/admin/crm/templates                     — list all templates
GET  /api/admin/crm/templates/:id                  — get template with preview
POST /api/admin/crm/templates                      — create template
PUT  /api/admin/crm/templates/:id                  — update template
POST /api/admin/crm/outreach/:userId               — send template to user
     Body: { templateSlug, variables: {} }
GET  /api/admin/crm/outreach?userId=...&page=1     — send history
```

Sends use the existing Resend integration in `email.service.ts`. Add a `sendTemplateEmail(to, template, variables)` method.

### 3.4 Membership Overview

Surface the many-to-many relationships between users, organizations, and sites. This already exists in the data — just needs an admin-friendly view.

#### Admin API

```
GET /api/admin/crm/leads/:userId/memberships
```

Returns:
```json
{
  "organizations": [
    {
      "id": "...",
      "name": "Acme Corp",
      "role": "owner",
      "tier": "pro",
      "sites": [
        { "id": "...", "domain": "acme.com", "verified": true, "lastAuditAt": "..." }
      ]
    }
  ]
}
```

No new tables — this is a JOIN across `organization_members`, `organizations`, `subscriptions`, and `sites`.

---

## 4. Module B: CMS

### 4.1 Audit Advice Templates

Allow editing the "Actionable Advice" text that appears in audit findings without deploying code.

#### Database

```sql
CREATE TABLE audit_advice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id VARCHAR(100) UNIQUE NOT NULL,    -- matches audit_findings.rule_id
  rule_name VARCHAR(200) NOT NULL,
  category VARCHAR(30) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,               -- what the issue means
  recommendation TEXT NOT NULL,            -- how to fix it
  learn_more_url VARCHAR(500),
  is_custom BOOLEAN NOT NULL DEFAULT false, -- true = admin edited
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);
```

#### Seeding

On first deploy, seed from the existing hardcoded advice in the audit engines (`seo.engine.ts`, `content.engine.ts`, etc.). Each engine's finding already has `ruleName`, `message`, and `recommendation` — extract these into rows.

#### How It Works

1. Audit engines continue to generate findings with their built-in text
2. When rendering findings (PDF export, frontend), check `audit_advice_templates` for a matching `rule_id`
3. If a custom row exists (`is_custom = true`), use its text instead of the engine default
4. This means zero disruption — engines still work standalone

#### Admin API

```
GET    /api/admin/cms/advice?category=seo&search=...&page=1&limit=50
GET    /api/admin/cms/advice/:ruleId
PUT    /api/admin/cms/advice/:ruleId   — create or update custom advice
DELETE /api/admin/cms/advice/:ruleId   — revert to engine default (delete custom row)
```

### 4.2 Announcements / Banners

Push dashboard banners for feature launches, maintenance windows, or marketing messages.

#### Database

```sql
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'info'
    CHECK (type IN ('info', 'success', 'warning', 'maintenance')),
  target_tiers VARCHAR(20)[] DEFAULT NULL, -- NULL = all tiers, or ['free', 'starter']
  cta_label VARCHAR(50),                   -- optional button text
  cta_url VARCHAR(500),                    -- optional button link
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,                     -- NULL = indefinite
  is_dismissible BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE announcement_dismissals (
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (announcement_id, user_id)
);
```

#### User-facing API

```
GET /api/announcements/active   — returns non-dismissed, active, within date range, matching user's tier
POST /api/announcements/:id/dismiss
```

#### Admin API

```
GET    /api/admin/cms/announcements?active=true&page=1
POST   /api/admin/cms/announcements
PUT    /api/admin/cms/announcements/:id
DELETE /api/admin/cms/announcements/:id
```

### 4.3 Success Story Publisher

Promote impressive audit improvements to a public-facing widget (homepage or marketing page).

#### Database

```sql
CREATE TABLE success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id),
  domain VARCHAR(255) NOT NULL,           -- denormalized for display
  category VARCHAR(30) NOT NULL,          -- 'seo', 'accessibility', etc.
  score_before INTEGER NOT NULL,
  score_after INTEGER NOT NULL,
  headline VARCHAR(200) NOT NULL,         -- "SEO: 34 → 91 in 2 weeks"
  is_published BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### How It Works

1. Admin sees a big score improvement in the CRM lead profile or analytics
2. Admin clicks "Promote to success story" → pre-fills from audit data
3. Admin edits headline, sets `is_published = true`
4. Public API serves published stories for the marketing site

#### APIs

```
-- Public (no auth)
GET /api/public/success-stories?limit=6

-- Admin
GET    /api/admin/cms/success-stories
POST   /api/admin/cms/success-stories
PUT    /api/admin/cms/success-stories/:id
DELETE /api/admin/cms/success-stories/:id
```

---

## 5. Module C: Founder Analytics

### 5.1 The Funnel

Track conversion through the core journey. All data already exists — this is pure query work.

| Stage | Source | Query |
|---|---|---|
| Visitor | External (GA4 / Plausible) | Not in DB — integrate via API or manual |
| Registered | `users` table | `COUNT(*) WHERE created_at >= $range` |
| Verified Email | `users` | `COUNT(*) WHERE email_verified = true` |
| First Audit | `audit_jobs` | `COUNT(DISTINCT user_id) WHERE status = 'completed'` |
| Domain Verified | `organization_domains` | `COUNT(DISTINCT org.owner_id) WHERE verified = true` |
| Paid Subscriber | `subscriptions` | `COUNT(*) WHERE tier != 'free' AND status = 'active'` |

#### Admin API

```
GET /api/admin/analytics/funnel?range=30d
```

Returns:
```json
{
  "range": "30d",
  "stages": [
    { "name": "Registered", "count": 1247, "conversionFromPrevious": null },
    { "name": "Verified Email", "count": 892, "conversionFromPrevious": 71.5 },
    { "name": "First Audit", "count": 634, "conversionFromPrevious": 71.1 },
    { "name": "Domain Verified", "count": 198, "conversionFromPrevious": 31.2 },
    { "name": "Paid Subscriber", "count": 47, "conversionFromPrevious": 23.7 }
  ]
}
```

### 5.2 Global Audit Trends

What issues are most common across all users? Useful for marketing content ("87% of sites we scan have broken Schema").

#### Admin API

```
GET /api/admin/analytics/global-trends?range=30d
```

Returns:
```json
{
  "range": "30d",
  "totalAuditsCompleted": 4821,
  "totalPagesScanned": 87432,
  "topIssues": [
    { "ruleId": "missing-meta-description", "ruleName": "Missing Meta Description", "category": "seo", "severity": "moderate", "affectedAudits": 3891, "percentage": 80.7 },
    { "ruleId": "missing-alt-text", "ruleName": "Images Missing Alt Text", "category": "accessibility", "severity": "serious", "affectedAudits": 3204, "percentage": 66.5 }
  ],
  "scoreDistribution": {
    "seo": { "avg": 62, "median": 65, "p10": 31, "p90": 89 },
    "accessibility": { "avg": 54, "median": 56, "p10": 22, "p90": 84 }
  },
  "tierBreakdown": {
    "free": { "audits": 2341, "avgScore": 58 },
    "starter": { "audits": 1200, "avgScore": 64 },
    "pro": { "audits": 980, "avgScore": 71 },
    "agency": { "audits": 250, "avgScore": 74 },
    "enterprise": { "audits": 50, "avgScore": 78 }
  }
}
```

Queries: aggregate over `audit_findings` and `audit_jobs` grouped by `rule_id` and `tier`.

### 5.3 Revenue Analytics

#### Phase 1: Manual (Now)

Admin can already change tiers via `PATCH /api/admin/organizations/:orgId/subscription`. Add a revenue summary endpoint that calculates MRR from tier counts and known pricing:

```
GET /api/admin/analytics/revenue
```

Returns:
```json
{
  "mrr": 4750,
  "arr": 57000,
  "byTier": {
    "free": { "count": 892, "mrr": 0 },
    "starter": { "count": 124, "mrr": 1240 },
    "pro": { "count": 67, "mrr": 2010 },
    "agency": { "count": 12, "mrr": 1200 },
    "enterprise": { "count": 3, "mrr": 300 }
  },
  "churnThisMonth": { "count": 8, "mrrLost": 320 },
  "newThisMonth": { "count": 15, "mrrGained": 580 }
}
```

Pricing is config-driven (environment variable or `tier_pricing` table), not hardcoded.

#### Phase 2: Stripe Integration (Future)

When Stripe webhooks are implemented:
- `stripe_customer_id`, `stripe_subscription_id` fields already exist in `subscriptions` table
- Add webhook handler for `customer.subscription.created/updated/deleted`
- Replace manual MRR calculation with real Stripe data
- Add payment history per organization

---

## 6. Admin Frontend

### 6.1 Approach

Build directly in the existing React app under `/admin/*` routes, guarded by the same `is_super_admin` check. No third-party admin framework — the codebase already has the component library (Tailwind, `Button`, `DashboardLayout`, etc.).

### 6.2 Page Structure

```
/admin
  /admin/dashboard          — Stats, system health, quick actions
  /admin/crm
    /admin/crm/leads        — Lead board (filterable by status, sortable by score)
    /admin/crm/leads/:id    — Lead profile (scores, memberships, audit history, triggers, outreach log)
    /admin/crm/triggers     — Pending trigger queue
    /admin/crm/templates    — Email template editor
  /admin/cms
    /admin/cms/advice       — Audit advice template editor
    /admin/cms/announcements — Banner manager
    /admin/cms/stories      — Success story publisher
  /admin/analytics
    /admin/analytics/funnel     — Conversion funnel
    /admin/analytics/trends     — Global audit trends
    /admin/analytics/revenue    — MRR/ARR dashboard
  /admin/users              — (existing) User management
  /admin/organizations      — (existing) Org management
  /admin/bugs               — (existing) Bug reports
  /admin/activity           — (existing) Admin audit log
```

### 6.3 Lead Profile Page (Key Screen)

The most important screen in the CRM. For a given user, show:

| Section | Data Source |
|---|---|
| **Header:** Name, email, lead score badge, status pill, tier | `users` + `subscriptions` |
| **Timeline:** Registration → verification → first audit → domain verified → upgrades | Multiple tables, ordered by timestamp |
| **Organizations & Sites:** Expandable tree showing orgs → sites → last audit date | JOINs across org/site tables |
| **Audit Summary:** Total audits, avg scores by category, trend | `audit_jobs` aggregated |
| **Active Triggers:** Pending triggers with action buttons | `crm_triggers` |
| **Outreach History:** Emails sent, with timestamps and template used | `email_sends` |
| **Quick Actions:** Send email (template picker), change tier, verify domain manually | Action buttons → API calls |

---

## 7. Security & Privacy

| Requirement | Implementation |
|---|---|
| Every admin data view is logged | Already done — `admin_activity_log` table + `logAdminActivity()` |
| RBAC for future team members | `is_super_admin` on users table. Extend to `admin_role` enum (`super_admin`, `support`, `marketing`) when needed |
| Support role sees CRM leads but not revenue | `admin_role` check on revenue endpoints |
| Marketing role can edit CMS but not change tiers | `admin_role` check on org subscription endpoints |
| Email sends are logged with admin identity | `email_sends.sent_by` tracks which admin sent what |
| No user passwords or tokens visible in admin | Admin service never selects `password_hash` or token columns |
| Rate limit admin outreach | Max 50 emails per admin per day, enforced in `email_sends` |

---

## 8. Implementation Order

### Phase 1: CRM Foundation (Week 1-2)

1. **Migration:** Add `lead_score` + `lead_status` to `users` table
2. **Service:** `lead-scoring.service.ts` — scoring rules + recalculation
3. **Hooks:** Wire `recalculateScore()` into auth, audit worker, verification, org service
4. **API:** `/api/admin/crm/leads` + `/api/admin/crm/stats`
5. **Frontend:** Lead board page + lead profile page
6. **Backfill:** Run `batchRecalculate()` once for all existing users

### Phase 2: Triggers & Outreach (Week 3-4)

7. **Migration:** `crm_triggers` + `email_templates` + `email_sends` tables
8. **Service:** `crm-trigger.service.ts` — trigger evaluation + firing
9. **Service:** Extend `email.service.ts` with `sendTemplateEmail()`
10. **Seed:** Insert default email templates
11. **API:** Trigger queue + outreach endpoints
12. **Frontend:** Trigger queue page, template editor, send modal on lead profile

### Phase 3: CMS (Week 5-6)

13. **Migration:** `audit_advice_templates` + `announcements` + `success_stories` tables
14. **Seed:** Extract existing audit engine advice text into `audit_advice_templates`
15. **Service + API:** Advice editor, announcement manager, success story publisher
16. **Integration:** Frontend checks `audit_advice_templates` when rendering findings
17. **Integration:** Dashboard checks `announcements/active` on load
18. **Frontend:** CMS admin pages

### Phase 4: Founder Analytics (Week 7-8)

19. **Service:** Funnel calculation queries
20. **Service:** Global audit trend aggregation
21. **Service:** Revenue calculation from tier counts + pricing config
22. **API:** `/api/admin/analytics/funnel`, `global-trends`, `revenue`
23. **Frontend:** Funnel visualization, trend charts, MRR dashboard

### Phase 5: Stripe (When Ready)

24. Webhook handler for Stripe subscription events
25. Replace manual MRR with real Stripe data
26. Add checkout flow for tier upgrades
27. Payment history per organization

---

## 9. New Database Tables Summary

| Table | Purpose | Foreign Keys |
|---|---|---|
| `email_templates` | Outreach email templates | — |
| `email_sends` | Log of every outreach email | `→ users`, `→ email_templates` |
| `crm_triggers` | Automated behavior triggers | `→ users` |
| `audit_advice_templates` | Editable audit finding text | — |
| `announcements` | Dashboard banners | `→ users` (created_by) |
| `announcement_dismissals` | Track who dismissed what | `→ announcements`, `→ users` |
| `success_stories` | Public-facing win showcase | `→ sites`, `→ users` (created_by) |

Columns added to existing tables:
- `users`: `lead_score`, `lead_status`, `lead_score_updated_at`

---

## 10. New Service Files Summary

| File | Responsibility |
|---|---|
| `server/src/services/lead-scoring.service.ts` | Score calculation, status derivation, batch recalc |
| `server/src/services/crm-trigger.service.ts` | Trigger evaluation, firing, deduplication |
| `server/src/services/cms.service.ts` | Advice templates, announcements, success stories |
| `server/src/services/admin-analytics.service.ts` | Funnel, global trends, revenue calculations |

Extended:
| File | Addition |
|---|---|
| `server/src/services/email.service.ts` | `sendTemplateEmail()` method |
| `server/src/services/admin.service.ts` | Lead board queries |
| `server/src/routes/admin/index.ts` | New CRM/CMS/Analytics route groups |
