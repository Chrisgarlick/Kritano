-- Migration: 112_create_audit_assets
-- Description: Create tables for file/asset extraction feature.
-- audit_assets stores deduplicated assets per audit, audit_asset_pages is the junction table.

-- Add check_file_extraction to audit_jobs
ALTER TABLE audit_jobs ADD COLUMN IF NOT EXISTS check_file_extraction BOOLEAN DEFAULT FALSE;

-- Main assets table (one row per unique asset URL per audit)
CREATE TABLE IF NOT EXISTS audit_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_job_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  url_hash TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'document', 'video', 'audio', 'font', 'stylesheet', 'script', 'other')),
  mime_type TEXT,
  file_extension TEXT,
  file_name TEXT,
  file_size_bytes BIGINT,
  source TEXT NOT NULL DEFAULT 'html' CHECK (source IN ('network', 'html', 'both')),
  http_status INTEGER,
  page_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one row per asset URL per audit
ALTER TABLE audit_assets ADD CONSTRAINT audit_assets_job_url_unique UNIQUE (audit_job_id, url_hash);

-- Junction table linking assets to pages
CREATE TABLE IF NOT EXISTS audit_asset_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_asset_id UUID NOT NULL REFERENCES audit_assets(id) ON DELETE CASCADE,
  audit_page_id UUID NOT NULL REFERENCES audit_pages(id) ON DELETE CASCADE,
  html_element TEXT,
  html_attribute TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one link per asset-page pair
ALTER TABLE audit_asset_pages ADD CONSTRAINT audit_asset_pages_unique UNIQUE (audit_asset_id, audit_page_id);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_audit_assets_job_id ON audit_assets(audit_job_id);
CREATE INDEX IF NOT EXISTS idx_audit_assets_job_type ON audit_assets(audit_job_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_audit_asset_pages_asset_id ON audit_asset_pages(audit_asset_id);
CREATE INDEX IF NOT EXISTS idx_audit_asset_pages_page_id ON audit_asset_pages(audit_page_id);
