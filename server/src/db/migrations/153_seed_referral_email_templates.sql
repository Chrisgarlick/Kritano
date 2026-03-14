-- Seed referral email templates

INSERT INTO email_templates (slug, name, description, subject, preview_text, blocks, category, variables, is_system, branding_mode)
VALUES
  (
    'referral_invite',
    'Referral Invite',
    'Sent when a user invites someone by email to join PagePulser.',
    '{{referrerName}} invited you to try PagePulser',
    'You''ve been invited to try PagePulser - a web auditing platform.',
    '[
      {"type":"header"},
      {"type":"text","content":"Hi there,","fontSize":"lg"},
      {"type":"text","content":"{{referrerName}} thinks you''d love <strong>PagePulser</strong> — a platform that helps you audit and improve your website''s SEO, accessibility, security, and performance."},
      {"type":"text","content":"Sign up using the link below and you''ll both get bonus audits:"},
      {"type":"button","label":"Join PagePulser","href":"{{referralUrl}}","align":"center"},
      {"type":"text","content":"Or copy and paste this link into your browser:","fontSize":"sm","color":"#6b7280"},
      {"type":"text","content":"{{referralUrl}}","fontSize":"sm","color":"#6b7280"},
      {"type":"divider"},
      {"type":"footer","text":"This invitation was sent by {{referrerName}} ({{referrerEmail}}). If you don''t know this person, you can safely ignore this email.","includeUnsubscribe":false}
    ]'::jsonb,
    'transactional',
    '["referrerName", "referrerEmail", "referralUrl"]'::jsonb,
    true,
    'platform'
  ),
  (
    'referral_qualified',
    'Referral Qualified',
    'Sent to the referrer when their referral qualifies (email verified + first audit done).',
    'Your referral just earned you bonus audits!',
    'Your referred user completed their first audit — bonus audits have been added.',
    '[
      {"type":"header"},
      {"type":"text","content":"Hi {{firstName}},","fontSize":"lg"},
      {"type":"text","content":"Great news! <strong>{{referredName}}</strong> just completed their first audit on PagePulser."},
      {"type":"text","content":"As a thank you, we''ve added <strong>{{bonusAudits}} bonus audits</strong> to your account."},
      {"type":"text","content":"You now have <strong>{{totalBonusAudits}} bonus audits</strong> remaining."},
      {"type":"button","label":"View Your Referrals","href":"{{referralsUrl}}","align":"center"},
      {"type":"divider"},
      {"type":"footer","text":"Keep sharing your referral link to earn more bonus audits!","includeUnsubscribe":true}
    ]'::jsonb,
    'transactional',
    '["firstName", "referredName", "bonusAudits", "totalBonusAudits", "referralsUrl"]'::jsonb,
    true,
    'platform'
  ),
  (
    'referral_welcome_bonus',
    'Referral Welcome Bonus',
    'Sent to the referred user when their bonus audits are applied.',
    'Welcome bonus: {{bonusAudits}} free audits added!',
    'You''ve received bonus audits for signing up through a referral.',
    '[
      {"type":"header"},
      {"type":"text","content":"Hi {{firstName}},","fontSize":"lg"},
      {"type":"text","content":"Thanks to {{referrerName}}''s referral, we''ve added <strong>{{bonusAudits}} bonus audits</strong> to your account!"},
      {"type":"text","content":"These bonus audits can be used once you''ve reached your plan''s monthly limit — they''ll kick in automatically."},
      {"type":"button","label":"Start Auditing","href":"{{dashboardUrl}}","align":"center"},
      {"type":"divider"},
      {"type":"footer","text":"Enjoy your bonus audits!","includeUnsubscribe":true}
    ]'::jsonb,
    'transactional',
    '["firstName", "referrerName", "bonusAudits", "dashboardUrl"]'::jsonb,
    true,
    'platform'
  ),
  (
    'referral_milestone',
    'Referral Milestone',
    'Sent to the referrer when they reach a referral milestone (5 or 10 referrals).',
    'Milestone reached: {{milestoneCount}} referrals!',
    'You''ve hit a referral milestone and earned a reward.',
    '[
      {"type":"header"},
      {"type":"text","content":"Hi {{firstName}},","fontSize":"lg"},
      {"type":"text","content":"You''ve reached an amazing milestone — <strong>{{milestoneCount}} qualified referrals</strong>!"},
      {"type":"text","content":"As a reward, you''ve been upgraded to the <strong>{{rewardTier}}</strong> plan for <strong>{{rewardDays}} days</strong>."},
      {"type":"text","content":"Thank you for spreading the word about PagePulser!"},
      {"type":"button","label":"View Your Account","href":"{{referralsUrl}}","align":"center"},
      {"type":"divider"},
      {"type":"footer","text":"Keep referring to unlock even more rewards!","includeUnsubscribe":true}
    ]'::jsonb,
    'transactional',
    '["firstName", "milestoneCount", "rewardTier", "rewardDays", "referralsUrl"]'::jsonb,
    true,
    'platform'
  )
ON CONFLICT (slug) DO NOTHING;
