-- Migration: 009_create_crawl_queue
-- Description: URLs discovered but not yet crawled (ephemeral, cleared after audit)

CREATE TABLE crawl_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_job_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,

    url TEXT NOT NULL,
    url_hash TEXT NOT NULL,
    depth INT NOT NULL CHECK (depth >= 0),
    discovered_from TEXT,

    -- Priority: higher = crawl first (homepage = 100, depth 1 = 90, etc.)
    priority INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint to prevent duplicate URLs in same audit
    UNIQUE(audit_job_id, url_hash)
);

-- Index for efficient queue operations (get next URL to crawl)
CREATE INDEX idx_crawl_queue_job_priority ON crawl_queue(audit_job_id, priority DESC, created_at);

-- Index for cleanup operations
CREATE INDEX idx_crawl_queue_job_id ON crawl_queue(audit_job_id);
