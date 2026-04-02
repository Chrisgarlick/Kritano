# Cold Prospect Email Automation Plan

## Context

The cold prospect pipeline (`npm run prospects`) discovers newly registered domains, checks them for live websites, extracts contact emails, and stores qualified prospects in `cold_prospects`. The pipeline is fully working but stops at qualification — no automated outreach exists yet. The user wants automated email sending to qualified prospects.

**Key constraint**: `email_sends.user_id` is `NOT NULL` with FK to `users(id)`. Cold prospects are NOT users, so we cannot use `email_sends` directly. We need a separate tracking table.

## Approach: Separate Outreach System

Rather than modifying the existing `email_sends` table (which would break FK constraints and user preference checks), we build a parallel `cold_prospect_sends` table and a dedicated outreach service.

---

## Database Changes

### Migration `077_cold_prospect_outreach.sql`

**Table: `cold_prospect_sends`**
```sql
CREATE TABLE cold_prospect_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES cold_prospects(id),
  template_slug VARCHAR(100) NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  html TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','sent','delivered','opened','clicked','bounced','complained','failed')),
  resend_message_id VARCHAR(100),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cps_status ON cold_prospect_sends(status);
CREATE INDEX idx_cps_prospect ON cold_prospect_sends(prospect_id);
```

**Table: `cold_prospect_unsubscribes`**
```sql
CREATE TABLE cold_prospect_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  domain VARCHAR(255),
  unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Seed outreach templates** (insert into `email_templates` with category `'cold_outreach'`):
- `cold_outreach_initial` — First contact: introduces Kritano, offers free audit
- `cold_outreach_followup` — Follow-up 3 days later if no open/click

---

## Backend Changes

### 1. New Service: `server/src/services/cold-prospect/outreach.service.ts`

Core functions:
- **`queueOutreachBatch(limit: number)`** — Finds qualified prospects where `email_sent_at IS NULL`, not in unsubscribes table, creates `cold_prospect_sends` records, updates `cold_prospects.email_sent_at`
- **`processOutreachQueue(batchSize: number)`** — Claims queued sends (`FOR UPDATE SKIP LOCKED`), compiles template with prospect variables (domain, contact_name, quality_score), sends via Resend/SMTP (reuse transport from `email-template.service.ts`), updates send status
- **`checkBounces()`** — Marks prospects with bounced emails as `status = 'dead'`, adds to unsubscribes
- **`getOutreachStats()`** — Returns sent/delivered/opened/clicked/bounced counts

Template variables available:
- `{{contactName}}` or `"there"` fallback
- `{{domain}}` — their website
- `{{qualityScore}}` — their site score
- `{{auditUrl}}` — link to run free audit on Kritano
- `{{unsubscribeUrl}}` — one-click unsubscribe

### 2. Add 5th Polling Loop to Cold Prospect Worker

In `server/src/services/queue/cold-prospect-worker.service.ts`, add:
```
Outreach Loop | 10 minutes | Queues + sends outreach emails (respects daily_email_limit setting)
```

Only runs when `auto_outreach_enabled = true` in settings.

### 3. Unsubscribe Endpoint

In `server/src/routes/index.ts`, add:
```
GET /api/cold-unsubscribe?token=<jwt> — Decodes token, adds email to unsubscribes, returns confirmation page
```

No auth required (public endpoint). Token is a JWT containing `{ email, prospectId }`.

### 4. Admin API Additions

In `server/src/routes/admin/cold-prospects.ts`, add:
- `GET /api/admin/cold-prospects/outreach-stats` — Outreach funnel stats
- `GET /api/admin/cold-prospects/sends` — Paginated send history
- `POST /api/admin/cold-prospects/trigger-outreach` — Manual trigger (queue + send a batch)
- `POST /api/admin/cold-prospects/pause-outreach` — Toggle `auto_outreach_enabled`

---

## Frontend Changes

### Admin Cold Prospects Dashboard

Add to `client/src/pages/admin/cold-prospects/ColdProspectsDashboard.tsx`:
- **Outreach stats card** — Sent / Delivered / Opened / Clicked / Bounced counts
- **Toggle switch** — Enable/disable auto outreach (`auto_outreach_enabled` setting)
- **"Send Batch" button** — Manual trigger for testing
- **Sends tab/section** — Table of recent sends with status, prospect domain, email, timestamps

### API Client

Add to `client/src/services/api.ts` `coldProspectsApi`:
- `getOutreachStats()`
- `getSends(page, limit)`
- `triggerOutreach()`
- `toggleOutreach(enabled)`

---

## Critical Files

| File | Action |
|------|--------|
| `server/src/db/migrations/077_cold_prospect_outreach.sql` | **Create** — New tables + seed templates |
| `server/src/services/cold-prospect/outreach.service.ts` | **Create** — Core outreach logic |
| `server/src/services/queue/cold-prospect-worker.service.ts` | **Modify** — Add 5th outreach loop |
| `server/src/routes/admin/cold-prospects.ts` | **Modify** — Add outreach endpoints |
| `server/src/routes/index.ts` | **Modify** — Add unsubscribe route |
| `client/src/pages/admin/cold-prospects/ColdProspectsDashboard.tsx` | **Modify** — Add outreach UI |
| `client/src/services/api.ts` | **Modify** — Add outreach API methods |
| `server/src/services/email-template.service.ts` | **Reference** — Reuse SMTP/Resend transport logic |

## Reusable Existing Code

- **SMTP/Resend transport**: `email-template.service.ts` has `sendViaResend()` and `sendViaSmtp()` — extract or import these
- **MJML compilation**: `compileMjmlToHtml()` in same file — reuse for template compilation
- **`FOR UPDATE SKIP LOCKED` pattern**: Used in `campaign-worker.service.ts` for claiming sends — reuse same pattern
- **Rate limiting pattern**: Campaign worker's delay-based rate limiting — reuse for outreach
- **Admin activity logging**: `logAdminActivity()` from `admin.middleware.ts` — use for manual triggers

---

## Implementation Order

1. Migration `077` — tables + seed templates
2. Outreach service — queue, send, bounce check, stats
3. Unsubscribe endpoint
4. Worker loop integration
5. Admin API endpoints
6. Frontend outreach UI
7. End-to-end testing

## Verification

1. Run migration, verify tables created
2. Have qualified prospects in DB (from `npm run prospects`)
3. Enable auto outreach: `npm run prospects -- set auto_outreach_enabled true`
4. Start server — verify outreach loop logs show up
5. Check Mailpit (dev) for received cold outreach emails
6. Click unsubscribe link — verify email added to unsubscribes
7. Run again — verify unsubscribed email is skipped
8. Check admin dashboard shows outreach stats and send history
9. Test manual "Send Batch" button
10. Test toggle on/off
