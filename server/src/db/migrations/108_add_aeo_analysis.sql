-- Migration: 108_add_aeo_analysis
-- Description: Add AEO (Answer Engine Optimization) AI citability columns to audit_pages

ALTER TABLE audit_pages
  ADD COLUMN IF NOT EXISTS aeo_score INT,
  ADD COLUMN IF NOT EXISTS aeo_nugget_score INT,
  ADD COLUMN IF NOT EXISTS aeo_factual_density_score INT,
  ADD COLUMN IF NOT EXISTS aeo_source_authority_score INT,
  ADD COLUMN IF NOT EXISTS aeo_tier TEXT,
  ADD COLUMN IF NOT EXISTS aeo_nuggets JSONB;
