-- Migration: 024_site_known_pages
-- Store known pages for sites (discovered from sitemaps or previous audits)
-- Also link orphaned audits to their matching sites by domain

-- =============================================
-- Create site_known_pages table
-- =============================================

CREATE TABLE IF NOT EXISTS site_known_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  url_path TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('sitemap', 'audit', 'manual')),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_audited_at TIMESTAMPTZ,
  last_audit_id UUID REFERENCES audit_jobs(id) ON DELETE SET NULL,
  priority DECIMAL(3,2),
  changefreq VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, url)
);

-- Index for efficient lookups by site
CREATE INDEX IF NOT EXISTS idx_site_known_pages_site ON site_known_pages(site_id);

-- Index for searching by path
CREATE INDEX IF NOT EXISTS idx_site_known_pages_path ON site_known_pages(site_id, url_path);

-- Index for finding pages that need auditing
CREATE INDEX IF NOT EXISTS idx_site_known_pages_last_audited ON site_known_pages(site_id, last_audited_at);

-- =============================================
-- Link orphaned audits to sites by domain match
-- =============================================

-- Find audits that have NULL site_id but could be linked to a site
-- based on matching organization_id and target_domain
UPDATE audit_jobs aj
SET site_id = s.id
FROM sites s
WHERE aj.organization_id = s.organization_id
  AND aj.site_id IS NULL
  AND aj.target_domain = s.domain;

-- Log how many were updated (for debugging - will show in migration output)
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Linked % orphaned audits to their matching sites', updated_count;
END $$;
