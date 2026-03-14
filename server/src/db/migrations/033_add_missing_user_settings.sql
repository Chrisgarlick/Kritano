-- Migration: 033_add_missing_user_settings
-- Description: Add missing columns to users table that were supposed to be added in 021
-- These columns are required for consent preference tracking

-- Add ToS tracking columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tos_version VARCHAR(20);

-- Add settings JSONB column for user preferences (like skipUnverifiedDomainWarning)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Settings structure: { "skipUnverifiedDomainWarning": boolean }
COMMENT ON COLUMN users.settings IS 'JSON settings including skipUnverifiedDomainWarning preference';
