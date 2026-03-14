-- Seed Month 3 (Growth, Weeks 9-12) marketing content
BEGIN;

-- ============================================================
-- WEEK 9 — Industry Deep Dives
-- ============================================================

-- Week 9 Twitter/X (7 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('twitter', 'E-commerce accessibility and revenue', 'E-commerce accessibility matters more than you think. If your product images don''t have alt text, screen reader users can''t shop your store. That''s revenue you''re leaving on the table.', 'E-commerce accessibility matters more than you think. If your product images don''t have alt text, screen reader users can''t shop your store. That''s revenue you''re leaving on the table.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Monday', 185),

('twitter', 'Restaurant website audit results', 'We analysed 500 restaurant websites. Average accessibility score: 38/100. Most common issue: menu PDFs that aren''t screen-readable. Your menu should be HTML, not a PDF.', 'We analysed 500 restaurant websites. Average accessibility score: 38/100. Most common issue: menu PDFs that aren''t screen-readable. Your menu should be HTML, not a PDF.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Tuesday', 170),

('twitter', 'Law firm website analysis', 'Law firm websites have the best security scores (avg 79/100) but the worst performance scores (avg 44/100). Heavy images and unoptimised PDFs are the culprits.', 'Law firm websites have the best security scores (avg 79/100) but the worst performance scores (avg 44/100). Heavy images and unoptimised PDFs are the culprits.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Wednesday', 159),

('twitter', 'SaaS accessibility irony', 'SaaS landing pages average 67/100 on SEO but only 51/100 on accessibility. Ironic — the tech industry should be leading on this.', 'SaaS landing pages average 67/100 on SEO but only 51/100 on accessibility. Ironic — the tech industry should be leading on this.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Thursday', 126),

('twitter', 'Accessibility and bounce rates', 'Interesting: e-commerce sites that score 70+ on accessibility have 23% lower bounce rates than those scoring under 50. Accessible design is better design for everyone.', 'Interesting: e-commerce sites that score 70+ on accessibility have 23% lower bounce rates than those scoring under 50. Accessible design is better design for everyone.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Friday', 166),

('twitter', 'Industry benchmarks teaser', 'PagePulser industry benchmarks are coming soon. See how your website stacks up against others in your sector.', 'PagePulser industry benchmarks are coming soon. See how your website stacks up against others in your sector.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Saturday', 106),

('twitter', 'Community industry deep-dive poll', 'What industry should we deep-dive into next? Reply with your sector and we''ll audit 100 sites and share the results.', 'What industry should we deep-dive into next? Reply with your sector and we''ll audit 100 sites and share the results.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Sunday', 115);

-- Week 9 Instagram (7 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('instagram', 'E-Commerce Accessibility Essentials', 'Carousel - "E-commerce Accessibility Essentials" — product images, checkout flow, filters, search.', 'Carousel - "E-commerce Accessibility Essentials" — product images, checkout flow, filters, search.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Monday', 96),

('instagram', 'Restaurant Website Audit: The Data', 'Infographic - "Restaurant Website Audit: The Data" — average scores, top issues, quick fixes.', 'Infographic - "Restaurant Website Audit: The Data" — average scores, top issues, quick fixes.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Tuesday', 93),

('instagram', 'Law Firm Website Analysis', 'Carousel - "Law Firm Website Analysis" — good security, poor performance. What to learn.', 'Carousel - "Law Firm Website Analysis" — good security, poor performance. What to learn.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Wednesday', 88),

('instagram', 'SaaS Website Benchmarks', 'Infographic - "SaaS Website Benchmarks" — how tech companies score across all four dimensions.', 'Infographic - "SaaS Website Benchmarks" — how tech companies score across all four dimensions.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Thursday', 95),

('instagram', 'Accessible Sites Lower Bounce Rates', 'Data graphic - "Accessible sites have 23% lower bounce rates" — the business case for accessibility.', 'Data graphic - "Accessible sites have 23% lower bounce rates" — the business case for accessibility.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Friday', 98),

('instagram', 'Industry Benchmarks Coming Soon', 'Teaser - "Industry benchmarks coming soon" — preview graphic.', 'Teaser - "Industry benchmarks coming soon" — preview graphic.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Saturday', 52),

('instagram', 'What Industry Should We Analyse Next?', 'Interactive story - Poll: "What industry should we analyse next?"', 'Interactive story - Poll: "What industry should we analyse next?"', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Sunday', 55);

-- Week 9 Threads (7 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('threads', 'E-commerce alt text matters', 'If you run an e-commerce store and your product images don''t have alt text, you''re telling blind and low-vision shoppers that your products aren''t for them. Fix this. It takes minutes per product.', 'If you run an e-commerce store and your product images don''t have alt text, you''re telling blind and low-vision shoppers that your products aren''t for them. Fix this. It takes minutes per product.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Monday', 193),

('threads', 'Restaurant website audit data', 'Audited 500 restaurant websites this week. Average accessibility score: 38. The biggest issue? Menus as PDFs. Screen readers can''t read image-based PDFs. Make your menu HTML.', 'Audited 500 restaurant websites this week. Average accessibility score: 38. The biggest issue? Menus as PDFs. Screen readers can''t read image-based PDFs. Make your menu HTML.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Tuesday', 173),

('threads', 'Law firm websites paradox', 'Found something funny: law firm websites have great security (they deal with sensitive client data) but terrible performance. Beautiful hero images that are 5MB each and never compressed.', 'Found something funny: law firm websites have great security (they deal with sensitive client data) but terrible performance. Beautiful hero images that are 5MB each and never compressed.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Wednesday', 185),

('threads', 'SaaS accessibility gap', 'Tech companies should be accessibility leaders but SaaS landing pages average 51/100 on accessibility. Fancy animations and custom components that forgot about keyboard navigation. We can do better.', 'Tech companies should be accessibility leaders but SaaS landing pages average 51/100 on accessibility. Fancy animations and custom components that forgot about keyboard navigation. We can do better.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Thursday', 196),

('threads', 'Accessibility improves bounce rates', 'Data point that might change your mind about accessibility: e-commerce sites scoring 70+ on accessibility have 23% lower bounce rates. Accessible design IS better design. Full stop.', 'Data point that might change your mind about accessibility: e-commerce sites scoring 70+ on accessibility have 23% lower bounce rates. Accessible design IS better design. Full stop.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Friday', 180),

('threads', 'Industry benchmarks in development', 'Building industry benchmarks into PagePulser. Soon you''ll be able to see "your site scores 62, the average in your industry is 54." Context makes scores meaningful.', 'Building industry benchmarks into PagePulser. Soon you''ll be able to see "your site scores 62, the average in your industry is 54." Context makes scores meaningful.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Saturday', 163),

('threads', 'What industry to analyse next', 'What industry should we analyse next? Give me a sector and we''ll audit 100 sites and publish the results. Education? Healthcare? Finance? Hospitality?', 'What industry should we analyse next? Give me a sector and we''ll audit 100 sites and publish the results. Education? Healthcare? Finance? Hospitality?', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Sunday', 151);

-- Week 9 LinkedIn (2 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('linkedin', 'Industry Report: We Audited 500 E-Commerce Websites', 'E-commerce and website accessibility should go hand-in-hand. Your online store is only as good as its ability to serve all customers.

We audited 500 e-commerce sites across fashion, electronics, home goods, and food. Here are the results:

Average scores:
- Accessibility: 42/100
- SEO: 59/100
- Performance: 51/100
- Security: 71/100

Top accessibility issues in e-commerce:
1. Product images without alt text (91% of sites)
2. Filter/sort controls not keyboard accessible (73%)
3. Cart/checkout flow inaccessible to screen readers (68%)
4. Colour-only status indicators (e.g., red = out of stock) (56%)
5. Missing skip navigation links (82%)

The business impact:
Sites scoring 70+ on accessibility showed 23% lower bounce rates and 15% higher average session duration compared to sites scoring below 50.

Accessible e-commerce isn''t charity — it''s good business.

Full report available on our blog. Link in comments.', LEFT('E-commerce and website accessibility should go hand-in-hand. Your online store is only as good as its ability to serve all customers.

We audited 500 e-commerce sites across fashion, electronics, home goods, and food. Here are the results:

Average scores:
- Accessibility: 42/100
- SEO: 59/100
- Performance: 51/100
- Security: 71/100', 280), (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Post 1', 797),

('linkedin', 'The Accessibility-Revenue Connection: Data From 10,000 Audits', 'After two months and tens of thousands of audits, a clear pattern has emerged in our PagePulser data:

Accessible websites perform better across almost every business metric we can correlate:

- Lower bounce rates
- Higher search rankings
- Better Core Web Vitals scores
- More pages per session

This isn''t surprising when you think about it. Accessible design means:
- Clear navigation (good for everyone)
- Proper content structure (good for SEO)
- Readable text (good for engagement)
- Fast, clean code (good for performance)

Accessibility isn''t a cost centre. It''s a revenue driver.', LEFT('After two months and tens of thousands of audits, a clear pattern has emerged in our PagePulser data:

Accessible websites perform better across almost every business metric we can correlate:

- Lower bounce rates
- Higher search rankings
- Better Core Web Vitals scores
- More pages per session', 280), (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Post 2', 536);

-- Week 9 Blog (2 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('other', 'E-Commerce Accessibility: A Complete Guide for Online Retailers', 'Product page accessibility. Checkout flow requirements. Filter and search accessibility. Mobile accessibility for e-commerce. Category: Accessibility', 'Product page accessibility. Checkout flow requirements. Filter and search accessibility. Mobile accessibility for e-commerce. Category: Accessibility', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Article 1', 148),

('other', 'Website Performance Benchmarks by Industry: Where Does Your Site Stand?', 'Performance data across industries. What''s considered good for each sector. Common bottlenecks by industry. Category: Performance', 'Performance data across industries. What''s considered good for each sector. Common bottlenecks by industry. Category: Performance', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 9 - Article 2', 121);


-- ============================================================
-- WEEK 10 — Advanced Features & Power Users
-- ============================================================

-- Week 10 Twitter/X (7 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('twitter', 'PagePulser API launch', 'New: PagePulser API. Integrate website health checks into your CI/CD pipeline. Audit automatically on every deployment. Never ship accessibility regressions again.', 'New: PagePulser API. Integrate website health checks into your CI/CD pipeline. Audit automatically on every deployment. Never ship accessibility regressions again.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Monday', 161),

('twitter', 'Page-level breakdown tip', 'Advanced tip: use PagePulser''s page-level breakdown to find your worst-performing pages. Often it''s one or two pages dragging your whole score down.', 'Advanced tip: use PagePulser''s page-level breakdown to find your worst-performing pages. Often it''s one or two pages dragging your whole score down.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Tuesday', 149),

('twitter', 'WCAG 2.2 coverage', 'WCAG 2.2 added new success criteria including focus appearance, dragging movements, and redundant entry. PagePulser now checks for all of them.', 'WCAG 2.2 added new success criteria including focus appearance, dragging movements, and redundant entry. PagePulser now checks for all of them.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Wednesday', 145),

('twitter', 'Developer-focused findings', 'For developers: PagePulser findings include the specific DOM element, the WCAG criterion, and a code-level fix suggestion. Built for your workflow.', 'For developers: PagePulser findings include the specific DOM element, the WCAG criterion, and a code-level fix suggestion. Built for your workflow.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Thursday', 147),

('twitter', 'Slack integration announcement', 'New integration: connect PagePulser to Slack. Get notified in your team channel when an audit completes or a score drops below your threshold.', 'New integration: connect PagePulser to Slack. Get notified in your team channel when an audit completes or a score drops below your threshold.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Friday', 143),

('twitter', 'Score thresholds pro tip', 'Pro tip: set score thresholds for each category. PagePulser will alert you when any score drops below your minimum. Catch issues before your users do.', 'Pro tip: set score thresholds for each category. PagePulser will alert you when any score drops below your minimum. Catch issues before your users do.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Saturday', 150),

('twitter', 'Feature wishlist request', 'What feature should we build next? Reply with your wishlist. The most requested features get prioritised.', 'What feature should we build next? Reply with your wishlist. The most requested features get prioritised.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Sunday', 102);

-- Week 10 Instagram (7 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('instagram', 'PagePulser API: Audit on Every Deploy', 'Feature graphic - "PagePulser API: Audit on every deploy" — developer-focused, code-style visual.', 'Feature graphic - "PagePulser API: Audit on every deploy" — developer-focused, code-style visual.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Monday', 95),

('instagram', 'Find Your Worst Pages', 'Carousel - "Find Your Worst Pages" — how to use page-level breakdown to focus your efforts.', 'Carousel - "Find Your Worst Pages" — how to use page-level breakdown to focus your efforts.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Tuesday', 92),

('instagram', 'What''s New in WCAG 2.2', 'Infographic - "What''s New in WCAG 2.2" — new criteria explained visually.', 'Infographic - "What''s New in WCAG 2.2" — new criteria explained visually.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Wednesday', 67),

('instagram', 'Developer View: DOM and WCAG Detail', 'Screenshot - Developer view: DOM element, WCAG reference, code suggestion. Show the detail level.', 'Screenshot - Developer view: DOM element, WCAG reference, code suggestion. Show the detail level.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Thursday', 94),

('instagram', 'Slack Integration Live', 'Feature announcement - Slack integration live. "Your website health, in your team chat."', 'Feature announcement - Slack integration live. "Your website health, in your team chat."', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Friday', 87),

('instagram', 'Setting Up Health Thresholds', 'Carousel - "Setting Up Health Thresholds" — walkthrough of the threshold/alerting feature.', 'Carousel - "Setting Up Health Thresholds" — walkthrough of the threshold/alerting feature.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Saturday', 90),

('instagram', 'What Should We Build Next?', 'Interactive - "What should we build next?" — community poll or story questions.', 'Interactive - "What should we build next?" — community poll or story questions.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Sunday', 72);

-- Week 10 Threads (7 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('threads', 'PagePulser API shipped', 'Just shipped the PagePulser API. You can now run audits programmatically. CI/CD integration. Automated testing. Deploy with confidence that you haven''t broken accessibility. This is the one developers have been asking for.', 'Just shipped the PagePulser API. You can now run audits programmatically. CI/CD integration. Automated testing. Deploy with confidence that you haven''t broken accessibility. This is the one developers have been asking for.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Monday', 219),

('threads', 'Page-level breakdown power tip', 'Power user tip: don''t just look at your overall score. Go to the page-level breakdown. Often your homepage is fine but your blog posts or product pages are dragging you down. Fix the outliers first.', 'Power user tip: don''t just look at your overall score. Go to the page-level breakdown. Often your homepage is fine but your blog posts or product pages are dragging you down. Fix the outliers first.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Tuesday', 197),

('threads', 'WCAG 2.2 new criteria deep dive', 'WCAG 2.2 introduced some great new criteria. Focus appearance (2.4.11) is my favourite — it ensures keyboard focus indicators are actually visible. So many sites fail this. PagePulser now checks for all 2.2 criteria.', 'WCAG 2.2 introduced some great new criteria. Focus appearance (2.4.11) is my favourite — it ensures keyboard focus indicators are actually visible. So many sites fail this. PagePulser now checks for all 2.2 criteria.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Wednesday', 214),

('threads', 'Developer workflow integration', 'Developer friends: PagePulser findings now include the specific DOM selector, the WCAG criterion, and a code-level fix suggestion. Copy-paste the fix right into your codebase. We built this for your workflow.', 'Developer friends: PagePulser findings now include the specific DOM selector, the WCAG criterion, and a code-level fix suggestion. Copy-paste the fix right into your codebase. We built this for your workflow.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Thursday', 204),

('threads', 'Slack integration live', 'Slack integration is live. Your team can now get PagePulser notifications right in your Slack channel. Audit complete, score change, threshold alert — all in chat.', 'Slack integration is live. Your team can now get PagePulser notifications right in your Slack channel. Audit complete, score change, threshold alert — all in chat.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Friday', 163),

('threads', 'Health thresholds are underrated', 'Health thresholds are underrated. Set a minimum score for each category. If accessibility drops below 70, you get alerted immediately. Don''t wait for users to complain — catch issues proactively.', 'Health thresholds are underrated. Set a minimum score for each category. If accessibility drops below 70, you get alerted immediately. Don''t wait for users to complain — catch issues proactively.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Saturday', 192),

('threads', 'What should we build next', 'What should we build next? I''m genuinely asking. Reply with features you want and we''ll prioritise based on demand.', 'What should we build next? I''m genuinely asking. Reply with features you want and we''ll prioritise based on demand.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Sunday', 112);

-- Week 10 LinkedIn (2 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('linkedin', 'Introducing the PagePulser API: Website Health in Your CI/CD Pipeline', 'Today we''re launching the PagePulser API, and I''m particularly excited about this one.

For development teams, accessibility often breaks silently. A new feature ships, and nobody notices that a dropdown menu lost keyboard accessibility, or a new image carousel has no alt text.

With the PagePulser API, you can now:

- Run audits on every deployment as part of your CI/CD pipeline
- Set pass/fail thresholds — block deploys that drop your accessibility score
- Track score trends programmatically across sprints
- Integrate with your existing tools — Slack, GitHub, GitLab, Jenkins

This is how accessibility becomes part of the development process, not an afterthought.

Documentation and examples available. Free tier includes API access with rate limits.', LEFT('Today we''re launching the PagePulser API, and I''m particularly excited about this one.

For development teams, accessibility often breaks silently. A new feature ships, and nobody notices that a dropdown menu lost keyboard accessibility, or a new image carousel has no alt text.', 280), (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Post 1', 649),

('linkedin', 'From Reactive to Proactive: The Shift in Website Health Management', 'The old way: wait for complaints, fix issues, repeat.

The new way: monitor continuously, catch issues early, prevent complaints.

This shift — from reactive to proactive — is what PagePulser enables:

- Scheduled audits catch new issues before users report them
- Score thresholds alert you when quality drops
- CI/CD integration prevents accessibility regressions at deploy time
- Trend tracking shows whether you''re improving or degrading

The businesses that win on the web aren''t the ones with the best launch. They''re the ones with the best maintenance.', LEFT('The old way: wait for complaints, fix issues, repeat.

The new way: monitor continuously, catch issues early, prevent complaints.

This shift — from reactive to proactive — is what PagePulser enables:

- Scheduled audits catch new issues before users report them
- Score thresholds alert you when quality drops', 280), (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Post 2', 510);

-- Week 10 Blog (2 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('other', 'Integrating Accessibility Testing into Your CI/CD Pipeline with PagePulser', 'Why automated a11y testing matters. API setup guide. GitHub Actions / GitLab CI examples. Setting meaningful thresholds. Category: Guides', 'Why automated a11y testing matters. API setup guide. GitHub Actions / GitLab CI examples. Setting meaningful thresholds. Category: Guides', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Article 1', 135),

('other', 'WCAG 2.2: What''s New and What It Means for Your Website', 'New success criteria explained. Focus appearance, dragging, redundant entry. How to test for each. Timeline for adoption. Category: Accessibility', 'New success criteria explained. Focus appearance, dragging, redundant entry. How to test for each. Timeline for adoption. Category: Accessibility', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 10 - Article 2', 145);


-- ============================================================
-- WEEK 11 — Community & Thought Leadership
-- ============================================================

-- Week 11 Twitter/X (7 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('twitter', 'Top 10 accessibility checks thread', 'Accessibility is not a checklist. It''s a mindset. But checklists help you get started. Here are the 10 most impactful accessibility checks every website should pass: [thread]', 'Accessibility is not a checklist. It''s a mindset. But checklists help you get started. Here are the 10 most impactful accessibility checks every website should pass: [thread]', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Monday', 170),

('twitter', 'SEO for humans first', 'The #1 mistake businesses make with SEO: optimising for keywords instead of optimising for humans. Write for your audience. Structure for search engines. In that order.', 'The #1 mistake businesses make with SEO: optimising for keywords instead of optimising for humans. Write for your audience. Structure for search engines. In that order.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Tuesday', 166),

('twitter', 'Accessibility as standard hot take', 'Hot take: website accessibility should be as standard as having a mobile-responsive design. We got there with mobile. We can get there with accessibility.', 'Hot take: website accessibility should be as standard as having a mobile-responsive design. We got there with mobile. We can get there with accessibility.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Wednesday', 152),

('twitter', 'Performance budget tip', 'Performance budget tip: set a total page weight budget (e.g., 1.5MB) and a time budget (e.g., 3 seconds). Check every new feature against these budgets. PagePulser tracks both.', 'Performance budget tip: set a total page weight budget (e.g., 1.5MB) and a time budget (e.g., 3 seconds). Check every new feature against these budgets. PagePulser tracks both.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Thursday', 173),

('twitter', 'User success story', 'Proud moment: a PagePulser user just told us they used their audit report to convince their CEO to invest in accessibility. Data drives decisions.', 'Proud moment: a PagePulser user just told us they used their audit report to convince their CEO to invest in accessibility. Data drives decisions.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Friday', 147),

('twitter', 'Magic wand question', 'If you could wave a magic wand and fix one thing about the web, what would it be? For me: every image would have meaningful alt text.', 'If you could wave a magic wand and fix one thing about the web, what would it be? For me: every image would have meaningful alt text.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Saturday', 131),

('twitter', '3 months of PagePulser', 'Grateful for this community. 3 months of PagePulser. Thousands of websites getting healthier. This is just the beginning.', 'Grateful for this community. 3 months of PagePulser. Thousands of websites getting healthier. This is just the beginning.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Sunday', 119);

-- Week 11 Instagram (7 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('instagram', '10 Accessibility Checks Every Website Must Pass', 'Carousel - "10 Accessibility Checks Every Website Must Pass" — visual checklist format.', 'Carousel - "10 Accessibility Checks Every Website Must Pass" — visual checklist format.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Monday', 87),

('instagram', 'Write for Humans Quote', 'Quote graphic - "Write for humans. Structure for search engines." — PagePulser', 'Quote graphic - "Write for humans. Structure for search engines." — PagePulser', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Tuesday', 73),

('instagram', 'The Case for Accessibility as Standard', 'Carousel - "The Case for Accessibility as Standard" — comparison with mobile responsiveness journey.', 'Carousel - "The Case for Accessibility as Standard" — comparison with mobile responsiveness journey.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Wednesday', 96),

('instagram', 'Setting a Performance Budget', 'Infographic - "Setting a Performance Budget" — what to measure, recommended thresholds, how to enforce.', 'Infographic - "Setting a Performance Budget" — what to measure, recommended thresholds, how to enforce.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Thursday', 97),

('instagram', 'User Testimonial: Convincing Leadership', 'Testimonial graphic - User quote about using PagePulser to convince leadership. Clean brand treatment.', 'Testimonial graphic - User quote about using PagePulser to convince leadership. Clean brand treatment.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Friday', 97),

('instagram', 'Fix One Thing About the Web', 'Community question - "If you could fix one thing about the web..." graphic with space for comments.', 'Community question - "If you could fix one thing about the web..." graphic with space for comments.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Saturday', 93),

('instagram', '3-Month Milestone Celebration', '3-month milestone - Celebration graphic with key stats from the journey.', '3-month milestone - Celebration graphic with key stats from the journey.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Sunday', 63);

-- Week 11 Threads (7 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('threads', '10 accessibility checks thread', '10 accessibility checks every website should pass. Thread: 1. Images have alt text 2. Text meets contrast ratios 3. Site is keyboard navigable 4. Headings are hierarchical 5. Forms have labels 6. Links are descriptive 7. Videos have captions 8. Focus indicators are visible 9. Error messages are clear 10. Content is structured semantically', '10 accessibility checks every website should pass. Thread: 1. Images have alt text 2. Text meets contrast ratios 3. Site is keyboard navigable 4. Headings are hierarchical 5. Forms have labels 6. Links are descriptive 7. Videos have captions 8. Focus indicators are visible 9. Er', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Monday', 332),

('threads', 'Best SEO advice', 'The best SEO advice I can give: stop writing for search engines and start writing for the human on the other side of the screen. If your content answers their question clearly, Google will figure out the rest.', 'The best SEO advice I can give: stop writing for search engines and start writing for the human on the other side of the screen. If your content answers their question clearly, Google will figure out the rest.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Tuesday', 206),

('threads', 'Accessibility like mobile responsiveness', 'Remember when we thought mobile-responsive design was optional? "Our customers don''t use phones." Now it''s standard. Accessibility is on the same trajectory. Get ahead of it.', 'Remember when we thought mobile-responsive design was optional? "Our customers don''t use phones." Now it''s standard. Accessibility is on the same trajectory. Get ahead of it.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Wednesday', 172),

('threads', 'Performance budgets changed everything', 'Performance budgets changed how our team thinks about web development. Every new feature gets assessed: "Does this keep us under 1.5MB total and 3-second load time?" If not, optimise or cut.', 'Performance budgets changed how our team thinks about web development. Every new feature gets assessed: "Does this keep us under 1.5MB total and 3-second load time?" If not, optimise or cut.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Thursday', 188),

('threads', 'Data convinced the CEO', 'Got a message today from someone who used their PagePulser report to convince their CEO to invest in accessibility. "The data made it impossible to ignore." This is exactly why we built clear, shareable reports.', 'Got a message today from someone who used their PagePulser report to convince their CEO to invest in accessibility. "The data made it impossible to ignore." This is exactly why we built clear, shareable reports.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Friday', 207),

('threads', 'Fix one thing about the web', 'If I could fix one thing about the web: every image would have meaningful alt text. It''s the simplest fix with the biggest accessibility impact. What would you fix?', 'If I could fix one thing about the web: every image would have meaningful alt text. It''s the simplest fix with the biggest accessibility impact. What would you fix?', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Saturday', 162),

('threads', 'Three months of PagePulser gratitude', 'Three months ago, PagePulser didn''t exist. Today, thousands of websites are healthier because of it. This community, your feedback, your commitment to a better web — you made this happen. Thank you.', 'Three months ago, PagePulser didn''t exist. Today, thousands of websites are healthier because of it. This community, your feedback, your commitment to a better web — you made this happen. Thank you.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Sunday', 197);

-- Week 11 LinkedIn (2 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('linkedin', 'The Accessibility Adoption Curve: Where Are We?', 'Every technology standard follows an adoption curve. Mobile responsiveness went from "nice to have" (2010) to "table stakes" (2016) in about 6 years.

I believe web accessibility is on the same curve, and we''re currently in the early majority phase:

- Innovators (2010-2015): Government and NGO sites adopt WCAG
- Early adopters (2016-2020): Enterprise companies build accessibility teams
- Early majority (2021-2026): SMBs start to care (regulation, awareness, tools like PagePulser)
- Late majority (2027-2030): Accessibility becomes expected, like HTTPS
- Laggards (2030+): Everyone else catches up

We''re in the early majority right now. The European Accessibility Act, growing ADA litigation, and tools that make compliance achievable are driving adoption.

The businesses that act now will have a competitive advantage. The ones that wait will be playing catch-up.

Where is your business on this curve?', LEFT('Every technology standard follows an adoption curve. Mobile responsiveness went from "nice to have" (2010) to "table stakes" (2016) in about 6 years.

I believe web accessibility is on the same curve, and we''re currently in the early majority phase:', 280), (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Post 1', 748),

('linkedin', '3 Months of PagePulser: What the Data Tells Us About Web Health', 'Three months, thousands of audits, millions of data points. Here''s our quarterly review:

Key trends:
- Accessibility awareness is growing: average first-audit scores are slightly higher month over month
- The biggest score jumps come from fixing fundamentals: alt text, contrast, headings
- Regular auditors (weekly+) maintain scores 15-20 points higher than one-time auditors
- Performance is the most-neglected category across all industries

What''s next:
- Industry-specific benchmarks
- Enhanced recommendations engine
- Expanded WCAG 2.2 coverage
- More integrations

Thank you for an incredible first quarter. The web is getting better, one audit at a time.', LEFT('Three months, thousands of audits, millions of data points. Here''s our quarterly review:

Key trends:
- Accessibility awareness is growing: average first-audit scores are slightly higher month over month
- The biggest score jumps come from fixing fundamentals: alt text, contrast, headings', 280), (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Post 2', 614);

-- Week 11 Blog (2 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('other', 'The Business Case for Web Accessibility: Data, ROI, and Real-World Results', 'Revenue impact data. Lawsuit prevention. SEO correlation. Customer satisfaction. Brand perception. Category: Accessibility', 'Revenue impact data. Lawsuit prevention. SEO correlation. Customer satisfaction. Brand perception. Category: Accessibility', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Article 1', 119),

('other', 'PagePulser Q1 Report: The State of Website Health', 'Aggregate data from all audits. Industry breakdowns. Trend analysis. Predictions and roadmap. Category: Product Updates', 'Aggregate data from all audits. Industry breakdowns. Trend analysis. Predictions and roadmap. Category: Product Updates', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 11 - Article 2', 104);


-- ============================================================
-- WEEK 12 — Looking Ahead
-- ============================================================

-- Week 12 Twitter/X (7 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('twitter', 'Q1 wrap and roadmap teaser', 'What a quarter. PagePulser launched, grew, and helped make thousands of websites better. Here''s what''s coming next: [thread with roadmap teaser]', 'What a quarter. PagePulser launched, grew, and helped make thousands of websites better. Here''s what''s coming next: [thread with roadmap teaser]', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Monday', 142),

('twitter', 'WordPress plugin teaser', 'Coming soon: PagePulser for WordPress. A plugin that connects your WP site directly to PagePulser for seamless auditing and monitoring.', 'Coming soon: PagePulser for WordPress. A plugin that connects your WP site directly to PagePulser for seamless auditing and monitoring.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Tuesday', 133),

('twitter', 'Competitor benchmarking teaser', 'Coming soon: competitor benchmarking. See how your website health compares to your direct competitors. (Note: we only scan sites you verify ownership of, or publicly accessible pages with consent.)', 'Coming soon: competitor benchmarking. See how your website health compares to your direct competitors. (Note: we only scan sites you verify ownership of, or publicly accessible pages with consent.)', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Wednesday', 196),

('twitter', 'Foundation for the future', 'The best part about the next quarter: everything we''ve built is a foundation. The features coming will make PagePulser the most comprehensive website health platform out there.', 'The best part about the next quarter: everything we''ve built is a foundation. The features coming will make PagePulser the most comprehensive website health platform out there.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Thursday', 173),

('twitter', 'Free audit CTA', 'If you''ve been on the fence about PagePulser, now''s the time. Run a free audit. See your scores. Fix the quick wins. You''ll wonder why you didn''t do it sooner.', 'If you''ve been on the fence about PagePulser, now''s the time. Run a free audit. See your scores. Fix the quick wins. You''ll wonder why you didn''t do it sooner.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Friday', 157),

('twitter', 'Thank you to day-one supporters', 'To everyone who''s been with us from day one: thank you. Your feedback shaped this product. Your scores inspired us. Your commitment to a better web drives everything we do.', 'To everyone who''s been with us from day one: thank you. Your feedback shaped this product. Your scores inspired us. Your commitment to a better web drives everything we do.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Saturday', 168),

('twitter', 'Q2 kickoff', 'Quarter 1: done. Quarter 2: let''s go. The web is getting better, and PagePulser is here to help. See you next week with new features, new content, and new data.', 'Quarter 1: done. Quarter 2: let''s go. The web is getting better, and PagePulser is here to help. See you next week with new features, new content, and new data.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Sunday', 160);

-- Week 12 Instagram (7 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('instagram', 'Q1 in Review + What''s Coming in Q2', 'Carousel - "Q1 in Review + What''s Coming in Q2" — highlights and roadmap.', 'Carousel - "Q1 in Review + What''s Coming in Q2" — highlights and roadmap.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Monday', 70),

('instagram', 'PagePulser for WordPress Coming Soon', 'Feature teaser - WordPress plugin preview. "PagePulser for WordPress. Coming soon."', 'Feature teaser - WordPress plugin preview. "PagePulser for WordPress. Coming soon."', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Tuesday', 79),

('instagram', 'Q2 Roadmap Visual', 'Infographic - Roadmap visual — features planned for the next quarter.', 'Infographic - Roadmap visual — features planned for the next quarter.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Wednesday', 67),

('instagram', 'The Foundation Is Built', 'Quote graphic - "The foundation is built. Now we''re building the future."', 'Quote graphic - "The foundation is built. Now we''re building the future."', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Thursday', 67),

('instagram', 'Start With a Free Audit CTA', 'CTA graphic - "Haven''t tried PagePulser yet? Start with a free audit." Clean, compelling.', 'CTA graphic - "Haven''t tried PagePulser yet? Start with a free audit." Clean, compelling.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Friday', 86),

('instagram', 'Community Appreciation', 'Community appreciation - Thank you post with user quotes and stats.', 'Community appreciation - Thank you post with user quotes and stats.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Saturday', 62),

('instagram', 'Quarter 2 Starts Now', 'Forward-looking graphic - "Quarter 2 starts now." Energy, momentum, excitement.', 'Forward-looking graphic - "Quarter 2 starts now." Energy, momentum, excitement.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Sunday', 70);

-- Week 12 Threads (7 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('threads', 'Q1 wrap-up reflection', 'Q1 wrap-up. Three months of PagePulser. What started as an idea is now helping thousands of businesses understand their website health. Here''s what''s coming next...', 'Q1 wrap-up. Three months of PagePulser. What started as an idea is now helping thousands of businesses understand their website health. Here''s what''s coming next...', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Monday', 163),

('threads', 'WordPress plugin in development', 'WordPress plugin is in development. If you run WordPress (and 40% of the web does), you''ll soon be able to audit directly from your WP dashboard. No separate login needed.', 'WordPress plugin is in development. If you run WordPress (and 40% of the web does), you''ll soon be able to audit directly from your WP dashboard. No separate login needed.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Tuesday', 170),

('threads', 'Q2 roadmap preview', 'Roadmap for Q2: more integrations, deeper analysis, industry benchmarks, enhanced recommendations. The foundation is solid — now we''re building the features that make PagePulser indispensable.', 'Roadmap for Q2: more integrations, deeper analysis, industry benchmarks, enhanced recommendations. The foundation is solid — now we''re building the features that make PagePulser indispensable.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Wednesday', 189),

('threads', 'V1 is just the beginning', 'The thing about building a product is that v1 is just the beginning. Every audit you run, every piece of feedback you share, every feature request — it all makes PagePulser better. We''re just getting started.', 'The thing about building a product is that v1 is just the beginning. Every audit you run, every piece of feedback you share, every feature request — it all makes PagePulser better. We''re just getting started.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Thursday', 205),

('threads', 'Try PagePulser free audit CTA', 'If you haven''t tried PagePulser yet, what are you waiting for? Free audit. Two minutes. You''ll know your website''s health score. It might surprise you.', 'If you haven''t tried PagePulser yet, what are you waiting for? Free audit. Two minutes. You''ll know your website''s health score. It might surprise you.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Friday', 150),

('threads', 'Thank you to early adopters', 'To the early adopters, the bug reporters, the feature requesters, the score improvers — thank you. You believed in PagePulser before anyone else. That means everything.', 'To the early adopters, the bug reporters, the feature requesters, the score improvers — thank you. You believed in PagePulser before anyone else. That means everything.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Saturday', 165),

('threads', 'Quarter 2 starts tomorrow', 'Quarter 2 starts tomorrow. New features. New content. New data. The web is getting better and we''re not slowing down. Let''s go.', 'Quarter 2 starts tomorrow. New features. New content. New data. The web is getting better and we''re not slowing down. Let''s go.', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Sunday', 124);

-- Week 12 LinkedIn (2 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('linkedin', 'Our Product Roadmap for Q2: What''s Coming to PagePulser', 'Quarter 1 was about launching and proving the concept. Quarter 2 is about depth, integration, and scale.

Here''s what''s on our roadmap:

Integrations:
- WordPress plugin for in-dashboard auditing
- Enhanced CI/CD integrations (GitHub Actions, GitLab CI)
- Expanded Slack notifications

Analysis:
- Industry-specific benchmarks
- Enhanced AI-powered fix recommendations
- Historical trend analysis with insights

Platform:
- Multi-site dashboards for agencies
- Custom branding on PDF reports
- API v2 with expanded endpoints

We''re building PagePulser based on what our users actually need. If there''s something you want to see, let me know in the comments.', LEFT('Quarter 1 was about launching and proving the concept. Quarter 2 is about depth, integration, and scale.

Here''s what''s on our roadmap:

Integrations:
- WordPress plugin for in-dashboard auditing
- Enhanced CI/CD integrations (GitHub Actions, GitLab CI)
- Expanded Slack notifications', 280), (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Post 1', 564),

('linkedin', 'Thank You: Reflections on PagePulser''s First Quarter', 'Three months ago, we launched PagePulser with a simple mission: make website health accessible to everyone.

Today, I can honestly say we''re making progress:

- Thousands of websites audited
- Tens of thousands of issues identified and fixed
- Average user score improvement of 18+ points
- A growing community of people who care about the web

But we''re just getting started. The web still has a long way to go — 96% of sites still have accessibility issues. Performance is declining as pages get heavier. New regulations are raising the bar.

PagePulser will be here, helping businesses keep up.

Thank you for an incredible first quarter. The best is yet to come.', LEFT('Three months ago, we launched PagePulser with a simple mission: make website health accessible to everyone.

Today, I can honestly say we''re making progress:

- Thousands of websites audited
- Tens of thousands of issues identified and fixed
- Average user score improvement of 18+ points', 280), (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Post 2', 567);

-- Week 12 Blog (2 posts)
INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count) VALUES
('other', 'PagePulser Product Roadmap: What''s Coming in Q2 2026', 'Feature previews. Integration announcements. Community-requested features. Category: Product Updates', 'Feature previews. Integration announcements. Community-requested features. Category: Product Updates', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Article 1', 98),

('other', '10 Web Accessibility Trends to Watch in 2026', 'Regulatory landscape. AI and accessibility. Overlay tools controversy. Design system accessibility. Testing automation. Category: Accessibility', 'Regulatory landscape. AI and accessibility. Overlay tools controversy. Design system accessibility. Testing automation. Category: Accessibility', (SELECT id FROM marketing_campaigns WHERE name = 'Growth'), 'draft', 'Week 12 - Article 2', 140);

COMMIT;
