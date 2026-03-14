-- Add related_post_ids column for manual related post overrides
ALTER TABLE blog_posts ADD COLUMN related_post_ids UUID[] DEFAULT '{}';
