-- Migration: 103_add_structured_data_to_tiers
-- Description: Add 'content' and 'structured-data' to available_checks for paid tiers

-- Free tier: basic checks only (seo, security)
UPDATE tier_limits
SET available_checks = ARRAY['seo', 'security']
WHERE tier = 'free';

-- Starter tier: adds accessibility and performance
UPDATE tier_limits
SET available_checks = ARRAY['seo', 'accessibility', 'security', 'performance']
WHERE tier = 'starter';

-- Pro tier: adds content analysis
UPDATE tier_limits
SET available_checks = ARRAY['seo', 'accessibility', 'security', 'performance', 'content']
WHERE tier = 'pro';

-- Agency tier: adds structured data analysis
UPDATE tier_limits
SET available_checks = ARRAY['seo', 'accessibility', 'security', 'performance', 'content', 'structured-data']
WHERE tier = 'agency';

-- Enterprise tier: all features
UPDATE tier_limits
SET available_checks = ARRAY['seo', 'accessibility', 'security', 'performance', 'content', 'structured-data']
WHERE tier = 'enterprise';

-- Add comments
COMMENT ON COLUMN tier_limits.available_checks IS 'Available audit check types: seo, accessibility, security, performance, content, structured-data';
