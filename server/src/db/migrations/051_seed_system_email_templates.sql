-- Seed the 3 system email templates (replacing inline HTML in email.service.ts)

INSERT INTO email_templates (slug, name, description, subject, preview_text, blocks, category, variables, is_system, branding_mode)
VALUES
  (
    'email_verification',
    'Email Verification',
    'Sent when a user registers to verify their email address.',
    'Verify your PagePulser account',
    'Please verify your email address to get started.',
    '[
      {"type":"header"},
      {"type":"text","content":"Hi {{firstName}},","fontSize":"lg"},
      {"type":"text","content":"Welcome to PagePulser! Please verify your email address by clicking the button below:"},
      {"type":"button","label":"Verify Email Address","href":"{{verifyUrl}}","align":"center"},
      {"type":"text","content":"Or copy and paste this link into your browser:","fontSize":"sm","color":"#6b7280"},
      {"type":"text","content":"{{verifyUrl}}","fontSize":"sm","color":"#6b7280"},
      {"type":"text","content":"This link will expire in 24 hours.","fontSize":"sm","color":"#6b7280"},
      {"type":"divider"},
      {"type":"footer","text":"If you didn''t create an account with PagePulser, you can safely ignore this email.","includeUnsubscribe":false}
    ]'::jsonb,
    'transactional',
    '["firstName", "verifyUrl"]'::jsonb,
    true,
    'platform'
  ),
  (
    'password_reset',
    'Password Reset',
    'Sent when a user requests a password reset.',
    'Reset your PagePulser password',
    'You requested a password reset.',
    '[
      {"type":"header"},
      {"type":"text","content":"Hi {{firstName}},","fontSize":"lg"},
      {"type":"text","content":"We received a request to reset your password. Click the button below to choose a new password:"},
      {"type":"button","label":"Reset Password","href":"{{resetUrl}}","align":"center"},
      {"type":"text","content":"Or copy and paste this link into your browser:","fontSize":"sm","color":"#6b7280"},
      {"type":"text","content":"{{resetUrl}}","fontSize":"sm","color":"#6b7280"},
      {"type":"text","content":"<strong>This link will expire in 1 hour.</strong>","fontSize":"sm","color":"#6b7280"},
      {"type":"divider"},
      {"type":"footer","text":"If you didn''t request a password reset, you can safely ignore this email. Your password will remain unchanged.","includeUnsubscribe":false}
    ]'::jsonb,
    'transactional',
    '["firstName", "resetUrl"]'::jsonb,
    true,
    'platform'
  ),
  (
    'audit_completed',
    'Audit Completed',
    'Sent when an audit finishes (completed or failed).',
    'Audit {{statusText}}: {{domain}}',
    'Your audit has finished. View the results.',
    '[
      {"type":"header"},
      {"type":"text","content":"Hi {{firstName}},","fontSize":"lg"},
      {"type":"text","content":"Your audit of <strong>{{targetUrl}}</strong> has {{statusMessage}}."},
      {"type":"score_table"},
      {"type":"issues_summary"},
      {"type":"button","label":"View Audit Results","href":"{{auditUrl}}","align":"center"},
      {"type":"divider"},
      {"type":"footer","text":"You''re receiving this email because you have audit notifications enabled.","includeUnsubscribe":true}
    ]'::jsonb,
    'transactional',
    '["firstName", "domain", "targetUrl", "statusText", "statusMessage", "auditUrl", "totalIssues", "criticalIssues", "seoScore", "accessibilityScore", "securityScore", "performanceScore", "contentScore", "structuredDataScore"]'::jsonb,
    true,
    'platform'
  )
ON CONFLICT (slug) DO NOTHING;
