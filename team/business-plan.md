<!-- Version: 1 | Department: manager | Updated: 2026-03-24 -->

# Business Plan: PagePulser

**Prepared:** 24 March 2026
**Version:** 1.0
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
8. [Go-to-Market Strategy](#8-go-to-market-strategy)
9. [Growth & Customer Acquisition](#9-growth--customer-acquisition)
10. [Operations & Team](#10-operations--team)
11. [Financial Projections](#11-financial-projections)
12. [Funding Requirements](#12-funding-requirements)
13. [Legal & Compliance](#13-legal--compliance)
14. [Risks & Mitigation](#14-risks--mitigation)
15. [Milestones & Roadmap](#15-milestones--roadmap)
16. [Appendix](#16-appendix)

---

## 1. Executive Summary

PagePulser is a website intelligence and health auditing SaaS platform that gives freelancers, digital agencies, and in-house teams a single, authoritative view of their website's health across six dimensions: accessibility, SEO, security, performance, content quality, and structured data.

**The problem:** Businesses face mounting legal and commercial pressure to maintain accessible, performant, secure websites. The European Accessibility Act (enforced June 2025) creates compliance liability across 27 EU member states. ADA lawsuits in the US hit a record 4,605 in 2023. Google's Core Web Vitals directly influence search rankings. Yet the tools available to SMBs and agencies are either enterprise-priced (Siteimprove at $10,000–$80,000/year), single-category (Lighthouse for performance, WAVE for accessibility), or fundamentally flawed (accessiBe and AudioEye sell overlay patches that do not achieve genuine compliance). There is no unified, affordable, self-serve website health platform for the businesses that need it most.

**The solution:** PagePulser runs automated, multi-engine audits with scheduling from 15-minute to 7-day intervals, produces white-label PDF/CSV/JSON exports, and provides a public REST API — all starting at $19/month. The platform includes 500+ audit rules, historical trend tracking, team collaboration, and a referral programme. The Agency tier ($99/month) enables agencies to deliver branded health reports to clients without building internal tooling.

**The market:** The combined web accessibility testing ($700M, 19% CAGR) and website audit/SEO tools ($4B) market yields a serviceable addressable market of approximately $500M for English-speaking SMBs and agencies. PagePulser targets a serviceable obtainable market of ~$170K ARR (~430 paying customers) within three years.

**Business model:** Freemium SaaS with five tiers — Free ($0), Starter ($19/month), Pro ($49/month), Agency ($99/month), and Enterprise ($199/month). Gross margins of 88–93%. Unit economics: blended ARPU of $25/month (Year 1, dragged by founding discounts), rising to $38 by Year 3. Actual monthly infrastructure costs are low (~$25/month at launch).

**Financial projections (realistic base case):**

| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Paying Customers (EoY) | 103 | 235 | 408 |
| — of which Agency/Enterprise | 10 | 29 | 69 |
| Total Revenue | $19,354 | $70,500 | $155,600 |
| Operating Costs (excl. founder drawings) | $2,820 | $7,660 | $49,380 |
| Net before founder drawings | $16,534 | $62,840 | $106,220 |

Year 3's entire customer base — 408 people — would fit in a single conference room. In a market of 22,000 UK digital agencies and 1.2 million UK freelancers, that is 0.03% penetration.

**Funding:** Self-funded / bootstrapped. Monthly infrastructure costs are ~$28 at launch (server $12, Zoho £12, domain $1). Cash break-even is achieved at 2 paying customers. Founder drawings break-even (£3,000/month via salary + dividends) requires ~100 customers — projected around Month 18–24.

**Why now:** The European Accessibility Act created a compliance obligation for every business with a public-facing website in the EU. Businesses are actively searching for affordable, credible auditing tools — and the market's dominant accessibility products (overlays) are under legal and reputational attack. PagePulser enters a market with urgent, regulation-driven demand, no credible SMB-priced alternative, and a sole founder who can ship faster than committee-driven competitors.

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

1. **Legal liability is real and growing.** The European Accessibility Act (Directive 2019/882) came into force on 28 June 2025, creating enforceable accessibility requirements for digital products across 27 EU member states. The UK Equality Act 2010 creates parallel obligations. In the US, web accessibility lawsuits under ADA Title III hit 4,605 in 2023 (Seyfarth Shaw annual report) — a record. Businesses that cannot demonstrate their website meets WCAG 2.1 AA are exposed.

2. **Search rankings now depend on technical health.** Google's Core Web Vitals (LCP, CLS, INP) are confirmed ranking signals. A 1-second delay in page load reduces conversions by 7% (Portent, 2023). Performance auditing is no longer a developer concern — it is a marketing cost.

3. **AI-generated content creates quality risk.** Google's Helpful Content updates penalise thin, generic AI content. E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness) are quality markers that automated content struggles to demonstrate. Businesses publishing AI-generated copy without quality auditing are exposed to ranking penalties.

4. **Security expectations are rising.** HTTPS adoption reached 98%+ of Chrome traffic by 2024. The next frontier — HSTS, CSP, X-Frame-Options — is poorly understood by non-technical teams. A missing security header can expose user data or trigger browser warnings that destroy trust.

5. **No affordable unified tool exists.** Enterprise tools (Siteimprove, $10,000–$80,000/year) cover accessibility and content but price out SMBs. SEO tools (Semrush at $139/month, Ahrefs at $129/month) cover SEO but not accessibility or security. Accessibility-specific tools (accessiBe, AudioEye) sell overlay patches that are actively contested by the disabled community and do not achieve genuine WCAG compliance. Desktop crawlers (Screaming Frog) produce raw data with no monitoring, scheduling, or client-ready reporting. Free tools (Lighthouse, WAVE) are single-page, single-category, and require technical expertise.

The result: a freelancer managing 10 client websites currently needs 4–6 separate tools to cover SEO, accessibility, security, performance, content quality, and structured data — at a combined cost of $200–$500/month and hours of manual report collation.

### The Opportunity

**Regulatory urgency creates non-discretionary demand.** The EAA is not a trend — it is a structural shift. Every business with a website serving EU customers needs a tool to assess and document their compliance posture. This demand is active now.

**The overlay backlash creates a market vacuum.** accessiBe and AudioEye have spent millions on marketing and captured significant SMB awareness. But multiple class-action lawsuits, public opposition from disability advocacy organisations, and growing awareness that overlays do not achieve compliance are creating a buyer exodus. These customers need somewhere to go.

**SMB digital investment is accelerating.** Post-pandemic, UK SMBs increased digital marketing spend by 34% between 2021 and 2024 (Lloyds Bank Business Digital Index). The number of UK businesses maintaining a professional website exceeds 5.6 million. The vast majority have no systematic process for auditing that website.

**Agencies need white-label tools.** Digital agencies are being pushed by clients to include accessibility compliance in retainer scopes. Agencies need tools that are white-label capable, multi-site, and exportable. No competitor offers this combination at under $500/month.

### Market Size

| Metric | Value | Methodology |
|--------|-------|-------------|
| TAM | ~$5.6B | Combined web accessibility testing ($700M, 19% CAGR) and website audit/SEO tools ($4B) markets, de-duplicated, projected to 2026. Top-down from Grand View Research, MarketsandMarkets. |
| SAM | ~$500M | TAM filtered by English-language markets (35%), SMB + agency segment (65%), and self-serve SaaS buyers (70%). Cross-checked bottom-up: 8M addressable accounts x 15% conversion-eligible x $35 ARPU x 12 months = $506M. |
| SOM | ~$186K ARR | 0.04% SAM capture rate by Year 3, yielding ~430 paying customers at $38 blended ARPU. Conservative — reflects organic-only growth with a solo founder. Comparable bootstrapped SaaS benchmarks range 0.01–0.1% SAM capture in years 1–3. |

---

## 4. Solution & Product

### Product Overview

PagePulser is a cloud-based website intelligence platform that runs automated, multi-engine audits across six core categories — SEO, accessibility, security, performance, content quality, and structured data — plus three advanced intelligence modules: E-E-A-T scoring, AEO (AI Engine Optimisation), and Google Dorking security checks.

Users add verified domains, trigger on-demand or scheduled audits, and receive prioritised, actionable findings with historical tracking and team collaboration. Results are exportable as white-label PDF reports, CSV, or JSON, and accessible through a documented REST API.

**How it works:**
1. User registers, verifies email, adds a site with domain verification (DNS TXT or HTML file).
2. Triggers an audit, which enters a BullMQ-backed queue and processes pages up to the tier's crawl depth and page limit.
3. Each page is evaluated by the audit engines enabled for the user's tier.
4. Results are aggregated into a scored report: overall health score, per-category scores, individual issue findings with severity levels (critical, serious, moderate, minor, info), and trend data over time.
5. Users export, schedule recurring audits, compare snapshots, share team access, and query data through the API.

### Key Features

| Feature | Description | User Benefit |
|---|---|---|
| Six-engine audit suite | Simultaneous analysis across SEO, accessibility, security, performance, content quality, and structured data | Single source of truth for website health; no context-switching between tools |
| AEO Analysis | Checks page content and structure for AI engine discoverability signals | Stay visible as AI-powered search overtakes traditional SERPs |
| E-E-A-T Scoring | Evaluates Experience, Expertise, Authoritativeness, and Trustworthiness signals per page | Actionable path to meeting Google's quality evaluator expectations |
| Google Dorking security checks | Surfaces sensitive file exposures, admin panels, and indexing misconfigurations | Catches security issues that attackers use reconnaissance techniques to find |
| Scheduled audits | Recurring audits from 15-minute to 7-day intervals depending on tier | Catches regressions automatically without manual re-runs |
| Audit comparison | Side-by-side diff between two audit snapshots | Measures progress, attributes score changes to specific deployments |
| PDF / CSV / JSON export | Full finding exports with tier-based white-label branding | Delivers professional client reports or imports data into third-party tools |
| Public REST API | Documented API with scoped keys, tiered rate limits, and full endpoint coverage | Integrates audit data into custom dashboards, CI pipelines, and monitoring tools |
| Organisation / team management | Multi-seat accounts with role-based access per site | Agencies and teams collaborate without sharing credentials |
| White-label branding | Agency/Enterprise tiers apply custom logo and colours to exported reports | Resell auditing capability under a client's or agency's brand |
| Referral programme | Earn bonus audits per referral; milestone rewards at 5 and 10 referrals | Organic growth loop; reduces effective cost for active users |
| Audit history and trend analytics | Per-site score trends, category breakdowns, and issue velocity over time | Tracks improvement over weeks or months; justifies ongoing retainers to clients |
| Unique issue counting | Reports surface count of unique issues rather than raw total occurrences | Clearer picture of distinct problems to fix rather than inflated numbers |

### Product Roadmap

| Phase | Timeline | Key Deliverables |
|-------|----------|------------------|
| **Now (Q1–Q2 2026)** | March–June 2026 | Guided onboarding checklist, annual billing toggle, shareable public audit report links, Enterprise "Contact Sales" CTA, free tier description alignment |
| **Next (Q3 2026)** | July–September 2026 | In-app notification bell, webhooks for audit events (audit.completed, audit.failed, score.degraded), AI-powered fix suggestions (template-based), social proof on homepage/pricing, dashboard schedule health widget |
| **Later (Q4 2026+)** | October 2026 onwards | LLM-generated code fix suggestions (Claude integration), CLI tool and GitHub Action for CI/CD, Jira/Linear/GitHub Issues integration, Brand Voice Analysis module, anomaly detection on scheduled audits, GBP/locale-aware pricing |

### User Personas

**Maya — Freelance Web Developer**
28, Manchester. Self-taught, maintains 8–12 client websites. Clients ask "how is my website doing?" and she has no quick, credible answer without manually checking a dozen tools. Accessibility issues surface at launch causing unpaid remediation. PagePulser Starter ($19/month) gives her scheduled audits, PDF exports, and audit comparison to prove her work. Upgrades to Pro ($49/month) at 4+ clients.

**Daniel — Digital Marketing Manager at a Mid-Size Agency**
36, London. Non-technical, managing 20–30 client sites at a 12-person agency. Current audit process is manual and inconsistent. Client reports take 3–4 hours each. PagePulser Agency ($99/month) gives him white-label reports, team management, unlimited audits, and consistent methodology across all accounts. Justifies retainer renewals with trend data.

**Priya — Head of Digital at a Mid-Market E-Commerce Business**
41, Leeds. Owns SEO, performance, and CRO for a £8M/year Shopify Plus store. A performance regression cost £40,000 last year — discovered only after a customer complained. PagePulser Pro ($49/month) provides daily scheduled audits as a regression detection layer. Accessibility engine delivers the WCAG gap analysis needed for an upcoming partnership compliance requirement.

---

## 5. Market Analysis

### Industry Overview

PagePulser sits at the intersection of three converging market categories:

- **Website auditing and technical SEO tools** ($1.6B in 2024, ~14% CAGR)
- **Web accessibility testing platforms** ($590M in 2024, ~19% CAGR)
- **Website performance monitoring** ($1.2B in 2024, ~18% CAGR)

Combined TAM: ~$2.1B in 2024, projected ~$4.8B by 2029 (blended ~17% CAGR).

No single competitor currently owns the "unified website health" category at a price point accessible to SMBs and solo operators.

### Key Market Trends

1. **Accessibility legislation tightening globally** — EAA enforcement, UK Equality Act, ADA Title III lawsuits at record levels. Non-discretionary compliance demand.
2. **Core Web Vitals as commercial signal** — Performance auditing is now tied to search revenue, elevating perceived ROI of regular auditing.
3. **AI content quality risk** — Google's Helpful Content updates penalise generic AI content. Content quality auditing becomes a differentiator.
4. **Security headers becoming baseline** — HSTS, CSP, X-Frame-Options moving from advanced to expected.
5. **SMB digital investment accelerating** — UK SMBs increased digital spend 34% (2021–2024, Lloyds Bank). 5.6M+ UK businesses with professional websites.
6. **Agency market growing through regulatory demand** — Clients pushing agencies to include accessibility compliance in retainer scopes.

### Target Market Segments

| Segment | Size | PagePulser Tier | Buying Trigger |
|---|---|---|---|
| Freelance web developers (UK + international) | ~1.2M UK freelance digital workers; ~15M globally | Starter ($19/mo) | Need to prove quality of work; accessibility questions from clients |
| Small/independent digital agencies (2–25 staff) | ~22,000 digital agencies in UK; ~60% under 10 employees | Pro ($49) to Agency ($99) | Client accessibility compliance requirements; retainer justification |
| In-house marketing/content teams at SMBs | ~120,000 UK businesses with active digital marketing function | Starter to Pro | Accessibility complaint, Google penalty, or security incident |
| E-commerce operators | ~45,000 UK e-commerce sites with £50k+ annual revenue | Starter to Pro | Performance = revenue; every second of load time is lost conversion |
| Public sector and education | ~25,000 UK organisations subject to PSBAR 2018 | Enterprise ($199) | Mandatory accessibility compliance; longer sales cycle |

### Customer Profile

**Ideal customer:** A technically literate but non-specialist web professional (freelancer, agency account manager, or marketing lead) who is accountable for website quality but does not have the time, budget, or expertise to run multiple specialised tools manually. They value automation, plain-English findings, and exportable reports. They are increasingly asked about accessibility compliance by clients, partners, or legal teams and need a credible, affordable answer.

**Buying behaviour:** Discovers PagePulser through a blog post, community recommendation, or LinkedIn content. Starts on the free tier during a client engagement to generate a sample audit. Upgrades within 30–60 days when the value of scheduling, exports, or accessibility coverage becomes clear. Annual billing preferred for budget predictability (once available). Word-of-mouth referrals from peers are the highest-trust acquisition channel.

---

## 6. Competitive Landscape

### Direct Competitors

| Competitor | Strengths | Weaknesses | Pricing | Market Position |
|---|---|---|---|---|
| **Semrush Site Audit** | Massive brand (10M+ users), 140+ SEO checks, integrated keyword/backlink data | Accessibility is superficial; no security, content quality, or structured data depth. Expensive for audit-only use. | $139–$499/mo (bundled) | Dominant SEO; not an accessibility player |
| **Ahrefs Site Audit** | Strong crawl infrastructure, clean UI, excellent backlink integration | SEO only. No accessibility, security, performance scoring, or monitoring. | $129/mo–$14,990/yr | Strong mid-market SEO; irrelevant in accessibility |
| **Screaming Frog** | Industry standard technical SEO crawler. Highly configurable. Large community. | Desktop-only. No scheduling, monitoring, alerts, or cloud sync. No accessibility. Not a SaaS. | £259/year flat | Default for SEO consultants; inaccessible to non-technical buyers |
| **Lumar (DeepCrawl)** | Powerful enterprise crawl at scale. CI/CD integration. JavaScript rendering. | Completely inaccessible to SMBs by price. Sales-led. No accessibility depth. | ~$600–$3,000+/mo (enterprise only) | Enterprise technical SEO |
| **Siteimprove** | Deep WCAG testing (2.1/2.2 AA/AAA). Strong public sector presence. Content quality module. | Unaffordable for SMBs ($10,000–$80,000/yr). Slow sales process. Not self-serve. | ~$10,000–$80,000/yr | Enterprise accessibility leader |
| **accessiBe** | High brand recognition. Easy to implement (one script line). | Overlay approach does not achieve WCAG compliance. Sued by advocacy groups. Contested legitimacy. | $49–$249/mo | Wide SMB awareness; deeply contested |
| **AudioEye** | Automated + manual testing combination. Certification available. | Same overlay concerns as accessiBe. US-centric. Expensive at scale. | Free–$279/mo | Step above accessiBe; still overlay-reliant |
| **WAVE (WebAIM)** | Most trusted accessibility checker among professionals. Free. Developed by WebAIM. | Page-by-page only. No site-wide crawl, scheduling, or monitoring. No SaaS layer. | Free (extension); API from $30/mo | Gold standard for manual spot-checks; not a SaaS product |
| **SilkTide** | Deep WCAG compliance. Content quality. Good dashboards. | Starts ~$1,500/mo. Not self-serve. UK/EU public sector focus only. | ~$1,500+/mo | Public sector accessibility compliance |
| **Pope Tech** | WAVE-based engine with SaaS layer. Good remediation tracking. | Accessibility only. No SEO, security, performance, or content. US higher-ed focus. | $99–$449/mo | Niche leader in US higher education |

### Indirect Competitors & Alternatives

| Alternative | Why Used | Why Painful | PagePulser Response |
|---|---|---|---|
| Manual agency audits | High trust, contextual | One-off, £500–£5,000 each, findings go stale | Continuous monitoring alongside or replacing periodic manual audits |
| Google Search Console + Analytics | Free, authoritative | No accessibility, security, or content quality. Reactive, not proactive. | Complements GSC; surfaces issues GSC will not |
| Lighthouse (Google) | Free, every developer knows it | Single-page, single-category, no monitoring | PagePulser adds site-wide crawling, scheduling, and four additional categories |
| GTmetrix / PageSpeed Insights | Free, instant | Single-page, performance only | Performance is one of six PagePulser categories |
| Spreadsheet-based internal audits | Free, customisable | Time-intensive, inconsistent, not automated | Replaces manual checklists with automated, consistent, scheduled auditing |

### Competitive Advantage

1. **Unified six-category audit at SMB price.** No competitor offers depth across accessibility, SEO, security, performance, content quality, and structured data in a single product under $100/month with self-serve signup.
2. **Credible accessibility auditing.** Unlike overlays (accessiBe, AudioEye) and unlike SEO tools (Semrush, Ahrefs), PagePulser's accessibility engine is built to WCAG 2.1 AA as a first-class audit category.
3. **Continuous monitoring, not snapshots.** Scheduled audits turn website health into a continuous signal. 12 months of trend data creates switching cost.
4. **Agency white-label at $99/month.** No competitor offers white-label audit reports under $500/month.
5. **Cold prospect pipeline.** Monitoring newly registered domains (NRD feed) provides a systematic, proprietary acquisition channel no competitor has industrialised at SMB level.
6. **Bootstrapped pricing independence.** No investor mandate to raise prices. Founding member lifetime discounts are credible commitments.

---

## 7. Business Model & Pricing

### Revenue Model

Freemium SaaS subscription model with self-serve upgrade path. Revenue is generated entirely through monthly recurring subscriptions.

Three reinforcing layers:
- **Freemium acquisition funnel:** Free tier removes friction, generates word-of-mouth, provides upgrade pipeline.
- **Tier-based expansion:** Natural upgrade as businesses grow (more sites, seats, audit frequency).
- **Founding member cohort:** 200 early access spots at 50% lifetime discount seed the paying base with high-intent advocates.

### Pricing Strategy

| Tier | Monthly | Annual (est.) | Sites | Pages/Audit | Audits/Mo | Seats | Key Features |
|---|---|---|---|---|---|---|---|
| Free | $0 | — | 1 | 50 | 5 | 1 | SEO, Security, Content |
| Starter | $19 | ~$190/yr | 3 | 250 | 10 | 1 | + Accessibility, Performance, PDF export, 7-day scheduling |
| Pro | $49 | ~$490/yr | 10 | 1,000 | Unlimited | 5 | + E-E-A-T, AEO, Google Dorking, CSV/JSON, 1-day scheduling |
| Agency | $99 | ~$990/yr | 50 | 5,000 | Unlimited | Unlimited | + Structured Data, white-label, 1-hour scheduling |
| Enterprise | $199 | ~$1,990/yr | Unlimited | 10,000 | Unlimited | Unlimited | All features, 15-min scheduling, full API |

Annual pricing (2 months free, ~17% discount) is a near-term implementation priority. Competitor comparison: PagePulser is priced below Pope Tech (closest direct competitor) at every tier while offering comparable or superior features.

### Unit Economics

| Metric | Value | Notes |
|---|---|---|
| Blended ARPU (Year 1) | $25/mo | Founding members at 50% off heavily weight the average. Most early customers on Starter ($19 full / $9.50 discounted). |
| Blended ARPU (Year 2) | $32/mo | Full-price customers begin to dilute founding cohort; tier mix shifts toward Pro |
| Blended ARPU (Year 3) | $38/mo | Founding cohort is ~10% of base; more Pro and Agency customers |
| CAC (bootstrapped, imputed) | $50–$100 | Founder time at £25/hr opportunity cost: ~20 hrs/week on content, outreach, community. Yields ~5–10 new paying customers/month. |
| LTV (at 5% churn) | $475 | $25 ARPU × 95% margin × (1/0.05) = $475. Rises to $722 at Year 3 ARPU. |
| LTV:CAC | 5–10:1 | Healthy for bootstrapped SaaS. Compressed vs. prior estimate because CAC includes imputed founder time. |
| Payback Period | 2–4 months | At $25 ARPU and $75 imputed CAC |
| Gross Margin | 88–93% | Real infrastructure costs are very low (~$25/mo base). Stripe fees (2.9% + $0.30) are the primary COGS. |

---

## 8. Marketing & Growth Plan

This is a concrete, week-by-week marketing plan for a solo founder with no marketing budget. Every channel listed is either already built into the product or requires only time to execute.

### What's Already Built (Marketing Infrastructure)

Before planning, it's worth noting what already exists in the product:

| Asset | Status | Marketing Use |
|---|---|---|
| Cold prospect pipeline (NRD feed) | Built, operational | Outbound lead generation — newly registered domains with fresh websites |
| CRM with lead scoring | Built (10+ behavioural signals) | Prioritise who to talk to; trigger-based follow-ups |
| Behavioural email triggers | Built (first audit, domain stall, low scores, upgrade nudges, churn risk) | Automated nurture without manual effort |
| Blog CMS | Built, 20 posts published | SEO content engine |
| Referral programme | Built (5 refs = Starter, 10 refs = Pro) | Viral loop — needs surfacing |
| Early access funnel | Built (200 spots, source tracking, waitlist fallback) | Scarcity-based conversion — currently invisible on homepage |
| Email campaign system | Built | Newsletters, announcements, nurture sequences |
| PDF/CSV exports with branding | Built | Every exported report is a marketing impression |
| Public API with docs | Built | Developer audience discovery channel |

The marketing infrastructure is unusually complete for a pre-launch product. The gap is not tooling — it's execution and visibility.

---

### Channel 1: Cold Prospect Pipeline (Outbound)

**What it is:** The NRD (Newly Registered Domain) feed captures fresh domains daily. These are businesses that just launched a website and have not yet thought about accessibility, SEO, or performance. The cold prospect system scores, filters by TLD, and queues them for outreach.

**How it works (per CLAUDE.md — all emails sent manually by hand):**

1. Each morning, review the cold prospect queue in admin. The system pre-scores and filters prospects (TLD quality, generic email only, LIA-compliant).
2. Pick 10–15 high-quality prospects per day. Quality signals: .co.uk or .com TLD, business-sounding domain name, identifiable industry (e-commerce, professional services, hospitality).
3. Visit the domain briefly. Note one observable issue — missing meta description, no HTTPS, slow load, missing alt text on hero image. Takes 30 seconds per site.
4. Write a short, personal email from your own mailbox. Not a template — reference the specific domain, the registration date, and the one issue you noticed. Single CTA: "I built a free tool that checks this — here's your site's score."
5. Do not follow up. One email per domain. If they register, the in-app behavioural triggers take over.

**Volume:** 10–15 emails/day × 5 days/week = 50–75 per week. At a 3–5% reply rate and 10–15% of replies registering, that's 2–5 new free users per week from outbound alone.

**Time cost:** 45–60 minutes per day.

**Why this works:** New website owners are at peak awareness of their site's gaps. No one else is emailing them about accessibility within days of their domain going live. The personalisation (referencing a real issue on their real site) makes this feel like a recommendation, not spam.

**Compliance:** Emails go to generic business addresses (info@, hello@) only. System enforces 6-month auto-purge, unsubscribe on every email, and LIA documentation. All per PECR and UK GDPR.

---

### Channel 2: SEO Content (Organic Search) — 2 blog posts per week

**What exists:** 20 published blog posts, SEO-optimised with structured data (WebApplication, Product, Organization, Service, FAQPage) on all public pages. Full blog CMS built into the admin panel.

**Current gap:** Content is heavily weighted toward accessibility (8–9 of 20 posts). Only 2–3 each on security, performance, SEO. No comparison content ("PagePulser vs X"). No case studies.

**Publishing schedule: Tuesday + Thursday**

| Day | Slot | Focus |
|---|---|---|
| Tuesday | Post 1 | Educational / how-to (targets freelancers and in-house teams searching for solutions) |
| Thursday | Post 2 | Opinion / industry commentary / comparison (targets agencies and decision-makers via social shares) |

**Priority content queue (next 12 posts):**

| # | Title | Keyword Target | Intent |
|---|---|---|---|
| 1 | "How to Run Your First Website Accessibility Audit" | website accessibility audit | Top of funnel — directly feeds registration |
| 2 | "PagePulser vs Lighthouse: What's the Difference?" | pagepulser vs lighthouse | Comparison — captures people evaluating tools |
| 3 | "Website Security Headers Explained: A Non-Technical Guide" | website security headers guide | Fills the security content gap |
| 4 | "Core Web Vitals in 2026: What Actually Matters for Rankings" | core web vitals 2026 | Performance pillar + high search volume |
| 5 | "The European Accessibility Act: What UK Businesses Need to Know" | european accessibility act UK | Regulatory urgency — timely and high-intent |
| 6 | "Free Website Health Check: What It Finds and What It Misses" | free website health check | Bottom of funnel — searchers ready to try a tool |
| 7 | "Website Audit Checklist for Freelancers (2026)" | website audit checklist freelancers | Directly targets primary persona |
| 8 | "How Agencies Use Website Audits to Justify Retainer Fees" | website audit agency retainer | Targets Agency tier buyers |
| 9 | "Structured Data Testing: Why Schema Markup Matters for SEO" | structured data testing | Fills structured data content gap |
| 10 | "PagePulser vs Screaming Frog: Cloud Audits vs Desktop Crawling" | pagepulser vs screaming frog | Comparison — targets existing tool users |
| 11 | "AI Engine Optimisation (AEO): Preparing Your Site for AI Search" | AI engine optimisation AEO | Unique differentiator — no competitor covers this |
| 12 | "Case Study: How [Agency] Improved Client Scores by X Points" | website audit case study | Social proof — requires founding member data |

**Timeline:** 2 posts per week = 24 posts in 3 months. Combined with existing 20, that's 44 posts by Month 3 and 68+ by Month 6. SEO typically takes 3–6 months to compound, so expect meaningful organic traffic from Month 4–6 — faster than a 1/week cadence.

---

### Channel 3: Social Media — Daily X + Daily IG + 2–3x LinkedIn/week

All content is planned and tracked via the admin panel content scheduler (`/admin/marketing/content`), which supports week/day/platform scheduling, campaign grouping, and status tracking.

Full social media strategy is documented in `team/03-marketing/social-media.md`.

**X (Twitter) — daily posting:**
Developer credibility and accessibility community engagement. 1 post per day: audit insights, blog shares, quick tips, build-in-public updates. Daily engagement with #a11y, #webdev, #WCAG hashtags (10–15 min).

**Instagram — daily posting:**
Visual brand building for non-technical decision-makers (agency directors, marketing managers, business owners). Mix of educational carousels (3x/week), stat graphics (2x/week), short-form Reels (1x/week), and daily Stories. Brand visuals in indigo/amber palette.

**LinkedIn — 2–3 posts per week (Monday, Wednesday, Friday):**
Primary B2B acquisition channel. Where agency owners and marketing managers make purchasing decisions.

| Day | Content Type | Example |
|---|---|---|
| Monday | Data-driven insight | "I audited 50 UK agency websites this week. 78% fail basic WCAG contrast checks. Here are the 3 most common issues..." |
| Wednesday | Industry opinion | "The EAA is 9 months old and most UK agencies still can't tell you what it is." |
| Friday | Build in public | "PagePulser just crossed 50 paying customers. Here's exactly what worked and what didn't." |

**Rules across all platforms:**
- Never post "Check out PagePulser!" in isolation. Every post must teach something or share a real number.
- Engage daily — reply to comments, contribute to relevant threads, comment on posts from target audience.
- No external links in LinkedIn post body (suppresses reach). Put links in first comment.
- Content recycling: every blog post generates 3–5 social posts across platforms.

**Time cost:** ~9 hours/week across all three platforms (creation + engagement). Can be reduced to ~5 hours by batching Instagram content weekly and cross-posting X ↔ LinkedIn where appropriate.

---

### Channel 4: Community (Reddit, Indie Hackers, Hacker News)

**Reddit:**
- Subreddits: r/webdev (2.3M members), r/SEO (230K), r/accessibility (30K), r/webdesign (700K), r/Entrepreneur (2M)
- Approach: answer questions where PagePulser is genuinely the right answer. Do not create promotional posts. Spend 15 minutes per day browsing and answering.
- Example: Someone posts "What tools do you use to audit client sites?" — answer with your honest stack, mentioning PagePulser alongside Lighthouse, Screaming Frog, etc. Authentic, not salesy.

**Indie Hackers:**
- Create a product page. Post monthly revenue milestones. The IH audience loves bootstrapped SaaS transparency.
- Expected: 5–15 signups per milestone post from a highly qualified audience.

**Hacker News:**
- One "Show HN" post at public launch. Timing matters — post Tuesday–Thursday, 6–8am US time.
- Be responsive to every comment for the first 24 hours.
- Expected: 500–2,000 visits in 24 hours, 20–50 signups if the post reaches the front page.

**Product Hunt:**
- Schedule for after onboarding and annual billing are shipped (Q3/Q4 2026).
- Prepare: hunter, maker comment, 10–15 supporters committed to upvote on launch day, high-quality screenshots and video demo.
- Target: Top 10 in Developer Tools category. Realistic — PagePulser's breadth and pricing are genuinely differentiated.

**Time cost:** ~30 minutes/day browsing + responding. Milestone posts take 1–2 hours each (monthly).

---

### Channel 5: Referral Programme (Built-In Viral Loop)

**Current state:** Functional but invisible. The referral system is fully built but not surfaced prominently in the UI.

**How it works — both sides get rewarded:**

Every successful referral rewards *both* the referrer and the new user:

| | What the Referrer Gets | What the Referred User Gets |
|---|---|---|
| **Per referral** | 5–12 bonus audits (scales by tier: 5 on Free/Starter, 8 on Pro, 12 on Agency/Enterprise) | 3 bonus audits on signup |
| **5 referrals milestone** | 30 days of Starter free ($19 value) | — |
| **10 referrals milestone** | 30 days of Pro free ($49 value) | — |

Max 50 referrals per month per user.

**Why this is compelling:**
- For a **Free tier user**, 5 referrals unlocks Starter for a month — that's accessibility scoring, PDF exports, and scheduling for free. It's a genuine incentive to share.
- For a **Starter user**, 10 referrals gives them a month of Pro — 10 sites, unlimited audits, E-E-A-T, AEO, and CSV/JSON exports. A tangible upgrade they can feel.
- For **agencies**, the 12 bonus audits per referral are meaningful — an agency running 30 client sites burns through audits fast. Every referral extends their capacity.
- The **referred user** gets 3 bonus audits immediately, which is enough to audit 3 sites on day one — a strong first impression that drives activation.

**Fixes needed to surface this:**
1. Add referral CTA to the dashboard (persistent, not dismissable) — "Refer a friend, earn bonus audits"
2. Add referral mention to the pricing page ("Know someone who'd benefit? Refer 5 friends, get Starter free for 30 days.")
3. Add social sharing buttons to referral page (LinkedIn, Twitter/X, WhatsApp, copy-link)
4. Pre-written share messages: "I've been using PagePulser to audit my sites — found [X] accessibility issues I didn't know about. Try it free and we both get bonus audits: [referral link]"
5. Trigger referral prompt at peak satisfaction moments: after a score improvement, after domain verification, after first export
6. Show milestone progress on the referral dashboard ("2 of 5 referrals — 3 more to unlock free Starter!")

**Expected contribution:** 10–15% of new signups by Month 12 if properly surfaced. Near-zero cost — the bonus audits cost almost nothing in infrastructure.

---

### Channel 6: Email Nurture (Automated Conversion)

**Built-in triggers that already exist:**

| Trigger | Current State | Action Needed |
|---|---|---|
| First audit completed | Active | Ensure follow-up email highlights upgrade benefits |
| Domain verification stall (48h) | Active | Keep — this is working |
| Low audit score | Active | Keep — drives engagement |
| Upgrade nudge (at tier limits) | Active | Keep — natural conversion moment |
| Trial expiry warning (3 days) | Built but **skipped** | **Enable this immediately** — zero effort, high impact |
| Churn risk (14 days inactive) | Active | Keep |
| Win-back (30/60 days churned) | **Not built** | Build — offer a free audit token to re-engage |

**New sequence to build (5-email onboarding nurture for free users):**

| Day | Subject | Content |
|---|---|---|
| 0 | "Welcome — here's what PagePulser found" | Audit summary if they ran one; prompt to run first audit if not |
| 2 | "Your site has [X] accessibility issues — here's why that matters" | EAA context, link to accessibility blog post, "upgrade to unlock full accessibility scoring" |
| 5 | "3 things PagePulser checks that Lighthouse doesn't" | Security headers, structured data, content quality — differentiation education |
| 10 | "Your free plan includes 5 audits/month — you've used [X]" | Usage context + upgrade CTA if approaching limit |
| 14 | "Set it and forget it: scheduled monitoring starts at $19/mo" | Scheduling as the key upgrade trigger — "catch issues before your clients do" |

---

### Weekly Marketing Schedule (Solo Founder)

This is the realistic week. Everything fits in ~16–18 hours — roughly half the working week on marketing, half on product.

| Day | Activity | Time | Channel |
|---|---|---|---|
| **Monday** | Cold prospect outreach (10–15 emails). LinkedIn post. X post. IG post + stories. GSC keyword check. | 3 hrs | Outbound, Social, SEO |
| **Tuesday** | Write + publish blog post 1. X post (share blog). IG carousel. Reddit/community browsing. | 3.5 hrs | SEO, Social, Community |
| **Wednesday** | Cold prospect outreach (10–15 emails). LinkedIn post. X post. IG post. | 2.5 hrs | Outbound, Social |
| **Thursday** | Write + publish blog post 2. X post (share blog). IG post. Internal link updates. | 3 hrs | SEO, Social |
| **Friday** | Cold prospect outreach (10–15 emails). LinkedIn post. X post. IG post. Weekly metrics review. | 2.5 hrs | Outbound, Social, Analytics |
| **Saturday** | X post. IG story. Optional: batch-create next week's IG carousels. | 0.5–1 hr | Social |
| **Sunday** | X post. Plan next week's content in admin scheduler. Optional: IH milestone post (monthly). | 0.5–1 hr | Social, Community |

**Total: ~16–18 hours/week on marketing.** The remainder is product development.

**If time is tight, prioritise in this order:**
1. Blog (2/week) — permanent SEO assets. Non-negotiable.
2. Cold prospect outreach — immediate, personalised, highest early conversion.
3. LinkedIn (2–3/week) — where buyers are.
4. X (daily) — quick if cross-posting from blog/LinkedIn.
5. Instagram (daily) — can batch-create carousels on Sunday.
6. Reddit/community — high quality but low volume. Cut first.

---

### Channel Ranking by Expected Impact

| Rank | Channel | Expected Signups/Month (Month 6) | Cost | Time/Week | Why This Rank |
|---|---|---|---|---|---|
| 1 | Cold prospect pipeline | 10–20 | £0 | 3 hrs | Already built. Immediate. Personalised. Highest conversion of any channel. |
| 2 | SEO content (2 blogs/week) | 10–25 (growing) | £0 | 6 hrs | Compounds. At 2/week, the content library hits 68+ posts by Month 6 — double the velocity accelerates SEO. |
| 3 | LinkedIn (2–3/week) | 5–10 | £0 | 2.5 hrs | Where B2B buyers are. Founder credibility converts into direct signups. |
| 4 | X / Twitter (daily) | 5–10 | £0 | 1.5 hrs | Dev and accessibility community. Quick wins. Build-in-public creates audience. |
| 5 | Instagram (daily) | 3–8 | £0 | 2.5 hrs | Brand awareness for non-technical decision-makers. Slower to convert but builds recognition. |
| 6 | Referral programme | 3–8 | £0 | 0 hrs (fix once) | Free, built-in, compounds. Just needs to be surfaced. |
| 7 | Community (Reddit/IH/HN) | 2–5 | £0 | 1 hr | Spiky (big on launch day, quieter otherwise). High-quality signups. |
| 8 | Email nurture | Conversion, not signups | £0 | 0 hrs (build once) | Converts free → paid. Biggest impact on the 3% conversion rate assumption. |

**Total expected new free signups by Month 6: 38–86/month.** At 3% conversion, that's 1–3 new paying customers per week. The daily social cadence and 2x blog frequency significantly increase surface area compared to a minimal marketing approach.

**By Month 12** (SEO compounding from 68+ posts, referrals growing, social audiences established): 120–200 signups/month, yielding 4–6 new paying customers per week. This is where the model starts to work.

---

### Activation & Onboarding

**Aha moment:** User sees their own website's accessibility score and issue list within their first session.

**Target:** Under 4 minutes from email confirmation to first completed audit result.

**Current gap:** No structured onboarding flow exists (highest-priority product fix).

**Proposed onboarding flow:**
1. Post-registration redirect to onboarding checklist (not blank dashboard)
2. Empty state with prominent "Add Your First Site" CTA
3. Immediate audit trigger after site addition with live progress indicator
4. Optimised results page: large score, top 3 critical issues, upgrade CTA
5. Domain verification prompt with clear value statement

Expected activation improvement: 20–40% more users reaching first audit.

### Retention & Churn Prevention

**Core habit loop:**
- **Cue:** Scheduled weekly/monthly audit runs + email digests showing score changes
- **Routine:** User reviews score changes and new issues
- **Reward:** Score improvement is emotionally satisfying; regressions create urgency

The habit loop only works if the user sets up scheduling — which requires domain verification. This is why onboarding must push toward verification, not just the first audit.

**Key retention metrics to track:**

| Metric | Y1 Target | Y2 Target | Y3 Target |
|---|---|---|---|
| Activation Rate (reg → first audit) | 45% | 60% | 70% |
| Domain Verification Rate | 25% | 40% | 55% |
| Free-to-Paid Conversion | 3% | 5% | 7% |
| Monthly Churn (paid) | <5% | <4% | <3.5% |
| NPS | 30 | 45 | 55 |
| Time to First Audit (median) | <6 min | <4 min | <3 min |

---

## 10. Operations & Team

### Current Team

**Team size:** 1 (solo founder)

Chris Garlick handles all product development, infrastructure, content, marketing, support, and business operations. The product is technically mature for a one-person operation: real job queue with concurrency controls, robust Stripe billing lifecycle, GDPR tooling, CMS, CRM, cold prospect tracking, referral system, and comprehensive admin tooling. This is not an MVP — it is a feature-rich platform built and maintained by one person.

### Hiring Plan

| Phase | MRR Threshold | Role | Format | Est. Cost | Rationale |
|---|---|---|---|---|---|
| 1 (now–Month 18) | £0–£3k | No hires | — | — | Constraint is acquisition, not headcount. Automate ops gaps. Revenue does not support any payroll. |
| 2 (Month 18–30) | £3k–£5k | Part-time Support | 10–15 hrs/week, freelance | £1,000–£1,500/mo | Support volume consuming engineering time; churn prevention. Only affordable once MRR clears £3k. |
| 3 (Month 24–36) | £5k–£12k | Part-time Content Marketer | 15–20 hrs/week, freelance | £1,500–£2,500/mo | SEO content is compounding; need production volume. Both hires combined = £2,500–£4,000/mo. |
| 4 (Month 36+) | £12k+ | Software Engineer (mid-level) | Full-time, UK-based | £55,000–£72,000/yr total | Roadmap exceeds solo capacity. Only viable once MRR comfortably covers founder salary + both freelancers + this hire. |

**Intentionally deferred:** DevOps/SRE (infrastructure simple enough until £15k MRR), sales hire (product-led at this price point), designer (brand guidelines established), in-house finance (use accountant firm at £150–£300/month).

### Tools & Infrastructure

| Category | Tool | Status | Monthly Cost |
|---|---|---|---|
| Runtime | Node.js, Express | Active | Included in server |
| Server (VPS) | Single cloud droplet | Active | $12 (scaling) |
| Database | PostgreSQL (on VPS or managed) | Active | Included in server |
| Queue | BullMQ + Redis | Active | Included in server |
| Payments | Stripe | Active | 2.9% + $0.30/txn |
| Email (business) | Zoho Mail | Active | ~$15/mo (£12) |
| Email (transactional) | Resend or Postmark | Active | Free tier |
| Browser automation | Playwright | Active | Included in server |
| Frontend | React, TypeScript, Vite, Tailwind CSS | Active | — |
| Domain | pagepulser.com | Active | $12/year |
| Error monitoring | Sentry | To enable | Free tier |
| Uptime monitoring | Better Stack or UptimeRobot | To add | Free tier |
| Off-site backup | Backblaze B2 or DO Spaces | To add | $3–$6/mo |
| Claude Code (Max plan) | AI development tooling | Planned (Month 7+) | ~$200/mo |
| LLM integration server | AI fix suggestions | Planned (Year 2+) | $50–$200/mo |
| Support ticketing | Plain | To add at ~£3k MRR | $15–$30/mo |
| Product analytics | PostHog | To add at ~£8k MRR | Free tier |

### Key Processes

- **Deployment:** Manual SSH with pre-deploy backup, `npm ci`, migration, `pm2 reload`, health check, 5-minute monitoring. No CI/CD pipeline (per project requirements).
- **Incident response:** Uptime monitor alert → SSH → PM2 status → diagnose → resolve → document root cause within 48 hours.
- **Weekly ops rhythm:** Monday 30 minutes — uptime review, Sentry check, log sizes, Stripe dashboard, support triage.
- **Support SLAs:** Free tier: 48h best effort. Starter/Pro: 24h. Agency/Enterprise: 4h.

---

## 11. Financial Projections

### Actual Operating Costs

These are the real, verified costs — not estimates from a department model.

**Current monthly costs:**

| Item | Monthly Cost | Notes |
|---|---|---|
| Server (VPS) | $12 | Will scale as paying customers and audit volume increase |
| Zoho Mail | ~$15 (£12) | Business email |
| Domain | ~$1 ($12/year) | Annual renewal |
| Stripe fees | 2.9% + $0.30/txn | Variable; ~$0.73 + $0.30 per $25 ARPU customer |
| **Total current base** | **~$28/mo** | |

**Planned future costs (not yet incurred):**

| Item | Monthly Cost | When |
|---|---|---|
| Server upgrade (scaling with customers) | $25–$75 | As audit volume grows |
| Claude Code subscription (Max plan) | ~$200 | When AI features are in development |
| LLM integration server | $50–$200 | When AI fix suggestions ship |
| Off-site backup (Backblaze B2) | $3–$6 | Immediate priority |
| Sentry (error monitoring) | $0–$26 | Free tier initially |
| Support ticketing (Plain) | $15–$30 | At ~£3k MRR |

**Cost trajectory:**

| Period | Monthly Infra/Tool Cost | Notes |
|---|---|---|
| Now (pre-launch) | ~$28 | Server + Zoho + domain |
| Months 1–6 | ~$50 | + backup, monitoring, slight server scaling |
| Months 7–12 | ~$250–$300 | + Claude Code Max ($200), server scaling |
| Year 2 | ~$350–$500 | + LLM server, support tooling, larger VPS |
| Year 3 | ~$500–$800 + staff | + part-time hires change the cost structure entirely |

### Revenue Projections (Realistic Base Case)

**Key model inputs:**
- Founding member spots: 200 target. Assume 150 actually register (75% fill). Of those, 25% convert to paid = ~38 paying customers.
- Founding ARPU: ~$18 (most on discounted Starter at $9.50; some on Pro at $24.50)
- Full-price ARPU: ~$30 (weighted toward Starter initially, shifting toward Pro over time)
- Monthly churn: 5% in Year 1 (no onboarding), 4% in Year 2, 3.5% in Year 3
- Organic new paying customers: 5–8/month in Months 1–6, rising to 10–15/month by Month 12 as SEO compounds
- No paid acquisition in Year 1

### Year 1 Monthly Build-Up

| Month | New Paying | Churned | Total Paying | Blended ARPU | MRR |
|---|---|---|---|---|---|
| 1 | 38 (founding) + 5 | 0 | 43 | $20 | $860 |
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

**Year 1 total revenue: ~$19,354** (sum of monthly MRR)

*ARPU rises gradually as full-price customers dilute the founding cohort.*

#### Year 1 Tier Breakdown (103 customers at Month 12)

| Tier | Founding (50% off) | Full-Price | Total | MRR |
|---|---|---|---|---|
| Starter ($19) | 15 × $9.50 | 55 × $19 | 70 (68%) | $1,188 |
| Pro ($49) | 4 × $24.50 | 19 × $49 | 23 (22%) | $1,029 |
| Agency ($99) | 1 × $49.50 | 7 × $99 | 8 (8%) | $743 |
| Enterprise ($199) | 0 | 2 × $199 | 2 (2%) | $398 |
| **Total** | **20** | **83** | **103** | **$3,358** |

*Note: ~18 of the original 38 founding members have churned by Month 12 (5% monthly over 12 months). The MRR here is slightly higher than the month-by-month model because the tier mix improves toward year-end as agencies and Pro users join.*

**What 103 customers actually looks like:**
- 70 freelancers or small business owners paying $19/month — that is one new Starter customer every 5 days
- 23 growing teams or agencies who hit site/scheduling limits and upgraded to Pro — roughly 2 per month
- 8 agencies using white-label reports for clients — less than one per month
- 2 larger organisations on Enterprise — one per 6 months

This is not a mass-market play. It is 103 people who audit websites regularly and find enough value to keep paying. In a market of 22,000 UK digital agencies alone, 8 Agency customers is 0.04%.

---

### Year 2 Projections

- Starting customers: 103
- Churn improves to 4% (onboarding shipped)
- New paying: 12–20/month (SEO compounding, annual billing live mid-year)
- ARPU rises to ~$32 as Pro tier adoption grows and annual billing adds ~10% uplift

| Quarter | New Paying | Churned | EoQ Customers | Quarterly Revenue |
|---|---|---|---|---|
| Q1 | 42 | 12 | 133 | $12,200 |
| Q2 | 48 | 16 | 165 | $15,800 |
| Q3 | 54 | 20 | 199 | $19,500 |
| Q4 | 60 | 24 | 235 | $23,000 |

**Year 2 total revenue: ~$70,500**

#### Year 2 Tier Breakdown (235 customers at Month 24)

| Tier | Count | % | MRR | What This Looks Like |
|---|---|---|---|---|
| Starter ($19) | 148 | 63% | $2,812 | ~3 new freelancers or small businesses per week |
| Pro ($49) | 58 | 25% | $2,842 | ~1 upgrade per week as users outgrow Starter |
| Agency ($99) | 24 | 10% | $2,376 | 2 new agencies per month — still a tiny fraction of the market |
| Enterprise ($199) | 5 | 2% | $995 | One every 2–3 months. Mostly companies needing 15-min scheduling. |
| **Total** | **235** | | **$9,025** | |

*Founding member mix is now ~8% of the base (surviving founding customers diluted by full-price growth). ARPU is climbing toward $38 as Pro and Agency tiers grow their share.*

**In context:** 24 agencies paying $99/month is 0.1% of UK digital agencies. 5 Enterprise customers is negligible. These are not ambitious numbers — they require the product to be good enough that a small, findable audience keeps paying.

---

### Year 3 Projections

- Starting customers: 235
- Churn: 3.5% (mature product, better retention)
- New paying: 20–30/month (content marketing flywheel, agency partnerships, small paid acquisition test)
- ARPU: ~$38 (more Pro/Agency mix, annual billing established, founding cohort now ~5% of base)
- First hires: part-time support (£1,200/mo) and part-time content marketer (£1,800/mo) from Q1

| Quarter | New Paying | Churned | EoQ Customers | Quarterly Revenue |
|---|---|---|---|---|
| Q1 | 66 | 25 | 276 | $31,500 |
| Q2 | 72 | 30 | 318 | $36,300 |
| Q3 | 78 | 34 | 362 | $41,300 |
| Q4 | 84 | 38 | 408 | $46,500 |

**Year 3 total revenue: ~$155,600**

#### Year 3 Tier Breakdown (408 customers at Month 36)

| Tier | Count | % | MRR | What This Looks Like |
|---|---|---|---|---|
| Starter ($19) | 229 | 56% | $4,351 | ~5 new per week. The long tail of freelancers discovering PagePulser through blog posts. |
| Pro ($49) | 110 | 27% | $5,390 | The growth tier. Users who started on Starter and upgraded, or came in directly from agency referrals. |
| Agency ($99) | 53 | 13% | $5,247 | ~1 new agency per week. These are small agencies (2–10 people) using white-label for 10–30 client sites each. |
| Enterprise ($199) | 16 | 4% | $3,184 | ~1 per month. Larger organisations or accessibility consultancies. "Contact Sales" flow drives these. |
| **Total** | **408** | | **$18,172** | |

*MRR here is higher than the blended model because the tier mix has shifted substantially toward Pro and Agency by Year 3. This is the natural upgrade path working: freelancers → Starter → Pro, agencies → Pro → Agency.*

**In context:** 408 paying customers in a market of millions of website owners, 22,000 UK agencies, and 1.2 million UK freelancers. That is 0.03% of the UK freelancer market and 0.24% of UK agencies. The entire Year 3 customer base would fit in a single conference room. The question is not "does the market exist" — it is "can we find 408 people who care enough about website health to pay $19–$199/month." Given that the EAA makes accessibility a legal obligation and Google makes performance a ranking factor, the demand is not theoretical.

---

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
| Stripe Fees (~3.2% of revenue) | $620 | $2,260 | $4,980 |
| **Total Operating Costs** | **$2,820** | **$7,660** | **$49,380** |
| **Net before founder drawings** | **$16,534** | **$62,840** | **$106,220** |
| Gross Margin | 93% | 93% | 91% |

*Note: "Net before founder drawings" is the cash the business generates. The founder extracts income tax-efficiently via small PAYE salary (up to NI threshold ~£12,570/yr) plus dividends. Year 1 generates ~$16.5K cash — enough to cover a modest founder drawing but likely supplemented by savings. Year 2 onward the business is self-sustaining.*

### Break-Even Analysis

| Milestone | Customers Required | What That Looks Like | Projected Timeline |
|---|---|---|---|
| Cash break-even (infra only, ~$28/mo) | 2 Starter customers | Two freelancers | Month 1 |
| Cash break-even (with Claude Code Max, ~$228/mo) | 10 Starter or 5 Pro | A handful of freelancers | Month 2–3 |
| Founder min. drawings (£3k/mo = ~$3,800 + $250 infra) | ~100 Starter, or 60 Starter + 15 Pro + 3 Agency | A small community | Month 18–24 |
| Founder comfortable (£5k/mo = ~$6,350 + $400 infra) | ~170 Starter, or 100 Starter + 40 Pro + 10 Agency | Half a conference room | Month 24–30 |

*Infrastructure costs are trivially low — the business is cash-positive from its first two customers. The real question is how quickly the customer base grows large enough for the founder to draw a living income. At realistic organic growth, that takes 18–24 months. But the numbers are not daunting: founder sustainability requires roughly the same number of customers as a medium-sized pub has regulars.*

### Key Assumptions

| # | Assumption | Value | Risk if Wrong |
|---|---|---|---|
| 1 | Founding member spots filled | 150 of 200 (75%) | At 50% fill (100), opening paid base drops to ~25 |
| 2 | Founding member paid conversion | 25% | At 15%, only ~23 paid at launch — very slow start |
| 3 | Monthly churn rate | 5% Y1, 4% Y2, 3.5% Y3 | At 8%, customer base barely grows — see sensitivity matrix |
| 4 | Blended ARPU | $25 Y1 → $32 Y2 → $38 Y3 | If most users stay on Starter, ARPU could be $20 or lower |
| 5 | Organic new paying customers | 5–13/mo Y1, growing to 30/mo Y3 | SEO takes 6–12 months; early months could be 2–3/month |
| 6 | No paid acquisition Year 1 | $0 marketing spend | If organic underperforms, growth stalls |
| 7 | Server costs scale modestly | $12 → $75 over Year 1 | Heavy Enterprise users running 15-min schedules could spike costs |
| 8 | Claude Code Max added Month 7 | $200/mo | Adds ~$1,200 to Year 1 costs; needed for AI feature development |
| 9 | No Enterprise customers Year 1 | 0 assumed | Any Enterprise deal is upside but also infra risk |
| 10 | Founder has 12–18 months of personal savings | Needed to bridge to salary break-even | Without runway, founder must take freelance work, slowing product development |

### Sensitivity Analysis

**Steady-state MRR at 150 monthly free signups (realistic organic volume):**

| | Churn 3% | Churn 5% | Churn 8% |
|---|---|---|---|
| **Conversion 2%** | $2,500 | $1,500 | $938 |
| **Conversion 3%** | $3,750 | $2,250 | $1,406 |
| **Conversion 5%** | $6,250 | $3,750 | $2,344 |

*Steady-state = (monthly signups × conversion rate / churn rate) × ARPU ($25)*

**What this means in plain terms:**
- **Central case (3% conversion, 5% churn, 150 signups/mo):** Steady-state of ~$2,250 MRR = ~$27K ARR. This supports infrastructure comfortably but does not replace a salary on its own.
- **To reach £3,000/mo founder salary break-even ($3,800 + $250 infra = $4,050 MRR):** Need either higher signups (~300/mo), better conversion (5%+), or lower churn (3%).
- **Pessimistic case (2% conversion, 8% churn):** MRR caps at ~$938 — covers infrastructure but nothing else.

**Variable importance ranking:**
1. **Conversion rate** — Most actionable. Fixing onboarding could shift from 2% to 4%, doubling revenue.
2. **Churn rate** — Second most impactful. Onboarding + engagement triggers reduce churn from 5% to 3%.
3. **Signup volume** — Takes longest to improve (SEO compounding). Most important for long-term scale.
4. **ARPU** — Annual billing and tier mix shifts help, but the effect is smaller than fixing conversion/churn.

**Key insight:** At realistic organic volumes, the business needs BOTH good conversion (3%+) AND manageable churn (<5%) to reach sustainability. Onboarding is the single feature that improves both simultaneously.

---

## 12. Funding Requirements

### Self-Funded / Bootstrapped

PagePulser is self-funded by the solo founder. No external investment has been raised or sought. This is a deliberate strategic choice.

**Advantages of the bootstrapped path:**
- Full equity ownership retained
- Product decisions driven by customers, not investors
- Infrastructure costs are trivially low (~$28/month) — the business generates cash from its first few customers
- No dilution, no board, no runway pressure

**The honest trade-off:** The founder needs 18–24 months of personal savings or alternative income to bridge to salary break-even (~150 paying customers). The business will generate cash from Month 1, but not enough to replace a salary until the customer base reaches critical mass. This is the primary constraint of the bootstrapped path — not capital, but founder sustainability.

### Milestones That Would Trigger Considering External Funding

| Milestone | Why It Triggers the Conversation |
|---|---|
| Consistent $10,000+ MRR with 3-month plateau | Organic growth ceiling; paid acquisition could unlock next stage |
| Enterprise channel requiring a £60k+ sales hire | Revenue supports hire but timing requires upfront capital |
| Strategic partnership requiring upfront integration investment | Opportunity cost of self-funding prohibitive |
| Geographic expansion requiring localisation and compliance | Multi-market expansion is capital-intensive |
| A direct competitor raises institutional capital | Defensive investment to maintain product velocity |

**Preferred funding approach if pursued:** Revenue-based financing (Pipe, Capchase, Clearco) or a small angel round (£150k–£300k) from SaaS-experienced operators. No VC funding sought unless ARR exceeds £1M with a clear path to £10M+ — dilution is not justified below that threshold.

**Current recommendation:** Remain bootstrapped through Year 2. Revisit if/when MRR reaches $5,000+ with clear evidence of product-market fit and a proven conversion funnel.

---

## 13. Legal & Compliance

> **DISCLAIMER:** This section was AI-generated and has not been reviewed by a qualified solicitor. Nothing below constitutes legal advice. Professional legal review is required before acting on any recommendation.

### Legal Structure

**Entity:** UK Private Limited Company (Ltd), registered in England and Wales. Limited liability separates personal assets from business liabilities — critical given the platform scans third-party websites and holds personal data. All IP (codebase, brand name, domains, content) must be formally owned by the Ltd company via written IP assignment.

### Intellectual Property

- **Trademark:** "PagePulser" to be registered with UKIPO (Class 42, ~£170). EU trademark (EUIPO, ~€850) recommended within 12 months given EAA market opportunity.
- **Trade secrets:** Audit engine rule set (500+ rules), scoring/weighting algorithms, Brand Voice Analysis methodology, cold prospect prioritisation logic — protected via NDAs, IP assignment clauses, and private repository.
- **Copyright:** Source code and content automatically protected by UK Copyright, Designs and Patents Act 1988. Open-source licence audit recommended to confirm no copyleft (GPL) in production code.

### Regulatory Considerations

| Regulation | Applicability | Status |
|---|---|---|
| **UK GDPR / DPA 2018** | Processes personal data (accounts, audits, billing, cold prospects) | ICO registration required (£40–£60/yr). Record of Processing Activities (ROPA) needed. Data Processing Agreements with all sub-processors. |
| **PECR 2003** | Electronic marketing to UK individuals | Soft opt-in for existing customers. Cold outreach requires formal Legitimate Interest Assessment (LIA). |
| **European Accessibility Act** | PagePulser's own web application must meet WCAG 2.1 AA when serving EU customers | Self-audit required. Also a market opportunity for the product. |
| **Computer Misuse Act 1990** | Scanning third-party websites | Domain verification system + consent modal with CMA acknowledgment. Legal review of consent text recommended. |
| **PCI DSS** | Payment processing | SAQ A scope (lowest tier) — Stripe handles all card data. No card data in logs or monitoring. |

### Key Legal Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Unauthorised scanning claim (Computer Misuse Act) | Medium | High | Domain verification, 3-page limit for unverified, consent modal with CMA acknowledgment, robots.txt compliance |
| Data breach (GDPR notification) | Low | High | Encryption at rest/transit, breach response procedure, ICO registration, access controls audit |
| Cold prospect GDPR non-compliance | Medium | Medium-High | Formal LIA, privacy policy alignment, Art. 21 right-to-object mechanism, 6-month auto-purge |
| Service capability misrepresentation | Low | Medium | Align all tier descriptions across UI surfaces, Terms permit feature modifications with notice |
| White-label liability passthrough | Low | Medium | ToS disclaimer (informational, not legal advice), liability limited to subscription fees paid |

### Priority Legal Actions

1. Register with ICO (legally required, immediate)
2. Incorporate as UK Ltd and transfer IP (pre-launch)
3. Create formal LIA for cold prospect processing
4. Execute DPAs with all sub-processors (Stripe, Resend, hosting)
5. Create written breach response procedure
6. File UKIPO trademark (within 3 months of launch)

---

## 14. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Founder runway runs out before salary break-even** | High | Critical | At realistic growth, salary break-even (~150 customers) takes 18–24 months. Founder needs personal savings or part-time freelance income to bridge. If runway is 12 months, must aggressively prioritise conversion and retention above all else. |
| **Churn exceeds 5%** due to missing onboarding | High | High | Build onboarding checklist (highest-priority product work). At 8% churn, steady-state MRR caps at ~$1,400 on 150 monthly signups — never reaches salary break-even. |
| **Free-to-paid conversion below 2%** | Medium | High | At 1% conversion with 150 signups/month, steady-state is ~60 customers ($1,500 MRR). Need 500+ signups/month just to reach sustainability. Fix via onboarding, trial mechanics, upgrade nudges. |
| **Solo founder bottleneck** — single point of failure for all systems and decisions | Medium | High | Automate ops (backups, alerting, deploy script). Document all processes. First hire targets support load. |
| **SEO traffic growth slower than projected** | Medium | Medium | 150 monthly signups by Month 12 requires meaningful organic traffic. Diversify with cold prospect pipeline, LinkedIn, community. If organic stalls, growth flatlines. |
| **Enterprise tier underpriced** — unlimited resources at $199/mo could erode margin | Medium | Medium | Convert Enterprise to "Contact Sales" with custom pricing. Monitor infrastructure cost per Enterprise user. A single Enterprise customer on 15-min schedules could cost more in server resources than they pay. |
| **Claude Code / LLM costs exceed revenue** in early months | Medium | Low | $200/mo Claude Code + $50–200/mo LLM server = $250–400/mo. At Month 7 with ~70 customers and $1,600 MRR, this is 15–25% of revenue. Defer AI features until MRR comfortably covers the cost. |
| **Founding member lifetime discounts reduce long-term ARPU** | Low | Low | Capped at ~38 paying users (25% of 150). At $18 ARPU vs $30 full-price, the annual drag is ~$5,500. Manageable and diminishes as base grows. |
| **Unauthorised scanning legal claim** | Low | High | Domain verification, consent modal with Computer Misuse Act acknowledgment, 3-page limit for unverified scans. |
| **Data breach** | Low | High | ICO registration, breach response procedure, encryption, access controls. |

---

## 15. Milestones & Roadmap

| Milestone | Target Date | Dependencies | Success Criteria |
|---|---|---|---|
| Off-site backup automated | April 2026 | Backup upload script | Daily backups to Backblaze/DO Spaces; restore test passes |
| Deploy script hardened | April 2026 | Update deploy.sh | Pre-backup, `pm2 reload`, health check post-deploy |
| Uptime monitoring + error alerting | April 2026 | Sentry + Better Stack | Alert within 5 min of downtime |
| Onboarding checklist live | May 2026 | Frontend development | Activation rate measurably improves |
| Annual billing live | May 2026 | Stripe annual price IDs, frontend toggle | Annual subscriptions processing correctly |
| Enterprise "Contact Sales" flow | May 2026 | Contact form, CRM routing | Enterprise conversions via sales conversation |
| 150 founding member spots filled | Q3 2026 | Marketing activity, outreach | 150 spots claimed, 25%+ converting to paid |
| First case study published | Q3 2026 | Founding member permission | Live on homepage and pricing page |
| Product Hunt launch | Q4 2026 | Social proof, onboarding, annual billing | Top 10 in Developer Tools category |
| 100 paying customers | Q1 2027 | Sustained organic growth | ~$2,500 MRR |
| £3k MRR sustained | Q2 2027 | Conversion + retention improvements | Sustained for 2 consecutive months |
| First fractional support hire | Q3 2027 | £3k MRR threshold | Support response time targets met |
| Founder salary break-even (£3k/mo) | Q4 2027 / Q1 2028 | ~150 paying customers | MRR covers infra + modest salary |
| £5k MRR sustained | Q2 2028 | Organic compounding, annual billing | Sustained for 2 consecutive months |
| First contract growth/content hire | Q3 2028 | £5k MRR threshold | Organic traffic growing MoM |
| 400 paying customers | Q1 2029 | Product-market fit, low churn | ~$15k MRR, $186K ARR run-rate |
| First full-time engineering hire | Q2 2029 | £12k+ MRR sustained | Release velocity measurably increases |

---

## 16. Appendix

### A. Innovator's Moonshot Vision

**5-year trajectory (2031):** PagePulser becomes the compliance infrastructure layer for the web — a continuously verified compliance status that businesses display as a standard fixture, similar to how SSL padlocks became standard. A PagePulser compliance badge ("Verified WCAG 2.2 AA | Last audited 7 days ago") becomes a requirement in procurement responses and regulatory filings.

**10-year trajectory (2036):** An AI-native audit engine that understands intent — not just whether a button has an ARIA label, but whether a screen reader user would understand the call to action. Continuous compliance posture rather than point-in-time snapshots. The difference between a smoke alarm and a fire prevention system.

**Platform play:** PagePulser as the certification body for web accessibility compliance at the SMB level — issuing verifiable, dated compliance certificates that procurement portals accept as evidence of due diligence. The "Let's Encrypt for accessibility."

### B. Key Innovation Opportunities

1. **"The anti-overlay" positioning** — Target businesses currently paying for accessiBe/AudioEye who are realising overlays do not protect from lawsuits. The messaging writes itself.
2. **EAA compliance reporting** — EN 301 549 clause mapping, WCAG conformance statement generator, EAA compliance dashboards. "Siteimprove's compliance reporting at 5% of the price."
3. **The remediation workflow** — First audit tool that closes the loop between finding and fixing: AI-generated fix suggestions with code snippets, remediation board with status tracking, fix verification via single-page re-audit.
4. **SEO + compliance convergence** — Feature showing direct correlation between accessibility improvements and search ranking changes on a user's own site over time.
5. **Screaming Frog import flow** — Accept XML/CSV exports, enrich with accessibility/security/structured data analysis. Zero-friction onboarding for the existing Screaming Frog user base.

### C. Financial Model Validation (Maths Department)

**Assumption validation summary:**

| Assumption | Given | Assessment |
|---|---|---|
| 5% monthly churn (Year 1) | Industry benchmark | At high end of SMB SaaS; realistic without onboarding. Improving to 3–4% with maturity is achievable. |
| 25% founding member paid conversion | Conservative | Industry early-access conversion ranges 15–40%. 25% accounts for a pre-launch product with no social proof. |
| 3% free-to-paid conversion | Defensible range | Requires active in-product upgrade prompts and clear tier differentiation. Could be 1–2% without onboarding. |
| $25 blended ARPU (Year 1) | Derived from tier mix | Realistic given founding discounts. Rises naturally as full-price customers dominate. |
| $50–$100 imputed CAC | Founder time-based | Honest accounting of 20 hrs/week × £25/hr. Cash CAC is near zero; real cost is founder opportunity cost. |

**Variable importance ranking:** Conversion rate > Churn rate > Signup volume > ARPU. Fixing onboarding is the single highest-ROI investment — it improves both conversion and churn simultaneously.

**The honest bottom line:** Year 1 is a proving year. The business will cover its own costs easily but will not replace a salary. The critical question is not "will it make money" (SaaS with $28/month in costs will) but "how fast can it reach ~150 customers to sustain the founder full-time." The realistic answer is 18–24 months.

### D. Legal Priority Actions

1. ICO registration (immediate, legally required)
2. UK Ltd incorporation + IP transfer (pre-launch)
3. Formal Legitimate Interest Assessment for cold prospects
4. DPAs with all sub-processors
5. Written breach response procedure
6. UKIPO trademark filing (within 3 months)
7. EUIPO trademark filing (within 12 months)

---

*This business plan was compiled on 24 March 2026. All projections use conservative base-case assumptions. Financial figures should be stress-tested against the sensitivity analysis in Section 11. Legal recommendations require professional solicitor review before implementation.*
