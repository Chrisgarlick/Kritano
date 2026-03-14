-- Migration: 035_enable_content_all_tiers
-- Description: Add 'content' to free and starter tiers so content score shows for all users.
-- Also always run structured data engine (lightweight HTML parsing) for all tiers.

-- Free tier: add content
UPDATE tier_limits SET available_checks = ARRAY['seo', 'security', 'content'] WHERE tier = 'free';

-- Starter tier: add content (was missing)
UPDATE tier_limits SET available_checks = ARRAY['seo', 'accessibility', 'security', 'performance', 'content'] WHERE tier = 'starter';

-- Pro tier: ensure content is present
UPDATE tier_limits SET available_checks = ARRAY['seo', 'accessibility', 'security', 'performance', 'content'] WHERE tier = 'pro';

-- Agency/Enterprise already have content + structured-data, no change needed
