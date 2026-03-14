-- Migration: 060_create_blog_post_revisions.sql
-- Post revision history for audit trail

CREATE TABLE IF NOT EXISTS blog_post_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  title VARCHAR(300) NOT NULL,
  revision_note VARCHAR(200),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blog_revisions_post ON blog_post_revisions (post_id, created_at DESC);
