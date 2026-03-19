-- ============================================================
-- MIGRATION 091: Schema Cleanup & Memory Optimization
-- ============================================================
-- Removes redundant indexes, dead tables/functions, and
-- consolidates duplicate trigger functions to reduce PostgreSQL
-- memory footprint and improve overall efficiency.
-- ============================================================

-- ============================================================
-- 1. DROP REDUNDANT INDEXES
-- ============================================================
-- These indexes are covered by composite indexes that already exist.

-- idx_audit_findings_category(audit_job_id, category) is fully covered
-- by idx_audit_findings_category_severity(audit_job_id, category, severity)
DROP INDEX IF EXISTS idx_audit_findings_category;

-- idx_audit_findings_severity(audit_job_id, severity) is rarely queried
-- without category — the composite index handles all category+severity queries
DROP INDEX IF EXISTS idx_audit_findings_severity;

-- idx_rate_limits_identifier(identifier, action) exactly duplicates
-- the UNIQUE(identifier, action) constraint which already provides a B-tree index
DROP INDEX IF EXISTS idx_rate_limits_identifier;

-- idx_audit_jobs_user_status(user_id, status) is largely redundant with
-- idx_audit_jobs_user_id(user_id) for most queries since status is low cardinality
-- and the partial indexes (idx_audit_jobs_pending, idx_audit_jobs_processing) handle
-- the common status-filtered cases
DROP INDEX IF EXISTS idx_audit_jobs_user_status;

-- idx_subscriptions_org is redundant — organization_id already has a UNIQUE constraint
DROP INDEX IF EXISTS idx_subscriptions_org;

-- idx_organizations_slug is redundant — slug already has a UNIQUE constraint
DROP INDEX IF EXISTS idx_organizations_slug;

-- idx_org_invites_token is redundant — token already has a UNIQUE constraint
DROP INDEX IF EXISTS idx_org_invites_token;

-- idx_audit_findings_rule_category(rule_id, category) overlaps with
-- idx_audit_findings_rule(audit_job_id, rule_id) for scoped queries
-- and cross-audit rule analysis is rare enough to not warrant a dedicated index
DROP INDEX IF EXISTS idx_audit_findings_rule_category;

-- idx_audit_findings_job_created(audit_job_id, category, created_at) overlaps heavily
-- with idx_audit_findings_category_severity for filtering and adds created_at which
-- is rarely used for ordering findings within a job
DROP INDEX IF EXISTS idx_audit_findings_job_created;

-- idx_audit_jobs_org_completed is for the organization-centric model
-- which has been superseded by the user-centric model (site-based queries)
DROP INDEX IF EXISTS idx_audit_jobs_org_completed;

-- ============================================================
-- 2. DROP DEAD TABLE: site_known_pages
-- ============================================================
-- Replaced by site_urls in migration 025. Zero references in application code.

DROP TABLE IF EXISTS site_known_pages CASCADE;

-- ============================================================
-- 3. DROP DEAD TRIGGER FUNCTIONS
-- ============================================================
-- These org-era auto-creation triggers fire on INSERT to organizations
-- but the app no longer relies on them (subscriptions/members are created
-- explicitly in application code).

DROP TRIGGER IF EXISTS organization_create_subscription ON organizations;
DROP FUNCTION IF EXISTS create_default_subscription();

DROP TRIGGER IF EXISTS organization_add_owner ON organizations;
DROP FUNCTION IF EXISTS add_owner_as_member();

-- ============================================================
-- 4. CONSOLIDATE DUPLICATE updated_at TRIGGER FUNCTIONS
-- ============================================================
-- There are 5+ near-identical functions:
--   update_updated_at_column()  (migration 001)
--   update_audit_jobs_updated_at()  (migration 006)
--   update_updated_at()  (migration 016)
--   update_site_timestamp()  (migration 019)
--   update_site_urls_timestamp()  (migration 029)
--   update_competitor_profile_timestamp()  (migration 018)
--
-- Consolidate to a single shared function used by all tables.

CREATE OR REPLACE FUNCTION shared_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-point existing triggers to the shared function.
-- audit_jobs
DROP TRIGGER IF EXISTS audit_jobs_updated_at ON audit_jobs;
CREATE TRIGGER audit_jobs_updated_at
  BEFORE UPDATE ON audit_jobs
  FOR EACH ROW EXECUTE FUNCTION shared_update_timestamp();

-- organizations
DROP TRIGGER IF EXISTS organizations_updated_at ON organizations;
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION shared_update_timestamp();

-- organization_members
DROP TRIGGER IF EXISTS organization_members_updated_at ON organization_members;
CREATE TRIGGER organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION shared_update_timestamp();

-- subscriptions
DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION shared_update_timestamp();

-- organization_domains
DROP TRIGGER IF EXISTS organization_domains_updated_at ON organization_domains;
CREATE TRIGGER organization_domains_updated_at
  BEFORE UPDATE ON organization_domains
  FOR EACH ROW EXECUTE FUNCTION shared_update_timestamp();

-- usage_records
DROP TRIGGER IF EXISTS usage_records_updated_at ON usage_records;
CREATE TRIGGER usage_records_updated_at
  BEFORE UPDATE ON usage_records
  FOR EACH ROW EXECUTE FUNCTION shared_update_timestamp();

-- sites
DROP TRIGGER IF EXISTS update_sites_updated_at ON sites;
CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION shared_update_timestamp();

-- site_urls
DROP TRIGGER IF EXISTS site_urls_updated ON site_urls;
CREATE TRIGGER site_urls_updated
  BEFORE UPDATE ON site_urls
  FOR EACH ROW EXECUTE FUNCTION shared_update_timestamp();

-- competitor_profiles
DROP TRIGGER IF EXISTS competitor_profile_updated ON competitor_profiles;
CREATE TRIGGER competitor_profile_updated
  BEFORE UPDATE ON competitor_profiles
  FOR EACH ROW EXECUTE FUNCTION shared_update_timestamp();

-- users (if it uses update_updated_at_column)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION shared_update_timestamp();

-- Now drop the old redundant functions (safe — all triggers have been re-pointed)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_audit_jobs_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_site_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_site_urls_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_competitor_profile_timestamp() CASCADE;

-- ============================================================
-- 5. CONSTRAIN OVERLY WIDE TEXT COLUMNS
-- ============================================================
-- These TEXT columns have no practical need to be unbounded.
-- Adding length limits reduces planner overhead and prevents runaway inserts.

-- audit_findings.snippet is documented as "limited to 500 chars" but has no constraint
ALTER TABLE audit_findings
  ALTER COLUMN snippet TYPE VARCHAR(500);

-- audit_findings.selector — CSS selectors should never exceed ~1000 chars
ALTER TABLE audit_findings
  ALTER COLUMN selector TYPE VARCHAR(1000);

-- audit_findings.help_url — URLs have a practical limit
ALTER TABLE audit_findings
  ALTER COLUMN help_url TYPE VARCHAR(2048);

-- audit_jobs.current_url — URL being crawled
ALTER TABLE audit_jobs
  ALTER COLUMN current_url TYPE VARCHAR(2048);

-- audit_jobs.error_message — error messages don't need to be unbounded
ALTER TABLE audit_jobs
  ALTER COLUMN error_message TYPE VARCHAR(2000);

-- audit_jobs.worker_id — worker identifiers are short
ALTER TABLE audit_jobs
  ALTER COLUMN worker_id TYPE VARCHAR(100);

-- ============================================================
-- 6. TUNE PostgreSQL SETTINGS VIA COMMENTS
-- ============================================================
-- Actual tuning is done in docker-compose.yml; this documents intent.

COMMENT ON SCHEMA public IS 'PagePulser schema — optimized in migration 091';
