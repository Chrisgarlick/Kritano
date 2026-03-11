-- Migration: 006_create_audit_jobs
-- Description: Main audit job record for tracking website audits

CREATE TABLE audit_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Target configuration
    target_url TEXT NOT NULL,
    target_domain TEXT NOT NULL,

    -- Crawl settings
    max_pages INT DEFAULT 100 CHECK (max_pages > 0 AND max_pages <= 1000),
    max_depth INT DEFAULT 5 CHECK (max_depth > 0 AND max_depth <= 10),
    respect_robots_txt BOOLEAN DEFAULT TRUE,
    include_subdomains BOOLEAN DEFAULT FALSE,

    -- Audit settings (what to check)
    check_seo BOOLEAN DEFAULT TRUE,
    check_accessibility BOOLEAN DEFAULT TRUE,
    check_security BOOLEAN DEFAULT TRUE,
    check_performance BOOLEAN DEFAULT TRUE,

    -- Job status
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

    -- Progress tracking
    pages_found INT DEFAULT 0,
    pages_crawled INT DEFAULT 0,
    pages_audited INT DEFAULT 0,
    current_url TEXT,

    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Results summary (denormalized for quick access)
    total_issues INT DEFAULT 0,
    critical_issues INT DEFAULT 0,
    seo_score INT CHECK (seo_score IS NULL OR (seo_score >= 0 AND seo_score <= 100)),
    accessibility_score INT CHECK (accessibility_score IS NULL OR (accessibility_score >= 0 AND accessibility_score <= 100)),
    security_score INT CHECK (security_score IS NULL OR (security_score >= 0 AND security_score <= 100)),
    performance_score INT CHECK (performance_score IS NULL OR (performance_score >= 0 AND performance_score <= 100)),

    -- Error handling
    error_message TEXT,
    retry_count INT DEFAULT 0 CHECK (retry_count >= 0),

    -- Worker assignment (for SKIP LOCKED pattern)
    worker_id TEXT,
    locked_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient job queue operations
CREATE INDEX idx_audit_jobs_user_id ON audit_jobs(user_id);
CREATE INDEX idx_audit_jobs_status ON audit_jobs(status);
CREATE INDEX idx_audit_jobs_pending ON audit_jobs(created_at) WHERE status = 'pending';
CREATE INDEX idx_audit_jobs_processing ON audit_jobs(locked_at) WHERE status = 'processing';
CREATE INDEX idx_audit_jobs_user_status ON audit_jobs(user_id, status);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_audit_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_jobs_updated_at
    BEFORE UPDATE ON audit_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_jobs_updated_at();
