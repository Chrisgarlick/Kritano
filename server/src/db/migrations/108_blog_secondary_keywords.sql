-- Migration: 108_blog_secondary_keywords.sql
-- Add secondary keywords field to blog posts for SEO

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[] DEFAULT '{}';
