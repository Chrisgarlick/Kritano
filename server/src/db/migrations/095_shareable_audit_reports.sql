-- Shareable Audit Reports: add share token and expiry to audit_jobs
ALTER TABLE audit_jobs
  ADD COLUMN share_token VARCHAR(64) UNIQUE,
  ADD COLUMN share_expires_at TIMESTAMPTZ;

CREATE INDEX idx_audit_jobs_share_token ON audit_jobs(share_token) WHERE share_token IS NOT NULL;
