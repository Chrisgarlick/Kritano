-- Seed early access email templates

INSERT INTO email_templates (slug, name, description, subject, preview_text, blocks, category, variables, is_system, branding_mode)
VALUES
  (
    'early_access_confirmed',
    'Early Access Confirmed',
    'Sent when a user claims an early access spot during registration.',
    'You''re in! Your early access spot is secured',
    'Your founding member spot at PagePulser is locked in.',
    '[
      {"type":"header"},
      {"type":"text","content":"Hi {{firstName}},","fontSize":"lg"},
      {"type":"text","content":"Welcome to the <strong>PagePulser Founding Members</strong> club! Your early access spot has been secured."},
      {"type":"text","content":"Here''s what you''ll get when we activate early access:"},
      {"type":"text","content":"<strong>30-day free trial</strong> of our {{tierName}} plan — full access to every feature."},
      {"type":"text","content":"<strong>{{discountPercent}}% lifetime discount</strong> — locked in forever as a founding member."},
      {"type":"text","content":"We''ll send you another email as soon as early access goes live. Sit tight!"},
      {"type":"divider"},
      {"type":"footer","text":"Thank you for being an early supporter of PagePulser.","includeUnsubscribe":true}
    ]'::jsonb,
    'transactional',
    '["firstName", "tierName", "discountPercent"]'::jsonb,
    true,
    'platform'
  ),
  (
    'early_access_activated',
    'Early Access Activated',
    'Sent when admin activates all early access users, granting them their trial.',
    'Your early access is live — 30 days of {{tierName}}, free',
    'Your founding member trial is now active. Log in and start auditing.',
    '[
      {"type":"header"},
      {"type":"text","content":"Hi {{firstName}},","fontSize":"lg"},
      {"type":"text","content":"The wait is over! Your <strong>{{tierName}}</strong> trial is now <strong>live</strong>."},
      {"type":"text","content":"You have <strong>30 days</strong> of full access — your trial ends on <strong>{{trialEndDate}}</strong>."},
      {"type":"text","content":"As a founding member, you also have a <strong>{{discountPercent}}% lifetime discount</strong> locked in for when you subscribe."},
      {"type":"button","label":"Log In & Start Auditing","href":"{{loginUrl}}","align":"center"},
      {"type":"divider"},
      {"type":"footer","text":"Thank you for being one of our founding members.","includeUnsubscribe":true}
    ]'::jsonb,
    'transactional',
    '["firstName", "tierName", "trialEndDate", "discountPercent", "loginUrl"]'::jsonb,
    true,
    'platform'
  )
ON CONFLICT (slug) DO NOTHING;
