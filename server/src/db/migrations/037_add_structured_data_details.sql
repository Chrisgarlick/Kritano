-- Migration: 037_add_structured_data_details
-- Stores actual parsed structured data content (OG, Twitter Card, JSON-LD items)
-- so the Rich Snippet Preview can display real metadata

ALTER TABLE audit_pages
ADD COLUMN IF NOT EXISTS open_graph_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS twitter_card_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS json_ld_items JSONB DEFAULT NULL;

COMMENT ON COLUMN audit_pages.open_graph_data IS 'Parsed Open Graph metadata (title, description, image, etc.)';
COMMENT ON COLUMN audit_pages.twitter_card_data IS 'Parsed Twitter Card metadata (card, title, description, image, etc.)';
COMMENT ON COLUMN audit_pages.json_ld_items IS 'Array of parsed JSON-LD items with types and key fields';
