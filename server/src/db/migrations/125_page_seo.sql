-- SEO metadata overrides for app routes (admin-managed)
CREATE TABLE IF NOT EXISTS page_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_path VARCHAR(500) NOT NULL UNIQUE,
  title VARCHAR(200),
  description VARCHAR(500),
  keywords VARCHAR(500),
  og_title VARCHAR(200),
  og_description VARCHAR(500),
  og_image VARCHAR(1000),
  og_type VARCHAR(50) DEFAULT 'website',
  twitter_card VARCHAR(50) DEFAULT 'summary_large_image',
  canonical_url VARCHAR(1000),
  featured_image VARCHAR(1000),
  structured_data JSONB,
  noindex BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_page_seo_route_path ON page_seo(route_path);
