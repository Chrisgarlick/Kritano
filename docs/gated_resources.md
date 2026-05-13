# Gated Resources: Strategy, Ranked Catalogue, and Blog Integration

This document is the source of truth for Kritano's lead-magnet library. Every resource listed here is intended to be downloadable in four formats (Markdown, HTML, PDF, DOCX) behind an email gate, with logged-in users bypassing the gate.

The implementation plan for the gating system itself lives in `/docs/gated-resources.md`.

## Strategy

Lead magnets exist to do three things, in this order:

1. Move bottom-of-funnel intent to identified email leads we can warm through the CRM trigger system.
2. Reinforce category authority around the six audit pillars (Accessibility, SEO, Security, Performance, Content Quality, AI Readiness), plus the two flanking moats (E-E-A-T and AEO).
3. Give organic blog traffic a "next step" with higher commitment than scrolling, but lower friction than booking a demo.

Every resource below is scored against four criteria:

- **Search intent**: Does someone with a real, immediate problem search for this?
- **Topical moat**: Does Kritano have a credible right to publish it (product proximity, audit data, founder expertise)?
- **Conversion velocity**: How quickly does this lead become a paying user?
- **Build cost**: Hours to produce versus expected leads per quarter.

Resources are grouped P0 (build first, ~5 in the launch wave), P1 (round two, fills out the library), and P2 (long-tail backlog).

## P0: Launch Wave

These five ship together as the initial Resources library. They cover the broadest top-of-funnel intent, give every blog category a companion download, and include the one timely play (EAA) that has a closing window.

### 1. The Website Health Checklist
**The flagship resource.** A printable PDF checklist covering all six audit pillars. Agencies print it for client kick-offs; developers run it pre-launch. This is the resource we link from the homepage, the footer, and every "what does Kritano check" page.

- **Audience**: Agency owners, in-house developers, marketing leads
- **Format mix**: PDF (primary, printable A4), HTML (web reference), DOCX (agency white-label), MD (developer-friendly)
- **Length**: ~80 checks, six pages
- **Hook**: "The 80 checks every website should pass before launch, organised by audit pillar."
- **Blog anchors**: Website Launch Checklist post, Kritano homepage, every category index page, every "What is a [pillar] audit" post.
- **CTA in product**: First-time audit users see "Download the checklist Kritano uses internally" inside the empty dashboard state.

### 2. European Accessibility Act Compliance Guide
**The timely play.** The EAA enforcement date has passed (28 June 2025) and most EU-facing sites are non-compliant. Demand for this is rising, not falling, because enforcement is now active. Few competitors have a credible compliance guide.

- **Audience**: EU-based e-commerce, SaaS, fintech, anyone selling into the EU
- **Format mix**: PDF (boardroom-ready), DOCX (legal teams will redline it), HTML (web), MD (technical)
- **Length**: 12-15 pages including a clause-by-clause audit checklist
- **Hook**: "What the EAA actually requires, who it applies to, and a clause-by-clause audit you can run today."
- **Blog anchors**: Any EAA, accessibility, or WCAG post; the `/services/accessibility` page; the EAA compliance feature page
- **CTA in product**: EAA compliance audit feature shows the guide as a "Reading list" sidebar item.

### 3. WCAG 2.2 Quick Reference Card
**The evergreen workhorse.** One-page cheat sheet of the 20 most commonly failed accessibility checks, each with a Pass example, a Fail example, and a code snippet that fixes the most common cause. Designers pin it. Developers grep it.

- **Audience**: Frontend developers, designers, accessibility leads
- **Format mix**: PDF (printable, single page), HTML (web), MD (devs paste it in their team wiki), DOCX (template starting point for internal style guides)
- **Length**: One A3 page when printed, scrollable single page on web
- **Hook**: "The 20 WCAG failures Kritano sees most often, with the fix for each."
- **Blog anchors**: Every accessibility post, the accessibility category index, accessibility-related comparison pages
- **CTA in product**: Accessibility findings page sidebar.

### 4. The AEO Optimisation Guide
**The unique-angle play.** AI Engine Optimisation (getting cited by ChatGPT, Claude, Perplexity, Gemini) is the topic where Kritano has the strongest authoritative voice because we ship an AEO audit. Few publishers have a credible right to write this.

- **Audience**: Content marketers, SEO leads, product marketers, founders
- **Format mix**: PDF (executive-friendly), HTML (long-form web read), MD (technical), DOCX (agency client deliverable)
- **Length**: 18-20 pages, includes the AEO audit framework, content-frontloading patterns, citation-friendly structures
- **Hook**: "How to structure your content so AI models cite your pages instead of your competitors'."
- **Blog anchors**: Every AEO post, the `/services/seo` page, the AEO product feature page, AI-search-related comparison pages
- **CTA in product**: AEO audit results page sidebar.

### 5. The Website Launch Checklist
**The high-intent capture.** Anyone searching this is days away from putting a site live and is exactly the audience for an automated audit. This is the resource with the shortest path from download to trial sign-up.

- **Audience**: Agencies running launches, developers shipping new sites, founders
- **Format mix**: PDF (printable checkboxes), DOCX (agency project deliverable), HTML, MD
- **Length**: 60-70 checks across pre-launch, launch-day, post-launch
- **Hook**: "Don't ship a broken site. The 60-check pre-launch audit Kritano runs automatically."
- **Blog anchors**: The existing Website Launch Checklist blog post, any "How to launch a website" content
- **CTA in product**: New-site onboarding shows it as the "Before you scan" pre-flight read.

## P1: Library Build-Out (Weeks 2-4)

These fill out the library to one credible resource per audit pillar, plus the two flanking moats.

### 6. Security Headers Implementation Guide
Exact header values, what each one does, copy-paste implementation snippets for Nginx, Apache, and Cloudflare. Pairs with the existing security headers blog post and `/services/security` page.

- **Pillar**: Security
- **Length**: 8 pages
- **Hook**: "Every security header that matters, the exact value to set, and the config snippet for your stack."

### 7. Core Web Vitals Fix Guide
For LCP, INP, and CLS: the top five causes and the exact fix for each. Goes deeper than the existing blog post by including the runtime trace patterns developers use to confirm the diagnosis.

- **Pillar**: Performance
- **Length**: 10 pages
- **Hook**: "Each Core Web Vital, the five things that break it, and how to fix each one."

### 8. Schema Markup Cheat Sheet
Every major schema type (Article, Product, FAQ, HowTo, LocalBusiness, BreadcrumbList, Organization, Person, Event, Review) with minimal valid JSON-LD examples ready to copy. Includes a "which schema for which page" decision table at the front.

- **Pillar**: Structured Data, AEO
- **Length**: 12 pages
- **Hook**: "Copy-paste structured data for every page type, validated against Google's Rich Results Test."

### 9. The Developer's SEO Audit Checklist
Technical SEO written for developers, not marketers. Schema, crawlability, redirect chains, hreflang, canonical resolution, robots directives. Differentiates from the generic "SEO checklist" content saturating Google.

- **Pillar**: SEO
- **Length**: 8 pages
- **Hook**: "The SEO audit a senior developer would actually run, with the curl commands to verify each check."

### 10. The Website Migration SEO Checklist
Pre-migration, migration-day, and post-migration steps to avoid the ranking drops that come with rebrands, replatforms, and consolidations. Includes the exact GSC, log file, and crawl checks to run in each phase.

- **Pillar**: SEO
- **Length**: 12 pages
- **Hook**: "The migration audit that stops you from losing your rankings overnight."

## P2: Backlog (Build After Library Validates)

Each of these has a real audience but lower urgency than the items above. Build them as evergreen content gaps appear in the blog calendar.

| # | Resource | Pillar | Notes |
|---|----------|--------|-------|
| 11 | E-E-A-T Audit Worksheet | Content/E-E-A-T | Self-scoring template, ties to E-E-A-T product feature |
| 12 | Page Speed Optimisation Checklist | Performance | Image formats, lazy loading, caching, render-blocking |
| 13 | ARIA Implementation Reference | Accessibility | Niche, high value, most-misused attributes |
| 14 | Hreflang Implementation Guide | SEO | The most-broken international SEO signal |
| 15 | Annual Website Health Report Template | Agency | DOCX-first, agency-to-client deliverable |
| 16 | Cookie Consent and Privacy Compliance Checklist | Security/Legal | GDPR, ePrivacy, third-party script handling |
| 17 | Mobile SEO Checklist | SEO | Mobile-first indexing, viewport, tap targets |
| 18 | AI Search Visibility Checklist | AEO | Optional, may merge into the AEO guide |
| 19 | Content Audit Worksheet | Content | Spreadsheet template, keep/update/delete/consolidate |
| 20 | JavaScript SEO Guide | SEO | SSR vs CSR vs hydration, very underserved audience |
| 21 | Image Optimisation Reference Card | Performance | One-page cheat sheet |
| 22 | Crawl Budget Optimisation Guide | SEO | Enterprise audience |
| 23 | Robots.txt and Sitemap Best Practices | SEO | Common mistakes, staging environments |
| 24 | The Broken Link Audit Playbook | SEO | Triage and prioritisation |
| 25 | Duplicate Content Detection Guide | Content | CMS-specific causes (WordPress, Shopify, Webflow) |
| 26 | 404 vs Soft 404 Guide | SEO | GSC focus, niche, ranks easily |
| 27 | Website Audit Frequency Guide | All | Decision tree format |
| 28 | Structured Data Testing Toolkit | Structured Data | May merge into Schema Cheat Sheet |

### Cut From the Original List

- **Core Web Vitals Benchmark Report**: parked until we have enough audit data to publish credible aggregates. A public-data version is too easy to dispute and adds little authority.
- **Technical SEO Glossary**: high utility, low intent. Better as a public HTML reference (good for AEO citation) than a gated PDF.

## Blog to Resource Anchor Map

This is the matrix that runs the CTA placement. Each blog category has a primary anchor resource (a "headline" CTA shown mid-post and at the end-of-post block) and a secondary anchor (sidebar/inline reference).

| Blog Category | Primary Anchor | Secondary Anchor |
|---------------|----------------|------------------|
| Accessibility | WCAG 2.2 Quick Reference Card | EAA Compliance Guide |
| SEO | Website Health Checklist | Developer's SEO Audit Checklist |
| Security | Security Headers Implementation Guide | Website Health Checklist |
| Performance | Core Web Vitals Fix Guide | Page Speed Optimisation Checklist (P2) |
| Content Quality | E-E-A-T Audit Worksheet (P2) | Website Health Checklist |
| Structured Data | Schema Markup Cheat Sheet | AEO Optimisation Guide |
| E-E-A-T | E-E-A-T Audit Worksheet (P2) | AEO Optimisation Guide |
| AEO | AEO Optimisation Guide | Schema Markup Cheat Sheet |
| Guides | Website Health Checklist | (varies by topic) |
| Case Studies | Website Health Checklist | (varies by topic) |
| Product Updates | (no resource CTA, product CTA instead) | |

## Blog Integration Patterns

The same resource can show up in several places in a single blog post. Six placement patterns to test, in priority order:

1. **End-of-post anchor card.** Server-rendered card at the bottom of every blog post, before the related-posts block. Carries the primary anchor resource for that category. Highest visibility, lowest disruption.
2. **Mid-post inline reference.** Inserted after the second H2 of any post in the category. "We've packaged the 20 most common WCAG failures into a one-page reference. Get the WCAG 2.2 Quick Reference Card." Single button, no form on the page (form lives on the resource page).
3. **Sidebar pin (SSR).** Right-rail block on post detail pages, visible from the start of the article. Carries the primary anchor.
4. **Footer-of-page.** A "Free resources" mini-grid in the global footer linking to the top three resources by download count. Updates weekly from analytics.
5. **Homepage hero secondary CTA.** Hero already has a primary CTA (start an audit). Add a secondary "Or grab the free Website Health Checklist" link below it.
6. **Exit intent.** Lowest priority. Only test after the first three are validated, and only on long-form posts.

Each placement must be a single button or link routing to `/resources/<slug>`. The email form lives only on the resource page, never inline in a blog post. This keeps the blog clean, keeps CTR honest, and centralises analytics.

## In-Product Placements

Logged-in users skip the email gate, so resources double as in-product reference material:

- **Empty dashboard**: Website Health Checklist as the "first read" card
- **Audit results sidebars**: pillar-relevant resource (Accessibility findings → WCAG Quick Reference; AEO findings → AEO Guide; etc.)
- **EAA compliance feature**: EAA Compliance Guide pinned to the top of the feature page
- **New-site onboarding**: Website Launch Checklist surfaced at the "add your first site" step
- **Help/Docs index**: Full resource library listed alongside API docs

## Distribution Beyond the Site

Each P0 resource ships with three companion artifacts (cheap to produce alongside the resource, large compounding effect):

- A single-image social card (1080x1080) with the resource title and headline stat, suitable for LinkedIn, X, Bluesky
- A 30-60 second vertical video (`/skill video`) walking through the top three checks the resource covers
- A short LinkedIn carousel summarising the resource (drives the download)

These extend each resource's surface area without changing the gated content itself.
