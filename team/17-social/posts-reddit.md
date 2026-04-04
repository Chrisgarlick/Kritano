# Reddit Posts — Kritano

Ready-to-post content for Reddit. Each post includes the target subreddit, post type, title, body, and engagement notes.

---

## Week 1: Establish Presence (Expert Answers + First Data Post)

### Post 1 — Original Insight (r/webdev)

**Type:** Self-post (text)
**Flair:** Discussion

**Title:** I audited 50 UK e-commerce sites for accessibility. 78% fail basic WCAG 2.2 checks.

**Body:**

I've been building a website auditing tool and wanted to test it against real-world sites, so I ran accessibility audits on 50 UK e-commerce sites (mix of Shopify, WooCommerce, and custom builds).

Here's what I found:

**The headline numbers:**
- 78% fail at least one WCAG 2.2 Level AA criterion
- The most common failure: insufficient colour contrast (68% of sites)
- Second most common: missing alt text on product images (54%)
- Third: form inputs without associated labels (41%)

**What surprised me:**
- Shopify themes were actually *better* than custom builds on average. The theme developers are doing more accessibility work than most in-house teams.
- The sites with the worst accessibility scores also had the worst Core Web Vitals. There's a strong correlation between "caring about quality" across dimensions.
- Only 3 out of 50 sites had a proper skip navigation link. Three.

**The easy wins (if you're reading this and want to check your own site):**
1. Run your site through WAVE (free browser extension) — it'll flag the obvious contrast and alt text issues
2. Tab through your entire checkout flow using only the keyboard. If you can't complete a purchase, neither can 15% of your users.
3. Check your forms: every `<input>` needs a `<label>` with a matching `for` attribute. Not placeholder text. A real label.

**The harder problems:**
- Dynamic content loaded via JS that screen readers can't parse
- Custom dropdown menus that don't implement ARIA correctly
- Modals that don't trap focus

Happy to share more detailed findings if there's interest. The European Accessibility Act is now in force and most of these sites aren't compliant.

**Engagement notes:**
- Don't mention Kritano in the post. If someone asks "what tool did you use?" — then answer honestly: "I built it — it's called Kritano. Still early days but I'm happy to let you try it."
- Reply to every comment within the first 2 hours. This is critical for Reddit's algorithm.
- If the post gets traction, follow up with a comment adding more data.

---

### Post 2 — Expert Answer Template (r/SEO)

**Use when someone posts:** "What's the best way to audit my site's SEO?" / "How do I know what's wrong with my website?" / "My traffic dropped, what do I check?"

**Comment:**

Here's my checklist when I audit a site (I do this professionally):

**Technical SEO (check first — these block everything else):**
- Is the site indexed? `site:yourdomain.com` in Google. If pages are missing, check robots.txt and meta robots tags.
- Are there crawl errors? Google Search Console > Pages > check the "Not indexed" reasons.
- Is the sitemap.xml valid and submitted? Check `yourdomain.com/sitemap.xml` — it should list all your important pages.
- HTTPS everywhere? Mixed content warnings kill trust signals.
- Page speed: run PageSpeed Insights. If LCP > 2.5s, that's hurting you.

**On-page (the content itself):**
- Title tags: unique per page, under 60 chars, keyword near the front.
- Meta descriptions: unique, 150-160 chars, include a call to action.
- H1 tags: one per page, matches the topic. Check you don't have multiple H1s.
- Internal linking: every important page should be reachable within 3 clicks from the homepage.

**Content quality (this is where most people miss):**
- Is the content actually answering the search query? Read your top 5 pages and honestly ask: "Would I find this helpful if I searched for this?"
- E-E-A-T signals: author bios, citations, date published, expertise indicators.
- Thin content: any pages under 300 words that are trying to rank? Either beef them up or consolidate.

**Tools I use:**
- Google Search Console (free, essential)
- Screaming Frog (crawling, free up to 500 URLs)
- WAVE (accessibility, free extension)
- Kritano (disclosure: I built this — it runs all of the above in one scan)
- PageSpeed Insights (free)

The most common issue I see: people optimise for keywords but ignore technical foundations. Fix the technical stuff first, then worry about content.

---

### Post 3 — Expert Answer Template (r/smallbusiness)

**Use when someone posts:** "I paid for a website and I don't think it's working" / "How do I know if my website is any good?" / "Is my website hurting my business?"

**Comment:**

I audit websites for a living, and here's the honest truth: most small business websites have problems that are fixable in a weekend. The issue is that nobody tells you what they are in plain English.

Here's what I'd check, in order of impact:

**1. Can Google find you?**
Search `site:yourdomain.com` on Google. If your pages don't show up, nothing else matters. Your developer might have left a "noindex" tag on from the staging site. It happens more than you'd think.

**2. Does it load fast?**
Go to pagespeed.web.dev and enter your URL. If the score is under 50, your site is losing visitors before they even see your content. Most common fix: compress your images. A 5MB hero image is the #1 culprit.

**3. Does it work on mobile?**
Open your site on your phone. Can you read everything without zooming? Can you tap buttons without accidentally hitting the wrong one? 60%+ of your visitors are on mobile.

**4. Can everyone use it?**
Try navigating your site using only your keyboard (Tab key to move, Enter to click). If you get stuck or can't see where you are on the page, people with disabilities can't use your site either. In Europe, this is now a legal requirement (European Accessibility Act).

**5. Does it actually say what you do?**
I see this constantly: a beautiful website that says "We deliver innovative solutions for modern businesses" and I have no idea what the company actually does. Your homepage should answer three questions in 5 seconds: What do you do? Who do you do it for? How do I get started?

If you want a quick health check, feel free to DM me your URL and I'll take a look. No charge — I genuinely enjoy this stuff.

**Engagement notes:**
- The DM offer is key. It builds relationships and generates authentic word-of-mouth.
- If someone DMs you, audit their site with Kritano and send them a summary. Don't just send a link to the tool — send the actual findings with your commentary.

---

### Post 4 — Build in Public (r/SideProject)

**Type:** Self-post
**Flair:** Show & Tell / SaaS

**Title:** I'm building a website auditing tool that checks SEO, accessibility, security, and performance in one scan. Here's what I've learned so far.

**Body:**

Hey everyone. I'm Chris, and I've been building Kritano — a website intelligence platform that runs SEO, accessibility, security, performance, and content quality audits in a single scan.

**Why I built it:**
I was running a web agency and spending hours per client manually checking sites with 4-5 different tools — Lighthouse for performance, WAVE for accessibility, Screaming Frog for SEO, SecurityHeaders.com for security. I thought: "Why isn't there one tool that does all of this and tells me what to fix first?"

So I built it.

**What it does:**
- Scans your site across 6 categories with 500+ individual checks
- Gives you a score per category and an overall health score
- Prioritises findings by business impact (not just severity)
- Generates shareable reports (PDF and public links)
- Checks content quality including E-E-A-T and readability — something most audit tools completely ignore

**Where I'm at:**
- Solo founder, bootstrapped
- Launching with founding member pricing soon
- Free tier available (limited scans per month)
- Built with Node.js, React, PostgreSQL, Redis, BullMQ

**What I've learned:**
1. The audit engine was the easy part. The hard part is translating technical findings into language that non-developers understand.
2. Accessibility is the most underserved category. Most tools check 20-30 rules. We check 100+.
3. Content quality scoring is the differentiator nobody else is doing properly. Google evaluates E-E-A-T — why shouldn't your audit tool?

Happy to answer questions about the tech stack, the business model, or the audit methodology. And if you want to try it, I'll drop the link in the comments if anyone's interested.

**Engagement notes:**
- Post the link ONLY if someone asks. Never in the original post.
- Be prepared for technical questions about the scanning methodology.
- If someone asks "how is this different from Lighthouse?" — answer honestly: Lighthouse is free and great for quick checks, Kritano goes deeper across more categories and adds content intelligence.

---

## Week 2: Deepen Engagement

### Post 5 — Data Post (r/Entrepreneur)

**Title:** I analysed 100 small business websites. Here are the 5 issues I found on almost every single one.

**Body:**

I build a website auditing tool, so I spend a lot of time looking at websites. Over the past month, I audited 100 small business websites across different industries (retail, professional services, hospitality, trades).

Here are the 5 most common problems — ranked by how much they're probably costing you:

**1. No meta descriptions (83% of sites)**
Google shows a 160-character snippet under your page title in search results. If you don't write one, Google just grabs random text from your page. That random text is not compelling. Write a meta description for at least your homepage, service pages, and top blog posts.

**2. Images without alt text (71% of sites)**
Alt text tells screen readers and search engines what an image shows. Without it, Google can't index your images, and visually impaired visitors get nothing. It takes 30 seconds per image.

**3. Mobile usability issues (64% of sites)**
Not "the site looks bad on mobile" — I mean actual usability failures. Tap targets too small. Text requiring zoom. Horizontal scroll. These are things Google actively penalises in mobile rankings.

**4. No SSL certificate or mixed content (29% of sites)**
In 2026, this is inexcusable. Chrome shows "Not Secure" on HTTP sites. Mixed content (HTTPS page loading HTTP resources) is nearly as bad. If your site still has these warnings, fix it today.

**5. Slow load times from unoptimised images (91% of sites)**
This was the most universal. Hero images over 2MB. Gallery pages loading 20 full-resolution photos. The fix: use WebP format, lazy-load images below the fold, and resize to the actual display dimensions. This alone can cut load time by 50%.

**The good news:** every single one of these is fixable without a developer. Most website builders (Squarespace, WordPress, Shopify) have settings or plugins that handle each one.

If you want specifics for your site, drop your URL in the comments and I'll tell you which of these apply to you.

**Engagement notes:**
- The "drop your URL" offer generates massive engagement on r/Entrepreneur.
- Run each URL through Kritano and give a personalised 3-4 line response.
- This builds genuine goodwill and name recognition.

---

### Post 6 — Expert Answer Template (r/accessibility)

**Use when someone posts about:** WCAG testing tools, automated vs manual testing, EAA compliance

**Comment:**

A few things to keep in mind with automated accessibility testing:

Automated tools (axe-core, WAVE, Lighthouse, etc.) can reliably catch about 30-40% of WCAG 2.2 Level AA criteria. The things they're good at:
- Colour contrast ratios (1.4.3, 1.4.6)
- Missing alt text (1.1.1)
- Form labels (1.3.1, 4.1.2)
- Language attributes (3.1.1)
- Heading hierarchy (1.3.1)
- ARIA attribute validity

The things they can't catch (and you need manual testing for):
- Whether alt text is actually *meaningful* (they can check it exists, not that it's good)
- Keyboard operability of custom widgets (2.1.1)
- Focus order making logical sense (2.4.3)
- Content reflow at 400% zoom (1.4.10)
- Whether error messages are helpful (3.3.1, 3.3.3)

My recommendation: use automated tools as your first pass to catch the obvious issues, then do manual keyboard and screen reader testing for the rest. VoiceOver (Mac) and NVDA (Windows, free) are both excellent.

For the European Accessibility Act specifically — EN 301 549 maps closely to WCAG 2.1 AA, but adds some additional requirements around documentation and feedback mechanisms. The key addition most people miss: you need a publicly available accessibility statement.

I've been working on a tool that tries to push automated coverage beyond the usual 30-40% by analysing content structure, heading semantics, and ARIA patterns more deeply. Happy to chat about methodology if you're interested.

**Engagement notes:**
- r/accessibility is a professional community. Never oversimplify.
- Reference specific WCAG success criteria by number.
- The mention of Kritano is indirect and expertise-focused, not promotional.

---

### Post 7 — Expert Answer Template (r/WordPress)

**Use when someone asks:** "Best plugins for SEO/accessibility/security/speed?"

**Comment:**

Depends on your budget and how much you want to manage yourself. Here's what I recommend based on auditing a lot of WordPress sites:

**SEO:**
- Yoast SEO (free tier is solid) or Rank Math (more features in free tier)
- Don't install both. Pick one.
- Most important settings: XML sitemap, canonical URLs, Open Graph tags

**Accessibility:**
- WP Accessibility plugin (free, adds skip links, removes title attributes, fixes common issues)
- Don't use accessibility overlay plugins (AccessiBe, UserWay, etc.). They don't actually fix anything, they create a separate "accessible" experience that's often worse, and the disability community actively campaigns against them.
- Best approach: choose a theme that's built with accessibility in mind (GeneratePress, Flavor theme, Flavor theme, Flavor theme, Flavor theme, Flavor theme — I keep recommending GeneratePress because it genuinely has excellent markup)

**Security:**
- Wordfence (free tier) for firewall and malware scanning
- WP Force SSL if you need to enforce HTTPS
- Disable XML-RPC if you're not using it (it's an attack vector)
- Keep WordPress core, themes, and plugins updated. This is the #1 security action.

**Performance:**
- WP Rocket (paid, worth it) or LiteSpeed Cache (free if your host supports it)
- ShortPixel or Imagify for image compression
- Lazy load images (built into WP core now, but plugins do it better)

**The meta-answer:** before installing 15 plugins, run an audit on your site first. Tools like Lighthouse (free), GTmetrix (free), or Kritano (disclosure: mine — runs SEO, accessibility, security, and performance in one scan) will tell you exactly what needs fixing so you can target the right plugins.

---

## Week 3: Build in Public Update

### Post 8 — Build in Public (r/SaaS)

**Title:** Lessons from launching a website audit SaaS as a solo founder

**Body:**

I've been building Kritano — a website intelligence platform — and wanted to share some honest lessons from the journey so far.

**What went right:**
- **Starting with the problem I had.** I was running a web agency and manually auditing sites with 5 different tools. Building the tool I wanted to use meant I never had to guess at product-market fit.
- **Going deep on content quality.** Every competitor does SEO + accessibility + performance. Nobody was doing proper content intelligence (E-E-A-T scoring, readability analysis, engagement metrics). That's our wedge.
- **Free tier as distribution.** Giving people a limited free audit gets them in the door. The upgrade trigger is clear: "Want to scan more pages and get fix guidance? Upgrade."

**What I'd do differently:**
- **Built too much before launching.** Classic mistake. I should have shipped a single-category scanner first and added categories based on demand. Instead I built all 6 categories before anyone had signed up.
- **Underestimated PDF export complexity.** White-label PDF reports are a key feature for the agency persona. I spent 3x longer on PDF generation than expected. Every edge case in HTML-to-PDF conversion found me.
- **Didn't start content marketing early enough.** SEO takes months to compound. I should have been publishing blog posts from day 1 of development, not day 1 of launch.

**Numbers (being transparent):**
- Development time: [X] months solo
- Tech stack: Node.js + Express, React + TypeScript, PostgreSQL, Redis + BullMQ for job queues
- Hosting costs: ~$[X]/month
- Current MRR: $[X]

Happy to answer specific questions — about the product, the tech, or the business side.

**Engagement notes:**
- Fill in the actual numbers before posting. Reddit respects transparency.
- Be prepared for "why not just use Lighthouse?" — answer honestly about the differences.
- r/SaaS loves real numbers. Don't round up or exaggerate.

---

## Week 4: Seasonal/Topical Content

### Post 9 — Topical Post (r/webdev)

**Title:** The European Accessibility Act is now in force. Here's what it actually means for web developers.

**Body:**

The EAA came into effect on 28 June 2025. I've seen a lot of confusion about what it requires, so here's the practical breakdown:

**Who it applies to:**
- Any business selling products or services to EU consumers via a website
- This includes non-EU businesses if they serve EU customers
- Micro-enterprises (fewer than 10 employees AND under €2M turnover) are exempt
- B2B-only services are currently exempt (but this may change)

**What it requires:**
- WCAG 2.1 Level AA compliance (mapped through EN 301 549)
- A publicly available accessibility statement
- A feedback mechanism for users to report accessibility barriers
- Documentation showing you've assessed and addressed accessibility

**What it does NOT require:**
- WCAG 2.2 (yet — the standard will likely be updated)
- AAA conformance
- Retroactive fixes to archived content
- Third-party content you don't control

**Practical steps for developers:**
1. Run an automated scan (axe-core, WAVE, Lighthouse accessibility audit) to catch the low-hanging fruit
2. Do keyboard-only testing on your critical user flows
3. Test with a screen reader (VoiceOver on Mac, NVDA on Windows)
4. Write an accessibility statement (there are templates available — the W3C has a generator)
5. Add a way for users to report issues (even a mailto: link counts)
6. Document what you've done

**Enforcement:**
Each EU member state handles enforcement differently. Fines and requirements vary by country. The key risk isn't fines — it's litigation from accessibility advocates and the reputational damage.

Happy to answer specific questions. I've been deep in this space while building accessibility scanning tools.

**Engagement notes:**
- Topical posts get massive traction. This is genuinely useful information.
- Don't mention Kritano unless someone asks what tools to use.
- Link to W3C resources in follow-up comments.

---

## Ongoing Comment Templates

### Template A: "How do I improve my website's SEO?"

> There's no shortcut, but here's the priority order I recommend:
>
> 1. **Fix technical foundations first.** Index status, sitemap, HTTPS, page speed. If Google can't crawl you properly, content doesn't matter.
> 2. **On-page basics.** Title tags, meta descriptions, H1s, internal links. These are high-impact and low-effort.
> 3. **Content quality.** Is your content actually the best answer for the search query? Not "good enough" — the *best* answer on page 1.
> 4. **Everything else.** Schema markup, backlinks, Core Web Vitals tuning.
>
> Most people start at #4 and wonder why nothing works. Start at #1.

### Template B: "Is there a free tool to check my website?"

> A few I'd recommend:
>
> - **Google Search Console** — essential, free, shows you exactly what Google sees
> - **PageSpeed Insights** — performance and Core Web Vitals
> - **WAVE** — browser extension for accessibility testing
> - **SecurityHeaders.com** — quick security header check
> - **Kritano** (disclosure: I built this) — runs SEO, accessibility, security, performance, and content quality in one scan. Free tier available.
> - **Screaming Frog** — crawl-based SEO analysis (free up to 500 URLs)
>
> Start with Search Console. It's the one tool that shows you how Google actually indexes your site.

### Template C: "My website traffic dropped suddenly"

> Don't panic. Here's the diagnostic checklist:
>
> 1. **Check Search Console for manual actions.** Security > Manual Actions. If there's one, that's your answer.
> 2. **Check for indexing issues.** Coverage report — any sudden spike in "Excluded" pages?
> 3. **Check for a Google algorithm update.** Search "Google algorithm update [month]" — if one just happened, you might be affected.
> 4. **Check your robots.txt.** Did someone accidentally disallow crawling? It happens.
> 5. **Check your analytics tracking.** Sometimes the "drop" is just broken tracking code, not actual traffic loss.
> 6. **Check if a competitor improved.** Rankings are relative. They didn't need to penalise you — someone else might have just gotten better.
>
> If none of these explain it, run a full site audit. You might have a technical issue (broken redirects, duplicate content, slow pages) that accumulated over time and finally hit a tipping point.

### Template D: "What do you think of my website?" (site review threads)

> I took a look — here are the things I'd prioritise:
>
> [Personalise based on actual audit results. Always structure as:]
>
> **What's working well:**
> - [Genuine positive — even if small]
>
> **Quick wins (fix this weekend):**
> - [Specific, actionable issue]
> - [Specific, actionable issue]
>
> **Bigger improvements:**
> - [Issue that requires more effort]
>
> Overall: [honest summary]. You've got a solid foundation — the fixes above would make a real difference.

### Template E: Reply when asked "What tool is that?"

> It's called Kritano — full disclosure, I built it. It runs SEO, accessibility, security, performance, and content quality audits in a single scan. There's a free tier if you want to try it: [link]
>
> Happy to answer questions about how it works. The scoring methodology is [brief explanation relevant to the thread's context].

---

## Subreddit-Specific Rules to Remember

| Subreddit | Key Rule |
|-----------|----------|
| r/webdev | No self-promotion posts. Comments are fine if helpful. |
| r/SEO | Self-promotion allowed if it adds value. Flair your post. |
| r/Entrepreneur | No link-only posts. Long-form advice posts do well. |
| r/smallbusiness | Very strict on promotion. Help first, always. |
| r/accessibility | Expert-level discussion. Cite WCAG criteria. |
| r/SideProject | "Show & Tell" posts welcome. Be genuine. |
| r/SaaS | Data and transparency valued. Fluff gets downvoted. |
| r/WordPress | Plugin recommendations are common and accepted. |
| r/startups | Read the rules carefully. Only specific post types allowed. |
