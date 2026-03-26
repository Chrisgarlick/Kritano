-- Add CQS (Content Quality Score) columns
-- CQS is a derived weighted average of content sub-scores

ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS cqs_score INT
    CHECK (cqs_score IS NULL OR (cqs_score >= 0 AND cqs_score <= 100));

ALTER TABLE audit_jobs
ADD COLUMN IF NOT EXISTS cqs_score INT
    CHECK (cqs_score IS NULL OR (cqs_score >= 0 AND cqs_score <= 100));

COMMENT ON COLUMN audit_pages.cqs_score IS 'Content Quality Score: weighted average of quality, readability, structure, engagement, and E-E-A-T sub-scores';
COMMENT ON COLUMN audit_jobs.cqs_score IS 'Audit-level Content Quality Score: depth-weighted average of page CQS scores';
