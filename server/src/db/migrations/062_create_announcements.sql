-- Migration 062: Create announcements + announcement_dismissals tables
-- Dashboard banners for feature launches, maintenance windows, or marketing messages.

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'info'
    CHECK (type IN ('info', 'success', 'warning', 'maintenance')),
  target_tiers VARCHAR(20)[] DEFAULT NULL,
  cta_label VARCHAR(50),
  cta_url VARCHAR(500),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_dismissible BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcement_dismissals (
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (announcement_id, user_id)
);

CREATE INDEX idx_announcements_active ON announcements (is_active, starts_at, ends_at);
CREATE INDEX idx_announcement_dismissals_user ON announcement_dismissals (user_id);
