-- Migration: 007_create_audit_pages
-- Description: Individual pages discovered and crawled during an audit

CREATE TABLE audit_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_job_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,

    -- Page identification
    url TEXT NOT NULL,
    url_hash TEXT NOT NULL,  -- SHA-256 hash for deduplication

    -- Crawl metadata
    depth INT NOT NULL CHECK (depth >= 0),
    discovered_from TEXT,  -- Parent URL that linked to this page

    -- HTTP response info
    status_code INT,
    content_type TEXT,
    response_time_ms INT,
    page_size_bytes INT,

    -- Page content (for analysis)
    title TEXT,
    meta_description TEXT,
    canonical_url TEXT,
    h1_text TEXT,
    word_count INT,

    -- Crawl status
    crawl_status TEXT DEFAULT 'pending'
        CHECK (crawl_status IN ('pending', 'crawling', 'crawled', 'failed', 'skipped')),
    crawled_at TIMESTAMPTZ,
    error_message TEXT,

    -- Scores for this specific page
    seo_score INT CHECK (seo_score IS NULL OR (seo_score >= 0 AND seo_score <= 100)),
    accessibility_score INT CHECK (accessibility_score IS NULL OR (accessibility_score >= 0 AND accessibility_score <= 100)),
    security_score INT CHECK (security_score IS NULL OR (security_score >= 0 AND security_score <= 100)),
    performance_score INT CHECK (performance_score IS NULL OR (performance_score >= 0 AND performance_score <= 100)),

    -- Issue counts per category for this page
    seo_issues INT DEFAULT 0,
    accessibility_issues INT DEFAULT 0,
    security_issues INT DEFAULT 0,
    performance_issues INT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint on job + url hash
    UNIQUE(audit_job_id, url_hash)
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_pages_job_id ON audit_pages(audit_job_id);
CREATE INDEX idx_audit_pages_status ON audit_pages(audit_job_id, crawl_status);
CREATE INDEX idx_audit_pages_url_hash ON audit_pages(url_hash);
CREATE INDEX idx_audit_pages_depth ON audit_pages(audit_job_id, depth);
CREATE INDEX idx_audit_pages_pending ON audit_pages(audit_job_id, created_at)
    WHERE crawl_status = 'pending';
