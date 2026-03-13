-- Migration: 116_system_settings
-- System Settings & Coming Soon Mode
-- Generic key-value config table for app-wide settings

CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

INSERT INTO system_settings (key, value) VALUES
  ('coming_soon_enabled', 'false'),
  ('coming_soon_headline', '"Something great is on its way."'),
  ('coming_soon_description', '"We''re building a powerful website auditing platform. Leave your email to be the first to know when we launch."')
ON CONFLICT (key) DO NOTHING;

-- Email signups collected while in coming soon mode
CREATE TABLE IF NOT EXISTS coming_soon_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL UNIQUE,
  name VARCHAR(200),
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coming_soon_signups_email ON coming_soon_signups(email);
