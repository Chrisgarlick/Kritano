-- Migration 092: Add functional index on auth_audit_logs JSONB details->>'auditId'
-- This eliminates full table scans when querying audit events by audit job ID.
-- Note: CONCURRENTLY cannot run inside a transaction block.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_audit_logs_audit_id
  ON auth_audit_logs ((details->>'auditId'))
  WHERE details->>'auditId' IS NOT NULL;
