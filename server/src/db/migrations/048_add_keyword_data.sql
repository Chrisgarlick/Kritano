ALTER TABLE audit_pages ADD COLUMN keyword_data JSONB;
COMMENT ON COLUMN audit_pages.keyword_data IS 'Keyword analysis metrics: keyword, density, placements, etc.';
