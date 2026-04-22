-- Migration: 109_gsc_dedup_constraint.sql
-- Fix: gsc_query_data had no unique constraint, causing duplicate rows on every sync.
-- Step 1: Remove duplicate rows, keeping only the first inserted (earliest created_at).
-- Step 2: Add unique constraint to prevent future duplicates.

-- Delete duplicates, keeping the row with the earliest created_at for each combo
DELETE FROM gsc_query_data a
  USING gsc_query_data b
WHERE a.id > b.id
  AND a.connection_id = b.connection_id
  AND a.query = b.query
  AND COALESCE(a.page_url, '') = COALESCE(b.page_url, '')
  AND a.date = b.date
  AND COALESCE(a.device, '') = COALESCE(b.device, '')
  AND COALESCE(a.country, '') = COALESCE(b.country, '');

-- Add unique constraint so ON CONFLICT DO NOTHING works correctly
CREATE UNIQUE INDEX IF NOT EXISTS idx_gsc_query_data_unique
  ON gsc_query_data (connection_id, query, COALESCE(page_url, ''), date, COALESCE(device, ''), COALESCE(country, ''));
