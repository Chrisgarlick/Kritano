-- Migration: 107_add_eeat_to_tiers
-- Description: Add 'eeat' to available_checks for pro, agency, and enterprise tiers

-- Pro tier: add eeat
UPDATE tier_limits SET available_checks = ARRAY['seo', 'accessibility', 'security', 'performance', 'content', 'google-dorking', 'eeat'] WHERE tier = 'pro';

-- Agency tier: add eeat
UPDATE tier_limits SET available_checks = ARRAY['seo', 'accessibility', 'security', 'performance', 'content', 'structured-data', 'google-dorking', 'eeat'] WHERE tier = 'agency';

-- Enterprise tier: add eeat
UPDATE tier_limits SET available_checks = ARRAY['seo', 'accessibility', 'security', 'performance', 'content', 'structured-data', 'google-dorking', 'eeat'] WHERE tier = 'enterprise';
