# Kritano Privacy & Data Audit

> **Purpose**: Complete overview of all personal data collected, stored, and processed by Kritano. Used for GDPR compliance, privacy policy accuracy, and identifying improvement areas.
>
> **Last updated**: 14 March 2026

---

## Table of Contents

1. [Data Categories Overview](#1-data-categories-overview)
2. [Detailed Data Inventory](#2-detailed-data-inventory)
3. [Third-Party Data Processors](#3-third-party-data-processors)
4. [Cookies & Client-Side Storage](#4-cookies--client-side-storage)
5. [Data Retention Policies](#5-data-retention-policies)
6. [Existing GDPR Compliance Features](#6-existing-gdpr-compliance-features)
7. [GDPR Gaps & Improvement Recommendations](#7-gdpr-gaps--improvement-recommendations)
8. [Privacy Policy Page Recommendations](#8-privacy-policy-page-recommendations)
9. [Implementation Priority](#9-implementation-priority)

---

## 1. Data Categories Overview

| Category | Data Type | Lawful Basis (GDPR Art. 6) | Collected From |
|----------|-----------|---------------------------|----------------|
| Account & Identity | Name, email, company, password | Contract (6.1b) | Registration form |
| Authentication & Security | IP, user agent, device fingerprint, login history | Legitimate interest (6.1f) | Automatic on auth events |
| Billing & Payment | Stripe customer/subscription IDs, tier, billing period | Contract (6.1b) | Stripe checkout |
| Audit Data | URLs, HTML content, HTTP headers, scores, findings | Contract (6.1b) | Website scanning |
| Organisation & Team | Org name, member roles, invitations | Contract (6.1b) | User input |
| Email & Marketing | Email preferences, send logs, open/click tracking | Consent (6.1a) / Legitimate interest (6.1f) | Email interactions |
| CRM & Lead Scoring | Lead score, lead status, behavioural triggers | Legitimate interest (6.1f) | Computed from activity |
| Referral Data | Referral codes, referrer/referred IPs, reward history | Contract (6.1b) / Consent (6.1a) | Referral actions |
| API Usage | API keys, request logs, rate limits | Contract (6.1b) | API calls |
| Consent Records | Cookie consent, ToS acceptance, audit consent | Legal obligation (6.1c) | User consent actions |
| Bug Reports & Feedback | Titles, descriptions, browser info, screenshots | Legitimate interest (6.1f) | User submissions |
| Cold Prospects | Domain, contact emails, technology stack | Legitimate interest (6.1f) | Public WHOIS/web data |
| Blog & Content | Author info, view counts | Legitimate interest (6.1f) | CMS |

---

## 2. Detailed Data Inventory

### 2.1 User Account Data

**Table: `users`**

| Field | Type | How Generated | Contains PII |
|-------|------|--------------|-------------|
| `email` | CITEXT | User input at registration | Yes |
| `first_name` | TEXT | User input at registration | Yes |
| `last_name` | TEXT | User input at registration | Yes |
| `company_name` | TEXT | User input at registration | Potentially |
| `password_hash` | TEXT | Argon2id hash of user password | No (hashed) |
| `password_changed_at` | TIMESTAMPTZ | Auto on password change | No |
| `last_login_at` | TIMESTAMPTZ | Auto on login | No |
| `last_login_ip` | INET | Auto-captured from request | Yes |
| `status` | TEXT | System-managed (pending/active/suspended/deleted) | No |
| `role` | TEXT | System-assigned (user/admin/super_admin) | No |
| `failed_login_attempts` | INT | Auto-incremented on failure | No |
| `lockout_until` | TIMESTAMPTZ | Auto-set after 5 failures | No |
| `lead_score` | INT | Computed by lead scoring service | No |
| `lead_status` | TEXT | Computed (new/activated/engaged/churning/etc.) | No |
| `referral_code` | VARCHAR | Auto-generated (REF-XXXXX) | No |
| `referred_by_code` | VARCHAR | Captured from referral link | No |
| `referral_bonus_audits` | INT | Computed from referral rewards | No |
| `early_access` | BOOLEAN | Admin/system-set | No |
| `discount_percent` | INT | Admin/system-set | No |
| `tos_accepted_at` | TIMESTAMPTZ | Recorded on ToS acceptance | No |
| `tos_version` | VARCHAR | Version string at acceptance | No |
| `settings` | JSONB | User preferences (e.g. skipUnverifiedDomainWarning) | No |

### 2.2 Authentication & Security Logs

**Table: `auth_audit_logs`**

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `user_id` | Yes (identifier) | Link to user |
| `event_type` | No | login_attempt, register, password_reset, token_refresh |
| `event_status` | No | success, failure, blocked |
| `ip_address` | Yes | Security correlation & abuse detection |
| `user_agent` | Yes | Device identification |
| `device_fingerprint` | Yes | Session tracking |
| `details` | Potentially | Event-specific metadata (JSONB) |
| `failure_reason` | No | Why an auth event failed |

**Table: `refresh_tokens`**

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `token_hash` | No (hashed) | SHA-256 hash of refresh token |
| `device_fingerprint` | Yes | Device identification for session management |
| `user_agent` | Yes | Browser/device identification |
| `ip_address` | Yes | Session origin tracking |
| `family_id` | No | Token rotation family (reuse detection) |

**Table: `rate_limit_records`**

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `identifier` | Yes (IP/email) | Rate limit target |
| `identifier_type` | No | ip, user, email, composite |
| `action` | No | login, password_reset, signup |

### 2.3 Billing & Subscription Data

**Table: `subscriptions`**

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `stripe_customer_id` | Yes (identifier) | Links to Stripe customer record |
| `stripe_subscription_id` | Yes (identifier) | Links to Stripe subscription |
| `stripe_price_id` | No | Which price plan |
| `tier` | No | free/starter/pro/agency/enterprise |
| `status` | No | active/past_due/canceled/trialing/paused |
| `current_period_start/end` | No | Billing cycle dates |
| `trial_start/end` | No | Trial period dates |

> **Note**: Kritano does NOT store credit card numbers, CVVs, or bank details. All payment data is handled entirely by Stripe. We only store Stripe reference IDs.

**Table: `usage_records`**

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `organization_id` | Yes (identifier) | Links usage to org |
| `audits_count`, `pages_crawled`, `api_requests`, `exports_count` | No | Monthly usage metrics |

### 2.4 Audit & Scan Data

**Table: `audit_jobs`** — Stores metadata about each website audit run.

| Key PII Fields | Purpose |
|----------------|---------|
| `user_id` | Who initiated the audit |
| `target_url`, `target_domain` | The website being audited |
| `unverified_mode` | Whether explicit consent was given for unverified domain |

**Table: `audit_pages`** — Individual pages crawled during an audit.

| Key Fields | Purpose |
|------------|---------|
| `url` | Page URL (publicly accessible) |
| `title`, `meta_description`, `h1_text` | Page content metadata |
| `status_code`, `response_time_ms`, `page_size_bytes` | Technical metrics |
| `keyword_data` (JSONB) | Keyword analysis results |
| `open_graph_data`, `twitter_card_data`, `json_ld_items` (JSONB) | Structured data found |
| Various scores (SEO, accessibility, security, etc.) | Computed metrics |

**Table: `audit_findings`** — Individual issues found on pages.

| Key Fields | Purpose |
|------------|---------|
| `rule_id`, `rule_name` | What rule was violated |
| `severity` | critical/serious/moderate/minor/info |
| `selector`, `snippet` | CSS selector and code snippet from target page |
| `wcag_criteria` | WCAG reference codes |

> **Note**: Audit data is collected from **publicly accessible** web pages only. No authentication walls are bypassed, no forms are submitted on target sites.

### 2.5 Organisation & Team Data

**Table: `organizations`** — Team workspaces.

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `name` | Potentially | Organisation name |
| `slug` | No | URL-friendly identifier |
| `owner_id` | Yes (identifier) | Who owns the org |

**Table: `organization_members`** — Team membership.

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `user_id` | Yes (identifier) | Team member |
| `role` | No | owner/admin/member/viewer |
| `invited_by` | Yes (identifier) | Who invited them |

**Table: `organization_invitations`** — Pending invites.

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `email` | Yes | Invitee email address |
| `token` | No (opaque) | Invitation token |
| `role` | No | Assigned role |

**Table: `organization_audit_log`** — Org activity trail.

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `user_id` | Yes (identifier) | Who performed the action |
| `action`, `resource_type` | No | What was done |
| `ip_address` | Yes | Security correlation |
| `user_agent` | Yes | Device identification |
| `details` (JSONB) | Potentially | Action-specific metadata |

### 2.6 Domain Verification Data

**Table: `organization_domains`**

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `domain` | No (public) | Verified domain |
| `verification_token` | No | DNS/file verification token |
| `verification_method` | No | dns or file |
| `added_by` | Yes (identifier) | Who added the domain |

**Table: `sites`**

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `domain` | No (public) | Site domain |
| `name`, `description` | No | User-defined labels |
| `created_by` | Yes (identifier) | Who created the site |

### 2.7 Email System Data

**Table: `email_sends`** — Per-recipient email log.

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `to_email` | Yes | Recipient email |
| `user_id` | Yes (identifier) | Recipient user |
| `subject` | No | Email subject line |
| `variables` (JSONB) | Potentially | Template variables (may include name) |
| `status` | No | queued/sent/delivered/opened/clicked/bounced/complained/failed |
| `opened_at` | No | Engagement tracking |
| `clicked_at` | No | Engagement tracking |
| `resend_message_id` | No | External reference to Resend |

**Table: `email_preferences`** — User opt-in/out preferences.

| Field | Purpose |
|-------|---------|
| `transactional` | Can we send transactional emails (default: true) |
| `audit_notifications` | Audit completion emails |
| `product_updates` | Product update emails |
| `educational` | Educational content emails |
| `marketing` | Marketing emails |
| `unsubscribed_all` | Master kill switch |

**Table: `email_campaigns`** — Batch email campaigns.

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `segment` (JSONB) | No | Audience filter criteria |
| `audience_count` | No | How many recipients |
| `stats` (JSONB) | No | Aggregate send statistics |

### 2.8 CRM & Lead Scoring

**How lead scores are computed** (from `lead-scoring.service.ts`):

Signals used:
- Email verification status
- Last login timestamp & frequency
- Account creation date (age)
- Total audits run & completed
- Site count & verified domains
- Team member count
- PDF export activity
- Subscription tier

**Table: `crm_triggers`** — Automated behaviour triggers.

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `user_id` | Yes (identifier) | Target user |
| `trigger_type` | No | e.g. first_audit_complete, churn_risk, upgrade_nudge |
| `context` (JSONB) | Potentially | Trigger-specific data (domain, scores, etc.) |

### 2.9 Referral System

**Table: `referrals`**

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `referrer_id` | Yes (identifier) | Who referred |
| `referred_id` | Yes (identifier) | Who was referred |
| `referral_code` | No | Code used |
| `referrer_ip` | Yes | Fraud detection |
| `referred_ip` | Yes | Fraud detection |
| `referrer_tier` | No | Tier at time of referral |

**Table: `referral_rewards`** — Rewards ledger.

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `user_id` | Yes (identifier) | Who received the reward |
| `type` | No | bonus_audits/tier_upgrade/admin_adjustment/consumed |
| `amount`, `balance_after` | No | Reward credits |

### 2.10 API Keys & Request Logs

**Table: `api_keys`**

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `key_hash` | No (hashed) | SHA-256 hash of API key |
| `key_prefix` | No | First 12 chars for identification |
| `last_used_ip` | Yes | Security tracking |
| `scopes` | No | Permission scopes |

**Table: `api_requests`**

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `ip_address` | Yes | Request origin |
| `user_agent` | Yes | Client identification |
| `method`, `path` | No | What endpoint was called |
| `status_code`, `response_time_ms` | No | Performance metrics |

### 2.11 Consent & Compliance Records

**Table: `user_consents`** — ToS/privacy acceptance log.

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `user_id` | Yes (identifier) | Who consented |
| `consent_type` | No | terms_of_service, privacy_policy |
| `consent_version` | No | Version string |
| `consent_text_hash` | No | SHA-256 of consent text (integrity proof) |
| `ip_address` | Yes | Consent provenance |
| `user_agent` | Yes | Consent provenance |

**Table: `audit_consent_log`** — Unverified domain scan consent.

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `user_id` | Yes (identifier) | Who consented |
| `target_url`, `target_domain` | No (public) | What was being scanned |
| `ip_address` | Yes | Consent provenance |
| `user_agent` | Yes | Consent provenance |
| `consent_text_hash` | No | Integrity proof |
| `dont_show_again` | No | User preference |

**Table: `cookie_consent_logs`** — Cookie banner actions.

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `user_id` | Yes (identifier, nullable) | User if logged in |
| `categories` (JSONB) | No | Which categories accepted |
| `action` | No | accept_all/reject_all/custom/withdraw |
| `ip_address` | Yes | Consent provenance |
| `user_agent` | Yes | Consent provenance |
| `page_url` | No | Where consent was given |

### 2.12 Bug Reports & Feature Requests

**Table: `bug_reports`**

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `user_id` | Yes (identifier) | Who reported |
| `title`, `description` | Potentially | May contain PII in free text |
| `page_url` | No | Where the bug occurred |
| `user_agent` | Yes | Device/browser info |
| `browser_info` (JSONB) | Yes | Detailed browser data |
| `screenshot_url` | Potentially | May capture PII on screen |

**Table: `feature_requests`** — Same PII profile as bug reports.

### 2.13 Cold Prospects (Outreach Pipeline)

**Table: `cold_prospects`**

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `domain` | No (public) | Newly registered domain |
| `contact_email` | Yes | Extracted from public website |
| `contact_name` | Yes | Extracted from public website |
| `contact_role` | Yes | Extracted from public website |
| `emails` (JSONB) | Yes | All discovered email addresses |
| `title`, `meta_description` | No | Public website metadata |
| `technology_stack` (JSONB) | No | Detected technologies |
| `email_sent_at`, `email_opened_at`, `email_clicked_at` | No | Outreach tracking |

> **GDPR Note**: Cold prospect data requires **legitimate interest assessment (LIA)** documentation. Contact emails are scraped from publicly available websites — this is a higher-risk area for GDPR compliance.

### 2.14 Coming Soon Signups

**Table: `coming_soon_signups`**

| Field | Contains PII | Purpose |
|-------|-------------|---------|
| `email` | Yes | Pre-launch email collection |
| `name` | Yes | Optional name |
| `ip_address` | Yes | Fraud prevention |

---

## 3. Third-Party Data Processors

| Processor | Data Shared | Purpose | DPA Required |
|-----------|------------|---------|-------------|
| **Stripe** | Email, name, billing info, subscription data | Payment processing | Yes — Stripe has standard DPA |
| **Resend** | Email addresses, email content, engagement data | Transactional & marketing email delivery | Yes |
| **Sentry** | Error traces, sanitised request data (cookies filtered) | Error monitoring & debugging | Yes |
| **Google Custom Search API** | Search queries containing domain names | Google index exposure checking (security dorking) | Review needed |
| **Hosting Provider** | All data (database, files, logs) | Infrastructure | Yes |

### Data Flow Summary

```
User → Kritano App → PostgreSQL (primary store)
                     → Redis (ephemeral: queues, rate limits, caching)
                     → Stripe (payment only, via API)
                     → Resend (email delivery only, via API)
                     → Sentry (errors only, sanitised)
                     → Google CSE (search queries only)
                     → Local filesystem (/uploads — blog media)
```

---

## 4. Cookies & Client-Side Storage

### Cookies Set by Kritano

| Cookie | Category | Purpose | Duration | HttpOnly | Secure | SameSite |
|--------|----------|---------|----------|----------|--------|----------|
| `access_token` | Strictly Necessary | JWT auth token | 4 hours | Yes | Yes (prod) | Strict |
| `refresh_token` | Strictly Necessary | Session persistence via token rotation | 7 days (30-day absolute max) | Yes | Yes (prod) | Strict |
| `csrf_token` | Strictly Necessary | CSRF protection | 24 hours | Yes | Yes (prod) | Strict |

### Cookies Set by Third Parties (if analytics/marketing enabled)

| Cookie | Category | Provider | Purpose | Duration |
|--------|----------|----------|---------|----------|
| `_ga`, `_gid`, `_gat` | Analytics | Google Analytics | Usage statistics | Up to 2 years |
| `_fbp`, `_gcl_au` | Marketing | Facebook/Google Ads | Ad attribution | Up to 90 days |

> **Current status**: Analytics and marketing cookies are listed in the privacy policy and cookie consent framework but are **NOT currently implemented**. The consent infrastructure gates them.

### localStorage

| Key | Purpose | Contains PII |
|-----|---------|-------------|
| `kritano-theme` | Light/dark mode preference | No |
| `sidebar-collapsed` | Dashboard sidebar state | No |
| `pp-cookie-consent` | Cookie consent preferences | No |

---

## 5. Data Retention Policies

### Currently Implemented

| Data Type | Retention Period | Mechanism |
|-----------|-----------------|-----------|
| Audit scan data | Tier-based (30d / 90d / 1yr / unlimited) | Defined in `tier_limits` table |
| Consent logs | Regulatory requirement (typically 3 years) | No auto-deletion yet |
| Auth audit logs | Not defined | No auto-deletion |
| Rate limit records | Window-based expiry | Auto-cleanup via `window_expires_at` |
| Refresh tokens | 7 days (30-day absolute max) | Expiry-based |
| Email verification tokens | 24 hours | Expiry-based |
| Password reset tokens | 1 hour | Expiry-based |
| Crawl queue | Per-audit lifecycle | Cleared after audit completes |
| API request logs | Not defined | No auto-deletion |
| Cold prospects | Not defined | No auto-deletion |
| Bug reports | Soft-delete (`deleted_at`) | Manual |

### Not Yet Defined (Needs Attention)

| Data Type | Recommended Retention | Priority |
|-----------|----------------------|----------|
| Auth audit logs | 1 year, then anonymise | High |
| API request logs | 90 days | Medium |
| Email send logs | 1 year | Medium |
| CRM trigger history | 1 year | Low |
| Cold prospects | 6 months if no engagement | High (GDPR risk) |
| Organisation audit logs | 2 years | Medium |
| Bug report screenshots | 1 year | Low |
| Coming soon signups | Delete after launch or 6 months | Medium |

---

## 6. Existing GDPR Compliance Features

### What's Already In Place

| Feature | Status | Location |
|---------|--------|----------|
| Privacy Policy page | ✅ Complete | `/client/src/pages/public/Privacy.tsx` |
| Terms of Service page | ✅ Complete | `/client/src/pages/public/Terms.tsx` |
| Cookie consent banner | ✅ Complete | `/client/src/components/cookies/CookieBanner.tsx` |
| Cookie preferences modal | ✅ Complete | `/client/src/components/cookies/CookiePreferencesModal.tsx` |
| Granular cookie categories | ✅ Complete | Necessary / Analytics / Marketing |
| Cookie consent logging (server-side) | ✅ Complete | `cookie_consent_logs` table |
| Consent versioning & hashing | ✅ Complete | SHA-256 hash of consent text |
| ToS acceptance logging | ✅ Complete | `user_consents` table |
| Unverified domain consent logging | ✅ Complete | `audit_consent_log` table |
| Email preference management | ✅ Complete | `/client/src/pages/email/UnsubscribePage.tsx` |
| One-click unsubscribe (RFC 8058) | ✅ Complete | `POST /api/email/unsubscribe` |
| Unsubscribe link in all emails | 🔄 In Progress | Being added to all email templates |
| Email opt-out categories | ✅ Complete | 5 categories + master kill switch |
| Consent audit trail API | ✅ Complete | `consent.service.ts` |
| Password hashing (Argon2id) | ✅ Complete | OWASP 2024 recommended |
| HttpOnly/Secure/SameSite cookies | ✅ Complete | All auth cookies |
| CSRF protection | ✅ Complete | Token-based |
| Account lockout | ✅ Complete | After 5 failed attempts |
| Rate limiting | ✅ Complete | Auth endpoints |
| Sentry data sanitisation | ✅ Complete | Cookies filtered from error reports |

---

## 7. GDPR Gaps & Improvement Recommendations

### 🔴 High Priority

#### 7.1 No Automated Data Deletion / Right to Erasure Implementation
**Current state**: Account deletion sets `status = 'deleted'` and `deleted_at` timestamp (soft delete). No cascade to anonymise/delete associated data across all tables.

**Recommendation**:
- Implement a `deleteUserData()` service that:
  - Anonymises `users` record (hash email, clear names)
  - Deletes or anonymises `auth_audit_logs`, `refresh_tokens`
  - Cascades to `audit_jobs` (most CASCADE via FK, but verify)
  - Removes from `email_sends`, `crm_triggers`
  - Clears `referrals` referrer/referred personal data
  - Logs the deletion request in an immutable audit log
- Add a "Delete My Account" button in user settings
- Provide 30-day grace period before permanent deletion
- Send confirmation email before and after deletion

#### 7.2 No Data Export / Right to Portability
**Current state**: Users can export individual audit reports (PDF/CSV) but cannot export all their personal data.

**Recommendation**:
- Implement a "Download My Data" feature that exports:
  - Account profile (JSON)
  - All audit jobs and findings (JSON/CSV)
  - Email preferences
  - Consent records
  - API key metadata (not the keys themselves)
  - Organisation membership details
- Format: ZIP file containing JSON files
- Add to user settings page
- Rate limit to 1 export per 24 hours

#### 7.3 Cold Prospects Need Legitimate Interest Assessment
**Current state**: The `cold_prospects` table scrapes contact information from newly registered domains. No documented Legitimate Interest Assessment (LIA).

**Recommendation**:
- Document a formal LIA for cold outreach
- Add an unsubscribe mechanism for cold prospect emails
- Implement auto-deletion of cold prospects who don't engage within 6 months
- Add opt-out list (`cold_prospect_unsubscribes` table exists — verify it's enforced)
- Consider whether this feature needs explicit consent rather than legitimate interest

#### 7.4 Privacy Policy Inaccuracy — Password Hashing
**Current state**: Privacy policy states "Passwords hashed using bcrypt" but code uses **Argon2id**.

**Recommendation**: Update privacy policy to say "Passwords hashed using industry-standard algorithms" (or specifically Argon2id). Being vague about the specific algorithm is actually fine for a public-facing policy.

### 🟡 Medium Priority

#### 7.5 No Automated Data Retention Enforcement
**Current state**: Retention periods are documented but not enforced via automated jobs.

**Recommendation**:
- Create a scheduled job (BullMQ) that runs daily/weekly to:
  - Delete expired audit data based on tier limits
  - Purge auth audit logs older than 1 year
  - Clean up API request logs older than 90 days
  - Anonymise email send logs older than 1 year
  - Remove expired coming_soon_signups

#### 7.6 No Data Processing Agreement (DPA) Registry
**Current state**: Third-party processor list is not documented or tracked.

**Recommendation**:
- Create and maintain a DPA registry documenting:
  - Each processor, what data they receive, DPA status, review date
  - Stripe, Resend, Sentry, hosting provider, Google CSE
- Store as a living document (could be in `/docs/dpa-registry.md`)

#### 7.7 Missing Data Processing Records (GDPR Art. 30)
**Current state**: No formal Record of Processing Activities (ROPA).

**Recommendation**:
- Create ROPA document covering:
  - Each processing activity, purpose, lawful basis, categories of data subjects
  - Categories of personal data, recipients, transfers to third countries
  - Retention periods, security measures
- This document serves as evidence of compliance

#### 7.8 Email Open/Click Tracking Lacks Transparency
**Current state**: `email_sends` tracks `opened_at` and `clicked_at` via Resend webhooks. This isn't clearly disclosed in the privacy policy.

**Recommendation**:
- Add explicit mention of email engagement tracking in the privacy policy
- Consider making this opt-out-able (though it's standard practice)
- Ensure tracking pixels respect email preference settings

#### 7.9 No Cookie Consent Re-prompt on Policy Changes
**Current state**: Cookie consent version is tracked but users aren't re-prompted when the consent version changes.

**Recommendation**:
- When `COOKIE_CONSENT_VERSION` is incremented, clear existing consent and re-show the banner
- The infrastructure for this exists in `CookieConsentContext.tsx` — just needs the version check logic

### 🟢 Low Priority

#### 7.10 No Breach Notification Process
**Current state**: No documented data breach response plan.

**Recommendation**:
- Document a breach notification procedure:
  - Internal escalation within 24 hours
  - ICO notification within 72 hours (GDPR Art. 33)
  - User notification "without undue delay" if high risk (GDPR Art. 34)
- Consider adding an admin dashboard for breach management

#### 7.11 Device Fingerprinting Transparency
**Current state**: `device_fingerprint` is collected in auth logs and refresh tokens. Not explicitly mentioned in privacy policy.

**Recommendation**:
- Add mention of device fingerprinting to the privacy policy under "Usage Data" or "Security"
- Clarify it's used for session security, not tracking

#### 7.12 No Data Protection Officer (DPO) Designation
**Current state**: No DPO mentioned. For most SaaS startups this isn't legally required unless processing data at large scale or handling special categories.

**Recommendation**:
- Assess whether a DPO is required based on processing scale
- At minimum, designate a privacy point of contact
- Add contact details to the privacy policy

#### 7.13 IP Address Logging Review
**Current state**: IP addresses are logged in 10+ tables (auth logs, consent logs, referrals, API requests, bug reports, organisation audit logs, etc.).

**Recommendation**:
- Audit whether all IP logging is necessary and proportionate
- Consider truncating IPs (e.g., zeroing last octet) after a retention period for non-security tables
- Document the purpose for each IP collection point

---

## 8. Privacy Policy Page Recommendations

The existing privacy policy at `/client/src/pages/public/Privacy.tsx` is solid but needs these updates:

### 8.1 Content Updates Needed

1. **Fix password hashing reference** (Section 10): Change "bcrypt" to "industry-standard hashing algorithms" or "Argon2id"

2. **Add email tracking disclosure** (new subsection under Section 4):
   ```
   We track email delivery, opens, and clicks to measure the effectiveness
   of our communications. You can opt out of non-essential emails via your
   email preferences or the unsubscribe link in any email.
   ```

3. **Add device fingerprinting disclosure** (Section 2, Usage Data):
   ```
   We generate device fingerprints from your browser and device characteristics
   to detect unauthorised access to your account. These are not used for
   cross-site tracking.
   ```

4. **Add lead scoring disclosure** (new subsection under Section 4):
   ```
   We analyse your usage patterns (such as login frequency, audits run, and
   features used) to understand engagement and improve our service. This
   analysis may influence the communications we send you.
   ```

5. **Add API usage data disclosure** (Section 2):
   ```
   If you use our API, we log request metadata including endpoints accessed,
   IP addresses, response times, and request counts for security and usage
   monitoring.
   ```

6. **Add referral data disclosure** (Section 2):
   ```
   If you participate in our referral programme, we collect referral codes and
   IP addresses to prevent fraud and track reward eligibility.
   ```

7. **Name specific sub-processors** (Section 6):
   ```
   Our current sub-processors include:
   - Stripe (payment processing, USA)
   - Resend (email delivery, USA)
   - Sentry (error monitoring, USA)
   ```

8. **Add international transfers section**:
   ```
   Your data may be transferred to and processed in countries outside the UK/EEA,
   including the United States. We ensure appropriate safeguards are in place,
   such as Standard Contractual Clauses (SCCs), for any such transfers.
   ```

9. **Add automated decision-making disclosure** (GDPR Art. 22):
   ```
   We do not make decisions based solely on automated processing that produce
   legal effects or similarly significantly affect you. Our lead scoring is
   used only to personalise communications, not to restrict access to features.
   ```

10. **Update data retention section** to be more specific about auth logs, API logs, and consent records

### 8.2 Structural Improvements

- Add a "Last Updated" date that auto-updates
- Add a table of contents with anchor links for easy navigation
- Add a "Summary" section at the top in plain language
- Consider adding a "Changes from Previous Version" section when updated
- Add the specific contact email address rather than just linking to /contact
- Add the data protection supervisory authority (ICO for UK) contact details

---

## 9. Implementation Priority

### Phase 1 — Critical (Do First)
1. ~~Add unsubscribe link to all emails~~ *(In Progress)*
2. Implement "Delete My Account" with full data cascade
3. Fix privacy policy inaccuracies (bcrypt → Argon2id, add missing disclosures)
4. Add "Download My Data" export feature
5. Document cold prospect LIA or switch to consent basis

### Phase 2 — Important (Do Next)
6. Implement automated data retention jobs
7. Create DPA registry document
8. Create Record of Processing Activities (ROPA)
9. Add email tracking opt-out transparency
10. Implement cookie consent re-prompt on version change

### Phase 3 — Good Practice (When Possible)
11. Document breach notification procedure
12. Add device fingerprinting to privacy policy
13. Review and minimise IP address logging
14. Designate privacy point of contact / DPO assessment
15. Add international data transfer documentation

---

## Appendix: Complete Table List (PII Summary)

| Table | Contains PII | PII Fields |
|-------|-------------|------------|
| `users` | Yes | email, first_name, last_name, company_name, last_login_ip |
| `refresh_tokens` | Yes | ip_address, user_agent, device_fingerprint |
| `email_verification_tokens` | Yes | used_ip |
| `auth_audit_logs` | Yes | ip_address, user_agent, device_fingerprint |
| `rate_limit_records` | Yes | identifier (when IP or email) |
| `audit_jobs` | Indirect | target_url (publicly accessible, not PII per se) |
| `audit_pages` | No | Public web content only |
| `audit_findings` | No | Public web content only |
| `crawl_queue` | No | URLs only |
| `audit_schedules` | Indirect | user_id |
| `audit_assets` | No | Public asset URLs |
| `organizations` | Minimal | name (org name) |
| `organization_members` | Yes | user_id, invited_by |
| `organization_invitations` | Yes | email |
| `subscriptions` | Yes | stripe_customer_id, stripe_subscription_id |
| `tier_limits` | No | Configuration only |
| `organization_domains` | Minimal | added_by |
| `usage_records` | No | Aggregate counts only |
| `organization_audit_log` | Yes | user_id, ip_address, user_agent |
| `sites` | Minimal | created_by |
| `site_known_pages` | No | Public URLs |
| `api_keys` | Yes | last_used_ip |
| `api_requests` | Yes | ip_address, user_agent |
| `email_templates` | No | Template content only |
| `email_sends` | Yes | to_email, user_id, variables |
| `email_preferences` | Indirect | user_id |
| `email_campaigns` | No | Aggregate data |
| `blog_posts` | Minimal | author_name |
| `blog_post_revisions` | Minimal | changed_by |
| `blog_media` | Minimal | uploaded_by |
| `crm_triggers` | Yes | user_id, context |
| `bug_reports` | Yes | user_id, user_agent, browser_info, screenshots |
| `bug_report_comments` | Indirect | user_id |
| `feature_requests` | Yes | user_id, user_agent, browser_info |
| `feature_request_comments` | Indirect | user_id |
| `audit_consent_log` | Yes | user_id, ip_address, user_agent |
| `user_consents` | Yes | user_id, ip_address, user_agent |
| `cookie_consent_logs` | Yes | user_id, ip_address, user_agent |
| `announcements` | No | Content only |
| `announcement_dismissals` | Indirect | user_id |
| `referrals` | Yes | referrer_ip, referred_ip |
| `referral_rewards` | Indirect | user_id |
| `referral_config` | No | Configuration only |
| `cold_prospects` | Yes | contact_email, contact_name, contact_role, emails |
| `cold_prospect_settings` | No | Configuration only |
| `coming_soon_signups` | Yes | email, name, ip_address |
| `page_seo` | No | SEO metadata only |
| `system_settings` | No | Configuration only |
