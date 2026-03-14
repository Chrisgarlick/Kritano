-- 057: Create email_events table for webhook event tracking
-- Phase 3: Email Campaigns

CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_send_id UUID NOT NULL REFERENCES email_sends(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  event_type VARCHAR(30) NOT NULL
    CHECK (event_type IN ('email.sent', 'email.delivered', 'email.delivery_delayed', 'email.opened', 'email.clicked', 'email.bounced', 'email.complained')),
  payload JSONB NOT NULL DEFAULT '{}',
  resend_event_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_email_events_send ON email_events(email_send_id, created_at);
CREATE INDEX idx_email_events_campaign ON email_events(campaign_id, event_type) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_email_events_type ON email_events(event_type, created_at);
CREATE UNIQUE INDEX idx_email_events_resend_id ON email_events(resend_event_id) WHERE resend_event_id IS NOT NULL;
