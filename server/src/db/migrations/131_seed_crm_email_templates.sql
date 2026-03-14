-- Migration 054: Seed CRM outreach email templates
-- These are non-system templates used by admins for one-click outreach.

INSERT INTO email_templates (slug, name, description, subject, blocks, category, variables, is_system, is_active, branding_mode)
VALUES
  (
    'welcome_first_audit',
    'Welcome - First Audit Results',
    'Sent after a user completes their first audit',
    'Your first audit results are in, {{firstName}}!',
    '[{"type":"header","companyName":"PagePulser","backgroundColor":"#4f46e5"},{"type":"text","content":"<h2>Welcome to PagePulser, {{firstName}}!</h2><p>Your first audit on <strong>{{domain}}</strong> has been completed. Here''s what we found:</p><ul><li><strong>{{topIssueCount}} issues</strong> identified</li><li>Your scores are ready for review</li></ul><p>The best next step? Review your findings and tackle the critical issues first — they''ll have the biggest impact on your site''s health.</p>","fontSize":"md","align":"left","color":"#333333"},{"type":"button","label":"View Your Results","href":"{{appUrl}}/audits","align":"center"},{"type":"divider"},{"type":"footer","includeUnsubscribe":true}]',
    'onboarding',
    '["firstName", "domain", "topIssueCount", "appUrl"]',
    false,
    true,
    'platform'
  ),
  (
    'verify_domain_howto',
    'Domain Verification Guide',
    'Sent when domain verification is stalled for 48+ hours',
    'Verify {{domain}} in 2 minutes',
    '[{"type":"header","companyName":"PagePulser","backgroundColor":"#4f46e5"},{"type":"text","content":"<h2>Quick tip, {{firstName}}</h2><p>We noticed you haven''t verified <strong>{{domain}}</strong> yet. Verifying your domain unlocks:</p><ul><li>Full audit capabilities</li><li>Team sharing features</li><li>Scheduled recurring audits</li></ul><p>It only takes 2 minutes — just add a DNS TXT record or upload a verification file.</p>","fontSize":"md","align":"left","color":"#333333"},{"type":"button","label":"Verify Now","href":"{{appUrl}}/settings/sites","align":"center"},{"type":"divider"},{"type":"footer","includeUnsubscribe":true}]',
    'onboarding',
    '["firstName", "domain", "appUrl"]',
    false,
    true,
    'platform'
  ),
  (
    'security_alert_dorking',
    'Security Issue Alert',
    'Sent when a critical security issue is found (e.g. exposed admin pages)',
    'Security issue found on {{domain}}',
    '[{"type":"header","companyName":"PagePulser","backgroundColor":"#dc2626"},{"type":"text","content":"<h2>Security Alert, {{firstName}}</h2><p>Our latest audit of <strong>{{domain}}</strong> found <strong>{{issueCount}} security concern(s)</strong> that need attention.</p><p>These findings suggest that sensitive pages or configurations may be publicly accessible. We recommend reviewing and addressing them as soon as possible.</p>","fontSize":"md","align":"left","color":"#333333"},{"type":"button","label":"Review Security Findings","href":"{{appUrl}}/audits","align":"center"},{"type":"divider"},{"type":"footer","includeUnsubscribe":true}]',
    'security',
    '["firstName", "domain", "issueCount", "appUrl"]',
    false,
    true,
    'platform'
  ),
  (
    'upgrade_hitting_limits',
    'Growth Nudge - Hitting Limits',
    'Sent when a user hits their tier limits',
    'You''re growing fast, {{firstName}}',
    '[{"type":"header","companyName":"PagePulser","backgroundColor":"#4f46e5"},{"type":"text","content":"<h2>You''re getting the most out of PagePulser!</h2><p>Hi {{firstName}}, we noticed you''ve reached your <strong>{{limitHit}}</strong> limit on the {{currentTier}} plan.</p><p>That''s a great sign — it means you''re actively monitoring and improving your sites. Upgrading gives you:</p><ul><li>More sites and audits</li><li>Advanced audit types (E-E-A-T, AEO, Schema)</li><li>PDF exports with your branding</li><li>Team collaboration features</li></ul>","fontSize":"md","align":"left","color":"#333333"},{"type":"button","label":"See Upgrade Options","href":"{{appUrl}}/settings/profile","align":"center"},{"type":"divider"},{"type":"footer","includeUnsubscribe":true}]',
    'upgrade',
    '["firstName", "currentTier", "limitHit", "appUrl"]',
    false,
    true,
    'platform'
  ),
  (
    'aeo_improvement_guide',
    'AEO Improvement Guide',
    'Sent when a user has a low AEO score',
    'Boost your AI Engine score on {{domain}}',
    '[{"type":"header","companyName":"PagePulser","backgroundColor":"#4f46e5"},{"type":"text","content":"<h2>Improve Your AI Citability</h2><p>Hi {{firstName}}, your latest audit of <strong>{{domain}}</strong> showed an AEO (AI Engine Optimization) score of <strong>{{aeoScore}}/100</strong>.</p><p>AI engines like ChatGPT and Perplexity are increasingly driving traffic. Here are quick wins to boost your AI citability:</p><ul><li>Add FAQ sections with clear Q&A format</li><li>Use structured data (Schema.org)</li><li>Write concise, authoritative statements</li><li>Include statistics and citations</li></ul>","fontSize":"md","align":"left","color":"#333333"},{"type":"button","label":"View Full Analysis","href":"{{appUrl}}/audits","align":"center"},{"type":"divider"},{"type":"footer","includeUnsubscribe":true}]',
    'educational',
    '["firstName", "domain", "aeoScore", "appUrl"]',
    false,
    true,
    'platform'
  ),
  (
    'win_back_inactive',
    'Win Back - Inactive User',
    'Sent to users who haven''t logged in for 14+ days',
    'We miss you, {{firstName}}',
    '[{"type":"header","companyName":"PagePulser","backgroundColor":"#4f46e5"},{"type":"text","content":"<h2>Your sites miss you too</h2><p>Hi {{firstName}}, it''s been a while since you checked in on <strong>{{domain}}</strong>.</p><p>A lot can change in a few weeks — new broken links, expiring SSL certificates, or fresh SEO opportunities. Why not run a quick audit to see where things stand?</p><p>Your last audit was on <strong>{{lastAuditDate}}</strong>.</p>","fontSize":"md","align":"left","color":"#333333"},{"type":"button","label":"Run a New Audit","href":"{{appUrl}}/audits/new","align":"center"},{"type":"divider"},{"type":"footer","includeUnsubscribe":true}]',
    'win_back',
    '["firstName", "domain", "lastAuditDate", "appUrl"]',
    false,
    true,
    'platform'
  ),
  (
    'score_celebration',
    'Score Improvement Celebration',
    'Sent when a category score improves by 20+ points',
    '{{domain}} just hit {{score}} in {{category}}!',
    '[{"type":"header","companyName":"PagePulser","backgroundColor":"#059669"},{"type":"text","content":"<h2>Congratulations, {{firstName}}! 🎉</h2><p>Great news — <strong>{{domain}}</strong> just scored <strong>{{score}}/100</strong> in <strong>{{category}}</strong>! That''s a significant improvement.</p><p>Your hard work on site quality is paying off. Keep up the momentum by tackling the next set of findings.</p>","fontSize":"md","align":"left","color":"#333333"},{"type":"button","label":"See Your Scores","href":"{{appUrl}}/audits","align":"center"},{"type":"divider"},{"type":"footer","includeUnsubscribe":true}]',
    'engagement',
    '["firstName", "domain", "category", "score", "appUrl"]',
    false,
    true,
    'platform'
  )
ON CONFLICT (slug) DO NOTHING;
