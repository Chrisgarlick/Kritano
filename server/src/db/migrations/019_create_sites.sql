-- Migration: Create sites table and restructure around site-centric model
-- Sites become the primary organizational unit for audits, competitors, and comparisons

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

-- Add site_id to competitor_profiles
ALTER TABLE competitor_profiles ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_competitor_profiles_site ON competitor_profiles(site_id);

-- Add site_id to audit_comparisons
ALTER TABLE audit_comparisons ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_audit_comparisons_site ON audit_comparisons(site_id);

-- =============================================
-- PHASE 3: Update Tier Limits
-- =============================================

-- Add new tier limit columns
ALTER TABLE tier_limits ADD COLUMN IF NOT EXISTS max_sites INTEGER;
ALTER TABLE tier_limits ADD COLUMN IF NOT EXISTS max_competitors_per_site INTEGER;

-- Update tier configurations
-- Free: 1 site, 0 competitors per site
UPDATE tier_limits SET
  max_sites = 1,
  max_competitors_per_site = 0,
  competitor_comparison = FALSE
WHERE tier = 'free';

-- Starter: 3 sites, 2 competitors per site
UPDATE tier_limits SET
  max_sites = 3,
  max_competitors_per_site = 2,
  competitor_comparison = TRUE
WHERE tier = 'starter';

-- Pro: 10 sites, 5 competitors per site
UPDATE tier_limits SET
  max_sites = 10,
  max_competitors_per_site = 5,
  competitor_comparison = TRUE
WHERE tier = 'pro';

-- Agency: 50 sites, 10 competitors per site
UPDATE tier_limits SET
  max_sites = 50,
  max_competitors_per_site = 10,
  competitor_comparison = TRUE
WHERE tier = 'agency';

-- Enterprise: Unlimited
UPDATE tier_limits SET
  max_sites = NULL,
  max_competitors_per_site = NULL,
  competitor_comparison = TRUE
WHERE tier = 'enterprise';

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

-- Migrate competitors to first site of each org (users can reassign later)
-- First, create a temp table with first site per org
WITH first_sites AS (
  SELECT DISTINCT ON (organization_id)
    id as site_id,
    organization_id
  FROM sites
  ORDER BY organization_id, created_at
)
UPDATE competitor_profiles cp
SET site_id = fs.site_id
FROM first_sites fs
WHERE cp.organization_id = fs.organization_id
  AND cp.site_id IS NULL;

-- Migrate comparisons based on my_audit's site
UPDATE audit_comparisons ac
SET site_id = aj.site_id
FROM audit_jobs aj
WHERE ac.my_audit_id = aj.id
  AND ac.site_id IS NULL
  AND aj.site_id IS NOT NULL;

-- =============================================
-- PHASE 5: Update Constraints
-- =============================================

-- Update competitor_profiles unique constraint to be per-site instead of per-org
-- First drop old constraint if it exists
ALTER TABLE competitor_profiles DROP CONSTRAINT IF EXISTS competitor_profiles_organization_id_domain_key;

-- Add new unique constraint per site
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'competitor_profiles_site_id_domain_key'
  ) THEN
    -- Only add if all competitors have site_id (migration complete)
    IF NOT EXISTS (SELECT 1 FROM competitor_profiles WHERE site_id IS NULL) OR
       NOT EXISTS (SELECT 1 FROM competitor_profiles) THEN
      ALTER TABLE competitor_profiles ADD CONSTRAINT competitor_profiles_site_id_domain_key
        UNIQUE(site_id, domain);
    END IF;
  END IF;
END $$;
