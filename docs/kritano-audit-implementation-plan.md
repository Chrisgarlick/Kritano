# Kritano.com Audit Implementation Plan

**Current Score: 66/100** | Generated from audit: 14 Apr 2026

## Score Breakdown

| Category | Score | Target |
|----------|-------|--------|
| SEO | 84 | 95+ |
| Accessibility | 83 | 95+ |
| Security | 64 | 85+ |
| Performance | 67 | 85+ |
| Content | 48 | 75+ |
| Schema | 63 | 85+ |
| CQS | 52 | 75+ |

---

## Phase 1: Quick Wins (High Impact, Low Effort)

These can be done in code without content rewrites.

### 1.1 Security Fixes (Score: 64 -> ~80)

**a) Fix insecure GA cookie (SERIOUS - 29 pages)**
- The `_ga_PYQW89W26J` cookie is missing the `Secure` flag
- Fix: Update Google Analytics configuration or set cookie flags via server middleware
- Location: Likely in the GA snippet or nginx config

**b) Make CSRF cookie HttpOnly (MODERATE - 29 pages)**
- Cookie `csrf_token` is missing the `HttpOnly` flag
- Fix: Update the cookie configuration in the Express backend where CSRF token is set
- Location: Server-side CSRF middleware

**c) Remove exposed /config.json (SERIOUS - 1 page)**
- Sensitive file accessible at `/config.json`
- Fix: Block access via nginx or remove from public web root

**d) CSP unsafe-inline (MODERATE - 29 pages)**
- CSP allows `unsafe-inline` for scripts
- Fix: Implement nonce-based CSP for inline scripts
- Note: This is more complex - may defer to Phase 2 if it requires significant refactoring

### 1.2 Accessibility Fixes (Score: 83 -> ~92)

**a) Color contrast failures (SERIOUS - 140 instances)**
- Primary offender: `#94a3b8` on `#ffffff` (ratio 2.56:1, needs 4.5:1)
- This is `slate-400` text on white - used across almost every page
- Fix: Replace `text-slate-400` with `text-slate-500` (`#64748b`, ratio 4.6:1) or `text-slate-600` (`#475569`, ratio 7:1) globally
- Affects: Footer text, helper text, placeholder-style text across the site

**b) Links not distinguishable without color (SERIOUS - 29 pages)**
- Link color `#4f46e5` (indigo-600) vs surrounding text `#64748b` (slate-500) has only 1.32:1 contrast
- Links also lack underline or other non-color distinguisher
- Fix: Add `underline` or `underline-offset-2` to inline body links, OR change link color to create 3:1 contrast with surrounding text

**c) Duplicate landmark roles (MODERATE - 5 pages)**
- Docs pages have multiple `<nav>` or similar landmarks without unique labels
- Fix: Add `aria-label` attributes to distinguish landmarks (e.g., "Main navigation", "Documentation sidebar")

### 1.3 Performance - Server & Caching (Score: 67 -> ~78)

**a) Add Cache-Control headers (MODERATE - 29 pages)**
- No caching headers on HTML responses
- Fix: Add nginx cache headers for static assets and appropriate cache-control for HTML pages
- Location: nginx config

**b) Render-blocking CSS/JS (MODERATE - 29 pages)**
- `/assets/index-DMkJ-BMR.css` and `/assets/index-Bi-_QJzT.js` block rendering
- Fix: Inline critical CSS, add `defer` to the main JS bundle
- Note: Vite may already handle some of this - check the build config

**c) Enable HTTP/2 (INFO - 17 pages)**
- Fix: Enable HTTP/2 in nginx config (likely just adding `http2` to the listen directive)

### 1.4 SEO Quick Fixes (Score: 84 -> ~90)

**a) Fix duplicate page titles (SERIOUS - 6 pages)**
- "Sign In | Kritano" used on 6 pages
- Fix: Give each page a unique `<title>` - settings pages, forgot password, etc.

**b) Add missing canonical URLs (MODERATE - 6 pages)**
- Missing on: faq, waitlist, author, api-keys, profile, forgot-password
- Fix: Add `<link rel="canonical">` to these pages

**c) Fix duplicate meta description (MODERATE - 29 pages)**
- Same meta description on all 29 pages
- Fix: Add unique meta descriptions per page via React Helmet or equivalent

**d) Add decorative image role (MINOR - 27 pages)**
- Images with empty alt text need `role="presentation"`
- Fix: Audit images and add `role="presentation"` where decorative, or add meaningful alt text

---

## Phase 2: Moderate Effort (Content & Structure)

### 2.1 SEO - Title Optimization

**a) Expand short titles (MODERATE - 15 pages)**
- Titles under 30 chars need expanding
- Examples:
  - "Blog | Kritano" -> "Web Audit Blog: Accessibility, SEO & Performance Tips | Kritano"
  - "FAQ | Kritano" -> "Frequently Asked Questions About Web Auditing | Kritano"
  - "Register | Kritano" -> "Create Your Free Kritano Account | Web Auditing Platform"

**b) Shorten long titles (MODERATE - 2 pages)**
- Pricing and homepage titles over 60 chars
- Trim to under 60 while keeping keywords

### 2.2 Schema & Structured Data (Score: 63 -> ~85)

**a) Add JSON-LD to 14 pages missing it**
- Add `WebPage` schema to all pages
- Add `FAQPage` schema to /faq
- Add `Organization` schema site-wide
- Add `BlogPosting` schema to blog posts
- Add `Service` schema to service pages
- Add `BreadcrumbList` to all pages
- Add `Person` schema with `image` field to /about

**b) Add author `sameAs` links (MODERATE - 27 pages)**
- Add LinkedIn/Twitter URLs to the Person schema for Chris Garlick

**c) Add FAQPage schema to /faq (MODERATE)**
- The FAQ page exists but has no FAQ schema

### 2.3 Performance - Images & Page Weight

**a) Compress large images (MODERATE - 3 pages)**
- `1_1.png` is 551.5 KB - convert to WebP/AVIF
- Fix: Add image optimization pipeline or manually optimize blog images

**b) Fix CLS on blog pages (SERIOUS - 2 pages)**
- CLS: 0.414 (target <0.1)
- Fix: Set explicit `width` and `height` on blog post images

**c) Add srcset to blog listing images (MINOR - 1 page)**
- Fix: Generate responsive image sizes and add `srcset`/`sizes` attributes

**d) Reduce page size on blog pages (MODERATE - 5 pages)**
- Pages over 1.1 MB - optimize images and lazy-load below-fold content

### 2.4 Noindex Review

**a) Review noindex pages (INFO - 6 pages)**
- Currently noindexed: profile, waitlist, faq, api-keys, author, forgot-password
- Decision needed: Should /faq and /author/chris-garlick be indexed? Probably yes.
- Fix: Remove noindex from /faq and /author/chris-garlick

### 2.5 Non-self-referencing Canonicals (INFO - 4 pages)

- /register points canonical to /waitlist - is this intentional?
- Blog category pages point elsewhere - review if correct
- /pricing canonical review

---

## Phase 3: Content Overhaul (Biggest Impact on Weakest Scores)

Content score (48) and CQS (52) are the weakest areas. This requires writing/rewriting.

### 3.1 E-E-A-T Signals (Affects Content, AEO, CQS)

**a) Add author bio component (SERIOUS - 29 pages)**
- Create a reusable author bio section with photo, credentials, and links
- Add to blog posts, service pages, and key landing pages
- Include `itemprop="author"` markup

**b) Add author credentials (MODERATE - 29 pages)**
- Add professional qualifications to the author bio
- Include relevant certifications or experience

**c) Add first-hand experience signals (MODERATE - 25 pages)**
- Rewrite key pages to include phrases like "In our testing...", "Having audited hundreds of sites..."
- Add case study snippets or real data points

**d) Add citations and references (MODERATE - 13 pages)**
- Link to WCAG guidelines, Google documentation, MDN, etc.
- Add "Sources" sections where appropriate

### 3.2 Content Quality Improvements

**a) Fix thin content (SERIOUS + MODERATE)**
- Homepage (295 words) - expand to 500+ with value proposition content
- Services page - expand with overview content
- Pricing page - add comparison content, feature explanations
- 11 pages flagged for thin content in SEO section need expansion

**b) Improve readability (SERIOUS - 26 pages)**
- Readability score of 15/100 is very low
- Reduce average sentence length (currently has 5+ sentences over 35 words each)
- Lower reading grade from 17.6 to 7-9
- Simplify vocabulary (2.15 syllables/word is too high)

**c) Break up walls of text (SERIOUS - 2 pages)**
- /docs/endpoints and /docs/objects need subheadings every 300-400 words

**d) Reduce CTAs per page (MINOR - 10 pages)**
- Pages have 6+ CTAs - reduce to 2-3 primary CTAs

**e) Add freshness signals (MINOR - 5 pages)**
- Add published/updated dates to terms, privacy, docs pages

### 3.3 AEO Improvements (Currently very weak - 16/100)

**a) Add definition blocks (SERIOUS - 12 pages)**
- Add "X is a..." or "X refers to..." paragraphs to service and docs pages
- Example: "A website accessibility audit is a systematic evaluation of..."

**b) Add FAQ sections to key pages (MODERATE - 25 pages)**
- Add 3-5 question-based H2/H3 headings per service page
- Implement FAQPage schema alongside

**c) Add summary/takeaway sections (MODERATE - 14 pages)**
- Add "Key Takeaways" or "TL;DR" sections at top or bottom of content pages

**d) Increase factual density (SERIOUS - 26 pages)**
- Add statistics, data points, and named sources
- Example: "According to WebAIM's 2025 report, 96.3% of homepages have detectable WCAG failures"

**e) Add verifiable claims (MODERATE - 15 pages)**
- Combine data points with source attributions

**f) Add citation-friendly schema (MINOR - 28 pages)**
- Implement FAQPage, HowTo, or ClaimReview schema

### 3.4 Visual Content

**a) Add images/media to 17 pages (MINOR)**
- Service pages, FAQ, about, pricing all lack visual elements
- Add diagrams, screenshots, icons, or illustrations

**b) Add images to long docs pages (MINOR - 4 pages)**
- Break up docs/errors, privacy, docs/endpoints, docs/objects with visuals

---

## Phase 4: Infrastructure & Advanced

### 4.1 Server Response Time (SERIOUS - 29 pages)

- Current: 9315ms (target: <1500ms)
- This affects both Performance and SEO scores significantly
- Investigate:
  - SSR rendering time
  - Database query performance
  - API response caching
  - CDN configuration
  - Redis caching for page renders
- This is the single biggest performance issue

### 4.2 Nonce-based CSP

- Replace `unsafe-inline` with nonce-based script loading
- Requires changes to both server-side HTML generation and client-side script tags

### 4.3 Footer Consistency

**a) Add terms/privacy links to all pages (INFO - 6 pages)**
- Some pages (settings, waitlist, faq, author, forgot-password) missing footer links
- Likely these use a different layout - ensure consistent footer across all pages

---

## Implementation Priority Matrix

| Priority | Task | Impact | Effort | Score Lift |
|----------|------|--------|--------|------------|
| P0 | Remove /config.json exposure | Security | 5 min | +2 |
| P0 | Fix cookie flags (Secure + HttpOnly) | Security | 30 min | +5 |
| P1 | Fix color contrast (slate-400 -> slate-500/600) | Accessibility | 1-2 hr | +5 |
| P1 | Add link underlines for body text | Accessibility | 30 min | +3 |
| P1 | Add Cache-Control headers | Performance | 30 min | +3 |
| P1 | Fix duplicate titles & meta descriptions | SEO | 1-2 hr | +3 |
| P1 | Add canonical URLs | SEO | 30 min | +2 |
| P2 | Add JSON-LD schema to all pages | Schema | 3-4 hr | +10 |
| P2 | Add author bio component | E-E-A-T | 2-3 hr | +5 |
| P2 | Fix CLS on blog pages | Performance | 1 hr | +2 |
| P2 | Compress/optimize images | Performance | 1 hr | +2 |
| P2 | Enable HTTP/2 | Performance | 15 min | +1 |
| P3 | Rewrite thin content pages | Content | 4-6 hr | +8 |
| P3 | Improve readability across site | Content | 4-6 hr | +5 |
| P3 | Add definition blocks & FAQ sections | AEO | 3-4 hr | +8 |
| P3 | Add citations, data points, summaries | AEO/E-E-A-T | 3-4 hr | +5 |
| P4 | Fix server response time | Performance | Variable | +10 |
| P4 | Implement nonce-based CSP | Security | 3-4 hr | +3 |

---

## Estimated Score After Full Implementation

| Category | Current | Target |
|----------|---------|--------|
| SEO | 84 | 93-96 |
| Accessibility | 83 | 95+ |
| Security | 64 | 85-90 |
| Performance | 67 | 82-88 |
| Content | 48 | 75-80 |
| Schema | 63 | 88-92 |
| CQS | 52 | 75-80 |
| **Overall** | **66** | **85-90** |
