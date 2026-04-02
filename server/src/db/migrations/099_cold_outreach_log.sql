-- Manual cold outreach email log
-- Tracks emails sent by hand with outcome tracking

CREATE TABLE cold_outreach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact info
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  domain VARCHAR(255),

  -- Outreach tracking
  date_sent DATE NOT NULL DEFAULT CURRENT_DATE,
  subject VARCHAR(500),
  notes TEXT,

  -- Status pipeline
  status VARCHAR(20) NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'replied', 'nurturing', 'converted', 'dead')),

  -- Outcome tracking
  replied BOOLEAN NOT NULL DEFAULT false,
  reply_date DATE,
  reply_notes TEXT,

  free_audit_given BOOLEAN NOT NULL DEFAULT false,
  free_audit_date DATE,

  became_user BOOLEAN NOT NULL DEFAULT false,
  user_signup_date DATE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  became_paid BOOLEAN NOT NULL DEFAULT false,
  paid_date DATE,
  plan_tier VARCHAR(20),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cold_outreach_log_email ON cold_outreach_log(email);
CREATE INDEX idx_cold_outreach_log_status ON cold_outreach_log(status);
CREATE INDEX idx_cold_outreach_log_date_sent ON cold_outreach_log(date_sent DESC);
CREATE INDEX idx_cold_outreach_log_domain ON cold_outreach_log(domain);
