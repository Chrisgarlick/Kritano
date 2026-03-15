-- Migration 088: Update cold outreach templates for LIA compliance
-- - Adds data source disclosure to initial email
-- - Adds business postal address placeholder to footer
-- - Removes follow-up template (single contact per domain policy)
-- See /docs/cold-prospects-LIA.md for full compliance details.

-- Update initial outreach template with LIA-compliant content
UPDATE email_templates
SET
  blocks = '[{"type":"header","companyName":"PagePulser","backgroundColor":"#4f46e5"},{"type":"text","content":"<p>Hi,</p><p>We came across <strong>{{domain}}</strong> while reviewing newly registered domains and ran a quick audit. We found a few areas that could be improved — particularly around {{topIssueArea}}.</p><p>PagePulser is a free tool that helps website owners identify and fix SEO, accessibility, security, and performance issues. We thought it might be useful as you build out your site.</p><p>Would you be interested in seeing the full report? It''s completely free — no strings attached.</p><p>Best,<br/>The PagePulser Team</p>","fontSize":"md","align":"left","color":"#333333"},{"type":"button","label":"Try PagePulser Free","href":"{{appUrl}}/register","align":"center"},{"type":"divider"},{"type":"text","content":"<p style=\"font-size:12px;color:#999;\">You''re receiving this because we found your website via publicly available newly registered domain listings and believe our audit tool may be useful to you. We only send one email per domain and will not contact you again.<br/><br/>If you''d prefer not to hear from us, you can <a href=\"{{unsubscribeUrl}}\">unsubscribe instantly</a>.<br/><br/>PagePulser · {{businessAddress}}</p>","fontSize":"sm","align":"center","color":"#999999"}]',
  variables = '["domain", "topIssueArea", "appUrl", "unsubscribeUrl", "businessAddress"]',
  updated_at = NOW()
WHERE slug = 'cold_outreach_initial';

-- Deactivate follow-up template (LIA: single contact per domain)
UPDATE email_templates
SET is_active = false, updated_at = NOW()
WHERE slug = 'cold_outreach_followup';

-- Lower the default daily email limit to 20
UPDATE system_settings
SET value = '20', updated_at = NOW()
WHERE key = 'cold_prospect_daily_email_limit';
