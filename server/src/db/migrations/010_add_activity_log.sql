-- Migration: 010_add_activity_log
-- Description: Add activity log column to audit_jobs for real-time progress display

-- Add activity_log column to store recent activity entries as JSONB array
-- Each entry: { timestamp: ISO string, message: string, type: 'info' | 'success' | 'error' }
ALTER TABLE audit_jobs ADD COLUMN IF NOT EXISTS activity_log JSONB DEFAULT '[]'::jsonb;
