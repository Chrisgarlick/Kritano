-- Migration: 100_add_content_score
-- Description: Add content analysis score columns to audit tables

-- Add check_content flag to audit_jobs
ALTER TABLE audit_jobs
ADD COLUMN IF NOT EXISTS check_content BOOLEAN DEFAULT TRUE;

-- Add content_score to audit_jobs (aggregate score)
ALTER TABLE audit_jobs
ADD COLUMN IF NOT EXISTS content_score INT
    CHECK (content_score IS NULL OR (content_score >= 0 AND content_score <= 100));

-- Add content score and issues to audit_pages
ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS content_score INT
    CHECK (content_score IS NULL OR (content_score >= 0 AND content_score <= 100));

ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS content_issues INT DEFAULT 0;

-- Add content subscores for detailed analysis on pages
ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS content_quality_score INT
    CHECK (content_quality_score IS NULL OR (content_quality_score >= 0 AND content_quality_score <= 100));

ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS content_readability_score INT
    CHECK (content_readability_score IS NULL OR (content_readability_score >= 0 AND content_readability_score <= 100));

ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS content_structure_score INT
    CHECK (content_structure_score IS NULL OR (content_structure_score >= 0 AND content_structure_score <= 100));

ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS content_engagement_score INT
    CHECK (content_engagement_score IS NULL OR (content_engagement_score >= 0 AND content_engagement_score <= 100));

-- Add content metrics to audit_pages
ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS flesch_kincaid_grade DECIMAL(4,1);

ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS flesch_reading_ease DECIMAL(4,1);

ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS reading_time_minutes INT;

ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS content_type TEXT
    CHECK (content_type IS NULL OR content_type IN ('article', 'product', 'landing', 'documentation', 'blog', 'other'));

-- Comments for documentation
COMMENT ON COLUMN audit_jobs.check_content IS 'Whether to run content quality analysis';
COMMENT ON COLUMN audit_jobs.content_score IS 'Aggregate content quality score (0-100)';
COMMENT ON COLUMN audit_pages.content_score IS 'Content quality score for this page (0-100)';
COMMENT ON COLUMN audit_pages.content_issues IS 'Number of content-related issues found';
COMMENT ON COLUMN audit_pages.content_quality_score IS 'Content depth, freshness, multimedia subscore';
COMMENT ON COLUMN audit_pages.content_readability_score IS 'Readability algorithms subscore';
COMMENT ON COLUMN audit_pages.content_structure_score IS 'Heading hierarchy, paragraph structure subscore';
COMMENT ON COLUMN audit_pages.content_engagement_score IS 'Hooks, CTAs, power words subscore';
COMMENT ON COLUMN audit_pages.flesch_kincaid_grade IS 'Flesch-Kincaid grade level';
COMMENT ON COLUMN audit_pages.flesch_reading_ease IS 'Flesch Reading Ease score (0-100)';
COMMENT ON COLUMN audit_pages.reading_time_minutes IS 'Estimated reading time in minutes';
COMMENT ON COLUMN audit_pages.content_type IS 'Detected content type (article, product, blog, etc.)';
