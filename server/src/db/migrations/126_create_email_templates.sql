-- Email templates with block-based content and MJML compilation
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  subject VARCHAR(200) NOT NULL,
  preview_text VARCHAR(200),
  blocks JSONB NOT NULL DEFAULT '[]',
  compiled_html TEXT,
  compiled_at TIMESTAMPTZ,
  category VARCHAR(30) NOT NULL
    CHECK (category IN (
      'transactional', 'onboarding', 'engagement',
      'upgrade', 'security', 'win_back', 'educational',
      'announcement', 'digest'
    )),
  variables JSONB NOT NULL DEFAULT '[]',
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  branding_mode VARCHAR(20) NOT NULL DEFAULT 'platform'
    CHECK (branding_mode IN ('platform', 'site', 'org')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_templates_category ON email_templates (category);
CREATE INDEX idx_email_templates_slug ON email_templates (slug);
CREATE INDEX idx_email_templates_active ON email_templates (is_active) WHERE is_active = true;

-- Email sends — per-recipient send log
CREATE TABLE email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES email_templates(id),
  campaign_id UUID,
  user_id UUID NOT NULL REFERENCES users(id),
  sent_by UUID REFERENCES users(id),
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  variables JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
  resend_message_id VARCHAR(100),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_sends_user ON email_sends (user_id, created_at DESC);
CREATE INDEX idx_email_sends_campaign ON email_sends (campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_email_sends_status ON email_sends (status);
CREATE INDEX idx_email_sends_resend_id ON email_sends (resend_message_id) WHERE resend_message_id IS NOT NULL;
CREATE INDEX idx_email_sends_template ON email_sends (template_id, created_at DESC);
