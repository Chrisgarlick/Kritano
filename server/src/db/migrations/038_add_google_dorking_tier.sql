-- Migration: 038_add_google_dorking_tier
-- Description: Add 'google-dorking' to available_checks for pro, agency, and enterprise tiers

-- Pro tier: add google-dorking
UPDATE tier_limits SET available_checks = ARRAY['seo', 'accessibility', 'security', 'performance', 'content', 'google-dorking'] WHERE tier = 'pro';

-- Agency tier: add google-dorking
UPDATE tier_limits SET available_checks = ARRAY['seo', 'accessibility', 'security', 'performance', 'content', 'structured-data', 'google-dorking'] WHERE tier = 'agency';

-- Enterprise tier: add google-dorking
UPDATE tier_limits SET available_checks = ARRAY['seo', 'accessibility', 'security', 'performance', 'content', 'structured-data', 'google-dorking'] WHERE tier = 'enterprise';
