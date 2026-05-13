-- Email template: Gated Resource Delivery
-- Sent automatically when a visitor (or logged-in user) requests a gated
-- resource. Delivers the same download links shown on the thanks page.
-- See /docs/gated-resources.md.

INSERT INTO email_templates (slug, name, description, subject, preview_text, blocks, category, variables, is_system, branding_mode)
VALUES (
  'gated_resource_delivery',
  'Gated Resource Delivery',
  'Sent when a user requests a downloadable resource. Carries the same download links shown on the thanks page.',
  'Your {{resourceTitle}} download is ready',
  'Your download is ready, plus a link you can come back to later.',
  '[
    {"type":"header"},
    {"type":"text","content":"Hi,","fontSize":"lg"},
    {"type":"text","content":"Thanks for requesting <strong>{{resourceTitle}}</strong>. Your download is ready below."},
    {"type":"button","label":"Download Markdown","href":"{{downloadMdUrl}}","align":"center"},
    {"type":"text","content":"{{additionalFormatsHtml}}"},
    {"type":"text","content":"This link works for 7 days, so you can come back any time during that window."},
    {"type":"divider"},
    {"type":"text","content":"<strong>While you''re here:</strong> Kritano scans your website for the same issues this resource covers, automatically, on every change. <a href=\"{{appUrl}}/register?ea=resources\">Start a free scan</a> in under a minute."},
    {"type":"divider"},
    {"type":"footer","text":"You received this because you requested {{resourceTitle}} from kritano.com.","includeUnsubscribe":false}
  ]'::jsonb,
  'transactional',
  '["resourceTitle", "downloadMdUrl", "additionalFormatsHtml", "appUrl"]'::jsonb,
  true,
  'platform'
)
ON CONFLICT (slug) DO NOTHING;
