-- Migration: 118_early_access
-- Early Access system: user columns + system settings seed

ALTER TABLE users ADD COLUMN IF NOT EXISTS early_access BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS early_access_channel VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS early_access_activated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_early_access ON users(early_access) WHERE early_access = true;

INSERT INTO system_settings (key, value) VALUES
  ('early_access_enabled', 'false'),
  ('early_access_max_spots', '200'),
  ('early_access_discount_percent', '50'),
  ('early_access_activated', 'false')
ON CONFLICT (key) DO NOTHING;
