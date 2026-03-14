-- Email template: Domain Verification Successful
-- Sent automatically when a user successfully verifies domain ownership.

INSERT INTO email_templates (slug, name, description, subject, preview_text, blocks, category, variables, is_system, branding_mode)
VALUES (
  'domain_verified',
  'Domain Verified',
  'Sent when a user successfully verifies domain ownership via DNS or file.',
  'Your domain {{domain}} is now verified',
  'Domain verified — you''ve unlocked full auditing capabilities.',
  '[
    {"type":"header"},
    {"type":"text","content":"Hi {{firstName}},","fontSize":"lg"},
    {"type":"text","content":"Great news! Your domain <strong>{{domain}}</strong> has been verified successfully via {{verificationMethod}}."},
    {"type":"text","content":"With a verified domain you can now:"},
    {"type":"text","content":"<ul><li><strong>Run multi-page audits</strong> — crawl your entire site in one scan</li><li><strong>Faster scanning</strong> — reduced delays between page requests</li><li><strong>Schedule recurring audits</strong> — automate your website health checks</li><li><strong>Share with your team</strong> — invite collaborators to view audit results</li></ul>"},
    {"type":"button","label":"View Your Site","href":"{{siteUrl}}","align":"center"},
    {"type":"divider"},
    {"type":"footer","text":"You verified this domain on {{verifiedDate}}.","includeUnsubscribe":false}
  ]'::jsonb,
  'transactional',
  '["firstName", "domain", "verificationMethod", "siteUrl", "verifiedDate"]'::jsonb,
  true,
  'platform'
)
ON CONFLICT (slug) DO NOTHING;
