# Kritano.com Audit Fixes - Implementation Plan

**Audit Date:** 15 Apr 2026 | **Overall Score:** 76/100 | **Target Score:** 90+
**Phase 1 (Security) Status:** IMPLEMENTED - ready for deploy & testing

## Overview

This plan addresses all findings from the self-audit of kritano.com, prioritised by severity and grouped by category. Security is the primary focus (score: 64), followed by Content (53), Performance (80), SEO (90), Accessibility (99), and Schema (89).

---

## Key Decisions

1. **Security first** - the 64 score is the weakest area and most impactful for a company selling security audits
2. **CSP nonces over unsafe-inline** - invest in proper nonce-based CSP to eliminate unsafe-inline
3. **Remove unused GA CSP allowances** - tighten the attack surface since GA is not in use
4. **Content improvements are manual** - readability/E-E-A-T fixes require copywriting, not code changes
5. **Cache headers already configured in nginx** - the audit scanner may be checking response headers before nginx proxies them; verify in production

---

## Phase 1: Security (Score: 64 -> 90+) [CRITICAL]

### 1.1 Exposed config.json [SERIOUS]

**Current state:** Nginx returns 404 for `/config.json` (line 48-50 of `scripts/nginx.conf`). The audit still flags it.

**Investigation needed:**
- Verify the 404 block is deployed to production (`curl -I https://kritano.com/config.json`)
- Check if Express is serving a `/config.json` route before nginx catches it
- Check if a `config.json` file exists in `client/dist/` after build

**Fix (if file exists in dist):**
- Add to `.gitignore` and remove from build output
- Ensure Vite is not copying it to `dist/`

**Fix (if nginx block not deployed):**
- Redeploy nginx config: `sudo nginx -t && sudo systemctl reload nginx`

**Files:** `scripts/nginx.conf`, check `client/dist/`

---

### 1.2 CSP: Remove unsafe-inline for Scripts [MODERATE - 27 pages]

**Current state:** `scripts/nginx.conf` has `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com`

**Why unsafe-inline exists:** React injects inline scripts. Google Analytics (not actually used) also needs it.

**Fix - Hash-based CSP:**

1. After Vite builds, compute SHA-256 hashes of any inline scripts in `index.html`
2. Replace `'unsafe-inline'` with the specific hashes: `'sha256-<hash>'`
3. **Remove GA/GTM from CSP** since it is not used - this tightens the policy significantly

**Updated CSP for nginx:**
```
script-src 'self' 'sha256-<vite-inline-hash>';
connect-src 'self';
frame-src 'none';
```

**Files:** `scripts/nginx.conf`, potentially a post-build script to extract hashes

---

### 1.3 Insecure Cookie: _ga_PYQW89W26J Missing Secure Flag [SERIOUS - 27 pages]

**Current state:** A Google Analytics cookie is being set without the Secure flag. However, no GA code exists in the codebase.

**Investigation needed:**
- This cookie is likely set by a previously-deployed GA snippet that was removed, or a third-party injection
- Check if the domain has any third-party scripts injected (CDN, hosting panel, etc.)

**Fix:**
- Confirm GA is not in use and no GA scripts are injected anywhere
- If a residual GA script exists somewhere (e.g., in a CDN config or hosting panel), remove it
- Stale GA cookies will expire naturally
- The tightened CSP (1.2) will prevent GA from setting cookies in the future

**Files:** Check production deployment, any CDN/hosting panel config

---

### 1.4 CSRF Token Cookie Missing HttpOnly [MODERATE - 27 pages]

**Current state:** `server/src/middleware/csrf.middleware.ts` intentionally sets `httpOnly: false` on the csrf_token cookie. This is **correct by design** - the double-submit cookie pattern requires JavaScript to read the cookie and send it as a header.

**Action:** This is a false positive from the audit. The CSRF implementation is secure:
- 32-byte cryptographically random tokens
- Timing-safe comparison (`timingSafeEqual`)
- SameSite=strict
- Secure flag in production

**Improvement:** Update the security audit engine (`server/src/services/audit-engines/security.engine.ts`) to recognise double-submit CSRF patterns and not flag csrf cookies without HttpOnly when SameSite=strict is set.

---

### 1.5 Additional Security Hardening

| Item | Action | Priority |
|------|--------|----------|
| Remove GA from CSP | Tighten `script-src` and `connect-src` in nginx | High |
| Enable HTTP/2 | Add `http2` to nginx listen directive | High |
| SRI (Subresource Integrity) | Add `integrity` attributes to script/link tags | Medium |
| Verify seed credentials | Ensure dev seed data is not in production DB | High |
| Permissions-Policy | Already configured - verify deployed | Medium |

---

## Phase 2: Performance (Score: 80 -> 90+)

### 2.1 Cache Headers Not Detected [MODERATE - 27 pages]

**Current state:** Nginx already sets cache headers but the scanner may not be seeing them.

**Fix:**
- Verify in production: `curl -I https://kritano.com/`
- If missing, redeploy nginx config
- Add fallback cache headers to Express for HTML responses

**Files:** `scripts/nginx.conf`, potentially `server/src/index.ts`

---

### 2.2 Poor CLS [SERIOUS - 3 blog pages]

**CLS: 0.437** (target: <0.1).

**Fix:**
- Add explicit `width` and `height` to all `<img>` tags in blog content
- Add `font-display: swap` with font preloading for Instrument Serif and Outfit
- Use `aspect-ratio` CSS on image containers
- Preload hero/LCP images

**Files:** Blog post components, `client/index.html`

---

### 2.3 Render-Blocking CSS [MODERATE - 27 pages]

**Fix:**
- Extract critical above-the-fold CSS and inline in `<head>`
- Defer main stylesheet with `media="print" onload="this.media='all'"` pattern
- Or use Vite's `cssCodeSplit: true`

**Files:** `client/vite.config.ts`, `client/index.html`

---

### 2.4 Large Page Size [MODERATE - 18 pages]

**756KB+** (target: <500KB).

**Fix:**
- Audit bundle with `npx vite-bundle-visualizer`
- Enable Brotli compression in nginx (currently gzip only)
- Further lazy-load route-specific chunks
- Tree-shake unused dependencies

**Files:** `client/vite.config.ts`, `scripts/nginx.conf`

---

### 2.5 LCP Needs Improvement [MODERATE - 9 pages]

**LCP: 3172ms** (target: <2500ms).

**Fix:**
- Preload LCP images with `<link rel="preload">`
- Preload fonts
- Consider prerendering/SSG for marketing pages
- Reduce TTFB

**Files:** `client/index.html`, font loading strategy

---

### 2.6 Slow Page Load [MODERATE - 27 pages, from SEO section]

**10687ms** (target: <3000ms). This is the aggregate of all performance issues. Fixing the above should bring this down significantly.

---

### 2.7 Enable HTTP/2 [INFO - 23 pages]

**Fix:** Add `http2` to the nginx listen directive:
```nginx
listen 443 ssl http2;
```

**Files:** `scripts/nginx.conf`

---

### 2.8 Missing Responsive Images [MINOR - 3 blog pages]

**Fix:** Add `srcset` and `sizes` attributes to blog post images.

**Files:** Blog image component

---

## Phase 3: SEO (Score: 90 -> 95+)

### 3.1 Duplicate Page Title [SERIOUS - 3 pages]

"Log In to Your Account | Kritano" used on 3 pages.

**Fix:** Unique titles for each auth page (e.g., "Sign In", "Reset Password", "Create Account").

**Files:** Auth page components

---

### 3.2 Missing Canonical URLs [MODERATE - 3 pages]

FAQ, Waitlist, Author pages missing canonical tags.

**Fix:** Add `<link rel="canonical">` via React Helmet or equivalent.

---

### 3.3 Duplicate Meta Description [MODERATE - 2 pages]

**Fix:** Write unique descriptions for affected pages.

---

### 3.4 Missing Social Meta Tags [MINOR]

6 pages missing Twitter Card tags, 3 pages missing OG tags.

**Fix:** Create a shared `<SEOHead>` component that sets OG + Twitter meta for every page. Ensure FAQ, Waitlist, and Author pages use it.

---

### 3.5 Meta Description Length [MINOR]

3 too long (182 chars), 1 too short (68 chars). Target: 70-160.

**Fix:** Adjust descriptions.

---

### 3.6 Thin Content [MODERATE - 8 pages]

Pages with <300 words (blog index, category pages, waitlist, contact).

**Fix:** Add introductory copy to listing pages, expand contact page.

---

## Phase 4: Accessibility (Score: 99 -> 100)

### 4.1 Duplicate Landmark Roles [MODERATE - 6 pages]

Docs pages have landmarks without unique labels.

**Fix:** Add `aria-label` to landmarks (e.g., "Main navigation", "Docs sidebar", "Page navigation").

**Files:** Docs layout components

---

### 4.2 Colour Contrast [INFO - 95 instances]

Ratio 4.41:1 vs required 4.5:1 for `#dc2626` on `#fef2f2`.

**Fix:** Darken red to `#c72020` or similar to achieve 4.5:1+. This is likely the error/validation state colour.

**Files:** Tailwind config or components using `red-600` on `red-50`

---

## Phase 5: Content & E-E-A-T (Score: 53 -> 70+)

These are primarily copywriting tasks.

### 5.1 Poor Readability [SERIOUS - 23 pages]

Score: 26/100. Grade level 38.8 (target: 7-9).

**Fix (manual copywriting):**
- Shorten sentences to 15-20 words average
- Replace jargon with simpler alternatives
- Use bullet points for complex ideas
- Use active voice

**Priority:** Homepage, Services pages, Pricing, About

---

### 5.2 Wall of Text [SERIOUS - 2 docs pages]

500+ word sections without subheadings.

**Fix:** Add H2/H3 subheadings every 300-400 words.

---

### 5.3 E-E-A-T Improvements [SERIOUS/MODERATE]

| Issue | Pages | Fix |
|-------|-------|-----|
| No Author Bio | 9 | Create `<AuthorBio>` component, add to all pages |
| Ghost Content (33/100) | 8 | Add trust signals, credentials, citations |
| No Author Credentials | 27 | Add to Person schema and visible bio |
| No First-Hand Experience | 23 | Add personal observations/test results to copy |
| No Citations | 17 | Link to authoritative .gov/.edu sources |
| No Contact Info | 14 | Add physical address/phone to footer |

---

### 5.4 Content Structure [MODERATE/MINOR]

- Excessive sentence length (21 pages) - shorten
- Low content-to-HTML ratio (18 pages) - add content
- Too many CTAs (11 pages) - reduce to 2-3 per page
- No freshness signals (10 pages) - add published/updated dates
- No questions in content (9 pages) - add engagement questions
- Low transition word usage (9 pages) - improve flow

---

## Phase 6: AEO (Answer Engine Optimisation)

### 6.1 Low Citability [SERIOUS - 26 pages]

AEO score: 13/100.

**Fix:**
- Add definition blocks ("X is a..." patterns) to service and docs pages
- Add FAQ sections with FAQPage schema to key pages
- Add summary/TL;DR sections to all content pages
- Increase factual density with statistics and data

---

### 6.2 Schema for AI [MODERATE]

- Add `sameAs` links to Person schema (LinkedIn, Twitter)
- Add FAQPage schema to FAQ and content pages
- Add HowTo schema where applicable
- Add `<cite>` and `<blockquote cite="">` semantic markup

---

## Phase 7: Schema (Score: 89 -> 95+)

### 7.1 Missing OG/Twitter Data [MODERATE - 3/6 pages]

Same fix as SEO 3.4 - shared `<SEOHead>` component.

---

## Critical Files Summary

| File | Changes |
|------|---------|
| `scripts/nginx.conf` | CSP hashes, HTTP/2, remove GA, verify cache headers |
| `client/index.html` | Font preloading, critical CSS, LCP image preload |
| `client/vite.config.ts` | CSS code splitting, SRI, bundle optimisation |
| `client/src/` (page components) | Meta tags, canonical URLs, unique titles, author bios |
| `server/src/services/audit-engines/security.engine.ts` | Improve CSRF cookie detection logic |
| Blog/docs content | Readability rewrites, subheadings, E-E-A-T signals |

---

## Implementation Order

### Sprint 1: Security (1-2 days) [PRIORITY]
1. Verify and fix config.json exposure in production
2. Remove GA/GTM from CSP (not in use)
3. Implement hash-based CSP to replace unsafe-inline
4. Verify all security headers deployed
5. Enable HTTP/2 in nginx
6. Verify cookie flags in production
7. Check for stale GA scripts/cookies

### Sprint 2: Performance (2-3 days)
1. Font preloading + `font-display: swap`
2. Fix CLS on blog pages (image dimensions, aspect-ratio)
3. Inline critical CSS / defer main stylesheet
4. Enable Brotli compression
5. Optimise bundle sizes
6. Add responsive images to blog posts

### Sprint 3: SEO & Schema (1-2 days)
1. Create shared `<SEOHead>` component (OG + Twitter tags)
2. Fix duplicate titles on auth pages
3. Add canonical URLs to missing pages
4. Fix meta description lengths
5. Add FAQPage and Person schema improvements

### Sprint 4: Accessibility (0.5 days)
1. Add aria-labels to duplicate landmarks
2. Fix colour contrast on error states

### Sprint 5: Content & E-E-A-T (ongoing)
1. Create `<AuthorBio>` component
2. Add published/updated dates to docs
3. Rewrite content for readability (priority: homepage, services, about)
4. Add definition blocks and FAQ sections for AEO
5. Add citations and first-hand experience language
6. Reduce CTAs on heavy pages

---

## Testing Plan

1. **Security:** Re-run Kritano audit after each fix, verify headers with `curl -I`
2. **Performance:** Lighthouse before/after, Chrome DevTools Core Web Vitals
3. **SEO:** Validate meta tags in devtools, test OG with social media debuggers
4. **Accessibility:** axe-core scan, screen reader landmark verification
5. **Content:** Re-run audit to track readability score changes
6. **Regression:** Full audit re-run after all fixes to compare overall score
