# Growth Strategy -- Kritano (Updated April 2026)

> **Context:** Product live, socials running ~2 weeks with slow traction. This is a concrete 90-day growth plan for an early-stage SaaS with limited budget and a solo founder.

---

## The Honest Reality

At 2 weeks in, slow growth is completely normal. Most B2B SaaS products take 3-6 months to find a repeatable acquisition channel. The goal right now is NOT scale -- it's finding what works, then doubling down.

**The three things that matter in the first 90 days:**
1. Get 50 people to use the product and talk to as many of them as possible
2. Find 2-3 acquisition channels that show early signal
3. Build the foundation for compounding growth (SEO, community presence, referral mechanics)

---

## Acquisition Channels Ranked by Effort vs Impact

| Rank | Channel | Effort | Impact | CAC | Timeline |
|------|---------|--------|--------|-----|----------|
| 1 | **SEO / Blog content** | High upfront, low ongoing | Very high (compounds) | Near zero | 3-6 months to see results |
| 2 | **Community engagement** (Reddit, forums) | Medium ongoing | High (quality leads) | Zero | 2-4 weeks for first leads |
| 3 | **LinkedIn organic** | Medium ongoing | High for B2B | Zero | 4-8 weeks to build momentum |
| 4 | **Cold outreach** (manual, per CLAUDE.md) | High ongoing | Medium-high (targeted) | Time cost only | Immediate |
| 5 | **Product-led growth** (free tier, viral loops) | Medium (already built) | High (compounds) | Zero | Ongoing |
| 6 | **Referral programme** | Low (already built) | Medium (grows with user base) | Near zero | Needs 50+ active users first |
| 7 | **Partnerships** (agencies, freelancers) | Medium | High (recurring) | Revenue share | 2-3 months to establish |
| 8 | **Show HN / Product Hunt** | Low (one-time) | Spike then fade | Zero | Save for Q3/Q4 2026 |
| 9 | **Paid ads** | Money | Variable | High early on | Skip until product-market fit confirmed |

**Focus for the first 90 days: Channels 1-5.** Everything else comes later.

---

## Detailed Funnel Strategy

```
AWARENESS                    INTEREST                     TRIAL                        PAID
Blog posts                   Free audit                   Dashboard experience         Trial expiry emails
Social media                 Audit results page           Onboarding checklist         Upgrade nudges (CRM triggers)
Reddit answers               Shareable reports            Email drip sequence          Feature gating
Cold outreach                Blog CTAs                    Referral programme           Case studies / social proof
Community engagement         Lead magnets                 In-app guidance              Agency pitch deck
```

### Stage 1: Awareness -> Interest
**Goal:** Get people to run their first free audit

| Tactic | Specifics | Expected Conversion |
|--------|-----------|---------------------|
| Blog posts with inline CTAs | Every post includes "Run a free audit on your site -- no card required" | 2-3% of blog visitors click |
| LinkedIn data posts | Share anonymised audit findings, link in first comment | 1-2% click-through |
| Reddit expert answers | Comprehensive answers with natural Kritano mention | 5-10% of readers click |
| Cold outreach emails | Personalised, sent manually, include free audit offer | 3-5% reply rate |
| Free lead magnets | Downloadable checklists/guides gated behind email | 15-25% conversion on landing page |

### Stage 2: Interest -> Trial (Registration)
**Goal:** Get them signed up

| Tactic | Specifics |
|--------|-----------|
| Frictionless signup | Email + password only. No credit card. |
| Clear value proposition on registration page | "See your accessibility, SEO, security, and performance scores in under 2 minutes" |
| Social proof on registration page | User count, audit count, testimonial |
| UTM tracking | Capture source attribution at registration (see recommendation below) |

### Stage 3: Trial -> Activation
**Goal:** First completed audit within 24 hours of registration

| Tactic | Specifics |
|--------|-----------|
| Onboarding checklist (NOT YET BUILT -- HIGH PRIORITY) | Verify email -> Add first site -> Run first audit -> Review results -> Verify domain |
| Welcome email sequence | Email 1 (immediate): "Here's how to run your first audit in 60 seconds" |
| Empty state CTAs | Dashboard shows clear "Add your first site" prompt, not an empty table |
| Time-to-first-audit target | Under 5 minutes from registration |

### Stage 4: Activation -> Paid
**Goal:** Convert free users to paid within 30 days

| Tactic | Specifics |
|--------|-----------|
| Feature gating | Free tier shows WHAT's wrong. Paid tiers show HOW to fix it. |
| Trial expiry emails (ENABLE AUTO-SEND) | Day 25: "Your Agency trial ends in 5 days". Day 30: "Your trial has ended -- here's what you'll lose" |
| Upgrade nudge triggers (already built) | Fire when users hit tier limits (audit count, site count) |
| Score improvement celebrations | "Your accessibility score improved by 12 points!" with upgrade CTA |

---

## SEO / Content Marketing Strategy

### Keyword Targets (Prioritised)

**Tier 1 -- High intent, moderate competition (target first)**
| Keyword | Monthly Volume (est.) | Content Type |
|---------|----------------------|--------------|
| website accessibility audit | 1,000+ | Landing page + blog post |
| WCAG compliance checker | 500+ | Blog post + tool comparison |
| website audit tool | 2,000+ | Comparison/review blog post |
| free website audit | 5,000+ | Landing page |
| core web vitals checker | 1,500+ | Blog post |
| website security audit | 1,000+ | Blog post |
| EAA compliance 2025 | Growing | Definitive guide |

**Tier 2 -- Long-tail, low competition (quick wins)**
| Keyword | Content Type |
|---------|--------------|
| how to check website accessibility | How-to guide |
| website accessibility checklist 2026 | Checklist blog post |
| WCAG 2.2 requirements explained | Explainer post |
| security headers checker | Tool + blog post |
| E-E-A-T scoring | Explainer post |
| answer engine optimisation | Definitive guide (first mover) |
| website health check free | Landing page |

### Blog Cadence
- **2 posts per week** (Tuesday + Thursday, per existing plan)
- Every post targets a specific keyword
- Every post includes 2-3 internal links to other posts
- Every post includes at least one inline CTA for a free audit
- British English throughout

### SEO Quick Wins (Do This Week)
1. Ensure every blog post has a proper meta title, description, and OG image
2. Add schema markup (Article, FAQOrganizationPage) to blog posts
3. Submit sitemap to Google Search Console
4. Internal link existing blog posts to each other
5. Add "related posts" section at the bottom of each blog post

---

## Community-Led Growth (Specific Tactics)

### Reddit (Start Immediately)

**Subreddits to engage in daily:**

| Subreddit | Search Terms to Monitor | How to Help |
|-----------|------------------------|-------------|
| r/webdev | "accessibility", "audit", "performance", "WCAG" | Answer technical questions with code examples and real data |
| r/SEO | "site audit", "technical SEO", "core web vitals", "tool recommendation" | Share SEO insights, compare approaches, mention Kritano when relevant |
| r/Entrepreneur | "website", "improve my site", "SEO help", "new website" | Offer to audit their site for free, give specific actionable advice |
| r/smallbusiness | "website help", "SEO", "website not ranking" | Plain-English advice, avoid jargon, offer free audit |
| r/accessibility | "testing tool", "WCAG", "audit", "compliance" | Technical contributions, reference specific WCAG criteria |
| r/SideProject | "launch", "feedback", "roast my site" | Detailed feedback on people's projects, mention audit findings |

**Weekly Reddit checklist:**
- [ ] Monday: Browse r/webdev and r/SEO, write 2 helpful comments
- [ ] Wednesday: Browse r/Entrepreneur and r/smallbusiness, write 2 helpful comments
- [ ] Friday: Browse r/SideProject and r/accessibility, write 2 helpful comments
- [ ] When relevant: Post one original insight ("I audited 50 sites and here's what I found")

### Indie Hackers
- Create a Kritano product page (do this week)
- Post first milestone update with full transparency
- Engage in SaaS and Marketing groups 2x/week

### Hacker News
- **Do NOT post Show HN yet.** Save this for when onboarding is polished and you have early case studies (Q3/Q4 2026)
- DO engage in comments on relevant threads about accessibility, web performance, SEO tools
- Monitor for relevant threads with HN Alerts or manual checks 2x/week

### Dev.to
- Cross-post technical blog posts to Dev.to (free traffic, good SEO)
- Add canonical URL pointing back to your blog
- Engage with accessibility and webdev tags

### Slack/Discord Communities
| Community | Where to Find | How to Engage |
|-----------|--------------|---------------|
| A11y Slack | web-a11y.slack.com | Answer questions, share insights, never pitch |
| IndieHackers community | Discord | Build-in-public updates, help others |
| UK Tech community Slacks | Various (search "UK tech Slack") | Network with local founders and agencies |
| WebDev Discord servers | Search Discord | Help people with web performance/accessibility questions |
| Freelance web dev communities | Facebook groups, Slack | Offer value, position as expert resource |

---

## Free Tool / Lead Magnet Ideas

### Build These (In Order of Impact)

**1. Free Website Health Score Widget (HIGH IMPACT)**
A standalone page where anyone can enter a URL and get a quick health score (simplified version of the full audit). No registration required. Score page shows: "Want the full breakdown? Sign up free."
- This is the #1 product-led growth mechanic for audit tools
- Shareable score pages become organic marketing
- Can be embedded on partner sites

**2. Downloadable Checklists (MEDIUM IMPACT, QUICK TO BUILD)**
PDF/web checklists gated behind email capture:
- "The 2026 Website Accessibility Checklist (WCAG 2.2)"
- "Website Security Headers Checklist"
- "Technical SEO Audit Checklist"
- "Core Web Vitals Optimisation Guide"

**3. Free Accessibility Statement Generator (ALREADY BUILT)**
- Promote this more heavily -- it's a genuine free tool that drives signups
- Create a dedicated landing page targeting "free accessibility statement generator"
- Share in accessibility communities

**4. "Audit Score Badge" for Websites (VIRAL LOOP)**
Let users embed a "Audited by Kritano -- Score: 87/100" badge on their website footer. Links back to Kritano. This creates:
- Social proof for the user
- Backlinks for SEO
- Brand awareness for Kritano
- Viral discovery when site visitors click the badge

---

## Referral Programme Enhancements

The existing referral programme has solid mechanics but needs:

### Immediate Fixes
1. **Add social sharing buttons** -- one-click share to LinkedIn, X, WhatsApp with pre-written messages:
   - LinkedIn: "I just found [X] accessibility issues on my website in 30 seconds using Kritano. Worth checking yours: [referral link]"
   - X: "Ran a free website audit with @kritano -- found issues I'd missed for months. Try it: [referral link]"
   - WhatsApp: "Have you checked your website's accessibility score? This tool is brilliant: [referral link]"

2. **Add milestone tiers beyond 10 referrals:**
   - 25 referrals: Free Agency tier
   - 50 referrals: Lifetime Pro
   - 100 referrals: Lifetime Agency + feature in case study

3. **Trigger referral prompt at the right moment** -- after a user sees their first score improvement, not during onboarding

### Referral Programme Promotion
- Add referral CTA to post-audit results page ("Know someone who'd find this useful?")
- Include referral link in email footers
- Monthly "top referrer" shoutout on social media

---

## Partnership & Collaboration Opportunities

### Tier 1: Agency Partnerships (Start Month 2)
- **Target:** Web development and digital marketing agencies with 5-30 employees
- **Offer:** White-label Kritano at Agency tier pricing, co-branded case studies
- **How to find them:** Use the /prospects skill, Clutch.co, DesignRush, Google "[city] web development agency"
- **Outreach approach:** Personalised email offering a free audit of 3 of their client sites. Show the value before pitching the partnership.

### Tier 2: Freelancer Network (Start Month 2)
- **Target:** Freelance web developers and SEO consultants
- **Offer:** Free Pro tier for 3 months in exchange for feedback + testimonial
- **How to find them:** LinkedIn, r/freelance, Upwork top-rated profiles, local meetups
- **Outreach approach:** "I'm building a website audit tool and would love feedback from someone with your experience. Free access in exchange for 15 minutes of your time."

### Tier 3: Tool Integrations (Month 3+)
- **WordPress plugin** -- huge potential audience, direct distribution channel
- **Shopify app** -- e-commerce stores need accessibility audits
- **Zapier integration** -- connect Kritano to agency workflows
- **API partnerships** -- let other tools embed Kritano audits

### Tier 4: Content Collaborations (Ongoing)
- Guest posts on accessibility/SEO blogs
- Podcast appearances (search for web dev, accessibility, SaaS podcasts)
- Joint webinars with agency networks
- Co-authored research ("State of UK Web Accessibility 2026")

---

## Email Nurture Sequences

### Sequence 1: Welcome / Onboarding (Trigger: Registration)
| Day | Subject | Content | Goal |
|-----|---------|---------|------|
| 0 | "Welcome to Kritano -- run your first audit in 60 seconds" | Quick-start guide, direct link to add first site | First audit |
| 1 | "Did you check your results?" | Highlight what the scores mean, link to dashboard | Return to dashboard |
| 3 | "3 quick wins from your audit" | Pull top 3 easy-fix issues from their audit results (if available) | Show value |
| 5 | "The one metric most website owners ignore" | Educational content about accessibility scoring | Build trust |
| 7 | "How [similar company] improved their score by 30 points" | Case study or example | Social proof |

### Sequence 2: Trial Expiry (Trigger: 5 Days Before Trial Ends)
| Day | Subject | Content | Goal |
|-----|---------|---------|------|
| -5 | "Your Agency trial ends in 5 days" | Recap what they've used, what they'll lose | Create urgency |
| -1 | "Last day of your Agency trial" | Feature comparison: free vs paid | Convert |
| 0 | "Your trial has ended" | Clear CTA to upgrade, emphasise what's now locked | Convert |
| +3 | "We kept your data safe" | Reassure data is preserved, offer limited-time discount | Win back |
| +7 | "Quick question" | Simple reply-to email: "What held you back from upgrading?" | Learn |

### Sequence 3: Re-Engagement (Trigger: 14 Days Inactive)
| Day | Subject | Content | Goal |
|-----|---------|---------|------|
| 14 | "Your website may have changed since your last audit" | Show time elapsed, suggest re-audit | Reactivate |
| 21 | "New feature: [latest feature]" | Highlight something new they haven't seen | Drive return |
| 30 | "We miss you (and so does your website)" | Offer one free premium audit | Last attempt |

### Sequence 4: Score Improvement Celebration (Trigger: Score Increase)
| Day | Subject | Content | Goal |
|-----|---------|---------|------|
| 0 | "Your accessibility score improved by [X] points!" | Celebrate, show before/after | Positive reinforcement |
| 0 | (Same email) "Share your progress" | Referral link + social share buttons | Viral loop |

---

## 90-Day Growth Roadmap

### Weeks 1-2 (DONE -- You Are Here)
- [x] Product live
- [x] Social accounts created and posting
- [x] Blog content started
- [x] Early access funnel active

### Weeks 3-4 (This Week and Next)
- [ ] Start daily LinkedIn + X engagement routine (80% engaging, 20% posting)
- [ ] Begin Reddit karma-building (helpful comments only, no self-promotion)
- [ ] Create Indie Hackers product page and post first milestone
- [ ] Cross-post 2 blog posts to Dev.to
- [ ] Internal link all existing blog posts to each other
- [ ] Ensure UTM tracking is on all social links
- [ ] Create 2 downloadable PDF checklists as lead magnets
- [ ] Join 2-3 Slack/Discord communities and start participating

### Weeks 5-6
- [ ] Hit 200+ LinkedIn connections in target audience
- [ ] Post first Reddit original content ("I audited X sites, here's what I found")
- [ ] Send first batch of personalised cold outreach (10-15 emails)
- [ ] Create landing page for free accessibility statement generator
- [ ] Publish 4 more blog posts (maintain 2/week cadence)
- [ ] Add social sharing buttons to referral programme
- [ ] Enable trial expiry auto-send emails

### Weeks 7-8
- [ ] Hit 100+ X followers
- [ ] Get first 3 testimonials from users (even free tier)
- [ ] Approach 5 freelancers with free Pro access offer
- [ ] Write first guest post for an external blog
- [ ] Build onboarding checklist in dashboard (HIGH PRIORITY)
- [ ] Create "audit score badge" for user websites
- [ ] First cold outreach follow-up round

### Weeks 9-10
- [ ] Hit 500+ LinkedIn connections
- [ ] Hit 250+ X followers
- [ ] First agency partnership conversation
- [ ] Publish "State of UK Web Accessibility" data post (using anonymised audit data)
- [ ] 25+ total signups from social/community channels
- [ ] First podcast appearance pitch (find 5 relevant podcasts)

### Weeks 11-12
- [ ] Review what's working, cut what isn't
- [ ] Double down on top 2 performing channels
- [ ] Hit 50+ active users target
- [ ] Prepare Product Hunt / Show HN for Q3
- [ ] First case study published
- [ ] Referral programme generating 10%+ of new signups
- [ ] Revenue from first 5-10 paid customers

---

## KPIs to Track Weekly

| Metric | Week 4 Target | Week 8 Target | Week 12 Target |
|--------|---------------|---------------|----------------|
| Total registrations | 30 | 75 | 150 |
| Activation rate (% who complete first audit) | 50% | 60% | 70% |
| Social-attributed signups | 5 | 15 | 30 |
| Blog organic sessions/week | 50 | 150 | 400 |
| LinkedIn connections (target audience) | 200 | 500 | 1,000 |
| X followers | 50 | 150 | 500 |
| Reddit referral signups | 0 | 5 | 15 |
| Cold outreach reply rate | -- | 5% | 5% |
| Free-to-paid conversion | -- | 3% | 5% |
| NPS / user satisfaction | Collect | 40+ | 50+ |

---

## The Single Most Important Thing

**If you can only do ONE thing this week:** Start the daily LinkedIn engagement routine. Comment on 10 posts/day from agency owners, freelancers, and accessibility professionals. Write thoughtful, value-adding comments (not "Great post!"). This alone will build your audience faster than any amount of posting into the void.

The algorithm rewards people who engage. Engagement begets visibility. Visibility begets followers. Followers beget customers. It starts with commenting on other people's stuff.
