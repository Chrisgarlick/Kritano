-- Migration: 117_add_trial_support
-- has_used_trial: prevents users from re-trialing (one trial per user, ever)
-- trial_warning_sent: prevents duplicate 3-day warning emails on each poll cycle
-- Partial index for efficient expiry queries on trialing subscriptions

ALTER TABLE users ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN DEFAULT FALSE;

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_warning_sent BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_subscriptions_trialing
  ON subscriptions(status, trial_end) WHERE status = 'trialing';
