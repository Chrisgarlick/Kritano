-- Migration: 107_blog_focus_keyword.sql
-- Add focus keyword field to blog posts for SEO

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS focus_keyword VARCHAR(100);
