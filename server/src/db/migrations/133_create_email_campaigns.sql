-- 056: Create email_campaigns table for batch email sending
-- Phase 3: Email Campaigns

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'paused', 'sent', 'cancelled', 'failed')),
  segment JSONB NOT NULL DEFAULT '{}',
  audience_count INTEGER NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  stats JSONB NOT NULL DEFAULT '{"total":0,"queued":0,"sent":0,"delivered":0,"opened":0,"clicked":0,"bounced":0,"complained":0,"failed":0}',
  send_rate_per_second INTEGER NOT NULL DEFAULT 5,
  max_recipients INTEGER NOT NULL DEFAULT 10000,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled ON email_campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_email_campaigns_created ON email_campaigns(created_at DESC);

-- FK from email_sends.campaign_id → email_campaigns.id
ALTER TABLE email_sends
  ADD CONSTRAINT fk_email_sends_campaign
  FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE SET NULL;
