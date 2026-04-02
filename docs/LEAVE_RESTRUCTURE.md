# kritano - Site-Centric Restructure Plan

A proposal to reorganize the application around "Sites" as the primary organizational unit, providing clearer audit history, site-specific competitors, and better UX.

**Created:** 2026-01-30
**Status:** Planning

---

## 1. Executive Summary

### Current Structure
```
Organization
├── Domains (verified ownership)
├── Audits (flat list, any URL)
├── Competitors (organization-wide)
└── Comparisons (organization-wide)
```

### Proposed Structure
```
Organization
└── Sites (the core unit)
    ├── Domain (one primary domain per site)
    ├── Audits (all audits for this domain)
    ├── Competitors (site-specific)
    └── Comparisons (site-specific)
```

### Why This Change?

1. **Clarity**: Users think in terms of "my websites" not "my audits"
2. **Organization**: Audit history is naturally grouped by the site being tracked
3. **Relevant Competitors**: Different sites compete with different businesses
4. **Scalability**: Agencies managing 50 client sites need clear separation
5. **Better UX**: Click on a site → see everything about that site

---

## 2. Core Concepts

### What is a Site?

A **Site** represents a single website/web property that the user wants to track and improve. Each site:

- Has exactly ONE primary domain (e.g., `example.com`)
- Contains all audits ever run for that domain
- Has its own set of competitors
- Has its own comparisons
- Can have site-specific settings (audit preferences, notification settings)

### Site vs Domain

| Concept | Description |
|---------|-------------|
| **Site** | A logical container for tracking a website project |
| **Domain** | The URL/hostname associated with a site |

A site IS a domain from the user's perspective, but internally "Site" is the container that holds audits, competitors, and settings.

### Examples

**Starter User (3 sites):**
```
Chris's Workspace (Organization)
├── Site: "My Blog" (myblog.com)
│   ├── 12 audits
│   ├── 2 competitors: competitor1.com, competitor2.com
│   └── 3 comparisons
├── Site: "My Shop" (myshop.com)
│   ├── 8 audits
│   ├── 2 competitors: bigretailer.com, localshop.com
│   └── 1 comparison
└── Site: "Portfolio" (chrisdesign.io)
    ├── 3 audits
    ├── 0 competitors
    └── 0 comparisons
```

**Agency User (many sites):**
```
Acme Agency (Organization)
├── Site: "Client A - Main Site" (clienta.com)
├── Site: "Client A - Blog" (blog.clienta.com)
├── Site: "Client B" (clientb.com)
├── Site: "Client C" (clientc.org)
└── ... 46 more sites
```

---

## 3. Revised Tier Structure

### Tier Limits

| Tier | Sites | Competitors per Site | Audits/Month | Pages/Audit |
|------|-------|---------------------|--------------|-------------|
| Free | 1 | 0 | 5 | 10 |
| Starter | 3 | 2 | 30 | 50 |
| Pro | 10 | 5 | 100 | 200 |
| Agency | 50 | 10 | 500 | 500 |
| Enterprise | Unlimited | Unlimited | Unlimited | Unlimited |

### Key Changes from Current

1. **"Sites" replaces "Domains"** as the primary limit
2. **Competitors are per-site** not per-organization
3. **Audits counted per organization** (not per site) - simplifies billing
4. Removed "competitor domains" as separate concept - competitors are now part of sites

### What Counts as Usage?

- **Site**: Created when user adds a new site/domain to track
- **Competitor**: Added to a specific site
- **Audit**: Any audit run, counted against monthly org limit
- **Comparison**: No separate limit (creates negligible data)

---

## 4. Database Schema Changes

### New Tables

```sql
-- Sites table - the new primary organizational unit
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Site identity
  name VARCHAR(255) NOT NULL,           -- "My Blog", "Client A Website"
  domain VARCHAR(255) NOT NULL,         -- "myblog.com" (normalized, no protocol)

  -- Optional metadata
  description TEXT,
  logo_url VARCHAR(500),

  -- Domain verification (optional but recommended)
  verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verified_at TIMESTAMPTZ,

  -- Site-specific settings
  settings JSONB DEFAULT '{}',          -- audit preferences, notifications, etc.

  -- Tracking
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(organization_id, domain)       -- One site per domain per org
);

CREATE INDEX idx_sites_org ON sites(organization_id);
CREATE INDEX idx_sites_domain ON sites(domain);
```

### Modified Tables

```sql
-- audit_jobs: Add site_id reference
ALTER TABLE audit_jobs ADD COLUMN site_id UUID REFERENCES sites(id) ON DELETE SET NULL;
CREATE INDEX idx_audit_jobs_site ON audit_jobs(site_id);

-- competitor_profiles: Change from org-level to site-level
ALTER TABLE competitor_profiles ADD COLUMN site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
-- Note: organization_id kept for now, will be derived from site
CREATE INDEX idx_competitor_profiles_site ON competitor_profiles(site_id);

-- audit_comparisons: Add site_id for easier querying
ALTER TABLE audit_comparisons ADD COLUMN site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
CREATE INDEX idx_audit_comparisons_site ON audit_comparisons(site_id);

-- tier_limits: New columns
ALTER TABLE tier_limits ADD COLUMN max_sites INTEGER;
ALTER TABLE tier_limits ADD COLUMN max_competitors_per_site INTEGER;
-- Remove: max_competitor_domains (replaced by per-site limits)
```

### Tier Limits Updates

```sql
-- Update tier_limits with new structure
UPDATE tier_limits SET
  max_sites = 1,
  max_competitors_per_site = 0,
  competitor_comparison = FALSE
WHERE tier = 'free';

UPDATE tier_limits SET
  max_sites = 3,
  max_competitors_per_site = 2,
  competitor_comparison = TRUE
WHERE tier = 'starter';

UPDATE tier_limits SET
  max_sites = 10,
  max_competitors_per_site = 5,
  competitor_comparison = TRUE
WHERE tier = 'pro';

UPDATE tier_limits SET
  max_sites = 50,
  max_competitors_per_site = 10,
  competitor_comparison = TRUE
WHERE tier = 'agency';

UPDATE tier_limits SET
  max_sites = NULL,  -- unlimited
  max_competitors_per_site = NULL,  -- unlimited
  competitor_comparison = TRUE
WHERE tier = 'enterprise';
```

### Site Settings Schema (JSONB)

```typescript
interface SiteSettings {
  // Default audit options for this site
  defaultAuditOptions?: {
    maxPages?: number;
    maxDepth?: number;
    checkSeo?: boolean;
    checkAccessibility?: boolean;
    checkSecurity?: boolean;
    checkPerformance?: boolean;
  };

  // Notification preferences
  notifications?: {
    emailOnComplete?: boolean;
    emailOnScoreChange?: boolean;
    scoreChangeThreshold?: number;  // e.g., 5 = notify if score changes by 5+
  };

  // Display preferences
  display?: {
    color?: string;  // For visual distinction in lists
    icon?: string;   // Custom icon/emoji
  };
}
```

---

## 5. Data Migration Strategy

### Phase 1: Create Sites from Existing Data

```sql
-- Create sites from unique domains in audit_jobs
INSERT INTO sites (organization_id, name, domain, created_at)
SELECT DISTINCT
  organization_id,
  target_domain as name,  -- Use domain as initial name
  target_domain as domain,
  MIN(created_at) as created_at
FROM audit_jobs
WHERE organization_id IS NOT NULL
GROUP BY organization_id, target_domain;
```

### Phase 2: Link Audits to Sites

```sql
-- Update audit_jobs with site_id
UPDATE audit_jobs aj
SET site_id = s.id
FROM sites s
WHERE aj.organization_id = s.organization_id
  AND aj.target_domain = s.domain;
```

### Phase 3: Migrate Competitors

This is trickier - competitors are currently org-wide but need to become site-specific.

**Option A: Duplicate to All Sites**
```sql
-- Create competitor for each site in the org
INSERT INTO competitor_profiles (organization_id, site_id, domain, name, notes, created_by)
SELECT cp.organization_id, s.id, cp.domain, cp.name, cp.notes, cp.created_by
FROM competitor_profiles cp
CROSS JOIN sites s
WHERE s.organization_id = cp.organization_id
  AND cp.site_id IS NULL;
```

**Option B: Assign to First Site (Recommended)**
```sql
-- Assign existing competitors to the org's first/primary site
WITH first_sites AS (
  SELECT DISTINCT ON (organization_id) id, organization_id
  FROM sites
  ORDER BY organization_id, created_at
)
UPDATE competitor_profiles cp
SET site_id = fs.id
FROM first_sites fs
WHERE cp.organization_id = fs.organization_id
  AND cp.site_id IS NULL;
```

**Option C: User-Driven Migration**
- Show migration UI prompting users to assign competitors to sites
- More work but gives users control

### Phase 4: Migrate Comparisons

```sql
-- Set site_id based on the "my_audit" site
UPDATE audit_comparisons ac
SET site_id = aj.site_id
FROM audit_jobs aj
WHERE ac.my_audit_id = aj.id
  AND ac.site_id IS NULL;
```

### Phase 5: Handle Orphaned Data

```sql
-- Find audits without sites (edge cases)
SELECT * FROM audit_jobs WHERE site_id IS NULL AND organization_id IS NOT NULL;

-- Create sites for any orphaned audits
-- ... similar to Phase 1

-- Eventually: Make site_id NOT NULL after migration complete
-- ALTER TABLE audit_jobs ALTER COLUMN site_id SET NOT NULL;
```

---

## 6. API Changes

### New Endpoints

```
Sites:
GET    /api/organizations/:orgId/sites                    List all sites
POST   /api/organizations/:orgId/sites                    Create a site
GET    /api/organizations/:orgId/sites/:siteId            Get site details
PUT    /api/organizations/:orgId/sites/:siteId            Update site
DELETE /api/organizations/:orgId/sites/:siteId            Delete site
GET    /api/organizations/:orgId/sites/:siteId/stats      Get site statistics

Site Audits:
GET    /api/organizations/:orgId/sites/:siteId/audits     List audits for site
POST   /api/organizations/:orgId/sites/:siteId/audits     Start audit for site

Site Competitors:
GET    /api/organizations/:orgId/sites/:siteId/competitors
POST   /api/organizations/:orgId/sites/:siteId/competitors
PUT    /api/organizations/:orgId/sites/:siteId/competitors/:id
DELETE /api/organizations/:orgId/sites/:siteId/competitors/:id

Site Comparisons:
GET    /api/organizations/:orgId/sites/:siteId/comparisons
POST   /api/organizations/:orgId/sites/:siteId/comparisons
GET    /api/organizations/:orgId/sites/:siteId/comparisons/:id
DELETE /api/organizations/:orgId/sites/:siteId/comparisons/:id
```

### Modified Endpoints

```
-- These become secondary/convenience endpoints
GET    /api/audits                    List all audits (across all sites)
GET    /api/audits/:id                Get audit (unchanged)

-- Deprecated (redirect to site-based)
GET    /api/organizations/:orgId/competitors  → List across all sites
```

### Response Formats

**Site List Response:**
```json
{
  "sites": [
    {
      "id": "uuid",
      "name": "My Blog",
      "domain": "myblog.com",
      "verified": true,
      "createdAt": "2026-01-15T...",
      "stats": {
        "totalAudits": 12,
        "lastAuditAt": "2026-01-28T...",
        "latestScores": {
          "seo": 85,
          "accessibility": 72,
          "security": 90,
          "performance": 68
        },
        "competitorCount": 2
      }
    }
  ],
  "usage": {
    "sites": 2,
    "maxSites": 3
  }
}
```

**Site Detail Response:**
```json
{
  "site": {
    "id": "uuid",
    "name": "My Blog",
    "domain": "myblog.com",
    "description": "Personal tech blog",
    "verified": true,
    "settings": { ... },
    "createdAt": "2026-01-15T..."
  },
  "recentAudits": [ ... ],
  "competitors": [
    {
      "id": "uuid",
      "domain": "competitor1.com",
      "name": "Competitor One",
      "latestScores": { ... }
    }
  ],
  "scoreHistory": [
    { "date": "2026-01-28", "seo": 85, "accessibility": 72, ... },
    { "date": "2026-01-21", "seo": 82, "accessibility": 70, ... }
  ]
}
```

---

## 7. Frontend Changes

### New Pages

```
client/src/pages/sites/
├── SiteList.tsx              Main sites dashboard
├── SiteDetail.tsx            Single site view with audits/competitors
├── SiteSettings.tsx          Site configuration
└── NewSite.tsx               Add new site wizard
```

### Updated Navigation

**Before:**
```
Dashboard | Audits | Competitors | Comparisons | Settings
```

**After:**
```
Dashboard | Sites | Settings
           └── [Site Dashboard]
               ├── Overview
               ├── Audits
               ├── Competitors
               └── Comparisons
```

### User Flow

1. **Dashboard** → Overview of all sites with quick stats
2. **Sites** → Grid/list of all sites
3. **Click Site** → Site dashboard with:
   - Score overview (latest audit scores)
   - Score trend chart
   - Recent audits list
   - Competitors sidebar
   - Quick actions: Run Audit, Add Competitor, Compare
4. **Site > Audits** → Full audit history for this site
5. **Site > Competitors** → Manage competitors for this site
6. **Site > Comparisons** → Comparisons between this site and its competitors

### Component Structure

```
SiteDetail.tsx
├── SiteHeader (name, domain, verified badge, actions)
├── ScoreOverview (4 score cards with trends)
├── Tabs
│   ├── Overview
│   │   ├── ScoreHistoryChart
│   │   ├── RecentAudits (last 5)
│   │   └── CompetitorSnapshot
│   ├── Audits
│   │   └── AuditList (paginated, filterable)
│   ├── Competitors
│   │   ├── CompetitorList
│   │   └── AddCompetitorModal
│   └── Comparisons
│       ├── ComparisonList
│       └── NewComparisonWizard
└── SiteSettingsDrawer
```

### Empty States

**No Sites Yet:**
```
┌─────────────────────────────────────────────┐
│                                             │
│     🌐  Add Your First Site                 │
│                                             │
│     Start tracking your website's SEO,      │
│     accessibility, security, and            │
│     performance scores.                     │
│                                             │
│     [+ Add Site]                            │
│                                             │
└─────────────────────────────────────────────┘
```

**Site with No Audits:**
```
┌─────────────────────────────────────────────┐
│  myblog.com                                 │
│                                             │
│     📊  Run Your First Audit                │
│                                             │
│     Get a complete analysis of your site.   │
│                                             │
│     [Run Audit]                             │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 8. TypeScript Types

### Server Types

```typescript
// server/src/types/site.types.ts

export interface Site {
  id: string;
  organization_id: string;
  name: string;
  domain: string;
  description: string | null;
  logo_url: string | null;
  verified: boolean;
  verification_token: string | null;
  verified_at: Date | null;
  settings: SiteSettings;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SiteSettings {
  defaultAuditOptions?: {
    maxPages?: number;
    maxDepth?: number;
    checkSeo?: boolean;
    checkAccessibility?: boolean;
    checkSecurity?: boolean;
    checkPerformance?: boolean;
  };
  notifications?: {
    emailOnComplete?: boolean;
    emailOnScoreChange?: boolean;
    scoreChangeThreshold?: number;
  };
  display?: {
    color?: string;
    icon?: string;
  };
}

export interface SiteWithStats extends Site {
  stats: {
    totalAudits: number;
    lastAuditAt: Date | null;
    latestScores: {
      seo: number | null;
      accessibility: number | null;
      security: number | null;
      performance: number | null;
    } | null;
    competitorCount: number;
  };
}

export interface CreateSiteInput {
  name: string;
  domain: string;
  description?: string;
}

export interface UpdateSiteInput {
  name?: string;
  description?: string;
  logo_url?: string;
  settings?: Partial<SiteSettings>;
}
```

### Client Types

```typescript
// client/src/types/site.types.ts

export interface Site {
  id: string;
  name: string;
  domain: string;
  description: string | null;
  logoUrl: string | null;
  verified: boolean;
  settings: SiteSettings;
  createdAt: string;
  updatedAt: string;
}

export interface SiteWithStats extends Site {
  stats: {
    totalAudits: number;
    lastAuditAt: string | null;
    latestScores: {
      seo: number | null;
      accessibility: number | null;
      security: number | null;
      performance: number | null;
    } | null;
    competitorCount: number;
  };
}

export interface SiteDetail extends Site {
  recentAudits: AuditSummary[];
  competitors: CompetitorProfile[];
  scoreHistory: ScoreHistoryEntry[];
}

export interface ScoreHistoryEntry {
  date: string;
  seo: number | null;
  accessibility: number | null;
  security: number | null;
  performance: number | null;
}
```

### Updated TierLimits

```typescript
export interface TierLimits {
  tier: SubscriptionTier;

  // Site limits (NEW)
  max_sites: number | null;
  max_competitors_per_site: number | null;

  // Audit limits
  max_audits_per_month: number | null;
  max_pages_per_audit: number;
  max_audit_depth: number;

  // Features
  competitor_comparison: boolean;
  scheduled_audits: boolean;
  // ... rest unchanged
}
```

---

## 9. Implementation Phases

### Phase 1: Database & Backend Foundation
1. Create migration for `sites` table
2. Add `site_id` columns to existing tables
3. Create `site.service.ts` with CRUD operations
4. Create `routes/sites/index.ts`
5. Update `TierLimits` types

### Phase 2: Data Migration
1. Write migration script to create sites from existing audits
2. Link existing audits to sites
3. Migrate competitors to sites (Option B recommended)
4. Migrate comparisons to sites
5. Test data integrity

### Phase 3: API Updates
1. Implement site endpoints
2. Update audit endpoints to support site context
3. Update competitor endpoints to be site-scoped
4. Update comparison endpoints to be site-scoped
5. Add backward compatibility for old endpoints

### Phase 4: Frontend - Sites Core
1. Create `SiteList.tsx` page
2. Create `SiteDetail.tsx` page
3. Create `NewSite.tsx` wizard
4. Update navigation
5. Update routes in `App.tsx`

### Phase 5: Frontend - Integration
1. Move audit list to site context
2. Move competitors to site context
3. Move comparisons to site context
4. Update dashboard to show sites overview
5. Update "New Audit" flow to select site first

### Phase 6: Polish & Migration UI
1. Add site settings page
2. Add score history charts
3. Create migration UI for existing users
4. Add empty states and onboarding
5. Update tier limit displays

---

## 10. Backward Compatibility

### API Versioning

Consider versioning the API:
- `/api/v1/...` - Current structure (deprecated but supported)
- `/api/v2/...` - New site-centric structure

Or use feature flags:
- Gradually roll out site-centric views
- Allow users to switch between old/new UI during transition

### Deprecation Timeline

1. **Week 1-2**: Ship new structure alongside old
2. **Week 3-4**: Default to new structure, old accessible via toggle
3. **Week 5-8**: Remove toggle, old endpoints return deprecation warnings
4. **Week 9+**: Remove old endpoints

### Breaking Changes to Communicate

1. Competitors are now per-site, not per-organization
2. Navigation structure changed
3. Some API endpoints relocated
4. Existing competitors will be assigned to first site (users can reassign)

---

## 11. Open Questions

1. **Subdomains**: Should `blog.example.com` and `shop.example.com` be the same site or different sites?
   - Recommendation: Different sites by default, but consider a "subdomain grouping" feature later

2. **Domain Changes**: What if a user needs to change a site's domain (rebranding)?
   - Recommendation: Allow domain changes but keep audit history

3. **Site Deletion**: What happens to audits when a site is deleted?
   - Recommendation: Soft delete or archive, don't lose audit history

4. **Free Tier**: Should free users get competitor comparison at all?
   - Current plan: No competitors on free tier

5. **Audit Assignment**: What if user runs audit from command line / API without specifying site?
   - Recommendation: Auto-match to existing site by domain, or create new site if within limits

---

## 12. Success Metrics

After implementation, measure:

1. **User Engagement**: Time spent in app, pages viewed per session
2. **Feature Adoption**: % of users with multiple sites, % using competitors
3. **Clarity**: Reduction in support tickets about "where are my audits"
4. **Retention**: Do users with organized sites retain better?

---

## Summary

This restructure transforms kritano from an "audit tool" into a "website monitoring platform" by:

1. Making **Sites** the primary organizational unit
2. Scoping **Competitors** to specific sites for relevance
3. Providing clearer **audit history** per website
4. Creating a more intuitive **navigation** structure
5. Better supporting **agency use cases** with many client sites

The migration can be done incrementally with minimal disruption to existing users.

---

*Site-Centric Restructure Plan v1.0*
*Created: 2026-01-30*
