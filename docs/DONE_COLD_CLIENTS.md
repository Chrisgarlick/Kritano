# Cold Clients — New Domain Discovery & Outreach Pipeline

## Overview

Build an automated pipeline that discovers newly registered domains, checks if they have live websites, extracts contact emails, and feeds them into Kritano's existing CRM/campaign system for cold outreach. The goal: find businesses that just launched a website (and likely haven't thought about accessibility/SEO yet) and offer them a free audit.

## Key Decisions

1. **Data source**: WhoisDS free daily NRD (Newly Registered Domains) feed — `.csv.gz` files, ~100k+ domains/day
2. **Storage**: New `cold_prospects` table (separate from `users` — these are NOT users yet)
3. **Processing**: New worker service running in the existing `worker.ts` process
4. **Email extraction**: Scrape live sites for contact emails + check common patterns (info@, hello@, contact@)
5. **Outreach**: Feed qualified prospects into the existing email campaign system via a new `cold_outreach` campaign segment
6. **Admin UI**: New "Cold Prospects" section in admin panel for managing the pipeline

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  NRD Feed Poller │────▶│  Domain Checker   │────▶│  Email Extractor │
│  (daily cron)    │     │  (HTTP + DNS)     │     │  (scrape + guess)│
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │  Prospect Store   │
                                                  │  (cold_prospects) │
                                                  └──────────────────┘
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │  Campaign System  │
                                                  │  (existing)       │
                                                  └──────────────────┘
```

---

## Database Changes

### New Table: `cold_prospects`

```sql
CREATE TABLE cold_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) NOT NULL,
  tld VARCHAR(20) NOT NULL,                    -- .com, .co.uk, etc.
  registered_at DATE,                           -- From NRD feed

  -- Discovery status
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
    -- pending → checking → live → extracting → qualified → contacted → converted → dead

  -- Site check results
  is_live BOOLEAN DEFAULT FALSE,
  http_status INTEGER,
  has_ssl BOOLEAN,
  title VARCHAR(500),
  meta_description TEXT,
  technology_stack JSONB DEFAULT '[]',          -- Detected CMS/frameworks
  page_count_estimate INTEGER,                  -- From sitemap/links

  -- Contact extraction
  emails JSONB DEFAULT '[]',                    -- [{email, source, confidence}]
  contact_page_url VARCHAR(500),
  has_contact_form BOOLEAN DEFAULT FALSE,
  social_links JSONB DEFAULT '{}',              -- {twitter, linkedin, facebook, etc.}

  -- Qualification scoring
  quality_score INTEGER DEFAULT 0,              -- 0-100 based on site quality signals
  business_type VARCHAR(50),                    -- ecommerce, saas, blog, portfolio, etc.
  country VARCHAR(5),                           -- From TLD or IP geolocation
  language VARCHAR(10),                         -- Detected language

  -- Outreach tracking
  campaign_id UUID REFERENCES email_campaigns(id),
  email_sent_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  email_clicked_at TIMESTAMPTZ,
  converted_user_id UUID REFERENCES users(id),  -- If they sign up

  -- Filtering / dedup
  batch_date DATE NOT NULL,                     -- Which NRD feed day
  source VARCHAR(50) DEFAULT 'whoisds',         -- Feed source

  -- Exclusions
  is_excluded BOOLEAN DEFAULT FALSE,            -- Manually excluded
  exclusion_reason VARCHAR(100),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_cold_prospects_domain UNIQUE(domain)
);

-- Indexes
CREATE INDEX idx_cold_prospects_status ON cold_prospects(status);
CREATE INDEX idx_cold_prospects_batch ON cold_prospects(batch_date);
CREATE INDEX idx_cold_prospects_quality ON cold_prospects(quality_score DESC) WHERE status = 'qualified';
CREATE INDEX idx_cold_prospects_tld ON cold_prospects(tld);
```

### New Table: `cold_prospect_settings`

```sql
CREATE TABLE cold_prospect_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings
INSERT INTO cold_prospect_settings (key, value) VALUES
  ('target_tlds', '["com", "co.uk", "org.uk", "uk", "io", "co", "net"]'),
  ('excluded_keywords', '["casino", "poker", "xxx", "porn", "gambling", "crypto", "nft"]'),
  ('min_quality_score', '30'),
  ('daily_check_limit', '500'),
  ('daily_email_limit', '50'),
  ('auto_outreach_enabled', 'false'),
  ('last_feed_date', 'null');
```

---

## Backend Changes

### 1. NRD Feed Service (`server/src/services/cold-prospect/nrd-feed.service.ts`)

Responsible for downloading and parsing the daily NRD feed.

```
Functions:
- downloadDailyFeed(date: Date): Promise<string>
    → Downloads .csv.gz from WhoisDS, extracts to temp file
    → Returns path to extracted CSV

- parseFeed(filePath: string, targetTlds: string[]): Promise<string[]>
    → Streams CSV, filters by target TLDs
    → Excludes domains matching excluded keywords
    → Returns filtered domain list

- importDomains(domains: string[], batchDate: Date): Promise<{imported: number, duplicates: number}>
    → Bulk inserts into cold_prospects with status='pending'
    → Skips duplicates (ON CONFLICT DO NOTHING)
```

### 2. Domain Checker Service (`server/src/services/cold-prospect/domain-checker.service.ts`)

Checks if domains have live websites and gathers basic info.

```
Functions:
- checkDomain(domain: string): Promise<DomainCheckResult>
    → DNS resolution check
    → HTTP/HTTPS request (follow redirects)
    → Capture: status code, SSL, page title, meta description
    → Detect technology stack (check meta generators, script tags, headers)
    → Estimate page count from sitemap.xml or internal links
    → Detect language from html lang attr or content
    → Returns DomainCheckResult

- processPendingBatch(limit: number): Promise<void>
    → Claims batch of 'pending' prospects (FOR UPDATE SKIP LOCKED)
    → Sets status='checking'
    → Runs checkDomain() for each with concurrency limit (5 at a time)
    → Updates prospect with results
    → Sets status='live' if site responds, 'dead' if not

- calculateQualityScore(prospect: ColdProspect): number
    → Score based on:
      +20 has SSL
      +15 has real title (not default/parked)
      +15 has meta description
      +10 has sitemap
      +10 has multiple pages (5+)
      +10 detected CMS (WordPress, Shopify, etc.)
      +10 English language
      +10 relevant TLD (.co.uk, .com)
      -50 parked domain signals (GoDaddy parking, Sedo, etc.)
      -30 under construction / coming soon
```

### 3. Email Extractor Service (`server/src/services/cold-prospect/email-extractor.service.ts`)

Finds contact emails from live websites.

```
Functions:
- extractEmails(domain: string): Promise<EmailExtractionResult>
    → Check common email patterns against MX records:
      info@, hello@, contact@, admin@, enquiries@, sales@
    → Scrape homepage for mailto: links
    → Find and scrape /contact, /about, /contact-us pages
    → Parse social media links
    → Check for contact forms
    → Returns {emails: [{email, source, confidence}], contactPageUrl, hasContactForm, socialLinks}

- processLiveBatch(limit: number): Promise<void>
    → Claims batch of 'live' prospects (FOR UPDATE SKIP LOCKED)
    → Sets status='extracting'
    → Runs extractEmails() for each
    → Updates prospect with results
    → Sets status='qualified' if has email(s), stays 'live' if no email found

- verifyEmail(email: string): Promise<{valid: boolean, reason?: string}>
    → MX record check
    → SMTP handshake (RCPT TO) without sending — optional, can be aggressive
    → For MVP: just MX check is fine
```

### 4. Cold Prospect Worker (`server/src/services/queue/cold-prospect-worker.service.ts`)

Orchestrates the pipeline, runs inside `worker.ts`.

```
Polling intervals:
- NRD feed download: Once daily at 06:00 UTC (feeds published ~04:00 UTC)
- Domain checking: Every 5 minutes, batch of 50
- Email extraction: Every 5 minutes, batch of 20
- Auto-outreach: Every hour (if enabled)

Functions:
- start(): void — starts all polling loops
- stop(): void — graceful shutdown
- pollNrdFeed(): Promise<void> — check if today's feed is available, download + import
- pollDomainChecker(): Promise<void> — process pending domains
- pollEmailExtractor(): Promise<void> — process live domains
- pollAutoOutreach(): Promise<void> — create campaign sends for qualified prospects
```

### 5. Cold Prospect Admin Service (`server/src/services/cold-prospect/cold-prospect-admin.service.ts`)

Admin CRUD and analytics.

```
Functions:
- getProspects(filters): Promise<{prospects, total}>
    → Paginated list with filters: status, tld, minScore, batchDate, search

- getProspect(id): Promise<ColdProspect>
    → Full prospect detail

- getStats(): Promise<ColdProspectStats>
    → Pipeline funnel: pending → checking → live → qualified → contacted → converted
    → Daily intake stats, conversion rates

- excludeProspect(id, reason): Promise<void>
    → Mark as excluded

- bulkExclude(ids, reason): Promise<void>
    → Bulk exclude

- retryProspect(id): Promise<void>
    → Reset status to 'pending' for reprocessing

- getSettings(): Promise<ColdProspectSettings>
- updateSettings(settings): Promise<void>

- createOutreachCampaign(filters): Promise<Campaign>
    → Creates email campaign targeting qualified prospects
    → Uses cold_outreach email template
    → Inserts into email_sends linked to campaign
```

### 6. API Routes (`server/src/routes/admin/cold-prospects.ts`)

```
GET    /api/admin/cold-prospects              — list with filters + pagination
GET    /api/admin/cold-prospects/stats         — pipeline funnel stats
GET    /api/admin/cold-prospects/settings      — get pipeline settings
PUT    /api/admin/cold-prospects/settings      — update settings
GET    /api/admin/cold-prospects/:id           — prospect detail
DELETE /api/admin/cold-prospects/:id           — exclude prospect
POST   /api/admin/cold-prospects/:id/retry     — reprocess prospect
POST   /api/admin/cold-prospects/bulk-exclude  — bulk exclude
POST   /api/admin/cold-prospects/campaign      — create outreach campaign
POST   /api/admin/cold-prospects/import        — manual CSV import (fallback)
```

---

## Frontend Changes

### New Admin Pages

#### 1. Cold Prospects Dashboard (`client/src/pages/admin/cold-prospects/ColdProspectsDashboard.tsx`)

- **Pipeline funnel visualisation**: pending → live → qualified → contacted → converted (with counts + percentages)
- **Daily intake chart**: Domains imported per day (last 30 days)
- **Conversion metrics**: contacted → opened → clicked → signed up
- **Quick stats cards**: Total prospects, qualified today, emails found today, conversion rate
- **Pipeline settings panel**: Target TLDs, excluded keywords, daily limits, auto-outreach toggle

#### 2. Prospects List (`client/src/pages/admin/cold-prospects/ColdProspectsList.tsx`)

- **Table view** with columns: Domain, TLD, Status, Quality Score, Emails Found, Tech Stack, Registered Date, Actions
- **Filters**: Status dropdown, TLD filter, quality score range, date range, search
- **Bulk actions**: Exclude selected, create campaign from selected
- **Row click** → detail view
- **Export**: CSV export of filtered prospects

#### 3. Prospect Detail (`client/src/pages/admin/cold-prospects/ColdProspectDetail.tsx`)

- Domain info card: domain, TLD, registered date, SSL, live status
- Site preview: title, description, detected tech stack
- Contact info: emails (with source + confidence), social links, contact form status
- Quality score breakdown
- Outreach history: emails sent, opens, clicks
- Actions: retry processing, exclude, send manual outreach

### Sidebar Addition

Add "Cold Prospects" under the admin CRM section in the sidebar with a target/crosshair icon.

### New Components

- `ProspectFunnelChart.tsx` — Pipeline funnel visualisation
- `ProspectSettingsPanel.tsx` — Settings form
- `ProspectTable.tsx` — Reusable table for prospect listing

---

## Types (`server/src/types/cold-prospect.types.ts`)

```typescript
export interface ColdProspect {
  id: string;
  domain: string;
  tld: string;
  registered_at: string | null;
  status: ColdProspectStatus;
  is_live: boolean;
  http_status: number | null;
  has_ssl: boolean;
  title: string | null;
  meta_description: string | null;
  technology_stack: string[];
  page_count_estimate: number | null;
  emails: ProspectEmail[];
  contact_page_url: string | null;
  has_contact_form: boolean;
  social_links: Record<string, string>;
  quality_score: number;
  business_type: string | null;
  country: string | null;
  language: string | null;
  campaign_id: string | null;
  email_sent_at: string | null;
  email_opened_at: string | null;
  email_clicked_at: string | null;
  converted_user_id: string | null;
  batch_date: string;
  source: string;
  is_excluded: boolean;
  exclusion_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type ColdProspectStatus =
  | 'pending' | 'checking' | 'live' | 'extracting'
  | 'qualified' | 'contacted' | 'converted' | 'dead';

export interface ProspectEmail {
  email: string;
  source: 'mailto' | 'page_scrape' | 'pattern_guess' | 'whois';
  confidence: 'high' | 'medium' | 'low';
}

export interface DomainCheckResult {
  isLive: boolean;
  httpStatus: number | null;
  hasSsl: boolean;
  title: string | null;
  metaDescription: string | null;
  technologyStack: string[];
  pageCountEstimate: number | null;
  language: string | null;
  isParked: boolean;
}

export interface EmailExtractionResult {
  emails: ProspectEmail[];
  contactPageUrl: string | null;
  hasContactForm: boolean;
  socialLinks: Record<string, string>;
}

export interface ColdProspectFilters {
  status?: ColdProspectStatus;
  tld?: string;
  minScore?: number;
  maxScore?: number;
  batchDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ColdProspectStats {
  total: number;
  byStatus: Record<ColdProspectStatus, number>;
  todayImported: number;
  todayQualified: number;
  todayContacted: number;
  conversionRate: number;
  avgQualityScore: number;
}

export interface ColdProspectSettings {
  targetTlds: string[];
  excludedKeywords: string[];
  minQualityScore: number;
  dailyCheckLimit: number;
  dailyEmailLimit: number;
  autoOutreachEnabled: boolean;
  lastFeedDate: string | null;
}
```

---

## Critical Files Summary

| File | Purpose |
|------|---------|
| `server/src/db/migrations/074_cold_prospects.sql` | Database tables |
| `server/src/types/cold-prospect.types.ts` | TypeScript types |
| `server/src/services/cold-prospect/nrd-feed.service.ts` | NRD feed download + parse |
| `server/src/services/cold-prospect/domain-checker.service.ts` | Live site checking |
| `server/src/services/cold-prospect/email-extractor.service.ts` | Email extraction |
| `server/src/services/cold-prospect/cold-prospect-admin.service.ts` | Admin CRUD + analytics |
| `server/src/services/queue/cold-prospect-worker.service.ts` | Pipeline orchestrator |
| `server/src/routes/admin/cold-prospects.ts` | API routes |
| `server/src/worker.ts` | Register worker (modify) |
| `server/src/routes/admin/index.ts` | Mount routes (modify) |
| `client/src/pages/admin/cold-prospects/ColdProspectsDashboard.tsx` | Dashboard page |
| `client/src/pages/admin/cold-prospects/ColdProspectsList.tsx` | List page |
| `client/src/pages/admin/cold-prospects/ColdProspectDetail.tsx` | Detail page |
| `client/src/services/api.ts` | API client (modify) |
| `client/src/components/layout/Sidebar.tsx` | Add nav item (modify) |
| `client/src/App.tsx` | Add routes (modify) |

---

## Testing Plan

1. **NRD Feed Service**: Mock HTTP downloads, test CSV parsing with sample data, test TLD filtering, test keyword exclusion
2. **Domain Checker**: Mock DNS/HTTP, test live detection, test parked domain detection, test quality scoring
3. **Email Extractor**: Mock HTTP responses, test mailto parsing, test contact page discovery, test MX verification
4. **Worker**: Test polling loops, test batch claiming with concurrency, test graceful shutdown
5. **API Routes**: Test all CRUD endpoints, test auth (admin-only), test pagination + filters
6. **Integration**: End-to-end test with sample NRD data through full pipeline

---

## Implementation Order

1. **Database migration** — Create tables
2. **Types** — Define TypeScript interfaces
3. **NRD Feed Service** — Download + parse feeds
4. **Domain Checker Service** — Check live sites + quality scoring
5. **Email Extractor Service** — Find contact emails
6. **Cold Prospect Admin Service** — CRUD + stats
7. **Worker** — Orchestrate pipeline polling
8. **API Routes** — Admin endpoints
9. **Frontend API client** — Add cold prospect API calls
10. **Dashboard page** — Pipeline funnel + stats
11. **List page** — Prospects table with filters
12. **Detail page** — Individual prospect view
13. **Sidebar + routing** — Wire up navigation

---

## Email Template

Create a `cold_outreach_free_audit` email template:

**Subject**: "Your new website — free accessibility & SEO audit"

**Concept**: Congratulate them on their new site, offer a free audit (Kritano free tier), highlight what they'd learn (accessibility issues, SEO gaps, security checks). Soft CTA — not salesy, genuinely helpful. Position as "we noticed you just launched, here's something that could help."

The template should be added to the email_templates table as a system template with category `cold_outreach`.

---

## Legal / Compliance Notes

- Only email addresses found publicly on websites (not purchased lists)
- Include unsubscribe link in all outreach (handled by existing email system)
- Comply with UK GDPR / PECR: legitimate interest basis for B2B cold outreach
- Respect robots.txt when scraping (do not scrape pages disallowed by robots.txt)
- Rate limit scraping: max 1 request/second per domain, 5 concurrent domains
- Store consent evidence: the publicly available email + source page URL
- Add clear "how we found you" explanation in email footer
