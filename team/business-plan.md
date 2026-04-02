<!-- Version: 4 | Department: manager | Updated: 2026-03-29 -->
<!-- Changelog:
  V4: Added mobile audit pass, cold outreach log, NRD improvements, kt_live_ API keys, KritanoBot identity
  V3: Anti-fragile rewrite with fallback options
  V2: Competitive landscape analysis, trademark risk, pricing threat assessment
  V1: Initial business plan
-->

# Business Plan: Kritano

**Prepared:** 24 March 2026 | **Updated:** 29 March 2026
**Version:** 4.0 — Updated with mobile crawler, outreach log, and infrastructure improvements.
**Author:** Chris Garlick, Founder

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Company Overview](#2-company-overview)
3. [Problem & Opportunity](#3-problem--opportunity)
4. [Solution & Product](#4-solution--product)
5. [Market Analysis](#5-market-analysis)
6. [Competitive Landscape](#6-competitive-landscape)
7. [Business Model & Pricing](#7-business-model--pricing)
8. [Anti-Fragile Marketing & Growth](#8-anti-fragile-marketing--growth)
9. [Revenue Diversification](#9-revenue-diversification)
10. [Operations & Team](#10-operations--team)
11. [Financial Projections](#11-financial-projections)
12. [Funding Requirements](#12-funding-requirements)
13. [Legal & Compliance](#13-legal--compliance)
14. [Anti-Fragile Risk Management](#14-anti-fragile-risk-management)
15. [Operational Resilience Playbook](#15-operational-resilience-playbook)
16. [Milestones & Roadmap](#16-milestones--roadmap)
17. [The 18-Month Survival Matrix](#17-the-18-month-survival-matrix)
18. [Appendix](#18-appendix)

---

## 1. Executive Summary

Kritano is a website intelligence and health auditing SaaS platform that gives freelancers, digital agencies, and in-house teams a single, authoritative view of their website's health across six dimensions: accessibility, SEO, security, performance, content quality, and structured data.

**The problem:** Businesses face mounting legal and commercial pressure to maintain accessible, performant, secure websites. The European Accessibility Act (enforced June 2025) creates compliance liability across 27 EU member states. ADA lawsuits in the US hit a record 4,605 in 2023. Google's Core Web Vitals directly influence search rankings. Yet the tools available to SMBs and agencies are either enterprise-priced (Siteimprove at ~$28,000/year avg), single-category (A11y Pulse for accessibility at $19–159/mo), or fundamentally flawed (accessiBe, fined $1M by the FTC in January 2025). There is no unified, affordable, self-serve website health platform for the businesses that need it most.

**The solution:** Kritano runs automated, multi-engine audits with scheduling from 15-minute to 7-day intervals, produces white-label PDF/CSV/JSON exports, and provides a public REST API — all starting at $19/month. The platform includes 500+ audit rules, historical trend tracking, team collaboration, and a referral programme. The Agency tier ($99/month) enables agencies to deliver branded health reports to clients without building internal tooling.

**The market:** The digital accessibility software market alone is ~$897M in 2025, projected to exceed $1.4B by 2027. Combined with website auditing/SEO tools ($4B) and performance monitoring ($1.2B), the total addressable market is ~$3.7B. The collapse of the overlay segment (350,000+ customers seeking legitimate alternatives) creates an additional near-term acquisition opportunity. Kritano targets a serviceable obtainable market of ~$186K ARR (~408 paying customers) within three years — 0.033% SAM penetration.

**Anti-fragile by design:** This plan is built so that no single channel failure, pricing misstep, or competitive threat kills the business. Every marketing channel has Plan A → Plan B → Plan C fallbacks. Revenue is diversifiable beyond SaaS subscriptions with minimal engineering. Infrastructure costs are so low ($28/month) that the business is cash-positive from its second customer. If everything organic fails, emergency growth options (partnerships, consulting, lifetime deals) can bridge to product-market fit. The 18-month survival matrix provides explicit pivot triggers at Month 3, 6, 9, and 12.

**Business model:** Freemium SaaS with five tiers — Free ($0), Starter ($19/month), Pro ($49/month), Agency ($99/month), and Enterprise ($199/month). Gross margins of 88–93%. Unit economics: blended ARPU of $25/month (Year 1, dragged by founding discounts), rising to $38 by Year 3.

**Financial projections (realistic base case):**

| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Paying Customers (EoY) | 103 | 235 | 408 |
| — of which Agency/Enterprise | 10 | 29 | 69 |
| Total Revenue | $19,354 | $70,500 | $155,600 |
| Operating Costs (excl. founder drawings) | $2,820 | $7,660 | $49,380 |
| Net before founder drawings | $16,534 | $62,840 | $106,220 |

Year 3's entire customer base — 408 people — would fit in a single conference room. In a market of 22,000 UK digital agencies and 1.2 million UK freelancers, that is 0.03% penetration.

**Funding:** Self-funded / bootstrapped. Monthly infrastructure costs are ~$28 at launch. Cash break-even is achieved at 2 paying customers. Founder drawings break-even (£3,000/month via salary + dividends) requires ~100 customers — projected around Month 18–24.

**Why now:** The European Accessibility Act created a compliance obligation for every business with a public-facing website in the EU. The overlay segment is collapsing — accessiBe was fined $1M by the FTC (January 2025), UserWay faces class-action lawsuits. This creates a wave of demand from businesses seeking legitimate alternatives. Meanwhile, no competitor offers multi-category auditing at under $100/month with self-serve signup. The closest comparable product, Silktide, starts at ~$1,500/month. Kritano enters a market with urgent, regulation-driven demand, a collapsing incumbent category, and a pricing gap 15x wide.

---

## 2. Company Overview

**Mission:** To give every website owner — regardless of team size or budget — the same depth of website intelligence previously available only to enterprise teams with dedicated technical staff.

**Vision:** A world where every website meets the same standard of accessibility, performance, and quality as the best-resourced organisations on the internet — and where website owners can see and act on problems before users ever encounter them.

**Values:**
1. **Clarity over completeness.** A finding that can be acted on is worth ten that cannot.
2. **Honesty at the cost of comfort.** Real scores, real issues, real impact.
3. **Accessibility as non-negotiable.** The product that audits accessibility must itself be accessible.
4. **Independence by design.** Bootstrapped. Product decisions driven by customers, not investors.
5. **Craft over speed.** Ship when it is right, not when a roadmap says it is due.

**Legal Structure:** UK Private Limited Company (Ltd), registered in England and Wales.

**Founded:** 2025 (pre-launch / early access phase as of March 2026)

**Location:** United Kingdom, fully remote.

**Founder:** Chris Garlick — self-taught developer with deep expertise in web accessibility and performance. Responsible for all product development, infrastructure, content, marketing, and operations.

---

## 3. Problem & Opportunity

### The Problem

Every business with a website faces a convergence of pressures that did not exist five years ago:

1. **Legal liability is real and growing.** The European Accessibility Act (Directive 2019/882) came into force on 28 June 2025, creating enforceable accessibility requirements across 27 EU member states. The UK Equality Act 2010 creates parallel obligations. In the US, web accessibility lawsuits under ADA Title III hit 4,605 in 2023 — a record.

2. **Search rankings now depend on technical health.** Google's Core Web Vitals (LCP, CLS, INP) are confirmed ranking signals. A 1-second delay in page load reduces conversions by 7% (Portent, 2023).

3. **AI-generated content creates quality risk.** Google's Helpful Content updates penalise thin, generic AI content. E-E-A-T signals are quality markers that automated content struggles to demonstrate.

4. **Security expectations are rising.** HTTPS adoption reached 98%+ of Chrome traffic by 2024. The next frontier — HSTS, CSP, X-Frame-Options — is poorly understood by non-technical teams.

5. **No affordable unified tool exists.** Enterprise tools (Siteimprove, $10,000–$80,000/year) cover accessibility and content but price out SMBs. SEO tools (Semrush at $139/month) cover SEO but not accessibility or security. Desktop crawlers (Screaming Frog) produce raw data with no monitoring.

The result: a freelancer managing 10 client websites currently needs 4–6 separate tools at a combined cost of $200–$500/month and hours of manual report collation.

### The Opportunity

**Regulatory urgency creates non-discretionary demand.** The EAA is not a trend — it is a structural shift. Every business with a website serving EU customers needs compliance tooling.

**The overlay backlash creates a market vacuum.** accessiBe and AudioEye have captured significant SMB awareness. But multiple class-action lawsuits, FTC enforcement, and growing awareness that overlays do not achieve compliance are creating a buyer exodus. These customers need somewhere to go.

**SMB digital investment is accelerating.** Post-pandemic, UK SMBs increased digital marketing spend by 34% between 2021 and 2024. The vast majority have no systematic audit process.

**Agencies need white-label tools.** Agencies are being pushed by clients to include accessibility compliance in retainer scopes. No competitor offers white-label at under $500/month.

### Market Size

| Metric | Value | Methodology |
|--------|-------|-------------|
| TAM | ~$6.2B | Digital accessibility software (~$897M, 25% CAGR) + website audit/SEO tools ($4B, 14% CAGR) + performance monitoring ($1.3B, 18% CAGR), de-duplicated, projected to 2026. |
| SAM | ~$560M | TAM filtered by English-language markets (35%), SMB + agency segment (65%), and self-serve SaaS buyers (70%). |
| SOM | ~$186K ARR | 0.033% SAM capture by Year 3, yielding ~408 paying customers at $38 blended ARPU. Conservative — reflects organic-only growth with a solo founder. |

---

## 4. Solution & Product

### Product Overview

Kritano is a cloud-based website intelligence platform that runs automated, multi-engine audits across six core categories — SEO, accessibility, security, performance, content quality, and structured data — plus three advanced intelligence modules: E-E-A-T scoring, AEO (AI Engine Optimisation), and Google Dorking security checks.

Users add verified domains, trigger on-demand or scheduled audits, and receive prioritised, actionable findings with historical tracking and team collaboration. Results are exportable as white-label PDF reports, CSV, or JSON, and accessible through a documented REST API.

### Key Features

| Feature | Description | User Benefit |
|---|---|---|
| Six-engine audit suite | Simultaneous analysis across SEO, accessibility, security, performance, content quality, and structured data | Single source of truth for website health |
| AEO Analysis | Checks page content for AI engine discoverability signals | Stay visible as AI-powered search overtakes traditional SERPs |
| E-E-A-T Scoring | Evaluates Experience, Expertise, Authoritativeness, and Trustworthiness signals per page | Actionable path to meeting Google's quality evaluator expectations |
| Google Dorking security checks | Surfaces sensitive file exposures, admin panels, and indexing misconfigurations | Catches security issues attackers use reconnaissance to find |
| Scheduled audits | Recurring audits from 15-minute to 7-day intervals | Catches regressions automatically |
| PDF / CSV / JSON export | Full finding exports with tier-based white-label branding | Professional client reports or third-party integrations |
| Public REST API | Documented API with scoped keys and tiered rate limits | Integrates audit data into custom dashboards |
| Organisation / team management | Multi-seat accounts with role-based access | Agencies collaborate without sharing credentials |
| White-label branding | Custom logo and colours on exported reports | Resell auditing capability under agency's brand |
| Referral programme | Bonus audits per referral; milestone rewards at 5 and 10 referrals | Organic growth loop |
| Unique issue counting | Unique issues rather than raw total occurrences | Clearer picture of distinct problems to fix |
| Mobile audit pass | Second crawl pass with mobile viewport (390×844, touch, isMobile) running accessibility + performance engines | Catches touch target issues, responsive layout bugs, mobile CLS, and viewport problems that desktop misses |
| Cold outreach log | Manual tracking of cold emails sent by hand — reply status, free audit given, user conversion, paid conversion | Full visibility into outbound sales funnel without automated sending |
| Mobile-specific performance rules | 5 dedicated rules: viewport meta, font size, horizontal overflow, unoptimized images, tap delay | Issues that only manifest on mobile devices |
| Finding device tagging | Every finding tagged as desktop, mobile, or both — with deduplication across passes | Filter audit results by device; understand which issues affect which viewport |

### Product Roadmap

| Phase | Timeline | Key Deliverables |
|-------|----------|------------------|
| **Done (Q1 2026)** | March 2026 | Rebrand to Kritano, mobile audit pass (dual-pass crawl with 5 mobile perf rules), cold outreach log, NRD pipeline improvements (date-matched output, gov.uk filtering), API key prefix change (kt_live_), KritanoBot/1.0 user agent |
| **Now (Q2 2026)** | April–June 2026 | Guided onboarding checklist, annual billing toggle, shareable public audit report links, Enterprise "Contact Sales" CTA, Resend webhook integration (email open/click tracking) |
| **Next (Q3 2026)** | July–September 2026 | In-app notification bell, webhooks, AI-powered fix suggestions, social proof on homepage, dashboard schedule health widget |
| **Later (Q4 2026+)** | October 2026+ | LLM-generated code fix suggestions, CLI tool, Jira/Linear integration, Brand Voice Analysis module, anomaly detection |

### Coming Soon — New Features

These planned features represent Kritano's next wave of differentiation, extending the platform beyond auditing into compliance automation, link intelligence, AI visibility, and content generation.

| Feature | Description | Expected Impact |
|---------|-------------|-----------------|
| **Accessibility Statements** | Auto-generate legally compliant accessibility statements directly from audit data, tailored to WCAG 2.2 / EN 301 549 / EAA requirements | Eliminates hours of manual drafting; reduces legal exposure for every audited site |
| **Certifications** | Issue and display verifiable accessibility certification badges for sites that pass defined audit thresholds | Gives clients visible proof of compliance; creates a trust signal for their end users |
| **Internal Link Graph** | Interactive visual map of a site's internal linking structure with orphan page detection and crawl-depth analysis | Reveals SEO architecture gaps; helps users improve crawlability and page authority distribution |
| **Backlink Graph** | Visualise and analyse a site's external backlink profile — authority scores, anchor text distribution, toxic link flagging | Identifies link-building opportunities and harmful backlinks that suppress rankings |
| **AI Visibility** | Measure how a site appears in AI answer engines (Claude, GPT, Perplexity) using their APIs to track brand mentions, citations, and recommended links | Prepares sites for the shift from traditional search to answer-engine discovery |
| **Content Generator** | AI-powered content creation using open-source LLMs to draft fixes for content issues surfaced by audits (thin pages, missing descriptions, weak headings) | Helps users act on audit findings immediately at low marginal cost |

### User Personas

**Maya — Freelance Web Developer** — 28, Manchester. Maintains 8–12 client websites. Kritano Starter ($19/month) gives her scheduled audits and PDF exports. Upgrades to Pro at 4+ clients.

**Daniel — Digital Marketing Manager at a Mid-Size Agency** — 36, London. Non-technical, managing 20–30 client sites. Kritano Agency ($99/month) gives him white-label reports, team management, unlimited audits.

**Priya — Head of Digital at a Mid-Market E-Commerce Business** — 41, Leeds. A performance regression cost £40,000 last year. Kritano Pro ($49/month) provides daily scheduled audits as a regression detection layer.

---

## 5. Market Analysis

### Industry Overview

Kritano sits at the intersection of three converging market categories:

- **Website auditing and technical SEO tools** ($1.6B in 2024, ~14% CAGR)
- **Digital accessibility software** (~$897M in 2025, projected >$1.4B by 2027, ~25% CAGR)
- **Website performance monitoring** ($1.2B in 2024, ~18% CAGR)

Combined TAM: ~$3.7B in 2025, projected ~$7.2B by 2029.

The accessibility segment is growing fastest, driven by the European Accessibility Act and continued ADA Title III litigation. 96% of the top 1 million websites still have detectable WCAG failures (WebAIM Million, 2025). The market is not saturated — it is under-served.

### Target Market Segments

| Segment | Size | Kritano Tier | Buying Trigger |
|---|---|---|---|
| Freelance web developers (UK + international) | ~1.2M UK freelance digital workers | Starter ($19/mo) | Need to prove quality of work |
| Small/independent digital agencies (2–25 staff) | ~22,000 digital agencies in UK | Pro ($49) to Agency ($99) | Client accessibility compliance requirements |
| In-house marketing/content teams at SMBs | ~120,000 UK businesses with active digital marketing | Starter to Pro | Accessibility complaint, Google penalty, or security incident |
| E-commerce operators | ~45,000 UK e-commerce sites with £50k+ annual revenue | Starter to Pro | Performance = revenue |
| Overlay refugees — businesses switching from accessiBe/UserWay | Est. 100,000+ global overlay customers | Starter to Pro | FTC enforcement, lawsuits |

---

## 6. Competitive Landscape

### Overview

The competitive landscape has consolidated at the enterprise tier (top 5 vendors control 48% of accessibility software revenue) while fragmenting at the SMB/startup tier. The overlay segment is collapsing. Kritano's positioning — multi-category auditing at $19–99/month — sits in the widest gap in the market.

### Enterprise Competitors ($10,000–$100,000+/year)

| Competitor | Strengths | Weaknesses | Pricing |
|---|---|---|---|
| **Siteimprove** | Deep WCAG testing, multi-module | Unaffordable for SMBs, not self-serve | ~$28K/yr avg |
| **Deque (axe)** | Developer-first, created axe-core | Enterprise pricing | ~$1.2–2.5K/seat/yr |
| **Level Access** | Acquired UserWay, managed audits | Very expensive, sales-led | ~$40K/yr |
| **Lumar** | Enterprise crawl at scale, CI/CD | Not SMB-accessible | ~$600–$3,000+/mo |

### SMB / Startup Competitors ($0–$500/month)

| Competitor | Key Differentiator | Pricing | Threat Level |
|---|---|---|---|
| **A11y Pulse** | Simple, affordable, accessibility-focused | $19–159/mo | **Very High** |
| **TestParty** | YC-backed ($4M), AI + human hybrid, fixes source code | $49–5K/mo | **High** |
| **AudioEye** | Automated + manual testing | Free–$279/mo | **High** |
| **accessiBe** | High brand recognition | $49–$249/mo | **Medium** (collapsing credibility) |
| **Screaming Frog** | Industry standard technical SEO crawler | £259/year | **Medium** |

### Competitive Advantage

1. **Unified six-category audit at SMB price.** No competitor offers depth across accessibility, SEO, security, performance, content quality, and structured data under $100/month.
2. **Desktop + mobile audit pass.** Kritano is the only tool under $100/month that audits both desktop and mobile viewports for accessibility and performance. The mobile pass catches touch targets, reflow issues, mobile CLS, and responsive bugs that desktop-only tools miss entirely.
3. **E-E-A-T and AEO analysis.** No competitor at any price point scores content for Google's E-E-A-T signals or AI citability.
4. **Agency white-label at $99/month.** No competitor offers white-label audit reports under $500/month.
5. **Bootstrapped pricing independence.** No investor mandate to raise prices. Kritano's pricing is not subject to investor pressure.
6. **Content Quality Scoring (CQS).** Weighted system combining quality + E-E-A-T + readability + engagement + structure is unique.

### Pricing Competitive Context

No competitor at any price point below $1,500/month offers more than 4 audit categories. Kritano offers 10 at $99/month. No competitor under $100/month offers both desktop and mobile viewport auditing — Kritano does from the Starter tier ($19/month).

**Core pricing moat:** Kritano's infrastructure costs ~$25/month. Gross margins are 88–93%. The pricing can be defended indefinitely because it is profitable at current levels — there is no VC subsidy to expire.

---

## 7. Business Model & Pricing

### Revenue Model

Freemium SaaS subscription model with self-serve upgrade path. Three reinforcing layers:
- **Freemium acquisition funnel:** Free tier removes friction, generates word-of-mouth.
- **Tier-based expansion:** Natural upgrade as businesses grow.
- **Founding member cohort:** 200 early access spots at 50% lifetime discount.

### Pricing Strategy

| Tier | Monthly | Annual (~17% off) | Sites | Pages/Audit | Seats | Key Features |
|---|---|---|---|---|---|---|
| Free | $0 | — | 1 | 50 | 1 | SEO, Security, Content |
| Starter | $19 | ~$190/yr | 3 | 250 | 1 | + Accessibility, Performance, PDF, 7-day scheduling |
| Pro | $49 | ~$490/yr | 10 | 1,000 | 5 | + E-E-A-T, AEO, Google Dorking, CSV/JSON, 1-day scheduling |
| Agency | $99 | ~$990/yr | 50 | 5,000 | Unlimited | + Structured Data, white-label, 1-hour scheduling |
| Enterprise | $199 | ~$1,990/yr | Unlimited | 10,000 | Unlimited | All features, 15-min scheduling, full API |

### Unit Economics

| Metric | Value | Notes |
|---|---|---|
| Blended ARPU (Year 1) | $25/mo | Founding members at 50% off heavily weight the average |
| Blended ARPU (Year 3) | $38/mo | Founding cohort is ~5% of base; more Pro and Agency customers |
| CAC (bootstrapped, imputed) | $50–$100 | Founder time at £25/hr opportunity cost |
| LTV (at 5% churn) | $475 | Rises to $722 at Year 3 ARPU |
| LTV:CAC | 5–10:1 | Healthy for bootstrapped SaaS |
| Payback Period | 2–4 months | |
| Gross Margin | 88–93% | Real infrastructure costs very low (~$25/mo base) |

### Pricing Fallback Experiments

If current pricing doesn't convert, run these experiments in order:

| # | Experiment | Trigger | Expected Lift |
|---|---|---|---|
| 1 | Show annual pricing first on pricing page | Week 1 | 15–25% increase in annual plan selection |
| 2 | Replace free tier with 14-day Pro trial (no card required) | Month 2, if conversion < 2% | Free-to-paid from 2% → 5–8% |
| 3 | Add a "Growth" tier at $34/mo between Starter and Pro | Month 3, if Starter → Pro upgrades stall | 10–15% revenue increase |
| 4 | Move Enterprise from $199/mo to "from $299/mo, Contact us" | Month 4 | Higher ACV per enterprise deal |
| 5 | Usage-based page credit add-on ($9/1,000 pages) | Month 6, if conversion still struggling | 5–10% revenue increase from power users |

---

## 8. Anti-Fragile Marketing & Growth

### Core Principle

No single channel owns more than 40% of pipeline at any time. Every channel must justify its time cost within 60 days or trigger a pivot. The founder has ~18 hrs/week for marketing. This plan treats that time as a finite resource allocated with the same rigour as cash.

### Time Budget Baseline (Weeks 1–8)

| Channel | Weekly Hours | % of Budget |
|---|---|---|
| Cold email (manual outreach) | 4 hrs | 22% |
| SEO / blog writing | 5 hrs | 28% |
| Social media (X, LinkedIn, Instagram) | 4 hrs | 22% |
| Community (Reddit, IH, HN) | 3 hrs | 17% |
| Referral programme | 1 hr | 6% |
| Email nurture | 1 hr | 6% |
| **Total** | **18 hrs** | **100%** |

### What's Already Built (Marketing Infrastructure)

| Asset | Status | Marketing Use |
|---|---|---|
| Cold prospect pipeline (NRD feed) | Built, operational | Outbound lead generation — newly registered domains |
| CRM with lead scoring | Built (10+ behavioural signals) | Prioritise who to talk to |
| Behavioural email triggers | Built (first audit, domain stall, low scores, upgrade nudges, churn risk) | Automated nurture |
| Blog CMS | Built, 20 posts published | SEO content engine |
| Referral programme | Built (5 refs = Starter, 10 refs = Pro) | Viral loop |
| Early access funnel | Built (200 spots, source tracking) | Scarcity-based conversion |
| Email campaign system | Built | Newsletters, announcements, nurture |
| PDF/CSV exports with branding | Built | Every exported report is a marketing impression |
| Public API with docs | Built | Developer audience discovery channel |
| Cold outreach log | Built | Manual tracking of sent emails, replies, conversions — full outbound funnel visibility |
| Mobile audit pass | Built (Starter+) | Differentiator in marketing — "only tool under $100/month with desktop + mobile auditing" |
| NRD pipeline with gov.uk filtering | Built | Excludes government domains from outreach pipeline automatically |

---

### Channel 1: Cold Email (Manual Outreach)

**How it works (per CLAUDE.md — all emails sent manually by hand from personal mailbox):**
1. Review cold prospect queue in admin daily. System pre-scores and filters by TLD quality and LIA compliance.
2. Pick 10–15 high-quality prospects per day. Visit the domain, note one observable issue (30 seconds per site).
3. Write a short, personal email referencing the specific domain and the one issue you noticed.
4. Do not follow up. One email per domain.

**Volume:** 10–15 emails/day × 5 days/week = 50–75/week. At 3–5% reply rate and 10–15% of replies registering: 2–5 new free users per week.

#### Plan A — Primary Strategy
Hyper-personalised outreach referencing a specific issue on the prospect's site. Lead with the problem, not the product.

**60-day success criteria:** Open rate ≥ 35%, reply rate ≥ 8%, positive reply rate ≥ 3%, ≥ 5 trial signups/month attributed.

#### Plan B — If underperforming at 60 days
Narrow the target drastically. Stop horizontal outreach. Pick ONE vertical (e.g. Shopify agencies). Reduce volume to 5/day but increase personalisation depth. Add a 60-second Loom video to email 1.

**120-day success criteria:** Reply rate ≥ 10% within the new vertical, 3+ paid conversions attributed.

#### Plan C — If Plan B underperforms
Stop cold email as a sales channel. Redirect 4 hrs/week to **partnership outreach**: email freelance web developers and WordPress/Webflow/Shopify consultants who already have clients who need audits. Propose white-label or referral arrangements. One successful partner = 50 failed cold sequences.

**Kill criteria (120 days):** Positive reply rate never exceeds 2%, zero paid conversions, or deliverability degrades (open rate below 15%).

**Reallocation if killed:** +2 hrs → Community, +2 hrs → Partnership outreach.

---

### Channel 2: SEO Content (2 Blog Posts/Week)

**Existing:** 20 published posts, SEO-optimised with structured data on all public pages.

**Publishing schedule:** Tuesday + Thursday. Educational/how-to on Tuesday, opinion/comparison on Thursday.

#### Plan A — Primary Strategy
Publish 2 posts/week targeting long-tail, low-competition keywords with clear commercial intent. Every post includes a free tool CTA, internal links to pricing, and a downloadable checklist.

**60-day success criteria:** ≥ 5 posts indexed and ranking top 50, ≥ 200 organic sessions/month, ≥ 20 email captures/month.

#### Plan B — If underperforming at 60 days
Domain authority too low. Pivot to **link-earning content**: data studies, original research ("We audited the accessibility of the top 100 UK charity websites"). Drop cadence to 1/week and invest saved time in promoting existing content through outreach.

**120-day success criteria:** 3+ referring domains acquired, ≥ 2 posts in top 20.

#### Plan C — If Plan B underperforms
Stop trying to rank independently. Write **guest posts** for established publications (Smashing Magazine, CSS-Tricks, agency blogs). 2 guest pitches/week, accept anything with DA ≥ 20. Builds authority while generating direct referral traffic.

**Kill criteria:** Do NOT kill SEO entirely — it's the only channel with compounding returns. Kill the standalone blog post approach if zero posts rank top 30 after 120 days. Shift to link-building activities.

**Reallocation if approach changes:** 2 hrs → guest post pitches, 2 hrs → content promotion outreach, 1 hr → maintaining existing posts.

---

### Channel 3: Social Media (X, LinkedIn, Instagram)

#### Plan A — Primary Strategy
Platform-specific content. X: developer credibility + accessibility community. LinkedIn: B2B thought leadership (2–3/week, M/W/F). Instagram: visual brand building with educational carousels.

**60-day success criteria:** LinkedIn: 2+ meaningful DMs/week from target personas. X: 500+ impressions/day. Instagram: 50+ saves/week. 20+ email signups/month from social bio links.

#### Plan B — If underperforming at 60 days
Stop spreading across three platforms. **Consolidate to the one showing any traction** and go all-in. Comment on 10 other people's posts per day before posting your own.

**120-day success criteria:** Single platform: 5+ inbound DMs/week, ≥ 100 site sessions/month from social.

#### Plan C — If Plan B underperforms
Stop original content creation on social. Redirect to **social DM prospecting** — 5 personalised DMs/day to warm prospects who have engaged with accessibility, web dev, or agency content. Social becomes a prospecting tool, not a broadcasting tool. 4-week sprint, then reassess.

**Kill criteria (120 days):** Zero inbound DMs, social referral traffic under 50 sessions/month. Maintain minimum viable presence (1 hr/week, 3 posts/week on best platform) for brand credibility.

**Reallocation if killed:** +2 hrs → Community, +1 hr → Cold email personalisation, +1 hr → SEO content promotion.

---

### Channel 4: Community (Reddit, IndieHackers, HackerNews)

#### Plan A — Primary Strategy
Give value obsessively before mentioning Kritano. Answer questions about accessibility, WCAG, SEO. Build reputation 4–6 weeks before any product mention. IH: genuine milestone posts. HN: Show HN at month 2–3.

**60-day success criteria:** 2+ Reddit posts/comments hitting 50+ upvotes, 3+ IH posts with 20+ upvotes, 5+ trial signups attributed.

#### Plan B — If underperforming
Consolidate to ONE community. Run a "free audit offer" in r/webdev — "I'll audit your site's accessibility for free, posting results here." Generates engagement and showcases the product without being a pitch.

#### Plan C — Emergency Fallback
Run a structured "free accessibility audit week" across r/webdev, r/entrepreneur, and IH. 10 free audits with published results. Time-boxed to 2 weeks.

---

### Channel 5: Referral Programme

**Current state:** Fully built, functional. Needs better in-app surfacing.

**Rewards structure:**

| | Referrer Gets | Referred User Gets |
|---|---|---|
| Per referral | 5–12 bonus audits (scales by tier) | 3 bonus audits on signup |
| 5 referrals | 30 days Starter free ($19 value) | — |
| 10 referrals | 30 days Pro free ($49 value) | — |

**Fixes needed:** (1) Dashboard CTA, (2) Pricing page mention, (3) Social sharing buttons, (4) Trigger at peak satisfaction moments (after score improvement, after first export), (5) Show milestone progress.

**If referrals don't compound:** Switch from user-to-user to professional referrals. Approach 5 UK web dev freelancers: "Refer your clients, earn 20% recurring commission." B2B referral with stickier economic incentive.

---

### Channel 6: Email Nurture (Automated Conversion)

**Built-in triggers that already exist:** First audit completed, domain verification stall, low audit score, upgrade nudge, churn risk.

**New 5-email onboarding sequence for free users:**

| Day | Subject | Content |
|---|---|---|
| 0 | "Welcome — here's what Kritano found" | Audit summary or prompt to run first audit |
| 2 | "Your site has [X] accessibility issues" | EAA context, upgrade CTA |
| 5 | "3 things Kritano checks that Lighthouse doesn't" | Differentiation education |
| 10 | "Your free plan: [X] of 5 audits used" | Usage context + upgrade CTA |
| 14 | "Set it and forget it: scheduling starts at $19/mo" | Scheduling as key upgrade trigger |

---

### Channel Ranking by Expected Impact

| Rank | Channel | Expected Signups/Month (Month 6) | Time/Week |
|---|---|---|---|
| 1 | Cold prospect pipeline | 10–20 | 3 hrs |
| 2 | SEO content (2 blogs/week) | 10–25 (growing) | 6 hrs |
| 3 | LinkedIn (2–3/week) | 5–10 | 2.5 hrs |
| 4 | X / Twitter (daily) | 5–10 | 1.5 hrs |
| 5 | Instagram (daily) | 3–8 | 2.5 hrs |
| 6 | Referral programme | 3–8 | 0 hrs (fix once) |
| 7 | Community (Reddit/IH/HN) | 2–5 | 1 hr |
| 8 | Email nurture | Conversion, not signups | 0 hrs (build once) |

**Total expected by Month 6: 38–86 new free signups/month.** At 3% conversion: 1–3 new paying customers per week.

**By Month 12** (SEO compounding, referrals growing): 120–200 signups/month, yielding 4–6 new paying customers per week.

---

### Time Reallocation Framework

| Situation | Cold Email | SEO | Social | Community | Referral | Nurture |
|---|---|---|---|---|---|---|
| Default (Week 1–8) | 4 hrs | 5 hrs | 4 hrs | 3 hrs | 1 hr | 1 hr |
| Cold email winning | 6 hrs | 4 hrs | 3 hrs | 2 hrs | 1 hr | 2 hrs |
| SEO winning (month 6+) | 2 hrs | 8 hrs | 3 hrs | 2 hrs | 1 hr | 2 hrs |
| Social winning | 3 hrs | 4 hrs | 7 hrs | 1 hr | 1 hr | 2 hrs |
| Nothing working (60 days) | PAUSE | PAUSE | PAUSE | PAUSE | PAUSE | 2 hrs |

**If nothing works at 60 days:** Stop all outbound for 1 week. Spend 18 hrs on customer discovery: 6 customer interviews, review all reply language patterns, rewrite homepage positioning. Only restart channels after positioning is tightened.

---

### Nuclear Scenario: Cold Email + SEO + Social All Fail

After 120 days, if all three highest-time-investment channels return nothing:

**Step 1 — Diagnose (Week 1).** Run a 5-question survey on existing free users. If answers reveal a messaging mismatch, fix positioning first — the channel strategy is irrelevant.

**Emergency Growth Option 1: Productised Free Audit Service (Weeks 2–4)**
Offer 10 free, published accessibility audits. Post in every community simultaneously. Generates traffic, backlinks, social proof, and 10 warm leads. Convert 1–2 to paid. If it works, productise: "Free Audit Friday" — one public audit per week.

**Emergency Growth Option 2: Direct Partnership with One Agency (Weeks 2–6)**
Approach a single web agency with 20–50 clients. Offer white-label or exclusive partner discount. One agency with 30 clients is worth 6 months of cold email.

**Emergency Growth Option 3: AppSumo / Lifetime Deal Launch (Weeks 4–8)**
List on AppSumo. Not for profitability — for social proof (100+ reviews), user feedback, and a reference base. Can generate £5k–£20k in a single campaign window.

**Emergency Growth Option 4: Newsletter Sponsorship (Weeks 4–8)**
Sponsor a targeted newsletter via editorial partnership (not paid ad). Write a useful accessibility guide for their audience in exchange for a sponsor slot. Target newsletters with 2,000–10,000 subscribers.

**Emergency Growth Option 5: Podcast Guest Appearances (Ongoing)**
Pitch 3–5 podcasts targeting web developers, agency owners. Subject: "Why 96% of websites fail basic accessibility." Zero budget. 2–3 hours per appearance.

**The only unrecoverable scenario:** Failing to build an email list at all — because every channel failure leaves no way to communicate with past visitors. Email capture is the single most important metric across every channel from day one.

---

### Activation & Onboarding

**Aha moment:** User sees their own website's accessibility score within their first session.

**Target:** Under 4 minutes from email confirmation to first completed audit result.

**Proposed flow:** Post-registration → onboarding checklist (not blank dashboard) → "Add Your First Site" CTA → immediate audit trigger → optimised results page with large score, top 3 issues, upgrade CTA.

### Retention & Churn Prevention

**Core habit loop:** Scheduled weekly/monthly audit → email digest showing score changes → user reviews and acts → score improvement (reward).

| Metric | Y1 Target | Y2 Target | Y3 Target |
|---|---|---|---|
| Activation Rate (reg → first audit) | 45% | 60% | 70% |
| Domain Verification Rate | 25% | 40% | 55% |
| Free-to-Paid Conversion | 3% | 5% | 7% |
| Monthly Churn (paid) | <5% | <4% | <3.5% |

**If churn exceeds 7% — Emergency Retention Plays:**

1. **Exit interview every churning subscriber.** Personal email from founder. "I noticed you cancelled. Can I ask why? Would a 2-week pause help?"
2. **Add "Pause subscription" option** before the cancel button. Reduces immediate churn 10–20%.
3. **Win-back sequence** 7 days after cancellation: "Here's what changed since you left: [3 new features]. Come back at 50% off for 2 months."
4. **Onboarding overhaul** — mandatory 3-step: Add site → Run audit → Set up schedule. Gate dashboard until complete.
5. **Annual billing push** — annual subscribers churn at 30–50% the rate of monthly. Aggressively push monthly → annual at Month 3.

---

## 9. Revenue Diversification

### Why This Section Exists

SaaS subscriptions are the primary revenue model. But if subscriptions grow slower than projected, the business must not die. These are fallback revenue streams ordered by ease of implementation.

### Plan A — Core SaaS Subscriptions

Already built. Day 0. This is the anchor.

**Failure signals:** Free-to-paid below 1.5% after 3 months, trial-to-paid below 10% after 60 days, churn above 8% for 2 consecutive months.

### Plan B — Supplementary Revenue (Low Engineering)

#### B1: Pay-Per-Report (One-Shot Audits)
£19–£39 for a single comprehensive audit PDF, no subscription. Targets users who want a result but won't commit. **Time to implement:** 3–5 days (Stripe payment link + existing PDF export). **Revenue potential:** 200 visitors/month at 3% conversion = £174/mo. **Cannibalisation risk:** Medium — mitigate by pricing one-shot above monthly.

#### B2: Compliance Report Add-On
Upsell a formal EN 301 549 compliance-framed PDF to existing subscribers. £49–£99 per report. **Time to implement:** 2–3 days. **Revenue potential:** 5% of Agency/Enterprise subscribers × 2 reports/year = £2,960/year.

#### B3: White-Label PDF Add-On
Agency subscribers pay additional £19–£29/mo for fully white-labelled reports. **Time to implement:** 1–2 days (feature flag). **Revenue potential:** 30% of Agency subscribers × £24/mo.

#### B4: API Usage-Based Pricing
£0.10–£0.25 per API call, or flat £49/mo for 500 calls. **Time to implement:** 3–4 days (API key management already exists). **Revenue potential:** 10 developers × £49/mo = £490/mo.

#### B5: Annual Pre-Payment Push
Not a new product — aggressive push on annual billing. "Founding Annual" deal: pay 10 months, get 12. Converting 20 Starter subscribers = £3,800 cash upfront, covering 135 months of infrastructure.

### Plan C — Emergency Revenue (Consulting / Done-For-You)

**Trigger:** MRR below £1,500 at Month 6.

#### C1: Done-For-You Accessibility Audits
Manual audit using Kritano + manual testing. PDF + fix priority list + 30-minute walkthrough. £350–£750 per audit. **Revenue potential:** 4/month × £500 = £2,000/mo. **Time to implement:** Immediate (Calendly + Stripe link). These clients often become SaaS subscribers after seeing the platform.

#### C2: Agency Retainer (Audit-as-a-Service)
Sell a monthly retained service to 2–3 agencies: run audits on their client sites, deliver white-label reports. £500–£1,500/mo per agency. **Revenue potential:** 3 agencies × £900 = £2,700/mo.

#### C3: EAA Compliance Consulting
Fixed-price "EAA Readiness Assessment": site audit, EN 301 549 gap mapping, remediation roadmap. £1,200–£2,500 each. **Revenue potential:** 2/month = £3,000–£5,000/mo. A single enterprise client covers 6 months of infrastructure.

### Anti-Fragility Rule

At any given time, at least 2 revenue streams must be active. The moment MRR drops below £500, activate Plan C within 7 days, not 30. At £28/mo infrastructure, a single consulting day covers 5 months of costs.

---

## 10. Operations & Team

### Current Team

**Team size:** 1 (solo founder). Chris Garlick handles all product development, infrastructure, content, marketing, support, and business operations.

### Hiring Plan

| Phase | MRR Threshold | Role | Cost | Rationale |
|---|---|---|---|---|
| 1 (now–Month 18) | £0–£3k | No hires | — | Revenue does not support payroll |
| 2 (Month 18–30) | £3k–£5k | Part-time Support (10–15 hrs/week) | £1,000–£1,500/mo | Support consuming engineering time |
| 3 (Month 24–36) | £5k–£12k | Part-time Content Marketer (15–20 hrs/week) | £1,500–£2,500/mo | SEO content compounding; need volume |
| 4 (Month 36+) | £12k+ | Software Engineer (full-time) | £55,000–£72,000/yr | Roadmap exceeds solo capacity |

### Founder Burnout Prevention Protocol

Burnout is an operational risk with company-threatening severity.

**Weekly hour cap:** 40 hours hard maximum. No work after 8pm. Saturday is a protected non-work day. When a week exceeds 45 hours, the following week must be under 30.

**Quarterly check-in:** Block a full day every 90 days. Answer: (1) How much do I enjoy working on Kritano, 1–10? (2) Am I building things I'm proud of? (3) What would make next quarter better? If score is below 5 for two consecutive quarters: take a 2-week sabbatical.

**Emergency autopilot plan (2–4 weeks off):** Audits run unattended (BullMQ). Stripe billing continues. Transactional email continues. A trusted contact has the runbook and can enable maintenance mode. Pre-drafted customer email ready to send.

### Tools & Infrastructure

| Category | Tool | Monthly Cost |
|---|---|---|
| Server (VPS) | Single cloud droplet | $12 (scaling) |
| Database | PostgreSQL (on VPS) | Included |
| Queue | BullMQ + Redis | Included |
| Payments | Stripe | 2.9% + $0.30/txn |
| Email (business) | Zoho Mail | ~$15/mo |
| Email (transactional) | Resend | Free tier |
| Domain | kritano.com | $12/year |
| **Total current** | | **~$28/mo** |

---

## 11. Financial Projections

### Revenue Projections (Realistic Base Case)

**Key inputs:** 150 founding members register (75% of 200), 25% convert to paid = ~38 paying customers. Founding ARPU ~$18. Full-price ARPU ~$30. Monthly churn: 5% Y1, 4% Y2, 3.5% Y3. No paid acquisition Year 1.

### Year 1 Monthly Build-Up

| Month | New Paying | Churned | Total Paying | Blended ARPU | MRR |
|---|---|---|---|---|---|
| 1 | 43 (38 founding + 5) | 0 | 43 | $20 | $860 |
| 2 | 6 | 2 | 47 | $21 | $987 |
| 3 | 6 | 2 | 51 | $21 | $1,071 |
| 4 | 7 | 3 | 55 | $22 | $1,210 |
| 5 | 7 | 3 | 59 | $22 | $1,298 |
| 6 | 8 | 3 | 64 | $23 | $1,472 |
| 7 | 8 | 3 | 69 | $23 | $1,587 |
| 8 | 9 | 3 | 75 | $24 | $1,800 |
| 9 | 10 | 4 | 81 | $24 | $1,944 |
| 10 | 10 | 4 | 87 | $25 | $2,175 |
| 11 | 12 | 4 | 95 | $25 | $2,375 |
| 12 | 13 | 5 | 103 | $25 | $2,575 |

**Year 1 total revenue: ~$19,354**

### 3-Year Summary

| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Paying Customers (EoY) | 103 | 235 | 408 |
| — Starter | 70 (68%) | 148 (63%) | 229 (56%) |
| — Pro | 23 (22%) | 58 (25%) | 110 (27%) |
| — Agency | 8 (8%) | 24 (10%) | 53 (13%) |
| — Enterprise | 2 (2%) | 5 (2%) | 16 (4%) |
| MRR (EoY) | $2,575 | $7,500 | $15,500 |
| ARR Run-Rate (EoY) | $30,900 | $90,000 | $186,000 |
| Total Revenue | $19,354 | $70,500 | $155,600 |
| Infrastructure/Tool Costs | $2,200 | $5,400 | $8,400 |
| Staff Costs | $0 | $0 | $36,000 |
| Stripe Fees (~3.2%) | $620 | $2,260 | $4,980 |
| **Total Operating Costs** | **$2,820** | **$7,660** | **$49,380** |
| **Net before founder drawings** | **$16,534** | **$62,840** | **$106,220** |
| Gross Margin | 93% | 93% | 91% |

### Break-Even Analysis

| Milestone | Customers Required | Projected Timeline |
|---|---|---|
| Cash break-even (infra only, ~$28/mo) | 2 Starter | Month 1 |
| Cash break-even (with Claude Code Max, ~$228/mo) | 10 Starter or 5 Pro | Month 2–3 |
| Founder min. drawings (£3k/mo) | ~100 customers | Month 18–24 |
| Founder comfortable (£5k/mo) | ~170 customers | Month 24–30 |

### Sensitivity Analysis

**Steady-state MRR at 150 monthly free signups:**

| | Churn 3% | Churn 5% | Churn 8% |
|---|---|---|---|
| **Conversion 2%** | $2,500 | $1,500 | $938 |
| **Conversion 3%** | $3,750 | $2,250 | $1,406 |
| **Conversion 5%** | $6,250 | $3,750 | $2,344 |

**Variable importance:** Conversion rate > Churn rate > Signup volume > ARPU. Onboarding is the single feature that improves both conversion and churn simultaneously.

### Key Assumptions

| # | Assumption | Value | Risk if Wrong |
|---|---|---|---|
| 1 | Founding member spots filled | 150 of 200 (75%) | At 50%, opening paid base drops to ~25 |
| 2 | Founding member paid conversion | 25% | At 15%, only ~23 paid at launch |
| 3 | Monthly churn rate | 5% Y1, 4% Y2, 3.5% Y3 | At 8%, customer base barely grows |
| 4 | Blended ARPU | $25 Y1 → $38 Y3 | If most stay on Starter, ARPU could be $20 |
| 5 | Organic new paying customers | 5–13/mo Y1, growing to 30/mo Y3 | SEO takes 6–12 months |
| 6 | No paid acquisition Year 1 | $0 marketing spend | If organic underperforms, growth stalls |
| 7 | Founder has 18–24 months savings | Bridge to salary break-even | Without runway, must freelance, slowing development |

---

## 12. Funding Requirements

### Self-Funded / Bootstrapped

No external investment raised or sought. Infrastructure costs are ~$28/month. The business generates cash from its first few customers.

**The trade-off:** Founder needs 18–24 months of personal savings to bridge to salary break-even.

### Milestones That Would Trigger Considering External Funding

| Milestone | Why It Triggers the Conversation |
|---|---|
| Consistent $10,000+ MRR with 3-month plateau | Organic growth ceiling; paid acquisition could unlock next stage |
| Enterprise channel requiring a £60k+ sales hire | Revenue supports hire but timing requires upfront capital |
| A direct competitor raises institutional capital | Defensive investment to maintain product velocity |

**Preferred approach if pursued:** Revenue-based financing or small angel round (£150k–£300k). No VC unless ARR exceeds £1M.

---

## 13. Legal & Compliance

> **DISCLAIMER:** This section was AI-generated and has not been reviewed by a qualified solicitor. Nothing below constitutes legal advice. Professional legal review is required.

### Legal Structure

UK Private Limited Company (Ltd), registered in England and Wales. All IP (codebase, brand name, domains, content) must be formally owned by the Ltd company.

### Intellectual Property

- **Trade secrets:** Audit engine rule set (500+ rules), scoring algorithms, cold prospect prioritisation logic.
- **Copyright:** Source code and content automatically protected by UK Copyright, Designs and Patents Act 1988.
- **Trademark:** "Kritano" is clean — no existing companies, products, or trademarks use this name. The founder owns kritano.com.

### Trademark Filing Plan

| Item | Cost | Timing |
|---|---|---|
| UKIPO trademark (Classes 9 + 42) | GBP 220 | Month 1 — file before public launch |
| Professional trademark search (UK + EU) | GBP 300–600 | Month 2 |
| EUIPO trademark (Classes 9 + 42) | GBP 750 | Month 3–6 |
| Defensive domains (kritano.co.uk, .io, .app) | GBP 40/year | Month 1 |
| Social handle registration (X, LinkedIn, IG, YouTube, GitHub) | GBP 0 | Month 1 |

### Legal & Compliance Checklist

#### Before Accepting Any Money

| Item | Cost | Time |
|---|---|---|
| ICO registration (data controller) | £40/year | 1 hour |
| Privacy Policy — GDPR compliant | £0–400 | 2–4 hours |
| Terms & Conditions | £0–600 | 3–5 hours |
| Cookie consent — PECR compliant | £0 | 1 hour |
| Stripe ToS compliance check | £0 | 1 hour |
| Domain auto-renewal + lock | £8–15/year | 30 min |
| Separate business bank account | £0–15/mo | 1 day |

#### Within 90 Days of First Paying Customer

| Item | Cost | Time |
|---|---|---|
| Professional Indemnity Insurance (£500k–£1M cover) | £200–500/year | 1 day |
| Cyber Liability Insurance | £150–350/year | 1 day |
| DPAs with Stripe, Resend, VPS provider | £0 | 2 hours |
| Acceptable Use Policy | £0 | 2 hours |
| VAT threshold monitoring | £0 | Ongoing |

#### Within 12 Months

| Item | Cost | Time |
|---|---|---|
| EAA compliance self-audit (own platform) | £0–500 | 1–2 weeks |
| Security penetration test (freelance) | £200–800 | 1 month lead |
| Backup restore test | £0 | 2–4 hours |
| Solicitor review of T&Cs | £300–600 | 1 week |

### Regulatory Considerations

| Regulation | Applicability | Status |
|---|---|---|
| UK GDPR / DPA 2018 | Processes personal data | ICO registration required |
| PECR 2003 | Electronic marketing | Soft opt-in for customers; LIA for cold outreach |
| European Accessibility Act | Own web application must meet WCAG 2.1 AA | Self-audit required |
| Computer Misuse Act 1990 | Scanning third-party websites | Domain verification + consent modal |
| PCI DSS | Payment processing | SAQ A scope — Stripe handles all card data |

---

## 14. Anti-Fragile Risk Management

Every risk has a concrete mitigation plan, not just "monitor the situation."

### Single Points of Failure

#### Founder (Solo Operator)
| Failure Mode | Prob | Impact | Mitigation |
|---|---|---|---|
| Short illness (1–2 weeks) | High | Medium | Automated systems continue; auto-responder on support |
| Serious illness (1–3 months) | Medium | High | Emergency autopilot plan (Section 10); trusted contact has runbook |
| Burnout | Medium | Critical | Weekly hour cap (40), quarterly check-ins, revenue-triggered hiring |

**Non-negotiable:** Documented `RUNBOOK.md` with every production operation. Emergency contact list — two trusted people know where the runbook lives. Digital estate clause with solicitor (£150–300 one-time). Key person income protection insurance (~£30–60/month).

#### Infrastructure
| Failure Mode | Mitigation | Cost |
|---|---|---|
| VPS goes offline | Daily off-site DB backups (Backblaze B2), weekly VPS snapshots, documented cold-start procedure (2hr target) | £5–25/mo |
| Database corruption | Pre-migration backup ritual, least-privilege DB users, tested restore every 90 days | £0–2/mo |
| Domain hijacking | Registrar 2FA (hardware key), domain lock, Cloudflare DNS, backup recovery email | £8/year |
| DDoS attack | Cloudflare "Under Attack Mode" (free), VPS firewall drops non-Cloudflare traffic | £0 |

#### Payment Processing (Stripe)
**Mitigations:** Clean dispute rate (<0.5%), 3-month operating cash in separate bank account, secondary processor (Paddle) registered and dormant, pre-written customer communication template for billing disruption.

#### Email Delivery
**Mitigations:** Separate transactional vs marketing subdomains, secondary SMTP fallback (Postmark or AWS SES), SPF/DKIM/DMARC configured, complaint rates monitored.

#### Third-Party Dependencies (axe-core)
axe-core is MPL-2.0 — existing versions cannot be retroactively re-licensed. Pin version, monitor Deque announcements. **Migration path if needed:** IBM Equal Access Checker (Apache 2.0) → Pa11y (MIT) → Build critical WCAG checks in-house. The first company to ship a quality alternative engine gains a cost advantage.

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Founder runway runs out** | High | Critical | At realistic growth, salary break-even takes 18–24 months. Fallback: activate Plan C consulting (Section 9) to generate £2,000–5,000/mo while product grows. A single consulting day covers 5 months of infrastructure. |
| **Churn exceeds 5%** | High | High | Build onboarding checklist (highest-priority product work). If 8% churn: steady-state MRR caps at ~$1,400. Emergency retention plays: exit interviews, pause option, win-back sequence. |
| **Free-to-paid conversion below 2%** | Medium | High | Diagnose with event tracking and churned user surveys. Interventions: paywall the most viscerally valuable feature, "taste of Pro" blurred results, trial nudge sequence. Structural change at Month 3 if still below 2%: replace free tier with 14-day Pro trial. |
| **Funded competitors outpace development** | Medium | High | Compete on breadth (6 categories vs 1), price, and speed. Do not try to match AI remediation depth. Monitor TestParty's pricing. |
| **SEO traffic growth slower than projected** | Medium | Medium | Diversify with cold prospects, LinkedIn, community. If organic stalls, activate guest posting and newsletter sponsorships. |
| **All marketing channels fail** | Low | Critical | Nuclear scenario (Section 8): productised free audit service, direct agency partnership, AppSumo/LTD launch, podcast appearances. The email list (owned asset) survives every channel failure. |

### Anti-Fragile Business Continuity

#### Business pauses for 3 months (founder health)
Stripe billing continues automatically. Existing audits run on their schedules. Auto-responder handles support. Trusted contact has runbook for server restarts. Personal, honest email to all customers at week 4 offering 50% refund on any unsatisfactory month. **Anti-fragile upside:** Genuine transparency from a solo founder generates goodwill that marketing cannot buy.

#### Competitor launches free version of the same product
Do NOT slash prices or copy features. Identify what they cannot copy (audit history, team features, scheduled monitoring, white-label). Accelerate differentiation roadmap. Use their marketing spend as market education. Position for agencies and businesses who need accountability and ongoing monitoring, not one-time checks.

#### UK regulations change unfavorably
Build privacy architecture more restrictive than required. Domain verification and consent logging are the legal shield under the Computer Misuse Act. Build relationships with RNIB, AbilityNet early — be part of shaping standards rather than scrambling to meet them.

#### Stripe raises fees significantly
At small scale, impact is marginal. Mitigations: pass on via small price increase, push annual billing (1 transaction vs 12), activate Paddle as alternative, offer BACS direct payment for >£500/mo customers.

---

## 15. Operational Resilience Playbook

### Server Goes Down
1. SSH in (or VPS provider console). `docker ps` to identify downed containers.
2. `docker-compose up -d` to restart. Check disk space (`df -h`) and memory (`free -m`).
3. If VPS is dead: spin up new VPS from snapshot (15–30 min), point DNS via Cloudflare (instant propagation).
4. Post-mortem within 48 hours: 5-line incident note.

### Database Corruption
1. Take application offline immediately. Stop all write operations.
2. Attempt `pg_dump` — if it succeeds, you have a backup.
3. If genuine corruption: restore from most recent verified Backblaze backup.
4. Calculate and communicate data loss window honestly.

### Stripe Account Suspension
1. Read suspension reason. Do NOT take panicked actions.
2. Pause all marketing (don't acquire customers while billing is broken).
3. Contact Stripe support with business documentation.
4. If permanent: activate Paddle. Update all payment links (1–3 days).

### GDPR Data Subject Request
30-day legal response deadline. Acknowledge within 24 hours. Query all tables for user ID. Export as structured JSON/CSV. Handle erasure exceptions (Stripe records for HMRC: 7 years). Log every DSR.

### Legal Cease & Desist
Do NOT respond immediately. Do NOT make admissions. Contact UK technology solicitor (many offer free 30-min consultation). Assess merit. Response letter costs £200–500. **Insurance:** Professional Indemnity insurance covers this — get it before launch.

### Negative PR / Social Media Crisis
Read in full before responding. Do NOT delete or be defensive. If claim is true: acknowledge factually, describe what you're fixing, give a specific update timeline. If untrue: measured, factual correction with evidence. For data breach: ICO notification within 72 hours (legal requirement).

---

## 16. Milestones & Roadmap

**Completed (March 2026):**

| Milestone | Date | Notes |
|---|---|---|
| Rebrand from PagePulser to Kritano | 27 March 2026 | Full rebrand: 298 files, 2,080+ references updated. New domain, bot identity, API key prefix (kt_live_), brand guidelines. |
| Mobile audit pass (all 5 phases) | 29 March 2026 | Dual-pass crawl: desktop then mobile. 5 mobile-specific perf rules. Device tagging + deduplication on findings. Starter+ tier. |
| Cold outreach log | 28 March 2026 | Admin page for manual email tracking: reply status, free audit, user/paid conversion. Stats dashboard. |
| NRD pipeline improvements | 28 March 2026 | Output filename matches source date (not today). Gov.uk/police.uk/nhs.uk domain filtering. |
| Competitive landscape analysis | 26 March 2026 | Full market research: 30+ competitors mapped, pricing comparison, overlay exodus analysis, naming conflict research. |

**Upcoming:**

| Milestone | Target Date | Success Criteria |
|---|---|---|
| Register kritano.com domain | April 2026 | Domain active, DNS configured |
| File UKIPO trademark (Classes 9+42) | April 2026 | Application submitted (GBP 220) |
| Resend webhook integration | April 2026 | Email open/click tracking live via webhook |
| Off-site backup automated | April 2026 | Daily backups to Backblaze; restore test passes |
| Uptime monitoring + alerting | April 2026 | Alert within 5 min of downtime |
| Onboarding checklist live | May 2026 | Activation rate measurably improves |
| Annual billing live | May 2026 | Annual subscriptions processing correctly |
| Enterprise "Contact Sales" flow | May 2026 | Enterprise conversions via sales conversation |
| 150 founding member spots filled | Q3 2026 | 150 spots claimed, 25%+ converting to paid |
| First case study published | Q3 2026 | Live on homepage and pricing page |
| Product Hunt launch | Q4 2026 | Top 10 in Developer Tools category |
| 100 paying customers | Q1 2027 | ~$2,500 MRR |
| £3k MRR sustained | Q2 2027 | Sustained for 2 consecutive months |
| First fractional support hire | Q3 2027 | Support response time targets met |
| Founder salary break-even (£3k/mo) | Q4 2027 / Q1 2028 | MRR covers infra + modest salary |
| 400 paying customers | Q1 2029 | ~$15k MRR, $186K ARR run-rate |

---

## 17. The 18-Month Survival Matrix

Explicit pivot triggers at Month 3, 6, 9, and 12. Act within 14 days of a trigger — not 60. Founders who delay pivots turn recoverable situations into terminal ones.

### Month 3 (June 2026) — End of Launch Phase

| Scenario | Paying Customers | MRR | Founder Action |
|---|---|---|---|
| Best Case | 85 | £4,675 | Double down on content, consider first paid ad test (£300/mo) |
| Base Case | 28 | £1,176 | Focus on activation. Improve onboarding. Personal email to every trial user. |
| Pessimistic | 9 | £288 | Activate Plan C consulting. Book 2 done-for-you audits. Reassess pricing. |
| Catastrophic | 3 | £72 | Run 3 consulting audits at £500 each = £1,500/mo. Do NOT restructure product yet — too early. |

### Month 6 (September 2026) — Post-Launch Stabilisation

| Scenario | Paying Customers | MRR | Founder Action |
|---|---|---|---|
| Best Case | 280 | £15,400 | Hire part-time content writer (£800/mo). Begin partnership outreach. |
| Base Case | 75 | £3,150 | Run pricing experiment 2 (trial model). Activate 2 agency partnerships. |
| Pessimistic | 22 | £704 | Emergency revenue: 3 agency retainers at £700/mo = £2,100/mo bridge. Survey 20 users on PMF. |
| **Catastrophic** | **6** | **£144** | **PIVOT TRIGGER.** GTM is broken, not the product. Switch to direct outbound sales: 50 LinkedIn outreaches/week. Offer free Agency trial to 5 agencies. |

### Month 9 (December 2026) — Growth Phase Decision

| Scenario | Paying Customers | MRR | Founder Action |
|---|---|---|---|
| Best Case | 650 | £35,750 | Scale. Consider contractor hire. |
| Base Case | 160 | £6,720 | Start agency white-label push. Goal: 250 by Month 12. |
| Pessimistic | 45 | £1,440 | Restructure tiers. Remove/reduce free tier. Focus on 1 vertical only (UK agencies). |
| **Catastrophic** | **12** | **£288** | **Hard decision.** Either (a) pivot to pure services using Kritano as internal tooling, or (b) seek £15–25k angel investment for 6 more months of runway. |

### Month 12 (March 2027) — One Year In

| Scenario | Paying Customers | MRR | Founder Action |
|---|---|---|---|
| Best Case | 1,200 | £66,000 | Hire growth contractor. Consider PR/press. |
| Base Case | 300 | £12,600 | Strong solo business. Focus on reducing churn below 4%. |
| Pessimistic | 80 | £2,560 | Viable but fragile. Double down on agency retainers, or make one big swing (conference sponsorship, major press mention). |
| **Catastrophic** | **20** | **£480** | **The product works but the business doesn't.** Options: (1) Sell on Acquire.com for £5–15k, (2) Open-source core and offer hosted/support commercially, (3) Pivot to a niche vertical ("accessibility auditing for NHS suppliers"). |

### Month 18 (September 2027) — Sustainability Threshold

| Scenario | Paying Customers | MRR | ARR | Status |
|---|---|---|---|---|
| Best Case | 2,500+ | £137,500 | £1,650,000 | Scale and invest |
| Base Case | 600 | £25,200 | £302,400 | Sustainable solo business |
| Pessimistic | 150 | £4,800 | £57,600 | Modest but viable |
| Catastrophic | 30 | £720 | £8,640 | Not viable as primary income |

**Survival threshold:** £3,000/mo MRR (~70 paying customers). Achievable in even the pessimistic scenario by Month 12 if the consulting bridge is used properly.

---

## 18. Appendix

### A. Innovator's Moonshot Vision

**5-year (2031):** Kritano becomes the compliance infrastructure layer for the web. A Kritano compliance badge ("Verified WCAG 2.2 AA | Last audited 7 days ago") becomes a requirement in procurement responses.

**10-year (2036):** An AI-native audit engine that understands intent — not just whether a button has an ARIA label, but whether a screen reader user would understand the call to action.

**Platform play:** The "Let's Encrypt for accessibility" — issuing verifiable, dated compliance certificates that procurement portals accept as evidence of due diligence.

### A2. Recently Delivered (March 2026)

| Feature | What It Does | Competitive Impact |
|---|---|---|
| **Mobile audit pass** | Dual-pass crawl: desktop discovers pages, then mobile viewport (390×844, isMobile, hasTouch) re-visits each page running axe-core + 5 mobile-specific perf rules. Findings tagged desktop/mobile/both with automatic deduplication. | Only tool under $100/month offering both desktop and mobile accessibility + performance auditing. Starter+ tier ($19/month). |
| **Cold outreach log** | Admin page for manually tracking cold emails: email, date, replied, free audit given, became user, became paid, plan tier, notes. Stats dashboard with funnel metrics. | Closes the loop between NRD prospect discovery and conversion tracking — full outbound visibility without automated sending. |
| **KritanoBot/1.0** | Renamed crawler identity from PagePulser-Scanner to KritanoBot. Backward-compatible domain verification (accepts both old and new token prefixes). API keys now use `kt_live_` prefix (old `pp_live_` keys still accepted). | Clean brand identity across all touchpoints — user agents, verification tokens, API keys, email sender names. |
| **NRD pipeline improvements** | Output JSON filename matches the source feed date (not today's date). Government domains (.gov.uk, .gov, .mil, .police.uk, .nhs.uk) automatically excluded before HTTP check. | Prevents accidental scanning of government infrastructure; output files are correctly traceable to their source date. |

### B. Key Innovation Opportunities

1. **"The anti-overlay" positioning** — Target businesses currently paying for accessiBe/AudioEye.
2. **EAA compliance reporting** — EN 301 549 clause mapping. "Siteimprove's compliance reporting at 5% of the price."
3. **Overlay detection in audits** — Detect overlay scripts, surface as critical finding: "This site uses an overlay which does not constitute WCAG compliance. Here are the 47 genuine issues the overlay is masking."
4. **Anti-Overlay Certification Badge** — Verifiable embeddable badge with cryptographic hash, re-verification required monthly.
5. **Screaming Frog import flow** — Accept XML/CSV exports, enrich with accessibility/security/structured data.
6. **Legal firm referral partnerships** — 10–15% recurring commission for solicitors recommending Kritano. "Solicitor-recommended" is a trust signal competitors lack.
7. **WordPress / Shopify plugins** — Lightweight plugin showing basic Kritano score from WP admin dashboard. Acquisition channel disguised as distribution partnership.
8. **Hosting provider integrations** — Embed audits in hosting dashboards (Kinsta, Krystal, 20i) as "free accessibility scan" value-add.

### C. Partnership Playbook

#### Agency White-Label
Identify 10 UK agencies (10–50 employees) that don't offer accessibility auditing. Offer Kritano under their brand at £149/mo flat partner rate. **Expected yield:** 5 partners × £149 = £745/mo, 50+ sites audited.

#### Legal Firm Referrals
UK law firms specialising in digital compliance. £100–£150 referral fee per subscriber, or 15% recurring for 12 months. **Expected yield:** 3 firms × 2 clients/month = 6 new subscribers/month.

#### Hosting Provider Integration
UK WordPress hosts. Free monthly accessibility audit as customer value-add. £0.50–£1.00 per site per audit. **Expected yield:** One mid-size host with 2,000 customers = £1,400/mo passive.

### D. Non-Negotiable Pre-Launch Actions

1. ICO registration — £40
2. Off-site database backup — automated, encrypted, tested
3. Domain auto-renewal + transfer lock + Cloudflare DNS
4. Registrar 2FA — hardware or authenticator app only
5. Uptime monitoring with SMS alerts
6. Privacy Policy and Terms & Conditions
7. Acceptable Use Policy
8. 3-month cash runway in separate account
9. Runbook documented and tested
10. Digital estate clause with solicitor

---

*This business plan was compiled on 27 March 2026. Version 3.0 — anti-fragile rewrite. All projections use conservative base-case assumptions. Financial figures should be stress-tested against the sensitivity analysis in Section 11. Legal recommendations require professional solicitor review.*
