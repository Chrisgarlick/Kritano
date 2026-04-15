# Kritano.com Audit Fix Implementation Plan

**Audit Date:** 15 Apr 2026 | **Overall Score:** 76/100 | **Target Score:** 90+

**Previous audit (13 Apr):** 56/100 -- most Phase 1 issues now resolved.

---

## Summary of Current Issues

| Category | Score | Serious | Moderate | Minor | Info |
|----------|-------|---------|----------|-------|------|
| SEO | 91 | 1 | 4 | 0 | 3 |
| Accessibility | 97 | 2 | 1 | 0 | 0 |
| Security | 64 | 2 | 2 | 0 | 0 |
| Performance | 81 | 2 | 5 | 1 | 1 |
| Content | 53 | 2 | 8 | 7 | 1 |
| E-E-A-T | n/a | 2 | 3 | 1 | 1 |
| AEO | n/a | 3 | 4 | 1 | 1 |
| Schema | 92 | 0 | 0 | 0 | 0 |

0 critical issues. Main drag: Content (53), Security (64), and CQS (57).

---

## Phase 1: Quick Wins (high impact, low effort)

### 1.1 Fix Color Contrast (Accessibility - SERIOUS, 99 instances)

- **Issue:** `#0d9488` (teal-600) on white fails 4.5:1 contrast at small text sizes (ratio 3.74:1)
- **Where:** Pricing page (heaviest), home, services, docs, blog pages
- **Fix:** Replace `text-teal-600` with a darker variant. `#0f766e` (teal-700, ratio 4.64:1) or `#0d6b63` passes AA.
- **Files:** Global search for `teal-600` across all client components and replace with `teal-700`
- **Impact:** Eliminates ~99 serious findings in one change

### 1.2 Fix Scrollable Region Keyboard Access (Accessibility - SERIOUS, 3 instances)

- **Issue:** Code blocks in blog posts are scrollable but not keyboard-focusable
- **Where:** `/blog/security-headers-every-website-needs-in-2026` (3 instances)
- **Fix:** Add `tabindex="0"` and `role="region"` with `aria-label` to scrollable code block containers
- **Files:** Blog post renderer / markdown code block component
- **Impact:** 3 serious findings eliminated

### 1.3 Duplicate Page Title (SEO - SERIOUS, 1 finding)

- **Issue:** "Sign In | Kritano" used on 3 pages
- **Where:** Login, register, and possibly forgot-password pages sharing the same title
- **Fix:** Give each auth page a unique title: "Log In | Kritano", "Create Account | Kritano", "Reset Password | Kritano"
- **Files:** Auth page components (Login.tsx, Register.tsx, etc.)

### 1.4 Missing Canonical URLs (SEO - MODERATE, 3 pages)

- **Issue:** `/faq`, `/waitlist`, `/author/chris-garlick` missing canonical tags
- **Fix:** Add `<PageSeo>` with correct `path` prop to these pages (some may already have it but need `useOverrides` enabled)
- **Files:** `Faq.tsx`, `Waitlist.tsx`, `AuthorPage.tsx`

### 1.5 Title Too Short (SEO - MODERATE, 3 pages)

- **Issue:** `/waitlist`, `/faq`, `/author/chris-garlick` have titles under 30 chars
- **Fix:** Already fixed in routeRegistry defaults. Verify the PageSeo props on these pages use the longer titles.

### 1.6 Exposed JSON Configuration (Security - SERIOUS, 1 finding)

- **Issue:** `/config.json` is publicly accessible
- **Investigate:** Check what this file is. If it's a Vite/build artifact or app config, block it in nginx or remove from public dir.
- **Fix:** Add deny rule in nginx: `location = /config.json { deny all; return 404; }`

### 1.7 Insecure Cookie `_ga` (Security - SERIOUS, 27 pages)

- **Issue:** Google Analytics `_ga` cookie missing Secure flag
- **Status:** WONT FIX (same as previous audit) -- GA sets this cookie via its own JS. Over HTTPS it should set Secure automatically. This is a scanner timing artefact.

### 1.8 CSRF Cookie HttpOnly (Security - MODERATE, 27 pages)

- **Status:** WONT FIX (by design) -- double-submit cookie pattern requires JS to read the token. HttpOnly would break CSRF protection.

---

## Phase 2: Performance (score 81 -> 90+)

### 2.1 Slow Page Load (SEO - MODERATE, 27 pages, 9639ms)

- **Root cause:** All pages affected -- likely server response time (TTFB) or large JS bundles
- **Actions:**
  1. Check if SSR/prerendering would help with TTFB
  2. Audit bundle size with `npx vite-bundle-visualizer`
  3. Add proper `Cache-Control` headers (marked as missing on 27 pages -- verify nginx config is deployed)
  4. Consider code-splitting large route chunks

### 2.2 Poor CLS (Performance - SERIOUS, 3 blog pages, CLS 0.414)

- **Where:** All 3 blog post pages
- **Fix:** Set explicit `width`/`height` on blog featured images, ensure fonts have `font-display: swap` with proper fallback sizing, check for dynamically injected content above fold
- **Files:** Blog post layout component, image components

### 2.3 Poor LCP on Services Page (Performance - SERIOUS, 4408ms)

- **Where:** `/services`
- **Fix:** Preload the hero/LCP image with `<link rel="preload">`, optimize image format (WebP/AVIF), reduce server response time

### 2.4 LCP Needs Improvement (Performance - MODERATE, 6 pages, ~2672ms)

- **Where:** Blog, home, docs, pricing
- **Fix:** Same as 2.3 -- preload LCP elements, optimize images

### 2.5 Render-Blocking CSS (Performance - MODERATE, 27 pages)

- **Issue:** Main stylesheet blocks rendering
- **Fix:** Inline critical CSS for above-the-fold content, defer the rest. Or accept this as a standard SPA trade-off.
- **Note:** This is common for Vite SPAs and may be low-priority.

### 2.6 Large Page Size (Performance - MODERATE, 18 pages, 721KB+)

- **Actions:**
  1. Check if images are optimized (WebP, proper sizing)
  2. Review JS bundle splitting
  3. Remove unused CSS/JS

### 2.7 Missing Responsive Images (Performance - MINOR, 3 blog pages)

- **Fix:** Add `srcset` and `sizes` to blog post images
- **Files:** Blog image component or markdown renderer

---

## Phase 3: Content & Readability (score 53 -> 70+)

These are the biggest score draggers but require content work, not code.

### 3.1 Poor Readability Score (Content - SERIOUS, 23 pages)

- **Issue:** Readability score of 20/100 on many pages
- **Root cause:** Technical content (API docs, services) uses complex vocabulary
- **Actions:**
  1. Simplify sentence structure on key landing pages (home, services, pricing, about)
  2. API docs are inherently technical -- accept lower readability there
  3. Add TL;DR summaries at top of technical pages

### 3.2 Thin Content (SEO - MODERATE, 8 pages)

- **Pages:** waitlist, faq, blog listing, author, contact, category pages
- **Fix:** Expand content on waitlist (add feature preview, benefits), contact (add FAQ, office info), author page (expand bio, add articles list)
- **Note:** Blog category pages are listing pages -- thin content is expected. Consider excluding listing pages from word count checks.

### 3.3 Wall of Text (Content - SERIOUS, 2 pages)

- **Where:** `/docs/objects`, `/docs/endpoints`
- **Fix:** Add H3 subheadings every 300-400 words within the docs content

### 3.4 Academic Reading Level & High Vocabulary (Content - MODERATE, 23 pages)

- **Largely overlaps with 3.1.** Focus on non-technical pages first.

### 3.5 Keyword Optimisation (Content - MODERATE, 3 blog posts)

- **Issues:** Missing keyword in meta description, introduction, and low keyword density on blog posts
- **Fix:** Review blog post meta descriptions to include target keywords. Naturally weave keywords into opening paragraphs.

### 3.6 Duplicate Meta Description (SEO - MODERATE, 1 finding)

- **Issue:** Same meta description on 27 pages
- **Investigate:** This likely means the fallback meta description from `index.html` is being used as default. Each page should already have unique descriptions via `PageSeo`. Check if there's a rendering issue where the Helmet description isn't overriding the HTML default.

---

## Phase 4: E-E-A-T Improvements

### 4.1 Author Bio Missing on Non-Blog Pages (E-E-A-T - SERIOUS, 9 pages)

- **Where:** author page, terms, waitlist, blog listings, privacy, faq
- **Fix:** These pages don't need an author bio (it's not applicable to terms/privacy/listing pages). Consider adjusting the E-E-A-T engine to not flag legal/listing pages.
- **For author page:** Ensure the author bio component renders correctly.

### 4.2 Ghost Content / Low E-E-A-T Score (E-E-A-T - SERIOUS, 8 pages)

- **Same pages as 4.1.** The fix is to add trust signals where appropriate:
  - Blog listing pages: add editorial intro paragraph
  - Waitlist: add social proof (user count, testimonials)
  - Author page: ensure bio, credentials, social links render

### 4.3 No Author Credentials (E-E-A-T - MODERATE, 27 pages)

- **Fix:** Add credentials/qualifications to the author bio component (e.g. "10+ years in web development" or specific certs)
- **Files:** `AuthorBio.tsx`, `About.tsx` author section

### 4.4 No First-Hand Experience Signals (E-E-A-T - MODERATE, 23 pages)

- **Fix:** Add "Based on data from X audits" or "In our testing..." language to service pages and blog posts
- **Lower priority** -- content change, not code

### 4.5 No Citations / References (E-E-A-T - MODERATE, 17 pages)

- **Fix:** Add links to authoritative sources (W3C WCAG specs, Google documentation, MDN) in service pages and blog posts

---

## Phase 5: AEO (Answer Engine Optimisation)

### 5.1 Low AEO Citability (AEO - SERIOUS, 26 pages)

- **Root cause:** Missing definition blocks, FAQ sections, factual density, and summary statements
- **Quick wins:**
  1. Add definition blocks to service pages ("Website accessibility auditing is...")
  2. Add FAQ schema to key landing pages (pricing, services, home)
  3. Add "Key takeaway" sections to blog posts and service pages

### 5.2 No FAQ Sections (AEO - MODERATE, 19 pages)

- **Fix:** Add `FAQPage` schema to pages that already have FAQ-like content (pricing, services)
- **For others:** Add question-based H2/H3 headings

### 5.3 No Author sameAs Links (AEO - MODERATE, 24 pages)

- **Issue:** Structured data missing sameAs links on most pages
- **Fix:** Ensure the Person schema in blog posts and pages includes sameAs links. Already fixed the LinkedIn URL -- verify it's rendering in JSON-LD across all pages.
- **Files:** `blogSchemaBuilder.ts`, page-level structured data

### 5.4 No Summary Statements (AEO - MODERATE, 16 pages)

- **Fix:** Add "Key takeaway" or "TL;DR" sections to service pages, docs, and blog posts

---

## Phase 6: CSP Hardening (Security - MODERATE)

### 6.1 CSP Allows unsafe-inline Scripts (27 pages)

- **Issue:** CSP allows `unsafe-inline` for scripts
- **Fix:** Implement nonce-based CSP. This requires:
  1. Server generates a random nonce per request
  2. Nonce injected into CSP header and inline script tags
  3. For a Vite SPA, this means either SSR or a middleware that rewrites the HTML
- **Complexity:** High. May defer to a later sprint.
- **Alternative:** Use hash-based CSP for the known inline scripts (Vite injects a predictable module loader)

---

## Implementation Order (Priority)

| Priority | Task | Impact | Effort |
|----------|------|--------|--------|
| 1 | Fix teal-600 contrast (1.1) | -99 serious | 15 min |
| 2 | Fix scrollable regions (1.2) | -3 serious | 15 min |
| 3 | Fix duplicate title (1.3) | -1 serious | 10 min |
| 4 | Block /config.json (1.6) | Security fix | 5 min |
| 5 | Fix missing canonicals (1.4) | -3 moderate | 15 min |
| 6 | Fix CLS on blog posts (2.2) | -3 serious | 30 min |
| 7 | Fix LCP on services (2.3) | -1 serious | 30 min |
| 8 | Add author credentials (4.3) | E-E-A-T boost | 15 min |
| 9 | Investigate duplicate meta desc (3.6) | SEO fix | 30 min |
| 10 | Add FAQ schema to key pages (5.2) | AEO boost | 1 hr |
| 11 | Content improvements (3.1-3.5) | Content score | Ongoing |
| 12 | CSP nonce (6.1) | Security hardening | 2-4 hrs |

---

## Manual Admin Tasks

These require action in the admin panel or CMS, not code changes.

### ~~Fix Non-Self-Referencing Canonicals~~ -- RESOLVED

Verified the admin SEO manager already has the correct canonical URLs for `/pricing` and `/blog`. The audit finding was likely from a pre-deploy snapshot.

### Update Blog Post Meta Descriptions (CMS)

The audit flagged target keywords missing from meta descriptions on 3 blog posts. Edit each post in the CMS and update the SEO Description field to naturally include the target keyword:

1. `/blog/answer-engine-optimisation-how-to-get-cited-by-ai` -- include "answer engine optimisation" in meta description
2. `/blog/what-is-a-website-audit-and-why-does-it-matter` -- include "website audit" in meta description
3. `/blog/security-headers-every-website-needs-in-2026` -- include "security headers" in meta description

### Content Improvements (Writing Work)

These findings require manual content rewrites, not code:

- **Poor Readability (23 pages)** -- Simplify sentence structure on landing pages. API docs are inherently technical, accept lower readability there.
- **Thin Content (8 pages)** -- Expand waitlist (add feature preview, benefits), contact (add FAQ), author (expand bio). Blog listing/category pages are listings by nature.
- **Keyword density / introduction (3 blog posts)** -- Weave keywords more naturally into opening paragraphs.
- **No first-hand experience signals (23 pages)** -- Add "In our testing...", "Based on data from X audits..." language to service pages and blog posts.
- **No citations/references (17 pages)** -- Link to authoritative sources (W3C WCAG specs, Google docs, MDN) in service pages and blog posts.
