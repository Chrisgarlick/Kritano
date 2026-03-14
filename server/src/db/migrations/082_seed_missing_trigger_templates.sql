-- Migration 082: Seed missing CRM trigger email templates
-- Adds content_improvement_guide and churn_risk_winback templates.

INSERT INTO email_templates (slug, name, description, subject, blocks, category, variables, is_system, is_active, branding_mode)
VALUES
  (
    'content_improvement_guide',
    'Content Improvement Guide',
    'Sent when a user has a low content score',
    'Improve your content quality on {{domain}}',
    '[{"type":"header","companyName":"PagePulser","backgroundColor":"#4f46e5"},{"type":"text","content":"<h2>Your Content Needs Attention</h2><p>Hi {{firstName}}, your latest audit of <strong>{{domain}}</strong> showed a content score of <strong>{{contentScore}}/100</strong>.</p><p>Quality content is the foundation of strong SEO and user engagement. Here are some quick improvements you can make:</p><ul><li>Ensure all pages have unique, descriptive meta titles and descriptions</li><li>Add alt text to all images</li><li>Improve heading hierarchy (H1, H2, H3)</li><li>Expand thin content pages to at least 300 words</li><li>Fix duplicate or near-duplicate content</li></ul>","fontSize":"md","align":"left","color":"#333333"},{"type":"button","label":"View Content Analysis","href":"{{appUrl}}/audits","align":"center"},{"type":"divider"},{"type":"footer","includeUnsubscribe":true}]',
    'educational',
    '["firstName", "domain", "contentScore", "appUrl"]',
    false,
    true,
    'platform'
  ),
  (
    'churn_risk_winback',
    'Churn Risk - Win Back',
    'Sent when a user is identified as a churn risk',
    'We want to help, {{firstName}}',
    '[{"type":"header","companyName":"PagePulser","backgroundColor":"#4f46e5"},{"type":"text","content":"<h2>We noticed you''ve been less active</h2><p>Hi {{firstName}}, we''ve noticed your engagement with <strong>{{domain}}</strong> has dropped off. We want to make sure you''re getting the most out of PagePulser.</p><p>Here are some things you might find helpful:</p><ul><li>Set up <strong>scheduled audits</strong> to automatically monitor your sites</li><li>Explore the <strong>AEO analysis</strong> to optimise for AI engines</li><li>Check your <strong>security findings</strong> for quick wins</li><li>Invite team members to collaborate on fixes</li></ul><p>If there''s anything we can do better, we''d love to hear from you.</p>","fontSize":"md","align":"left","color":"#333333"},{"type":"button","label":"Run a New Audit","href":"{{appUrl}}/audits/new","align":"center"},{"type":"divider"},{"type":"footer","includeUnsubscribe":true}]',
    'win_back',
    '["firstName", "domain", "appUrl"]',
    false,
    true,
    'platform'
  )
ON CONFLICT (slug) DO NOTHING;
