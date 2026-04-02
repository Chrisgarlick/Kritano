-- Rebrand: Replace all "PagePulser" references with "Kritano" in database content
-- This updates email templates, blog posts, SEO metadata, marketing content, and cold prospect templates

-- =============================================
-- EMAIL TEMPLATES
-- =============================================

-- Replace brand name in subjects
UPDATE email_templates SET subject = REPLACE(subject, 'PagePulser', 'Kritano')
WHERE subject LIKE '%PagePulser%';

-- Replace brand name in compiled HTML
UPDATE email_templates SET compiled_html = REPLACE(compiled_html, 'PagePulser', 'Kritano')
WHERE compiled_html LIKE '%PagePulser%';

-- Replace domain in compiled HTML
UPDATE email_templates SET compiled_html = REPLACE(compiled_html, 'pagepulser.com', 'kritano.com')
WHERE compiled_html LIKE '%pagepulser.com%';

-- Replace brand name in blocks JSON
UPDATE email_templates SET blocks = REPLACE(blocks::text, 'PagePulser', 'Kritano')::jsonb
WHERE blocks::text LIKE '%PagePulser%';

-- Replace domain in blocks JSON
UPDATE email_templates SET blocks = REPLACE(blocks::text, 'pagepulser.com', 'kritano.com')::jsonb
WHERE blocks::text LIKE '%pagepulser.com%';

-- =============================================
-- BLOG POSTS
-- =============================================

UPDATE blog_posts SET title = REPLACE(title, 'PagePulser', 'Kritano')
WHERE title LIKE '%PagePulser%';

UPDATE blog_posts SET content = REPLACE(content::text, 'PagePulser', 'Kritano')::jsonb
WHERE content::text LIKE '%PagePulser%';

UPDATE blog_posts SET content = REPLACE(content::text, 'pagepulser.com', 'kritano.com')::jsonb
WHERE content::text LIKE '%pagepulser.com%';

UPDATE blog_posts SET slug = REPLACE(slug, 'pagepulser', 'kritano')
WHERE slug LIKE '%pagepulser%';

UPDATE blog_posts SET excerpt = REPLACE(excerpt, 'PagePulser', 'Kritano')
WHERE excerpt LIKE '%PagePulser%';

UPDATE blog_posts SET seo_title = REPLACE(seo_title, 'PagePulser', 'Kritano')
WHERE seo_title LIKE '%PagePulser%';

UPDATE blog_posts SET seo_description = REPLACE(seo_description, 'PagePulser', 'Kritano')
WHERE seo_description LIKE '%PagePulser%';

-- =============================================
-- SEO METADATA (if table exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_seo_settings') THEN
    EXECUTE 'UPDATE site_seo_settings SET meta_title = REPLACE(meta_title, ''PagePulser'', ''Kritano'') WHERE meta_title LIKE ''%PagePulser%''';
    EXECUTE 'UPDATE site_seo_settings SET meta_description = REPLACE(meta_description, ''PagePulser'', ''Kritano'') WHERE meta_description LIKE ''%PagePulser%''';
    EXECUTE 'UPDATE site_seo_settings SET og_title = REPLACE(og_title, ''PagePulser'', ''Kritano'') WHERE og_title LIKE ''%PagePulser%''';
    EXECUTE 'UPDATE site_seo_settings SET og_description = REPLACE(og_description, ''PagePulser'', ''Kritano'') WHERE og_description LIKE ''%PagePulser%''';
    EXECUTE 'UPDATE site_seo_settings SET twitter_title = REPLACE(twitter_title, ''PagePulser'', ''Kritano'') WHERE twitter_title IS NOT NULL AND twitter_title LIKE ''%PagePulser%''';
    EXECUTE 'UPDATE site_seo_settings SET twitter_description = REPLACE(twitter_description, ''PagePulser'', ''Kritano'') WHERE twitter_description IS NOT NULL AND twitter_description LIKE ''%PagePulser%''';
    EXECUTE 'UPDATE site_seo_settings SET schema_json = REPLACE(schema_json::text, ''PagePulser'', ''Kritano'')::jsonb WHERE schema_json::text LIKE ''%PagePulser%''';
    EXECUTE 'UPDATE site_seo_settings SET schema_json = REPLACE(schema_json::text, ''pagepulser.com'', ''kritano.com'')::jsonb WHERE schema_json::text LIKE ''%pagepulser.com%''';
  END IF;
END $$;

-- =============================================
-- MARKETING CONTENT
-- =============================================

UPDATE marketing_content SET
  title = REPLACE(title, 'PagePulser', 'Kritano')
WHERE title LIKE '%PagePulser%';

UPDATE marketing_content SET
  body = REPLACE(body, 'PagePulser', 'Kritano')
WHERE body LIKE '%PagePulser%';

UPDATE marketing_content SET
  body = REPLACE(body, 'pagepulser.com', 'kritano.com')
WHERE body LIKE '%pagepulser.com%';

-- =============================================
-- COLD PROSPECT TEMPLATES (if table exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cold_prospect_templates') THEN
    EXECUTE 'UPDATE cold_prospect_templates SET subject = REPLACE(subject, ''PagePulser'', ''Kritano'') WHERE subject LIKE ''%PagePulser%''';
    EXECUTE 'UPDATE cold_prospect_templates SET body = REPLACE(body, ''PagePulser'', ''Kritano'') WHERE body LIKE ''%PagePulser%''';
    EXECUTE 'UPDATE cold_prospect_templates SET body = REPLACE(body, ''pagepulser.com'', ''kritano.com'') WHERE body LIKE ''%pagepulser.com%''';
  END IF;
END $$;

-- =============================================
-- CRM TEMPLATES (if table exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_email_templates') THEN
    EXECUTE 'UPDATE crm_email_templates SET subject = REPLACE(subject, ''PagePulser'', ''Kritano'') WHERE subject LIKE ''%PagePulser%''';
    EXECUTE 'UPDATE crm_email_templates SET body_html = REPLACE(body_html, ''PagePulser'', ''Kritano'') WHERE body_html LIKE ''%PagePulser%''';
    EXECUTE 'UPDATE crm_email_templates SET body_html = REPLACE(body_html, ''pagepulser.com'', ''kritano.com'') WHERE body_html LIKE ''%pagepulser.com%''';
  END IF;
END $$;

-- =============================================
-- ANNOUNCEMENTS (if table exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements') THEN
    EXECUTE 'UPDATE announcements SET title = REPLACE(title, ''PagePulser'', ''Kritano'') WHERE title LIKE ''%PagePulser%''';
    EXECUTE 'UPDATE announcements SET body = REPLACE(body, ''PagePulser'', ''Kritano'') WHERE body LIKE ''%PagePulser%''';
    EXECUTE 'UPDATE announcements SET body = REPLACE(body, ''pagepulser.com'', ''kritano.com'') WHERE body LIKE ''%pagepulser.com%''';
  END IF;
END $$;

-- =============================================
-- FEATURE PAGES / ADVICE (if tables exist)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_pages') THEN
    EXECUTE 'UPDATE feature_pages SET title = REPLACE(title, ''PagePulser'', ''Kritano'') WHERE title LIKE ''%PagePulser%''';
    EXECUTE 'UPDATE feature_pages SET content = REPLACE(content, ''PagePulser'', ''Kritano'') WHERE content LIKE ''%PagePulser%''';
  END IF;
END $$;
