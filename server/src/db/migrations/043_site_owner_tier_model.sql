-- Migration 043: Site Owner Tier Model
-- Audit capabilities are now determined by the site owner's subscription tier,
-- not the user who runs the audit. This also adds member limits per site.

-- Add member limit per site to tier_limits
ALTER TABLE tier_limits
  ADD COLUMN IF NOT EXISTS max_members_per_site INTEGER;

-- Set limits: Free=0, Starter=1, Pro=3, Agency=10, Enterprise=NULL(unlimited)
UPDATE tier_limits SET max_members_per_site = 0 WHERE tier = 'free';
UPDATE tier_limits SET max_members_per_site = 1 WHERE tier = 'starter';
UPDATE tier_limits SET max_members_per_site = 3 WHERE tier = 'pro';
UPDATE tier_limits SET max_members_per_site = 10 WHERE tier = 'agency';
UPDATE tier_limits SET max_members_per_site = NULL WHERE tier = 'enterprise';
