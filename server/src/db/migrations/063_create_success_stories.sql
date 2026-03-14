-- Migration 063: Create success_stories table
-- Public-facing showcase of impressive audit score improvements.

CREATE TABLE IF NOT EXISTS success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id),
  domain VARCHAR(255) NOT NULL,
  category VARCHAR(30) NOT NULL,
  score_before INTEGER NOT NULL,
  score_after INTEGER NOT NULL,
  headline VARCHAR(200) NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_success_stories_published ON success_stories (is_published, display_order) WHERE is_published = true;
