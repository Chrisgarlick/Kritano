-- Cookie consent audit log for GDPR compliance
CREATE TABLE IF NOT EXISTS cookie_consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  consent_version VARCHAR(20) NOT NULL,
  categories JSONB NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('accept_all', 'reject_all', 'custom', 'withdraw')),
  ip_address INET,
  user_agent TEXT,
  page_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cookie_consent_user ON cookie_consent_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_cookie_consent_created ON cookie_consent_logs(created_at);
