# kritano - Competitor Comparison Feature

Feature specification for scanning and comparing competitor websites.

**Created:** 2026-01-30
**Status:** Planning
**Access:** Paid tiers only (Pro, Agency, Enterprise)

---

## 1. Overview

### Purpose
Allow paid users to:
1. Scan competitor websites (any domain, no verification required)
2. Compare their site's scores against competitors side-by-side
3. Identify gaps and opportunities for improvement

### User Journey
1. User navigates to "Competitors" section
2. Adds competitor URL (scans like normal audit)
3. Selects their own audit to compare against
4. Views side-by-side comparison dashboard
5. Drills down into specific category differences

---

## 2. Database Schema

### New Tables

```sql
-- Competitor profiles (optional metadata about competitors)
CREATE TABLE competitor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  name VARCHAR(255),           -- "Acme Corp"
  notes TEXT,                  -- User notes about competitor
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, domain)
);

-- Comparison records (links two audits for comparison)
CREATE TABLE audit_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255),                                    -- "Q1 Comparison"
  my_audit_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
  competitor_audit_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT different_audits CHECK (my_audit_id != competitor_audit_id)
);

-- Indexes
CREATE INDEX idx_competitor_profiles_org ON competitor_profiles(organization_id);
CREATE INDEX idx_audit_comparisons_org ON audit_comparisons(organization_id);
CREATE INDEX idx_audit_comparisons_audits ON audit_comparisons(my_audit_id, competitor_audit_id);
```

### Modifications to Existing Tables

```sql
-- Add is_competitor flag to audit_jobs
ALTER TABLE audit_jobs ADD COLUMN is_competitor BOOLEAN DEFAULT FALSE;
ALTER TABLE audit_jobs ADD COLUMN competitor_profile_id UUID REFERENCES competitor_profiles(id);

-- Index for filtering competitor audits
CREATE INDEX idx_audit_jobs_competitor ON audit_jobs(organization_id, is_competitor) WHERE is_competitor = TRUE;
```

### Usage Tracking (Separate Quotas)

The `canAuditDomain` function in `organization.service.ts` needs to be updated to track competitor domains separately:

```typescript
// Existing: Count unique domains from normal audits (is_competitor = false)
SELECT DISTINCT target_domain FROM audit_jobs
WHERE organization_id = $1 AND created_at >= $2 AND is_competitor = FALSE;

// New: Count unique domains from competitor audits (is_competitor = true)
SELECT DISTINCT target_domain FROM audit_jobs
WHERE organization_id = $1 AND created_at >= $2 AND is_competitor = TRUE;
```

**Usage API Response Update:**
```typescript
{
  // Normal domain usage (existing)
  domains: 3,
  domainsUsed: ['mysite.com', 'myblog.com', 'myshop.com'],
  maxDomains: 10,

  // Competitor domain usage (new - separate quota)
  competitorDomains: 5,
  competitorDomainsUsed: ['competitor1.com', 'competitor2.com', ...],
  maxCompetitorDomains: 20
}
```

### Tier Limits Addition

**Important:** Competitor domains are tracked SEPARATELY from normal domain limits. They do NOT count against the user's regular domain quota. The competitor limit is set to 2x the normal domain limit for paid tiers.

```sql
-- Add competitor_comparison to tier_limits
ALTER TABLE tier_limits ADD COLUMN competitor_comparison BOOLEAN DEFAULT FALSE;
ALTER TABLE tier_limits ADD COLUMN max_competitor_domains INTEGER DEFAULT 0;

-- Update tier configurations
-- Competitor domains = 2x normal domain limit (separate quota)
-- Free/Starter: No competitor access
-- Pro: 10 domains -> 20 competitor domains
-- Agency: 50 domains -> 100 competitor domains
-- Enterprise: Unlimited both

UPDATE tier_limits SET competitor_comparison = FALSE, max_competitor_domains = 0 WHERE tier = 'free';
UPDATE tier_limits SET competitor_comparison = FALSE, max_competitor_domains = 0 WHERE tier = 'starter';
UPDATE tier_limits SET competitor_comparison = TRUE, max_competitor_domains = 20 WHERE tier = 'pro';
UPDATE tier_limits SET competitor_comparison = TRUE, max_competitor_domains = 100 WHERE tier = 'agency';
UPDATE tier_limits SET competitor_comparison = TRUE, max_competitor_domains = NULL WHERE tier = 'enterprise';
```

**Quota Structure Example (Pro tier):**
- Normal domains: 10 unique domains/month (for your own sites)
- Competitor domains: 20 unique domains/month (separate, doesn't affect normal quota)
- User can audit 10 of their own sites + 20 competitor sites in one month

---

## 3. API Endpoints

### Competitor Profiles

```
POST   /api/organizations/:orgId/competitors
       Body: { domain: string, name?: string, notes?: string }
       Response: CompetitorProfile

GET    /api/organizations/:orgId/competitors
       Response: CompetitorProfile[]

GET    /api/organizations/:orgId/competitors/:id
       Response: CompetitorProfile with audits[]

PUT    /api/organizations/:orgId/competitors/:id
       Body: { name?: string, notes?: string }

DELETE /api/organizations/:orgId/competitors/:id
```

### Competitor Audits

```
POST   /api/organizations/:orgId/competitors/:competitorId/audit
       Body: { options?: AuditOptions }
       Response: AuditJob (with is_competitor=true)
       Note: Uses same audit system, just flagged as competitor
```

### Comparisons

```
POST   /api/organizations/:orgId/comparisons
       Body: { myAuditId: string, competitorAuditId: string, name?: string }
       Response: AuditComparison

GET    /api/organizations/:orgId/comparisons
       Response: AuditComparison[]

GET    /api/organizations/:orgId/comparisons/:id
       Response: {
         comparison: AuditComparison,
         myAudit: AuditJob,
         competitorAudit: AuditJob,
         scoresDiff: ScoresDiff,
         findingsDiff: FindingsDiff
       }

DELETE /api/organizations/:orgId/comparisons/:id
```

### Comparison Analysis

```
GET    /api/organizations/:orgId/comparisons/:id/scores
       Response: {
         my: { seo: 85, accessibility: 72, security: 90, performance: 68 },
         competitor: { seo: 78, accessibility: 85, security: 88, performance: 75 },
         diff: { seo: +7, accessibility: -13, security: +2, performance: -7 }
       }

GET    /api/organizations/:orgId/comparisons/:id/findings-diff
       Query: ?category=seo&severity=critical
       Response: {
         onlyInMine: Finding[],      -- Issues I have that they don't
         onlyInCompetitor: Finding[], -- Issues they have that I don't
         inBoth: Finding[]           -- Shared issues
       }

GET    /api/organizations/:orgId/comparisons/:id/recommendations
       Response: {
         priorities: [
           { category: 'accessibility', gap: -13, recommendation: '...' },
           { category: 'performance', gap: -7, recommendation: '...' }
         ]
       }
```

---

## 4. TypeScript Types

### Server Types (`server/src/types/competitor.types.ts`)

```typescript
export interface CompetitorProfile {
  id: string;
  organization_id: string;
  domain: string;
  name: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AuditComparison {
  id: string;
  organization_id: string;
  name: string | null;
  my_audit_id: string;
  competitor_audit_id: string;
  created_by: string | null;
  created_at: Date;
}

export interface ScoresDiff {
  my: CategoryScores;
  competitor: CategoryScores;
  diff: CategoryScores;  // my - competitor (positive = I'm better)
}

export interface CategoryScores {
  seo: number | null;
  accessibility: number | null;
  security: number | null;
  performance: number | null;
  overall: number | null;
}

export interface FindingsDiff {
  onlyInMine: FindingSummary[];
  onlyInCompetitor: FindingSummary[];
  inBoth: FindingSummary[];
}

export interface FindingSummary {
  rule_id: string;
  rule_name: string;
  category: string;
  severity: string;
  count: number;
}

export interface CreateCompetitorInput {
  domain: string;
  name?: string;
  notes?: string;
}

export interface CreateComparisonInput {
  myAuditId: string;
  competitorAuditId: string;
  name?: string;
}
```

### Update TierLimits Type

```typescript
// In server/src/types/organization.types.ts
export interface TierLimits {
  // ... existing fields ...
  competitor_comparison: boolean;
  max_competitor_domains: number | null;  // null = unlimited, separate from max_domains
}
```

### Client Types (`client/src/types/competitor.types.ts`)

```typescript
export interface CompetitorProfile {
  id: string;
  domain: string;
  name: string | null;
  notes: string | null;
  createdAt: string;
  latestAudit?: {
    id: string;
    completedAt: string;
    seoScore: number | null;
    accessibilityScore: number | null;
    securityScore: number | null;
    performanceScore: number | null;
  };
}

export interface Comparison {
  id: string;
  name: string | null;
  myAudit: AuditSummary;
  competitorAudit: AuditSummary;
  createdAt: string;
}

export interface ComparisonDetail extends Comparison {
  scoresDiff: ScoresDiff;
  findingsDiff: FindingsDiff;
  recommendations: Recommendation[];
}

export interface Recommendation {
  category: string;
  gap: number;
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
}
```

---

## 5. Frontend Components

### New Pages

```
client/src/pages/competitors/
├── CompetitorList.tsx        -- List all competitor profiles
├── CompetitorDetail.tsx      -- View competitor + their audits
├── ComparisonList.tsx        -- List all comparisons
├── ComparisonDetail.tsx      -- Side-by-side comparison view
└── NewComparison.tsx         -- Create comparison wizard
```

### Page: CompetitorList.tsx
- Grid of competitor cards showing domain, name, latest scores
- "Add Competitor" button
- Quick actions: View, Audit, Delete

### Page: CompetitorDetail.tsx
- Competitor info header (domain, name, notes)
- List of audits for this competitor
- "Run New Audit" button
- "Compare with My Site" button (opens comparison picker)

### Page: ComparisonDetail.tsx (Main Feature)
- Header: "Your Site vs {Competitor}"
- **Score Cards Row**: 4 side-by-side score comparisons with diff indicators
  ```
  ┌─────────────────┐  ┌─────────────────┐
  │ SEO             │  │ Accessibility   │
  │ You: 85 (+7)    │  │ You: 72 (-13)   │
  │ Them: 78        │  │ Them: 85        │
  └─────────────────┘  └─────────────────┘
  ```
- **Overall Winner Badge**: "You're ahead in 2/4 categories"
- **Tabs**: Overview | SEO | Accessibility | Security | Performance
- **Findings Comparison**:
  - "Issues only you have" (areas to fix)
  - "Issues only they have" (your advantages)
  - "Issues you both have" (industry common)
- **Recommendations Panel**: Prioritized list of improvements

### New Components

```
client/src/components/comparison/
├── ScoreComparisonCard.tsx   -- Single category comparison
├── ScoreDiffIndicator.tsx    -- +7 or -13 badge
├── FindingsVennDiagram.tsx   -- Visual overlap (optional)
├── CompetitorSelector.tsx    -- Dropdown to pick competitor
├── AuditPicker.tsx           -- Select which audits to compare
└── RecommendationCard.tsx    -- Priority improvement card
```

### Navigation Update

```tsx
// In DashboardLayout.tsx sidebar
{hasPermission('competitor_comparison') && (
  <>
    <NavItem to="/competitors" icon={UsersIcon}>Competitors</NavItem>
    <NavItem to="/comparisons" icon={ScaleIcon}>Comparisons</NavItem>
  </>
)}
```

---

## 6. Feature Gating

### Middleware Check

```typescript
// In new route file: server/src/routes/competitors/index.ts
router.use(authenticate);
router.use(loadOrganization);
router.use(requireFeature('competitor_comparison'));
```

### Frontend Check

```typescript
// In OrganizationContext or similar
const canUseCompetitors = tierLimits?.competitor_comparison === true;

// Competitor domains are tracked SEPARATELY from normal domains
const maxCompetitorDomains = tierLimits?.max_competitor_domains ?? 0;
const competitorDomainsUsed = usage?.competitorDomainsUsed ?? 0;  // From usage API
const canAddMoreCompetitors = maxCompetitorDomains === null || competitorDomainsUsed < maxCompetitorDomains;

// Display remaining quota
// "You've used 5 of 20 competitor domains this month"
```

### Upgrade Prompt

When free/starter user tries to access:
```
┌────────────────────────────────────────┐
│  Competitor Comparison                 │
│                                        │
│  Compare your site against competitors │
│  to find opportunities for improvement │
│                                        │
│  Available on Pro plan and above       │
│                                        │
│  [Upgrade to Pro]  [Learn More]        │
└────────────────────────────────────────┘
```

---

## 7. Key SQL Queries

### Get Comparison Scores

```sql
SELECT
  a1.id as my_audit_id,
  a1.target_domain as my_domain,
  a1.seo_score as my_seo,
  a1.accessibility_score as my_accessibility,
  a1.security_score as my_security,
  a1.performance_score as my_performance,
  a2.id as competitor_audit_id,
  a2.target_domain as competitor_domain,
  a2.seo_score as competitor_seo,
  a2.accessibility_score as competitor_accessibility,
  a2.security_score as competitor_security,
  a2.performance_score as competitor_performance
FROM audit_comparisons ac
JOIN audit_jobs a1 ON ac.my_audit_id = a1.id
JOIN audit_jobs a2 ON ac.competitor_audit_id = a2.id
WHERE ac.id = $1;
```

### Get Findings Difference

```sql
-- Findings only in my audit
SELECT DISTINCT f.rule_id, f.rule_name, f.category, f.severity, COUNT(*) as count
FROM audit_findings f
WHERE f.audit_job_id = $1  -- my audit
AND f.rule_id NOT IN (
  SELECT rule_id FROM audit_findings WHERE audit_job_id = $2  -- competitor audit
)
GROUP BY f.rule_id, f.rule_name, f.category, f.severity;

-- Findings only in competitor audit
SELECT DISTINCT f.rule_id, f.rule_name, f.category, f.severity, COUNT(*) as count
FROM audit_findings f
WHERE f.audit_job_id = $2  -- competitor audit
AND f.rule_id NOT IN (
  SELECT rule_id FROM audit_findings WHERE audit_job_id = $1  -- my audit
)
GROUP BY f.rule_id, f.rule_name, f.category, f.severity;

-- Findings in both
SELECT DISTINCT f1.rule_id, f1.rule_name, f1.category, f1.severity
FROM audit_findings f1
JOIN audit_findings f2 ON f1.rule_id = f2.rule_id
WHERE f1.audit_job_id = $1 AND f2.audit_job_id = $2;
```

---

## 8. Implementation Files

### Server Files to Create

```
server/src/
├── routes/competitors/
│   └── index.ts              -- All competitor & comparison endpoints
├── services/
│   └── competitor.service.ts -- Business logic
├── types/
│   └── competitor.types.ts   -- Type definitions
└── db/migrations/
    └── 018_create_competitors.sql
```

### Server Files to Modify

```
server/src/types/organization.types.ts  -- Add TierLimits fields
server/src/routes/index.ts              -- Mount competitor routes
```

### Client Files to Create

```
client/src/
├── pages/competitors/
│   ├── CompetitorList.tsx
│   ├── CompetitorDetail.tsx
│   ├── ComparisonList.tsx
│   ├── ComparisonDetail.tsx
│   └── NewComparison.tsx
├── components/comparison/
│   ├── ScoreComparisonCard.tsx
│   ├── ScoreDiffIndicator.tsx
│   ├── CompetitorSelector.tsx
│   ├── AuditPicker.tsx
│   └── RecommendationCard.tsx
├── services/
│   └── competitors.api.ts    -- API client functions
└── types/
    └── competitor.types.ts
```

### Client Files to Modify

```
client/src/App.tsx                       -- Add routes
client/src/components/layout/DashboardLayout.tsx  -- Add nav items
client/src/types/organization.types.ts   -- Add TierLimits fields
```

---

## 9. Implementation Order

### Phase 1: Database & Types
1. Create migration `018_create_competitors.sql`
2. Run migration
3. Create `competitor.types.ts` (server + client)
4. Update `organization.types.ts` with new TierLimits fields

### Phase 2: Server API
1. Create `competitor.service.ts`
2. Create `routes/competitors/index.ts`
3. Mount routes in `routes/index.ts`
4. Test endpoints with curl/Postman

### Phase 3: Frontend - Competitors
1. Create `competitors.api.ts` client
2. Create `CompetitorList.tsx`
3. Create `CompetitorDetail.tsx`
4. Add navigation items
5. Add routes to App.tsx

### Phase 4: Frontend - Comparisons
1. Create `ComparisonList.tsx`
2. Create `NewComparison.tsx` (wizard)
3. Create `ComparisonDetail.tsx` (main feature)
4. Create comparison components

### Phase 5: Polish
1. Add upgrade prompts for free users
2. Add empty states
3. Add loading skeletons
4. Test responsive design

---

## 10. Verification

### Manual Testing
1. Create competitor profile
2. Run audit on competitor domain
3. Run audit on own domain
4. Create comparison between the two
5. Verify scores diff calculation
6. Verify findings diff shows correct groupings
7. Test with free tier - should see upgrade prompt
8. Test competitor limit enforcement

### API Testing
```bash
# Create competitor
curl -X POST /api/organizations/{orgId}/competitors \
  -H "Content-Type: application/json" \
  -d '{"domain": "competitor.com", "name": "Main Competitor"}'

# Run competitor audit
curl -X POST /api/organizations/{orgId}/competitors/{id}/audit

# Create comparison
curl -X POST /api/organizations/{orgId}/comparisons \
  -d '{"myAuditId": "...", "competitorAuditId": "..."}'

# Get comparison details
curl /api/organizations/{orgId}/comparisons/{id}
```

---

## 11. Future Enhancements

- **Automated Tracking**: Schedule regular competitor audits
- **Historical Charts**: Score trends over time vs competitors
- **Industry Benchmarks**: Anonymous aggregate comparisons
- **Multi-Competitor**: Compare against multiple competitors at once
- **Export**: PDF/CSV comparison reports
- **Alerts**: Notify when competitor scores change significantly

---

*Competitor Comparison Feature Spec - v1.0*
*Created: 2026-01-30*
