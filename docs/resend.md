# Resend Email Setup Plan

## Overview

Kritano uses a **dual-transport email system**: Mailpit (SMTP) for local development and Resend for production. This plan documents the full setup, configuration, and operational details for both environments.

**Current Status**: The core Resend integration is already implemented across 6 services, 11 database migrations, webhook handling, and a full admin API. This plan covers configuration, deployment steps, and remaining improvements.

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Local transport | Mailpit (SMTP) | Zero config, visual UI at `localhost:8025`, no API key needed |
| Production transport | Resend API | Reliable deliverability, webhook events, simple API |
| Template engine | MJML + Handlebars | Responsive emails that render correctly across clients |
| Webhook verification | Svix HMAC-SHA256 | Resend's built-in signing mechanism |
| Fallback | Console logging | When neither SMTP nor Resend is configured |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Email Service                       │
│  email.service.ts — Transport Selection              │
│                                                      │
│  SMTP_HOST set? ──yes──► Nodemailer (Mailpit/SMTP)  │
│       │                                              │
│      no                                              │
│       │                                              │
│  RESEND_API_KEY set? ──yes──► Resend SDK            │
│       │                                              │
│      no                                              │
│       │                                              │
│  Console Logger (dev fallback)                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              Template Pipeline                       │
│                                                      │
│  JSON Blocks → MJML → HTML (cached) → Handlebars   │
│                                                      │
│  Block types: header, hero_image, text, button,     │
│  two_column, divider, spacer, score_table,          │
│  issues_summary, footer                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              Webhook Flow (Production)               │
│                                                      │
│  Resend ──► POST /api/webhooks/resend               │
│              │                                       │
│              ├── Verify Svix signature               │
│              ├── Deduplicate via resend_event_id     │
│              ├── Update email_sends status           │
│              └── Increment campaign stats            │
└─────────────────────────────────────────────────────┘
```

---

## Local Development Setup

### 1. Docker Services (already configured)

Mailpit runs as part of `docker-compose.yml`:

```yaml
mailpit:
  image: axllent/mailpit:latest
  container_name: kritano-mailpit
  restart: unless-stopped
  ports:
    - "8025:8025"  # Web UI
    - "1025:1025"  # SMTP
  environment:
    MP_SMTP_AUTH_ACCEPT_ANY: 1
    MP_SMTP_AUTH_ALLOW_INSECURE: 1
```

### 2. Environment Variables (server/.env)

```env
# SMTP — routes all emails to Mailpit
SMTP_HOST=localhost
SMTP_PORT=1025

# Resend — leave empty for local (SMTP takes priority anyway)
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=

# Sender and app URL
EMAIL_FROM=Kritano <noreply@kritano.com>
APP_URL=http://localhost:3000
```

### 3. Usage

1. Run `docker compose up` — starts Mailpit alongside Postgres and Redis
2. All emails sent by the app land in Mailpit at **http://localhost:8025**
3. No Resend API key needed — SMTP transport takes priority when `SMTP_HOST` is set

### 4. Testing Webhooks Locally (Optional)

To test Resend webhooks locally (e.g. delivery/open/click events):

1. Install the Resend CLI or use a tunnel: `npx localtunnel --port 3001`
2. In Resend dashboard, add the tunnel URL as a webhook endpoint: `https://<tunnel>.loca.lt/api/webhooks/resend`
3. Set `RESEND_WEBHOOK_SECRET` in `.env` from the Resend dashboard signing secret
4. Temporarily remove `SMTP_HOST` from `.env` so emails actually go through Resend

---

## Production Setup

### 1. Resend Account Configuration

#### a. Domain Verification
1. Sign up at [resend.com](https://resend.com)
2. Add your sending domain (e.g. `kritano.com`)
3. Add the required DNS records:
   - **SPF**: TXT record on your domain
   - **DKIM**: CNAME records (Resend provides these)
   - **DMARC**: TXT record (`_dmarc.kritano.com`)
4. Wait for verification (usually < 5 minutes)

#### b. API Key
1. Go to Resend dashboard → API Keys
2. Create a new key with **sending access** for your verified domain
3. Copy the key (starts with `re_`)

#### c. Webhook Setup
1. Go to Resend dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/resend`
3. Select events: `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`
4. Copy the **Signing Secret** (starts with `whsec_`)

### 2. Environment Variables (Production)

```env
# No SMTP in production — Resend handles everything
# SMTP_HOST= (leave unset or remove)
# SMTP_PORT= (leave unset or remove)

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Sender and app URL
EMAIL_FROM=Kritano <noreply@kritano.com>
APP_URL=https://app.kritano.com
```

### 3. Deployment Checklist

- [ ] Domain verified in Resend with SPF, DKIM, DMARC records
- [ ] `RESEND_API_KEY` set in production environment
- [ ] `RESEND_WEBHOOK_SECRET` set in production environment
- [ ] `SMTP_HOST` is **not set** in production (so Resend transport activates)
- [ ] `EMAIL_FROM` uses the verified domain
- [ ] `APP_URL` points to production URL (used in email links)
- [ ] Webhook endpoint registered in Resend dashboard
- [ ] All database migrations run (migrations 049-085 for email tables)

---

## Database Changes

All migrations are already created. Key tables:

| Table | Migration | Purpose |
|-------|-----------|---------|
| `email_verification_tokens` | 003 | Auth tokens (email verify, password reset) |
| `email_templates` | 049-054 | Block-based email templates with MJML |
| `email_sends` | 049, 051 | Per-recipient send log with status tracking |
| `email_preferences` | 050 | User notification preferences |
| `email_campaigns` | 055-056 | Bulk email campaigns with segments |
| `email_events` | 057 | Webhook event log with deduplication |

---

## Backend — Existing Services

| Service | File | Purpose |
|---------|------|---------|
| EmailService | `server/src/services/email.service.ts` | Core send function, transport selection, token management |
| EmailTemplateService | `server/src/services/email-template.service.ts` | Template CRUD, MJML compilation, variable substitution |
| EmailCampaignService | `server/src/services/email-campaign.service.ts` | Campaign lifecycle, segment resolution, stats |
| EmailPreferenceService | `server/src/services/email-preference.service.ts` | Opt-in/out, unsubscribe tokens (JWT), CAN-SPAM compliance |
| EmailBrandingService | `server/src/services/email-branding.service.ts` | Tier-aware branding (white-label at Agency+) |

### Transactional Emails Triggered Automatically

| Trigger | Template Slug | Category |
|---------|---------------|----------|
| User registration | `email_verification` | transactional |
| Password reset | `password_reset` | transactional |
| Audit completes | `audit_completed` | audit_notifications |
| Domain verified | `domain_verified` | transactional |
| Trial ending | `trial_ending` | transactional |
| Referral qualified | `referral_qualified` | transactional |
| Early access claim | `early_access_confirmed` | transactional |

### Webhook Handler

**File**: `server/src/routes/webhooks/resend.ts`

- Verifies Svix signatures using HMAC-SHA256
- Deduplicates events via `resend_event_id` unique constraint
- Updates `email_sends` status (never downgrades — `queued → sent → delivered → opened → clicked`)
- Increments campaign aggregate stats
- 5-minute timestamp tolerance for replay protection
- In dev without `RESEND_WEBHOOK_SECRET`, skips verification

---

## Frontend Changes

No frontend changes are required for the Resend setup itself. The existing admin email UI (`/admin/email`) already supports:

- Template management (CRUD, preview, test send)
- Campaign creation, scheduling, and launching
- Send history and analytics dashboards
- User notification preference settings at `/settings/notifications`

---

## Critical Files Summary

```
server/
├── .env.example                              # Email env vars documented
├── src/
│   ├── services/
│   │   ├── email.service.ts                  # Core: SMTP/Resend transport
│   │   ├── email-template.service.ts         # Templates: MJML blocks → HTML
│   │   ├── email-campaign.service.ts         # Campaigns: segment → send
│   │   ├── email-preference.service.ts       # Preferences: unsubscribe
│   │   └── email-branding.service.ts         # Branding: tier-aware
│   ├── routes/
│   │   ├── webhooks/resend.ts                # Webhook: Svix verify + events
│   │   ├── admin/email.ts                    # Admin API: templates/campaigns
│   │   ├── email/index.ts                    # Public: unsubscribe/preferences
│   │   └── auth/index.ts                     # Auth: verification/reset emails
│   ├── worker.ts                             # Campaign worker: queued → sent
│   ├── config/auth.config.ts                 # Token expiry settings
│   └── db/migrations/
│       ├── 003_email_verification_tokens.sql
│       ├── 049-057_email_*.sql               # Email infrastructure tables
│       └── 085_email_branding.sql            # White-label branding
docker-compose.yml                            # Mailpit service for local dev
```

---

## Testing Plan

### Local (Mailpit)

1. **Verify transport selection**: Start server with `SMTP_HOST=localhost` → logs should show `📧 SMTP transport configured → localhost:1025`
2. **Registration flow**: Register a new user → verification email appears in Mailpit UI at `localhost:8025`
3. **Password reset**: Trigger reset → email appears in Mailpit with valid reset link
4. **Audit completion**: Run an audit → completion email appears in Mailpit
5. **Template preview**: Admin panel → create template → preview renders correctly
6. **Test send**: Admin panel → send test email → arrives in Mailpit
7. **Campaign send**: Create campaign → launch → emails appear in Mailpit

### Production (Resend)

1. **Domain verification**: Confirm DNS records pass Resend checks
2. **API key test**: Send a test email via admin panel → delivered to real inbox
3. **Webhook events**: Trigger a send → check `email_events` table populates (sent, delivered)
4. **Open/click tracking**: Open email → `email_sends.opened_at` updates
5. **Bounce handling**: Send to invalid address → status updates to `bounced`
6. **Campaign flow**: Full campaign lifecycle → stats update correctly
7. **Unsubscribe**: Click unsubscribe link → preference updates, future sends respect it
8. **Signature verification**: Send forged webhook → returns 401

### Edge Cases

- Server starts with no email config → console fallback, no crash
- Resend API rate limit → graceful error, campaign worker retries
- Duplicate webhook event → deduplicated, returns `{ deduplicated: true }`
- Webhook with expired timestamp (>5min) → rejected

---

## Implementation Order

Since the core integration is already complete, remaining work is operational:

1. **Production DNS setup** — Add SPF, DKIM, DMARC records for sending domain
2. **Resend account config** — Create API key, register webhook endpoint
3. **Production env vars** — Set `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, unset `SMTP_HOST`
4. **Run migrations** — Ensure all email migrations (003, 049-057, 085) are applied
5. **Smoke test** — Send test email from admin panel, verify delivery and webhook events
6. **Monitor** — Check Resend dashboard for deliverability rates, bounce rates, complaints

---

## Resend Rate Limits & Pricing

| Plan | Emails/month | Rate limit | Price |
|------|-------------|------------|-------|
| Free | 3,000 | 1/sec | $0 |
| Pro | 50,000 | 10/sec | $20/mo |
| Enterprise | Custom | Custom | Custom |

The campaign worker respects `send_rate_per_second` (default 5) with a 200ms delay between sends. Adjust based on your Resend plan tier.
