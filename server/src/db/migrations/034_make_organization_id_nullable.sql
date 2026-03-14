-- Migration 034: Make sites.organization_id nullable
-- The user-centric model (migration 025) uses owner_id instead of organization_id.
-- Sites are now owned by users directly, so organization_id is optional.

ALTER TABLE sites ALTER COLUMN organization_id DROP NOT NULL;

-- Add unique constraint for user-centric model (owner_id + domain)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_owner_domain ON sites(owner_id, domain) WHERE owner_id IS NOT NULL;
