-- Migration: Add Super Admin Role
-- Description: Adds super admin flag to users table for platform-wide admin access

-- Add is_super_admin column to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_super_admin ON users(is_super_admin) WHERE is_super_admin = TRUE;

-- Create admin activity log for audit trail
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL, -- 'user', 'organization', 'subscription', etc.
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_log_admin ON admin_activity_log(admin_id);
CREATE INDEX idx_admin_log_action ON admin_activity_log(action);
CREATE INDEX idx_admin_log_target ON admin_activity_log(target_type, target_id);
CREATE INDEX idx_admin_log_created ON admin_activity_log(created_at DESC);

-- Create platform analytics snapshots table (daily aggregates)
CREATE TABLE IF NOT EXISTS platform_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,

  -- User metrics
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0, -- logged in within 24h
  verified_users INTEGER DEFAULT 0,

  -- Organization metrics
  total_organizations INTEGER DEFAULT 0,
  new_organizations INTEGER DEFAULT 0,

  -- Subscription metrics
  free_tier_count INTEGER DEFAULT 0,
  starter_tier_count INTEGER DEFAULT 0,
  pro_tier_count INTEGER DEFAULT 0,
  agency_tier_count INTEGER DEFAULT 0,
  enterprise_tier_count INTEGER DEFAULT 0,

  -- Audit metrics
  total_audits INTEGER DEFAULT 0,
  audits_today INTEGER DEFAULT 0,
  pages_crawled_today INTEGER DEFAULT 0,

  -- API metrics
  api_requests_today INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platform_analytics_date ON platform_analytics(date DESC);

-- Function to update analytics snapshot
CREATE OR REPLACE FUNCTION update_platform_analytics()
RETURNS void AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  INSERT INTO platform_analytics (
    date,
    total_users,
    new_users,
    active_users,
    verified_users,
    total_organizations,
    new_organizations,
    free_tier_count,
    starter_tier_count,
    pro_tier_count,
    agency_tier_count,
    enterprise_tier_count,
    total_audits,
    audits_today,
    pages_crawled_today
  )
  SELECT
    today,
    (SELECT COUNT(*) FROM users),
    (SELECT COUNT(*) FROM users WHERE DATE(created_at) = today),
    (SELECT COUNT(*) FROM users WHERE last_login_at > NOW() - INTERVAL '24 hours'),
    (SELECT COUNT(*) FROM users WHERE email_verified = TRUE),
    (SELECT COUNT(*) FROM organizations),
    (SELECT COUNT(*) FROM organizations WHERE DATE(created_at) = today),
    (SELECT COUNT(*) FROM subscriptions WHERE tier = 'free'),
    (SELECT COUNT(*) FROM subscriptions WHERE tier = 'starter'),
    (SELECT COUNT(*) FROM subscriptions WHERE tier = 'pro'),
    (SELECT COUNT(*) FROM subscriptions WHERE tier = 'agency'),
    (SELECT COUNT(*) FROM subscriptions WHERE tier = 'enterprise'),
    (SELECT COUNT(*) FROM audit_jobs),
    (SELECT COUNT(*) FROM audit_jobs WHERE DATE(created_at) = today),
    (SELECT COALESCE(SUM(pages_crawled), 0) FROM audit_jobs WHERE DATE(created_at) = today)
  ON CONFLICT (date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    new_users = EXCLUDED.new_users,
    active_users = EXCLUDED.active_users,
    verified_users = EXCLUDED.verified_users,
    total_organizations = EXCLUDED.total_organizations,
    new_organizations = EXCLUDED.new_organizations,
    free_tier_count = EXCLUDED.free_tier_count,
    starter_tier_count = EXCLUDED.starter_tier_count,
    pro_tier_count = EXCLUDED.pro_tier_count,
    agency_tier_count = EXCLUDED.agency_tier_count,
    enterprise_tier_count = EXCLUDED.enterprise_tier_count,
    total_audits = EXCLUDED.total_audits,
    audits_today = EXCLUDED.audits_today,
    pages_crawled_today = EXCLUDED.pages_crawled_today,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Seed: Make the first user (cgarlick94@gmail.com) a super admin
UPDATE users SET is_super_admin = TRUE WHERE email = 'cgarlick94@gmail.com';
