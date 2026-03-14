-- Migration: 059_create_blog_media.sql
-- Media library for blog images

CREATE TABLE IF NOT EXISTS blog_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(300) NOT NULL,
  storage_key VARCHAR(500) UNIQUE NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text VARCHAR(300),
  thumbnail_key VARCHAR(500),
  webp_key VARCHAR(500),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blog_media_type ON blog_media (mime_type);
CREATE INDEX idx_blog_media_created ON blog_media (created_at DESC);
