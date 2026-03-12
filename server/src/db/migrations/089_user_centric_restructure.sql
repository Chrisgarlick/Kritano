-- Migration 025: User-Centric Architecture Restructure
-- Remove organizations entirely, move to user-owned sites with sharing
-- New hierarchy: User → Sites → URLs → Audits

-- ============================================================
-- PHASE 1A: Create new types and tables
-- ============================================================

-- Site permission levels for sharing
DO $$ BEGIN
  CREATE TYPE site_permission AS ENUM ('viewer', 'editor', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Site sharing (replaces organization_members)
CREATE TABLE IF NOT EXISTS site_shares (
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

CREATE INDEX IF NOT EXISTS idx_site_shares_site ON site_shares(site_id);
CREATE INDEX IF NOT EXISTS idx_site_shares_user ON site_shares(user_id);

-- Site invitations (replaces organization_invitations)
CREATE TABLE IF NOT EXISTS site_invitations (
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

CREATE INDEX IF NOT EXISTS idx_site_invitations_token ON site_invitations(token);
CREATE INDEX IF NOT EXISTS idx_site_invitations_site ON site_invitations(site_id);

-- Site URLs - first-class URL entities (replaces site_known_pages)
CREATE TABLE IF NOT EXISTS site_urls (
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

CREATE INDEX IF NOT EXISTS idx_site_urls_site ON site_urls(site_id);
CREATE INDEX IF NOT EXISTS idx_site_urls_path ON site_urls(site_id, url_path);

-- User activity log (replaces organization_audit_log)
CREATE TABLE IF NOT EXISTS user_activity_log (
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

CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity_log(created_at DESC);

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

-- Add user_id to subscriptions (user-level subscriptions)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Add user_id to usage_records (user-level usage)
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

-- For sites without organizations, set owner to created_by
UPDATE sites
SET owner_id = created_by
WHERE owner_id IS NULL AND created_by IS NOT NULL;

-- Migrate verification from organization_domains to sites
UPDATE sites s
SET
  verified = COALESCE(od.verified, s.verified),
  verification_token = COALESCE(od.verification_token, s.verification_token),
  verified_at = COALESCE(od.verified_at, s.verified_at),
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
WHERE site_id IS NOT NULL AND status = 'completed'
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

-- Make owner_id required for future sites (existing NULL sites already migrated above)
-- We'll add NOT NULL constraint after all data is migrated

-- Create index on sites.owner_id
CREATE INDEX IF NOT EXISTS idx_sites_owner ON sites(owner_id);

-- Create index on audit_jobs.url_id
CREATE INDEX IF NOT EXISTS idx_audit_jobs_url ON audit_jobs(url_id);

-- ============================================================
-- PHASE 1E: Create triggers
-- ============================================================

-- Trigger to update site_urls audit count
CREATE OR REPLACE FUNCTION update_url_audit_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.url_id IS NOT NULL THEN
    UPDATE site_urls SET audit_count = audit_count + 1, updated_at = NOW()
    WHERE id = NEW.url_id;
  ELSIF TG_OP = 'DELETE' AND OLD.url_id IS NOT NULL THEN
    UPDATE site_urls SET audit_count = audit_count - 1, updated_at = NOW()
    WHERE id = OLD.url_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_url_audit_count ON audit_jobs;
CREATE TRIGGER trigger_update_url_audit_count
AFTER INSERT OR DELETE ON audit_jobs
FOR EACH ROW
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

DROP TRIGGER IF EXISTS trigger_update_url_latest_audit ON audit_jobs;
CREATE TRIGGER trigger_update_url_latest_audit
AFTER UPDATE ON audit_jobs
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION update_url_latest_audit();

-- Trigger to update site_urls timestamp on update
CREATE OR REPLACE FUNCTION update_site_urls_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS site_urls_updated ON site_urls;
CREATE TRIGGER site_urls_updated
  BEFORE UPDATE ON site_urls
  FOR EACH ROW
  EXECUTE FUNCTION update_site_urls_timestamp();

-- ============================================================
-- PHASE 1F: Update tier limits for user-level (remove seats focus)
-- ============================================================

-- Add max_sites_per_user if not exists (already may exist from 019)
ALTER TABLE tier_limits ADD COLUMN IF NOT EXISTS max_sites_per_user INTEGER;

-- Update tier limits (sites are per-user now, not per-org)
UPDATE tier_limits SET max_sites_per_user = max_sites WHERE max_sites_per_user IS NULL;

-- ============================================================
-- PHASE 1G: Helper functions for user-centric model
-- ============================================================

-- Function to check if user has access to a site
CREATE OR REPLACE FUNCTION user_has_site_access(p_user_id UUID, p_site_id UUID)
RETURNS TABLE(has_access BOOLEAN, permission TEXT) AS $$
BEGIN
  -- Check if owner
  IF EXISTS (SELECT 1 FROM sites WHERE id = p_site_id AND owner_id = p_user_id) THEN
    RETURN QUERY SELECT TRUE, 'owner'::TEXT;
    RETURN;
  END IF;

  -- Check if shared
  RETURN QUERY
  SELECT TRUE, ss.permission::TEXT
  FROM site_shares ss
  WHERE ss.site_id = p_site_id
    AND ss.user_id = p_user_id
    AND ss.accepted_at IS NOT NULL;

  -- No access
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's tier limits
CREATE OR REPLACE FUNCTION get_user_limits(p_user_id UUID)
RETURNS tier_limits AS $$
DECLARE
  tier_val subscription_tier;
  limits tier_limits;
BEGIN
  -- Get user's subscription tier
  SELECT tier INTO tier_val
  FROM subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Default to free if no subscription
  IF tier_val IS NULL THEN
    tier_val := 'free';
  END IF;

  SELECT * INTO limits FROM tier_limits WHERE tier = tier_val;
  RETURN limits;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can add more sites
CREATE OR REPLACE FUNCTION check_user_site_limit(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, reason TEXT, used INT, max_allowed INT) AS $$
DECLARE
  limits tier_limits;
  current_count INT;
BEGIN
  limits := get_user_limits(p_user_id);

  -- Count current sites owned by user
  SELECT COUNT(*)::INT INTO current_count
  FROM sites
  WHERE owner_id = p_user_id;

  -- Check limit
  IF limits.max_sites IS NULL THEN
    -- Unlimited
    RETURN QUERY SELECT TRUE, NULL::TEXT, current_count, NULL::INT;
  ELSIF current_count >= limits.max_sites THEN
    RETURN QUERY SELECT FALSE,
      format('You have reached your limit of %s sites. Upgrade your plan for more.', limits.max_sites),
      current_count, limits.max_sites;
  ELSE
    RETURN QUERY SELECT TRUE, NULL::TEXT, current_count, limits.max_sites;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE site_shares IS 'Tracks which users have access to which sites (replaces organization_members)';
COMMENT ON TABLE site_invitations IS 'Pending invitations to share site access';
COMMENT ON TABLE site_urls IS 'First-class URL entities under sites, tracks audit history per URL';
COMMENT ON TABLE user_activity_log IS 'User activity log for audit trail';
COMMENT ON COLUMN sites.owner_id IS 'The user who owns this site';
COMMENT ON COLUMN audit_jobs.url_id IS 'Reference to the specific URL being audited';
