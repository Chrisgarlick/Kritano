-- Migration: 099_analytics_indexes
-- Description: Add performance indexes for analytics queries

-- Optimized index for score history queries by site
CREATE INDEX IF NOT EXISTS idx_audit_jobs_site_completed
ON audit_jobs(site_id, completed_at DESC)
WHERE status = 'completed';

-- Optimized index for organization-wide analytics
CREATE INDEX IF NOT EXISTS idx_audit_jobs_org_completed
ON audit_jobs(organization_id, completed_at DESC)
WHERE status = 'completed';

-- Index for finding trend analysis (issues over time)
CREATE INDEX IF NOT EXISTS idx_audit_findings_job_created
ON audit_findings(audit_job_id, category, created_at);

-- Index for aggregating issues by rule across audits
CREATE INDEX IF NOT EXISTS idx_audit_findings_rule_category
ON audit_findings(rule_id, category);
