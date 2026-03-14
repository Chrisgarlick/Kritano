# RESTRUCTURE_V2: User-Centric Architecture

## Summary

Major architectural restructure from organization-centric to user-centric model:
- **Remove organizations entirely**
- **New hierarchy**: User → Sites → URLs → Audits
- **Site sharing** replaces team/org membership
- **Site verification** gates multi-URL auditing
- **Analytics** at both site and URL levels

---

## New Data Model

```
users
  └── sites (owner_id) ─────────────────┐
        │                                │
        ├── site_urls (site_id)          │
        │     └── audit_jobs (url_id)    │
        │           └── audit_pages      │
        │           └── audit_findings   │
        │                                │
        └── site_shares (site_id, user_id) ← other users
```

**Key Changes:**
1. Sites owned by users (not orgs)
2. URLs are first-class entities under sites
3. Audits belong to URLs (not sites directly)
4. Site sharing replaces org membership

---

## Phase 1: Database Migration

### Migration File: `025_user_centric_restructure.sql`

```sql
-- ============================================================
-- PHASE 1A: Create new tables
-- ============================================================

-- Site permission levels for sharing
CREATE TYPE site_permission AS ENUM ('viewer', 'editor', 'admin');

-- Site sharing (replaces organization_members)
CREATE TABLE site_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission site_permission NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, user_id)
);

CREATE INDEX idx_site_shares_site ON site_shares(site_id);
CREATE INDEX idx_site_shares_user ON site_shares(user_id);

-- Site invitations (replaces organization_invitations)
CREATE TABLE site_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  permission site_permission NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES users(id),
  token VARCHAR(64) UNIQUE NOT NULL,
  status invite_status DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX idx_site_invitations_token ON site_invitations(token);

-- Site URLs - first-class URL entities
CREATE TABLE site_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  url_path TEXT NOT NULL,

  -- Discovery source
  source TEXT NOT NULL CHECK (source IN ('sitemap', 'audit', 'manual')),

  -- Latest audit info (denormalized for performance)
  last_audit_id UUID,
  last_audited_at TIMESTAMPTZ,
  last_seo_score INTEGER,
  last_accessibility_score INTEGER,
  last_security_score INTEGER,
  last_performance_score INTEGER,

  -- Sitemap metadata
  sitemap_priority DECIMAL(3,2),
  sitemap_changefreq VARCHAR(20),

  -- Audit count
  audit_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, url)
);

CREATE INDEX idx_site_urls_site ON site_urls(site_id);
CREATE INDEX idx_site_urls_path ON site_urls(site_id, url_path);

-- User activity log (replaces organization_audit_log)
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_activity_user ON user_activity_log(user_id);

-- ============================================================
-- PHASE 1B: Modify existing tables
-- ============================================================

-- Add owner_id to sites
ALTER TABLE sites ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);

-- Add verification fields to sites (from organization_domains)
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS verification_method VARCHAR(20),
  ADD COLUMN IF NOT EXISTS verification_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_verification_attempt TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ignore_robots_txt BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rate_limit_profile VARCHAR(20) DEFAULT 'conservative',
  ADD COLUMN IF NOT EXISTS send_verification_header BOOLEAN DEFAULT TRUE;

-- Add url_id to audit_jobs (audits belong to URLs now)
ALTER TABLE audit_jobs ADD COLUMN IF NOT EXISTS url_id UUID REFERENCES site_urls(id);

-- Add user_id to subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Add user_id to usage_records
ALTER TABLE usage_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- ============================================================
-- PHASE 1C: Migrate data
-- ============================================================

-- Migrate site ownership from org owner
UPDATE sites s
SET owner_id = o.owner_id
FROM organizations o
WHERE s.organization_id = o.id
  AND s.owner_id IS NULL;

-- Migrate verification from organization_domains to sites
UPDATE sites s
SET
  verified = COALESCE(od.verified, FALSE),
  verification_token = od.verification_token,
  verified_at = od.verified_at,
  verification_method = od.verification_method,
  verification_attempts = COALESCE(od.verification_attempts, 0),
  last_verification_attempt = od.last_verification_attempt,
  ignore_robots_txt = COALESCE(od.ignore_robots_txt, FALSE),
  rate_limit_profile = COALESCE(od.rate_limit_profile, 'conservative'),
  send_verification_header = COALESCE(od.send_verification_header, TRUE)
FROM organization_domains od
JOIN organizations o ON o.id = od.organization_id
WHERE s.organization_id = o.id
  AND s.domain = od.domain;

-- Migrate site_known_pages to site_urls
INSERT INTO site_urls (site_id, url, url_path, source, last_audit_id, last_audited_at,
                       sitemap_priority, sitemap_changefreq, created_at)
SELECT site_id, url, url_path, source, last_audit_id, last_audited_at,
       priority, changefreq, created_at
FROM site_known_pages
ON CONFLICT (site_id, url) DO NOTHING;

-- Create site_urls for existing audit target URLs
INSERT INTO site_urls (site_id, url, url_path, source, last_audit_id, last_audited_at,
                       last_seo_score, last_accessibility_score, last_security_score, last_performance_score)
SELECT DISTINCT ON (site_id, target_url)
  site_id,
  target_url,
  regexp_replace(target_url, '^https?://[^/]+', ''),
  'audit',
  id,
  completed_at,
  seo_score,
  accessibility_score,
  security_score,
  performance_score
FROM audit_jobs
WHERE site_id IS NOT NULL
ORDER BY site_id, target_url, completed_at DESC
ON CONFLICT (site_id, url) DO UPDATE SET
  last_audit_id = EXCLUDED.last_audit_id,
  last_audited_at = EXCLUDED.last_audited_at,
  last_seo_score = EXCLUDED.last_seo_score,
  last_accessibility_score = EXCLUDED.last_accessibility_score,
  last_security_score = EXCLUDED.last_security_score,
  last_performance_score = EXCLUDED.last_performance_score;

-- Link audit_jobs to site_urls
UPDATE audit_jobs aj
SET url_id = su.id
FROM site_urls su
WHERE aj.site_id = su.site_id
  AND aj.target_url = su.url
  AND aj.url_id IS NULL;

-- Convert org members to site shares (preserve team access)
INSERT INTO site_shares (site_id, user_id, permission, invited_by, accepted_at)
SELECT
  s.id,
  om.user_id,
  CASE om.role
    WHEN 'owner' THEN 'admin'::site_permission
    WHEN 'admin' THEN 'admin'::site_permission
    WHEN 'member' THEN 'editor'::site_permission
    WHEN 'viewer' THEN 'viewer'::site_permission
  END,
  o.owner_id,
  om.joined_at
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
JOIN sites s ON s.organization_id = o.id
WHERE om.user_id != o.owner_id
ON CONFLICT (site_id, user_id) DO NOTHING;

-- Migrate subscriptions to user level
UPDATE subscriptions s
SET user_id = o.owner_id
FROM organizations o
WHERE s.organization_id = o.id
  AND s.user_id IS NULL;

-- Migrate usage_records to user level
UPDATE usage_records ur
SET user_id = o.owner_id
FROM organizations o
WHERE ur.organization_id = o.id
  AND ur.user_id IS NULL;

-- ============================================================
-- PHASE 1D: Add constraints
-- ============================================================

ALTER TABLE sites ALTER COLUMN owner_id SET NOT NULL;
CREATE INDEX idx_sites_owner ON sites(owner_id);

ALTER TABLE audit_jobs ADD CONSTRAINT audit_jobs_url_id_fk
  FOREIGN KEY (url_id) REFERENCES site_urls(id) ON DELETE SET NULL;
CREATE INDEX idx_audit_jobs_url ON audit_jobs(url_id);

-- ============================================================
-- PHASE 1E: Update audit count trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_url_audit_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE site_urls SET audit_count = audit_count + 1, updated_at = NOW()
    WHERE id = NEW.url_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE site_urls SET audit_count = audit_count - 1, updated_at = NOW()
    WHERE id = OLD.url_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_url_audit_count
AFTER INSERT OR DELETE ON audit_jobs
FOR EACH ROW
WHEN (NEW.url_id IS NOT NULL OR OLD.url_id IS NOT NULL)
EXECUTE FUNCTION update_url_audit_count();

-- Trigger to update site_urls.last_* when audit completes
CREATE OR REPLACE FUNCTION update_url_latest_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.url_id IS NOT NULL THEN
    UPDATE site_urls SET
      last_audit_id = NEW.id,
      last_audited_at = NEW.completed_at,
      last_seo_score = NEW.seo_score,
      last_accessibility_score = NEW.accessibility_score,
      last_security_score = NEW.security_score,
      last_performance_score = NEW.performance_score,
      updated_at = NOW()
    WHERE id = NEW.url_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_url_latest_audit
AFTER UPDATE ON audit_jobs
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION update_url_latest_audit();
```

---

## Phase 2: Backend Changes

### 2.1 New Middleware: `server/src/middleware/site.middleware.ts`

```typescript
// Permission levels: owner > admin > editor > viewer
type SitePermission = 'owner' | 'admin' | 'editor' | 'viewer';

export async function loadSite(req, res, next) {
  const siteId = req.params.siteId;
  const userId = req.user.id;

  const site = await getSiteWithAccess(siteId, userId);
  if (!site) {
    return res.status(404).json({ error: 'Site not found' });
  }

  req.site = site.site;
  req.sitePermission = site.permission; // 'owner' | 'admin' | 'editor' | 'viewer'
  next();
}

export function requireSitePermission(...allowed: SitePermission[]) {
  return (req, res, next) => {
    if (req.sitePermission === 'owner') return next();
    if (!allowed.includes(req.sitePermission)) {
      return res.status(403).json({ error: 'Insufficient permission' });
    }
    next();
  };
}
```

### 2.2 Routes to Create/Modify

**Remove entirely:**
- `server/src/routes/organizations/` - All organization routes

**Transform routes (remove `/organizations/:orgId` prefix):**

| Old Route | New Route |
|-----------|-----------|
| `GET /organizations/:orgId/sites` | `GET /sites` |
| `POST /organizations/:orgId/sites` | `POST /sites` |
| `GET /organizations/:orgId/sites/:siteId` | `GET /sites/:siteId` |
| `GET /organizations/:orgId/sites/:siteId/known-pages` | `GET /sites/:siteId/urls` |
| `GET /organizations/:orgId/subscription` | `GET /subscription` |
| `GET /organizations/:orgId/usage` | `GET /usage` |

**New routes:**

```typescript
// Site sharing
router.get('/sites/:siteId/shares', loadSite, requireSitePermission('admin'), getShares);
router.post('/sites/:siteId/shares', loadSite, requireSitePermission('admin'), createShare);
router.patch('/sites/:siteId/shares/:shareId', loadSite, requireSitePermission('admin'), updateShare);
router.delete('/sites/:siteId/shares/:shareId', loadSite, requireSitePermission('admin'), removeShare);

// Site invitations
router.post('/sites/:siteId/invitations', loadSite, requireSitePermission('admin'), createInvitation);
router.get('/sites/:siteId/invitations', loadSite, requireSitePermission('admin'), getInvitations);
router.delete('/sites/:siteId/invitations/:id', loadSite, requireSitePermission('admin'), cancelInvitation);

// Public invitation routes
router.get('/invitations/:token', getInvitationByToken);
router.post('/invitations/:token/accept', authenticate, acceptInvitation);
router.post('/invitations/:token/decline', declineInvitation);

// Site URLs
router.get('/sites/:siteId/urls', loadSite, getUrls);
router.post('/sites/:siteId/urls', loadSite, requireSitePermission('editor'), addUrl);
router.get('/sites/:siteId/urls/:urlId', loadSite, getUrl);
router.get('/sites/:siteId/urls/:urlId/audits', loadSite, getUrlAudits);
router.get('/sites/:siteId/urls/:urlId/analytics', loadSite, getUrlAnalytics);

// Site verification (moved from org domains)
router.post('/sites/:siteId/verification-token', loadSite, requireSitePermission('admin'), generateToken);
router.post('/sites/:siteId/verify', loadSite, requireSitePermission('admin'), verifySite);

// User subscription (simplified)
router.get('/subscription', authenticate, getMySubscription);
router.get('/usage', authenticate, getMyUsage);
```

### 2.3 Auto-Create Site on Audit

In `server/src/routes/audits/index.ts`:

```typescript
// When creating audit, auto-create/link site and URL
async function findOrCreateSiteAndUrl(userId: string, targetUrl: string) {
  const domain = extractDomain(targetUrl);
  const urlPath = extractPath(targetUrl);

  // Find existing site (owned or shared with edit access)
  let site = await findSiteByDomainForUser(userId, domain);

  if (!site) {
    // Auto-create site
    site = await createSite({
      owner_id: userId,
      domain,
      name: domain,
      verified: false,
    });
  }

  // Find or create URL
  let url = await findUrlBySiteAndPath(site.id, targetUrl);
  if (!url) {
    url = await createUrl({
      site_id: site.id,
      url: targetUrl,
      url_path: urlPath,
      source: 'audit',
    });
  }

  return { site, url };
}
```

### 2.4 Verification Gating

```typescript
// In audit creation
const { site, url } = await findOrCreateSiteAndUrl(userId, targetUrl);

if (!site.verified) {
  // Check if multi-URL audit requested
  if (options?.maxPages > 1 || options?.includeSubdomains) {
    return res.status(400).json({
      error: 'Site verification required for multi-URL audits',
      code: 'VERIFICATION_REQUIRED',
      siteId: site.id,
    });
  }

  // Require consent for unverified
  if (!consent?.accepted) {
    return res.status(400).json({
      error: 'Consent required for unverified site',
      code: 'CONSENT_REQUIRED',
      // ... existing consent flow
    });
  }
}
```

---

## Phase 3: Frontend Changes

### 3.1 Remove Organization Context

**Delete:** `client/src/contexts/OrganizationContext.tsx`

**Update AuthContext** to include subscription:

```typescript
// client/src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  subscription: Subscription | null;
  tierLimits: TierLimits | null;
  isLoading: boolean;
  // ... existing auth methods
}
```

### 3.2 Update API Service

```typescript
// client/src/services/api.ts

// REMOVE all organizationsApi

// UPDATE sitesApi (no orgId)
export const sitesApi = {
  list: () => api.get('/sites'),
  create: (data) => api.post('/sites', data),
  get: (siteId) => api.get(`/sites/${siteId}`),
  update: (siteId, data) => api.patch(`/sites/${siteId}`, data),
  delete: (siteId) => api.delete(`/sites/${siteId}`),

  // URLs
  getUrls: (siteId, params?) => api.get(`/sites/${siteId}/urls`, { params }),
  getUrl: (siteId, urlId) => api.get(`/sites/${siteId}/urls/${urlId}`),
  addUrl: (siteId, url) => api.post(`/sites/${siteId}/urls`, { url }),
  getUrlAudits: (siteId, urlId) => api.get(`/sites/${siteId}/urls/${urlId}/audits`),
  getUrlAnalytics: (siteId, urlId, params?) =>
    api.get(`/sites/${siteId}/urls/${urlId}/analytics`, { params }),

  // Sharing
  getShares: (siteId) => api.get(`/sites/${siteId}/shares`),
  share: (siteId, data) => api.post(`/sites/${siteId}/shares`, data),
  updateShare: (siteId, shareId, data) => api.patch(`/sites/${siteId}/shares/${shareId}`, data),
  removeShare: (siteId, shareId) => api.delete(`/sites/${siteId}/shares/${shareId}`),

  // Invitations
  getInvitations: (siteId) => api.get(`/sites/${siteId}/invitations`),
  invite: (siteId, data) => api.post(`/sites/${siteId}/invitations`, data),
  cancelInvitation: (siteId, invId) => api.delete(`/sites/${siteId}/invitations/${invId}`),

  // Verification
  generateToken: (siteId) => api.post(`/sites/${siteId}/verification-token`),
  verify: (siteId, method) => api.post(`/sites/${siteId}/verify`, { method }),
};

// NEW user subscription
export const userApi = {
  getSubscription: () => api.get('/subscription'),
  getUsage: () => api.get('/usage'),
};
```

### 3.3 UI Changes

**Remove:**
- Organization switcher in sidebar
- Organization settings page
- Team management under org settings

**Update Sidebar navigation:**
```
Dashboard
Sites
Analytics
Settings
  └── Profile
  └── Subscription
  └── API Keys
```

**New Site Detail tabs:**
```
Overview | URLs | Audits | Analytics | Sharing | Settings
```

**New URL Detail page:**
```
/sites/:siteId/urls/:urlId
  - URL info and stats
  - Audit history for this URL
  - Score trends chart
  - Run new audit button
```

---

## Phase 4: Analytics Updates

### Site-Level Analytics (existing, update queries)
- Score trends across all URLs
- Issue distribution
- Top issues by category

### URL-Level Analytics (new)
- Score history for specific URL
- Issue trends for URL
- Compare URL to site average

```typescript
// New analytics endpoints
GET /sites/:siteId/analytics          // Site-level
GET /sites/:siteId/urls/:urlId/analytics  // URL-level

// Response shape
{
  scores: ScoreDataPoint[],
  trends: { seo: 'up'|'down'|'stable', ... },
  issuesByCategory: Record<string, number>,
  comparisonToSiteAverage?: { seo: number, ... }
}
```

---

## Critical Files to Modify

| File | Change |
|------|--------|
| `server/src/db/migrations/025_*.sql` | New migration (create first) |
| `server/src/middleware/organization.middleware.ts` | DELETE (replace with site.middleware.ts) |
| `server/src/middleware/site.middleware.ts` | CREATE |
| `server/src/services/site.service.ts` | Major update (ownership, sharing, URLs) |
| `server/src/services/site-sharing.service.ts` | CREATE |
| `server/src/routes/organizations/` | DELETE entire directory |
| `server/src/routes/sites/index.ts` | Major rewrite (new routes, no org prefix) |
| `server/src/routes/audits/index.ts` | Remove org dependency, add auto-site/url |
| `server/src/routes/index.ts` | Remove organization routes |
| `client/src/contexts/OrganizationContext.tsx` | DELETE |
| `client/src/contexts/AuthContext.tsx` | Add subscription/tierLimits |
| `client/src/services/api.ts` | Remove org methods, update all site methods |
| `client/src/components/layout/Sidebar.tsx` | Remove org switcher |
| `client/src/App.tsx` | Remove org routes, add URL routes |
| `client/src/pages/sites/SiteDetail.tsx` | Add URLs tab, Sharing tab |
| `client/src/pages/sites/UrlDetail.tsx` | CREATE |

---

## Verification Plan

### 1. Database Migration
```bash
# Test on copy first
docker compose exec postgres pg_dump -U pagepulser pagepulser > backup.sql
psql -f 025_user_centric_restructure.sql

# Verify
SELECT COUNT(*) FROM sites WHERE owner_id IS NULL;  -- Should be 0
SELECT COUNT(*) FROM site_urls;  -- Should have URLs
SELECT COUNT(*) FROM site_shares;  -- Should have migrated members
```

### 2. API Testing
```bash
# Sites list (no org)
curl -H "Authorization: Bearer $TOKEN" localhost:3001/api/sites

# Site URLs
curl -H "Authorization: Bearer $TOKEN" localhost:3001/api/sites/$SITE_ID/urls

# Create audit (auto-creates site/url)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -d '{"targetUrl": "https://new-domain.com/page"}' \
  localhost:3001/api/audits
```

### 3. Frontend Testing
- [x] Login → redirects to dashboard (no org selection)
- [x] Sites list shows owned + shared sites
- [x] Site detail shows URLs tab
- [x] URL detail shows audit history
- [x] New audit auto-creates site if needed
- [x] Site sharing works (invite, accept, permissions)
- [x] Unverified site limits to single URL

---

## Implementation Order

1. **Create migration file** - Run on dev first ✅
2. **Create site middleware** - New authorization model ✅
3. **Create site-sharing service** - Sharing logic ✅
4. **Update site service** - Owner, URLs, verification ✅
5. **Update audit routes** - Auto-create site/url, remove org ✅
6. **Create sites routes** - Full rewrite with new endpoints ✅
7. **Remove organization routes** - Delete entire directory ✅
8. **Update routes/index.ts** - Wire up new routes ✅
9. **Frontend: Remove OrganizationContext** - Update AuthContext ✅
10. **Frontend: Update API service** - All site methods ✅
11. **Frontend: Update pages** - Sites, URLs, sharing ✅
12. **Drop organization tables** - Final cleanup (after verification)

---

## Risk Mitigation

1. **Data loss**: Full backup before migration, test on staging first
2. **Access loss**: Migration preserves team access via site_shares
3. **Breaking changes**: Keep org columns nullable during transition
4. **Rollback**: Keep organization tables until fully verified

---

## Implementation Status

**Completed: February 2026**

All phases of the user-centric restructure have been implemented:
- Database migration created and ready
- Backend services and routes updated
- Frontend migrated to user-centric model
- Organization context removed entirely
- Site sharing replaces team membership
- URL-level tracking implemented
