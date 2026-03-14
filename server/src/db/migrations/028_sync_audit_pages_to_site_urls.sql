-- Migration: 028_sync_audit_pages_to_site_urls
-- Description: Sync scores from audit_pages to site_urls when full-site audits complete
-- This ensures site_urls shows latest scores for all pages, not just single-URL audits

-- First, add last_content_score column to site_urls if it doesn't exist
ALTER TABLE site_urls ADD COLUMN IF NOT EXISTS last_content_score INTEGER;

-- Create function to sync audit_pages to site_urls when audit completes
CREATE OR REPLACE FUNCTION sync_audit_pages_to_site_urls()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run when audit completes and has a site_id
  IF NEW.status = 'completed' AND NEW.site_id IS NOT NULL THEN
    -- Upsert site_urls for all crawled pages in this audit
    INSERT INTO site_urls (site_id, url, url_path, source, last_audit_id, last_audited_at,
                           last_seo_score, last_accessibility_score, last_security_score,
                           last_performance_score, last_content_score, audit_count)
    SELECT
      NEW.site_id,
      ap.url,
      COALESCE(
        NULLIF(regexp_replace(ap.url, '^https?://[^/]+', ''), ''),
        '/'
      ) as url_path,
      'audit' as source,
      NEW.id as last_audit_id,
      NEW.completed_at as last_audited_at,
      ap.seo_score,
      ap.accessibility_score,
      ap.security_score,
      ap.performance_score,
      ap.content_score,
      1 as audit_count
    FROM audit_pages ap
    WHERE ap.audit_job_id = NEW.id
      AND ap.crawl_status = 'crawled'
      AND ap.url IS NOT NULL
    ON CONFLICT (site_id, url) DO UPDATE SET
      last_audit_id = EXCLUDED.last_audit_id,
      last_audited_at = EXCLUDED.last_audited_at,
      last_seo_score = COALESCE(EXCLUDED.last_seo_score, site_urls.last_seo_score),
      last_accessibility_score = COALESCE(EXCLUDED.last_accessibility_score, site_urls.last_accessibility_score),
      last_security_score = COALESCE(EXCLUDED.last_security_score, site_urls.last_security_score),
      last_performance_score = COALESCE(EXCLUDED.last_performance_score, site_urls.last_performance_score),
      last_content_score = COALESCE(EXCLUDED.last_content_score, site_urls.last_content_score),
      audit_count = site_urls.audit_count + 1,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run after audit completes
DROP TRIGGER IF EXISTS trigger_sync_audit_pages_to_site_urls ON audit_jobs;
CREATE TRIGGER trigger_sync_audit_pages_to_site_urls
AFTER UPDATE ON audit_jobs
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION sync_audit_pages_to_site_urls();

-- Also run for any existing completed audits that haven't been synced
-- This is a one-time backfill for audits that completed before this migration
DO $$
DECLARE
  audit_record RECORD;
  synced_count INTEGER := 0;
BEGIN
  FOR audit_record IN
    SELECT aj.id, aj.site_id, aj.completed_at
    FROM audit_jobs aj
    WHERE aj.status = 'completed'
      AND aj.site_id IS NOT NULL
      AND aj.completed_at > NOW() - INTERVAL '30 days'
    ORDER BY aj.completed_at DESC
  LOOP
    -- Upsert site_urls for all crawled pages in this audit
    INSERT INTO site_urls (site_id, url, url_path, source, last_audit_id, last_audited_at,
                           last_seo_score, last_accessibility_score, last_security_score,
                           last_performance_score, last_content_score, audit_count)
    SELECT
      audit_record.site_id,
      ap.url,
      COALESCE(
        NULLIF(regexp_replace(ap.url, '^https?://[^/]+', ''), ''),
        '/'
      ) as url_path,
      'audit' as source,
      audit_record.id as last_audit_id,
      audit_record.completed_at as last_audited_at,
      ap.seo_score,
      ap.accessibility_score,
      ap.security_score,
      ap.performance_score,
      ap.content_score,
      1 as audit_count
    FROM audit_pages ap
    WHERE ap.audit_job_id = audit_record.id
      AND ap.crawl_status = 'crawled'
      AND ap.url IS NOT NULL
    ON CONFLICT (site_id, url) DO UPDATE SET
      -- Only update if this audit is newer than the existing last_audited_at
      last_audit_id = CASE
        WHEN EXCLUDED.last_audited_at > COALESCE(site_urls.last_audited_at, '1970-01-01'::timestamptz)
        THEN EXCLUDED.last_audit_id
        ELSE site_urls.last_audit_id
      END,
      last_audited_at = CASE
        WHEN EXCLUDED.last_audited_at > COALESCE(site_urls.last_audited_at, '1970-01-01'::timestamptz)
        THEN EXCLUDED.last_audited_at
        ELSE site_urls.last_audited_at
      END,
      last_seo_score = CASE
        WHEN EXCLUDED.last_audited_at > COALESCE(site_urls.last_audited_at, '1970-01-01'::timestamptz)
        THEN COALESCE(EXCLUDED.last_seo_score, site_urls.last_seo_score)
        ELSE site_urls.last_seo_score
      END,
      last_accessibility_score = CASE
        WHEN EXCLUDED.last_audited_at > COALESCE(site_urls.last_audited_at, '1970-01-01'::timestamptz)
        THEN COALESCE(EXCLUDED.last_accessibility_score, site_urls.last_accessibility_score)
        ELSE site_urls.last_accessibility_score
      END,
      last_security_score = CASE
        WHEN EXCLUDED.last_audited_at > COALESCE(site_urls.last_audited_at, '1970-01-01'::timestamptz)
        THEN COALESCE(EXCLUDED.last_security_score, site_urls.last_security_score)
        ELSE site_urls.last_security_score
      END,
      last_performance_score = CASE
        WHEN EXCLUDED.last_audited_at > COALESCE(site_urls.last_audited_at, '1970-01-01'::timestamptz)
        THEN COALESCE(EXCLUDED.last_performance_score, site_urls.last_performance_score)
        ELSE site_urls.last_performance_score
      END,
      last_content_score = CASE
        WHEN EXCLUDED.last_audited_at > COALESCE(site_urls.last_audited_at, '1970-01-01'::timestamptz)
        THEN COALESCE(EXCLUDED.last_content_score, site_urls.last_content_score)
        ELSE site_urls.last_content_score
      END,
      updated_at = NOW();

    synced_count := synced_count + 1;
  END LOOP;

  RAISE NOTICE 'Backfilled site_urls from % completed audits', synced_count;
END $$;
