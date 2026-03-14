-- Migration 052: Add lead scoring columns to users table
-- Part of CRM Phase 2 - Lead Scoring Foundation

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS lead_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_status VARCHAR(20) NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS lead_score_updated_at TIMESTAMPTZ;

-- Add check constraint for lead_status
ALTER TABLE users
  ADD CONSTRAINT chk_users_lead_status
  CHECK (lead_status IN ('new', 'activated', 'engaged', 'power_user', 'upgrade_prospect', 'churning', 'churned'));

-- Indexes for CRM lead board queries
CREATE INDEX IF NOT EXISTS idx_users_lead_score ON users (lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_lead_status ON users (lead_status);
CREATE INDEX IF NOT EXISTS idx_users_lead_score_status ON users (lead_status, lead_score DESC);
