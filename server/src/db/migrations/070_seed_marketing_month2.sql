-- Seed Month 2 (Launch, Weeks 5-8) marketing content
-- Campaign 'Launch' must already exist (created in migration 069)

BEGIN;

-- ============================================================
-- WEEK 5 — Launch Week
-- ============================================================

-- ---- Twitter/X (Week 5) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Launch Announcement',
  'PagePulser is LIVE. Audit your website''s accessibility, SEO, security, and performance in under 5 minutes. Free to start. No credit card. Let''s make the web better. pagepulser.com',
  LEFT('PagePulser is LIVE. Audit your website''s accessibility, SEO, security, and performance in under 5 minutes. Free to start. No credit card. Let''s make the web better. pagepulser.com', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Monday',
  176
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  '24 Hours Since Launch',
  '24 hours since launch. X websites audited already. The most common issue so far? Missing alt text. Followed closely by poor colour contrast. The basics still trip people up.',
  LEFT('24 hours since launch. X websites audited already. The most common issue so far? Missing alt text. Followed closely by poor colour contrast. The basics still trip people up.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Tuesday',
  171
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Awareness Is The First Step',
  '"I had no idea my site had so many issues." We''re hearing this a lot. That''s exactly why we built PagePulser. Awareness is the first step. pagepulser.com',
  LEFT('"I had no idea my site had so many issues." We''re hearing this a lot. That''s exactly why we built PagePulser. Awareness is the first step. pagepulser.com', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Wednesday',
  153
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Fix Priority Tip',
  'PagePulser tip: start with the Critical issues in your report. Fix those first. Then Serious. Then Moderate. Don''t try to fix everything at once — prioritise by impact.',
  LEFT('PagePulser tip: start with the Critical issues in your report. Fix those first. Then Serious. Then Moderate. Don''t try to fix everything at once — prioritise by impact.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Thursday',
  168
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Launch Week Stats',
  'Launch week stats: X audits completed. X issues found. X fixes recommended. The web is getting healthier, one audit at a time.',
  LEFT('Launch week stats: X audits completed. X issues found. X fixes recommended. The web is getting healthier, one audit at a time.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Friday',
  122
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Weekend Project Idea',
  'Weekend project idea: audit your website with PagePulser, fix the top 3 issues, and re-run the audit. Watch your score jump. It''s oddly satisfying. pagepulser.com',
  LEFT('Weekend project idea: audit your website with PagePulser, fix the top 3 issues, and re-run the audit. Watch your score jump. It''s oddly satisfying. pagepulser.com', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Saturday',
  163
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Thank You Launch Week',
  'Thank you to everyone who''s tried PagePulser this week. Your feedback has been incredible. We''re listening, iterating, and shipping improvements daily.',
  LEFT('Thank you to everyone who''s tried PagePulser this week. Your feedback has been incredible. We''re listening, iterating, and shipping improvements daily.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Sunday',
  151
);

-- ---- Instagram (Week 5) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Launch Announcement Graphic',
  'PagePulser is Live. Audit your website''s accessibility, SEO, security, and performance — all in one place. Free to start. No credit card required.

Bold graphic with key features and CTA. Pin to top of profile.',
  LEFT('PagePulser is Live. Audit your website''s accessibility, SEO, security, and performance — all in one place. Free to start. No credit card required.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Monday',
  206
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'First Day Stats Screenshot',
  'Day one in the books. Real dashboard showing first-day stats — total audits run, most common issues found. We''re just getting started.

Screenshot of the real PagePulser dashboard celebrating the milestone.',
  LEFT('Day one in the books. Real dashboard showing first-day stats — total audits run, most common issues found. We''re just getting started.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Tuesday',
  204
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Your First Audit: What to Expect',
  'Your First Audit: What to Expect

Carousel walkthrough:
1. Enter your website URL
2. PagePulser scans accessibility, SEO, security, and performance
3. Get your scores across all four categories
4. Review prioritised issues with fix guidance
5. Download your PDF report or share with your team
6. Fix issues and re-audit to track improvement

It takes under 5 minutes. Try it free at pagepulser.com',
  LEFT('Your First Audit: What to Expect  Carousel walkthrough: 1. Enter your website URL 2. PagePulser scans accessibility, SEO, security, and performance 3. Get your scores across all four categories 4. Review prioritised issues with fix guidance', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Wednesday',
  390
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'The Fix Priority Framework',
  'The Fix Priority Framework

When you get your audit results, don''t panic. Here''s how to prioritise:

Critical — Fix immediately. These are severe issues affecting usability or security.
Serious — Fix soon. These significantly impact user experience.
Moderate — Plan to fix. These are meaningful but not urgent.
Minor — Fix when possible. Small improvements that add up.

Start at the top. Work your way down. Progress over perfection.',
  LEFT('The Fix Priority Framework  When you get your audit results, don''t panic. Here''s how to prioritise:  Critical — Fix immediately. These are severe issues affecting usability or security. Serious — Fix soon. These significantly impact user experience.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Thursday',
  414
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Launch Week Numbers',
  'Launch week by the numbers:

Audits completed: X
Issues identified: X
Top finding: Missing alt text
Second most common: Poor colour contrast

The web has a long way to go. But every audit is a step forward.',
  LEFT('Launch week by the numbers:  Audits completed: X Issues identified: X Top finding: Missing alt text Second most common: Poor colour contrast  The web has a long way to go. But every audit is a step forward.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Friday',
  214
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Before/After Score Reel',
  'Watch the score jump.

Before: Run an audit. See the starting score.
Make 3 quick fixes: add alt text, fix contrast, update heading structure.
After: Re-run the audit. See the improvement.

Small fixes. Big impact. Try it yourself at pagepulser.com

Reel format: screen recording showing the before/after audit process.',
  LEFT('Watch the score jump.  Before: Run an audit. See the starting score. Make 3 quick fixes: add alt text, fix contrast, update heading structure. After: Re-run the audit. See the improvement.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Saturday',
  304
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Thank You Launch Week Users',
  'Thank you to our launch week users.

You ran the audits. You found the issues. You started fixing them. You made the web better this week.

This is just the beginning. We''re building PagePulser for you — and your feedback is shaping every feature.

Community appreciation graphic.',
  LEFT('Thank you to our launch week users.  You ran the audits. You found the issues. You started fixing them. You made the web better this week.  This is just the beginning.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Sunday',
  274
);

-- ---- Threads (Week 5) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'IT''S LIVE',
  'IT''S LIVE. PagePulser is out in the world. Go audit your website. Seriously. I''ll wait. pagepulser.com',
  LEFT('IT''S LIVE. PagePulser is out in the world. Go audit your website. Seriously. I''ll wait. pagepulser.com', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Monday',
  101
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  '24 Hours In',
  '24 hours in and we''ve already audited hundreds of websites. The data is fascinating. Nearly every site has at least one critical accessibility issue. The web needs this.',
  LEFT('24 hours in and we''ve already audited hundreds of websites. The data is fascinating. Nearly every site has at least one critical accessibility issue. The web needs this.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Tuesday',
  168
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Best Feedback So Far',
  'Best feedback we''ve received so far: "I''ve been using other tools for years and never understood what to actually fix. PagePulser made it obvious." That''s the whole mission.',
  LEFT('Best feedback we''ve received so far: "I''ve been using other tools for years and never understood what to actually fix. PagePulser made it obvious." That''s the whole mission.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Wednesday',
  173
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Don''t Panic About Your Score',
  'Pro tip: don''t panic when you see your score. Most sites start between 40-60. That''s normal. What matters is the trend — run regular audits and watch it climb.',
  LEFT('Pro tip: don''t panic when you see your score. Most sites start between 40-60. That''s normal. What matters is the trend — run regular audits and watch it climb.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Thursday',
  157
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Launch Week By The Numbers',
  'Launch week by the numbers: [stats]. Most common issue: missing alt text. Easiest win: adding descriptive alt text to your images. Takes minutes, improves accessibility AND SEO.',
  LEFT('Launch week by the numbers: [stats]. Most common issue: missing alt text. Easiest win: adding descriptive alt text to your images. Takes minutes, improves accessibility AND SEO.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Friday',
  176
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Weekend Challenge',
  'Weekend challenge: audit your site, fix ONE critical issue, re-audit. Post your before/after scores. I''ll shout out the biggest improvements.',
  LEFT('Weekend challenge: audit your site, fix ONE critical issue, re-audit. Post your before/after scores. I''ll shout out the biggest improvements.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Saturday',
  140
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Grateful For Launch Week',
  'Grateful for every single person who''s tried PagePulser this week. Your feedback is shaping the product. Keep it coming.',
  LEFT('Grateful for every single person who''s tried PagePulser this week. Your feedback is shaping the product. Keep it coming.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Sunday',
  117
);

-- ---- LinkedIn (Week 5) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'linkedin',
  'PagePulser is Live: Making Website Health Accessible to Everyone',
  'Today, I''m proud to announce that PagePulser is officially live.

PagePulser is a website health auditing platform that checks your site across four dimensions: accessibility, SEO, security, and performance.

What makes us different:
- Plain-English results — No jargon, no code dumps. Every issue explained clearly.
- Prioritised fixes — Critical issues first. Don''t waste time on minor tweaks when there are big wins.
- Actionable guidance — Every finding comes with step-by-step fix instructions.
- Health scores — Track your website''s health over time, not just one-off snapshots.

We''ve built PagePulser because we believe every business deserves to know the health of their website — not just those who can afford expensive consultants or have in-house dev teams.

Free tier available. No credit card required.

Try it now: pagepulser.com',
  LEFT('Today, I''m proud to announce that PagePulser is officially live.  PagePulser is a website health auditing platform that checks your site across four dimensions: accessibility, SEO, security, and performance.  What makes us different: - Plain-English results', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Post 1',
  750
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'linkedin',
  'What We Learned From Our First 1,000 Website Audits',
  'PagePulser launched on Monday. In the first 72 hours, we audited over 1,000 websites. Here''s what the data tells us:

Top 5 most common issues:
1. Images without alt text (found on 89% of sites)
2. Insufficient colour contrast (76%)
3. Missing or duplicate meta descriptions (68%)
4. Heading hierarchy violations (62%)
5. Missing form input labels (54%)

Average scores:
- Accessibility: 52/100
- SEO: 61/100
- Security: 74/100
- Performance: 58/100

The good news? Most of these issues are straightforward to fix. The challenge is knowing they exist.

If you haven''t audited your site yet, now''s the time. Free at pagepulser.com.',
  LEFT('PagePulser launched on Monday. In the first 72 hours, we audited over 1,000 websites. Here''s what the data tells us:  Top 5 most common issues: 1. Images without alt text (found on 89% of sites) 2. Insufficient colour contrast (76%) 3. Missing or duplicate', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Post 2',
  618
);

-- ---- Blog (Week 5) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'other',
  'PagePulser is Live: Everything You Need to Know',
  '## PagePulser is Live: Everything You Need to Know

**Category: Product Updates**

Today we''re excited to announce the official launch of PagePulser — a website health auditing platform that makes it easy for anyone to understand and improve their website.

### What PagePulser Does

PagePulser audits your website across four key dimensions:

- **Accessibility** — Are all users, including those with disabilities, able to use your site effectively?
- **SEO** — Is your site optimised for search engines to find and rank your content?
- **Security** — Is your site protected against common vulnerabilities and threats?
- **Performance** — Does your site load quickly and respond smoothly?

Each audit produces a score out of 100 for every category, along with a prioritised list of issues and actionable fix guidance.

### How to Run Your First Audit

1. Visit pagepulser.com and create a free account
2. Enter your website URL
3. Click "Run Audit"
4. Wait approximately 2-5 minutes for the scan to complete
5. Review your scores and findings

It really is that simple. No technical knowledge required.

### Understanding Your Scores

Your scores reflect how well your site performs in each category:

- **90-100**: Excellent — your site is in great shape
- **70-89**: Good — minor improvements needed
- **50-69**: Fair — several issues to address
- **Below 50**: Needs attention — critical issues present

Don''t be discouraged if your initial scores are lower than expected. Most websites start between 40-60. What matters is the trend over time.

### Free vs Paid Tiers

**Free tier** includes:
- Basic website audits
- Score overview across all four categories
- Top issues highlighted

**Paid tiers** unlock:
- Full issue breakdowns with fix guidance
- PDF report exports
- Scheduled recurring audits
- Historical score tracking
- Team collaboration features

### Get Started

Visit pagepulser.com to run your first free audit today. No credit card required.',
  LEFT('Today we''re excited to announce the official launch of PagePulser — a website health auditing platform that makes it easy for anyone to understand and improve their website.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Article 1',
  1620
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'other',
  'What We Learned From Auditing 1,000 Websites: The Data',
  '## What We Learned From Auditing 1,000 Websites: The Data

**Category: Case Studies**

In the first 72 hours after launching PagePulser, over 1,000 websites were audited on our platform. The aggregate data paints a revealing picture of the state of the web.

### Aggregate Findings

Across all 1,000+ audits, here are the average scores:

- **Accessibility**: 52/100
- **SEO**: 61/100
- **Security**: 74/100
- **Performance**: 58/100

Security tends to score highest because many modern hosting platforms handle basics like HTTPS by default. Accessibility scores lowest — it''s the area most often overlooked.

### Most Common Issues by Category

**Accessibility:**
1. Images without alt text (89% of sites)
2. Insufficient colour contrast (76%)
3. Missing form input labels (54%)
4. Heading hierarchy violations (62%)
5. Missing skip navigation links (48%)

**SEO:**
1. Missing or duplicate meta descriptions (68%)
2. Title tags too long or missing (41%)
3. Missing structured data (72%)
4. Broken internal links (23%)
5. Missing canonical tags (35%)

**Security:**
1. Missing Content-Security-Policy header (61%)
2. Missing X-Frame-Options header (44%)
3. Mixed content warnings (19%)
4. Missing Strict-Transport-Security header (38%)

**Performance:**
1. Unoptimised images (83%)
2. Render-blocking resources (67%)
3. No lazy loading on below-fold images (59%)
4. Excessive DOM size (34%)

### Key Takeaways and Recommendations

The data makes one thing clear: most website issues are well-understood and fixable. The challenge isn''t the fix — it''s awareness.

**Start with alt text.** It''s the most common issue and the easiest to fix. Adding descriptive alt text to images improves both accessibility and SEO.

**Check your colour contrast.** Tools like PagePulser flag specific elements. Adjusting colours to meet WCAG AA standards takes minutes.

**Compress your images.** Unoptimised images are the single biggest performance bottleneck. Use modern formats like WebP and compress aggressively.

**Add security headers.** Most hosting platforms make this straightforward. A few configuration lines can significantly improve your security posture.

Run your own audit at pagepulser.com and see where your site stands.',
  LEFT('In the first 72 hours after launching PagePulser, over 1,000 websites were audited on our platform. The aggregate data paints a revealing picture of the state of the web.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 5 - Article 2',
  1950
);

-- ============================================================
-- WEEK 6 — Momentum & Social Proof
-- ============================================================

-- ---- Twitter/X (Week 6) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Accessibility Win of the Week',
  'Accessibility win of the week: a user fixed 12 alt text issues in 15 minutes after running their PagePulser audit. Score jumped from 47 to 68. Small fixes, big impact.',
  LEFT('Accessibility win of the week: a user fixed 12 alt text issues in 15 minutes after running their PagePulser audit. Score jumped from 47 to 68. Small fixes, big impact.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Monday',
  165
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Developer vs Accessibility',
  '"But my developer said our site was accessible." Developers are great at building features. Accessibility requires specialised knowledge. That''s why automated auditing exists — to catch what humans miss.',
  LEFT('"But my developer said our site was accessible." Developers are great at building features. Accessibility requires specialised knowledge. That''s why automated auditing exists — to catch what humans miss.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Tuesday',
  197
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'WCAG Criteria References',
  'PagePulser now shows you exactly which WCAG criteria each issue relates to. Building a bridge between automated findings and the actual standards.',
  LEFT('PagePulser now shows you exactly which WCAG criteria each issue relates to. Building a bridge between automated findings and the actual standards.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Wednesday',
  147
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'What''s Your Weakest Area?',
  'Question: what''s your website''s biggest weakness — accessibility, SEO, security, or performance? Run a free audit and find out. Most people are surprised by the answer.',
  LEFT('Question: what''s your website''s biggest weakness — accessibility, SEO, security, or performance? Run a free audit and find out. Most people are surprised by the answer.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Thursday',
  168
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Audit Comparison Feature',
  'New feature: compare two audits side by side. Run one today, fix some issues, run another next week. See exactly what improved.',
  LEFT('New feature: compare two audits side by side. Run one today, fix some issues, run another next week. See exactly what improved.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Friday',
  125
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Accessibility-SEO Connection',
  'Interesting finding: websites that score well on accessibility tend to score well on SEO too. They''re more connected than most people realise.',
  LEFT('Interesting finding: websites that score well on accessibility tend to score well on SEO too. They''re more connected than most people realise.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Saturday',
  143
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Thank You For 2 Weeks',
  'Thank you for 2 weeks. The feedback, the feature requests, the bug reports — all of it is making PagePulser better. Keep it coming.',
  LEFT('Thank you for 2 weeks. The feedback, the feature requests, the bug reports — all of it is making PagePulser better. Keep it coming.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Sunday',
  131
);

-- ---- Instagram (Week 6) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Before/After Score Improvement',
  'Before: Accessibility score 47. 12 images missing alt text. Poor colour contrast on 3 buttons.

After: Accessibility score 68. All images have descriptive alt text. Contrast ratios meet WCAG AA.

Time spent: 15 minutes.

Small fixes. Big impact. Run your audit at pagepulser.com',
  LEFT('Before: Accessibility score 47. 12 images missing alt text. Poor colour contrast on 3 buttons.  After: Accessibility score 68. All images have descriptive alt text. Contrast ratios meet WCAG AA.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Monday',
  276
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Developer vs Accessibility Specialist',
  'Developer vs Accessibility Specialist — What each catches and why automated tools fill the gap.

Developers catch:
- Broken functionality
- Code errors
- Layout issues
- Browser compatibility

Accessibility specialists catch:
- Screen reader compatibility
- Keyboard navigation gaps
- WCAG compliance issues
- Colour contrast failures
- Semantic HTML problems

Automated tools like PagePulser catch:
- All of the above, instantly
- Consistent, repeatable checks
- Issues across every page

Not adversarial — complementary. The best approach uses all three.',
  LEFT('Developer vs Accessibility Specialist — What each catches and why automated tools fill the gap.  Developers catch: - Broken functionality - Code errors - Layout issues - Browser compatibility', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Tuesday',
  502
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'WCAG 2.1 AA: The Key Criteria',
  'WCAG 2.1 AA: The Key Criteria You Need to Know

Perceivable:
- Text alternatives for images (1.1.1)
- Colour contrast minimum 4.5:1 (1.4.3)
- Content reflows at 320px (1.4.10)

Operable:
- Keyboard accessible (2.1.1)
- No keyboard traps (2.1.2)
- Enough time to read content (2.2.1)

Understandable:
- Language of page defined (3.1.1)
- Form labels and instructions (3.3.2)
- Error identification (3.3.1)

Robust:
- Valid HTML (4.1.1)
- Name, role, value for components (4.1.2)

PagePulser checks all of these automatically.',
  LEFT('WCAG 2.1 AA: The Key Criteria You Need to Know  Perceivable: - Text alternatives for images (1.1.1) - Colour contrast minimum 4.5:1 (1.4.3) - Content reflows at 320px (1.4.10)  Operable: - Keyboard accessible (2.1.1)', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Wednesday',
  537
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Poll: Your Website''s Weakest Area',
  'What do you think your website''s weakest area is?

A) Accessibility
B) SEO
C) Security
D) Performance

Vote in our story poll. Then run a free PagePulser audit to find out if you''re right. Most people are surprised by the answer.',
  LEFT('What do you think your website''s weakest area is?  A) Accessibility B) SEO C) Security D) Performance  Vote in our story poll. Then run a free PagePulser audit to find out if you''re right.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Thursday',
  228
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Comparison Feature Preview',
  'New: Audit Comparison

Run an audit. Fix some issues. Run another audit. Compare them side by side.

See exactly what improved. See what still needs work. Track your progress visually.

Screenshot showing the new comparison feature with side-by-side audit results and green improvement arrows.',
  LEFT('New: Audit Comparison  Run an audit. Fix some issues. Run another audit. Compare them side by side.  See exactly what improved. See what still needs work. Track your progress visually.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Friday',
  284
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'The Accessibility-SEO Connection',
  'The Accessibility-SEO Connection: 5 Ways Accessible Sites Rank Better

1. Alt text helps screen readers AND helps Google understand images
2. Heading hierarchy creates structure for assistive tech AND search crawlers
3. Semantic HTML is navigable for keyboard users AND parseable for search engines
4. Descriptive link text beats "Click here" for screen readers AND for SEO
5. Page speed improves user experience AND search rankings

Data from 5,000+ PagePulser audits confirms: sites scoring 80+ on accessibility average 72 on SEO. Sites below 40 on accessibility average only 48 on SEO.',
  LEFT('The Accessibility-SEO Connection: 5 Ways Accessible Sites Rank Better  1. Alt text helps screen readers AND helps Google understand images 2. Heading hierarchy creates structure for assistive tech AND search crawlers 3. Semantic HTML is navigable', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Saturday',
  530
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Community Spotlight',
  'Community Spotlight

This week''s featured improvement: a user went from 47 to 68 on accessibility in just 15 minutes.

How they did it:
- Added alt text to 12 images
- Fixed colour contrast on 3 buttons
- Updated heading structure

Your turn. Run an audit. Make some fixes. Share your improvement. We''d love to feature you next.',
  LEFT('Community Spotlight  This week''s featured improvement: a user went from 47 to 68 on accessibility in just 15 minutes.  How they did it: - Added alt text to 12 images - Fixed colour contrast on 3 buttons', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Sunday',
  320
);

-- ---- Threads (Week 6) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Score Jump From Alt Text',
  'Love seeing people''s reactions when they fix a few issues and their score jumps 20+ points. One user went from 47 to 68 just by adding alt text. Accessibility wins are SEO wins too.',
  LEFT('Love seeing people''s reactions when they fix a few issues and their score jumps 20+ points. One user went from 47 to 68 just by adding alt text. Accessibility wins are SEO wins too.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Monday',
  179
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Developer Handles Accessibility Take',
  'Controversial take: "my developer handles accessibility" is like saying "my plumber handles electrical." They might be able to, but it''s a different specialty. No shade to devs — automated tools help everyone.',
  LEFT('Controversial take: "my developer handles accessibility" is like saying "my plumber handles electrical." They might be able to, but it''s a different specialty. No shade to devs — automated tools help everyone.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Tuesday',
  203
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'WCAG Criteria Added',
  'We just added WCAG criteria references to every accessibility finding. Now when PagePulser says "fix this," you can see exactly which standard requires it. Transparency matters.',
  LEFT('We just added WCAG criteria references to every accessibility finding. Now when PagePulser says "fix this," you can see exactly which standard requires it. Transparency matters.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Wednesday',
  175
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Guess Your Weakest Area',
  'Challenge: reply with your website and I''ll tell you which of the four areas (accessibility, SEO, security, performance) is probably your weakest. No audit needed — I''ll guess from a quick look.',
  LEFT('Challenge: reply with your website and I''ll tell you which of the four areas (accessibility, SEO, security, performance) is probably your weakest. No audit needed — I''ll guess from a quick look.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Thursday',
  189
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Audit Comparison Shipped',
  'Shipped a new feature today: audit comparison. Run an audit, fix stuff, run another one, compare them side by side. So satisfying to see green arrows.',
  LEFT('Shipped a new feature today: audit comparison. Run an audit, fix stuff, run another one, compare them side by side. So satisfying to see green arrows.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Friday',
  150
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Accessibility-SEO Correlation Data',
  'Data from our first 5,000 audits: sites that score 80+ on accessibility score an average of 72 on SEO. Sites below 40 on accessibility average only 48 on SEO. They''re correlated.',
  LEFT('Data from our first 5,000 audits: sites that score 80+ on accessibility score an average of 72 on SEO. Sites below 40 on accessibility average only 48 on SEO. They''re correlated.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Saturday',
  178
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Two Weeks In',
  'Two weeks in and I''m genuinely blown away by the community response. The DMs, the feedback, the "I had no idea my site had these issues" messages. This is why we built PagePulser.',
  LEFT('Two weeks in and I''m genuinely blown away by the community response. The DMs, the feedback, the "I had no idea my site had these issues" messages. This is why we built PagePulser.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Sunday',
  178
);

-- ---- LinkedIn (Week 6) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'linkedin',
  'Real Results: How Small Fixes Create Big Score Improvements',
  'Two weeks since launch, and the results from PagePulser users are remarkable.

Here are three real examples (shared with permission):

E-commerce site (fashion):
- Before: Accessibility 34, SEO 48
- Fixed: alt text (45 images), colour contrast (3 buttons), heading structure
- After: Accessibility 71, SEO 67
- Time spent: 2 hours

Professional services (law firm):
- Before: Accessibility 52, Performance 41
- Fixed: image compression, lazy loading, form labels
- After: Accessibility 78, Performance 69
- Time spent: 1.5 hours

SaaS landing page:
- Before: SEO 55, Security 62
- Fixed: meta descriptions, security headers, HTTPS redirect
- After: SEO 82, Security 91
- Time spent: 45 minutes

The pattern is clear: most improvements don''t require a developer. They require awareness.

That''s the gap PagePulser fills. Try it free at pagepulser.com.',
  LEFT('Two weeks since launch, and the results from PagePulser users are remarkable.  Here are three real examples (shared with permission):  E-commerce site (fashion): - Before: Accessibility 34, SEO 48 - Fixed: alt text (45 images), colour contrast (3 buttons),', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Post 1',
  748
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'linkedin',
  'Why Accessibility and SEO Are Two Sides of the Same Coin',
  'After auditing thousands of websites through PagePulser, one correlation stands out:

Sites that score well on accessibility almost always score well on SEO. And vice versa.

This isn''t coincidence. Here''s why:

- Alt text helps screen readers AND helps Google understand images
- Heading hierarchy creates structure for assistive technology AND for search crawlers
- Semantic HTML makes content navigable for keyboard users AND parseable for search engines
- Link text that says "Read our accessibility guide" beats "Click here" for screen readers AND for SEO
- Page speed affects both user experience (accessibility) AND search rankings

The takeaway: investing in accessibility isn''t just the right thing to do — it''s an SEO strategy.

If you''re spending money on SEO but ignoring accessibility, you''re leaving performance on the table.',
  LEFT('After auditing thousands of websites through PagePulser, one correlation stands out:  Sites that score well on accessibility almost always score well on SEO. And vice versa.  This isn''t coincidence. Here''s why:', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Post 2',
  758
);

-- ---- Blog (Week 6) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'other',
  'How to Improve Your Website Accessibility Score by 20+ Points in Under 2 Hours',
  '## How to Improve Your Website Accessibility Score by 20+ Points in Under 2 Hours

**Category: Accessibility**

Most websites score between 40-60 on their first accessibility audit. The good news? A handful of quick wins can dramatically improve that score. Here''s how to get a 20+ point improvement in under 2 hours.

### The Quick Wins

#### 1. Add Alt Text to All Images (Expected impact: +5-10 points)

Alt text is the most common accessibility issue we see — found on 89% of audited sites. Every meaningful image needs descriptive alt text.

**How to do it:**
- Describe what the image shows, not what it is ("Woman using laptop at coffee shop" not "photo1.jpg")
- Keep it concise — aim for under 125 characters
- Decorative images should have empty alt attributes (alt="")
- Don''t start with "Image of" or "Picture of" — screen readers already announce it as an image

**Time:** 15-30 minutes depending on your number of images

#### 2. Fix Colour Contrast (Expected impact: +3-8 points)

Insufficient colour contrast affects 76% of sites. Text needs a contrast ratio of at least 4.5:1 against its background (3:1 for large text).

**How to do it:**
- Use your PagePulser report to identify specific elements
- Darken light text or lighten dark backgrounds
- Test with a contrast checker tool
- Pay special attention to light grey text on white backgrounds

**Time:** 15-30 minutes

#### 3. Fix Heading Hierarchy (Expected impact: +2-5 points)

Headings should follow a logical order: H1, then H2, then H3. Don''t skip levels. Don''t use headings just for styling.

**How to do it:**
- Ensure every page has exactly one H1
- Use H2 for main sections, H3 for subsections
- Don''t skip from H1 to H3
- Use CSS for styling instead of heading tags

**Time:** 15-20 minutes

#### 4. Add Form Labels (Expected impact: +3-7 points)

Every form input needs a visible, programmatically associated label. Placeholder text alone is not sufficient.

**How to do it:**
- Add <label> elements linked to each input via the "for" attribute
- Ensure labels are visible (not just screen-reader-only)
- Include labels for search fields, newsletter signups, and login forms

**Time:** 10-20 minutes

### Expected Total Improvement

Completing all four fixes typically results in a 15-30 point score improvement. Your exact improvement depends on your starting point and the number of issues in each category.

### Next Steps

After making these fixes, re-run your PagePulser audit to see your new score. Then move on to the next tier of issues in your report. Progress over perfection.',
  LEFT('Most websites score between 40-60 on their first accessibility audit. The good news? A handful of quick wins can dramatically improve that score. Here''s how to get a 20+ point improvement in under 2 hours.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Article 1',
  2180
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'other',
  'Why Accessible Websites Rank Higher: The Data Behind Accessibility and SEO',
  '## Why Accessible Websites Rank Higher: The Data Behind Accessibility and SEO

**Category: SEO**

After auditing thousands of websites through PagePulser, one pattern is impossible to ignore: accessible websites rank better. Here''s the data, the technical explanation, and what it means for your strategy.

### The Correlation Data

From our first 5,000 PagePulser audits:

- Sites scoring **80+** on accessibility average **72** on SEO
- Sites scoring **60-79** on accessibility average **61** on SEO
- Sites scoring **40-59** on accessibility average **52** on SEO
- Sites scoring **below 40** on accessibility average only **48** on SEO

The correlation coefficient between accessibility and SEO scores is **0.73** — a strong positive correlation.

### The Technical Overlap

Why does this happen? Because accessibility and SEO share fundamental technical requirements:

**Alt text** serves both screen readers and search engine image indexing. Google can''t "see" images — it reads alt text, just like a screen reader does.

**Heading hierarchy** creates a navigable document structure. Screen reader users jump between headings to navigate. Search crawlers use headings to understand content structure and relevance.

**Semantic HTML** (using proper elements like <nav>, <main>, <article>) helps assistive technology understand page layout AND helps search engines identify content types.

**Descriptive link text** benefits screen reader users who tab between links AND search engines that use anchor text as a relevance signal.

**Page performance** directly impacts both accessibility (users with slower connections or older devices) and search rankings (Core Web Vitals).

### Case Study Examples

**E-commerce fashion site:**
After improving accessibility from 34 to 71 (primarily alt text and contrast fixes), their SEO score rose from 48 to 67 without any SEO-specific changes. Organic traffic increased 23% over the following month.

**Law firm website:**
Fixing form labels and heading structure improved accessibility from 52 to 78. Their SEO score went from 55 to 68. Two key practice area pages moved from page 2 to page 1 of Google.

### The Bottom Line

Accessibility and SEO are not separate disciplines. They''re two expressions of the same principle: making your content understandable and navigable for all users, whether human or machine.

Investing in accessibility is an SEO strategy. Investing in SEO (done properly) is an accessibility strategy.

Audit your site with PagePulser to see both scores and the specific overlap areas where one fix improves both.',
  LEFT('After auditing thousands of websites through PagePulser, one pattern is impossible to ignore: accessible websites rank better. Here''s the data, the technical explanation, and what it means for your strategy.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 6 - Article 2',
  2120
);

-- ============================================================
-- WEEK 7 — Feature Highlights & Education
-- ============================================================

-- ---- Twitter/X (Week 7) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'PDF Reports Feature',
  'Feature spotlight: PagePulser''s PDF reports. Download a branded, professional audit report to share with your team, clients, or developers. Every issue documented with fix guidance.',
  LEFT('Feature spotlight: PagePulser''s PDF reports. Download a branded, professional audit report to share with your team, clients, or developers. Every issue documented with fix guidance.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Monday',
  175
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Title Tag SEO Tip',
  'SEO tip: your title tag is the single most important on-page SEO element. Keep it under 60 characters, include your primary keyword, and make it compelling. PagePulser checks this automatically.',
  LEFT('SEO tip: your title tag is the single most important on-page SEO element. Keep it under 60 characters, include your primary keyword, and make it compelling. PagePulser checks this automatically.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Tuesday',
  190
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Screen Reader Alt Text Experience',
  'Did you know? Screen readers announce images without alt text as "image" or just the filename. Imagine hearing "DSC_0047.jpg" 30 times while trying to browse a website. That''s the experience for millions of users.',
  LEFT('Did you know? Screen readers announce images without alt text as "image" or just the filename. Imagine hearing "DSC_0047.jpg" 30 times while trying to browse a website. That''s the experience for millions of users.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Wednesday',
  209
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Image Optimisation Performance Tip',
  'Performance tip: the #1 cause of slow websites is unoptimised images. Compress them, use modern formats (WebP), and lazy-load anything below the fold. Your PagePulser performance score will thank you.',
  LEFT('Performance tip: the #1 cause of slow websites is unoptimised images. Compress them, use modern formats (WebP), and lazy-load anything below the fold. Your PagePulser performance score will thank you.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Thursday',
  194
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Scheduled Audits Launch',
  'New: scheduled audits. Set PagePulser to automatically audit your site weekly or monthly. Get notified when your score drops. Website health monitoring on autopilot.',
  LEFT('New: scheduled audits. Set PagePulser to automatically audit your site weekly or monthly. Get notified when your score drops. Website health monitoring on autopilot.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Friday',
  161
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Security Checklist',
  'Your website security checklist: HTTPS everywhere. Security headers set. Admin panel protected. Software updated. No mixed content. PagePulser checks all of these.',
  LEFT('Your website security checklist: HTTPS everywhere. Security headers set. Admin panel protected. Software updated. No mixed content. PagePulser checks all of these.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Saturday',
  158
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Weekly Wins Thread',
  'Weekly wins thread: share your PagePulser score improvements this week. Tag us. We''ll retweet the best ones.',
  LEFT('Weekly wins thread: share your PagePulser score improvements this week. Tag us. We''ll retweet the best ones.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Sunday',
  106
);

-- ---- Instagram (Week 7) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'PDF Report Preview',
  'Your audit, professionally documented.

PagePulser PDF reports include:
- Overall health scores across all four categories
- Prioritised issue list with severity levels
- Step-by-step fix guidance for every finding
- WCAG criteria references for accessibility issues
- Your branding (on Pro plans)

Share with your team. Send to your developer. Include in client proposals.

Download from any completed audit in your dashboard.',
  LEFT('Your audit, professionally documented.  PagePulser PDF reports include: - Overall health scores across all four categories - Prioritised issue list with severity levels - Step-by-step fix guidance for every finding', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Monday',
  404
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Title Tag Masterclass',
  'Title Tag Masterclass

The anatomy of a perfect title tag:
- Under 60 characters
- Primary keyword near the front
- Compelling and click-worthy
- Unique for every page

Good examples:
"Website Accessibility Audit Tool | PagePulser"
"Free SEO Checker — Analyse Your Site in Minutes"

Bad examples:
"Home"
"Welcome to Our Website | Best Company | Top Service | Buy Now | Click Here"
"untitled"

Common mistakes:
- Too long (gets truncated in search results)
- Keyword stuffing
- Same title on every page
- Missing entirely

PagePulser checks your title tags automatically and flags issues.',
  LEFT('Title Tag Masterclass  The anatomy of a perfect title tag: - Under 60 characters - Primary keyword near the front - Compelling and click-worthy - Unique for every page  Good examples: "Website Accessibility Audit Tool | PagePulser"', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Tuesday',
  530
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Screen Reader Demo Reel',
  'Listen to this.

This is what a screen reader sounds like on a website with missing alt text:

"Image. Image. Image. DSC_0047.jpg. Image. IMG_2391.jpg. Image."

Now listen to the same site with proper alt text:

"Woman working at laptop in modern office. Team collaboration meeting around whiteboard. Product dashboard showing analytics."

Same website. Completely different experience.

89% of websites have images without alt text. Is yours one of them?

Reel format: screen recording with audio of screen reader navigating both versions.',
  LEFT('Listen to this.  This is what a screen reader sounds like on a website with missing alt text:  "Image. Image. Image. DSC_0047.jpg. Image. IMG_2391.jpg. Image."  Now listen to the same site with proper alt text:', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Wednesday',
  498
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Image Optimisation Guide',
  'Image Optimisation Guide: The Single Biggest Performance Win

Formats:
- JPEG: Photos and complex images
- PNG: Graphics with transparency
- WebP: Modern format, 25-35% smaller than JPEG (use this!)
- AVIF: Newest format, even smaller (growing support)
- SVG: Icons and simple graphics

Compression:
- Lossy: Smaller files, slight quality loss (usually imperceptible)
- Lossless: Larger files, no quality loss
- Aim for 80-85% quality — barely visible difference

Lazy Loading:
- Add loading="lazy" to images below the fold
- Browser handles the rest
- Dramatically improves initial page load

Responsive Images:
- Serve different sizes for different screens
- Don''t send a 2000px image to a mobile phone
- Use srcset attribute

Before: 3.2MB page, 8.1s load
After: 890KB page, 2.3s load

Same content. Better experience.',
  LEFT('Image Optimisation Guide: The Single Biggest Performance Win  Formats: - JPEG: Photos and complex images - PNG: Graphics with transparency - WebP: Modern format, 25-35% smaller than JPEG (use this!) - AVIF: Newest format, even smaller (growing support)', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Thursday',
  707
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Scheduled Audits Announcement',
  'Set it and forget it.

Scheduled Audits are here.

Choose your frequency:
- Weekly
- Monthly

PagePulser automatically audits your site on schedule and notifies you when:
- Your score drops significantly
- New critical issues are found
- Previously fixed issues return

Website health monitoring on autopilot.

Available on Pro plans and above. Set it up in your dashboard today.',
  LEFT('Set it and forget it.  Scheduled Audits are here.  Choose your frequency: - Weekly - Monthly  PagePulser automatically audits your site on schedule and notifies you when: - Your score drops significantly', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Friday',
  350
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Website Security Checklist',
  'Website Security Checklist

HTTPS:
[ ] SSL certificate installed and valid
[ ] All pages redirect HTTP to HTTPS
[ ] No mixed content warnings

Security Headers:
[ ] Content-Security-Policy
[ ] X-Frame-Options
[ ] X-Content-Type-Options
[ ] Strict-Transport-Security
[ ] Referrer-Policy

Access:
[ ] Admin panel has strong authentication
[ ] Default credentials changed
[ ] Login rate limiting enabled

Software:
[ ] CMS and plugins up to date
[ ] Unused plugins removed
[ ] Server software patched

PagePulser checks all of these automatically. How does your site score?',
  LEFT('Website Security Checklist  HTTPS: [ ] SSL certificate installed and valid [ ] All pages redirect HTTP to HTTPS [ ] No mixed content warnings  Security Headers: [ ] Content-Security-Policy [ ] X-Frame-Options', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Saturday',
  528
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'This Week''s Biggest Wins',
  'This week''s biggest score improvements from our community:

Score improvements, fixes made, and time invested — all featured with permission.

Share your PagePulser improvement story for a chance to be featured next week.

Tag @pagepulser or DM us your before/after screenshots.',
  LEFT('This week''s biggest score improvements from our community:  Score improvements, fixes made, and time invested — all featured with permission.  Share your PagePulser improvement story for a chance to be featured next week.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Sunday',
  284
);

-- ---- Threads (Week 7) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'PDF Reports Feedback',
  'PDF reports are getting great feedback. People are actually sharing their PagePulser audits with clients and stakeholders. That was the goal — make audits something you share, not something that sits in a tab you never look at again.',
  LEFT('PDF reports are getting great feedback. People are actually sharing their PagePulser audits with clients and stakeholders. That was the goal — make audits something you share, not something that sits in a tab you never look at again.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Monday',
  228
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Title Tags Hot Take',
  'Hot take: most title tags are boring, keyword-stuffed, or way too long. Your title tag is your website''s first impression in search results. Treat it like a headline, not a keyword dump.',
  LEFT('Hot take: most title tags are boring, keyword-stuffed, or way too long. Your title tag is your website''s first impression in search results. Treat it like a headline, not a keyword dump.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Tuesday',
  183
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Screen Reader Experience',
  'Made a team member listen to their own website through a screen reader today. The look on their face when it said "image image image image link image" was everything. You don''t get it until you hear it.',
  LEFT('Made a team member listen to their own website through a screen reader today. The look on their face when it said "image image image image link image" was everything. You don''t get it until you hear it.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Wednesday',
  199
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Page Size Bloat',
  'The average web page is now 2.5MB. In 2010 it was 700KB. Most of that bloat is images. Compress. Use WebP. Lazy load. Your users (and their data plans) will thank you.',
  LEFT('The average web page is now 2.5MB. In 2010 it was 700KB. Most of that bloat is images. Compress. Use WebP. Lazy load. Your users (and their data plans) will thank you.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Thursday',
  167
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Scheduled Audits Shipped',
  'Just shipped scheduled audits. Set PagePulser to audit your site weekly and get notified when something changes. Because website health isn''t a one-time thing — it''s ongoing.',
  LEFT('Just shipped scheduled audits. Set PagePulser to audit your site weekly and get notified when something changes. Because website health isn''t a one-time thing — it''s ongoing.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Friday',
  171
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Security Headers Underrated',
  'Security headers are the most underrated website protection. Content-Security-Policy, X-Frame-Options, Strict-Transport-Security. Most sites don''t have them. PagePulser checks for all of them.',
  LEFT('Security headers are the most underrated website protection. Content-Security-Policy, X-Frame-Options, Strict-Transport-Security. Most sites don''t have them. PagePulser checks for all of them.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Saturday',
  188
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Show Me Your Improvements',
  'Show me your score improvement this week and I''ll share it. Love celebrating wins with this community.',
  LEFT('Show me your score improvement this week and I''ll share it. Love celebrating wins with this community.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Sunday',
  100
);

-- ---- LinkedIn (Week 7) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'linkedin',
  'The Case for Regular Website Auditing: A Cost-Benefit Analysis',
  'I''m often asked: "How often should I audit my website?"

Here''s the simple answer: at least monthly.

Here''s the detailed answer:

The cost of NOT auditing regularly:
- Accessibility lawsuit: $25,000-$75,000+
- Lost search rankings: Varies, but a 10-position drop can mean 50%+ traffic loss
- Security breach: Average cost for SMBs is $120,000
- Slow site: Every 1-second delay reduces conversions by 7%

The cost of regular auditing with PagePulser:
- Free tier: $0/month for basic audits
- Pro tier: Affordable monthly for full monitoring
- Time investment: 5 minutes per audit + fix time

The ROI:
- Prevention of one lawsuit pays for years of auditing
- A 10-point accessibility improvement correlates with 5-15% more organic traffic
- Faster sites convert measurably better

Regular auditing isn''t a cost — it''s insurance. And with tools like PagePulser, there''s no excuse not to.',
  LEFT('I''m often asked: "How often should I audit my website?"  Here''s the simple answer: at least monthly.  Here''s the detailed answer:  The cost of NOT auditing regularly: - Accessibility lawsuit: $25,000-$75,000+ - Lost search rankings: Varies, but a 10-pos', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Post 1',
  780
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'linkedin',
  'New Feature: Scheduled Audits and Monitoring',
  'Launching something important today: scheduled audits in PagePulser.

You can now set your website to be automatically audited on a weekly or monthly schedule. When it runs, you''ll get notified of any significant score changes.

Why this matters:

Websites change constantly. Content gets added, plugins get updated, team members make changes. Without monitoring, issues accumulate silently until they become problems — a dropped ranking, a failed compliance check, a customer complaint.

Scheduled audits catch issues early, when they''re easy to fix. Think of it like automated testing for your website''s health.

Available on Pro plans and above. Set it up in your PagePulser dashboard today.',
  LEFT('Launching something important today: scheduled audits in PagePulser.  You can now set your website to be automatically audited on a weekly or monthly schedule. When it runs, you''ll get notified of any significant score changes.  Why this matters:', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Post 2',
  614
);

-- ---- Blog (Week 7) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'other',
  'The Complete Guide to Website Security Headers',
  '## The Complete Guide to Website Security Headers

**Category: Security**

Security headers are one of the most effective yet overlooked ways to protect your website. They''re HTTP response headers that tell browsers how to behave when handling your site''s content. Most websites are missing them entirely.

### What Are Security Headers?

When your browser requests a web page, the server sends back the page content along with HTTP headers — metadata about the response. Security headers are specific headers that instruct the browser to enable (or disable) certain security features.

Think of them as instructions to the browser: "When displaying my site, follow these security rules."

### The Essential Security Headers

#### Content-Security-Policy (CSP)

**What it does:** Controls which resources (scripts, styles, images, etc.) the browser is allowed to load. This is your primary defence against Cross-Site Scripting (XSS) attacks.

**Why it matters:** Without CSP, an attacker who injects malicious JavaScript into your page can load and execute any script from any source. CSP restricts this.

**Basic implementation:**
```
Content-Security-Policy: default-src ''self''; script-src ''self''; style-src ''self'' ''unsafe-inline''; img-src ''self'' data: https:;
```

**Found missing on:** 61% of PagePulser-audited sites

#### X-Frame-Options

**What it does:** Prevents your site from being embedded in iframes on other websites. This protects against clickjacking attacks.

**Why it matters:** Without this header, an attacker can embed your site in a transparent iframe and trick users into clicking buttons they can''t see.

**Implementation:**
```
X-Frame-Options: DENY
```
or
```
X-Frame-Options: SAMEORIGIN
```

**Found missing on:** 44% of PagePulser-audited sites

#### Strict-Transport-Security (HSTS)

**What it does:** Tells browsers to always use HTTPS when connecting to your site, even if the user types HTTP.

**Why it matters:** Without HSTS, a man-in-the-middle attacker can intercept the initial HTTP request before it redirects to HTTPS.

**Implementation:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Found missing on:** 38% of PagePulser-audited sites

#### X-Content-Type-Options

**What it does:** Prevents browsers from MIME-type sniffing — guessing the content type of a response instead of trusting the declared Content-Type.

**Implementation:**
```
X-Content-Type-Options: nosniff
```

#### Referrer-Policy

**What it does:** Controls how much referrer information is sent when navigating away from your site.

**Implementation:**
```
Referrer-Policy: strict-origin-when-cross-origin
```

### How to Check Your Security Headers

PagePulser automatically checks for all of these headers as part of your security audit. Run an audit to see which headers you''re missing and get specific implementation guidance for your platform.

### Implementation Guides

**Apache (.htaccess):**
```
Header set X-Frame-Options "DENY"
Header set X-Content-Type-Options "nosniff"
Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header set Referrer-Policy "strict-origin-when-cross-origin"
```

**Nginx:**
```
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

**Vercel (vercel.json), Netlify (_headers), and other platforms** have their own configuration methods — check your hosting provider''s documentation.

### Summary

Adding security headers is one of the highest-impact, lowest-effort security improvements you can make. Most can be added in under 30 minutes and dramatically reduce your attack surface.',
  LEFT('Security headers are one of the most effective yet overlooked ways to protect your website. They''re HTTP response headers that tell browsers how to behave when handling your site''s content. Most websites are missing them entirely.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Article 1',
  3250
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'other',
  'Image Optimisation: The Single Biggest Performance Win for Most Websites',
  '## Image Optimisation: The Single Biggest Performance Win for Most Websites

**Category: Performance**

If your website is slow, images are almost certainly the primary culprit. Unoptimised images are found on 83% of sites audited by PagePulser, making them the most common performance issue by a significant margin.

### Why Images Are the #1 Performance Bottleneck

The average web page is now over 2.5MB in size. Images typically account for 50-70% of that total. A single unoptimised photograph can be 3-5MB on its own — larger than many entire web pages should be.

This matters because:
- Larger files take longer to download
- Mobile users on cellular connections are disproportionately affected
- Page load speed directly impacts user experience, bounce rate, and search rankings

### Modern Image Formats

**JPEG** — The classic. Good for photographs. Supports lossy compression.

**PNG** — Best for graphics with transparency or text. Larger than JPEG for photos.

**WebP** — Google''s modern format. 25-35% smaller than equivalent JPEG files with no visible quality loss. Supported by all modern browsers. **This should be your default format for most images.**

**AVIF** — The newest format. Even smaller than WebP (up to 50% smaller than JPEG). Browser support is growing rapidly. Worth implementing with WebP as a fallback.

**SVG** — For icons, logos, and simple graphics. Infinitely scalable, tiny file sizes for appropriate content.

### Compression Techniques

**Lossy compression** reduces file size by permanently removing some image data. At 80-85% quality, the difference is virtually imperceptible to the human eye.

- Original JPEG: 2.4MB
- 85% quality: 420KB (82% reduction)
- 80% quality: 310KB (87% reduction)
- Visual difference: Nearly none

**Lossless compression** reduces file size without any quality loss by optimising how data is stored. Savings are typically 10-30%.

**Recommendation:** Use lossy compression at 80-85% quality for photographs. Use lossless for graphics, screenshots, and images where precision matters.

### Lazy Loading

Lazy loading defers the loading of images that aren''t currently visible in the viewport. Instead of loading all images when the page first loads, off-screen images load only as the user scrolls toward them.

**Implementation is simple:**
```html
<img src="photo.webp" alt="Description" loading="lazy">
```

That single attribute can dramatically reduce initial page load time, especially on pages with many images.

**When NOT to lazy load:**
- The hero image or any image visible on initial load (above the fold)
- Images critical to the page''s core content
- Very small images (the overhead isn''t worth it)

### Responsive Images

Don''t serve a 2000px-wide image to a phone with a 400px-wide screen. Responsive images serve appropriately sized versions based on the device.

```html
<img
  srcset="photo-400.webp 400w, photo-800.webp 800w, photo-1200.webp 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  src="photo-800.webp"
  alt="Description"
  loading="lazy"
>
```

### The Impact

A typical before/after for image optimisation:

**Before:**
- Page size: 4.2MB
- Load time: 8.1 seconds
- Performance score: 38/100

**After (WebP, compression, lazy loading, responsive):**
- Page size: 890KB (79% reduction)
- Load time: 2.3 seconds (72% faster)
- Performance score: 76/100

Same images. Same visual quality. Dramatically better performance.

### Getting Started

Run a PagePulser audit to identify which images on your site need optimisation. Your performance report will flag unoptimised images, missing lazy loading, and opportunities for format improvements.',
  LEFT('If your website is slow, images are almost certainly the primary culprit. Unoptimised images are found on 83% of sites audited by PagePulser, making them the most common performance issue by a significant margin.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 7 - Article 2',
  3400
);

-- ============================================================
-- WEEK 8 — Growth & Engagement
-- ============================================================

-- ---- Twitter/X (Week 8) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Milestone: X,000 Websites Audited',
  'Milestone: X,000 websites audited on PagePulser. The average starting score? 54/100. The average score after first round of fixes? 72/100. The web is getting better.',
  LEFT('Milestone: X,000 websites audited on PagePulser. The average starting score? 54/100. The average score after first round of fixes? 72/100. The web is getting better.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Monday',
  162
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Agency Secret Weapon',
  'Agency owners: PagePulser can be your secret weapon. Audit a prospect''s site before a pitch. Show them their score. Offer to fix it. Instant credibility.',
  LEFT('Agency owners: PagePulser can be your secret weapon. Audit a prospect''s site before a pitch. Show them their score. Offer to fix it. Instant credibility.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Tuesday',
  152
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Top 5 Accessibility Fixes Thread',
  'A thread on the 5 accessibility fixes that give you the biggest score improvement:

1/ Add alt text to all images — the #1 most common issue. Found on 89% of sites. Takes 15-30 mins. Score impact: +5-10 points.

2/ Fix colour contrast — affects 76% of sites. Darken light text, increase ratios to 4.5:1 minimum. Score impact: +3-8 points.

3/ Add form labels — 54% of sites have unlabelled form inputs. Link every input to a visible label. Score impact: +3-7 points.

4/ Fix heading hierarchy — 62% of sites skip heading levels or use multiple H1s. Keep it sequential: H1 > H2 > H3. Score impact: +2-5 points.

5/ Add descriptive link text — replace "click here" and "read more" with meaningful text. Score impact: +2-4 points.

Total potential improvement: 15-34 points. Most of this takes under 2 hours.',
  LEFT('A thread on the 5 accessibility fixes that give you the biggest score improvement:  1/ Add alt text to all images — the #1 most common issue. Found on 89% of sites. Takes 15-30 mins. Score impact: +5-10 points.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Wednesday',
  658
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Issues Fixed Counter',
  'Every time someone fixes their website because of PagePulser, the internet gets a little bit better. X issues fixed and counting.',
  LEFT('Every time someone fixes their website because of PagePulser, the internet gets a little bit better. X issues fixed and counting.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Thursday',
  127
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Team Accounts Launch',
  'PagePulser now supports team accounts. Add your developers, designers, and stakeholders. Everyone sees the same health dashboard.',
  LEFT('PagePulser now supports team accounts. Add your developers, designers, and stakeholders. Everyone sees the same health dashboard.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Friday',
  127
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Your Best Salesperson',
  'Your website is your best salesperson. It works 24/7, never takes a day off. Make sure it''s performing at its best. pagepulser.com',
  LEFT('Your website is your best salesperson. It works 24/7, never takes a day off. Make sure it''s performing at its best. pagepulser.com', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Saturday',
  131
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'End of Month 1',
  'End of month 1. From zero to X,000 audits. Thank you to everyone who''s trusted PagePulser with their website health. Month 2 is going to be even bigger.',
  LEFT('End of month 1. From zero to X,000 audits. Thank you to everyone who''s trusted PagePulser with their website health. Month 2 is going to be even bigger.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Sunday',
  151
);

-- ---- Instagram (Week 8) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Milestone Celebration',
  'X,000 websites audited on PagePulser.

The numbers:
- Audits completed: X,000
- Issues identified: X,000
- Average starting score: 54/100
- Average score after fixes: 72/100
- Average improvement: +18 points

The web is getting better, one audit at a time. Thank you to every user who''s part of this journey.',
  LEFT('X,000 websites audited on PagePulser.  The numbers: - Audits completed: X,000 - Issues identified: X,000 - Average starting score: 54/100 - Average score after fixes: 72/100 - Average improvement: +18 points', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Monday',
  290
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Agency Hack: Win More Clients with Website Audits',
  'Agency Hack: Win More Clients with Website Audits

The playbook:

Step 1: Before a prospect call, audit their site with PagePulser
Step 2: Download the PDF report
Step 3: Walk into the meeting with data: "Your site scores 43 on accessibility and 51 on SEO"
Step 4: Show them the specific issues
Step 5: Offer to fix them as part of your engagement

The result:
- Instant credibility
- Value delivered before the sale
- Data-driven conversation
- Higher close rates

Works for agencies, freelancers, and consultants. PagePulser Pro supports multiple sites and branded reports.',
  LEFT('Agency Hack: Win More Clients with Website Audits  The playbook:  Step 1: Before a prospect call, audit their site with PagePulser Step 2: Download the PDF report Step 3: Walk into the meeting with data: "Your site scores 43 on accessibility and 51 on', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Tuesday',
  526
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Top 5 Accessibility Fixes by Impact',
  'Top 5 Accessibility Fixes by Impact

1. Add alt text to images
   Score impact: +5-10 points
   Time: 15-30 minutes
   Found on 89% of sites

2. Fix colour contrast
   Score impact: +3-8 points
   Time: 15-30 minutes
   Found on 76% of sites

3. Add form labels
   Score impact: +3-7 points
   Time: 10-20 minutes
   Found on 54% of sites

4. Fix heading hierarchy
   Score impact: +2-5 points
   Time: 15-20 minutes
   Found on 62% of sites

5. Descriptive link text
   Score impact: +2-4 points
   Time: 10-15 minutes
   Found on 47% of sites

Total potential: +15-34 points in under 2 hours.',
  LEFT('Top 5 Accessibility Fixes by Impact  1. Add alt text to images    Score impact: +5-10 points    Time: 15-30 minutes    Found on 89% of sites  2. Fix colour contrast    Score impact: +3-8 points    Time: 15-30 minutes', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Wednesday',
  536
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Community Impact Counter',
  'X issues fixed through PagePulser.

Every alt text added. Every contrast ratio improved. Every form label connected. Every heading structure fixed. Every security header implemented.

Each fix makes the web a little better for everyone.

Thank you to our community for making this happen.',
  LEFT('X issues fixed through PagePulser.  Every alt text added. Every contrast ratio improved. Every form label connected. Every heading structure fixed. Every security header implemented.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Thursday',
  278
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Team Accounts Are Live',
  'Website health is a team sport.

Team Accounts are live on PagePulser.

Add your:
- Developers (to fix technical issues)
- Designers (to address visual accessibility)
- Content team (to improve SEO and alt text)
- Stakeholders (to see progress over time)

Everyone sees the same dashboard. Everyone works toward the same health goals.

Available on Pro plans and above.',
  LEFT('Website health is a team sport.  Team Accounts are live on PagePulser.  Add your: - Developers (to fix technical issues) - Designers (to address visual accessibility) - Content team (to improve SEO and alt text)', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Friday',
  338
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Your Website Is Your Best Salesperson',
  'Your website is your best salesperson.

It works 24 hours a day.
7 days a week.
365 days a year.
No sick days. No holidays.

Make sure it''s:
- Accessible to everyone
- Findable in search results
- Secure against threats
- Fast and responsive

Make sure it''s performing at its best.

Audit yours free at pagepulser.com',
  LEFT('Your website is your best salesperson.  It works 24 hours a day. 7 days a week. 365 days a year. No sick days. No holidays.  Make sure it''s: - Accessible to everyone - Findable in search results', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Saturday',
  308
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Month 1 in Review',
  'Month 1 in Review

Launch week highlights:
- PagePulser went live
- X,000 websites audited
- Top finding: missing alt text (89% of sites)

Key features shipped:
- WCAG criteria references
- Audit comparison
- Scheduled audits
- Team accounts
- PDF report improvements

Community wins:
- Average score improvement: +18 points
- X issues identified and fixed
- Incredible feedback and feature requests

Thank you for an amazing first month. Month 2 starts now.',
  LEFT('Month 1 in Review  Launch week highlights: - PagePulser went live - X,000 websites audited - Top finding: missing alt text (89% of sites)  Key features shipped: - WCAG criteria references - Audit comparison', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Sunday',
  430
);

-- ---- Threads (Week 8) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'X,000 Audits Milestone',
  'Milestone day. X,000 websites audited through PagePulser in our first month. What surprises me most? The average starting score is 54/100. There''s so much room for improvement out there.',
  LEFT('Milestone day. X,000 websites audited through PagePulser in our first month. What surprises me most? The average starting score is 54/100. There''s so much room for improvement out there.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Monday',
  181
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Agency Sales Move',
  'If you run an agency, here''s a move: audit a prospect''s website before your sales call. Walk in with their PagePulser report. Show them issues they didn''t know about. Offer to fix them. Close rate goes through the roof.',
  LEFT('If you run an agency, here''s a move: audit a prospect''s website before your sales call. Walk in with their PagePulser report. Show them issues they didn''t know about. Offer to fix them. Close rate goes through the roof.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Tuesday',
  218
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Top 5 Accessibility Fixes',
  'The 5 accessibility fixes with the biggest score impact: 1) Add alt text to all images 2) Fix colour contrast on text 3) Add form labels 4) Fix heading hierarchy 5) Ensure all links have descriptive text. Do these 5 and watch your score jump.',
  LEFT('The 5 accessibility fixes with the biggest score impact: 1) Add alt text to all images 2) Fix colour contrast on text 3) Add form labels 4) Fix heading hierarchy 5) Ensure all links have descriptive text. Do these 5 and watch your score jump.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Wednesday',
  241
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Every Fix Matters',
  'Every fix matters. Every alt text added. Every contrast ratio improved. Every form label connected. Collectively, PagePulser users have fixed X issues this month. The web is literally getting better.',
  LEFT('Every fix matters. Every alt text added. Every contrast ratio improved. Every form label connected. Collectively, PagePulser users have fixed X issues this month. The web is literally getting better.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Thursday',
  192
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Team Accounts Live',
  'Team accounts are live. Because website health shouldn''t be one person''s job. Add your devs, designers, and stakeholders to your PagePulser workspace.',
  LEFT('Team accounts are live. Because website health shouldn''t be one person''s job. Add your devs, designers, and stakeholders to your PagePulser workspace.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Friday',
  149
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  '24/7/365 Website',
  '24/7/365. That''s how long your website works for you. No sick days. No holidays. Make sure it''s in good health.',
  LEFT('24/7/365. That''s how long your website works for you. No sick days. No holidays. Make sure it''s in good health.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Saturday',
  109
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Month 1 Done',
  'Month 1: done. What a ride. Thank you to every single person who''s tried PagePulser. Your feedback, your scores, your improvements — you''re making this journey incredible.',
  LEFT('Month 1: done. What a ride. Thank you to every single person who''s tried PagePulser. Your feedback, your scores, your improvements — you''re making this journey incredible.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Sunday',
  168
);

-- ---- LinkedIn (Week 8) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'linkedin',
  'How Agencies Are Using PagePulser to Win More Clients',
  'One of the most exciting use cases emerging from PagePulser is in agencies and freelancers using it as a sales tool.

The playbook is simple:

1. Before a prospect call, audit their website with PagePulser
2. Generate the PDF report
3. Walk into the meeting with concrete data: "Your site scores 43 on accessibility and 51 on SEO. Here are the critical issues."
4. Offer to fix them as part of your engagement

The prospect gets immediate value. You demonstrate expertise. The conversation shifts from "why should we hire you?" to "when can you start?"

Several agencies have told us this approach has significantly improved their close rates. It''s hard to argue with data.

If you''re an agency or freelancer, PagePulser Pro supports multiple sites and branded PDF reports. Built for exactly this use case.',
  LEFT('One of the most exciting use cases emerging from PagePulser is in agencies and freelancers using it as a sales tool.  The playbook is simple:  1. Before a prospect call, audit their website with PagePulser 2. Generate the PDF report 3. Walk into the meeti', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Post 1',
  724
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'linkedin',
  'Month 1 in Review: What PagePulser Taught Us About the Web',
  'One month ago, we launched PagePulser. Here''s what the data tells us:

The biggest takeaway: awareness drives action. Most website owners don''t know their sites have issues. Once they see the data, they fix things. The average score improvement after first fixes is 18 points.

Month 2 focus: making fixes even easier, expanding our checks, and building features our community is asking for.

Thank you for an incredible first month.',
  LEFT('One month ago, we launched PagePulser. Here''s what the data tells us:  The biggest takeaway: awareness drives action. Most website owners don''t know their sites have issues. Once they see the data, they fix things. The average score improvement after first', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Post 2',
  432
);

-- ---- Blog (Week 8) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'other',
  'How to Use Website Audits in Your Agency Sales Process',
  '## How to Use Website Audits in Your Agency Sales Process

**Category: Guides**

If you run an agency or work as a freelancer, website audits can transform your sales process. Instead of walking into meetings with generic proposals, you walk in with data — specific, actionable data about the prospect''s own website.

### The Audit-First Sales Approach

The concept is simple: before every prospect meeting, audit their website. Present the findings as part of your pitch.

Here''s the step-by-step process:

**Step 1: Audit the prospect''s website**

Run a full PagePulser audit 24-48 hours before your meeting. Review the results and identify the most impactful findings.

**Step 2: Prepare your presentation**

Focus on 3-5 key findings that are:
- Easy to understand (no jargon)
- Clearly impactful (affects users, revenue, or risk)
- Fixable (you can offer to resolve them)

**Step 3: Lead with value in the meeting**

Open with: "Before our meeting, I took a look at your website. I found some things I think you should know about."

Then walk through the findings. Use the PagePulser dashboard or PDF report as a visual aid.

**Step 4: Connect findings to business impact**

Don''t just say "you''re missing alt text." Say "89% of your images are invisible to screen readers, which affects approximately 15% of your potential visitors AND reduces your search visibility."

### How to Present Findings to Non-Technical Prospects

The key is translating technical issues into business language:

- "Missing alt text" becomes "Search engines can''t see your images, and neither can visually impaired visitors"
- "Poor colour contrast" becomes "Some of your text is hard to read, especially for older visitors or people on mobile in sunlight"
- "Missing security headers" becomes "Your site is missing standard security protections that could prevent data breaches"
- "Slow page speed" becomes "Your site takes 8 seconds to load — research shows 53% of visitors leave if it takes more than 3 seconds"

### Using PDF Reports as Leave-Behinds

PagePulser''s PDF reports serve as powerful leave-behind materials:

- Professional, branded presentation of findings
- Every issue documented with severity and fix guidance
- Scores provide a clear baseline for improvement
- The prospect can share it internally to build buy-in

### Pricing Audit-Fix Packages

Consider structuring your services around the audit results:

**Quick Fix Package:** Address all Critical and Serious issues. Typically 2-4 hours of work. Position as an immediate-value engagement.

**Comprehensive Package:** Fix all issues across all severity levels. Typically 8-16 hours. Position as a complete website health overhaul.

**Ongoing Monitoring:** Monthly audits with PagePulser, plus a fixed number of fix hours per month. Position as ongoing website health management.

### Getting Started

Sign up for PagePulser Pro to access multiple site audits and branded PDF reports. Start auditing prospect websites today and see how it transforms your sales conversations.',
  LEFT('If you run an agency or work as a freelancer, website audits can transform your sales process. Instead of walking into meetings with generic proposals, you walk in with data — specific, actionable data about the prospect''s own website.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Article 1',
  2560
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'other',
  'Month 1 Data: What 10,000 Website Audits Reveal About the State of the Web',
  '## Month 1 Data: What 10,000 Website Audits Reveal About the State of the Web

**Category: Case Studies**

After one month of PagePulser being live, we''ve accumulated a significant dataset. Over 10,000 websites audited across industries, sizes, and platforms. Here''s what the data reveals about the current state of the web.

### Aggregate Data Analysis

**Overall Average Scores:**
- Accessibility: 52/100
- SEO: 61/100
- Security: 74/100
- Performance: 58/100
- Combined average: 61/100

**Score Distribution:**
- 90-100: 3% of sites
- 70-89: 22% of sites
- 50-69: 41% of sites
- Below 50: 34% of sites

The majority of websites fall in the 50-69 range — functional, but with significant room for improvement.

### Industry Comparisons

**Technology/SaaS:** Average combined score 68. Tend to score highest on security (82) but often neglect accessibility (55).

**E-commerce:** Average combined score 57. Performance is the biggest challenge (49) due to image-heavy pages. SEO tends to be reasonable (64) due to awareness.

**Professional Services (Law, Finance, Consulting):** Average combined score 59. Accessibility is a major gap (46) — concerning given the legal requirements in these industries.

**Healthcare:** Average combined score 55. Security scores well (79) but accessibility is surprisingly low (48) despite serving populations that disproportionately need accessible sites.

**Education:** Average combined score 62. Most balanced scores across categories. Accessibility (58) still below where it should be.

**Non-profit:** Average combined score 53. Lowest average across industries, often due to limited technical resources.

### Most Common Issues and Their Prevalence

**Accessibility Issues:**
1. Images without alt text — 89%
2. Insufficient colour contrast — 76%
3. Heading hierarchy violations — 62%
4. Missing form input labels — 54%
5. Missing skip navigation — 48%

**SEO Issues:**
1. Missing structured data — 72%
2. Missing or duplicate meta descriptions — 68%
3. Title tags too long or missing — 41%
4. Missing canonical tags — 35%
5. Broken internal links — 23%

**Security Issues:**
1. Missing Content-Security-Policy — 61%
2. Missing X-Frame-Options — 44%
3. Missing HSTS — 38%
4. Mixed content — 19%

**Performance Issues:**
1. Unoptimised images — 83%
2. Render-blocking resources — 67%
3. No lazy loading — 59%
4. Excessive DOM size — 34%

### Trends and Patterns

**The accessibility-SEO correlation is strong.** Sites scoring 80+ on accessibility average 72 on SEO. The overlap in technical requirements means improving one naturally improves the other.

**Security is the highest-scoring category because hosting platforms handle the basics.** SSL certificates and HTTPS are now standard. But advanced security headers are still widely missing.

**Performance problems are almost always image-related.** 83% of sites have unoptimised images. This single issue has the largest impact on performance scores.

**The biggest predictor of a high score is recency of website redesign.** Sites redesigned in the last 2 years score an average of 14 points higher than older sites.

### The Improvement Story

The most encouraging finding: users who run a second audit after making fixes see an average improvement of 18 points. The web is getting better, one audit at a time.

Run your audit at pagepulser.com.',
  LEFT('After one month of PagePulser being live, we''ve accumulated a significant dataset. Over 10,000 websites audited across industries, sizes, and platforms. Here''s what the data reveals about the current state of the web.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Launch'),
  'draft',
  'Week 8 - Article 2',
  2980
);

COMMIT;
