-- Migration: Add two-phase audit pipeline statuses (discovering, ready)
-- New flow: pending → discovering → ready → processing → completed/failed

-- 1. Drop existing CHECK constraint and re-add with new statuses
ALTER TABLE audit_jobs DROP CONSTRAINT IF EXISTS audit_jobs_status_check;
ALTER TABLE audit_jobs ADD CONSTRAINT audit_jobs_status_check
  CHECK (status IN ('pending', 'discovering', 'ready', 'processing', 'completed', 'failed', 'cancelled'));

-- 2. Index for audit worker claiming ready jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_jobs_ready
  ON audit_jobs (created_at ASC) WHERE status = 'ready';

-- 3. Index for stale discovery job recovery
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_jobs_discovering
  ON audit_jobs (locked_at) WHERE status = 'discovering';
