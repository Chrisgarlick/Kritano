-- Add content front-loading columns to audit_pages for AEO analysis
ALTER TABLE audit_pages ADD COLUMN IF NOT EXISTS aeo_content_frontloaded BOOLEAN;
ALTER TABLE audit_pages ADD COLUMN IF NOT EXISTS aeo_content_frontloading_ratio NUMERIC(4,2);
