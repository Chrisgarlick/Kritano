-- Migration: Create sites table and restructure around site-centric model
-- Sites become the primary organizational unit for audits

-- =============================================
-- PHASE 1: Create Sites Table
-- =============================================

CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Site identity
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,

  -- Optional metadata
  description TEXT,
  logo_url VARCHAR(500),

  -- Domain verification (optional)
  verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verified_at TIMESTAMPTZ,

  -- Site-specific settings (JSON)
  settings JSONB DEFAULT '{}',

  -- Tracking
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(organization_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_sites_org ON sites(organization_id);
CREATE INDEX IF NOT EXISTS idx_sites_domain ON sites(domain);

-- Update trigger for sites
CREATE OR REPLACE FUNCTION update_site_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS site_updated ON sites;
CREATE TRIGGER site_updated
  BEFORE UPDATE ON sites
  FOR EACH ROW
  EXECUTE FUNCTION update_site_timestamp();

-- =============================================
-- PHASE 2: Add site_id to Related Tables
-- =============================================

-- Add site_id to audit_jobs
ALTER TABLE audit_jobs ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_audit_jobs_site ON audit_jobs(site_id);

-- =============================================
-- PHASE 3: Update Tier Limits
-- =============================================

-- Add new tier limit columns
ALTER TABLE tier_limits ADD COLUMN IF NOT EXISTS max_sites INTEGER;

-- Update tier configurations
-- Free: 1 site
UPDATE tier_limits SET max_sites = 1 WHERE tier = 'free';

-- Starter: 3 sites
UPDATE tier_limits SET max_sites = 3 WHERE tier = 'starter';

-- Pro: 10 sites
UPDATE tier_limits SET max_sites = 10 WHERE tier = 'pro';

-- Agency: 50 sites
UPDATE tier_limits SET max_sites = 50 WHERE tier = 'agency';

-- Enterprise: Unlimited
UPDATE tier_limits SET max_sites = NULL WHERE tier = 'enterprise';

-- =============================================
-- PHASE 4: Migrate Existing Data
-- =============================================

-- Create sites from existing unique domains in audit_jobs
INSERT INTO sites (organization_id, name, domain, created_at, created_by)
SELECT DISTINCT ON (organization_id, target_domain)
  organization_id,
  target_domain as name,
  target_domain as domain,
  MIN(created_at) OVER (PARTITION BY organization_id, target_domain) as created_at,
  (SELECT user_id FROM audit_jobs aj2
   WHERE aj2.organization_id = audit_jobs.organization_id
   AND aj2.target_domain = audit_jobs.target_domain
   ORDER BY created_at LIMIT 1) as created_by
FROM audit_jobs
WHERE organization_id IS NOT NULL
  AND target_domain IS NOT NULL
  AND target_domain != ''
ON CONFLICT (organization_id, domain) DO NOTHING;

-- Link existing audits to their sites
UPDATE audit_jobs aj
SET site_id = s.id
FROM sites s
WHERE aj.organization_id = s.organization_id
  AND aj.target_domain = s.domain
  AND aj.site_id IS NULL;
