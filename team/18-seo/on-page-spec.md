<!-- Version: 1 | Department: seo | Updated: 2026-04-19 -->

# On-Page SEO Spec - Kritano

## Key Pages

### Homepage (/)

- **Title tag:** `Website Audit Tool - SEO, Accessibility, Security & Performance | Kritano` (63 chars)
- **Meta description:** `Audit your website across 6 pillars in under 2 minutes. SEO, accessibility, security, performance, content quality and structured data. Free to start.` (153 chars)
- **H1:** `Judge your website before others do.`
- **H2s:** "6 pillars, one scan", "How it works", "Built for agencies and businesses", "Pricing", "What our users say"
- **Primary keyword:** website audit tool
- **Secondary keywords:** website health check, site audit, accessibility checker, website scanner
- **Internal links to:** /pricing, /blog/what-is-a-website-audit, /blog/web-accessibility-guide
- **Schema:** WebApplication + WebSite (already implemented)

### Pricing (/pricing)

- **Title tag:** `Pricing - Website Audit Plans from Free to Enterprise | Kritano` (61 chars)
- **Meta description:** `Audit your website for free or upgrade for unlimited scans, white-label reports and agency features. Plans from $0 to $99/mo. 14-day free trial.` (148 chars)
- **H1:** `Simple, transparent pricing.`
- **H2s:** Each tier name, "Compare plans", "Frequently asked questions"
- **Primary keyword:** website audit tool pricing
- **Secondary keywords:** free website audit, website audit for agencies, WCAG checker pricing
- **Internal links to:** /, /blog/website-audits-agency-sales, /blog/what-is-a-website-audit
- **Schema:** Product + Offer + FAQPage (partially implemented)

### Blog Index (/blog)

- **Title tag:** `Blog - Website Auditing, Accessibility, SEO & Performance Guides | Kritano` (74 chars - trim to 60: `Website Audit Blog - SEO, Accessibility & Performance | Kritano`)
- **Meta description:** `Practical guides on website auditing, WCAG accessibility, security headers, Core Web Vitals and content quality. Written by the team behind Kritano.` (152 chars)
- **H1:** `The Kritano Blog`
- **Primary keyword:** website audit blog
- **Internal links to:** Each cluster pillar page prominently featured

### Individual Blog Posts

For every blog post:
- **Title tag:** `[Post Title] | Kritano` (keep under 60 chars total)
- **Meta description:** Benefit-led, includes primary keyword, max 155 chars, includes implicit CTA
- **H1:** Matches the title tag minus " | Kritano"
- **Heading hierarchy:** H2s for major sections, H3s for subsections. Each H2 should target a related keyword or answer a question
- **Author byline:** "Chris Garlick" with visible credentials
- **Internal links:** Link to 2-3 other cluster pages + the pillar page + at least one product page
- **Image alt text:** Descriptive, keyword-aware, not stuffed. Format: "[Description of what's shown] - [context]"
- **FAQ section:** Include 3-5 FAQs at the bottom of every blog post. Use question format headings. Wrap in FAQPage schema.

---

## URL Structure Rules

- **Pattern:** `/blog/[keyword-slug]` for all blog content
- **Hyphens only**, no underscores
- **3-5 words maximum** in the slug
- **No dates in URLs** - keep evergreen
- **No unnecessary nesting** - `/blog/post` not `/blog/category/subcategory/post`
- **Pillar pages:** `/blog/[topic]-guide` (e.g. `/blog/web-accessibility-guide`)

---

## Content Quality Signals (Every Page)

- [ ] First 1-2 sentences of each section directly answer a question (AI extraction)
- [ ] FAQ section on all key pages with structured Q&A format
- [ ] Author bio with credentials on blog posts
- [ ] Data cited with links to original sources
- [ ] "Last updated" date visible on evergreen content
- [ ] Reading time displayed on blog posts
- [ ] Table of contents on posts over 1,500 words

---

## Internal Linking Rules

1. **Every blog post links to its pillar page** (mandatory)
2. **Every blog post links to at least 2 other cluster posts** in the same cluster
3. **Every blog post links to at least 1 product/feature page** (homepage, pricing, or feature-specific)
4. **Pillar pages link to every cluster page** in their cluster
5. **Cross-cluster linking** where natural (e.g., accessibility post linking to performance post when discussing CWV overlap)
6. **Use descriptive anchor text** - not "click here" or "read more", but the actual keyword or topic
7. **Homepage links to all 5 pillar pages**
