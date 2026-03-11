-- Migration: Add enhanced crawl error tracking
-- This tracks detailed error information for failed page crawls

-- Add error tracking columns to audit_pages
ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS error_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS error_category VARCHAR(30),
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS error_suggestion TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP WITH TIME ZONE;

-- Create index for error analysis queries
CREATE INDEX IF NOT EXISTS idx_audit_pages_error_type ON audit_pages(error_type) WHERE error_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_pages_error_category ON audit_pages(error_category) WHERE error_category IS NOT NULL;

-- Add error summary columns to audit_jobs
ALTER TABLE audit_jobs
ADD COLUMN IF NOT EXISTS pages_blocked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pages_timeout INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pages_server_error INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_summary JSONB;

-- Comment on columns
COMMENT ON COLUMN audit_pages.error_type IS 'Specific error type from CrawlErrorType enum';
COMMENT ON COLUMN audit_pages.error_category IS 'Error category: security, network, server, content, or unknown';
COMMENT ON COLUMN audit_pages.error_message IS 'User-friendly error message';
COMMENT ON COLUMN audit_pages.error_suggestion IS 'Suggested action to resolve the error';
COMMENT ON COLUMN audit_pages.retry_count IS 'Number of retry attempts made';
COMMENT ON COLUMN audit_pages.last_retry_at IS 'Timestamp of last retry attempt';
COMMENT ON COLUMN audit_jobs.pages_blocked IS 'Count of pages blocked by bot detection';
COMMENT ON COLUMN audit_jobs.pages_timeout IS 'Count of pages that timed out';
COMMENT ON COLUMN audit_jobs.pages_server_error IS 'Count of server errors (5xx)';
COMMENT ON COLUMN audit_jobs.error_summary IS 'JSON summary of errors by type and category';
