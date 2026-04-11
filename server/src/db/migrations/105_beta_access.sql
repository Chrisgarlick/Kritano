-- Add beta_access flag to users table
-- Allows specific users to access the full app while site is in waitlist mode
-- Without granting admin/super_admin privileges

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS beta_access BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_beta_access ON users(beta_access) WHERE beta_access = TRUE;
