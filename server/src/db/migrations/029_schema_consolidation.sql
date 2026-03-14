-- ============================================================
-- MIGRATION 029: Schema Consolidation (User-Centric)
-- ============================================================
-- This migration ensures all required columns exist with safe defaults,
-- sets correct tier limits, and adds missing indexes.
-- Safe to re-run due to IF NOT EXISTS clauses.

-- ============================================================
-- 1. Ensure sites.owner_id exists and is populated
-- ============================================================

ALTER TABLE sites ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);

-- Populate owner_id from created_by where NULL
UPDATE sites SET owner_id = created_by WHERE owner_id IS NULL AND created_by IS NOT NULL;

-- Create index on owner_id
CREATE INDEX IF NOT EXISTS idx_sites_owner ON sites(owner_id);

-- ============================================================
-- 2. Ensure subscriptions.user_id exists
-- ============================================================

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- ============================================================
-- 3. Ensure tier_limits has all columns with correct values
-- ============================================================

ALTER TABLE tier_limits ADD COLUMN IF NOT EXISTS max_sites INTEGER;
ALTER TABLE tier_limits ADD COLUMN IF NOT EXISTS max_sites_per_user INTEGER;

-- Set correct free tier limits (1 site allowed)
UPDATE tier_limits SET
  max_sites = COALESCE(NULLIF(max_sites, 0), 1),
  max_sites_per_user = COALESCE(NULLIF(max_sites_per_user, 0), 1)
WHERE tier = 'free';

-- Set starter tier
UPDATE tier_limits SET
  max_sites = COALESCE(NULLIF(max_sites, 0), 3),
  max_sites_per_user = COALESCE(NULLIF(max_sites_per_user, 0), 3)
WHERE tier = 'starter';

-- Set pro tier
UPDATE tier_limits SET
  max_sites = COALESCE(NULLIF(max_sites, 0), 10),
  max_sites_per_user = COALESCE(NULLIF(max_sites_per_user, 0), 10)
WHERE tier = 'pro';

-- Set agency tier
UPDATE tier_limits SET
  max_sites = COALESCE(NULLIF(max_sites, 0), 50),
  max_sites_per_user = COALESCE(NULLIF(max_sites_per_user, 0), 50)
WHERE tier = 'agency';

-- Set enterprise tier (NULL = unlimited)
UPDATE tier_limits SET
  max_sites = NULL,
  max_sites_per_user = NULL
WHERE tier = 'enterprise';

-- ============================================================
-- 4. Ensure site_shares table exists for user-centric sharing
-- ============================================================

-- Create site_permission type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE site_permission AS ENUM ('viewer', 'editor', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create site_shares table
CREATE TABLE IF NOT EXISTS site_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(20) NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_site_shares_user ON site_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_site_shares_site ON site_shares(site_id);

-- ============================================================
-- 5. Ensure site_urls table exists
-- ============================================================

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
  last_content_score INTEGER,

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

-- ============================================================
-- 6. Ensure site_invitations table exists
-- ============================================================

-- Ensure invite_status type exists
DO $$ BEGIN
  CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS site_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  permission VARCHAR(20) NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES users(id),
  token VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_site_invitations_token ON site_invitations(token);
CREATE INDEX IF NOT EXISTS idx_site_invitations_site ON site_invitations(site_id);

-- ============================================================
-- 7. Ensure audit_jobs.url_id column exists
-- ============================================================

ALTER TABLE audit_jobs ADD COLUMN IF NOT EXISTS url_id UUID REFERENCES site_urls(id);
CREATE INDEX IF NOT EXISTS idx_audit_jobs_url ON audit_jobs(url_id);

-- ============================================================
-- 8. Ensure user_activity_log table exists
-- ============================================================

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
-- 9. Add missing verification columns to sites
-- ============================================================

ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS verification_method VARCHAR(20),
  ADD COLUMN IF NOT EXISTS verification_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_verification_attempt TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ignore_robots_txt BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rate_limit_profile VARCHAR(20) DEFAULT 'conservative',
  ADD COLUMN IF NOT EXISTS send_verification_header BOOLEAN DEFAULT TRUE;

-- ============================================================
-- 10. Add helper functions for user-centric model
-- ============================================================

-- Function to check if user has access to a site (safe to re-create)
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

-- ============================================================
-- 11. Create triggers for site_urls (idempotent)
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
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE site_shares IS 'Tracks which users have access to which sites (user-centric model)';
COMMENT ON TABLE site_invitations IS 'Pending invitations to share site access';
COMMENT ON TABLE site_urls IS 'First-class URL entities under sites, tracks audit history per URL';
COMMENT ON TABLE user_activity_log IS 'User activity log for audit trail';
COMMENT ON COLUMN sites.owner_id IS 'The user who owns this site';
COMMENT ON COLUMN audit_jobs.url_id IS 'Reference to the specific URL being audited';
