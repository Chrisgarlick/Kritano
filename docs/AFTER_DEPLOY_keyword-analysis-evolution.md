# Keyword Analysis Evolution Plan

## Overview

Kritano currently has a strong on-page keyword analysis system: density scoring, 8-point placement checks, variation generation, stuffing detection, and integration into the CQS scoring engine. However, it operates entirely in isolation -- no external search data, no SERP intelligence, no competitive context. This plan outlines how to evolve keyword analysis from "is this keyword used correctly on the page?" to "is this the right keyword, how does it perform, and what opportunities are you missing?"

The goal: give users actionable keyword intelligence that rivals dedicated SEO tools, while staying true to Kritano's audit-first approach.

## Current State

### What Exists Today
- **Keyword density analysis** (optimal 1-2%, stuffing detection at >3%)
- **8-point placement checker**: title, H1, first paragraph, meta description, URL, alt text, last paragraph, variations
- **Keyword variation generation**: plurals, verb forms
- **CQS integration**: keyword rules mapped to quality/readability/structure sub-scores
- **Content type detection**: article, product, landing, documentation, blog
- **AEO nugget extraction**: definitions, summaries, FAQ answers
- **E-E-A-T scoring**: expertise, authoritativeness, trustworthiness signals

### What's Missing
- No search volume data
- No SERP position tracking
- No keyword difficulty/competition metrics
- No keyword suggestions or discovery
- No content gap analysis
- No competitor keyword comparison
- No historical keyword tracking
- No intent classification
- No topic clustering
- No internal linking recommendations based on keyword relationships
- No cannibalisation detection
- No trending keyword alerts

---

## Key Decisions

### 1. Data Source Strategy

There are several routes for acquiring keyword data. Each has trade-offs:

#### Option A: Google Search Console Integration (Recommended First Step)
- **What it gives**: Real impression/click/CTR/position data for keywords the site already ranks for
- **Cost**: Free (Google API)
- **Effort**: Medium -- OAuth flow + API integration
- **Value**: Extremely high. This is the user's actual data, not estimates
- **Limitations**: Only shows keywords you already appear for; no competitor data; 3-day data delay

#### Option B: Third-Party Keyword APIs
Several providers offer keyword data APIs:

| Provider | Search Volume | Difficulty | SERP Data | Cost | Notes |
|----------|:---:|:---:|:---:|------|-------|
| **DataForSEO** | Yes | Yes | Yes | ~$50-200/mo | Best price/feature ratio, pay-per-task |
| **SEMrush API** | Yes | Yes | Yes | $200+/mo | Enterprise-grade, expensive |
| **Ahrefs API** | Yes | Yes | Yes | $500+/mo | Best backlink data, very expensive |
| **Keywords Everywhere API** | Yes | Yes | No | ~$10/mo per 100K credits | Cheapest, limited features |
| **SerpApi / Serper.dev** | No | No | Yes | $50-75/mo | SERP scraping only |
| **Google Keyword Planner** (via Ads API) | Yes (ranges) | No | No | Free (with Ads account) | Ranges not exact, setup complex |

**Recommendation**: Start with **Google Search Console** (free, real data) + **DataForSEO** (affordable, comprehensive). DataForSEO charges per task (~$0.001-0.01 per request) rather than flat monthly, which aligns well with audit-based usage.

#### Option C: Build Our Own SERP Scraper
- Not recommended. Legal grey area, maintenance burden, easily blocked. Use APIs instead.

### 2. Architecture Decision: Keyword Data as Audit Module vs Standalone Feature

**Decision: Both.** Keywords should enhance audits (current model) AND exist as a standalone research tool.

- **Audit Mode**: When running an audit, keyword analysis enriches each page with search data
- **Research Mode**: Standalone keyword research tool for discovery, planning, and tracking -- independent of running an audit

### 3. Storage Strategy

Keyword data is temporal and voluminous. Strategy:
- **Search Console data**: Sync daily, store in dedicated tables with date partitioning
- **Keyword research results**: Cache for 7-30 days (search volumes don't change daily)
- **SERP snapshots**: Store with audit, historical comparison on re-audit
- **Rank tracking**: Dedicated time-series storage, daily checks for tracked keywords

---

## Database Changes

### New Tables

```sql
-- Google Search Console connection
CREATE TABLE gsc_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  google_account_email TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  gsc_property TEXT NOT NULL,  -- e.g., 'sc-domain:example.com'
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',  -- pending, syncing, complete, error
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(domain_id)
);

-- Search Console query data (synced daily)
CREATE TABLE gsc_query_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  page_url TEXT,
  date DATE NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(5,4) DEFAULT 0,
  position NUMERIC(5,2) DEFAULT 0,
  device TEXT,  -- mobile, desktop, tablet
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_gsc_query_domain_date ON gsc_query_data(domain_id, date);
CREATE INDEX idx_gsc_query_query ON gsc_query_data(domain_id, query);

-- Keyword research cache (from DataForSEO or similar)
CREATE TABLE keyword_research_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  location_code INTEGER,  -- DataForSEO location code
  language_code TEXT DEFAULT 'en',
  search_volume INTEGER,
  cpc NUMERIC(8,2),
  competition NUMERIC(5,4),  -- 0-1 scale
  competition_level TEXT,  -- low, medium, high
  keyword_difficulty INTEGER,  -- 0-100
  search_intent TEXT,  -- informational, navigational, commercial, transactional
  trend_data JSONB,  -- monthly search volume array (12 months)
  related_keywords JSONB,  -- array of related terms with volumes
  serp_features JSONB,  -- featured snippet, PAA, local pack, etc.
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days'
);
CREATE UNIQUE INDEX idx_krc_keyword_loc ON keyword_research_cache(keyword, location_code, language_code);

-- Tracked keywords (rank tracking)
CREATE TABLE tracked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  location_code INTEGER,
  language_code TEXT DEFAULT 'en',
  target_url TEXT,  -- expected landing page
  tags JSONB DEFAULT '[]',  -- user-defined grouping tags
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(domain_id, keyword, location_code)
);

-- Daily rank snapshots
CREATE TABLE keyword_rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_keyword_id UUID NOT NULL REFERENCES tracked_keywords(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  position INTEGER,  -- null = not ranking
  url TEXT,  -- actual ranking URL (for cannibalisation detection)
  serp_features JSONB,  -- which features appear for this SERP
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tracked_keyword_id, date)
);
CREATE INDEX idx_krh_keyword_date ON keyword_rank_history(tracked_keyword_id, date);

-- Keyword groups / topic clusters
CREATE TABLE keyword_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  pillar_page_url TEXT,  -- the main page for this topic cluster
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE keyword_group_members (
  keyword_group_id UUID NOT NULL REFERENCES keyword_groups(id) ON DELETE CASCADE,
  tracked_keyword_id UUID NOT NULL REFERENCES tracked_keywords(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'supporting',  -- pillar, supporting
  PRIMARY KEY(keyword_group_id, tracked_keyword_id)
);

-- Content gap analysis results (per audit)
CREATE TABLE content_gap_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  keyword_difficulty INTEGER,
  current_position INTEGER,  -- null if not ranking
  opportunity_score INTEGER,  -- 0-100 calculated score
  suggested_page TEXT,  -- existing page to optimise, or 'new' for new content
  intent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Modifications to Existing Tables

```sql
-- Add to audit_pages for enriched keyword data
ALTER TABLE audit_pages
  ADD COLUMN keyword_search_volume INTEGER,
  ADD COLUMN keyword_difficulty INTEGER,
  ADD COLUMN keyword_intent TEXT,
  ADD COLUMN keyword_serp_features JSONB,
  ADD COLUMN keyword_current_position INTEGER,
  ADD COLUMN keyword_opportunity_score INTEGER;

-- Add to audit_jobs for keyword summary stats
ALTER TABLE audit_jobs
  ADD COLUMN keyword_opportunities_count INTEGER DEFAULT 0,
  ADD COLUMN avg_keyword_difficulty INTEGER;
```

---

## Backend Changes

### New Services

#### 1. `gsc.service.ts` -- Google Search Console Integration

```
Purpose: OAuth connection, data sync, query/analytics
Key methods:
  - initiateOAuth(domainId) -> redirect URL
  - handleCallback(code, state) -> store tokens
  - syncQueryData(domainId, dateRange) -> fetch & store GSC data
  - getTopQueries(domainId, filters) -> aggregated query performance
  - getPageQueries(domainId, pageUrl) -> keywords driving traffic to a page
  - getQueryTrend(domainId, query) -> position/clicks over time
  - getCannibalisation(domainId) -> queries ranking for multiple pages
```

#### 2. `keyword-research.service.ts` -- External Keyword Data

```
Purpose: Fetch and cache keyword metrics from DataForSEO
Key methods:
  - getKeywordMetrics(keywords[], location, language) -> volume, difficulty, CPC, intent
  - getSuggestions(seedKeyword, location) -> related keywords with metrics
  - getQuestionKeywords(seedKeyword) -> PAA-style questions
  - getLongTailVariations(keyword) -> long-tail derivatives
  - getSerpOverview(keyword, location) -> top 10 results with metrics
  - getBulkDifficulty(keywords[]) -> batch difficulty scores
  - classifyIntent(keywords[]) -> informational/navigational/commercial/transactional
```

#### 3. `rank-tracker.service.ts` -- Position Tracking

```
Purpose: Daily rank checking and historical analysis
Key methods:
  - trackKeyword(domainId, keyword, location) -> add to tracking
  - untrackKeyword(trackedKeywordId) -> remove
  - checkRankings(domainId) -> fetch current positions (BullMQ scheduled job)
  - getRankHistory(trackedKeywordId, dateRange) -> position over time
  - getMovers(domainId, period) -> biggest gainers/losers
  - getDistribution(domainId) -> position distribution (1-3, 4-10, 11-20, 21-50, 50+)
  - detectCannibalisation(domainId) -> keywords where multiple pages compete
```

#### 4. `content-gap.service.ts` -- Opportunity Discovery

```
Purpose: Find keyword opportunities the site is missing
Key methods:
  - analyseGaps(auditId, domainId) -> identify missing/weak keywords
  - calculateOpportunityScore(keyword) -> weighted score of volume vs difficulty vs current position
  - suggestContentPlan(domainId) -> prioritised list of content to create/optimise
  - mapKeywordsToPages(domainId) -> which page should target which keyword
```

#### 5. `topic-cluster.service.ts` -- Topic Modelling

```
Purpose: Group keywords into topic clusters for content strategy
Key methods:
  - detectClusters(keywords[]) -> auto-group by semantic similarity
  - suggestPillarPages(domainId) -> recommend hub pages
  - mapInternalLinks(domainId, clusterId) -> suggest internal link structure
  - getClusterCoverage(domainId, clusterId) -> % of cluster keywords with content
```

### Enhanced Audit Engine Integration

Modify `content.engine.ts` and `keywords.ts` to:

1. **Enrich with search data**: When a target keyword is provided, fetch search volume, difficulty, and intent from cache/API
2. **Auto-detect page keywords**: If no target keyword specified, use GSC data to identify the primary keyword for each page
3. **Opportunity scoring**: Score each page's keyword opportunity (high volume + low difficulty + poor current position = high opportunity)
4. **Intent alignment**: Check if page content type matches keyword intent (e.g., blog post for informational keyword, product page for transactional)
5. **Cannibalisation warnings**: Flag when multiple pages target the same keyword cluster

### New BullMQ Jobs

```
keyword-rank-check    -- Daily rank position checks (scheduled)
gsc-sync              -- Daily GSC data sync (scheduled)
keyword-research      -- On-demand keyword research (triggered by user)
content-gap-analysis  -- Run after audit completes
```

---

## Frontend Changes

### New Pages

#### 1. Keyword Research Tool (`/app/keywords/research`)
- Search bar for seed keyword input
- Location/language selector
- Results table: keyword, volume, difficulty, CPC, intent, trend sparkline, SERP features
- Expandable rows showing related keywords and questions
- "Track" button to add to rank tracking
- Bulk actions: track all, export CSV
- Filter/sort by all metrics

#### 2. Rank Tracker Dashboard (`/app/keywords/rankings`)
- Overview cards: total tracked, avg position, visibility score
- Position distribution chart (1-3, 4-10, 11-20, 21-50, 50+)
- Movers section: biggest gainers/losers this period
- Main table: keyword, current position, change, URL, volume, difficulty
- Click into keyword for position history chart
- Cannibalisation alerts panel
- Tag filtering for keyword groups

#### 3. Search Console Dashboard (`/app/keywords/search-console`)
- Connect GSC prompt (if not connected)
- Overview: total clicks, impressions, avg CTR, avg position (with trend)
- Top queries table with sparkline trends
- Top pages by organic traffic
- Query-to-page mapping
- CTR opportunity finder (high impressions, low CTR = improve title/description)
- Position buckets with click distribution

#### 4. Content Gap Analysis (`/app/keywords/gaps`)
- Runs after audit, shows opportunities
- Opportunity cards: keyword, volume, difficulty, current position (if any), opportunity score
- Categorised: "Quick wins" (position 5-20), "Low-hanging fruit" (high volume, low difficulty), "Strategic" (high difficulty but high value)
- Content recommendations: optimise existing page vs create new content
- Priority matrix visualisation (volume vs difficulty scatter plot)

#### 5. Topic Clusters View (`/app/keywords/clusters`)
- Visual cluster map (pillar page in centre, supporting pages around it)
- Coverage percentage per cluster
- Missing content indicators
- Internal linking suggestions
- Drag-and-drop keyword assignment

### Enhanced Existing Components

#### KeywordAnalysisPanel.tsx (Audit Page Detail)
Add to existing panel:
- Search volume badge next to target keyword
- Keyword difficulty meter (0-100 with color coding)
- Search intent tag (informational/navigational/commercial/transactional)
- SERP feature indicators (featured snippet opportunity, PAA, etc.)
- "This page also ranks for..." section (from GSC data)
- Competitor comparison: who ranks above you and why
- Opportunity score with actionable recommendation

#### Audit Summary / Dashboard
- New "Keyword Opportunities" card showing top 5 quick wins
- Content gap summary with link to full analysis
- Cannibalisation warnings if detected

---

## Implementation Phases

### Phase A: Google Search Console Integration (High Value, Free Data)
**Effort**: 2-3 weeks
**Dependencies**: Google OAuth setup, API credentials

1. GSC OAuth flow (connect/disconnect)
2. Data sync service + scheduled BullMQ job
3. `gsc_connections` and `gsc_query_data` tables
4. Search Console dashboard page
5. CTR opportunity analysis
6. Auto-detect page keywords from GSC data for audits
7. "This page ranks for..." section in audit page detail

**Why first**: Free, uses real data (not estimates), immediately valuable, and the OAuth infrastructure can be reused for other Google integrations.

### Phase B: Keyword Research & Enrichment (Core Intelligence)
**Effort**: 2-3 weeks
**Dependencies**: DataForSEO account or similar API

1. DataForSEO integration service with caching
2. `keyword_research_cache` table
3. Keyword research page (search, results, related keywords)
4. Enrich audit keyword analysis with search volume + difficulty
5. Intent classification
6. SERP feature detection
7. Question keyword discovery

**Why second**: This is the "Ahrefs-like" core. Search volume and difficulty data transforms keyword analysis from "you used this word correctly" to "this word is worth targeting."

### Phase C: Rank Tracking (Ongoing Intelligence)
**Effort**: 2 weeks
**Dependencies**: Phase B (uses same data source)

1. `tracked_keywords` and `keyword_rank_history` tables
2. Daily rank check BullMQ job
3. Rank tracker dashboard
4. Position history charts
5. Movers/shakers alerts
6. Position distribution visualisation

**Why third**: Rank tracking makes Kritano sticky -- users come back daily to check positions, not just when running audits.

### Phase D: Content Gap & Topic Clusters (Strategic Layer)
**Effort**: 2-3 weeks
**Dependencies**: Phases A + B

1. Content gap analysis service
2. `content_gap_results` table
3. Opportunity scoring algorithm
4. Content gap analysis page
5. Topic cluster detection and visualisation
6. `keyword_groups` tables
7. Internal linking recommendations
8. Cannibalisation detection (cross-reference GSC + rank data)

**Why last**: This is the most sophisticated layer. It synthesises all previous data into strategic recommendations. Requires GSC data + keyword metrics to be meaningful.

---

## Tier Gating

| Feature | Free | Starter | Pro | Agency |
|---------|:----:|:-------:|:---:|:------:|
| On-page keyword analysis (current) | Yes | Yes | Yes | Yes |
| GSC connection | -- | 1 property | 3 properties | Unlimited |
| GSC data retention | -- | 30 days | 90 days | 12 months |
| Keyword research lookups | -- | 50/mo | 500/mo | 5,000/mo |
| Rank tracking keywords | -- | 25 | 250 | 2,500 |
| Content gap analysis | -- | -- | Yes | Yes |
| Topic clusters | -- | -- | -- | Yes |
| Cannibalisation detection | -- | -- | Yes | Yes |
| SERP feature tracking | -- | -- | Yes | Yes |
| Keyword intent classification | -- | Yes | Yes | Yes |
| Historical rank data | -- | 30 days | 6 months | 24 months |

---

## Cost Modelling (DataForSEO)

DataForSEO pricing is per-task. Estimated costs at scale:

| Operation | Cost per Request | Monthly Usage (Pro) | Monthly Cost |
|-----------|:---:|:---:|:---:|
| Keyword search volume | $0.05 per 1000 keywords | 10,000 keywords | $0.50 |
| Keyword difficulty | $0.02 per keyword | 500 keywords | $10.00 |
| SERP results | $0.01 per SERP | 500 SERPs | $5.00 |
| Rank checking | $0.01 per check | 250 keywords x 30 days = 7,500 | $75.00 |
| Related keywords | $0.05 per seed | 100 seeds | $5.00 |

**Estimated total per Pro user/month**: ~$20-30 in API costs
**Estimated total per Agency user/month**: ~$100-200 in API costs

This is well within margin for Pro ($79+/mo) and Agency ($199+/mo) tiers.

---

## Opportunity Score Algorithm

The opportunity score (0-100) helps users prioritise which keywords to focus on:

```
opportunityScore = (
  volumeScore * 0.30 +      -- normalised search volume (higher = better)
  difficultyScore * 0.25 +  -- inverted difficulty (easier = better)
  positionGap * 0.25 +      -- how far from page 1 (closer but not there = better)
  intentMatch * 0.10 +      -- does content type match search intent?
  trendScore * 0.10         -- is volume trending up?
)

Where:
  volumeScore = min(100, log10(searchVolume) * 25)
  difficultyScore = 100 - keywordDifficulty
  positionGap =
    0    if not ranking (too hard to assess)
    100  if position 4-10 (almost page 1 top, easy wins)
    80   if position 11-20 (page 2, pushable)
    50   if position 21-50 (needs work)
    20   if position 1-3 (already winning, maintain)
  intentMatch = 100 if page type matches intent, 50 if partial, 0 if mismatch
  trendScore = compare last 3 months avg vs previous 3 months avg
```

---

## Technical Considerations

### Rate Limiting & Caching
- Cache keyword research results for 14 days (search volumes are monthly estimates)
- Rate limit DataForSEO calls per user per tier
- Queue rank checks to spread API load throughout the day
- GSC sync: rate limited to 2000 rows per request, paginate for large sites

### Data Privacy
- GSC tokens encrypted at rest (already have encryption patterns in codebase)
- Keyword research data is not personally identifiable
- Users can disconnect GSC and delete all synced data
- Rank tracking data belongs to the domain owner (verified domain required)

### Performance
- GSC query data can grow fast: partition by month or domain
- Rank history: consider TimescaleDB extension or regular cleanup for old data
- Keyword research cache: TTL-based cleanup job
- Frontend: virtualised tables for large keyword lists, sparkline charts lightweight

### Domain Verification Requirement
- GSC integration requires domain to be verified in Kritano (existing system)
- Rank tracking requires domain verification
- Keyword research (standalone) does not require verification -- it's generic data

---

## Critical Files Summary

### New Files to Create
- `server/src/services/gsc.service.ts`
- `server/src/services/keyword-research.service.ts`
- `server/src/services/rank-tracker.service.ts`
- `server/src/services/content-gap.service.ts`
- `server/src/services/topic-cluster.service.ts`
- `server/src/routes/keywords/` (new route group)
- `client/src/pages/keywords/` (new page group)
- `client/src/components/keywords/` (new component group)

### Files to Modify
- `server/src/services/audit-engines/content/keywords.ts` -- enrich with external data
- `server/src/services/audit-engines/content.engine.ts` -- integrate search metrics
- `server/src/services/queue/audit-worker.service.ts` -- trigger content gap analysis post-audit
- `client/src/components/audits/KeywordAnalysisPanel.tsx` -- add search volume, difficulty, intent
- `server/src/types/content.types.ts` -- extend KeywordMetrics
- Tier configuration files -- add new limits
- Navigation components -- add keyword section

---

## Testing Plan

### Unit Tests
- Opportunity score calculation with edge cases
- Intent classification accuracy
- Keyword variation generation
- Cache expiry and refresh logic
- Tier limit enforcement

### Integration Tests
- GSC OAuth flow (mock Google endpoints)
- DataForSEO API integration (mock responses)
- Rank check scheduling and storage
- Content gap analysis with real audit data
- Cannibalisation detection with overlapping keywords

### E2E Tests
- Connect/disconnect GSC flow
- Keyword research: search, view results, track keyword
- Rank tracker: add keyword, view history chart
- Content gap: run audit, view opportunities
- Tier gating: verify features locked/unlocked per tier

---

## Summary

This plan takes Kritano's keyword analysis from on-page-only to a full keyword intelligence platform in 4 phases:

1. **GSC Integration** -- free, real data, immediate value
2. **Keyword Research** -- the "Ahrefs-like" core with volume, difficulty, intent
3. **Rank Tracking** -- daily monitoring that makes users come back
4. **Content Gaps & Clusters** -- strategic layer that synthesises everything

Total estimated effort: 8-11 weeks across all phases. Each phase is independently shippable and valuable. API costs are manageable within existing tier pricing.
