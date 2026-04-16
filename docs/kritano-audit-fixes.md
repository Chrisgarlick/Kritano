# Kritano.com Audit Fixes -- Implementation Plan

**Based on:** audit-kritano.com.md (16 Apr 2026)
**Current Score:** 81/100
**Target Score:** 92+/100
**Total Issues:** 952 (0 critical, 150 serious, 424 moderate, 203 minor, 175 info)

---

## Priority Summary

| Priority | Category | Current Score | Target | Impact |
|----------|----------|---------------|--------|--------|
| P0 | Content | 52 | 75+ | Biggest drag on overall score |
| P0 | AEO (CQS) | 56 | 75+ | Biggest drag on overall score |
| P1 | Performance | 86 | 93+ | Affects every page (34 pages) |
| P1 | Accessibility | 98 | 100 | Single colour fix covers 96 issues |
| P2 | SEO | 89 | 95+ | Quick metadata wins |
| P2 | Schema | 88 | 95+ | Social sharing gaps |
| P3 | Security | 96 | 98+ | Third-party cookie flag only |

---

## P0: Content Fixes (Score 52 -> 75+)

These are the biggest score drags. Content and AEO share many of the same root causes.

### 1. Readability Overhaul (29 pages, SERIOUS)

**Problem:** Readability score 20/100, grade level 17.6, high vocabulary complexity (2.06 syllables/word).

**Pages to fix (priority order):**
1. Core marketing pages: `/`, `/about`, `/pricing`, `/contact`, `/services/*`
2. Blog posts: all 5 published articles
3. Docs pages: `/docs`, `/docs/authentication`, `/docs/endpoints`, `/docs/objects`, `/docs/errors`, `/docs/rate-limits`
4. Legal/utility: `/privacy`, `/terms`, `/waitlist`, `/faq`

**Actions:**
- [ ] Rewrite sentences to target grade 7-9 reading level
- [ ] Replace jargon with simpler alternatives (target < 1.8 syllables/word average)
- [ ] Break sentences longer than 35 words into shorter ones (22 pages affected)
- [ ] Add transition words ("however", "therefore", "for example") -- currently 0% usage on 10 pages
- [ ] Break wall-of-text sections in `/docs/endpoints` and `/docs/objects` with H2/H3 subheadings every 300-400 words

### 2. Thin/Short Content Expansion (14 thin + 12 short pages)

**Problem:** 14 pages under 300 words, 12 pages under ~600 words. Low content-to-HTML ratio on 24 pages.

**Thin content pages (under 300 words) -- expand to 500+:**
- [ ] `/blog?tag=*` pages (4) -- add tag descriptions, related article summaries
- [ ] `/blog?category=*` pages (4) -- add category intros, curated content descriptions
- [ ] `/contact` -- add company info, team context, expected response times
- [ ] `/author/chris-garlick` -- full author bio with credentials, experience, links
- [ ] `/waitlist` -- add product value prop, what to expect, timeline
- [ ] `/blog` -- add blog intro paragraph, content highlights
- [ ] `/faq` -- expand answers, add more questions
- [ ] `/blog/website-launch-checklist` -- this is a blog post; expand significantly

**Short content pages (300-600 words) -- expand to 800+:**
- [ ] `/services/seo`, `/services/accessibility`, `/services/security`, `/services/performance` -- add methodology, case examples, expected outcomes
- [ ] `/about` -- add founding story, mission, team expertise
- [ ] `/` (homepage) -- add feature detail sections
- [ ] `/pricing` -- add feature comparison detail, value explanations
- [ ] `/docs/*` pages -- add more examples, use cases

### 3. Keyword Optimisation (blog posts)

**Problem:** Target keywords missing from titles, H1s, intros, meta descriptions, and content body.

**Affected post: "The State of Web Accessibility in 2026"**
- [ ] Add "web accessibility 2026" to page title (naturally, near the beginning)
- [ ] Add "web accessibility 2026" to H1 heading
- [ ] Include keyword in first paragraph
- [ ] Include keyword in meta description
- [ ] Increase keyword density from 0.25% to 1-2%
- [ ] Add keyword variations throughout content
- [ ] Consider updating URL slug if feasible

**All blog posts (keyword density + intro fixes):**
- [ ] `/blog/answer-engine-optimisation-how-to-get-cited-by-ai` -- add "website audit" to intro, increase keyword density
- [ ] `/blog/security-headers-every-website-needs-in-2026` -- increase keyword density
- [ ] `/blog/what-is-a-website-audit-and-why-does-it-matter` -- add "website audit" to intro

### 4. CTA Reduction (12 pages, MINOR)

- [ ] Reduce CTAs to 2-3 per page on: `/services/*`, `/pricing`, `/`, blog posts
- [ ] Ensure CTAs are focused and non-repetitive

### 5. Add Visual Content (5 pages, MINOR)

- [ ] `/faq` -- add illustrations or icons
- [ ] `/blog/website-launch-checklist` -- add checklist graphics, screenshots
- [ ] `/waitlist` -- add product preview/mockup
- [ ] `/terms` -- add section dividers or icons (low priority)
- [ ] `/author/chris-garlick` -- add author photo
- [ ] `/privacy` -- add at least one image (currently flagged for long content with no images)

### 6. Add Freshness Signals (10 pages, MINOR)

- [ ] Add "Last updated: [date]" to: `/docs/*` (all 6 docs pages), `/services/seo`, `/services/accessibility`, `/services/performance`, `/terms`, `/privacy`

---

## P0: AEO/CQS Fixes (Score 56 -> 75+)

### 7. Definition Blocks (16 pages, SERIOUS)

- [ ] Add "X is a..." definition paragraphs to: `/`, `/about`, `/services/*`, `/docs/*`, `/pricing`, `/privacy`
- [ ] Format as clear, extractable single-sentence definitions at the top of relevant sections

### 8. FAQ Sections (25 pages, MODERATE)

- [ ] Add FAQPage schema + question-based headings to key pages:
  - Priority: `/`, `/pricing`, `/about`, `/services/*`, `/contact`
  - Secondary: `/docs/*`, blog posts, `/terms`, `/privacy`
- [ ] Use H2/H3 format: "What is...?", "How does...?"
- [ ] Implement FAQPage JSON-LD schema on pages with FAQ content

### 9. Factual Density (28 pages, SERIOUS)

- [ ] Add specific statistics, data points, and named sources throughout content
- [ ] Include date-stamped information (e.g., "As of April 2026, 96% of websites fail accessibility standards")
- [ ] Add verifiable claims with citations on 20 pages that currently have zero

### 10. Summary/Takeaway Sections (16 pages, MODERATE)

- [ ] Add "Key Takeaway" or "TL;DR" sections to: `/services/*`, `/about`, `/docs/*`, blog posts, `/terms`, `/privacy`

### 11. Citation-Friendly Schema (28 pages, MINOR)

- [ ] Implement FAQPage, HowTo, or ClaimReview schema where appropriate
- [ ] Add `<cite>` tags for source names on 14 pages
- [ ] Add `<blockquote cite="URL">` for quoted content

---

## P1: Performance Fixes (Score 86 -> 93+)

### 12. Fix CLS (4 blog pages, SERIOUS)

**Problem:** CLS 0.413 (target < 0.1) on blog post pages.

- [ ] Audit blog post images -- add explicit `width` and `height` attributes to all `<img>` tags
- [ ] Add `aspect-ratio` CSS for blog hero images and inline images
- [ ] Check for dynamically inserted content above the fold (ads, banners, cookie notices)
- [ ] Add CSS `contain` where appropriate
- [ ] Test with Lighthouse before/after

### 13. Reduce Page Load Time (34 pages, MODERATE)

**Problem:** Pages taking 9805ms (target < 3000ms).

- [ ] **Critical CSS inlining**: Extract above-the-fold CSS from `index-BWYBTyBB.css` and inline it
- [ ] **Defer non-critical CSS**: Load remaining CSS asynchronously with `media="print" onload="this.media='all'"`
- [ ] **Code splitting**: Ensure route-based code splitting is working (Vite/React lazy imports)
- [ ] **Server response time**: Review SSR/API response times, add caching headers
- [ ] **Asset optimisation**: Compress CSS/JS bundles, enable Brotli compression

### 14. Reduce Page Size (19 pages, MODERATE)

**Problem:** Pages over 500KB (some at 702.8KB).

- [ ] Audit JS bundle size -- tree-shake unused dependencies
- [ ] Compress images (convert to WebP/AVIF where possible)
- [ ] Lazy-load below-the-fold images
- [ ] Remove unused CSS (PurgeCSS or Tailwind's built-in purge)

### 15. Improve LCP (8 pages, MODERATE)

**Problem:** LCP 2584ms (target < 2500ms). Close to passing.

- [ ] Add `<link rel="preload">` for hero images and key fonts
- [ ] Ensure LCP element (likely hero image or heading) renders without waiting for JS
- [ ] Optimise server response time (see #13)

### 16. Add Responsive Images (4 blog pages, MINOR)

- [ ] Add `srcset` and `sizes` attributes to blog post images
- [ ] Generate multiple image sizes (320w, 640w, 960w, 1200w)

### 17. Cache Validation Headers (34 pages, MINOR)

- [ ] Add `ETag` or `Last-Modified` headers to all responses
- [ ] Configure in server/CDN (likely Vercel/Cloudflare)

### 18. Enable HTTP/2 (29 pages, INFO)

- [ ] Verify hosting provider supports HTTP/2 and it is enabled
- [ ] If using a reverse proxy, ensure HTTP/2 is configured

---

## P1: Accessibility Fix (Score 98 -> 100)

### 19. Colour Contrast Fix (96 issues, SERIOUS)

**Problem:** Single colour combination failing -- `#64748b` on `#f1f5f9` = 4.34:1 ratio (needs 4.5:1).

**This is `text-slate-500` on `bg-slate-100` in Tailwind.**

- [ ] Find all instances of `text-slate-500` used on `bg-slate-100` backgrounds
- [ ] Change to `text-slate-600` (`#475569`) which gives 5.91:1 ratio on `#f1f5f9` -- passes AA
- [ ] Or darken the text to `#5f6d80` for minimal visual change while hitting 4.5:1
- [ ] Test across all affected pages

### 20. Landmark Labels (6 pages, MODERATE)

- [ ] Add unique `aria-label` attributes to duplicate `<nav>` landmarks (e.g., "Main navigation", "Documentation sidebar", "Footer navigation")
- [ ] Primarily affects docs pages with multiple nav regions

---

## P2: SEO Fixes (Score 89 -> 95+)

### 21. Missing Meta Description (1 page, SERIOUS)

- [ ] Add meta description to `/blog/website-launch-checklist` (70-160 characters)

### 22. Duplicate Page Title (SERIOUS)

**Problem:** "Blog - Web Auditing Guides & Insights | Kritano" used on 5 pages.

- [ ] Make each blog listing page title unique:
  - `/blog` -> "Blog - Web Auditing Guides & Insights | Kritano"
  - `/blog?category=accessibility` -> "Accessibility Articles | Kritano Blog"
  - `/blog?category=security` -> "Security Articles | Kritano Blog"
  - `/blog?category=aeo` -> "AEO Articles | Kritano Blog"
  - `/blog?category=guides` -> "Website Audit Guides | Kritano Blog"

### 23. Missing Canonical URLs (4 pages, MODERATE)

- [ ] Add `<link rel="canonical">` to: `/waitlist`, `/faq`, `/author/chris-garlick`, `/blog/website-launch-checklist`

### 24. Title Length Fixes (4 pages, MODERATE)

**Too short (under 30 chars):**
- [ ] `/waitlist` -- expand from ~17 chars to 30-60
- [ ] `/faq` -- expand title
- [ ] `/author/chris-garlick` -- expand title

**Too long (87 chars):**
- [ ] `/blog/the-state-of-web-accessibility-in-2026...` -- shorten to under 60 chars

### 25. Duplicate Meta Description (MODERATE)

- [ ] Identify the 2 pages sharing the same description and write unique ones

### 26. Noindex Review (3 pages, INFO)

- [ ] Decide if `/faq`, `/waitlist`, `/author/chris-garlick` should be indexed
- [ ] If yes, remove `noindex` directive
- [ ] `/faq` in particular should probably be indexed for SEO value

---

## P2: Schema/Social Fixes (Score 88 -> 95+)

### 27. Open Graph Tags (4 pages, MODERATE)

- [ ] Add `og:title`, `og:description`, `og:image`, `og:url` to: `/faq`, `/waitlist`, `/author/chris-garlick`, `/blog/website-launch-checklist`

### 28. Twitter Card Tags (8 pages, MINOR)

- [ ] Add `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` to all 8 affected pages
- [ ] Consider creating a shared SEO/meta component that auto-populates these

### 29. Structured Data for Missing Pages (4 pages, INFO)

- [ ] Add appropriate JSON-LD to: `/author/chris-garlick` (Person), `/waitlist` (WebPage), `/blog/website-launch-checklist` (Article), `/faq` (FAQPage)

---

## P2: E-E-A-T Fixes

### 30. Author Bio (15 pages, SERIOUS)

- [ ] Add author bio component with: photo, name, credentials, short bio, social links
- [ ] Display on all blog posts, blog listing pages, and author page
- [ ] Use `itemprop="author"` schema markup

### 31. Author Credentials (34 pages, MODERATE)

- [ ] Add professional credentials/certifications to author bio
- [ ] Include in JSON-LD Person schema

### 32. Author sameAs Links (30 pages, MODERATE)

- [ ] Add `sameAs` property to JSON-LD Person schema linking to LinkedIn profile
- [ ] Apply site-wide via shared schema component

### 33. First-Hand Experience Signals (29 pages, MODERATE)

- [ ] Add personal observations and test results to content
- [ ] Use phrases like "In our testing...", "Having audited over X websites..."
- [ ] Particularly important for blog posts and services pages

### 34. Citations and References (18 pages, MODERATE)

- [ ] Add links to authoritative sources (.gov, .edu, W3C, MDN)
- [ ] Reference studies and research to support claims
- [ ] Especially on: `/services/*`, `/`, `/about`, blog posts

### 35. Contact Information (21 pages, MINOR)

- [ ] Add business address or registered address to footer (visible site-wide)
- [ ] Or add to `/contact` and link from footer on all pages

### 36. Terms of Service Link (3 pages, INFO)

- [ ] Ensure `/waitlist`, `/faq`, `/author/chris-garlick` pages have footer with terms link
- [ ] These may be using a different layout -- check and unify

---

## P3: Security Fix (Score 96 -> 98+)

### 37. Google Analytics Cookie Secure Flag (34 pages, MINOR)

- [ ] Configure GA4/GTM to set Secure flag on `_ga_PYQW89W26J` cookie
- [ ] Options: set `cookie_flags: 'SameSite=None;Secure'` in gtag config, or configure via GTM

---

## Implementation Order

### Sprint 1: Quick Wins (1-2 days)
1. **#19** Colour contrast fix (single CSS change, kills 96 issues)
2. **#21** Add missing meta description
3. **#22** Fix duplicate page titles
4. **#23** Add canonical URLs
5. **#24** Fix title lengths
6. **#25** Fix duplicate meta description
7. **#27** Add OG tags to 4 pages
8. **#28** Add Twitter Card tags to 8 pages
9. **#20** Add landmark labels
10. **#36** Fix terms link on 3 pages
11. **#37** Fix GA cookie secure flag

### Sprint 2: Performance (2-3 days)
1. **#12** Fix CLS on blog pages
2. **#13** Critical CSS + defer non-critical CSS
3. **#15** Preload key resources for LCP
4. **#16** Add responsive images
5. **#17** Cache validation headers
6. **#14** Reduce page size
7. **#18** Verify HTTP/2

### Sprint 3: E-E-A-T + Schema (2-3 days)
1. **#30** Build author bio component
2. **#31** Add author credentials
3. **#32** Add sameAs links to Person schema
4. **#29** Add structured data to 4 pages
5. **#8** Add FAQPage schema to key pages
6. **#35** Add contact info to footer
7. **#26** Review noindex directives

### Sprint 4: Content Overhaul -- Marketing Pages (3-5 days)
1. **#1** Readability rewrite of: `/`, `/about`, `/pricing`, `/contact`, `/services/*`
2. **#2** Expand thin/short content on marketing pages
3. **#7** Add definition blocks to marketing pages
4. **#9** Add factual density (stats, data points) to marketing pages
5. **#10** Add summary/takeaway sections
6. **#33** Add first-hand experience signals
7. **#34** Add citations and references
8. **#4** Reduce CTAs on marketing pages
9. **#6** Add freshness signals

### Sprint 5: Content Overhaul -- Blog + Docs (3-5 days)
1. **#1** Readability rewrite of blog posts and docs
2. **#2** Expand thin blog/docs content
3. **#3** Keyword optimisation across all blog posts
4. **#5** Add visual content to blog posts and docs
5. **#7** Add definition blocks to docs
6. **#9** Add factual density to blog + docs
7. **#10** Add summary sections to docs
8. **#11** Add citation-friendly schema and markup

---

## Expected Score Impact

| Category | Before | After Sprint 1-2 | After All |
|----------|--------|-------------------|-----------|
| SEO | 89 | 94 | 96 |
| Accessibility | 98 | 100 | 100 |
| Security | 96 | 97 | 98 |
| Performance | 86 | 92 | 95 |
| Content | 52 | 52 | 78 |
| Schema | 88 | 94 | 96 |
| AEO/CQS | 56 | 56 | 76 |
| **Overall** | **81** | **86** | **92** |
