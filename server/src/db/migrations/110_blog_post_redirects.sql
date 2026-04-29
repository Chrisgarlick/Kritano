-- Blog post slug redirects
-- Tracks old slugs so changed URLs 301-redirect to the current slug.

CREATE TABLE blog_post_redirects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  old_slug    VARCHAR(200) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_blog_post_redirects_old_slug ON blog_post_redirects (old_slug);
CREATE INDEX idx_blog_post_redirects_post_id ON blog_post_redirects (post_id);
