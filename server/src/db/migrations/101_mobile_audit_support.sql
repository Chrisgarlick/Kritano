-- Mobile audit support
-- Adds device type tracking to findings, mobile scores to pages/jobs,
-- and include_mobile flag to jobs

-- Add mobile flag to audit jobs
ALTER TABLE audit_jobs ADD COLUMN include_mobile BOOLEAN NOT NULL DEFAULT false;

-- Add mobile aggregate scores to audit jobs
ALTER TABLE audit_jobs ADD COLUMN mobile_accessibility_score SMALLINT;
ALTER TABLE audit_jobs ADD COLUMN mobile_performance_score SMALLINT;

-- Add device type to findings
ALTER TABLE audit_findings ADD COLUMN device_type VARCHAR(10) NOT NULL DEFAULT 'desktop'
  CHECK (device_type IN ('desktop', 'mobile', 'both'));

-- Add mobile scores to audit pages
ALTER TABLE audit_pages ADD COLUMN mobile_accessibility_score SMALLINT;
ALTER TABLE audit_pages ADD COLUMN mobile_performance_score SMALLINT;
ALTER TABLE audit_pages ADD COLUMN mobile_accessibility_issues INTEGER DEFAULT 0;
ALTER TABLE audit_pages ADD COLUMN mobile_performance_issues INTEGER DEFAULT 0;

-- Index for device-type filtering on findings
CREATE INDEX idx_audit_findings_device_type ON audit_findings(device_type)
  WHERE device_type != 'desktop';

-- Composite index for common query: findings by job + device
CREATE INDEX idx_audit_findings_job_device ON audit_findings(audit_job_id, device_type);
