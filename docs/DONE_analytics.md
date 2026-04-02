# Analytics Feature - Ultrathink Plan

## Overview/Summary

Add comprehensive analytics capabilities to Kritano that allow users to:

1. **Track audit scores over time** - Visualize how SEO, accessibility, security, and performance scores change across audits
2. **Compare audits** - Side-by-side comparison of any two audits (same site or different sites)
3. **Compare sites** - Benchmark multiple sites against each other within an organization
4. **Identify trends** - See progression, regressions, and patterns in website health

### User Stories

- As a user, I want to see a chart of my site's scores over time so I can track improvement
- As a user, I want to compare two audits to see what changed between them
- As a user, I want to compare my different sites to see which needs the most attention
- As a user, I want to see which issues are recurring vs. fixed across audits

---

## Key Decisions

### 1. Analytics Location
**Decision**: Analytics will be accessible from two places:
- **Site-level analytics**: In SiteDetail page as a new "Analytics" tab
- **Organization-level analytics**: New top-level "Analytics" page for cross-site comparison

### 2. Chart Library
**Decision**: Use **Recharts**
- React-native, composable, well-maintained
- Good TypeScript support
- Responsive and accessible
- Already commonly used with Tailwind projects

### 3. Data Aggregation Strategy
**Decision**: Real-time queries with optional caching
- For score history: Query on demand (data is already indexed)
- For complex aggregations: Consider materialized views later if performance is an issue
- No pre-aggregation tables initially (YAGNI)

### 4. Comparison Approach
**Decision**: URL-based comparison state
- Comparison URLs like `/analytics/compare?audits=uuid1,uuid2`
- Allows sharing/bookmarking comparisons
- Supports 2-4 audits in single comparison

### 5. Time Range Selection
**Decision**: Predefined ranges + custom
- Last 7 days, 30 days, 90 days, 1 year, All time
- Custom date picker for specific ranges

### 6. Chart Types
**Decision**: Focus on these core visualizations:
- **Line charts**: Score progression over time
- **Bar charts**: Issue distribution by category/severity
- **Radar charts**: Multi-dimensional score comparison
- **Tables**: Detailed audit comparison with delta indicators

---

## Database Changes

### New Indexes (Performance Optimization)

```sql
-- Migration: 023_analytics_indexes.sql

-- Optimized index for score history queries
CREATE INDEX idx_audit_jobs_site_completed
ON audit_jobs(site_id, completed_at DESC)
WHERE status = 'completed';

-- Optimized index for organization-wide analytics
CREATE INDEX idx_audit_jobs_org_completed
ON audit_jobs(organization_id, completed_at DESC)
WHERE status = 'completed';

-- Index for finding trend analysis
CREATE INDEX idx_audit_findings_created
ON audit_findings(audit_job_id, category, created_at);
```

### No New Tables Required
The existing schema has all necessary data:
- `audit_jobs` - scores, timestamps, site/org relationships
- `audit_findings` - issue details, categories, severities
- `audit_pages` - page-level metrics
- `sites` - site grouping

---

## Backend Changes

### New API Endpoints

#### 1. Site Score History (Enhanced)
```
GET /api/sites/:siteId/analytics/scores
```

**Query Parameters:**
- `range`: '7d' | '30d' | '90d' | '1y' | 'all' (default: '30d')
- `from`: ISO date string (for custom range)
- `to`: ISO date string (for custom range)

**Response:**
```typescript
{
  scores: Array<{
    auditId: string;
    completedAt: string;
    seo: number | null;
    accessibility: number | null;
    security: number | null;
    performance: number | null;
  }>;
  summary: {
    averages: { seo: number; accessibility: number; security: number; performance: number };
    trends: { seo: 'up' | 'down' | 'stable'; /* ... */ };
    totalAudits: number;
  };
}
```

#### 2. Issue Trends
```
GET /api/sites/:siteId/analytics/issues
```

**Query Parameters:**
- `range`: time range
- `groupBy`: 'day' | 'week' | 'month' (default: 'week')

**Response:**
```typescript
{
  trends: Array<{
    period: string; // ISO date of period start
    bySeverity: { critical: number; serious: number; moderate: number; minor: number };
    byCategory: { seo: number; accessibility: number; security: number; performance: number };
    total: number;
  }>;
}
```

#### 3. Audit Comparison
```
GET /api/analytics/compare
```

**Query Parameters:**
- `audits`: comma-separated audit IDs (2-4)

**Response:**
```typescript
{
  audits: Array<{
    id: string;
    siteName: string;
    domain: string;
    completedAt: string;
    scores: { seo: number; accessibility: number; security: number; performance: number };
    issues: { total: number; critical: number; serious: number; moderate: number; minor: number };
    pagesCrawled: number;
  }>;
  comparison: {
    scoreDeltas: Array<{ from: string; to: string; deltas: { seo: number; /* ... */ } }>;
    commonIssues: Array<{ ruleId: string; ruleName: string; category: string; presentIn: string[] }>;
    resolvedIssues: Array<{ ruleId: string; ruleName: string; resolvedIn: string }>;
    newIssues: Array<{ ruleId: string; ruleName: string; introducedIn: string }>;
  };
}
```

#### 4. Organization Analytics (Cross-Site)
```
GET /api/organizations/:orgId/analytics/overview
```

**Response:**
```typescript
{
  sites: Array<{
    id: string;
    name: string;
    domain: string;
    latestScores: { seo: number; accessibility: number; security: number; performance: number };
    lastAuditAt: string;
    auditCount: number;
    trend: 'improving' | 'declining' | 'stable';
  }>;
  aggregates: {
    totalAudits: number;
    averageScores: { seo: number; accessibility: number; security: number; performance: number };
    topIssues: Array<{ ruleId: string; ruleName: string; count: number; category: string }>;
  };
}
```

#### 5. Site Comparison
```
GET /api/analytics/compare-sites
```

**Query Parameters:**
- `sites`: comma-separated site IDs (2-6)

**Response:**
```typescript
{
  sites: Array<{
    id: string;
    name: string;
    domain: string;
    latestAudit: {
      id: string;
      completedAt: string;
      scores: { seo: number; accessibility: number; security: number; performance: number };
      totalIssues: number;
    };
    historicalAverage: { seo: number; accessibility: number; security: number; performance: number };
  }>;
}
```

### New Service: analytics.service.ts

```typescript
// server/src/services/analytics.service.ts

export interface ScoreHistoryOptions {
  siteId: string;
  range?: '7d' | '30d' | '90d' | '1y' | 'all';
  from?: Date;
  to?: Date;
}

export async function getSiteScoreHistory(options: ScoreHistoryOptions): Promise<ScoreHistory>;
export async function getIssueTrends(siteId: string, options: TrendOptions): Promise<IssueTrends>;
export async function compareAudits(auditIds: string[]): Promise<AuditComparison>;
export async function getOrganizationOverview(orgId: string): Promise<OrgAnalytics>;
export async function compareSites(siteIds: string[]): Promise<SiteComparison>;
```

### Routes File

```typescript
// server/src/routes/analytics/index.ts

router.get('/sites/:siteId/scores', getSiteScores);
router.get('/sites/:siteId/issues', getSiteIssues);
router.get('/compare', compareAudits);
router.get('/compare-sites', compareSites);
router.get('/organizations/:orgId/overview', getOrgOverview);
```

---

## Frontend Changes

### New Dependencies

```bash
npm install recharts date-fns
```

### New Pages

#### 1. Site Analytics Tab
**Location**: Add to `SiteDetail.tsx` as new tab

```typescript
// client/src/pages/sites/SiteDetail.tsx
type TabType = 'overview' | 'audits' | 'settings' | 'analytics';
```

#### 2. Analytics Dashboard Page
**Location**: `client/src/pages/analytics/AnalyticsDashboard.tsx`

- Organization-wide view
- Site selector for filtering
- Cross-site comparison launcher

#### 3. Audit Comparison Page
**Location**: `client/src/pages/analytics/AuditComparison.tsx`

- Side-by-side audit metrics
- Score delta visualization
- Issue diff (resolved, new, common)

#### 4. Site Comparison Page
**Location**: `client/src/pages/analytics/SiteComparison.tsx`

- Multi-site radar chart
- Benchmark table
- Best/worst performers

### New Components

#### Chart Components
```
client/src/components/analytics/
├── ScoreLineChart.tsx      # Score progression over time
├── IssueTrendChart.tsx     # Issue counts over time (stacked bar)
├── ScoreRadarChart.tsx     # Multi-dimensional comparison
├── ScoreComparisonBar.tsx  # Side-by-side score bars
├── IssueDiffTable.tsx      # Resolved/new/common issues
├── SiteRankingTable.tsx    # Sites ranked by score
├── TrendIndicator.tsx      # Up/down/stable arrow with percentage
├── ScoreCard.tsx           # Single score with trend
└── DateRangePicker.tsx     # Time range selector
```

#### Shared Analytics Types
```typescript
// client/src/types/analytics.types.ts

export interface ScoreDataPoint {
  auditId: string;
  date: string;
  seo: number | null;
  accessibility: number | null;
  security: number | null;
  performance: number | null;
}

export interface IssueTrendPoint {
  period: string;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

export interface AuditComparisonData {
  audits: AuditSummary[];
  scoreDeltas: ScoreDelta[];
  issueDiff: IssueDiff;
}

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';
```

### New Routes

```typescript
// client/src/App.tsx - add routes

<Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
<Route path="/analytics/compare" element={<ProtectedRoute><AuditComparison /></ProtectedRoute>} />
<Route path="/analytics/compare-sites" element={<ProtectedRoute><SiteComparison /></ProtectedRoute>} />
```

### Navigation Update

Add "Analytics" to sidebar in `Sidebar.tsx`:
```typescript
const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sites', label: 'Sites', icon: Globe },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },  // NEW
  { href: '/settings/api-keys', label: 'API Keys', icon: Key },
  // ...
];
```

### API Service

```typescript
// client/src/services/api/analytics.ts

export const analyticsApi = {
  getSiteScores: (siteId: string, range?: TimeRange) =>
    api.get(`/analytics/sites/${siteId}/scores`, { params: { range } }),

  getSiteIssues: (siteId: string, range?: TimeRange, groupBy?: string) =>
    api.get(`/analytics/sites/${siteId}/issues`, { params: { range, groupBy } }),

  compareAudits: (auditIds: string[]) =>
    api.get('/analytics/compare', { params: { audits: auditIds.join(',') } }),

  compareSites: (siteIds: string[]) =>
    api.get('/analytics/compare-sites', { params: { sites: siteIds.join(',') } }),

  getOrgOverview: (orgId: string) =>
    api.get(`/analytics/organizations/${orgId}/overview`),
};
```

---

## UI/UX Design

### Color Coding (Per Brand Guidelines)

| Score Category | Chart Color | Tailwind Class |
|---------------|-------------|----------------|
| SEO | Violet | `violet-500` |
| Accessibility | Emerald | `emerald-500` |
| Security | Red | `red-500` |
| Performance | Sky | `sky-500` |

| Score Range | Color | Meaning |
|------------|-------|---------|
| 90-100 | Emerald | Excellent |
| 70-89 | Amber | Good |
| 50-69 | Orange | Needs Work |
| 0-49 | Red | Critical |

### Layout: Site Analytics Tab

```
┌─────────────────────────────────────────────────────────────┐
│ [7d] [30d] [90d] [1y] [All] [Custom ▼]     [Compare Audits] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Score Progression                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📈 Line chart with 4 score lines                    │   │
│  │     - Hoverable data points                          │   │
│  │     - Click to view audit                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Current Scores   │  │ Issue Trends     │                │
│  │ ┌────┐ ┌────┐   │  │ ▓▓▓▓▓▓▓▓▓▓▓     │                │
│  │ │ 85 │ │ 72 │   │  │ ▓▓▓▓▓▓▓▓        │                │
│  │ │SEO │ │A11y│   │  │ ▓▓▓▓▓▓          │                │
│  │ └────┘ └────┘   │  │ (stacked bar)   │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
│  Recent Audits with Scores                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Date       SEO  A11y  Sec   Perf  Issues  Actions   │   │
│  │ Jan 15     85   72    90    68    12      [Compare] │   │
│  │ Jan 8      82   70    88    65    15      [Compare] │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Layout: Audit Comparison Page

```
┌─────────────────────────────────────────────────────────────┐
│ Compare Audits                           [+ Add Audit] [×]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Audit A          │         Audit B         │   │
│  │     example.com            │    example.com          │   │
│  │     Jan 8, 2025           │    Jan 15, 2025         │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  SEO           82 ──────────→ 85  (+3) ↑            │   │
│  │  Accessibility 70 ──────────→ 72  (+2) ↑            │   │
│  │  Security      88 ──────────→ 90  (+2) ↑            │   │
│  │  Performance   65 ──────────→ 68  (+3) ↑            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ 🔧 3 Resolved   │  │ ⚠️ 1 New Issue  │                  │
│  │ - alt-text      │  │ - slow-render   │                  │
│  │ - meta-desc     │  │                 │                  │
│  │ - broken-link   │  │                 │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  Common Issues (still present in both)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Rule              Category     Severity    Pages    │   │
│  │ color-contrast    A11y         Serious     5        │   │
│  │ missing-h1        SEO          Moderate    3        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Layout: Site Comparison (Radar Chart)

```
┌─────────────────────────────────────────────────────────────┐
│ Compare Sites                    [Select Sites ▼]           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│        ┌──────────────────────────────────┐                │
│        │           SEO                    │                │
│        │            ▲                     │                │
│        │           /│\                    │                │
│        │  Perf ◄──/─┼─\──► A11y          │                │
│        │          \ │ /                   │                │
│        │           \▼/                    │                │
│        │         Security                 │                │
│        │                                  │                │
│        │  ── Site A  ── Site B  ── Site C│                │
│        └──────────────────────────────────┘                │
│                                                             │
│  Site Rankings                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ #  Site          SEO   A11y  Sec   Perf  Overall   │   │
│  │ 1  blog.co       92    88    95    85    90        │   │
│  │ 2  shop.co       85    72    90    68    79        │   │
│  │ 3  docs.co       78    65    88    72    76        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Critical Files Summary

### Backend (New)
| File | Purpose |
|------|---------|
| `server/src/services/analytics.service.ts` | Core analytics queries |
| `server/src/routes/analytics/index.ts` | API endpoints |
| `server/src/types/analytics.types.ts` | TypeScript types |
| `server/src/db/migrations/023_analytics_indexes.sql` | Performance indexes |

### Backend (Modified)
| File | Change |
|------|--------|
| `server/src/index.ts` | Mount analytics routes |

### Frontend (New)
| File | Purpose |
|------|---------|
| `client/src/pages/analytics/AnalyticsDashboard.tsx` | Org-wide analytics |
| `client/src/pages/analytics/AuditComparison.tsx` | Audit comparison page |
| `client/src/pages/analytics/SiteComparison.tsx` | Site comparison page |
| `client/src/components/analytics/*.tsx` | Chart components |
| `client/src/services/api/analytics.ts` | API client |
| `client/src/types/analytics.types.ts` | TypeScript types |

### Frontend (Modified)
| File | Change |
|------|--------|
| `client/src/App.tsx` | Add analytics routes |
| `client/src/components/layout/Sidebar.tsx` | Add Analytics nav item |
| `client/src/pages/sites/SiteDetail.tsx` | Add Analytics tab |

---

## Testing Plan

### Backend Tests

1. **Unit Tests** (`analytics.service.test.ts`)
   - `getSiteScoreHistory()` returns correct data shape
   - Time range filtering works correctly
   - Empty data handled gracefully
   - `compareAudits()` calculates deltas correctly
   - Issue diff detection (resolved, new, common)

2. **Integration Tests** (`analytics.routes.test.ts`)
   - Authentication required on all endpoints
   - Organization permission checks
   - Invalid audit IDs return 404
   - Cross-org access denied

3. **Performance Tests**
   - Score history query < 100ms for 100 audits
   - Comparison query < 200ms for 4 audits

### Frontend Tests

1. **Component Tests**
   - Charts render with mock data
   - Empty states displayed correctly
   - Loading states work
   - Date range picker functions

2. **Integration Tests**
   - Analytics tab loads in SiteDetail
   - Navigation to comparison pages works
   - URL params parsed correctly

### Manual Testing Checklist

- [ ] Score history chart shows correct data points
- [ ] Hovering chart points shows tooltip
- [ ] Clicking audit in chart navigates to audit detail
- [ ] Date range selector filters data correctly
- [ ] Audit comparison shows score deltas with correct signs
- [ ] Issue diff categorization is accurate
- [ ] Site comparison radar chart renders all sites
- [ ] Empty state shown when no audits exist
- [ ] Mobile responsive layouts work

---

## Implementation Order

### Phase 1: Foundation (Backend)
1. Create `analytics.service.ts` with `getSiteScoreHistory()`
2. Create analytics routes file
3. Add migration for analytics indexes
4. Test score history endpoint

### Phase 2: Site Analytics (Frontend)
1. Install recharts and date-fns
2. Create `ScoreLineChart` component
3. Add Analytics tab to SiteDetail
4. Create `DateRangePicker` component
5. Wire up API calls

### Phase 3: Audit Comparison
1. Add `compareAudits()` to analytics service
2. Create comparison API endpoint
3. Build `AuditComparison` page
4. Create `ScoreComparisonBar` component
5. Create `IssueDiffTable` component

### Phase 4: Site Comparison
1. Add `compareSites()` to analytics service
2. Create site comparison endpoint
3. Build `SiteComparison` page
4. Create `ScoreRadarChart` component
5. Create `SiteRankingTable` component

### Phase 5: Organization Dashboard
1. Add `getOrganizationOverview()` to service
2. Create org analytics endpoint
3. Build `AnalyticsDashboard` page
4. Add Analytics to sidebar navigation
5. Create `TrendIndicator` component

### Phase 6: Polish
1. Add issue trend charts
2. Optimize queries if needed
3. Add export functionality (CSV/PDF)
4. Mobile responsiveness pass
5. Accessibility audit on charts

---

## Future Enhancements (Out of Scope)

- **Scheduled reports**: Email weekly/monthly analytics summaries
- **Alerts**: Notify when scores drop below threshold
- **Competitor benchmarking**: Compare against industry averages
- **Custom dashboards**: User-configurable widget layouts
- **AI insights**: Automated recommendations based on trends
- **Public sharing**: Shareable analytics links for stakeholders
