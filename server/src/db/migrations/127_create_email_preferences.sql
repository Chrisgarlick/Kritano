-- User-level email preferences (CAN-SPAM / GDPR compliance)
CREATE TABLE email_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  transactional BOOLEAN NOT NULL DEFAULT true,
  audit_notifications BOOLEAN NOT NULL DEFAULT true,
  product_updates BOOLEAN NOT NULL DEFAULT true,
  educational BOOLEAN NOT NULL DEFAULT true,
  marketing BOOLEAN NOT NULL DEFAULT true,
  unsubscribed_all BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
