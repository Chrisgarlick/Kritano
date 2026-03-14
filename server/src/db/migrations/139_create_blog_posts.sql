-- Migration: 058_create_blog_posts.sql
-- Blog posts table with block-based content model

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(200) UNIQUE NOT NULL,
  title VARCHAR(300) NOT NULL,
  subtitle VARCHAR(500),
  excerpt VARCHAR(500) NOT NULL,
  featured_image_url VARCHAR(1000),
  featured_image_alt VARCHAR(300),
  content JSONB NOT NULL DEFAULT '[]',
  category VARCHAR(30) NOT NULL
    CHECK (category IN (
      'seo', 'accessibility', 'security', 'performance',
      'content-quality', 'structured-data', 'eeat', 'aeo',
      'guides', 'case-studies', 'product-updates'
    )),
  tags TEXT[] DEFAULT '{}',
  author_id UUID NOT NULL REFERENCES users(id),
  author_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  seo_title VARCHAR(200),
  seo_description VARCHAR(400),
  reading_time_minutes INTEGER NOT NULL DEFAULT 1,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blog_posts_slug ON blog_posts (slug);
CREATE INDEX idx_blog_posts_status ON blog_posts (status, published_at DESC);
CREATE INDEX idx_blog_posts_category ON blog_posts (category) WHERE status = 'published';
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN (tags);
