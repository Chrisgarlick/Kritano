-- Migration: 022_scanner_bypass_settings
-- Description: Add bypass settings for verified domains (robots.txt, rate limits, verification header)
-- Date: 2024-01-XX

-- Add bypass settings to organization_domains
ALTER TABLE organization_domains
ADD COLUMN IF NOT EXISTS ignore_robots_txt BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rate_limit_profile VARCHAR(20) DEFAULT 'conservative',
ADD COLUMN IF NOT EXISTS send_verification_header BOOLEAN DEFAULT TRUE;

-- Add constraint for rate_limit_profile values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'organization_domains_rate_limit_profile_check'
    ) THEN
        ALTER TABLE organization_domains
        ADD CONSTRAINT organization_domains_rate_limit_profile_check
        CHECK (rate_limit_profile IN ('conservative', 'normal', 'aggressive'));
    END IF;
END $$;

-- Add comment explaining the columns
COMMENT ON COLUMN organization_domains.ignore_robots_txt IS 'When true, scanner ignores robots.txt for this verified domain';
COMMENT ON COLUMN organization_domains.rate_limit_profile IS 'Crawl speed profile: conservative (default), normal, or aggressive';
COMMENT ON COLUMN organization_domains.send_verification_header IS 'When true, sends X-PagePulser-Token header with requests for WAF whitelisting';

-- Create index for quick lookup of verified domains with custom settings
CREATE INDEX IF NOT EXISTS idx_organization_domains_verified_settings
ON organization_domains (organization_id, domain)
WHERE verified_at IS NOT NULL;
