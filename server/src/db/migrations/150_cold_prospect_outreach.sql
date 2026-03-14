-- Migration 083: Cold prospect outreach tables and templates
-- Tracks outreach emails sent to cold prospects (separate from user email_sends).

-- Outreach send tracking
CREATE TABLE IF NOT EXISTS cold_prospect_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES cold_prospects(id) ON DELETE CASCADE,
  template_slug TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cold_prospect_sends_prospect ON cold_prospect_sends(prospect_id);
CREATE INDEX IF NOT EXISTS idx_cold_prospect_sends_status ON cold_prospect_sends(status);
CREATE INDEX IF NOT EXISTS idx_cold_prospect_sends_created ON cold_prospect_sends(created_at);

-- Permanent opt-out list for cold prospects
CREATE TABLE IF NOT EXISTS cold_prospect_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  prospect_id UUID REFERENCES cold_prospects(id) ON DELETE SET NULL,
  unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cold_prospect_unsub_email ON cold_prospect_unsubscribes(email);

-- Add 'cold_outreach' to the email_templates category check constraint
ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_category_check;
ALTER TABLE email_templates ADD CONSTRAINT email_templates_category_check
  CHECK (category IN (
    'transactional', 'onboarding', 'engagement',
    'upgrade', 'security', 'win_back', 'educational',
    'announcement', 'digest', 'cold_outreach'
  ));

-- Seed cold outreach email templates
INSERT INTO email_templates (slug, name, description, subject, blocks, category, variables, is_system, is_active, branding_mode)
VALUES
  (
    'cold_outreach_initial',
    'Cold Outreach - Initial',
    'First contact email for qualified cold prospects',
    'Quick question about {{domain}}',
    '[{"type":"header","companyName":"PagePulser","backgroundColor":"#4f46e5"},{"type":"text","content":"<p>Hi{{#if contactName}} {{contactName}}{{/if}},</p><p>I came across <strong>{{domain}}</strong> and ran a quick audit. I found a few areas that could be improved — particularly around {{topIssueArea}}.</p><p>PagePulser is a free tool that helps website owners identify and fix SEO, accessibility, security, and performance issues. I thought it might be useful for your site.</p><p>Would you be interested in seeing the full report? It''s completely free — no strings attached.</p><p>Best,<br/>The PagePulser Team</p>","fontSize":"md","align":"left","color":"#333333"},{"type":"button","label":"Try PagePulser Free","href":"{{appUrl}}/register","align":"center"},{"type":"divider"},{"type":"text","content":"<p style=\"font-size:12px;color:#999;\">You''re receiving this because your website was identified as a potential fit for our audit tool. <a href=\"{{unsubscribeUrl}}\">Unsubscribe</a></p>","fontSize":"sm","align":"center","color":"#999999"}]',
    'cold_outreach',
    '["contactName", "domain", "topIssueArea", "appUrl", "unsubscribeUrl"]',
    false,
    true,
    'platform'
  ),
  (
    'cold_outreach_followup',
    'Cold Outreach - Follow-up',
    'Follow-up email for cold prospects who didn''t respond to initial outreach',
    'Following up on {{domain}}',
    '[{"type":"header","companyName":"PagePulser","backgroundColor":"#4f46e5"},{"type":"text","content":"<p>Hi{{#if contactName}} {{contactName}}{{/if}},</p><p>Just a quick follow-up on my previous email about <strong>{{domain}}</strong>.</p><p>I wanted to share that sites using PagePulser typically see a <strong>25% improvement</strong> in their audit scores within the first month. Our tool covers:</p><ul><li>SEO analysis and recommendations</li><li>Accessibility compliance checking</li><li>Security vulnerability detection</li><li>Performance optimisation tips</li></ul><p>It takes less than 2 minutes to run your first audit. Would you like to give it a try?</p><p>Best,<br/>The PagePulser Team</p>","fontSize":"md","align":"left","color":"#333333"},{"type":"button","label":"Run Your Free Audit","href":"{{appUrl}}/register","align":"center"},{"type":"divider"},{"type":"text","content":"<p style=\"font-size:12px;color:#999;\">You''re receiving this because your website was identified as a potential fit for our audit tool. <a href=\"{{unsubscribeUrl}}\">Unsubscribe</a></p>","fontSize":"sm","align":"center","color":"#999999"}]',
    'cold_outreach',
    '["contactName", "domain", "appUrl", "unsubscribeUrl"]',
    false,
    true,
    'platform'
  )
ON CONFLICT (slug) DO NOTHING;

-- Setting: cold outreach auto-send (default off — opt-in)
INSERT INTO system_settings (key, value) VALUES
  ('trigger_auto_send_cold_outreach', 'false')
ON CONFLICT (key) DO NOTHING;
