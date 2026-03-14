-- Migration: 042_add_aeo_to_tiers
-- Description: Add 'aeo' to available_checks for pro, agency, and enterprise tiers

-- Pro tier: add aeo
UPDATE tier_limits SET available_checks = ARRAY['seo', 'accessibility', 'security', 'performance', 'content', 'google-dorking', 'eeat', 'aeo'] WHERE tier = 'pro';

-- Agency tier: add aeo
UPDATE tier_limits SET available_checks = ARRAY['seo', 'accessibility', 'security', 'performance', 'content', 'structured-data', 'google-dorking', 'eeat', 'aeo'] WHERE tier = 'agency';

-- Enterprise tier: add aeo
UPDATE tier_limits SET available_checks = ARRAY['seo', 'accessibility', 'security', 'performance', 'content', 'structured-data', 'google-dorking', 'eeat', 'aeo'] WHERE tier = 'enterprise';
