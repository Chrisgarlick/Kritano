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
| AEO (CQS) | 51 | 0 | 2 | 4 | 1 | 1 |
| Schema | 63 | 0 | 0 | 1 | 0 | 0 |

---

## Phase 1: CRITICAL & SECURITY -- DONE

### 1.1 Exposed .env File [CRITICAL] -- DONE
- **Fix:** Added dotfile deny rule in nginx (`location ~ /\. { deny all; return 404; }`)
- **Also added:** `.well-known` allowlist so security.txt and ACME challenges still work
- **Script:** `scripts/deploy-security-fixes.sh` automates deployment + verification
- **Still needed:** Rotate ALL secrets in server/.env (DB passwords, API keys, JWT secrets)

### 1.2 Missing Security Headers [SERIOUS - all 29 pages] -- DONE
- **Fix:** Updated `scripts/nginx.conf` with all headers. Key issue was that `add_header` inside `location` blocks overrides parent-level headers -- security headers are now repeated in location blocks that use their own `add_header`.
- **Headers added:** HSTS (with preload), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Content-Security-Policy

### 1.3 Insecure Cookie [SERIOUS - 29 pages] -- WONT FIX
- **Issue:** `_ga_PYQW89W26J` missing Secure flag
- **Why:** This is a Google Analytics cookie set by GA's own JS. The Secure flag should be set automatically when served over HTTPS (which the HTTPS redirect enforces). If the audit still flags it, it may be a scanner timing issue.

### 1.4 CSRF Cookie Missing HttpOnly [MODERATE - 29 pages] -- WONT FIX (by design)
- **Issue:** `csrf_token` cookie missing HttpOnly flag
- **Why:** The app uses the double-submit cookie pattern (`server/src/middleware/csrf.middleware.ts`). The frontend must read the CSRF token from the cookie to send it in the `x-csrf-token` header. Setting HttpOnly would break CSRF protection entirely. This is a false positive.

### 1.5 Server Version Exposed [MINOR - 29 pages] -- DONE
- **Fix:** Added `server_tokens off;` to nginx config

### 1.6 Missing security.txt [MINOR] -- DONE
- **Fix:** Created `client/public/.well-known/security.txt`
- Deployment script copies it into `client/dist/.well-known/` without needing a rebuild

### 1.7 Missing Cache Headers [MODERATE - 29 pages] -- DONE
- **Fix:** Added `Cache-Control: public, max-age=300, stale-while-revalidate=86400` for HTML pages in nginx
- Static assets already had aggressive caching (1 year, immutable)

### 1.8 HTTP/2 [INFO] -- ALREADY HAD IT
- nginx.conf already had `listen 443 ssl http2;`

---

## Phase 2: ACCESSIBILITY -- DONE

### 2.1 Color Contrast Failures [SERIOUS - 275 instances] -- DONE
- **Root Cause:** `#64748b` (slate-500) on `#1e293b` (slate-800) = 3.07:1 ratio (needs 4.5:1)
- **Actual scope was smaller than expected:** Most components already had `dark:text-slate-400` variants. Only two areas needed fixes:
  - `components/docs/CodeBlock.tsx` -- language label + copy button text: `text-slate-500` to `text-slate-400` on bg-slate-900
  - `pages/public/Pricing.tsx` -- popular plan card (bg-slate-900): `text-slate-500` to `text-slate-300` on 3 elements (description, price detail, pages/audit label)

### 2.2 Links Not Distinguishable Without Color [SERIOUS - 32 pages] -- DONE
- **Root Cause:** Links used indigo-600 against slate-500 text with only 1.32:1 contrast and no underline
- **Fix applied per-component** (not global CSS, to preserve nav/button link styling):
  - `pages/public/Privacy.tsx` -- changed `prose-a:no-underline hover:prose-a:underline` to persistent `prose-a:underline` with decoration styling
  - `pages/public/Terms.tsx` -- same
  - `components/cms/BlockDisplay.tsx` -- added `prose-a:underline` for all blog/CMS prose content
  - `pages/docs/DocsOverviewPage.tsx` -- inline link: `hover:underline` to persistent `underline`
  - `pages/docs/DocsEndpointsPage.tsx` -- same
  - `pages/docs/DocsAuthPage.tsx` -- same
  - `components/layout/PublicLayout.tsx` -- all footer links: added `underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2`

### 2.3 Scrollable Region Keyboard Access [SERIOUS - 4 pages] -- DONE
- `components/docs/CodeBlock.tsx` -- added `tabIndex={0} role="region" aria-label` to `<pre>` element
- `pages/docs/DocsObjectsPage.tsx` -- added `tabIndex={0} role="region" aria-label="Object fields"` to scrollable table wrapper

### 2.4 Content Not in Landmarks [MODERATE - 24 pages] -- DONE
- **Root Cause:** Auth pages used bare `<div>` wrappers with no `<main>` landmark
- **Fix:** Changed outermost `<div>` to `<main>` on all 9 auth pages:
  - ForgotPassword, Login, Register, ResetPassword, VerifyEmail, OAuthCallback, GscCallback, RegisterSuccess, EarlyAccessSuccess
- PublicLayout, SettingsLayout, DashboardLayout already had proper `<main>` landmarks

### 2.5 Heading Hierarchy [MODERATE - 7 pages] -- DONE
- `pages/docs/DocsEndpointsPage.tsx` -- all `<h4>` changed to `<h3>` (was skipping h3 level under h2 sections)
- `pages/docs/DocsOverviewPage.tsx` -- quick-start cards `<h3>` changed to `<h2>` (appeared before first h2, breaking hierarchy)

### 2.6 Image Alt Text Duplicates Surrounding Text [MINOR - 44 instances] -- TODO
- **Affected:** Docs, blog, services, about, homepage, privacy, terms, pricing
- **Root Cause:** Images with alt text that repeats the adjacent heading/link text (e.g. Kritano logo next to "Kritano" text)
- **Fix:** Change alt text to describe the image content, or use `alt="" role="presentation"` for decorative images

---

## Phase 3: PERFORMANCE -- TODO

### 3.1 Slow Server Response - 10.8s average [SERIOUS - 29 pages]
- **Target:** < 1500ms
- **Partially addressed:** Cache headers added in Phase 1 should help repeat visits
- **Investigation needed:**
  - Is this the React SPA bundle download time or actual server latency?
  - Check server resource constraints (CPU/memory)
- **Remaining fixes:**
  - Consider CDN (Cloudflare) for static assets
  - Code-split the JS bundle (see 3.4)
  - Server-side: check Express middleware chain for bottlenecks

### 3.2 CLS (Cumulative Layout Shift) [SERIOUS - 2 blog pages]
- **Score:** 0.444 (target < 0.1)
- **Affected:** Blog post pages
- **Root cause:** Images without dimensions + late-loading content
- **Fix:** Add explicit width/height to all `<img>` tags in blog components
- **Files:** `client/src/pages/blog/PostListPage.tsx`, `client/src/pages/blog/PostDetailPage.tsx`

### 3.3 Render-Blocking CSS (Google Fonts) [MODERATE - 29 pages]
- **File:** `client/index.html`
- **Note:** `&display=swap` is already present in the font URLs
- **Remaining fix:** Consider self-hosting fonts to eliminate the render-blocking external request entirely, or use `<link rel="preload" as="style" onload="this.rel='stylesheet'">` pattern

### 3.4 Large Page Size - 1.1MB [MODERATE - 29 pages]
- **Investigation:** Run `npx vite-bundle-visualizer` to identify heavy dependencies
- **Fixes:**
  - Code-split routes with React.lazy + Suspense
  - Tree-shake unused dependencies
  - Compress blog images to WebP

### 3.5 Image Optimisation [MODERATE]
- **Large image:** `1_1.png` at 551.5KB on blog pages
- **Missing dimensions:** 6 blog images lack width/height attributes
- **Missing responsive images:** Blog images lack srcset attribute
- **Fix:** Convert blog images to WebP, add width/height + srcset to `<img>` tags
- **Files:** `client/src/pages/blog/PostListPage.tsx`, `client/src/pages/blog/PostDetailPage.tsx`

### 3.6 Render-Blocking Script [MODERATE - 29 pages]
- **Issue:** Main JS bundle `/assets/index-B4hOj9W6.js` blocks rendering
- **Fix:** Vite already outputs with `type="module"` which defers by default. The real fix is code-splitting (3.4) to reduce initial bundle size.

### 3.7 LCP Needs Improvement [MODERATE - 6 pages]
- **LCP:** 3168ms (target < 2500ms)
- **Affected:** Services, blog list, blog posts, docs/endpoints
- **Fix:** Preload key resources, optimize images, reduce server response time (addresses multiple issues)

### 3.8 Google Fonts Missing display=swap [MINOR - 29 pages] -- ALREADY FIXED
- `client/index.html` already has `&display=swap` in the Google Fonts URL

### 3.9 Missing Responsive Images [MINOR - 1 page]
- **Fix:** Add srcset and sizes attributes to blog listing images

---

## Phase 4: SEO -- TODO

### 4.1 Duplicate Page Titles [SERIOUS]
- **Issue:** "Sign In | Kritano" used on 6 pages
- **Fix:** Give each page a unique title via React Helmet

### 4.2 Duplicate Meta Description [MODERATE]
- **Issue:** Same meta description on all 29 pages
- **Fix:** Each page needs a unique meta description via Helmet

### 4.3 Missing Canonical URLs [MODERATE - 6 pages]
- **Affected:** forgot-password, author, FAQ, settings/profile, waitlist, settings/api-keys
- **Fix:** Add `<link rel="canonical">` via Helmet on these pages

### 4.4 Title Length Issues [MODERATE]
- **Too short (16 pages):** Expand titles to 30-60 characters
- **Too long (2 pages):** Shorten pricing and homepage titles to under 60 characters

### 4.5 Non-Self-Referencing Canonical [INFO - 4 pages]
- **Affected:** register, blog?category=aeo, pricing, blog?category=guides
- **Fix:** Ensure canonical URLs point to the page itself, or confirm this is intentional for duplicate content

### 4.6 Empty Image Alt Text [MINOR - 4 blog pages]
- **Fix:** Add descriptive alt text to blog listing images, or `role="presentation"` if decorative

### 4.7 Heading Hierarchy [MINOR - 2 docs pages] -- DONE (covered in Phase 2)

### 4.8 No Structured Data [INFO - 14 pages]
- **Fix:** Add JSON-LD structured data:
  - Homepage: Organization schema (with description field -- also fixes Schema 6.1)
  - Blog posts: Article schema (may already exist)
  - Pricing: Product schema (with description -- fixes Schema 6.1)
  - FAQ: FAQPage schema (also helps AEO)
  - About: Organization schema (with description -- fixes Schema 6.1)
  - Docs: TechArticle schema

### 4.9 Page Marked as Noindex [INFO - 6 pages]
- **Affected:** settings/profile, settings/api-keys, FAQ, author, waitlist, forgot-password
- **Assessment:** Settings and forgot-password pages should be noindex. FAQ and author pages may benefit from being indexed -- review intentionality.

---

## Phase 5: CONTENT -- TODO

### 5.1 Poor Readability [SERIOUS - 26 pages]
- **Score:** 32/100, grade-20 reading level
- **Fix:** Rewrite copy on key user-facing pages to target grade 7-9:
  - Priority: Homepage, pricing, services, about, contact
  - Lower priority: Docs pages (technical audience, higher reading level acceptable)

### 5.2 Thin Content [SERIOUS - 3 pages + 11 SEO-flagged]
- **Under 300 words:** Pricing, homepage, services (content category)
- **Under 300 words (SEO):** Waitlist, contact, FAQ, settings, blog categories, forgot-password, register, author
- **Fix:** Add substantive content to user-facing pages. For pricing, add FAQ. For homepage, expand value propositions.

### 5.3 Wall of Text [SERIOUS - 2 docs pages]
- **Affected:** docs/objects, docs/endpoints
- **Fix:** Add H2/H3 subheadings every 300-400 words to break up long sections

### 5.4 Academic Reading Level [MODERATE - 26 pages]
- **Issue:** Content requires college-level reading ability (grade 20)
- **Fix:** Same as 5.1 -- simplify sentence structure and vocabulary

### 5.5 High Vocabulary Complexity [MODERATE - 24 pages]
- **Issue:** Average word complexity 2.13 syllables/word
- **Fix:** Replace complex words with simpler alternatives on marketing/public pages

### 5.6 Low Content-to-HTML Ratio [MODERATE - 21 pages]
- **Fix:** Increase substantive content relative to HTML markup. Overlaps with 5.2 (thin content).

### 5.7 Excessive Sentence Length [MODERATE - 21 pages]
- **Issue:** Multiple sentences with 35+ words
- **Fix:** Break long sentences into shorter ones (target 15-20 words average)

### 5.8 Short Content [MODERATE - 9 pages]
- **Affected:** Services sub-pages, docs overview, docs errors/auth/rate-limits, about
- **Fix:** Expand content to cover topics more thoroughly (target 500+ words for service pages)

### 5.9 Missing CTAs [MODERATE - 6 pages]
- **Affected:** Author, API keys, forgot-password, FAQ, waitlist, profile
- **Fix:** Add relevant CTAs ("Start your free audit", "View pricing", etc.)

### 5.10 Keyword Missing from Introduction [MODERATE - 2 blog pages]
- **Affected:** Both blog posts
- **Fix:** Mention target keyword naturally in the first paragraph

### 5.11 Keyword Missing from Meta Description [MODERATE - 2 blog pages]
- **Fix:** Include target keyword in meta description

### 5.12 Moderate Readability [MODERATE - 2 pages]
- **Affected:** AEO blog post, terms page
- **Fix:** Simplify some sentences and use more common vocabulary

---

## Phase 6: AEO (Answer Engine Optimisation) -- TODO

### 6.1 AI Ignored -- Low Citability [SERIOUS - 29 pages]
- **AEO Score:** 15/100
- **Fix:** This is a compound issue. Addressing the items below will improve citability across all pages:
  - Add definition blocks, summaries, FAQ sections, factual data points
  - Add author authority signals (sameAs links)

### 6.2 Low Factual Density [SERIOUS - 26 pages]
- **Issue:** Few numbers, entities, or verifiable claims
- **Fix:** Add specific statistics, research data, named sources, and date-stamped information to content pages
- **Priority pages:** Homepage, services, about, blog posts

### 6.3 No Definition Blocks [SERIOUS - 12 pages]
- **Affected:** About, docs pages, services pages, privacy
- **Fix:** Add clear definition paragraphs ("X is a...", "X refers to...") to make content citable by AI
- **Examples:**
  - About: "Kritano is a web accessibility auditing platform that..."
  - Services/Accessibility: "Web accessibility is the practice of..."
  - Services/SEO: "Search engine optimisation (SEO) is..."

### 6.4 No Author sameAs Links [MODERATE - 29 pages]
- **Fix:** Add `sameAs` property to JSON-LD Person schema linking to LinkedIn, Twitter/X profiles
- **Implementation:** Add to the site-wide Organization schema or per-page Article schema

### 6.5 No FAQ Section [MODERATE - 25 pages]
- **Fix:** Add question-based H2/H3 headings ("What is...?", "How does...?") or implement FAQPage schema
- **Priority pages:**
  - FAQ page (already has Q&A but may need FAQPage schema)
  - Pricing (add "Frequently Asked Questions" section)
  - Services pages (add "Common questions about [service]")
  - Homepage (add brief FAQ section)

### 6.6 No Verifiable Claims [MODERATE - 15 pages]
- **Fix:** Combine data points with source attributions, e.g. "According to WebAIM, 96.3% of home pages have detectable WCAG failures"
- **Priority:** Blog posts, services pages, about page

### 6.7 No Summary Statements [MODERATE - 14 pages]
- **Fix:** Add "Key takeaway", "In summary", or "TL;DR" sections to docs and service pages

### 6.8 No Citation-Friendly Schema [MINOR - 28 pages]
- **Fix:** Implement FAQPage, HowTo, or ClaimReview schema markup
- **Overlaps with:** SEO 4.8 (structured data) and AEO 6.5 (FAQ sections)

### 6.9 No Semantic Citation Markup [INFO - 7 pages]
- **Affected:** Blog posts, privacy, terms, docs
- **Fix:** Use `<cite>` tags for source names and `<blockquote cite="URL">` for quoted content

---

## Phase 7: SCHEMA -- TODO

### 7.1 Missing Recommended Fields [MODERATE - 3 pages]
- **Issue:** WebSite schema missing `description` field
- **Affected:** Pricing, about, homepage
- **Fix:** Add `description` field to the existing WebSite JSON-LD schema on these pages

---

## Implementation Order (Updated)

| Step | Task | Status | Est. Impact |
|------|------|--------|-------------|
| 1 | Block .env in nginx + deploy security headers | DONE | Security +30 |
| 2 | server_tokens off, security.txt, cache headers | DONE | Security +5, Perf +3 |
| 3 | Color contrast fixes (Pricing + CodeBlock) | DONE | A11y +15 |
| 4 | Link underlines for distinguishability | DONE | A11y +5 |
| 5 | Scrollable code blocks (tabIndex, role) | DONE | A11y +3 |
| 6 | Landmark wrappers (auth pages) + heading hierarchy | DONE | A11y +3 |
| 7 | Image alt text deduplication | TODO | A11y +2 |
| 8 | Image dimensions + WebP conversion (CLS fix) | TODO | Perf +8 |
| 9 | Bundle analysis + code-splitting | TODO | Perf +5 |
| 10 | Self-host fonts (remove render-blocking CSS) | TODO | Perf +3 |
| 11 | Unique page titles + meta descriptions | TODO | SEO +5 |
| 12 | Canonical URLs + structured data (JSON-LD) | TODO | SEO +3, Schema +5 |
| 13 | FAQPage schema on FAQ + pricing | TODO | SEO +2, AEO +5 |
| 14 | Author sameAs links in JSON-LD | TODO | AEO +3 |
| 15 | Definition blocks on services + about | TODO | AEO +5 |
| 16 | Summary statements + factual density | TODO | AEO +5 |
| 17 | Rewrite content for readability (grade 7-9) | TODO | Content +10 |
| 18 | Expand thin pages + add CTAs | TODO | Content +5 |
| 19 | Blog keyword optimisation (intro + meta) | TODO | Content +2 |
| 20 | Server response time investigation + CDN | TODO | Perf +10 |

---

## Critical Files Summary

| File | Changes | Status |
|------|---------|--------|
| `scripts/nginx.conf` | Dotfile blocking, CSP, Permissions-Policy, server_tokens off, cache headers | DONE |
| `scripts/deploy-security-fixes.sh` | Automated deployment + verification script | DONE |
| `client/public/.well-known/security.txt` | Security disclosure policy | DONE |
| `client/src/components/docs/CodeBlock.tsx` | Contrast fix, scrollable region a11y | DONE |
| `client/src/pages/public/Pricing.tsx` | Contrast fix on popular plan | DONE |
| `client/src/pages/docs/DocsEndpointsPage.tsx` | Heading hierarchy (h4 to h3), link underline | DONE |
| `client/src/pages/docs/DocsOverviewPage.tsx` | Heading hierarchy (h3 to h2), link underline | DONE |
| `client/src/pages/docs/DocsObjectsPage.tsx` | Scrollable table a11y | DONE |
| `client/src/pages/docs/DocsAuthPage.tsx` | Link underline | DONE |
| `client/src/pages/public/Privacy.tsx` | Link underlines (prose) | DONE |
| `client/src/pages/public/Terms.tsx` | Link underlines (prose) | DONE |
| `client/src/components/cms/BlockDisplay.tsx` | Link underlines (blog prose) | DONE |
| `client/src/components/layout/PublicLayout.tsx` | Footer link underlines | DONE |
| `client/src/pages/auth/*.tsx` (9 files) | Added `<main>` landmark | DONE |
| `client/src/pages/blog/PostListPage.tsx` | Image dimensions, alt text, srcset | TODO |
| `client/src/pages/blog/PostDetailPage.tsx` | Image dimensions, CLS fix | TODO |
| `client/index.html` | Self-host fonts (if pursued) | TODO |
| All page components | Unique titles, meta descriptions, canonical URLs | TODO |
| All service/about pages | Definition blocks, summaries, readability | TODO |
| Site-wide JSON-LD | Organization, FAQPage, Article, sameAs schemas | TODO |

---

## Testing Plan

1. **After each phase:** Re-run Kritano audit to measure score improvement
2. **Accessibility:** Test with keyboard navigation + screen reader (VoiceOver)
3. **Contrast:** Use browser DevTools contrast checker on modified elements
4. **Security headers:** Verify with `curl -I https://kritano.com` (automated in deploy script)
5. **Performance:** Run Lighthouse before/after
6. **SEO:** Validate structured data with Google Rich Results Test
7. **AEO:** Re-run CQS audit after adding definition blocks and schemas
