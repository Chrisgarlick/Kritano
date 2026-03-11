-- Add status column to audit_findings for dismiss/acknowledge functionality
ALTER TABLE audit_findings ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' NOT NULL;

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_audit_findings_status ON audit_findings(status);
