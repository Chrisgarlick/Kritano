# Google API Integrations Plan

**Status:** Planning | **Priority:** High

---

## 1. PageSpeed Insights API

**Impact:** High | **Effort:** Low | **Auth:** API key only (no OAuth)

### What it does
Returns real Lighthouse scores (Performance, Accessibility, SEO, Best Practices) for any URL, plus Core Web Vitals (LCP, FID, CLS, TTFB) from Chrome User Experience Report (CrUX) field data.

### Why it matters
- Google's own performance assessment -- the scores that actually affect rankings
- Field data from real Chrome users, not just lab data
- Complements our existing audit with Google's perspective
- Users can compare our findings with what Google sees

### Implementation
- **API:** `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`
- **Auth:** API key in query param (`?key=YOUR_KEY`), no OAuth needed
- **Rate limit:** 25,000 requests/day free, 400 per 100 seconds
- **Cost:** Free

### Integration points
- Run alongside each audit for every crawled page (or top N pages per tier)
- Add a "Google Score" card to the audit detail page
- Store scores in a `pagespeed_results` table linked to audit_jobs
- Show Core Web Vitals (field data) vs our lab measurements
- Trend over time: "Your performance score improved from 45 to 72"

### Database changes
```sql
CREATE TABLE pagespeed_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_job_id UUID REFERENCES audit_jobs(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  performance_score NUMERIC(5,2),
  accessibility_score NUMERIC(5,2),
  seo_score NUMERIC(5,2),
  best_practices_score NUMERIC(5,2),
  lcp_ms INTEGER,
  fid_ms INTEGER,
  cls NUMERIC(6,4),
  ttfb_ms INTEGER,
  field_data JSONB,
  lab_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pagespeed_audit ON pagespeed_results(audit_job_id);
```

### Tier limits
- Free: Homepage only (1 page per audit)
- Starter: Top 5 pages
- Pro: Top 25 pages
- Agency: Top 100 pages
- Enterprise: All crawled pages

---

## 2. Google Analytics Data API (GA4)

**Impact:** High | **Effort:** Medium | **Auth:** OAuth (same flow as GSC)

### What it does
Pulls GA4 traffic data: sessions, users, pageviews, bounce rate, engagement time, traffic sources, conversions -- all per page.

### Why it matters
- Users can see which pages get the most traffic alongside audit findings
- Prioritise fixes by business impact: "This page has 12 issues AND gets 50k visits/month"
- Agencies can show clients the ROI of fixing issues
- Traffic trends before/after fixes prove value

### Implementation
- **API:** Google Analytics Data API v1 (`analyticsdata.googleapis.com`)
- **Auth:** OAuth 2.0 with scope `https://www.googleapis.com/auth/analytics.readonly`
- **Rate limit:** 10,000 requests/day per project
- **Cost:** Free

### Integration points
- Same connect flow as GSC (OAuth, select property, store tokens)
- Add traffic data to audit findings: "Pages with issues sorted by traffic"
- Dashboard widget: traffic overview alongside audit scores
- Sync daily (same pattern as GSC background worker)
- "Impact Score" = severity x traffic volume (prioritisation metric)

### Database changes
```sql
CREATE TABLE ga_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  google_email TEXT NOT NULL,
  ga_property_id TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  sync_status TEXT DEFAULT 'pending',
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id)
);

CREATE TABLE ga_page_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES ga_connections(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  date DATE NOT NULL,
  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  pageviews INTEGER DEFAULT 0,
  avg_engagement_time NUMERIC(8,2),
  bounce_rate NUMERIC(5,4),
  UNIQUE(connection_id, page_path, date)
);
CREATE INDEX idx_ga_page_date ON ga_page_data(connection_id, date);
```

### Tier limits
- Free: Not available
- Starter: 1 property, 30 days retention
- Pro: 3 properties, 90 days
- Agency: 50 properties, 365 days
- Enterprise: Unlimited

---

## 3. Indexing API

**Impact:** Medium | **Effort:** Low | **Auth:** Service account OR OAuth

### What it does
Requests Google to crawl/recrawl specific URLs. Normally used for job postings and livestream content, but works as a "nudge" for any URL.

### Why it matters
- After fixing audit issues, users can request Google to recrawl immediately
- "Fix and reindex" workflow -- massive value for agencies
- Shows proactive value: "We found issues, fixed them, AND told Google to check again"
- Differentiator: most audit tools just report problems, this helps solve them

### Implementation
- **API:** `https://indexing.googleapis.com/v3/urlNotifications:publish`
- **Auth:** Service account (simpler) or OAuth with scope `https://www.googleapis.com/auth/indexing`
- **Rate limit:** 200 requests/day per site
- **Cost:** Free
- **Caveat:** Google says this is for JobPosting/BroadcastEvent schema, but URL_UPDATED notifications work for any URL. Use responsibly.

### Integration points
- "Request Re-indexing" button on audit detail page (per-page or bulk)
- Auto-suggest after fixes: "You fixed 8 issues on this page. Request Google to recrawl?"
- Track request status in DB
- Rate limit per site (max 200/day) with clear UI feedback

### Database changes
```sql
CREATE TABLE indexing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  page_url TEXT NOT NULL,
  request_type TEXT DEFAULT 'URL_UPDATED',
  status TEXT DEFAULT 'sent',
  google_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_indexing_site_date ON indexing_requests(site_id, created_at);
```

### Tier limits
- Free: Not available
- Starter: 10 requests/month
- Pro: 50 requests/month
- Agency: 200 requests/month per site
- Enterprise: 200 requests/day per site

---

## 4. Safe Browsing API

**Impact:** Medium | **Effort:** Low | **Auth:** API key only (no OAuth)

### What it does
Checks URLs against Google's database of unsafe sites: malware, social engineering, unwanted software, potentially harmful applications.

### Why it matters
- Adds a critical security signal to audits
- If a site is flagged, it's a "drop everything" priority
- Chrome shows scary interstitial warnings for flagged sites -- users need to know
- Builds trust in Kritano's security category

### Implementation
- **API:** Safe Browsing Lookup API v4 (`safebrowsing.googleapis.com`)
- **Auth:** API key only
- **Rate limit:** 10,000 requests/day free
- **Cost:** Free
- **Batch support:** Up to 500 URLs per request

### Integration points
- Run during every audit as part of the security engine
- Check the domain + all crawled pages in a batch request
- Add "Google Safe Browsing" finding to security category
- If flagged: Critical severity finding with remediation steps
- If clean: Show a "Google Safe Browsing: Clean" badge (trust signal)

### Database changes
None needed -- store as a regular audit finding in `audit_findings` table:
- `check_type: 'safe-browsing'`
- `severity: 'critical'` if flagged
- `details` JSON with threat types

### Tier limits
- All tiers: included (it's a security essential)

---

## Implementation Order

| Priority | API | Effort | Impact | Dependencies |
|----------|-----|--------|--------|-------------|
| 1 | PageSpeed Insights | 2-3 days | High | API key only, no OAuth |
| 2 | Safe Browsing | 1 day | Medium | API key only, bolt onto security engine |
| 3 | Google Analytics | 5-7 days | High | OAuth (same pattern as GSC) |
| 4 | Indexing API | 2-3 days | Medium | Service account setup |

### Recommended approach
1. **PageSpeed + Safe Browsing first** -- both are API-key-only, no OAuth complexity, can ship fast
2. **GA4 next** -- reuse the GSC OAuth pattern, biggest user value after PageSpeed
3. **Indexing API last** -- nice differentiator but lower priority

### Setup required
1. Enable each API in Google Cloud Console (APIs & Services > Library)
2. Create an API key for PageSpeed + Safe Browsing (Credentials > Create > API Key)
3. Restrict the API key to only those two APIs
4. Add `GOOGLE_API_KEY` to server/.env
5. GA4 and Indexing reuse existing OAuth credentials

---

## Revenue impact

These integrations strengthen the value proposition at every tier:

- **Free tier** gets a taste of Google scores (1 page PageSpeed + Safe Browsing)
- **Paid tiers** get the full picture: audit findings + Google scores + traffic data + reindexing
- **Agency tier** becomes essential: "audit, fix, prove impact, reindex" is a complete workflow
- **Enterprise** gets everything at scale

The "Impact Score" (issues x traffic) is a potential unique selling point that competitors like Ahrefs and SEMrush don't combine this way.
