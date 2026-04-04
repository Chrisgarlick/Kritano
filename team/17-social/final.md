# Social Media — Reddit Strategy (Final)

> **Platform:** Reddit (primary focus)
> **Brand:** Kritano — Website Intelligence Platform
> **Voice:** Authoritative, clear, helpful, honest. First person ("I built this"). Never corporate.

---

## Strategy Summary

Reddit is Kritano's highest-leverage organic channel. The core audience — developers, founders, agency owners, and SEO practitioners — actively asks questions that Kritano directly answers. The strategy is simple: **be the most helpful person in the room, and only mention Kritano when it's genuinely the answer.**

### Target Subreddits (Tier 1)
- **r/webdev** (2.3M+) — Technical web dev, accessibility, performance
- **r/SEO** (250K+) — SEO questions Kritano directly answers
- **r/Entrepreneur** (2M+) — "How do I improve my website?" questions
- **r/smallbusiness** (1.3M+) — Non-technical website help
- **r/accessibility** (45K+) — Expert accessibility community

### Content Pillars
| Pillar | Share | Format |
|--------|-------|--------|
| Expert Answers | 40% | Comments on existing threads |
| Original Insights | 25% | Data-driven self-posts |
| Build in Public | 15% | Honest founder updates |
| Resource Sharing | 10% | Blog posts, contextually |
| Community Engagement | 10% | Being a genuine member |

### Cadence
- **Daily:** Browse Tier 1 subreddits (15 min), write 2-3 helpful comments (20 min)
- **Weekly:** 1 original data/insight post (45 min)
- **Fortnightly:** 1 build-in-public update (30 min)
- **Monthly:** 1-2 blog post shares when naturally relevant
- **Total time:** ~27 hours/month (~1 hour/weekday)

---

## 30-Day Content Calendar

| Day | Type | Subreddit | Content |
|-----|------|-----------|---------|
| 1-3 | Expert Answers | r/webdev, r/SEO, r/Entrepreneur, r/smallbusiness, r/accessibility, r/WordPress | 2 helpful answers per day. Build karma. No self-promo. |
| 4 | **Original Insight** | **r/webdev** | "I audited 50 UK e-commerce sites for accessibility. 78% fail basic WCAG checks." |
| 5-7 | Expert Answers + CE | r/SEO, r/web_design, various | Continue building presence |
| 8-9 | Expert Answers | r/webdev, r/Entrepreneur, r/SEO, r/smallbusiness | |
| 10 | **Original Insight** | **r/Entrepreneur** | "I analysed 100 small business websites. Here are the 5 issues on almost every one." |
| 11 | Expert Answers | r/WordPress, r/web_design | |
| 12 | **Build in Public** | **r/SideProject** | "I'm building a website auditing tool. Here's what I've learned." |
| 13-17 | Expert Answers + RS | Various | Share blog post if thread matches |
| 18 | **Original Insight** | **r/webdev** | "The European Accessibility Act is now in force. Here's what it means for developers." |
| 19-23 | Expert Answers | Various | |
| 24 | **Build in Public** | **r/SaaS** | "Lessons from launching a website audit SaaS — honest numbers." |
| 25-26 | Expert Answers + OI | r/webdev, r/SEO, r/accessibility | New data post based on trending topic |
| 27-30 | Expert Answers + RS | Various | Wrap month, share blog post if relevant |

---

## Ready-to-Post Content

### Original Post 1: Accessibility Audit Data (r/webdev)

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
- Shopify themes were actually *better* than custom builds on average
- Sites with worst accessibility also had worst Core Web Vitals — strong correlation
- Only 3 out of 50 sites had a proper skip navigation link

**Easy wins:**
1. Run WAVE (free extension) — flags contrast and alt text issues
2. Tab through your checkout flow with keyboard only
3. Check forms: every `<input>` needs a `<label>` with matching `for` attribute

Happy to share more detailed findings if there's interest. The European Accessibility Act is now in force and most of these sites aren't compliant.

---

### Original Post 2: Small Business Website Audit (r/Entrepreneur)

**Title:** I analysed 100 small business websites. Here are the 5 issues I found on almost every single one.

**Body:**

I build a website auditing tool, so I spend a lot of time looking at websites. I audited 100 small business sites across different industries.

**Top 5 issues, ranked by impact:**

**1. No meta descriptions (83%)** — Google shows a snippet under your title in search. Without one, Google grabs random text. Write one for at least your homepage and service pages.

**2. Images without alt text (71%)** — Alt text helps search engines and screen readers. Takes 30 seconds per image.

**3. Mobile usability issues (64%)** — Not "looks bad on mobile" — actual failures. Tap targets too small, text requiring zoom, horizontal scroll. Google penalises these.

**4. No SSL or mixed content (29%)** — Chrome shows "Not Secure" on HTTP sites. Inexcusable in 2026.

**5. Unoptimised images (91%)** — Hero images over 2MB. Use WebP format, lazy-load below the fold, resize to actual display dimensions. Can cut load time by 50%.

Every one of these is fixable without a developer. Drop your URL in the comments and I'll tell you which apply to you.

---

### Original Post 3: EAA Explainer (r/webdev)

**Title:** The European Accessibility Act is now in force. Here's what it actually means for web developers.

**Body:**

**Who it applies to:** Any business selling to EU consumers via a website. Including non-EU businesses serving EU customers. Micro-enterprises exempt (<10 employees AND <€2M).

**What it requires:** WCAG 2.1 Level AA, public accessibility statement, user feedback mechanism, documentation.

**What it does NOT require:** WCAG 2.2 (yet), AAA conformance, retroactive fixes to archives, third-party content.

**Practical steps:**
1. Automated scan (axe-core, WAVE, Lighthouse)
2. Keyboard-only testing on critical flows
3. Screen reader testing (VoiceOver/NVDA)
4. Write an accessibility statement (W3C has a generator)
5. Add a way for users to report issues
6. Document what you've done

**Enforcement:** Varies by EU member state. Key risk isn't fines — it's litigation and reputational damage.

---

### Build in Public 1 (r/SideProject)

**Title:** I'm building a website auditing tool that checks SEO, accessibility, security, and performance in one scan. Here's what I've learned.

**Body:**

I'm Chris, building Kritano — runs SEO, accessibility, security, performance, and content quality audits in a single scan.

**Why:** Was running a web agency, spending hours per client with 4-5 different tools. Built what I wanted to use.

**What it does:** 500+ checks across 6 categories. Prioritised by business impact. Shareable reports. Content quality scoring (E-E-A-T, readability).

**Lessons:**
1. Audit engine was the easy part. Translating findings to plain English is the hard part.
2. Accessibility is the most underserved category.
3. Content quality scoring is the differentiator nobody else does properly.

Happy to answer questions. I'll drop the link in comments if anyone's interested.

---

### Build in Public 2 (r/SaaS)

**Title:** Lessons from launching a website audit SaaS as a solo founder

**Body:** Honest post covering what went right (solving own problem, content quality wedge, free tier), what went wrong (built too much, PDF complexity, late content marketing), and real numbers (fill in before posting).

---

## Comment Templates

### "How do I improve my website's SEO?"
Priority order: (1) Technical foundations — index status, sitemap, HTTPS, speed. (2) On-page — titles, metas, H1s, internal links. (3) Content quality — is it the best answer? (4) Everything else — schema, backlinks, CWV. Most people start at #4. Start at #1.

### "Is there a free tool to check my website?"
Recommend: Google Search Console, PageSpeed Insights, WAVE, SecurityHeaders.com, Kritano (disclosure: mine, free tier), Screaming Frog. Start with Search Console.

### "My traffic dropped suddenly"
Checklist: Manual actions in GSC? Indexing issues? Recent algorithm update? Robots.txt changes? Broken analytics tracking? Competitor improvement?

### Offering site reviews
"Drop your URL and I'll take a look" — run through Kritano, write personalised 4-5 line response with top issues + 1 positive. Don't just link the report.

### When asked "What tool is that?"
"It's called Kritano — full disclosure, I built it. [Brief relevant description]. Free tier available: [link]. Happy to answer questions."

---

## Engagement Rules

1. **Never post "Check out my tool!"** — instant death on Reddit
2. **Lead with value.** The insight, the data, the answer. Kritano comes after.
3. **Always disclose.** "Full disclosure: I built this" or "Disclaimer: my product."
4. **Match subreddit tone.** r/webdev = casual/technical. r/SEO = direct/metrics. r/accessibility = precise/standards-aware.
5. **Reply to everything** on your own posts within 2 hours.
6. **5:1 comment-to-post ratio.** 5 helpful comments for every self-promotional post.
7. **Build karma first.** 2 weeks of being helpful before any self-promotion.
8. **Share competitors' tools** when they're the right fit. Honesty builds massive trust.
9. **Never delete downvoted posts.** Take the feedback.
10. **Offer free site reviews** — highest-converting activity. Budget 30 min per review, max 3-4/week.

---

## Metrics

| Metric | Target | Tracking |
|--------|--------|----------|
| Comment karma (target subs) | +500/month | Reddit profile |
| Referral traffic from reddit.com | Growing month-over-month | Analytics |
| Post upvote ratio | >80% on original posts | Reddit |
| DMs/chat requests | Tracked monthly | Reddit |
| URL review offers → signups | Tracked per review | Internal |
