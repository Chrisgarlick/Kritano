-- Seed Month 1 (Pre-Launch, Weeks 1-4) marketing content
BEGIN;

-- Create campaigns
INSERT INTO marketing_campaigns (name, color, description) VALUES
('Pre-Launch', '#6366f1', 'Month 1: Building authority and anticipation before launch'),
('Launch', '#f59e0b', 'Month 2: Drive sign-ups, showcase the product, share early user results'),
('Growth', '#22c55e', 'Month 3: Establish thought leadership, deepen engagement, drive upgrades');

-- ============================================================
-- WEEK 1 — The Problem Is Bigger Than You Think
-- ============================================================

-- ---- Twitter/X (Week 1) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'The 96% Problem',
  '96% of the world''s top 1 million websites have accessibility issues. Your site probably does too. We''re building something to fix that. More soon.',
  LEFT('96% of the world''s top 1 million websites have accessibility issues. Your site probably does too. We''re building something to fix that. More soon.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Monday',
  148
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Keyboard Navigation Test',
  'Quick test: go to your website and try navigating it with just your keyboard. Tab through every link, button, and form. How far did you get? Most sites break within 3 clicks.',
  LEFT('Quick test: go to your website and try navigating it with just your keyboard. Tab through every link, button, and form. How far did you get? Most sites break within 3 clicks.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Tuesday',
  175
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Our Website Is Fine',
  '"Our website is fine" — every business owner before they run an audit. The average site has 50+ accessibility issues across just the homepage.',
  LEFT('"Our website is fine" — every business owner before they run an audit. The average site has 50+ accessibility issues across just the homepage.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Wednesday',
  142
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Core Web Vitals Warning',
  'Google now uses Core Web Vitals as a ranking factor. If your site is slow, poorly structured, or inaccessible — you''re losing rankings AND customers.',
  LEFT('Google now uses Core Web Vitals as a ranking factor. If your site is slow, poorly structured, or inaccessible — you''re losing rankings AND customers.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Thursday',
  150
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  '1 in 4 Adults',
  '1 in 4 adults in the UK has a disability. If your website isn''t accessible, you''re excluding 25% of your potential customers. That''s not just an ethical issue — it''s a business one.',
  LEFT('1 in 4 adults in the UK has a disability. If your website isn''t accessible, you''re excluding 25% of your potential customers. That''s not just an ethical issue — it''s a business one.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Friday',
  179
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'European Accessibility Act',
  'Fun fact: the European Accessibility Act kicks in June 2025. If you sell to EU customers, your website legally needs to be accessible. Are you ready?',
  LEFT('Fun fact: the European Accessibility Act kicks in June 2025. If you sell to EU customers, your website legally needs to be accessible. Are you ready?', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Saturday',
  149
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Most Common Issue: Alt Text',
  'We''ve been auditing websites for months now. The most common issue? Missing alt text on images. It takes 5 seconds to fix. But most businesses don''t even know it''s a problem.',
  LEFT('We''ve been auditing websites for months now. The most common issue? Missing alt text on images. It takes 5 seconds to fix. But most businesses don''t even know it''s a problem.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Sunday',
  175
);

-- ---- Instagram (Week 1) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  '5 Website Issues Hiding in Plain Sight',
  'Carousel - "5 Website Issues Hiding in Plain Sight" — 1. Missing alt text 2. Poor colour contrast 3. No heading hierarchy 4. Broken links 5. Missing form labels. Each slide explains the issue + quick fix.',
  LEFT('Carousel - "5 Website Issues Hiding in Plain Sight" — 1. Missing alt text 2. Poor colour contrast 3. No heading hierarchy 4. Broken links 5. Missing form labels. Each slide explains the issue + quick fix.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Monday',
  201
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'The Accessibility Gap',
  'Infographic - "The Accessibility Gap" — stats showing % of sites with issues, cost of lawsuits, lost revenue from inaccessible sites.',
  LEFT('Infographic - "The Accessibility Gap" — stats showing % of sites with issues, cost of lawsuits, lost revenue from inaccessible sites.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Tuesday',
  130
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Keyboard Navigation Reel',
  'Reel script - Screen recording: "Watch me try to navigate a popular website using only my keyboard" — show how quickly things break. End with "This is why we''re building PagePulser."',
  LEFT('Reel script - Screen recording: "Watch me try to navigate a popular website using only my keyboard" — show how quickly things break. End with "This is why we''re building PagePulser."', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Wednesday',
  181
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'What Google Actually Looks At',
  'Carousel - "What Google Actually Looks At" — Core Web Vitals explained in simple terms. LCP, FID, CLS with real-world analogies.',
  LEFT('Carousel - "What Google Actually Looks At" — Core Web Vitals explained in simple terms. LCP, FID, CLS with real-world analogies.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Thursday',
  130
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Tim Berners-Lee Quote',
  'Quote graphic - "The power of the Web is in its universality. Access by everyone regardless of disability is an essential aspect." — Tim Berners-Lee',
  LEFT('Quote graphic - "The power of the Web is in its universality. Access by everyone regardless of disability is an essential aspect." — Tim Berners-Lee', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Friday',
  148
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'European Accessibility Act Infographic',
  'Infographic - "European Accessibility Act: What You Need to Know" — timeline, who it affects, key requirements.',
  LEFT('Infographic - "European Accessibility Act: What You Need to Know" — timeline, who it affects, key requirements.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Saturday',
  107
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Dashboard Sneak Peek',
  'Behind-the-scenes - Photo/mockup of the PagePulser dashboard with caption: "Sneak peek at what we''ve been building. Stay tuned."',
  LEFT('Behind-the-scenes - Photo/mockup of the PagePulser dashboard with caption: "Sneak peek at what we''ve been building. Stay tuned."', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Sunday',
  124
);

-- ---- Threads (Week 1) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Accessibility Is Table Stakes',
  'Hot take: most businesses have no idea their website is broken for 25% of their audience. Accessibility isn''t a nice-to-have — it''s table stakes.',
  LEFT('Hot take: most businesses have no idea their website is broken for 25% of their audience. Accessibility isn''t a nice-to-have — it''s table stakes.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Monday',
  148
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Keyboard Navigation Test Results',
  'Tried using just my keyboard to navigate 10 popular websites today. 7 of them were completely unusable after the homepage. We have a long way to go.',
  LEFT('Tried using just my keyboard to navigate 10 popular websites today. 7 of them were completely unusable after the homepage. We have a long way to go.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Tuesday',
  149
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Automated Tools: Better Than Nothing',
  'Unpopular opinion: automated accessibility tools catch maybe 30-40% of issues. But that 30-40% is still better than the 0% most businesses are catching right now.',
  LEFT('Unpopular opinion: automated accessibility tools catch maybe 30-40% of issues. But that 30-40% is still better than the 0% most businesses are catching right now.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Wednesday',
  160
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Heading Hierarchy SEO Tip',
  'SEO tip most people miss: heading hierarchy matters more than you think. H1 → H2 → H3. Skip levels and Google gets confused about your content structure.',
  LEFT('SEO tip most people miss: heading hierarchy matters more than you think. H1 → H2 → H3. Skip levels and Google gets confused about your content structure.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Thursday',
  153
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'ADA Lawsuit Cost',
  'The cost of an ADA lawsuit averages $25,000-$75,000 for a small business. The cost of making your site accessible? A fraction of that. Prevention > cure.',
  LEFT('The cost of an ADA lawsuit averages $25,000-$75,000 for a small business. The cost of making your site accessible? A fraction of that. Prevention > cure.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Friday',
  152
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Most Common A11y Issue Poll',
  'Question for devs: what''s the most common accessibility issue you see in the wild? I''ll go first — form inputs without associated labels.',
  LEFT('Question for devs: what''s the most common accessibility issue you see in the wild? I''ll go first — form inputs without associated labels.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Saturday',
  140
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Building Something Useful',
  'Building something that makes website auditing actually useful. Not just a list of errors — real guidance on what to fix and why. Coming soon.',
  LEFT('Building something that makes website auditing actually useful. Not just a list of errors — real guidance on what to fix and why. Coming soon.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Sunday',
  140
);

-- ---- LinkedIn (Week 1) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'linkedin',
  'Why 96% of Websites Are Failing Their Users',
  'I''ve spent the last year studying website accessibility, and the numbers are staggering.

The WebAIM Million study found that 96.3% of the top 1,000,000 websites have detectable accessibility failures. Not obscure, edge-case issues — fundamental problems like:

- Missing alternative text for images (54.5% of sites)
- Low contrast text (81% of sites)
- Empty links (44.6% of sites)
- Missing form labels (45.9% of sites)

These aren''t just "nice to have" fixes. Each one represents a real person who can''t use your website. A potential customer who leaves. A lawsuit waiting to happen.

With the European Accessibility Act coming into force and Google increasingly rewarding accessible sites in search rankings, this isn''t something businesses can ignore anymore.

We''re building PagePulser to help businesses understand their website health — accessibility, SEO, security, and performance — in one clear dashboard. Not just errors, but guidance.

More details coming soon. Follow along for the journey.

#Accessibility #WebDevelopment #SEO #PagePulser',
  LEFT('I''ve spent the last year studying website accessibility, and the numbers are staggering. The WebAIM Million study found that 96.3% of the top 1,000,000 websites have detectable accessibility failures.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Post 1',
  1001
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'linkedin',
  'The Hidden Cost of a Good Enough Website',
  'Most businesses treat their website like a brochure. Build it, forget it, hope for the best.

But your website is a living product. And like any product, it degrades over time:

- Content gets added without proper structure
- Images get uploaded without alt text
- Third-party scripts slow things down
- SSL certificates expire
- New accessibility standards emerge

The businesses that win online aren''t the ones with the flashiest design. They''re the ones that consistently monitor, measure, and improve.

That''s the problem we''re solving at PagePulser. Think of it as a health check for your website — regular audits across accessibility, SEO, security, and performance.

We''re launching soon. If you want early access, drop a comment or DM me.

#WebsiteHealth #DigitalStrategy #Accessibility',
  LEFT('Most businesses treat their website like a brochure. Build it, forget it, hope for the best. But your website is a living product. And like any product, it degrades over time.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Post 2',
  784
);

-- ---- Blog (Week 1) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'other',
  'The State of Web Accessibility in 2026: Why 96% of Websites Are Still Failing',
  '- Deep dive into WebAIM Million data
- UK and EU regulatory landscape (EAA, PSBAR, ADA)
- Cost of non-compliance vs cost of fixing
- Actionable checklist for quick wins
- Category: Accessibility',
  LEFT('- Deep dive into WebAIM Million data
- UK and EU regulatory landscape (EAA, PSBAR, ADA)
- Cost of non-compliance vs cost of fixing
- Actionable checklist for quick wins
- Category: Accessibility', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Article 1',
  189
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'other',
  'What Google Actually Looks At: A Plain-English Guide to Core Web Vitals',
  '- LCP, INP, CLS explained without jargon
- How each metric affects rankings
- Free tools to measure them today
- Common causes of poor scores
- Category: Performance',
  LEFT('- LCP, INP, CLS explained without jargon
- How each metric affects rankings
- Free tools to measure them today
- Common causes of poor scores
- Category: Performance', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 1 - Article 2',
  170
);

-- ============================================================
-- WEEK 2 — Education & Authority
-- ============================================================

-- ---- Twitter/X (Week 2) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Alt Text Tip #1',
  'Accessibility tip #1: Every image on your site needs alt text. Decorative images? Use alt="". Meaningful images? Describe what the image conveys, not what it looks like.',
  LEFT('Accessibility tip #1: Every image on your site needs alt text. Decorative images? Use alt="". Meaningful images? Describe what the image conveys, not what it looks like.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Monday',
  169
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'SEO Myth: More Pages',
  'SEO myth: "More pages = better rankings." Reality: 10 excellent pages outperform 100 mediocre ones every time. Google rewards depth, not volume.',
  LEFT('SEO myth: "More pages = better rankings." Reality: 10 excellent pages outperform 100 mediocre ones every time. Google rewards depth, not volume.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Tuesday',
  143
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Mixed Content Security Check',
  'Security check: Is your site still loading mixed content (HTTP resources on an HTTPS page)? That padlock in the browser bar might not mean what you think it means.',
  LEFT('Security check: Is your site still loading mixed content (HTTP resources on an HTTPS page)? That padlock in the browser bar might not mean what you think it means.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Wednesday',
  165
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Third-Party Script Risk',
  'The average website loads 22 third-party scripts. Each one is a potential performance bottleneck AND a security risk. When did you last audit yours?',
  LEFT('The average website loads 22 third-party scripts. Each one is a potential performance bottleneck AND a security risk. When did you last audit yours?', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Thursday',
  149
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Colour Contrast Cheat Sheet',
  'Colour contrast ratio cheat sheet: Normal text: 4.5:1 minimum. Large text (18px+): 3:1 minimum. Your brand colours might look great but fail accessibility. Check them.',
  LEFT('Colour contrast ratio cheat sheet: Normal text: 4.5:1 minimum. Large text (18px+): 3:1 minimum. Your brand colours might look great but fail accessibility. Check them.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Friday',
  166
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Meta Description Underrated',
  'Most underrated SEO element: the meta description. It doesn''t directly affect rankings, but a well-written one can double your click-through rate from search results.',
  LEFT('Most underrated SEO element: the meta description. It doesn''t directly affect rankings, but a well-written one can double your click-through rate from search results.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Saturday',
  163
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Building in Public: Scoring Algorithm',
  'Building in public update: This week we''ve been refining our scoring algorithm. How do you weigh a critical accessibility issue vs a minor SEO suggestion? It''s harder than you''d think.',
  LEFT('Building in public update: This week we''ve been refining our scoring algorithm. How do you weigh a critical accessibility issue vs a minor SEO suggestion? It''s harder than you''d think.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Sunday',
  183
);

-- ---- Instagram (Week 2) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Alt Text: The Complete Guide',
  'Carousel - "Alt Text: The Complete Guide" — What it is, why it matters, good vs bad examples, decorative vs meaningful images. 8 slides.',
  LEFT('Carousel - "Alt Text: The Complete Guide" — What it is, why it matters, good vs bad examples, decorative vs meaningful images. 8 slides.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Monday',
  138
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'SEO Myths vs Reality',
  'Infographic - "SEO Myths vs Reality" — 5 common myths debunked with data. Clean, shareable format.',
  LEFT('Infographic - "SEO Myths vs Reality" — 5 common myths debunked with data. Clean, shareable format.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Tuesday',
  93
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Is Your Site Actually Secure?',
  'Carousel - "Is Your Site Actually Secure?" — SSL, mixed content, exposed admin panels, outdated CMS, open ports. Security checklist.',
  LEFT('Carousel - "Is Your Site Actually Secure?" — SSL, mixed content, exposed admin panels, outdated CMS, open ports. Security checklist.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Wednesday',
  131
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'How Many Scripts Reel',
  'Reel script - "How many scripts is YOUR website loading?" — Show DevTools network tab on a popular site. Count the third-party requests. React to the number.',
  LEFT('Reel script - "How many scripts is YOUR website loading?" — Show DevTools network tab on a popular site. Count the third-party requests. React to the number.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Thursday',
  155
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Colour Contrast: Good vs Bad',
  'Carousel - "Colour Contrast: Good vs Bad" — Side-by-side comparisons of text that passes vs fails WCAG. Show the actual ratios.',
  LEFT('Carousel - "Colour Contrast: Good vs Bad" — Side-by-side comparisons of text that passes vs fails WCAG. Show the actual ratios.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Friday',
  129
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Anatomy of a Perfect Meta Description',
  'Infographic - "Anatomy of a Perfect Meta Description" — Character count, keywords, call to action, what Google shows.',
  LEFT('Infographic - "Anatomy of a Perfect Meta Description" — Character count, keywords, call to action, what Google shows.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Saturday',
  114
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Scoring System Behind the Scenes',
  'Behind-the-scenes - Screenshot of PagePulser scoring system with caption about the challenge of fair scoring.',
  LEFT('Behind-the-scenes - Screenshot of PagePulser scoring system with caption about the challenge of fair scoring.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Sunday',
  106
);

-- ---- Threads (Week 2) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Alt Text: Describe the Purpose',
  'Alt text tip: don''t just describe the image. Describe the PURPOSE of the image. A photo of a team meeting isn''t "people sitting at a table" — it''s "our design team collaborating on the new dashboard." Context matters.',
  LEFT('Alt text tip: don''t just describe the image. Describe the PURPOSE of the image. A photo of a team meeting isn''t "people sitting at a table" — it''s "our design team collaborating on the new dashboard." Context matters.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Monday',
  217
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Search Intent Over Keywords',
  'SEO hot take: if your content doesn''t answer a question someone is actually asking, it doesn''t matter how optimised it is. Search intent > keyword density. Every time.',
  LEFT('SEO hot take: if your content doesn''t answer a question someone is actually asking, it doesn''t matter how optimised it is. Search intent > keyword density. Every time.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Tuesday',
  164
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Quick Security Audit',
  'Quick security audit you can do right now: 1) Visit your site 2) Add /wp-admin or /admin to the URL 3) If you see a login page, your admin panel is publicly accessible. Fix that.',
  LEFT('Quick security audit you can do right now: 1) Visit your site 2) Add /wp-admin or /admin to the URL 3) If you see a login page, your admin panel is publicly accessible. Fix that.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Wednesday',
  178
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Lazy Load Your Images',
  'The web would be 40% faster if every website just lazy-loaded their images. It''s literally one attribute: loading="lazy". Why aren''t we all doing this?',
  LEFT('The web would be 40% faster if every website just lazy-loaded their images. It''s literally one attribute: loading="lazy". Why aren''t we all doing this?', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Thursday',
  150
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Brand Colours and Contrast',
  'Designers: I love your brand colours. But if your primary button is light grey text on a white background, you''re excluding millions of people. Run your colours through a contrast checker.',
  LEFT('Designers: I love your brand colours. But if your primary button is light grey text on a white background, you''re excluding millions of people. Run your colours through a contrast checker.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Friday',
  185
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Meta Description Formula',
  'Meta description writing formula: [What the page is about] + [key benefit] + [call to action]. Keep it under 155 characters. Simple but effective.',
  LEFT('Meta description writing formula: [What the page is about] + [key benefit] + [call to action]. Keep it under 155 characters. Simple but effective.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Saturday',
  147
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Scoring Algorithm Update',
  'Building update: spent this week on the scoring algorithm. A site with one critical accessibility issue shouldn''t score the same as a site with fifty minor ones. Weighting matters.',
  LEFT('Building update: spent this week on the scoring algorithm. A site with one critical accessibility issue shouldn''t score the same as a site with fifty minor ones. Weighting matters.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Sunday',
  177
);

-- ---- LinkedIn (Week 2) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'linkedin',
  'I Audited 50 Small Business Websites. Here''s What I Found.',
  'Over the past month, I audited 50 small business websites across the UK — restaurants, law firms, accountants, trades, and e-commerce shops.

The results were eye-opening:

Accessibility:
- 92% had images without alt text
- 78% had colour contrast failures
- 64% had forms without proper labels
- 48% couldn''t be navigated by keyboard

SEO:
- 70% were missing meta descriptions on key pages
- 56% had broken heading hierarchies
- 44% had duplicate title tags

Security:
- 34% were loading mixed HTTP/HTTPS content
- 22% had publicly accessible admin panels

Performance:
- Average page load: 4.2 seconds (Google recommends under 2.5)
- 68% weren''t lazy-loading images

The most surprising finding? Every single business owner I spoke to thought their website was "fine."

This gap between perception and reality is exactly why we''re building PagePulser. Regular, automated health checks that tell you what''s actually happening — not what you assume.

What''s the most common issue you see on small business websites?',
  LEFT('Over the past month, I audited 50 small business websites across the UK — restaurants, law firms, accountants, trades, and e-commerce shops. The results were eye-opening.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Post 1',
  968
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'linkedin',
  'The European Accessibility Act: A Simple Guide for UK Businesses',
  'The European Accessibility Act (EAA) comes into force on 28 June 2025. If you sell products or services to EU customers — yes, even from the UK — this affects you.

Here''s what you need to know, without the legal jargon:

Who it applies to: Any business selling to EU consumers with a digital presence. E-commerce, SaaS, banking, transport, media.

What it requires: Your website must meet WCAG 2.1 AA standards. That means perceivable, operable, understandable, and robust for all users, including those with disabilities.

What happens if you don''t comply: Each EU member state sets its own penalties, but expect fines, market access restrictions, and potential lawsuits.

What you should do now:
1. Audit your website against WCAG 2.1 AA
2. Fix critical issues (alt text, contrast, keyboard nav, form labels)
3. Set up regular monitoring — compliance isn''t one-and-done
4. Document your efforts (shows good faith)

We''re building PagePulser to make step 1 and 3 effortless. Automated audits, clear reports, actionable guidance.

Don''t wait until June. Start now.',
  LEFT('The European Accessibility Act (EAA) comes into force on 28 June 2025. If you sell products or services to EU customers — yes, even from the UK — this affects you.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Post 2',
  1009
);

-- ---- Blog (Week 2) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'other',
  'The Complete Guide to Image Alt Text: What It Is, Why It Matters, and How to Write It',
  '- Why alt text matters for accessibility and SEO
- Good vs bad examples (with screenshots)
- Decorative vs informative images
- Alt text for different image types (charts, infographics, screenshots)
- Common mistakes
- Category: Accessibility',
  LEFT('- Why alt text matters for accessibility and SEO
- Good vs bad examples (with screenshots)
- Decorative vs informative images
- Alt text for different image types (charts, infographics, screenshots)
- Common mistakes
- Category: Accessibility', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Article 1',
  234
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'other',
  'Website Security Basics Every Business Owner Should Know',
  '- SSL/TLS explained simply
- Mixed content issues
- Admin panel exposure
- Outdated software risks
- Security headers overview
- Quick security audit checklist
- Category: Security',
  LEFT('- SSL/TLS explained simply
- Mixed content issues
- Admin panel exposure
- Outdated software risks
- Security headers overview
- Quick security audit checklist
- Category: Security', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 2 - Article 2',
  195
);

-- ============================================================
-- WEEK 3 — Building Anticipation
-- ============================================================

-- ---- Twitter/X (Week 3) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Audit in Under 5 Minutes',
  'What if you could audit your entire website — accessibility, SEO, security, and performance — in under 5 minutes? We''re making that real. Waitlist link in bio.',
  LEFT('What if you could audit your entire website — accessibility, SEO, security, and performance — in under 5 minutes? We''re making that real. Waitlist link in bio.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Monday',
  156
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Plain-English Guidance',
  'Feature preview: PagePulser doesn''t just tell you what''s wrong. It tells you WHY it matters and HOW to fix it. Every issue comes with plain-English guidance. No dev degree required.',
  LEFT('Feature preview: PagePulser doesn''t just tell you what''s wrong. It tells you WHY it matters and HOW to fix it. Every issue comes with plain-English guidance. No dev degree required.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Tuesday',
  178
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Website Credit Score',
  'We''re giving PagePulser scores out of 100 for each category — accessibility, SEO, security, performance. Like a credit score for your website. Would you check yours?',
  LEFT('We''re giving PagePulser scores out of 100 for each category — accessibility, SEO, security, performance. Like a credit score for your website. Would you check yours?', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Wednesday',
  164
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'PDF Report Preview',
  'Feature preview: PDF audit reports you can share with your team, clients, or developers. Professional, branded, and actually useful. Not a wall of code.',
  LEFT('Feature preview: PDF audit reports you can share with your team, clients, or developers. Professional, branded, and actually useful. Not a wall of code.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Thursday',
  151
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'The Mission',
  'The best part about building PagePulser? Every feature we add makes the web a little bit better. More accessible. More secure. Faster. That''s the mission.',
  LEFT('The best part about building PagePulser? Every feature we add makes the web a little bit better. More accessible. More secure. Faster. That''s the mission.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Friday',
  153
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Early Access Waitlist',
  'Early access spots are limited. If you want to be among the first to audit your site with PagePulser, join the waitlist now. Link in bio.',
  LEFT('Early access spots are limited. If you want to be among the first to audit your site with PagePulser, join the waitlist now. Link in bio.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Saturday',
  134
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'First Interaction',
  'Weekend thought: your website is often the first interaction someone has with your business. What does it say about you if it''s slow, broken, or inaccessible?',
  LEFT('Weekend thought: your website is often the first interaction someone has with your business. What does it say about you if it''s slow, broken, or inaccessible?', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Sunday',
  158
);

-- ---- Instagram (Week 3) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Introducing PagePulser',
  'Carousel - "Introducing PagePulser" — What it is, what it does, who it''s for, how it works. 6 slides, clean brand visuals.',
  LEFT('Carousel - "Introducing PagePulser" — What it is, what it does, who it''s for, how it works. 6 slides, clean brand visuals.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Monday',
  121
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Dashboard Preview',
  'Screenshot/mockup - Dashboard preview showing the four score circles (accessibility, SEO, security, performance). Caption about plain-English guidance.',
  LEFT('Screenshot/mockup - Dashboard preview showing the four score circles (accessibility, SEO, security, performance). Caption about plain-English guidance.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Tuesday',
  150
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Your Website Health Score',
  'Infographic - "Your Website Health Score" — Explain the 0-100 scoring system, what each range means, the four categories.',
  LEFT('Infographic - "Your Website Health Score" — Explain the 0-100 scoring system, what each range means, the four categories.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Wednesday',
  119
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'PDF Report Mockup',
  'Mockup - PDF report preview. Show a sample page with findings, severity levels, and fix guidance.',
  LEFT('Mockup - PDF report preview. Show a sample page with findings, severity levels, and fix guidance.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Thursday',
  91
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Every Website Deserves a Health Check',
  'Quote graphic - "Every website deserves a health check." — PagePulser brand statement. Clean, indigo brand colours.',
  LEFT('Quote graphic - "Every website deserves a health check." — PagePulser brand statement. Clean, indigo brand colours.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Friday',
  109
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Join the Waitlist Reel',
  'Story/Reel - "Join the Waitlist" — Quick 15-second reel showing the audit running, scores appearing. End with CTA.',
  LEFT('Story/Reel - "Join the Waitlist" — Quick 15-second reel showing the audit running, scores appearing. End with CTA.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Saturday',
  110
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'What Makes PagePulser Different?',
  'Carousel - "What Makes PagePulser Different?" — vs generic SEO tools, vs manual audits, vs dev-only tools. Position as the all-in-one, accessible option.',
  LEFT('Carousel - "What Makes PagePulser Different?" — vs generic SEO tools, vs manual audits, vs dev-only tools. Position as the all-in-one, accessible option.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Sunday',
  150
);

-- ---- Threads (Week 3) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Excited to Share PagePulser',
  'Been building PagePulser for a while now and I''m genuinely excited to share it. One tool that audits your website across accessibility, SEO, security, and performance. Not just errors — actual guidance. Coming very soon.',
  LEFT('Been building PagePulser for a while now and I''m genuinely excited to share it. One tool that audits your website across accessibility, SEO, security, and performance. Not just errors — actual guidance. Coming very soon.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Monday',
  218
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Audit Tools Need Context',
  'The thing I hate about most audit tools is they give you a list of errors with zero context. "Missing alt text on line 47." Cool. What do I do about it? PagePulser tells you what''s wrong, why it matters, and exactly how to fix it.',
  LEFT('The thing I hate about most audit tools is they give you a list of errors with zero context. "Missing alt text on line 47." Cool. What do I do about it? PagePulser tells you what''s wrong, why it matters, and exactly how to fix it.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Tuesday',
  225
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Health Score Like Credit Score',
  'Hot take: a website health score should be as common as a credit score. Every business should know their number. We''re making it a thing.',
  LEFT('Hot take: a website health score should be as common as a credit score. Every business should know their number. We''re making it a thing.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Wednesday',
  136
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'PDF Reports That Look Good',
  'PDF reports that don''t look like they were generated by a robot in 2005. That was a non-negotiable for us. Your audit report should be something you''re proud to share.',
  LEFT('PDF reports that don''t look like they were generated by a robot in 2005. That was a non-negotiable for us. Your audit report should be something you''re proud to share.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Thursday',
  168
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'The Web Should Work for Everyone',
  'The web should work for everyone. That''s not a radical position, it''s the original promise of the internet. PagePulser is our contribution to making that real.',
  LEFT('The web should work for everyone. That''s not a radical position, it''s the original promise of the internet. PagePulser is our contribution to making that real.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Friday',
  155
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Early Access Filling Up',
  'Early access slots are filling up. If you run a website and want to know your health score before everyone else, link in bio.',
  LEFT('Early access slots are filling up. If you run a website and want to know your health score before everyone else, link in bio.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Saturday',
  122
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Would You Want to Know?',
  'Honest question: if you found out your website had 50+ accessibility issues, would you want to know? Or would you rather not? Genuinely curious.',
  LEFT('Honest question: if you found out your website had 50+ accessibility issues, would you want to know? Or would you rather not? Genuinely curious.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Sunday',
  144
);

-- ---- LinkedIn (Week 3) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'linkedin',
  'Announcing PagePulser: Website Health Checks, Simplified',
  'I''m thrilled to announce what we''ve been building: PagePulser.

PagePulser is a website health auditing platform that scans your site across four key dimensions:

- Accessibility — Are all users, including those with disabilities, able to use your site?
- SEO — Is your site structured for search engine visibility?
- Security — Are there vulnerabilities or misconfigurations?
- Performance — Is your site fast and efficient?

But here''s what makes us different: we don''t just list errors. Every finding comes with:
- A severity rating (critical, serious, moderate, minor)
- A plain-English explanation of why it matters
- Step-by-step guidance on how to fix it
- Its impact on your overall health score

We built PagePulser because we were tired of audit tools that require a computer science degree to understand. Your website health should be as clear as your financial health.

We''re opening early access soon. If you''d like to be among the first to try it, follow this page or comment below.

#PagePulser #WebAccessibility #SEO #LaunchingSoon',
  LEFT('I''m thrilled to announce what we''ve been building: PagePulser. A website health auditing platform that scans your site across four key dimensions: Accessibility, SEO, Security, and Performance.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Post 1',
  1060
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'linkedin',
  'Why Every Website Needs Regular Health Checks',
  'You wouldn''t skip a dental checkup for 5 years. You wouldn''t ignore the warning lights on your car dashboard. So why do most businesses build a website and never check its health again?

Websites degrade over time:
- New content breaks heading structures
- Plugin updates introduce vulnerabilities
- Images get added without alt text
- Page speed creeps up as assets accumulate
- SSL certificates expire
- Regulatory requirements change

A website that was "perfect" at launch can have 100+ issues within 6 months — and you''d never know without checking.

PagePulser is designed for regular auditing. Not a one-time scan, but ongoing monitoring that keeps your website healthy, compliant, and performing.

Early access opening soon. Stay tuned.',
  LEFT('You wouldn''t skip a dental checkup for 5 years. You wouldn''t ignore the warning lights on your car dashboard. So why do most businesses build a website and never check its health again?', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Post 2',
  799
);

-- ---- Blog (Week 3) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'other',
  'Why Your Website Needs Regular Health Checks (Not Just an Annual Audit)',
  '- The website decay problem
- What changes between audits
- Regulatory compliance as an ongoing process
- Introduction to PagePulser''s approach
- Category: Guides',
  LEFT('- The website decay problem
- What changes between audits
- Regulatory compliance as an ongoing process
- Introduction to PagePulser''s approach
- Category: Guides', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Article 1',
  175
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'other',
  'Accessibility vs SEO vs Performance: Why You Shouldn''t Choose',
  '- How the three disciplines overlap
- Accessible sites rank better (the data)
- Fast sites convert better
- The case for holistic website health
- Category: SEO',
  LEFT('- How the three disciplines overlap
- Accessible sites rank better (the data)
- Fast sites convert better
- The case for holistic website health
- Category: SEO', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 3 - Article 2',
  170
);

-- ============================================================
-- WEEK 4 — Final Pre-Launch Push
-- ============================================================

-- ---- Twitter/X (Week 4) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'One Week Until Launch',
  'One week until launch. PagePulser is almost ready. We''ve been testing, refining, and obsessing over every detail. Can''t wait to show you what we''ve built.',
  LEFT('One week until launch. PagePulser is almost ready. We''ve been testing, refining, and obsessing over every detail. Can''t wait to show you what we''ve built.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Monday',
  152
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  '50 Pages in 2 Minutes',
  'Preview: PagePulser can audit a 50-page website in under 2 minutes. Every page checked for accessibility, SEO, security, and performance. Full report with scores and fix guidance.',
  LEFT('Preview: PagePulser can audit a 50-page website in under 2 minutes. Every page checked for accessibility, SEO, security, and performance. Full report with scores and fix guidance.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Tuesday',
  178
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Severity-Based Prioritisation',
  '5 days to go. Here''s a feature we''re really proud of: severity-based prioritisation. Don''t fix everything at once — fix the critical issues first. We sort them for you.',
  LEFT('5 days to go. Here''s a feature we''re really proud of: severity-based prioritisation. Don''t fix everything at once — fix the critical issues first. We sort them for you.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Wednesday',
  170
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Finding Issues Is Our Job',
  '4 days. Building PagePulser taught us something: most website issues are easy to fix once you know they exist. The hard part is finding them. That''s our job.',
  LEFT('4 days. Building PagePulser taught us something: most website issues are easy to fix once you know they exist. The hard part is finding them. That''s our job.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Thursday',
  155
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  '3 Days to Launch',
  '3 days until PagePulser launches. Last chance to join the early access list and be among the first to get your website health score. Link in bio.',
  LEFT('3 days until PagePulser launches. Last chance to join the early access list and be among the first to get your website health score. Link in bio.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Friday',
  146
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  '2 Days Final Checks',
  '2 days. The team is doing final checks. Everything is looking good. Nervous and excited in equal measure.',
  LEFT('2 days. The team is doing final checks. Everything is looking good. Nervous and excited in equal measure.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Saturday',
  97
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'twitter',
  'Launch Eve',
  'Tomorrow. PagePulser goes live. If your website could talk, what would it say about its health? Tomorrow, you''ll find out.',
  LEFT('Tomorrow. PagePulser goes live. If your website could talk, what would it say about its health? Tomorrow, you''ll find out.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Sunday',
  118
);

-- ---- Instagram (Week 4) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  '7 Days to Launch Countdown',
  'Countdown graphic - "7 Days to Launch" — Bold, clean, brand colours.',
  LEFT('Countdown graphic - "7 Days to Launch" — Bold, clean, brand colours.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Monday',
  63
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Speed Demo Reel',
  'Reel/Video - Speed demo: watch a full website audit run in real-time. Timer on screen. Show results appearing.',
  LEFT('Reel/Video - Speed demo: watch a full website audit run in real-time. Timer on screen. Show results appearing.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Tuesday',
  104
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'How PagePulser Prioritises Your Fixes',
  'Carousel - "How PagePulser Prioritises Your Fixes" — Critical → Serious → Moderate → Minor. Explain why order matters.',
  LEFT('Carousel - "How PagePulser Prioritises Your Fixes" — Critical → Serious → Moderate → Minor. Explain why order matters.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Wednesday',
  118
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Behind the Scenes Team',
  'Behind-the-scenes - Team photo or workspace shot. Caption about the journey and what''s driven the project.',
  LEFT('Behind-the-scenes - Team photo or workspace shot. Caption about the journey and what''s driven the project.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Thursday',
  103
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  '3 Days to Launch Countdown',
  'Countdown graphic - "3 Days to Launch" with waitlist CTA.',
  LEFT('Countdown graphic - "3 Days to Launch" with waitlist CTA.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Friday',
  50
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Launch Day Poll',
  'Story poll - "Are you going to audit your website on launch day? Yes / Already on the waitlist"',
  LEFT('Story poll - "Are you going to audit your website on launch day? Yes / Already on the waitlist"', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Saturday',
  90
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'instagram',
  'Launch Eve Graphic',
  'Launch eve graphic - "Tomorrow. Your website health score awaits."',
  LEFT('Launch eve graphic - "Tomorrow. Your website health score awaits."', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Sunday',
  63
);

-- ---- Threads (Week 4) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'One Week Countdown',
  'One week. Seven days. PagePulser launches next week and I genuinely can''t wait. The amount of work that''s gone into this... it''s been a journey.',
  LEFT('One week. Seven days. PagePulser launches next week and I genuinely can''t wait. The amount of work that''s gone into this... it''s been a journey.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Monday',
  141
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Fastest Audit: 47 Seconds',
  'Fun fact from testing: the fastest audit we''ve run was 47 seconds for a 30-page site. Full accessibility, SEO, security, and performance analysis. Pretty wild what you can do with good architecture.',
  LEFT('Fun fact from testing: the fastest audit we''ve run was 47 seconds for a 30-page site. Full accessibility, SEO, security, and performance analysis. Pretty wild what you can do with good architecture.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Tuesday',
  191
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Scoring Severity Debate',
  'Something we debated for weeks: how to score severity. Is one critical issue worse than ten minor ones? We think so. Our scoring reflects real-world impact, not just issue count.',
  LEFT('Something we debated for weeks: how to score severity. Is one critical issue worse than ten minor ones? We think so. Our scoring reflects real-world impact, not just issue count.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Wednesday',
  175
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Making Results Understandable',
  'The honest truth about building PagePulser: the technical part was the easy bit. The hard part was making the results understandable to someone who isn''t a developer. That''s where we focused.',
  LEFT('The honest truth about building PagePulser: the technical part was the easy bit. The hard part was making the results understandable to someone who isn''t a developer. That''s where we focused.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Thursday',
  186
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Three Days Until Launch',
  'Three days until launch. If you''re a business owner, marketer, or developer who cares about website quality — this is for you. Join the waitlist (link in bio).',
  LEFT('Three days until launch. If you''re a business owner, marketer, or developer who cares about website quality — this is for you. Join the waitlist (link in bio).', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Friday',
  160
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Final Testing: Every Pixel Matters',
  'Doing final testing today. Found a typo in a report template. Fixed it. That''s the level of detail we''re operating at. Every pixel matters.',
  LEFT('Doing final testing today. Found a typo in a report template. Fixed it. That''s the level of detail we''re operating at. Every pixel matters.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Saturday',
  138
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'threads',
  'Launch Day Tomorrow',
  'Launch day is tomorrow. Deep breath. Let''s do this.',
  LEFT('Launch day is tomorrow. Deep breath. Let''s do this.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Sunday',
  47
);

-- ---- LinkedIn (Week 4) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'linkedin',
  'Behind the Build: What We Learned Creating PagePulser',
  'In one week, we''re launching PagePulser. Before we do, I wanted to share some lessons from the build:

1. Simplicity is harder than complexity. Making a website audit understandable to a non-developer took 10x more effort than the actual scanning technology.

2. Not all issues are equal. A missing alt text on a hero image is more critical than a missing alt text on a decorative border. Context matters in scoring.

3. People don''t want data. They want guidance. Nobody cares that they have "47 WCAG 2.1 AA violations." They care about what to fix first and how.

4. Speed matters. If an audit takes 30 minutes, people won''t run it regularly. We got full-site audits down to under 2 minutes.

5. Compliance is a journey, not a destination. Websites change. Standards evolve. A one-time audit is a snapshot. Regular monitoring is a health plan.

We''ve poured everything into making PagePulser the clearest, most actionable website health tool on the market. See you at launch.',
  LEFT('In one week, we''re launching PagePulser. Before we do, I wanted to share some lessons from the build: Simplicity is harder than complexity.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Post 1',
  935
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'linkedin',
  'T-Minus 3 Days: PagePulser Launch Countdown',
  'On Monday, PagePulser goes live.

If you''ve been following along, you know what we''re building: a website health auditing platform that checks accessibility, SEO, security, and performance — and tells you exactly what to fix and why.

Here''s what you''ll get at launch:

- Full website audits (up to 50 pages)
- Health scores across 4 dimensions
- Severity-rated findings with fix guidance
- PDF export for sharing with teams and clients
- Dashboard tracking over time

Free tier available. No credit card required.

Join the early access list (link in comments) and be the first to know your website''s health score.',
  LEFT('On Monday, PagePulser goes live. If you''ve been following along, you know what we''re building: a website health auditing platform that checks accessibility, SEO, security, and performance.', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Post 2',
  689
);

-- ---- Blog (Week 4) ----

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'other',
  'Understanding Website Accessibility Scores: What the Numbers Actually Mean',
  '- How accessibility scoring works
- What goes into a WCAG audit
- Score ranges and what they indicate
- How to interpret and act on your score
- Category: Accessibility',
  LEFT('- How accessibility scoring works
- What goes into a WCAG audit
- Score ranges and what they indicate
- How to interpret and act on your score
- Category: Accessibility', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Article 1',
  178
);

INSERT INTO marketing_content (platform, title, body, preview, campaign_id, status, notes, char_count)
VALUES (
  'other',
  'The Website Launch Checklist: 25 Things to Check Before Going Live',
  '- Accessibility essentials
- SEO fundamentals
- Security basics
- Performance benchmarks
- Ties into "use PagePulser to check all of this"
- Category: Guides',
  LEFT('- Accessibility essentials
- SEO fundamentals
- Security basics
- Performance benchmarks
- Ties into "use PagePulser to check all of this"
- Category: Guides', 280),
  (SELECT id FROM marketing_campaigns WHERE name = 'Pre-Launch'),
  'draft',
  'Week 4 - Article 2',
  169
);

COMMIT;
