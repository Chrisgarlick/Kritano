-- Add per-post schema type selection for structured data enhancements
ALTER TABLE blog_posts
  ADD COLUMN schema_type VARCHAR(20) NOT NULL DEFAULT 'article',
  ADD COLUMN schema_claim_reviewed VARCHAR(500),
  ADD COLUMN schema_review_rating VARCHAR(20);

ALTER TABLE blog_posts
  ADD CONSTRAINT chk_blog_schema_type
  CHECK (schema_type IN ('article', 'howto', 'faq', 'claim_review'));

ALTER TABLE blog_posts
  ADD CONSTRAINT chk_blog_review_rating
  CHECK (schema_review_rating IS NULL OR schema_review_rating IN ('True', 'MostlyTrue', 'Mixed', 'MostlyFalse', 'False'));
