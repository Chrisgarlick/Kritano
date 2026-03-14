-- Migration 067: Seed trial lifecycle email templates
-- Three templates for the trial lifecycle: started, expiring (3-day warning), expired

INSERT INTO email_templates (slug, name, description, subject, blocks, category, variables, is_system, is_active, branding_mode)
VALUES
  (
    'trial_started',
    'Trial Started - Welcome',
    'Sent immediately when a user starts a free trial',
    'Your {{tierName}} trial has started, {{firstName}}!',
    '[{"type":"header","companyName":"PagePulser","backgroundColor":"#4f46e5"},{"type":"text","content":"<h2>Welcome to {{tierName}}, {{firstName}}!</h2><p>Your 14-day free trial is now active. Here''s what you can do:</p><ul><li><strong>{{featureHighlight1}}</strong></li><li><strong>{{featureHighlight2}}</strong></li><li><strong>{{featureHighlight3}}</strong></li></ul><p>Your trial runs until <strong>{{trialEndDate}}</strong>. Make the most of it!</p>","fontSize":"md","align":"left","color":"#333333"},{"type":"button","label":"Start Auditing","href":"{{appUrl}}/sites","align":"center"},{"type":"divider"},{"type":"footer","includeUnsubscribe":true}]',
    'onboarding',
    '["firstName", "tierName", "trialEndDate", "featureHighlight1", "featureHighlight2", "featureHighlight3", "appUrl"]',
    false,
    true,
    'platform'
  ),
  (
    'trial_expiring',
    'Trial Expiring Soon',
    'Sent 3 days before a trial expires',
    'Your {{tierName}} trial ends in 3 days',
    '[{"type":"header","companyName":"PagePulser","backgroundColor":"#d97706"},{"type":"text","content":"<h2>Your trial is ending soon, {{firstName}}</h2><p>Your <strong>{{tierName}}</strong> trial expires on <strong>{{trialEndDate}}</strong>. After that, your account will revert to the Free plan.</p><p>To keep your {{tierName}} features — including advanced audits, scheduled scans, and export capabilities — upgrade before your trial ends.</p>","fontSize":"md","align":"left","color":"#333333"},{"type":"button","label":"Upgrade Now","href":"{{appUrl}}/settings/profile","align":"center"},{"type":"divider"},{"type":"footer","includeUnsubscribe":true}]',
    'upgrade',
    '["firstName", "tierName", "trialEndDate", "appUrl"]',
    false,
    true,
    'platform'
  ),
  (
    'trial_expired',
    'Trial Expired - Downgraded to Free',
    'Sent when a trial expires and user is downgraded to free',
    'Your {{tierName}} trial has ended',
    '[{"type":"header","companyName":"PagePulser","backgroundColor":"#4f46e5"},{"type":"text","content":"<h2>Your trial has ended, {{firstName}}</h2><p>Your <strong>{{tierName}}</strong> trial has expired and your account has been moved to the Free plan.</p><p>You can still use PagePulser with Free plan features. To get back your {{tierName}} capabilities, upgrade any time from your profile.</p>","fontSize":"md","align":"left","color":"#333333"},{"type":"button","label":"See Upgrade Options","href":"{{appUrl}}/settings/profile","align":"center"},{"type":"divider"},{"type":"footer","includeUnsubscribe":true}]',
    'upgrade',
    '["firstName", "tierName", "appUrl"]',
    false,
    true,
    'platform'
  )
ON CONFLICT (slug) DO NOTHING;
