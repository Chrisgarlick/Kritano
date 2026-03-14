-- Migration: Create competitor comparison tables
-- Allows paid users to scan and compare against competitor websites

-- Add competitor-related columns to tier_limits
ALTER TABLE tier_limits ADD COLUMN IF NOT EXISTS competitor_comparison BOOLEAN DEFAULT FALSE;
ALTER TABLE tier_limits ADD COLUMN IF NOT EXISTS max_competitor_domains INTEGER DEFAULT 0;

-- Update tier configurations
-- All paid tiers get competitor comparison
-- Competitor domains = 2x normal domain limit (separate quota)
UPDATE tier_limits SET competitor_comparison = FALSE, max_competitor_domains = 0 WHERE tier = 'free';
UPDATE tier_limits SET competitor_comparison = TRUE, max_competitor_domains = 6 WHERE tier = 'starter';
UPDATE tier_limits SET competitor_comparison = TRUE, max_competitor_domains = 20 WHERE tier = 'pro';
UPDATE tier_limits SET competitor_comparison = TRUE, max_competitor_domains = 100 WHERE tier = 'agency';
UPDATE tier_limits SET competitor_comparison = TRUE, max_competitor_domains = NULL WHERE tier = 'enterprise';

-- Add is_competitor flag to audit_jobs
ALTER TABLE audit_jobs ADD COLUMN IF NOT EXISTS is_competitor BOOLEAN DEFAULT FALSE;

-- Competitor profiles table
CREATE TABLE IF NOT EXISTS competitor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, domain)
);

-- Add competitor_profile_id to audit_jobs (after competitor_profiles exists)
ALTER TABLE audit_jobs ADD COLUMN IF NOT EXISTS competitor_profile_id UUID REFERENCES competitor_profiles(id) ON DELETE SET NULL;

-- Comparison records table (links two audits for comparison)
CREATE TABLE IF NOT EXISTS audit_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255),
  my_audit_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
  competitor_audit_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT different_audits CHECK (my_audit_id != competitor_audit_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competitor_profiles_org ON competitor_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_competitor_profiles_domain ON competitor_profiles(organization_id, domain);
CREATE INDEX IF NOT EXISTS idx_audit_comparisons_org ON audit_comparisons(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_comparisons_audits ON audit_comparisons(my_audit_id, competitor_audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_jobs_competitor ON audit_jobs(organization_id, is_competitor) WHERE is_competitor = TRUE;

-- Update trigger for competitor_profiles
CREATE OR REPLACE FUNCTION update_competitor_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS competitor_profile_updated ON competitor_profiles;
CREATE TRIGGER competitor_profile_updated
  BEFORE UPDATE ON competitor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_competitor_profile_timestamp();
