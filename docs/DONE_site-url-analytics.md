# Site & URL Analytics System

## Overview

A 3-tier analytics system allowing users to drill down from an overview of all sites to individual URL performance metrics.

## Key Decisions

1. **User-centric architecture** - Removed organization middleware dependency; analytics routes now verify access via `loadSite` middleware which checks ownership and site shares
2. **URL-level analytics** - Track performance at the individual URL level with comparison to site averages
3. **Declining trend detection** - Automatically identify sites with declining scores by comparing last 2 audits

## Database Changes

No schema changes required. Uses existing tables:
- `audit_jobs` - Score data per audit
- `site_urls` - URL metadata
- `sites` - Site information
- `site_shares` - Access control

## Backend Changes

### New Types (`server/src/types/analytics.types.ts`)

```typescript
interface UserOverview {
  totalSites: number;
  totalAudits: number;
  avgScores: { seo, accessibility, security, performance };
  sitesNeedingAttention: Array<{ id, name, domain, latestScores, trend: 'declining' }>;
  recentActivity: Array<{ auditId, siteName, domain, completedAt, overallScore }>;
}

interface UrlAnalytics {
  url: { id, urlPath, fullUrl, auditCount, lastAuditedAt };
  scoreHistory: ScoreHistory;
  comparisonToSite: { [category]: { url, site, diff } };
  recentAudits: Array<{ id, completedAt, scores, totalIssues }>;
}
```

### New Service Functions (`server/src/services/analytics.service.ts`)

- `getUserOverview(userId)` - Aggregated data across all user's sites
- `getUrlScoreHistory(options)` - Score history for a specific URL
- `getUrlAnalytics(urlId, siteId)` - Comprehensive URL data with site comparison

### New/Updated Routes (`server/src/routes/analytics/index.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/overview` | GET | User overview (NEW - fixes broken endpoint) |
| `/api/analytics/sites/:siteId/scores` | GET | Site score history (updated auth) |
| `/api/analytics/sites/:siteId/issues` | GET | Site issue trends (updated auth) |
| `/api/analytics/sites/:siteId/urls/:urlId` | GET | Full URL analytics (NEW) |
| `/api/analytics/sites/:siteId/urls/:urlId/scores` | GET | URL score history (NEW) |
| `/api/analytics/compare` | GET | Compare audits (updated auth) |
| `/api/analytics/compare-sites` | GET | Compare sites (updated auth) |

## Frontend Changes

### New Types (`client/src/types/analytics.types.ts`)

Mirror of backend `UserOverview` and `UrlAnalytics` interfaces.

### New API Methods (`client/src/services/api.ts`)

```typescript
analyticsApi.getUserOverview()  // Fixed return type
analyticsApi.getUrlAnalytics(siteId, urlId)
analyticsApi.getUrlScores(siteId, urlId, options)
```

### New Components

- `ComparisonBars.tsx` - Visual comparison of URL scores vs site average with colored bars

### New Pages

| Page | Route | Description |
|------|-------|-------------|
| `SiteAnalytics.tsx` | `/analytics/sites/:siteId` | Tier 2 - Site deep dive |
| `UrlAnalytics.tsx` | `/analytics/sites/:siteId/urls/:urlId` | Tier 3 - URL metrics |

### Updated Pages

- `AnalyticsDashboard.tsx` - Added site selector, recent activity, sites needing attention

## Critical Files Summary

| File | Action |
|------|--------|
| `server/src/routes/analytics/index.ts` | Updated - User-centric auth, new endpoints |
| `server/src/services/analytics.service.ts` | Updated - New service functions |
| `server/src/types/analytics.types.ts` | Updated - New interfaces |
| `client/src/services/api.ts` | Updated - New API methods |
| `client/src/types/analytics.types.ts` | Updated - New interfaces |
| `client/src/pages/analytics/AnalyticsDashboard.tsx` | Updated - Site selector, fixed data |
| `client/src/pages/analytics/SiteAnalytics.tsx` | Created - Tier 2 page |
| `client/src/pages/analytics/UrlAnalytics.tsx` | Created - Tier 3 page |
| `client/src/components/analytics/ComparisonBars.tsx` | Created - Comparison component |
| `client/src/App.tsx` | Updated - New routes |

## Navigation Flow

```
/analytics (Dashboard)
    │
    ├── Site Selector ──────────► /analytics/sites/:siteId (Site Analytics)
    │                                    │
    │                                    ├── URL row click ──► /analytics/sites/:siteId/urls/:urlId
    │                                    │                            │
    │                                    │                            └── Audit click ──► /audits/:id
    │                                    │
    │                                    └── Compare Audits ──► /analytics/compare
    │
    └── Compare Sites ──────────► /analytics/compare-sites
```

## Testing Plan

### Backend Testing
```bash
# User overview
curl -H "Authorization: Bearer $TOKEN" localhost:3001/api/analytics/overview

# URL analytics
curl -H "Authorization: Bearer $TOKEN" localhost:3001/api/analytics/sites/$SITE_ID/urls/$URL_ID

# URL score history
curl -H "Authorization: Bearer $TOKEN" localhost:3001/api/analytics/sites/$SITE_ID/urls/$URL_ID/scores?range=30d
```

### Frontend Testing
- [ ] Analytics dashboard loads without error
- [ ] Site selector dropdown shows all user's sites
- [ ] Clicking site card navigates to `/analytics/sites/:siteId`
- [ ] Site analytics page shows score charts and URL table
- [ ] Clicking URL row navigates to URL analytics
- [ ] URL analytics shows comparison to site average
- [ ] "Run New Audit" button works
- [ ] Breadcrumb navigation works at all levels

## Implementation Order

1. ✅ Backend types
2. ✅ Backend service functions
3. ✅ Backend routes (user-centric)
4. ✅ Frontend types
5. ✅ Frontend API methods
6. ✅ AnalyticsDashboard updates
7. ✅ SiteAnalytics page
8. ✅ UrlAnalytics page
9. ✅ ComparisonBars component
10. ✅ App.tsx routing
