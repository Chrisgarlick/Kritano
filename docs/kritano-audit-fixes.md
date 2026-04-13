# Kritano.com Audit Fix Implementation Plan

**Audit Date:** 13 Apr 2026 | **Overall Score:** 56/100 | **Target Score:** 80+

---

## Summary of Issues

| Category | Score | Critical | Serious | Moderate | Minor | Info |
|----------|-------|----------|---------|----------|-------|------|
| Security | 34 | 1 | 2 | 4 | 3 | 0 |
| Accessibility | 58 | 0 | 3 | 2 | 1 | 0 |
| Performance | 52 | 0 | 2 | 7 | 2 | 1 |
| Content | 48 | 0 | 3 | 8 | 0 | 0 |
| SEO | 86 | 0 | 1 | 5 | 2 | 3 |
| Schema | 63 | 0 | 0 | 0 | 0 | 0 |

---

## Phase 1: CRITICAL & SECURITY (Do Immediately)

### 1.1 Exposed .env File [CRITICAL]
- **Impact:** Leaks secrets (DB creds, API keys, etc.)
- **File:** Server/nginx config
- **Fix:** Add a deny rule in nginx for dotfiles:
  ```nginx
  location ~ /\. {
      deny all;
      return 404;
  }
  ```
- **Also:** Rotate ALL secrets in the .env immediately (DB passwords, API keys, JWT secrets, etc.)

### 1.2 Missing Security Headers [SERIOUS - all 29 pages]
- **File:** `scripts/nginx.conf`
- **Note:** The nginx.conf already has HSTS, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy defined. The audit still flags them, so either:
  - The deployed nginx config is outdated (most likely), OR
  - The headers are in the wrong block and not being applied
- **Fix:** Verify the deployed config matches `scripts/nginx.conf`. Redeploy if needed.
- **Add missing headers:**
  ```nginx
  # Content Security Policy
  add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com;" always;

  # Permissions Policy
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
  ```

### 1.3 Insecure Cookie [SERIOUS - 29 pages]
- **Issue:** `_ga_PYQW89W26J` missing Secure flag
- **Fix:** This is a Google Analytics cookie. Ensure GA is loaded over HTTPS only. The cookie should auto-set Secure when served over HTTPS. Verify the site forces HTTPS redirect.

### 1.4 CSRF Cookie Missing HttpOnly [MODERATE - 29 pages]
- **Issue:** `csrf_token` cookie missing HttpOnly flag
- **File:** Server-side cookie configuration (Express middleware)
- **Fix:** Find the CSRF cookie setter in the Express backend and add `httpOnly: true`:
  ```js
  res.cookie('csrf_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  });
  ```
- **Note:** If the frontend reads the CSRF token from the cookie (common pattern), HttpOnly will break that. In that case, serve the token via a header or meta tag instead.

### 1.5 Server Version Exposed [MINOR - 29 pages]
- **File:** `scripts/nginx.conf`
- **Fix:** Add `server_tokens off;` in the http or server block

### 1.6 Missing security.txt [MINOR]
- **Fix:** Create `/.well-known/security.txt` with contact and disclosure policy
- **File:** Add to the public/static directory served by nginx

---

## Phase 2: ACCESSIBILITY (High Impact on Score)

### 2.1 Color Contrast Failures [SERIOUS - 275 instances across many pages]
- **Root Cause:** `#64748b` (slate-500) on `#1e293b` (slate-800) = 3.07:1 ratio (needs 4.5:1)
- **Affected:** Docs pages, pricing, services, homepage, about - essentially all dark-mode/dark-section text
- **Files to change:**
  - `client/src/components/docs/DocsLayout.tsx`
  - `client/src/pages/docs/*.tsx` (all 6 doc pages)
  - `client/src/pages/public/Pricing.tsx`
  - `client/src/components/layout/PublicLayout.tsx` (footer)
  - Any component using `text-slate-500` on dark backgrounds
- **Fix:** Replace `text-slate-500` (`#64748b`) with `text-slate-400` (`#94a3b8`) on dark backgrounds. Slate-400 on slate-800 gives ~4.6:1 ratio.
- **Global search:** `grep -r "text-slate-500" client/src/` and evaluate each against its background

### 2.2 Links Not Distinguishable Without Color [SERIOUS - 32 pages]
- **Root Cause:** Links use `#4f46e5` (indigo-600) against `#64748b` (slate-500) surrounding text with only 1.32:1 contrast and no underline
- **Files:** Global link styles across all pages - this is a site-wide issue
- **Fix:** Add underlines to inline/body links globally. In `client/src/index.css`:
  ```css
  /* Ensure links in body content are distinguishable */
  main a:not([class*="btn"]):not([role="button"]):not(nav a) {
    text-decoration: underline;
    text-decoration-color: currentColor;
    text-underline-offset: 2px;
  }
  ```
- **Or:** Add underline classes (`underline underline-offset-2`) to inline links in docs, blog, terms, privacy, about, etc.

### 2.3 Scrollable Region Keyboard Access [SERIOUS - 4 pages]
- **Affected:** Docs authentication, docs endpoints (code blocks)
- **Root Cause:** `<pre>` or `<code>` blocks that overflow and scroll but aren't focusable
- **Files:** `client/src/pages/docs/DocsAuthPage.tsx`, `client/src/pages/docs/DocsEndpointsPage.tsx`
- **Fix:** Add `tabIndex={0}` and `role="region"` with `aria-label="Code example"` to scrollable code containers

### 2.4 Content Not in Landmarks [MODERATE - 24 pages]
- **Affected:** Settings pages, author page, waitlist, FAQ, forgot-password
- **Root Cause:** Page content outside of `<main>`, `<nav>`, `<header>`, `<footer>` landmarks
- **Files:**
  - `client/src/components/layout/SettingsLayout.tsx`
  - Pages: waitlist, FAQ, forgot-password, author
- **Fix:** Ensure all visible content is wrapped in appropriate landmark elements. Add `<main id="main-content">` wrapper to any page missing it.

### 2.5 Heading Hierarchy [MODERATE - 7 pages]
- **Affected:** Docs overview, docs endpoints (H1 jumping to H3)
- **Files:** `client/src/pages/docs/DocsOverviewPage.tsx`, `client/src/pages/docs/DocsEndpointsPage.tsx`
- **Fix:** Audit heading levels and ensure H1 > H2 > H3 order with no skips

### 2.6 Image Alt Text Duplicates Surrounding Text [MINOR - 44 instances]
- **Affected:** Docs, blog, services, about, homepage, privacy, terms, pricing
- **Root Cause:** Images with alt text that repeats the adjacent heading/text
- **Fix:** Change alt text to describe the image content rather than repeat the heading. For decorative images, use `alt=""` with `role="presentation"`.

---

## Phase 3: PERFORMANCE

### 3.1 Slow Server Response - 10.8s average [SERIOUS - 29 pages]
- **Target:** < 1500ms
- **Investigation needed:**
  - Is this SSR or API latency?
  - Check if it's the React SPA bundle download time
  - Check server resource constraints
- **Likely fixes:**
  - Enable nginx caching for static pages
  - Add `Cache-Control` headers (flagged missing on all 29 pages)
  - Enable gzip (already in nginx.conf - verify deployed)
  - Consider CDN (Cloudflare, etc.)

### 3.2 Render-Blocking CSS (Google Fonts) [MODERATE - 29 pages]
- **File:** `client/index.html`
- **Current:** Fonts loaded via preconnect + preload + stylesheet
- **Fix:** Add `&display=swap` to all Google Font URLs (also fixes the separate "missing display=swap" finding):
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  ```
- **Better fix:** Self-host fonts to eliminate the render-blocking external request entirely

### 3.3 Missing Cache Headers [MODERATE - 29 pages]
- **File:** `scripts/nginx.conf`
- **Note:** Config already has cache rules for static assets. Likely the HTML pages themselves lack cache headers.
- **Fix:** Add short-lived cache for HTML pages:
  ```nginx
  location / {
      add_header Cache-Control "public, max-age=300, stale-while-revalidate=86400";
  }
  ```

### 3.4 Large Page Size - 1.1MB [MODERATE - 29 pages]
- **Investigation:** Check JS bundle size with `npx vite-bundle-visualizer`
- **Fixes:**
  - Code-split routes (React.lazy + Suspense)
  - Tree-shake unused dependencies
  - Compress images to WebP

### 3.5 Image Optimisation [MODERATE]
- **Large image:** `1_1.png` at 551.5KB on blog pages
- **Missing dimensions:** Blog images lack width/height attributes
- **Fix:** Convert blog images to WebP, add explicit width/height attributes to `<img>` tags in blog components
- **Files:** `client/src/pages/blog/PostListPage.tsx`, `client/src/pages/blog/PostDetailPage.tsx`

### 3.6 CLS (Layout Shift) [SERIOUS - 2 blog pages]
- **Score:** 0.444 (target < 0.1)
- **Root cause:** Images without dimensions + late-loading content
- **Fix:** Add width/height to all images, reserve space for dynamic content

### 3.7 HTTP/2 [INFO - 18 pages]
- **File:** `scripts/nginx.conf`
- **Fix:** Enable HTTP/2:
  ```nginx
  listen 443 ssl http2;
  ```

---

## Phase 4: SEO

### 4.1 Duplicate Page Titles [SERIOUS]
- **Issue:** "Sign In | Kritano" used on 6 pages
- **Fix:** Give each page a unique title via React Helmet. Check all pages using `<Helmet>`.

### 4.2 Duplicate Meta Description [MODERATE]
- **Issue:** Same meta description on all 29 pages
- **Fix:** Each page needs a unique meta description. Update `<Helmet>` on every page/route.

### 4.3 Missing Canonical URLs [MODERATE - 6 pages]
- **Affected:** forgot-password, author, FAQ, settings, waitlist, api-keys
- **Fix:** Add `<link rel="canonical">` via Helmet on these pages

### 4.4 Title Length Issues [MODERATE]
- **Too short (16 pages):** Expand titles to 30-60 chars
- **Too long (2 pages):** Shorten pricing and homepage titles

### 4.5 Empty Image Alt Text [MINOR - 4 blog pages]
- **Fix:** Add descriptive alt text to blog listing images, or `role="presentation"` if decorative

### 4.6 Heading Hierarchy [MINOR - 2 docs pages]
- Already covered in Accessibility 2.5

### 4.7 Structured Data [INFO - 14 pages]
- **Fix:** Add JSON-LD structured data. Priority pages:
  - Homepage: Organization schema
  - Blog posts: Article schema (likely already have this)
  - Pricing: Product schema
  - FAQ: FAQPage schema
  - Docs: TechArticle schema

---

## Phase 5: CONTENT

### 5.1 Readability [SERIOUS - 26 pages]
- **Score:** 32/100 with grade-20 reading level
- **Fix:** Rewrite copy on key pages to target grade 7-9. Priority:
  - Homepage, pricing, services pages (user-facing)
  - About page
- **Not applicable:** Docs pages can have higher reading levels (technical audience)

### 5.2 Thin Content [SERIOUS - 3 pages + 11 SEO-flagged]
- **Under 300 words:** Pricing, homepage, services
- **Fix:** Add substantive content. For pricing, add FAQ section. For homepage, expand value propositions. For services, add more detail.

### 5.3 Wall of Text [SERIOUS - 2 docs pages]
- **Affected:** docs/objects, docs/endpoints
- **Fix:** Add H2/H3 subheadings every 300-400 words

### 5.4 Missing CTAs [MODERATE - 6 pages]
- **Affected:** Author, API keys, forgot-password, FAQ, waitlist, profile
- **Fix:** Add relevant CTAs to these pages

---

## Implementation Order

| Step | Task | Est. Impact | Files |
|------|------|-------------|-------|
| 1 | Block .env in nginx + rotate secrets | Security +15 | nginx.conf |
| 2 | Deploy updated nginx config (headers, server_tokens, HTTP/2, cache) | Security +20, Perf +5 | nginx.conf |
| 3 | Fix CSRF cookie flags | Security +5 | Express middleware |
| 4 | Fix color contrast (slate-500 to slate-400 on dark bg) | A11y +15 | ~20 component files |
| 5 | Add link underlines for distinguishability | A11y +5 | index.css or per-component |
| 6 | Fix scrollable code blocks (tabIndex, role) | A11y +3 | 2 docs pages |
| 7 | Add landmark wrappers + fix heading hierarchy | A11y +3 | ~8 pages |
| 8 | Add display=swap to Google Fonts | Perf +3 | index.html |
| 9 | Add image dimensions + convert to WebP | Perf +5 | Blog components |
| 10 | Unique page titles + meta descriptions | SEO +5 | All pages (Helmet) |
| 11 | Add canonical URLs + structured data | SEO +3 | 6+ pages |
| 12 | Rewrite content for readability | Content +10 | Marketing pages |
| 13 | Expand thin pages + add CTAs | Content +5 | ~10 pages |
| 14 | Code-split + bundle optimisation | Perf +5 | vite.config.ts |
| 15 | security.txt | Security +1 | New file |

---

## Critical Files Summary

| File | Changes |
|------|---------|
| `scripts/nginx.conf` | Block dotfiles, add CSP, Permissions-Policy, server_tokens off, HTTP/2, cache headers |
| `client/index.html` | Add `&display=swap` to font URLs |
| `client/src/index.css` | Add global link underline styles |
| `client/src/pages/docs/*.tsx` | Fix contrast, heading hierarchy, scrollable regions |
| `client/src/pages/public/Pricing.tsx` | Fix contrast, expand content, fix title |
| `client/src/components/layout/PublicLayout.tsx` | Fix footer contrast, landmarks |
| `client/src/components/docs/DocsLayout.tsx` | Fix contrast in sidebar |
| `client/src/pages/blog/PostListPage.tsx` | Image dimensions, alt text |
| `client/src/pages/blog/PostDetailPage.tsx` | Image dimensions, CLS fix |
| Express cookie middleware | CSRF httpOnly flag |
| All page components | Unique titles, meta descriptions, canonical URLs via Helmet |

---

## Testing Plan

1. **After each phase:** Re-run Kritano audit on staging
2. **Accessibility:** Test with keyboard navigation + screen reader (VoiceOver)
3. **Contrast:** Use browser DevTools contrast checker on all modified elements
4. **Security headers:** Verify with `curl -I https://kritano.com`
5. **Performance:** Run Lighthouse before/after
6. **SEO:** Validate structured data with Google Rich Results Test
