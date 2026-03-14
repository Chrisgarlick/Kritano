-- Migration: 031_add_structured_data_score
-- Description: Add structured data analysis columns to audit tables

-- Add check_structured_data flag to audit_jobs
ALTER TABLE audit_jobs
ADD COLUMN IF NOT EXISTS check_structured_data BOOLEAN DEFAULT TRUE;

-- Add structured_data_score to audit_jobs (aggregate score)
ALTER TABLE audit_jobs
ADD COLUMN IF NOT EXISTS structured_data_score INT
    CHECK (structured_data_score IS NULL OR (structured_data_score >= 0 AND structured_data_score <= 100));

-- Add structured data score and issues to audit_pages
ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS structured_data_score INT
    CHECK (structured_data_score IS NULL OR (structured_data_score >= 0 AND structured_data_score <= 100));

ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS structured_data_issues INT DEFAULT 0;

-- Add structured data analysis columns to audit_pages
ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS json_ld_count INT DEFAULT 0;

ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS has_open_graph BOOLEAN DEFAULT FALSE;

ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS has_twitter_card BOOLEAN DEFAULT FALSE;

ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS detected_schema_types TEXT[];

ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS detected_page_type TEXT;

-- Comments for documentation
COMMENT ON COLUMN audit_jobs.check_structured_data IS 'Whether to run structured data analysis';
COMMENT ON COLUMN audit_jobs.structured_data_score IS 'Aggregate structured data score (0-100)';
COMMENT ON COLUMN audit_pages.structured_data_score IS 'Structured data score for this page (0-100)';
COMMENT ON COLUMN audit_pages.structured_data_issues IS 'Number of structured data issues found';
COMMENT ON COLUMN audit_pages.json_ld_count IS 'Number of JSON-LD blocks found';
COMMENT ON COLUMN audit_pages.has_open_graph IS 'Whether Open Graph meta tags are present';
COMMENT ON COLUMN audit_pages.has_twitter_card IS 'Whether Twitter Card meta tags are present';
COMMENT ON COLUMN audit_pages.detected_schema_types IS 'Schema.org types detected on the page';
COMMENT ON COLUMN audit_pages.detected_page_type IS 'Detected page type (homepage, article, product, etc.)';
