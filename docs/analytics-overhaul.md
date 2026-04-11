# Analytics Overhaul - Ultrathink Plan

## Overview

Transform Kritano's analytics from "basic charts showing scores over time" into a genuinely insightful analytics platform that tells users **what changed, why it matters, and what to do about it**. The goal isn't more charts -- it's better stories from existing data.

## Key Decisions

1. **Stay with Recharts but add custom components.** Recharts is fine for 90% of what we need. For the inventive visualisations (health pulse, heat maps, treemaps), we'll build custom SVG/CSS components. No need for Highcharts licensing costs or a full D3 migration.
2. **Insight-first, not chart-first.** Every visualisation must answer a question. If it's just "here's a line going up", it's not worth building.
3. **Data already exists.** Most of what's planned below uses data that's already in `audit_jobs` and `audit_pages`. Very few new backend queries needed.
4. **Progressive disclosure.** Dashboard shows the headline. Drilling down reveals the detail. Don't overwhelm on first view.

---

## Phase 1: Analytics Dashboard Redesign

### 1.1 Website Health Pulse

Replace the current stat cards with a **health pulse** -- a single visual that communicates overall health at a glance.

**Design:** A horizontal multi-segment bar (like a stacked progress bar) showing the distribution of your sites by health status:

```
[███████ Healthy (3) ████ Needs Work (2) ██ Critical (1) ]
```

- **Healthy** (all scores 80+): Green segment
- **Needs Work** (any score 50-79): Amber segment
- **Critical** (any score <50): Red segment
- Hovering a segment shows the sites in that bucket
- Clicking drills into those sites

This replaces 6 separate stat cards with one visual that immediately tells you: "Are my sites okay?"

### 1.2 Score Sparklines on Site Cards

Each site card on the dashboard currently shows static scores. Add **inline sparklines** (tiny 80x20px line charts) next to each score showing the last 5 audits. Users instantly see: is this score trending up, down, or flat?

**Implementation:** Custom SVG component, no Recharts overhead. Just a `<polyline>` in an SVG. ~30 lines of code per sparkline.

### 1.3 "What Changed" Feed

Replace the basic "recent activity" list with a **smart changelog** that highlights meaningful changes:

- "chrisgarlick.com SEO score dropped 12 points (82 -> 70). 3 new broken links detected."
- "kritano.com achieved 90+ in all categories for the first time."
- "chrisgarlick.com has 5 critical security findings that have persisted for 3 audits."

**Data source:** Compare consecutive audits per site. Highlight score deltas > 5 points, new critical findings, milestone achievements, and stale findings.

### 1.4 Portfolio Score Distribution

A **dot plot** or **strip chart** showing where each of your sites falls on a 0-100 scale, per category. One row per category, one dot per site.

```
SEO:           .  .    .         .  .     .
A11y:             .  .     .        .  .
Security:      .     .  .        .     .  .
               0    20   40    60   80   100
```

This immediately shows: "My sites are clustered around 60-70 for SEO but spread out for security." Much more useful than averages.

---

## Phase 2: Site Analytics Deep Dive

### 2.1 Score Bands Instead of Lines

The current line chart shows 6+ overlapping lines that get cluttered. Replace with **score bands** -- shaded areas showing the range between your best and worst scores, with a thick line for the selected category.

- Default view: Show the "band" of all scores (min to max across categories) in light grey
- Click a category to highlight it as a bold line on top of the band
- This lets you see if one category is dragging down the overall health

### 2.2 Issue Waterfall Chart

Show how issues flow between audits with a **waterfall chart**:

```
Audit 1: 45 issues
  -12 fixed
  +8 new
  = Audit 2: 41 issues
  -15 fixed
  +3 new
  = Audit 3: 29 issues
```

Each bar shows: starting count, green blocks going down (fixed), red blocks going up (new), resulting count. This is the "are we making progress?" chart.

**Data source:** The issue diff logic already exists in `compareAudits()`. Just need to chain consecutive audits.

### 2.3 Page Health Treemap

A **treemap** showing every page on the site, sized by importance (crawl depth or traffic if GSC connected) and coloured by health score.

- Large green blocks = important healthy pages
- Small red blocks = deep pages with issues
- Click a block to see that page's findings

**Implementation:** Custom SVG treemap algorithm (squarified treemap). No library needed -- the algorithm is ~50 lines. Data comes from `audit_pages`.

### 2.4 Fix Velocity Chart

Track **how quickly issues get resolved** across audits:

- X-axis: audit number (or date)
- Y-axis: cumulative issues fixed
- Line shows the acceleration/deceleration of fixes

This answers: "Am I fixing issues faster or slower than I'm creating them?"

**Data source:** Compare `audit_findings` across consecutive audits. Count findings that appear in audit N but not audit N+1 (fixed) vs findings in N+1 but not N (new).

### 2.5 Category Correlation Matrix

A small **heat map grid** showing which score categories move together:

```
         SEO   A11y  Sec   Perf  Content
SEO      1.0   0.3   0.1   0.5   0.7
A11y     0.3   1.0   0.2   0.4   0.3
Sec      0.1   0.2   1.0   0.1   0.0
Perf     0.5   0.4   0.1   1.0   0.2
Content  0.7   0.3   0.0   0.2   1.0
```

This tells agencies: "When SEO drops, content usually drops too -- they're correlated. But security is independent." Useful for prioritising which categories to focus on.

**Data source:** Pearson correlation across audit score history. Pure frontend calculation from existing score data.

### 2.6 Response Time Distribution

A **histogram** or **box plot** showing the distribution of page response times across the site:

- Median, P75, P95, max
- Colour-coded: green (<200ms), amber (200-500ms), red (>500ms)
- Identify the slowest pages

**Data source:** `audit_pages.response_time_ms` -- already collected but never visualised.

### 2.7 Page Size Budget

A **horizontal bar chart** showing pages ranked by size, with a configurable "budget line" (e.g. 500KB):

- Pages under budget: green bars
- Pages over budget: red bars extending past the line
- Shows total transfer size breakdown if available

**Data source:** `audit_pages.page_size_bytes` -- already collected.

---

## Phase 3: Comparison Upgrades

### 3.1 Radar Chart Polish

The current radar chart works but is basic. Improve it:

- Add **filled areas with transparency** so overlapping sites create colour blends
- Add a **benchmark ring** at the 80-point mark (the "good" threshold)
- Animate transitions when adding/removing sites
- Show exact values on hover per axis per site

### 3.2 Before/After Diff View

For audit comparison, show a **visual diff** -- not just a table of numbers. For each category:

```
SEO:     [72 ████████████████████░░░░░░░░ 82]  +10 ↑
A11y:    [88 ██████████████████████████░░ 91]   +3 ↑
Security:[65 ██████████████████░░░░░░░░░░ 58]   -7 ↓
```

Two overlapping bars per category, with the delta clearly shown. Green for improvement, red for regression.

### 3.3 Issue Venn Diagram

For comparing 2 audits: show a **Venn diagram** of issues:

- Left circle: issues only in Audit A (resolved)
- Overlap: issues in both (persistent)
- Right circle: issues only in Audit B (new)

Sized proportionally. This is more intuitive than the current diff table for understanding: "Did things get better or worse?"

**Implementation:** Custom SVG with two overlapping circles. Area proportional to count. Pure CSS/SVG.

---

## Phase 4: Intelligent Insights (No AI Required)

### 4.1 Automated Insight Cards

Generate plain-English insights from the data. These are template-based, not AI:

- **Trend insight:** "Your SEO score has improved 15 points over the last 4 audits. At this rate, you'll hit 90 in ~2 audits."
- **Regression alert:** "Security dropped 8 points since last audit. 2 new CSP violations detected."
- **Stale finding:** "3 critical accessibility issues have been present for 5+ audits. Oldest: missing alt text on homepage hero image."
- **Quick win:** "Fixing the 4 missing meta descriptions would likely improve your SEO score by ~5 points."
- **Milestone:** "First time all scores above 80. Keep it up."

**Implementation:** A `generateInsights(siteId, auditHistory)` function that runs pattern matching on score deltas, finding persistence, and score thresholds. Returns an array of `{ type, severity, message, actionUrl }`.

### 4.2 Score Forecast

Simple **linear regression** on the last N scores to project where each category is heading:

- Dotted line extending the trend into the future
- "At current trajectory, SEO will reach 90 in ~3 audits"
- Only shown if there are 4+ data points and the R-squared is reasonable (>0.5)

**Implementation:** Frontend-only. Linear regression is 10 lines of code. Render as a dashed extension of the existing line chart.

### 4.3 Issue Impact Estimation

For each finding category, estimate the score impact:

- "Fixing all critical SEO issues (~8 findings) would likely improve your SEO score by 10-15 points"
- Based on: (critical count * estimated weight per critical) + (serious count * weight per serious)

This gives users a reason to act. Not just "you have 8 critical issues" but "fixing them would get you from 72 to ~85".

**Implementation:** Weighted estimation based on finding severity distribution. Already have all the data.

---

## Phase 5: New Visualisations

### 5.1 Audit Timeline

A **horizontal timeline** showing every audit for a site as dots on a line, with key events annotated:

```
Jan     Feb        Mar       Apr
 o-------o----o-----o---o----o
 72      75   78    82  80   85
         ↑              ↑
    Fixed broken    SSL cert
    links           expired
```

- Dot size = total issues (bigger = more issues)
- Dot colour = overall health
- Hover shows scores
- Click navigates to that audit
- Annotations auto-generated from significant events (score jumps, new critical issues, etc.)

### 5.2 Finding Heatmap by Page

A **grid heatmap** where:
- Rows = pages (URLs)
- Columns = finding categories (SEO, A11y, Security, etc.)
- Cell colour = issue severity (green = none, amber = moderate, red = critical)

This instantly shows: "Homepage has critical accessibility issues. /about has security problems. /blog is clean."

**Data source:** `audit_pages` with joined `audit_findings`. Already available.

### 5.3 Content Quality Radar

For sites with CQS enabled, show a **spider/radar chart** of the 5 content sub-scores:

- Quality (25%)
- E-E-A-T (25%)
- Readability (20%)
- Engagement (15%)
- Structure (15%)

With the overall CQS score in the center. Per-page or aggregated across the site.

### 5.4 Crawl Depth Sunburst

A **sunburst chart** showing the site structure by crawl depth:

- Center = homepage (depth 0)
- First ring = depth 1 pages
- Second ring = depth 2 pages
- Colour = average score for that page

This reveals site architecture issues: "90% of your pages are at depth 3+ -- Google may not crawl them effectively."

**Implementation:** Custom SVG sunburst. Data from `audit_pages` with depth info from the crawler.

### 5.5 Score Percentile Gauge

For each score, show where the user's site ranks compared to **all Kritano users** (anonymised):

```
Your SEO: 78  |  Better than 65% of sites on Kritano
```

Visual: a gauge or progress bar with the percentile marked.

**Data source:** New backend query: `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY seo_score) FROM audit_jobs WHERE status = 'completed'`. Cached daily.

---

## Database Changes

### New table: Analytics cache

```sql
-- Migration: 107_analytics_cache.sql

-- Cached percentile data (refreshed daily by background job)
CREATE TABLE analytics_percentiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(30) NOT NULL,        -- 'seo', 'accessibility', etc.
    percentile_25 NUMERIC(5,2),
    percentile_50 NUMERIC(5,2),
    percentile_75 NUMERIC(5,2),
    percentile_90 NUMERIC(5,2),
    sample_size INTEGER NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category)
);

-- Insight cache per site (regenerated after each audit)
CREATE TABLE site_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    insight_type VARCHAR(30) NOT NULL,    -- 'trend', 'regression', 'stale_finding', 'quick_win', 'milestone'
    severity VARCHAR(10) NOT NULL,        -- 'info', 'warning', 'success'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_site_insights_site ON site_insights(site_id);
```

---

## Backend Changes

### New endpoints

```
GET /api/analytics/sites/:siteId/insights      -- Generated insight cards
GET /api/analytics/sites/:siteId/pages/heatmap  -- Page x category heatmap data
GET /api/analytics/sites/:siteId/response-times -- Response time distribution
GET /api/analytics/sites/:siteId/page-sizes     -- Page size distribution
GET /api/analytics/sites/:siteId/fix-velocity   -- Cumulative fix/new issue tracking
GET /api/analytics/sites/:siteId/waterfall      -- Issue waterfall data
GET /api/analytics/sites/:siteId/structure       -- Crawl depth sunburst data
GET /api/analytics/percentiles                   -- Global percentile benchmarks
```

### New service methods

```
generateInsights(siteId)          -- Pattern-match audit history for insights
getPageHeatmap(siteId, auditId)   -- Page x category severity grid
getResponseTimeDistribution(siteId, auditId)  -- Histogram buckets
getPageSizeDistribution(siteId, auditId)      -- Size ranking with budget
getFixVelocity(siteId)            -- Cumulative fixed vs new across audits
getIssueWaterfall(siteId)         -- Per-audit-pair: fixed/new/remaining
getSiteStructure(siteId, auditId) -- Crawl depth with scores per level
getPercentiles()                  -- Cached global percentile data
```

### Background job

```
analytics:refresh-percentiles     -- Runs daily at 03:00 UTC
                                  -- Calculates P25/P50/P75/P90 per category
                                  -- Stores in analytics_percentiles
```

---

## Frontend Changes

### New components

| Component | Type | Library |
|---|---|---|
| `HealthPulse.tsx` | Stacked segment bar | Custom CSS |
| `Sparkline.tsx` | Tiny inline line chart | Custom SVG |
| `SmartChangelog.tsx` | Insight-driven activity feed | Custom |
| `DotPlot.tsx` | Strip chart / dot plot | Custom SVG |
| `ScoreBands.tsx` | Line chart with shaded range | Recharts + custom |
| `WaterfallChart.tsx` | Issue waterfall | Custom SVG |
| `Treemap.tsx` | Page health treemap | Custom SVG |
| `FixVelocityChart.tsx` | Cumulative line chart | Recharts |
| `CorrelationMatrix.tsx` | Heat map grid | Custom SVG/CSS |
| `ResponseTimeHistogram.tsx` | Histogram | Recharts BarChart |
| `PageSizeBudget.tsx` | Horizontal bars with budget line | Recharts + ReferenceLine |
| `BeforeAfterDiff.tsx` | Dual-bar visual diff | Custom CSS |
| `VennDiagram.tsx` | 2-circle issue overlap | Custom SVG |
| `InsightCards.tsx` | Template-based insight cards | Custom |
| `ScoreForecast.tsx` | Dashed trend projection | Recharts + custom line |
| `AuditTimeline.tsx` | Annotated horizontal timeline | Custom SVG |
| `FindingHeatmap.tsx` | Page x category grid | Custom CSS grid |
| `ContentRadar.tsx` | CQS sub-score radar | Recharts RadarChart |
| `CrawlSunburst.tsx` | Depth-based sunburst | Custom SVG |
| `PercentileGauge.tsx` | Score vs global benchmark | Custom SVG |

### Modified pages

| Page | Changes |
|---|---|
| `AnalyticsDashboard.tsx` | Replace stat cards with HealthPulse, add sparklines to site cards, replace activity feed with SmartChangelog, add DotPlot |
| `SiteAnalytics.tsx` | Add ScoreBands option, add WaterfallChart, add InsightCards at top, add Treemap, add FixVelocity, add CorrelationMatrix, add ResponseTime/PageSize tabs |
| `AuditComparison.tsx` | Add BeforeAfterDiff, add VennDiagram |
| `SiteComparison.tsx` | Polish RadarChart, add PercentileGauge per site |
| `UrlAnalytics.tsx` | Add sparklines, content radar for CQS pages |

---

## Critical Files Summary

| Priority | File | Change |
|---|---|---|
| 1 | `server/src/db/migrations/107_analytics_cache.sql` | New tables |
| 1 | `server/src/services/analytics.service.ts` | New query methods |
| 1 | `server/src/routes/analytics/index.ts` | New endpoints |
| 1 | `client/src/components/analytics/Sparkline.tsx` | New -- inline sparklines |
| 1 | `client/src/components/analytics/HealthPulse.tsx` | New -- portfolio health bar |
| 1 | `client/src/components/analytics/InsightCards.tsx` | New -- smart insights |
| 1 | `client/src/pages/analytics/AnalyticsDashboard.tsx` | Redesign |
| 2 | `client/src/components/analytics/WaterfallChart.tsx` | New |
| 2 | `client/src/components/analytics/ScoreBands.tsx` | New |
| 2 | `client/src/components/analytics/FindingHeatmap.tsx` | New |
| 2 | `client/src/components/analytics/AuditTimeline.tsx` | New |
| 2 | `client/src/pages/analytics/SiteAnalytics.tsx` | Enhanced |
| 3 | `client/src/components/analytics/Treemap.tsx` | New |
| 3 | `client/src/components/analytics/CorrelationMatrix.tsx` | New |
| 3 | `client/src/components/analytics/BeforeAfterDiff.tsx` | New |
| 3 | `client/src/components/analytics/VennDiagram.tsx` | New |
| 3 | `client/src/pages/analytics/AuditComparison.tsx` | Enhanced |
| 4 | `client/src/components/analytics/CrawlSunburst.tsx` | New |
| 4 | `client/src/components/analytics/PercentileGauge.tsx` | New |
| 4 | `client/src/components/analytics/PageSizeBudget.tsx` | New |
| 4 | `client/src/components/analytics/ResponseTimeHistogram.tsx` | New |
| 4 | Background job: percentile refresh | New |

---

## Tier Gating

| Feature | Free | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|---|
| Dashboard with sparklines | Yes | Yes | Yes | Yes | Yes |
| Health pulse | Yes | Yes | Yes | Yes | Yes |
| Score history (basic line) | Last 3 audits | Last 10 | Full | Full | Full |
| Smart insights | 1 per site | 3 per site | Unlimited | Unlimited | Unlimited |
| Issue waterfall | -- | Yes | Yes | Yes | Yes |
| Fix velocity | -- | Yes | Yes | Yes | Yes |
| Finding heatmap | -- | -- | Yes | Yes | Yes |
| Correlation matrix | -- | -- | Yes | Yes | Yes |
| Response time/page size | -- | -- | Yes | Yes | Yes |
| Treemap | -- | -- | Yes | Yes | Yes |
| Score forecasting | -- | -- | Yes | Yes | Yes |
| Percentile benchmarks | -- | -- | Yes | Yes | Yes |
| Crawl sunburst | -- | -- | -- | Yes | Yes |
| Content quality radar | -- | -- | Yes | Yes | Yes |
| Audit timeline | -- | Yes | Yes | Yes | Yes |

---

## Testing Plan

### Unit Tests
- Sparkline SVG renders correctly with various data shapes (flat, up, down, single point)
- Insight generation produces correct templates for each pattern
- Linear regression forecast calculation
- Correlation matrix calculation
- Waterfall data aggregation
- Treemap squarification algorithm

### Integration Tests
- Analytics endpoints return correct data shape
- Percentile cache refresh job runs and stores data
- Insight generation after audit completion
- Heatmap data joins pages + findings correctly

### Visual Tests
- All charts render in both light and dark mode
- Charts handle empty data gracefully (no audit history yet)
- Charts handle single data point (first audit)
- Charts handle large datasets (100+ audits)
- Responsive: charts resize on mobile
- Tooltips don't overflow viewport

---

## Implementation Order

### Phase 1: Dashboard Quick Wins (1-2 days)
1. `Sparkline.tsx` -- custom SVG sparklines
2. `HealthPulse.tsx` -- portfolio health segment bar
3. `SmartChangelog.tsx` -- insight-driven activity feed
4. Integrate into `AnalyticsDashboard.tsx`

### Phase 2: Site Analytics Core (2-3 days)
1. `InsightCards.tsx` + backend `generateInsights()`
2. `WaterfallChart.tsx` + backend `getIssueWaterfall()`
3. `ScoreBands.tsx` -- enhanced line chart
4. `FixVelocityChart.tsx` + backend `getFixVelocity()`
5. `AuditTimeline.tsx` -- annotated timeline
6. Integrate into `SiteAnalytics.tsx`

### Phase 3: Page-Level Visualisations (1-2 days)
1. `FindingHeatmap.tsx` + backend `getPageHeatmap()`
2. `ResponseTimeHistogram.tsx` + backend `getResponseTimeDistribution()`
3. `PageSizeBudget.tsx` + backend `getPageSizeDistribution()`
4. `Treemap.tsx` -- page health treemap
5. Add as tabs in `SiteAnalytics.tsx`

### Phase 4: Comparison Upgrades (1 day)
1. `BeforeAfterDiff.tsx` -- visual score diff bars
2. `VennDiagram.tsx` -- issue overlap visualisation
3. Radar chart polish with benchmark ring
4. Integrate into `AuditComparison.tsx` and `SiteComparison.tsx`

### Phase 5: Advanced Analytics (1-2 days)
1. `CorrelationMatrix.tsx` -- category correlation heatmap
2. `ScoreForecast.tsx` -- trend projection with linear regression
3. `PercentileGauge.tsx` + backend percentile cache + background job
4. `CrawlSunburst.tsx` + backend `getSiteStructure()`
5. `ContentRadar.tsx` -- CQS sub-score radar
6. `DotPlot.tsx` -- portfolio score distribution

### Phase 6: Polish
1. Loading animations on all charts
2. Empty states for new users (no audit data yet)
3. Tier gating UI (locked state with upgrade prompt)
4. Update `docs/TIERS.md` with analytics features
5. Dark mode verification pass
6. Mobile responsive pass
