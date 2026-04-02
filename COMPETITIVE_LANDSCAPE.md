# Kritano — Competitive Landscape Analysis

**Last updated:** 2026-03-26

---

## Market Overview

The digital accessibility software market is ~**$897M in 2025**, projected to exceed **$1.4B by 2027**. The European Accessibility Act (EAA) enforcement started June 2025, creating massive new demand. 96% of the top 1M websites still have detectable accessibility failures.

Cloud/SaaS accounts for **78% of deployment**. The top 5 vendors control 48% of the market, mid-tier providers hold 32%, and niche compliance firms take 20%.

**Key demand drivers:**
- European Accessibility Act (EAA) enforceable across all 27 EU member states since June 2025
- WCAG 2.2 Level AA is now the practical benchmark
- ADA lawsuits continue: 1,023 filed in 2024 against companies using overlays alone
- 59% of enterprises plan to extend accessibility validation to mobile apps by 2026

---

## Direct Competitors by Segment

### Enterprise ($15K–$100K+/yr)

| Tool | Key Differentiator | Pricing |
|------|-------------------|---------|
| **Siteimprove** | Multi-module (SEO + QA + accessibility) | ~$28K/yr avg |
| **Deque (axe)** | Developer-first, axe-core engine (industry standard) | ~$1.2–2.5K/seat/yr |
| **Level Access** | Managed expert audits + legal protection | ~$40K/yr |
| **AudioEye** | Automated remediation (fixes issues, not just detects) | From $49/mo |
| **TPGi / ARC** | Deep manual audit expertise | Custom |
| **Crownpeak / DQM** | Accessibility as part of broader digital quality/governance | Custom |

### Mid-Market ($2K–$15K/yr)

| Tool | Key Differentiator | Pricing |
|------|-------------------|---------|
| **Silktide** | All-in-one quality platform (similar scope to Kritano) | Custom, 12-mo min |
| **Monsido (Acquia)** | PageCorrect lets non-devs fix issues | ~$2K/yr+ |
| **BrowserStack** | Bolted onto existing cross-browser testing | $29–249/mo |
| **Pope Tech** | WAVE-based, transparent pricing, edu focus | $25–400/mo |

### SMB / Startups (Closest to Kritano's Positioning)

| Tool | Key Differentiator | Pricing |
|------|-------------------|---------|
| **A11y Pulse** | Simple, affordable, transparent pricing | $19–159/mo |
| **TestParty** | AI + human hybrid, fixes actual source code (YC-backed, $4M raised) | $49–5K/mo |
| **Evinced** | Computer vision for visual accessibility issues ($17M Series A) | ~$100K+ |
| **Stark** | Design-first (Figma/Sketch plugins) | Freemium |
| **Eye-Able** | Strong EU/EAA focus, AI plain-language translation | Not public |
| **Accessibility Cloud** | Multi-engine AI scanning, up to 10K pages/hr | Not public |

### Open Source (Free)

- **axe-core** — The engine behind most commercial tools (including Kritano). Detects up to 57% of issues automatically.
- **Pa11y** — CLI-based, good for CI/CD pipelines. Requires technical knowledge.
- **Google Lighthouse** — Built into Chrome DevTools. Shallow accessibility checks compared to dedicated tools.
- **Microsoft Accessibility Insights** — Excellent guided manual testing flows. Windows-focused.
- **Webhint** — Open-source linting for web best practices including accessibility.

### Overlay Companies (Controversial — Avoid This Space)

- **accessiBe** — FTC fined $1M in Jan 2025 for false advertising about WCAG compliance.
- **UserWay** (now Level Access) — Facing class-action lawsuits for deceptive marketing.
- **EqualWeb** — Same overlay controversy applies.
- 1,023 lawsuits filed in 2024 against companies using overlays alone. 72% of users with disabilities say overlays are "not at all" or "not very" effective.

---

## Pricing Model Summary

| Segment | Typical Pricing | Examples |
|---------|----------------|----------|
| Free / Open Source | $0 | axe-core, Pa11y, Lighthouse, WAVE extension |
| SMB / Starter | $19–159/mo | A11y Pulse, Pope Tech, AudioEye starter |
| Mid-Market | $2K–15K/yr | Monsido, mid-tier Silktide |
| Enterprise | $15K–100K+/yr | Siteimprove, Level Access, Deque enterprise |
| Per-credit / API | $0.03–0.04/page | WAVE API |

**Kritano pricing:** $0 (Free) / $19 (Starter) / $49 (Pro) / $99 (Agency) / Custom (Enterprise) — sits squarely in the biggest gap in the market.

---

## Where Kritano Stands Out

1. **Multi-category auditing in one tool** — Most competitors do accessibility *or* SEO *or* performance. Kritano does all 6 (SEO, accessibility, security, performance, content, structured data) in a single scan. Only Silktide and Siteimprove come close, and they're 10–50x the price.

2. **E-E-A-T & AEO analysis** — Nobody else at this price point is scoring content for Google's E-E-A-T signals or AI citability. Genuinely novel.

3. **EAA Compliance Passport** — Very few tools explicitly map findings to EN 301 549 clauses. With EAA enforcement just starting, this is timely.

4. **Transparent pricing at $19–99/mo** — Sits in the biggest gap in the market. Most mid-tier tools hide pricing behind "contact sales."

5. **White-label for agencies at $99/mo** — Massively undercuts enterprise white-label options.

6. **Content Quality Scoring (CQS)** — Weighted system combining quality + E-E-A-T + readability + engagement + structure is unique.

7. **Cold prospect automation** — No competitor has built-in lead generation tooling.

8. **Accessibility statement generation** — Auto-generates WCAG-compliant accessibility statements from audit data.

9. **Public shareable reports** — 48-hour expiring public links for sharing audit results externally.

10. **Scheduled monitoring down to 15-minute intervals** — Enterprise-tier continuous monitoring with historical trending.

---

## Market Gaps Kritano Can Exploit

- **EAA compliance** — Enforcement just started, demand is surging, few tools address it well.
- **Actionable fix guidance** — Users hate tools that find problems but don't explain how to fix them. Plain-language remediation tied to specific code locations wins.
- **Historical trending** — Score history tracking is underserved at the affordable tier.
- **SPA testing** — Most tools struggle with React/Vue/Angular apps; Playwright-based crawling handles this.
- **False positive management** — Finding dismissal with reason tracking; most cheap tools don't offer this.
- **Multi-regulation compliance reporting** — ADA + EAA + Section 508 in one report.
- **Team collaboration** — Assigning issues, tracking remediation progress, role-based access — lacking in the affordable tier.

---

## Biggest Threats

- **Silktide** — Most similar product (multi-category, monitoring, reporting) but at a higher price point.
- **A11y Pulse** — Very close on pricing and accessibility scope.
- **TestParty** — YC-backed ($4M raised), pushing AI-powered remediation aggressively.
- **axe-core** — Free and what most developers reach for first.
- **AudioEye** — Starting at $49/mo with automated remediation, not just detection.

---

## Strategic Positioning

1. **Target the underserved middle** — SMBs, agencies, and mid-market companies priced out of enterprise tools but needing more than free browser extensions.
2. **Transparent pricing** — Published pricing tiers (not "contact sales") is a competitive advantage.
3. **Multi-regulation compliance** — WCAG 2.2 + ADA + EAA + Section 508 reporting in one platform.
4. **Strong exports** — PDF reports suitable for legal/compliance teams, CSV for developers.
5. **No overlays** — Position explicitly as a "real accessibility" tool that identifies and helps fix actual code issues.
6. **Developer-friendly** — API access, built on proven open-source engines (axe-core).
7. **Agency play** — White-label at $99/mo is a powerful wedge into the agency market.

---

## Name & Trademark Analysis: "Kritano" / "PagePulse"

### "Kritano" (Exact Name)

**No existing usage found.** No companies, products, domains, social handles, or apps use this exact name. The .com and .io domains may be available. Searching for "Kritano" returns zero exact matches — all results redirect to "PagePulse" variants.

### "PagePulse" (One Letter Difference) — Heavily Saturated

#### High Conflict Risk

| Name | URL | What They Do | Status |
|------|-----|-------------|--------|
| **PagePulse (NZ)** | pagepulse.co | Digital experience monitoring — uptime, mobile app, API monitoring. Enterprise clients (Air New Zealand, Jetstar). Founded 2016. | Active, has mobile apps, G2 listing |
| **Page Pulse (SEO tool)** | pagepulse.dev | Automatic page change tracking for SEO. Correlates with GSC/GA4. $49/mo. | Active, invite-only beta |
| **PagePulse (status pages)** | pagepulse.xyz | Simple status page service for businesses. Free + Pro tiers. | Active (2026) |

#### Moderate Conflict Risk

| Name | URL | What They Do | Status |
|------|-----|-------------|--------|
| **Page Pulse Inc.** | pagepulseinc.com | Hybrid publishing company for authors. Santa Fe, NM. | Active |
| **PAGE PULSE LTD** | UK Companies House #14975513 | UK advertising agency. Incorporated July 2023. | Proposal to strike off |
| **PagePulse Chrome Extension** | Chrome Web Store | Real-time webpage performance metrics. Rated 4.4/5. | Active |
| **PagePulse Firefox Extension** | Firefox Add-ons | Real-time webpage performance insights with neural network dashboard. | Active |
| **PagePulse WordPress Plugin** | wordpress.org/plugins/pagepulse | Loading animation plugin for WordPress page transitions. | Active |

### Domain Registrations

| Domain | Status |
|--------|--------|
| pagepulse.com | **TAKEN** — registered since Nov 2003, expires Nov 2026 |
| pagepulse.co | **TAKEN** — PagePulse monitoring company (NZ) |
| pagepulse.dev | **TAKEN** — Page Pulse SEO tool |
| pagepulse.io | **TAKEN** — registered March 2023, not visibly in use |
| pagepulse.xyz | **TAKEN** — PagePulse status page service |
| pagepulse.info | **TAKEN** — registered Oct 2024 |
| kritano.com | **Possibly available** — no WHOIS data found |
| kritano.io | **Possibly available** — no WHOIS data found |

### Social Media & App Stores

| Platform | "PagePulse" | "Kritano" |
|----------|-------------|--------------|
| X/Twitter | **@pagepulse taken** — NZ monitoring company | Appears available |
| GitHub | Multiple repos (status page, Wagtail SEO, React template) | No repos found |
| Apple App Store | PagePulse Mobile app (SolTech NZ) | Nothing |
| Google Play | PagePulse Mobile app | Nothing |
| Chrome Web Store | 2 extensions | Nothing |
| Firefox Add-ons | 1 extension | Nothing |

### "Pulse" in the Accessibility Space

| Name | URL | What They Do | Overlap Risk |
|------|-----|-------------|------|
| **WCAG Pulse** | wcagpulse.com | Automated WCAG scanner using axe-core — very similar to Kritano | **Very high** |
| **A11y Pulse** | a11ypulse.com | Accessibility checker with scheduled scanning, Slack integration | **High** |
| **SitePulse** | WordPress plugin | Lighthouse monitoring for performance, SEO, accessibility | Medium |
| **WebSitePulse** | websitepulse.com | Mission-critical website monitoring | Medium |

### Trademark Status

- No registered trademarks found for "PagePulse" or "Kritano" in general searches (manual USPTO TESS and UK IPO searches recommended for definitive results).
- **Page Pulse Inc.** (US) and **PAGE PULSE LTD** (UK) have common-law rights through company name registration and usage.
- Multiple "PULSE" trademarks exist at USPTO but none specifically for "Page Pulse" or "PagePulse."

### Assessment

**Is this an issue?** Yes, moderately.

**The good news:**
- "Kritano" itself is clean — nobody is using this exact name.
- The .com/.io domains appear available to secure.
- No registered trademarks block the name.

**The concerns:**
1. **Brand confusion** — "Kritano" is one letter away from "PagePulse," which has 5+ active products. Users will mistype, misremember, and find the wrong company. SEO will be a constant battle.
2. **"Pulse" is crowded in the accessibility space** — WCAG Pulse and A11y Pulse are direct competitors already using "Pulse" in their names. Kritano adds to an already confusing namespace.
3. **Common-law trademark risk** — Page Pulse Inc. (US) and PagePulse (NZ, since 2016) could argue likelihood of confusion, especially since PagePulse NZ operates in the same web monitoring/quality space.
4. **Verbal ambiguity** — When said aloud, "Kritano" and "PagePulse" are nearly indistinguishable. This hurts word-of-mouth referrals and podcast/conference mentions.

**Recommendation:** The name is *usable* but carries friction. If the brand is already established with users and early access members, the switching cost may outweigh the risk. If still early enough to change, a more distinctive name would avoid these issues entirely. Either way, secure kritano.com immediately.
