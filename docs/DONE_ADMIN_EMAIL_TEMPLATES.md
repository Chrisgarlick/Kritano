# PagePulser Email Template System

## 1. Vision

A unified email template system that replaces the three hardcoded inline-HTML templates in `email.service.ts` with a database-driven, block-based editor. Admins can create, preview, brand, and send both transactional and campaign emails — all from the existing admin panel.

This spec **extends** the CRM spec (`ADMIN_CRM.md`), which already defines `email_templates` and `email_sends` tables. Here we deepen the template model, add a visual block editor, introduce campaign infrastructure, and add email preference management.

---

## 2. What Already Exists

| Capability | Status | Where |
|---|---|---|
| Email delivery via Resend API | Done | `server/src/services/email.service.ts` — singleton `emailService` |
| Verification email (inline HTML) | Done | `emailService.sendVerificationEmail()` |
| Password reset email (inline HTML) | Done | `emailService.sendPasswordResetEmail()` |
| Audit completion email (inline HTML) | Done | `emailService.sendAuditCompletedEmail()` |
| Dev mode fallback (console log when no API key) | Done | `emailService.sendEmail()` |
| `email_templates` table schema | Spec'd in CRM | `ADMIN_CRM.md` §3.3 |
| `email_sends` table schema | Spec'd in CRM | `ADMIN_CRM.md` §3.3 |
| PDF branding resolution chain (tier-aware) | Done | `server/src/services/pdf-branding.service.ts` |
| Brand guidelines for email | Defined | `BRAND_GUIDELINES.md` §Email Templates |
| Admin panel with super_admin middleware | Done | `server/src/routes/admin/index.ts` |
| PostgreSQL job queue (worker pattern) | Done | `server/src/services/queue/job-queue.service.ts` |
| Redis | Done | `server/src/db/redis.ts` — ioredis on port 6380 |
| User notification preferences (site-level) | Done | `sites.settings.notifications.emailOnComplete` |

**Key gaps:**
- No template engine — all HTML is inline string interpolation
- No visual editor — templates are code
- No campaign sending — only 1:1 transactional
- No email preferences / unsubscribe at user level
- No open/click tracking
- No email branding (PDF branding exists but isn't applied to emails)
- Organization invitation emails are missing entirely

---

## 3. Key Architecture Decisions

### 3.1 MJML for Email Rendering

Email client compatibility is a nightmare. Rather than hand-authoring inline CSS tables, we compile from **MJML** (the industry-standard email markup language) to HTML.

**Pipeline:** JSON blocks → MJML string → HTML string (via `mjml` npm) → variable substitution → Resend API

**Why MJML over raw HTML:**
- Automatic responsive stacking on mobile
- Handles Outlook table-layout quirks
- Deterministic output — same MJML always produces the same HTML
- Admin sees clean block structure, not `<table>` soup

**Why not `mjml-browser`:** Compile server-side only. The admin frontend shows a live preview by calling a server endpoint — no need to ship the MJML compiler to the browser.

### 3.2 Block-Based JSON Model (Same Pattern as CMS)

Templates are stored as a JSON array of typed blocks, identical in philosophy to the CMS blog post model. Each block maps to an MJML component.

### 3.3 Handlebars for Variables

Template text supports `{{variable}}` syntax. Variables are replaced server-side before sending. The MJML compiler runs first, then Handlebars substitution runs on the compiled HTML. This prevents MJML from mangling the `{{ }}` tokens.

### 3.4 Reuse PDF Branding Chain

Email branding follows the same resolution chain as PDF exports (`pdf-branding.service.ts`):
1. Check tier limits — free tier gets PagePulser branding only
2. Starter/Pro — site colors and company name, "Powered by PagePulser" footer
3. Agency+ — full white-label with org logo, custom colors, custom footer

### 3.5 Resend Webhooks for Tracking

Resend provides webhook events for `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`. We store these in an `email_events` table for tracking open rates and click-through without building our own tracking pixel system.

---

## 4. Database Schema

### 4.1 Expanded `email_templates` Table

The CRM spec defined a basic schema. This expands it with block content, compiled HTML caching, and template versioning.

```sql
-- Migration: create_email_templates.sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  subject VARCHAR(200) NOT NULL,           -- supports {{variables}}
  preview_text VARCHAR(200),               -- email client preview snippet
  blocks JSONB NOT NULL DEFAULT '[]',      -- array of typed blocks
  compiled_html TEXT,                       -- cached MJML→HTML output (no variables replaced)
  compiled_at TIMESTAMPTZ,
  category VARCHAR(30) NOT NULL
    CHECK (category IN (
      'transactional', 'onboarding', 'engagement',
      'upgrade', 'security', 'win_back', 'educational',
      'announcement', 'digest'
    )),
  variables JSONB NOT NULL DEFAULT '[]',   -- ["firstName", "domain", "score"] — for editor hints
  is_system BOOLEAN NOT NULL DEFAULT false, -- true = transactional (verification, reset, audit complete)
  is_active BOOLEAN NOT NULL DEFAULT true,
  branding_mode VARCHAR(20) NOT NULL DEFAULT 'platform'
    CHECK (branding_mode IN ('platform', 'site', 'org')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_templates_category ON email_templates (category);
CREATE INDEX idx_email_templates_slug ON email_templates (slug);
```

### 4.2 Email Sends (from CRM spec, unchanged)

```sql
CREATE TABLE email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES email_templates(id),
  campaign_id UUID REFERENCES email_campaigns(id),   -- NULL for 1:1 sends
  user_id UUID NOT NULL REFERENCES users(id),
  sent_by UUID REFERENCES users(id),                 -- admin who triggered (NULL for automated)
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(200) NOT NULL,                      -- resolved subject with variables
  variables JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
  resend_message_id VARCHAR(100),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_sends_user ON email_sends (user_id, created_at DESC);
CREATE INDEX idx_email_sends_campaign ON email_sends (campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_email_sends_status ON email_sends (status);
CREATE INDEX idx_email_sends_resend_id ON email_sends (resend_message_id) WHERE resend_message_id IS NOT NULL;
```

### 4.3 Email Campaigns

For sending templates to a segment of users (not just 1:1 from the CRM lead profile).

```sql
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES email_templates(id),
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  segment JSONB NOT NULL DEFAULT '{}',       -- targeting criteria (see §8)
  scheduled_at TIMESTAMPTZ,                  -- NULL = send immediately on launch
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  stats JSONB DEFAULT '{}',                  -- { total, sent, delivered, opened, clicked, bounced }
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.4 Email Preferences

User-level opt-out that supersedes all other settings. Respects CAN-SPAM / GDPR.

```sql
CREATE TABLE email_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  transactional BOOLEAN NOT NULL DEFAULT true,     -- verification, password reset (can't fully opt out)
  audit_notifications BOOLEAN NOT NULL DEFAULT true,
  product_updates BOOLEAN NOT NULL DEFAULT true,   -- feature launches, announcements
  educational BOOLEAN NOT NULL DEFAULT true,       -- tips, guides
  marketing BOOLEAN NOT NULL DEFAULT true,         -- campaigns, promotions
  unsubscribed_all BOOLEAN NOT NULL DEFAULT false, -- master kill switch (transactional still sends)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create preferences on user registration (trigger or application code)
```

### 4.5 Email Events (Webhook-Driven)

```sql
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_send_id UUID NOT NULL REFERENCES email_sends(id) ON DELETE CASCADE,
  event_type VARCHAR(30) NOT NULL
    CHECK (event_type IN ('delivered', 'opened', 'clicked', 'bounced', 'complained')),
  metadata JSONB DEFAULT '{}',    -- click URL, bounce reason, etc.
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_events_send ON email_events (email_send_id);
CREATE INDEX idx_email_events_type ON email_events (event_type, occurred_at DESC);
```

---

## 5. Block Types

Each template's `blocks` column stores a JSON array. Every block has a `type` discriminator and type-specific properties.

### 5.1 TypeScript Interfaces

```typescript
// server/src/types/email-template.types.ts

type EmailBlock =
  | HeaderBlock
  | HeroImageBlock
  | TextBlock
  | ButtonBlock
  | TwoColumnBlock
  | DividerBlock
  | SpacerBlock
  | ScoreTableBlock
  | IssuesSummaryBlock
  | FooterBlock;

interface HeaderBlock {
  type: 'header';
  logoUrl?: string;      // resolved from branding if null
  companyName?: string;   // resolved from branding if null
  backgroundColor?: string;
}

interface HeroImageBlock {
  type: 'hero_image';
  src: string;
  alt: string;
  href?: string;         // clickable link
  width?: number;        // defaults to 600
}

interface TextBlock {
  type: 'text';
  content: string;       // supports {{variables}} and basic HTML (<strong>, <em>, <a>, <br>)
  align?: 'left' | 'center' | 'right';
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  padding?: string;      // MJML padding format: "10px 25px"
}

interface ButtonBlock {
  type: 'button';
  label: string;
  href: string;          // supports {{variables}} e.g. "{{appUrl}}/audits/{{auditId}}"
  align?: 'left' | 'center' | 'right';
  backgroundColor?: string;  // defaults to brand primary
  color?: string;            // defaults to white
  borderRadius?: string;
}

interface TwoColumnBlock {
  type: 'two_column';
  left: EmailBlock[];    // nested blocks (text, image, button)
  right: EmailBlock[];
  ratio?: '50:50' | '30:70' | '70:30';
}

interface DividerBlock {
  type: 'divider';
  color?: string;
  width?: string;        // e.g. "80%"
  padding?: string;
}

interface SpacerBlock {
  type: 'spacer';
  height?: string;       // e.g. "20px"
}

// Dynamic blocks — rendered server-side from audit data
interface ScoreTableBlock {
  type: 'score_table';
  // No config needed — populated from audit data at send time
  // Renders: category | score with color coding
}

interface IssuesSummaryBlock {
  type: 'issues_summary';
  // Renders: total issues, critical count, severity breakdown
}

interface FooterBlock {
  type: 'footer';
  text?: string;         // resolved from branding if null
  includeUnsubscribe: boolean;  // must be true for non-transactional
  includeSocialLinks?: boolean;
}
```

### 5.2 Block-to-MJML Mapping

| Block Type | MJML Output |
|---|---|
| `header` | `<mj-section>` with `<mj-image>` (logo) + `<mj-text>` (company name) |
| `hero_image` | `<mj-image>` full-width with optional `<mj-attributes>` link |
| `text` | `<mj-text>` with inline style attrs |
| `button` | `<mj-button>` with color/radius attrs |
| `two_column` | `<mj-section><mj-column>` × 2, with width ratios |
| `divider` | `<mj-divider>` |
| `spacer` | `<mj-spacer>` |
| `score_table` | `<mj-table>` with colored score rows (generated at send time) |
| `issues_summary` | `<mj-section>` with severity pills and counts |
| `footer` | `<mj-section>` with `<mj-text>` (footer text) + unsubscribe link |

---

## 6. Template Compilation Pipeline

```
Admin saves template
        │
        ▼
┌─────────────────────┐
│  JSON blocks stored  │   → email_templates.blocks (JSONB)
│  in database         │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  blocks → MJML       │   → mapBlocksToMjml(blocks, branding)
│  string assembly     │      Wraps in <mjml><mj-body> with brand colors
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  MJML → HTML         │   → mjml(mjmlString).html
│  compilation         │      Cached in email_templates.compiled_html
└─────────┬───────────┘
          │
          ▼  (at send time)
┌─────────────────────┐
│  Variable            │   → replaceVariables(html, variables)
│  substitution        │      {{firstName}} → "Chris", {{domain}} → "example.com"
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Dynamic blocks      │   → renderDynamicBlocks(html, auditData)
│  rendered            │      ScoreTableBlock, IssuesSummaryBlock filled with real data
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Resend API          │   → resend.emails.send({ html, subject, to })
│  delivery            │
└─────────────────────┘
```

### 6.1 Compilation Caching

When an admin saves a template, the server:
1. Validates blocks against the TypeScript schema
2. Compiles blocks → MJML → HTML
3. Stores the compiled HTML in `email_templates.compiled_html` with a `compiled_at` timestamp
4. At send time, uses the cached HTML (skips recompilation)
5. Recompiles only when blocks change (check `updated_at > compiled_at`)

### 6.2 Variable Substitution

Variables use `{{doubleBrace}}` syntax. Substitution happens **after** MJML compilation to prevent MJML from treating braces as syntax errors.

**System variables** (always available):

| Variable | Source |
|---|---|
| `{{firstName}}` | `users.first_name` |
| `{{lastName}}` | `users.last_name` |
| `{{email}}` | `users.email` |
| `{{companyName}}` | `users.company_name` or org name |
| `{{appUrl}}` | `process.env.APP_URL` |
| `{{unsubscribeUrl}}` | `{{appUrl}}/email/unsubscribe?token=...` |
| `{{preferencesUrl}}` | `{{appUrl}}/settings/notifications` |
| `{{currentYear}}` | Current year (for footer copyright) |

**Context variables** (available when sent from a trigger or audit event):

| Variable | Source |
|---|---|
| `{{domain}}` | Audit target domain |
| `{{auditId}}` | Audit job ID |
| `{{auditUrl}}` | `{{appUrl}}/audits/{{auditId}}` |
| `{{seoScore}}` | Audit SEO score |
| `{{accessibilityScore}}` | Audit accessibility score |
| `{{securityScore}}` | Audit security score |
| `{{performanceScore}}` | Audit performance score |
| `{{contentScore}}` | Audit content score |
| `{{structuredDataScore}}` | Audit structured data score |
| `{{totalIssues}}` | Unique issue count |
| `{{criticalIssues}}` | Critical issue count |
| `{{currentTier}}` | User's current tier |
| `{{aeoScore}}` | AEO score |

### 6.3 MJML Wrapper

Every template is wrapped in a standard MJML skeleton with brand-resolved attributes:

```xml
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Outfit, 'Helvetica Neue', Arial, sans-serif" />
      <mj-text font-size="16px" color="{{textColor}}" line-height="1.6" />
      <mj-button background-color="{{primaryColor}}" color="#ffffff"
                 border-radius="6px" font-size="16px" font-weight="600"
                 inner-padding="12px 30px" />
      <mj-divider border-color="#e2e8f0" border-width="1px" />
    </mj-attributes>
    <mj-preview>{{previewText}}</mj-preview>
    <mj-style>
      .score-good { color: #22c55e; }
      .score-fair { color: #eab308; }
      .score-poor { color: #ef4444; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f8fafc" width="600px">
    <!-- blocks rendered here -->
  </mj-body>
</mjml>
```

---

## 7. Email Branding

### 7.1 Resolution Chain

Reuses the same logic as `pdf-branding.service.ts`. Create `resolveEmailBranding()` in a new `email-branding.service.ts` that mirrors `resolvePdfBranding()`.

| Tier | Header BG | Button Color | Logo | Footer Text |
|---|---|---|---|---|
| **Free** | `#4f46e5` (indigo-600) | `#4f46e5` | PagePulser | "Powered by PagePulser" |
| **Starter** | Site `primaryColor` or `#4f46e5` | Site `primaryColor` | PagePulser | "Powered by PagePulser" |
| **Pro** | Site `primaryColor` or `#4f46e5` | Site `primaryColor` | PagePulser | "Powered by PagePulser" |
| **Agency+** | Org/site `primaryColor` | Org/site `primaryColor` | Org/site logo | Custom footer text |

### 7.2 Default Brand Colors (Matching Brand Guidelines)

From `BRAND_GUIDELINES.md` §Email Templates:

```typescript
const EMAIL_BRAND_DEFAULTS = {
  headerBackground: '#4f46e5',   // indigo-600
  headerTextColor: '#ffffff',
  bodyBackground: '#f8fafc',     // slate-50
  bodyTextColor: '#334155',      // slate-700
  buttonColor: '#4f46e5',        // indigo-600
  buttonTextColor: '#ffffff',
  footerBackground: '#f1f5f9',   // slate-100
  footerTextColor: '#64748b',    // slate-500
  linkColor: '#4f46e5',          // indigo-600
  dividerColor: '#e2e8f0',       // slate-200
};
```

---

## 8. Campaign Sending

### 8.1 Segment Targeting

The `email_campaigns.segment` JSONB column stores targeting criteria:

```typescript
interface CampaignSegment {
  tiers?: string[];                // ['free', 'starter']
  leadStatuses?: string[];         // ['upgrade_prospect', 'engaged']
  minLeadScore?: number;
  maxLeadScore?: number;
  hasVerifiedDomain?: boolean;
  minAuditCount?: number;
  lastLoginDaysAgo?: { min?: number; max?: number };
  registeredDaysAgo?: { min?: number; max?: number };
  excludeUserIds?: string[];       // manual exclusions
}
```

### 8.2 Segment Resolution Query

```sql
SELECT u.id, u.email, u.first_name, u.last_name, u.company_name
FROM users u
JOIN organization_members om ON om.user_id = u.id
JOIN organizations o ON o.id = om.organization_id
JOIN subscriptions s ON s.organization_id = o.id
LEFT JOIN email_preferences ep ON ep.user_id = u.id
WHERE u.status = 'active'
  AND u.email_verified = true
  AND (ep.unsubscribed_all IS NULL OR ep.unsubscribed_all = false)
  AND (ep.marketing IS NULL OR ep.marketing = true)
  -- apply segment filters from JSONB
```

### 8.3 Sending Flow

1. Admin creates campaign (draft), selects template and segment
2. Admin previews → API returns segment count + sample rendered email
3. Admin launches campaign
4. Server enqueues rows into `email_sends` (status = `queued`, campaign_id set)
5. Worker processes the queue with rate limiting (Resend rate: 10/sec on starter plan)
6. Each send: resolve variables → compile if needed → substitute → Resend API
7. Update `email_sends.status` and `email_campaigns.stats` as sends complete

### 8.4 Rate Limiting

Resend plan limits (typically 100/day free, 50K/month paid). The campaign worker:
- Sends max 5 emails/second (configurable via `EMAIL_SEND_RATE` env var)
- Pauses on 429 responses with exponential backoff
- Admin outreach limit: 50 emails per admin per day (from CRM spec)
- Campaign limit: 10,000 recipients per campaign

---

## 9. Default System Templates

Migrate the three existing inline templates into the new system as `is_system = true` templates.

### 9.1 `email_verification`

| Field | Value |
|---|---|
| **slug** | `email_verification` |
| **category** | `transactional` |
| **subject** | `Verify your PagePulser account` |
| **is_system** | `true` |
| **variables** | `["firstName", "verifyUrl"]` |

**Blocks:**
```json
[
  { "type": "header" },
  { "type": "text", "content": "Hi {{firstName}},", "fontSize": "lg" },
  { "type": "text", "content": "Welcome to PagePulser! Please verify your email address by clicking the button below:" },
  { "type": "button", "label": "Verify Email Address", "href": "{{verifyUrl}}", "align": "center" },
  { "type": "text", "content": "Or copy and paste this link into your browser:", "fontSize": "sm", "color": "#6b7280" },
  { "type": "text", "content": "{{verifyUrl}}", "fontSize": "sm", "color": "#6b7280" },
  { "type": "text", "content": "This link will expire in 24 hours.", "fontSize": "sm", "color": "#6b7280" },
  { "type": "divider" },
  { "type": "footer", "text": "If you didn't create an account with PagePulser, you can safely ignore this email.", "includeUnsubscribe": false }
]
```

### 9.2 `password_reset`

| Field | Value |
|---|---|
| **slug** | `password_reset` |
| **category** | `transactional` |
| **subject** | `Reset your PagePulser password` |
| **is_system** | `true` |
| **variables** | `["firstName", "resetUrl"]` |

**Blocks:**
```json
[
  { "type": "header" },
  { "type": "text", "content": "Hi {{firstName}},", "fontSize": "lg" },
  { "type": "text", "content": "We received a request to reset your password. Click the button below to choose a new password:" },
  { "type": "button", "label": "Reset Password", "href": "{{resetUrl}}", "align": "center" },
  { "type": "text", "content": "Or copy and paste this link into your browser:", "fontSize": "sm", "color": "#6b7280" },
  { "type": "text", "content": "{{resetUrl}}", "fontSize": "sm", "color": "#6b7280" },
  { "type": "text", "content": "<strong>This link will expire in 1 hour.</strong>", "fontSize": "sm", "color": "#6b7280" },
  { "type": "divider" },
  { "type": "footer", "text": "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.", "includeUnsubscribe": false }
]
```

### 9.3 `audit_completed`

| Field | Value |
|---|---|
| **slug** | `audit_completed` |
| **category** | `transactional` |
| **subject** | `Audit {{statusText}}: {{domain}}` |
| **is_system** | `true` |
| **variables** | `["firstName", "domain", "targetUrl", "statusText", "auditUrl", "totalIssues", "criticalIssues"]` |

**Blocks:**
```json
[
  { "type": "header" },
  { "type": "text", "content": "Hi {{firstName}},", "fontSize": "lg" },
  { "type": "text", "content": "Your audit of <strong>{{targetUrl}}</strong> has {{statusMessage}}." },
  { "type": "score_table" },
  { "type": "issues_summary" },
  { "type": "button", "label": "View Audit Results", "href": "{{auditUrl}}", "align": "center" },
  { "type": "divider" },
  { "type": "footer", "text": "You're receiving this email because you have audit notifications enabled.", "includeUnsubscribe": true }
]
```

### 9.4 Additional CRM Templates

These are the default templates from the CRM spec (§3.3), now defined as blocks:

| Slug | Category | Subject |
|---|---|---|
| `welcome_first_audit` | `onboarding` | "Your first audit results are in" |
| `verify_domain_howto` | `onboarding` | "Verify {{domain}} in 2 minutes" |
| `security_alert_dorking` | `security` | "Security issue found on {{domain}}" |
| `upgrade_hitting_limits` | `upgrade` | "You're growing fast, {{firstName}}" |
| `aeo_improvement_guide` | `educational` | "Boost your AI Engine score" |
| `win_back_inactive` | `win_back` | "We miss you, {{firstName}}" |
| `score_celebration` | `engagement` | "{{domain}} just hit {{score}}!" |
| `org_invitation` | `transactional` | "You've been invited to join {{orgName}}" |

Block definitions for each would follow the same pattern — header, text, dynamic content, CTA button, footer. These are seeded on first deploy.

---

## 10. Unsubscribe & Email Preferences

### 10.1 Unsubscribe Token

Generate a signed, non-expiring token for the unsubscribe link:

```typescript
function generateUnsubscribeToken(userId: string): string {
  return jwt.sign({ userId, purpose: 'unsubscribe' }, process.env.JWT_SECRET!, {
    // No expiresIn — unsubscribe links should work forever
  });
}
```

### 10.2 Unsubscribe Routes

```
GET  /api/email/unsubscribe?token=...              → one-click unsubscribe (sets unsubscribed_all = true)
GET  /api/email/preferences?token=...              → renders preferences page
POST /api/email/preferences?token=...              → updates category preferences
GET  /api/email/preferences (authenticated)        → same preferences page for logged-in users
PUT  /api/email/preferences (authenticated)        → update preferences
```

### 10.3 List-Unsubscribe Header

Every non-transactional email includes RFC 8058 headers for one-click unsubscribe in email clients:

```typescript
headers: {
  'List-Unsubscribe': `<{{appUrl}}/api/email/unsubscribe?token={{unsubToken}}>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
}
```

### 10.4 Preference Checks

Before every send, check:
1. `email_preferences.unsubscribed_all = true` → block everything except `transactional`
2. Category-specific opt-out → block that category
3. `transactional` emails always send (verification, password reset)

---

## 11. Resend Webhook Integration

### 11.1 Webhook Endpoint

```
POST /api/webhooks/resend   — verifies Resend webhook signature, inserts into email_events
```

### 11.2 Event Processing

```typescript
async function handleResendWebhook(event: ResendWebhookEvent): Promise<void> {
  // Find the email_send by resend_message_id
  const send = await pool.query(
    'SELECT id, status FROM email_sends WHERE resend_message_id = $1',
    [event.data.email_id]
  );

  if (send.rows.length === 0) return; // unknown email, ignore

  const sendId = send.rows[0].id;

  // Insert event
  await pool.query(
    `INSERT INTO email_events (email_send_id, event_type, metadata, occurred_at)
     VALUES ($1, $2, $3, $4)`,
    [sendId, event.type, event.data, event.created_at]
  );

  // Update email_sends status (only upgrade, never downgrade)
  const statusPriority = ['queued', 'sent', 'delivered', 'opened', 'clicked'];
  const currentPriority = statusPriority.indexOf(send.rows[0].status);
  const newPriority = statusPriority.indexOf(event.type);

  if (newPriority > currentPriority) {
    const updates: string[] = [`status = $2`];
    if (event.type === 'opened') updates.push(`opened_at = NOW()`);
    if (event.type === 'clicked') updates.push(`clicked_at = NOW()`);

    await pool.query(
      `UPDATE email_sends SET ${updates.join(', ')} WHERE id = $1`,
      [sendId, event.type]
    );
  }

  // Handle bounces/complaints — auto-unsubscribe
  if (event.type === 'bounced' || event.type === 'complained') {
    await pool.query(
      `UPDATE email_sends SET status = $2 WHERE id = $1`,
      [sendId, event.type]
    );
    if (event.type === 'complained') {
      await pool.query(
        `INSERT INTO email_preferences (user_id, unsubscribed_all)
         VALUES ((SELECT user_id FROM email_sends WHERE id = $1), true)
         ON CONFLICT (user_id) DO UPDATE SET unsubscribed_all = true, updated_at = NOW()`,
        [sendId]
      );
    }
  }
}
```

---

## 12. Admin API

### 12.1 Template Management

```
GET    /api/admin/email/templates                — list all templates (filterable by category, is_system)
GET    /api/admin/email/templates/:id            — get template with blocks and compiled preview
POST   /api/admin/email/templates                — create template
PUT    /api/admin/email/templates/:id            — update template (recompiles HTML)
DELETE /api/admin/email/templates/:id            — delete (blocked for is_system templates)
POST   /api/admin/email/templates/:id/preview    — compile and return HTML with sample variables
POST   /api/admin/email/templates/:id/test       — send test email to admin's own inbox
POST   /api/admin/email/templates/:id/duplicate  — clone template with new name/slug
```

### 12.2 Campaign Management

```
GET    /api/admin/email/campaigns                — list campaigns with stats
GET    /api/admin/email/campaigns/:id            — get campaign detail with per-send status
POST   /api/admin/email/campaigns                — create campaign (draft)
PUT    /api/admin/email/campaigns/:id            — update campaign (only while draft)
POST   /api/admin/email/campaigns/:id/preview    — returns segment count + sample rendered email
POST   /api/admin/email/campaigns/:id/launch     — start sending (queues all sends)
POST   /api/admin/email/campaigns/:id/cancel     — cancel (stops unsent emails in queue)
DELETE /api/admin/email/campaigns/:id            — delete (only if draft)
```

### 12.3 Send History & Analytics

```
GET    /api/admin/email/sends?userId=&templateId=&campaignId=&status=&page=1&limit=50
GET    /api/admin/email/analytics                — aggregate stats: sent, delivered, opened, clicked, bounced rates
GET    /api/admin/email/analytics/templates      — per-template open/click rates
```

### 12.4 One-Click CRM Outreach (from CRM spec)

```
POST   /api/admin/crm/outreach/:userId           — send template to specific user
         Body: { templateSlug, variables: {} }
GET    /api/admin/crm/outreach?userId=...&page=1  — send history for a user
```

---

## 13. Admin Frontend

### 13.1 Page Structure

```
/admin/email
  /admin/email/templates          — Template library grid
  /admin/email/templates/new      — Block editor (create)
  /admin/email/templates/:id      — Block editor (edit)
  /admin/email/campaigns          — Campaign list
  /admin/email/campaigns/new      — Campaign builder (select template, define segment, schedule)
  /admin/email/campaigns/:id      — Campaign detail (stats, per-recipient status)
  /admin/email/analytics          — Email performance dashboard
```

### 13.2 Block Editor

The editor follows the same pattern as the CMS blog editor (if implemented) — a vertical block list with a side panel for block settings.

**Layout:**
```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Templates          [Preview ▾]  [Send Test]  [Save] │
├─────────────────────────┬────────────────────────────────────────┤
│                         │                                        │
│   Block Palette         │   600px Email Canvas                   │
│   ─────────────         │   ─────────────────                    │
│   📌 Header             │   ┌──────────────────────────────┐    │
│   🖼️ Hero Image         │   │  [PagePulser Logo]           │    │
│   📝 Text               │   ├──────────────────────────────┤    │
│   🔘 Button             │   │  Hi {{firstName}},           │    │
│   📊 Two Column         │   │                              │    │
│   ── Divider            │   │  Your audit of {{domain}}... │    │
│   ⬜ Spacer             │   │                              │    │
│   📈 Score Table        │   │  [View Audit Results]        │    │
│   🔢 Issues Summary     │   │                              │    │
│   📎 Footer             │   │  ─────────────────           │    │
│                         │   │  Powered by PagePulser       │    │
│   ─────────────         │   │  Unsubscribe | Preferences   │    │
│   Block Settings        │   └──────────────────────────────┘    │
│   (when block selected) │                                        │
│                         │                                        │
│   Font Size: [md ▾]     │                                        │
│   Alignment: [left ▾]   │                                        │
│   Color: [#334155]      │                                        │
│   Padding: [10px 25px]  │                                        │
│                         │                                        │
└─────────────────────────┴────────────────────────────────────────┘
```

**Interactions:**
- Drag blocks from palette onto canvas (use `@dnd-kit/core` + `@dnd-kit/sortable`)
- Click block on canvas → side panel shows settings for that block type
- Reorder blocks via drag handle on canvas
- Delete block via trash icon on hover
- Live preview updates as blocks/settings change (debounced 500ms)
- "Preview" dropdown toggles Desktop (600px) / Mobile (320px) view

### 13.3 Campaign Builder

**Step 1: Select Template**
- Grid of template cards with preview thumbnails
- Filter by category

**Step 2: Define Segment**
- Form with targeting criteria (tier checkboxes, lead status multiselect, date ranges)
- Live count: "This segment matches **247 users**"

**Step 3: Schedule**
- Send now or pick date/time
- Final preview with segment count

**Step 4: Review & Launch**
- Summary card showing template, segment, schedule
- "Launch Campaign" button with confirmation modal

### 13.4 Email Analytics Dashboard

| Metric | Visualization |
|---|---|
| Total sends (30d) | Number card |
| Delivery rate | Percentage with trend |
| Open rate | Percentage with trend |
| Click rate | Percentage with trend |
| Bounce rate | Percentage with trend |
| Top templates by open rate | Ranked list |
| Sends over time | Line chart (daily) |
| Campaign performance | Table with per-campaign stats |

---

## 14. Service Architecture

### 14.1 `email-template.service.ts`

Core template operations.

```typescript
class EmailTemplateService {
  // Template CRUD
  listTemplates(filters: TemplateFilters): Promise<PaginatedResult<EmailTemplate>>;
  getTemplate(id: string): Promise<EmailTemplate>;
  getTemplateBySlug(slug: string): Promise<EmailTemplate>;
  createTemplate(input: CreateTemplateInput): Promise<EmailTemplate>;
  updateTemplate(id: string, input: UpdateTemplateInput): Promise<EmailTemplate>;
  deleteTemplate(id: string): Promise<void>;
  duplicateTemplate(id: string, newSlug: string, newName: string): Promise<EmailTemplate>;

  // Compilation
  compileTemplate(template: EmailTemplate, branding: ResolvedBranding): string;
  renderPreview(templateId: string, sampleVariables?: Record<string, string>): Promise<string>;

  // Sending
  sendTemplate(params: {
    templateSlug: string;
    to: { userId: string; email: string; firstName: string; };
    variables: Record<string, string>;
    sentBy?: string;        // admin user ID
    campaignId?: string;
    siteId?: string;        // for branding resolution
  }): Promise<string>;       // returns email_send ID
}
```

### 14.2 `email-campaign.service.ts`

Campaign lifecycle management.

```typescript
class EmailCampaignService {
  // Campaign CRUD
  listCampaigns(filters: CampaignFilters): Promise<PaginatedResult<EmailCampaign>>;
  getCampaign(id: string): Promise<EmailCampaignWithStats>;
  createCampaign(input: CreateCampaignInput): Promise<EmailCampaign>;
  updateCampaign(id: string, input: UpdateCampaignInput): Promise<EmailCampaign>;

  // Segment
  resolveSegment(segment: CampaignSegment): Promise<{ count: number; sample: UserSummary[] }>;

  // Lifecycle
  launchCampaign(id: string, adminId: string): Promise<void>;  // queues all sends
  cancelCampaign(id: string): Promise<void>;

  // Worker picks up queued sends
  processQueuedSends(batchSize: number): Promise<number>;      // returns count processed
}
```

### 14.3 `email-branding.service.ts`

```typescript
async function resolveEmailBranding(
  siteId: string | null,
  userId: string
): Promise<EmailBranding> {
  // Same chain as pdf-branding.service.ts
  // Returns: headerBg, buttonColor, logoUrl, footerText, etc.
}
```

### 14.4 `email-preference.service.ts`

```typescript
class EmailPreferenceService {
  getPreferences(userId: string): Promise<EmailPreferences>;
  updatePreferences(userId: string, prefs: Partial<EmailPreferences>): Promise<void>;
  unsubscribeAll(userId: string): Promise<void>;
  canSendCategory(userId: string, category: string): Promise<boolean>;
  generateUnsubscribeToken(userId: string): string;
  verifyUnsubscribeToken(token: string): { valid: boolean; userId?: string };
}
```

### 14.5 Changes to Existing `email.service.ts`

Replace the three inline template methods with calls to the new template system:

```typescript
// Before:
async sendVerificationEmail(email, firstName, token) {
  const html = `<!DOCTYPE html>...`; // 30 lines of inline HTML
  await this.sendEmail(email, subject, html);
}

// After:
async sendVerificationEmail(email, firstName, token) {
  await emailTemplateService.sendTemplate({
    templateSlug: 'email_verification',
    to: { userId, email, firstName },
    variables: { firstName, verifyUrl: `${this.appUrl}/verify-email?token=${token}` },
  });
}
```

The `sendEmail()` method remains as the low-level Resend API wrapper. The template service calls it after compilation and variable substitution.

---

## 15. Audit Export Consideration

Per CLAUDE.md: "Whenever anything is added to an audit, it should always appear on any export."

The email template system doesn't add new audit data — it consumes existing audit data for display. However, if the `ScoreTableBlock` or `IssuesSummaryBlock` renders audit data in a novel format, ensure the same data is available in PDF and CSV exports. The current audit completion email already shows a subset of scores; the template version should show the same or more.

---

## 16. Security

| Requirement | Implementation |
|---|---|
| Templates are admin-only | All `/api/admin/email/*` routes behind `requireSuperAdmin` |
| Variable injection prevention | Variables are HTML-escaped before substitution |
| No user data in URLs | Unsubscribe uses signed JWT token, not raw user ID |
| Campaign rate limiting | Max 10,000 recipients per campaign, 5/sec send rate |
| Admin outreach limiting | Max 50 emails per admin per day (enforced via `email_sends` count) |
| System templates are protected | `is_system = true` templates cannot be deleted |
| Webhook signature verification | Resend webhook signature checked before processing |
| Email preference enforcement | All non-transactional sends check preferences before sending |
| SQL injection in segments | Segment criteria are parameterized, not interpolated into SQL |
| Admin activity logged | All template edits, campaign launches, and outreach sends logged |

---

## 17. Implementation Order

### Phase 1: Template Engine (Week 1-2)

1. **Migration:** `email_templates` table (expanded schema from §4.1)
2. **Types:** `server/src/types/email-template.types.ts` — block types, template interfaces
3. **Service:** `email-template.service.ts` — CRUD, MJML compilation, variable substitution
4. **Service:** `email-branding.service.ts` — reuse PDF branding chain for emails
5. **Seed:** Migrate 3 existing inline templates into `email_templates` as system templates
6. **Refactor:** Update `email.service.ts` to use template service instead of inline HTML
7. **API:** `/api/admin/email/templates/*` — CRUD, preview, test send
8. **Test:** Verify existing email flows (verification, reset, audit complete) still work

### Phase 2: Email Preferences & Unsubscribe (Week 2-3)

9. **Migration:** `email_preferences` table
10. **Service:** `email-preference.service.ts` — preferences, unsubscribe token generation
11. **Routes:** `/api/email/unsubscribe`, `/api/email/preferences`
12. **Integration:** Check preferences before every non-transactional send
13. **Headers:** Add `List-Unsubscribe` headers to all non-transactional emails
14. **Frontend:** Email preferences section in `/settings/notifications`

### Phase 3: Campaign Infrastructure (Week 3-4)

15. **Migration:** `email_campaigns` + `email_sends` tables
16. **Service:** `email-campaign.service.ts` — segment resolution, campaign lifecycle
17. **Worker:** Campaign send processing (extend existing worker or dedicated email worker)
18. **API:** `/api/admin/email/campaigns/*` — CRUD, preview, launch, cancel
19. **Frontend:** Campaign builder pages (template picker, segment form, schedule)

### Phase 4: Admin Editor Frontend (Week 4-5)

20. **Component:** Block palette (draggable block types)
21. **Component:** Email canvas (600px container with block rendering)
22. **Component:** Block settings panel (per-block-type forms)
23. **Integration:** `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop
24. **Component:** Desktop/Mobile preview toggle
25. **Page:** Template editor page (create/edit)
26. **Page:** Template library grid

### Phase 5: Tracking & Analytics (Week 5-6)

27. **Migration:** `email_events` table
28. **Route:** `/api/webhooks/resend` — webhook handler with signature verification
29. **Integration:** Update `email_sends` status from webhook events
30. **Integration:** Auto-unsubscribe on complaints
31. **API:** `/api/admin/email/analytics` — aggregate stats, per-template rates
32. **Frontend:** Email analytics dashboard page

### Phase 6: CRM Integration (Week 6)

33. **Wire:** CRM triggers auto-send emails via template service
34. **Wire:** CRM outreach sends via template service
35. **Seed:** Default CRM email templates (§9.4)
36. **Missing email:** Organization invitation email (`org_invitation` template)

---

## 18. New Database Tables

| Table | Purpose | Depends On |
|---|---|---|
| `email_templates` | Template definitions with blocks | `users` |
| `email_campaigns` | Campaign metadata and targeting | `email_templates`, `users` |
| `email_sends` | Per-recipient send log | `email_templates`, `email_campaigns`, `users` |
| `email_preferences` | User opt-in/opt-out by category | `users` |
| `email_events` | Webhook-driven delivery/engagement tracking | `email_sends` |

---

## 19. New Files

| File | Responsibility |
|---|---|
| `server/src/types/email-template.types.ts` | Block types, template interfaces, campaign types, preference types |
| `server/src/services/email-template.service.ts` | Template CRUD, MJML compilation, variable substitution, sending |
| `server/src/services/email-campaign.service.ts` | Campaign lifecycle, segment resolution, queue processing |
| `server/src/services/email-branding.service.ts` | Tier-aware branding resolution for emails |
| `server/src/services/email-preference.service.ts` | User preferences, unsubscribe tokens |
| `server/src/routes/email/index.ts` | Public email routes (unsubscribe, preferences) |
| `server/src/routes/admin/email.ts` | Admin email routes (templates, campaigns, analytics) |
| `server/src/routes/webhooks/resend.ts` | Resend webhook handler |
| `server/src/db/migrations/xxx_create_email_templates.sql` | Template table |
| `server/src/db/migrations/xxx_create_email_campaigns.sql` | Campaign + sends tables |
| `server/src/db/migrations/xxx_create_email_preferences.sql` | Preference table |
| `server/src/db/migrations/xxx_create_email_events.sql` | Webhook event table |
| `server/src/db/seeds/email-templates.seed.ts` | Default system + CRM templates |
| `client/src/pages/admin/email/TemplateLibrary.tsx` | Template grid page |
| `client/src/pages/admin/email/TemplateEditor.tsx` | Block editor page |
| `client/src/pages/admin/email/CampaignList.tsx` | Campaign list page |
| `client/src/pages/admin/email/CampaignBuilder.tsx` | Campaign creation wizard |
| `client/src/pages/admin/email/CampaignDetail.tsx` | Campaign stats + per-recipient view |
| `client/src/pages/admin/email/EmailAnalytics.tsx` | Email performance dashboard |
| `client/src/components/email-editor/BlockPalette.tsx` | Draggable block type list |
| `client/src/components/email-editor/EmailCanvas.tsx` | 600px email preview container |
| `client/src/components/email-editor/BlockRenderer.tsx` | Renders each block type on canvas |
| `client/src/components/email-editor/BlockSettings.tsx` | Per-block settings panel |
| `client/src/components/email-editor/PreviewToggle.tsx` | Desktop/Mobile preview switch |
| `client/src/pages/settings/NotificationSettings.tsx` | User email preference page |
| `client/src/pages/email/Unsubscribe.tsx` | Public unsubscribe confirmation page |

Modified files:
| File | Change |
|---|---|
| `server/src/services/email.service.ts` | Replace inline templates with template service calls |
| `server/src/routes/admin/index.ts` | Mount email route group |
| `server/src/routes/index.ts` | Mount public email routes + webhook routes |
| `server/src/worker.ts` | Add campaign send processing |
| `client/src/App.tsx` | Add admin email routes + settings notification route |
| `client/src/components/layout/Sidebar.tsx` | Add admin email nav items |

---

## 20. Dependencies

```json
{
  "mjml": "^5.0.0-alpha.4",
  "handlebars": "^4.7.8",
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2"
}
```

- `mjml` — server only (`server/package.json`), compiles MJML markup to email-safe HTML
- `handlebars` — server only, variable substitution with HTML escaping
- `@dnd-kit/*` — client only (`client/package.json`), drag-and-drop for block editor

Note: `resend` (v2.0.0) is already installed. No additional email delivery dependencies needed.
