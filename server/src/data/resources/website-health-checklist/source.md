# The Website Health Checklist

The 80 checks every website should pass before launch, and quarterly thereafter, organised by the six pillars Kritano audits automatically.

This is the same checklist we built our scanner on. Use it as a manual audit, print it for client kick-offs, or run it against any site you are about to ship.

### Contents

1. SEO
2. Accessibility
3. Security
4. Performance
5. Content quality
6. AI readiness (AEO)
7. Pre-launch and post-launch checks

## How to use this checklist

Each pillar is a section. Each item is either a binary pass/fail or a "review this and decide" prompt. Aim for 100% on the critical sections (Accessibility, Security, SEO basics); flag exceptions and the reason for any deliberate misses.

A check marked **[critical]** means the site should not ship without it. Everything else is a quality bar to clear.

---

## 1. SEO

Crawlability, indexing, structured data, and the technical signals search engines and AI models rely on.

### Indexing and crawl control
- [ ] **[critical]** `robots.txt` exists at the root and does not block production routes that should be indexed.
- [ ] `sitemap.xml` exists, is referenced in `robots.txt`, and lists every canonical URL.
- [ ] `sitemap.xml` returns `200`, is under 50 MB, and has fewer than 50,000 URLs per file.
- [ ] **[critical]** No `noindex` meta tag or `X-Robots-Tag: noindex` header on pages that should rank.
- [ ] Staging and preview environments are blocked at the network layer or with `noindex`, not just `robots.txt`.
- [ ] Google Search Console property is verified and `sitemap.xml` is submitted.

### URLs and metadata
- [ ] **[critical]** Every page has a unique, descriptive `<title>` under 60 characters.
- [ ] Every page has a unique meta description between 120 and 160 characters.
- [ ] Every page has a single `<h1>` that matches user intent for the page.
- [ ] Canonical URLs are set and self-referential where appropriate, absolute where not.
- [ ] URLs are lowercase, hyphenated, and free of tracking parameters in their canonical form.
- [ ] Pagination uses real, crawlable links, not JavaScript-only loaders.

### Structured data and schema
- [ ] **[critical]** Homepage carries `Organization` JSON-LD with `name`, `url`, and `logo`.
- [ ] Article-style pages carry `Article` schema with `headline`, `datePublished`, `author`, and `image`.
- [ ] FAQ-style pages carry `FAQPage` schema, with answers matching visible content exactly.
- [ ] Local-business pages carry `LocalBusiness` schema with NAP (name, address, phone) consistent across the site.
- [ ] Every schema block passes Google's Rich Results Test with no warnings.

## 2. Accessibility

WCAG 2.2 AA is the baseline. These are the checks that catch the failures Kritano sees most often.

### Perceivable
- [ ] **[critical]** All non-decorative images have a meaningful `alt` attribute. Decorative images have `alt=""`.
- [ ] **[critical]** Text contrast meets 4.5:1 for body, 3:1 for large text (18pt+).
- [ ] Video has captions; audio-only content has a transcript.
- [ ] Page works at 400% browser zoom without horizontal scrolling or content loss.
- [ ] Information is not conveyed by colour alone (e.g. error states have an icon or text label too).

### Operable
- [ ] **[critical]** Every interactive element is reachable and operable by keyboard alone.
- [ ] Focus indicator is visible on every focusable element, with 2px minimum thickness and 3:1 contrast against the background.
- [ ] No keyboard traps. `Tab` and `Shift+Tab` move freely through the page.
- [ ] Skip-to-content link is the first focusable element on every page.
- [ ] Tap targets on mobile are at least 24x24 CSS pixels, ideally 44x44.

### Understandable and robust
- [ ] **[critical]** `<html lang="...">` is set on every page.
- [ ] Form fields have associated `<label>` elements (not just placeholders).
- [ ] Error messages identify the field and describe how to fix the problem.
- [ ] ARIA is used to enhance, not replace, native semantics. No `role="button"` on non-buttons that already have `<button>`.
- [ ] Page passes axe-core with zero violations on the homepage and three random deep pages.

## 3. Security

Headers, transport, dependencies, and the boring things that get sites breached.

### Transport and headers
- [ ] **[critical]** Production serves HTTPS only. HTTP requests redirect with `301` to HTTPS.
- [ ] **[critical]** HSTS header is set with `max-age=31536000; includeSubDomains; preload` (after confirming subdomain coverage).
- [ ] `Content-Security-Policy` is set, scoped to known origins, and contains no `unsafe-inline` for scripts.
- [ ] `X-Content-Type-Options: nosniff` is set on every response.
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` (or stricter) is set.
- [ ] `Permissions-Policy` disables features the site does not use (e.g. camera, microphone, geolocation).
- [ ] No mixed content. Every asset loads over HTTPS.

### Authentication and sessions
- [ ] Authentication endpoints are rate limited per IP and per account.
- [ ] Session cookies have `Secure`, `HttpOnly`, and `SameSite=Lax` (or stricter).
- [ ] Passwords are hashed with argon2id, bcrypt, or scrypt. Never SHA-256 alone.
- [ ] Multi-factor authentication is offered for admin accounts.

### Third parties and dependencies
- [ ] No public dependency manifests (`package.json`, `composer.lock`) accessible at the document root.
- [ ] Third-party scripts use Subresource Integrity (`integrity` attribute) where possible.
- [ ] Admin paths (`/wp-admin`, `/admin`, `/.env`) return `404` or `403` from the public site.

## 4. Performance

Core Web Vitals plus the tactical fixes that move them.

### Core Web Vitals (target: pass on 75% of mobile page loads)
- [ ] **[critical]** Largest Contentful Paint (LCP) is under 2.5s on mobile.
- [ ] **[critical]** Interaction to Next Paint (INP) is under 200ms on mobile.
- [ ] **[critical]** Cumulative Layout Shift (CLS) is under 0.1 on mobile.

### Loading and rendering
- [ ] Above-the-fold images use `loading="eager"` and `fetchpriority="high"`. Everything else is `loading="lazy"`.
- [ ] Images are served in modern formats (WebP or AVIF) with appropriate fallbacks.
- [ ] Images have explicit `width` and `height` attributes (or `aspect-ratio` CSS) to prevent layout shift.
- [ ] Fonts are preloaded with `<link rel="preload" as="font">` and use `font-display: swap`.
- [ ] Render-blocking JavaScript is deferred (`defer`) or async (`async`) unless it has a load-order reason.
- [ ] First-party CSS is minified and critical CSS is inlined for above-the-fold content.

### Network and caching
- [ ] Static assets have a 1-year `Cache-Control` with immutable filenames (hashed).
- [ ] HTML responses use `Cache-Control` with sensible `max-age` and `stale-while-revalidate`.
- [ ] HTTP/2 or HTTP/3 is enabled at the edge.
- [ ] A CDN serves static assets from a location close to your audience.

## 5. Content quality

Readability, freshness, and the E-E-A-T signals search engines and AI models weigh.

- [ ] Every public page has clear authorship, either at the page level or via `Organization` schema.
- [ ] Articles show `datePublished` and `dateModified` prominently.
- [ ] Author pages exist for every named byline, with bio, credentials, and links to verified profiles.
- [ ] Average paragraph length is under 4 sentences. Sentences are mostly under 25 words.
- [ ] Reading level (Flesch-Kincaid) is appropriate for the audience: 8th grade for consumer, 10-12th grade for technical.
- [ ] Internal links connect related pages with descriptive anchor text (not "click here").
- [ ] Outbound links to authoritative sources use `rel="noopener"`; affiliate links use `rel="sponsored"`.
- [ ] No broken internal links. Run a crawl and fix every `404` from your own pages.
- [ ] Pages older than 12 months have been reviewed or refreshed in the last quarter.
- [ ] Duplicate content is consolidated with canonical tags or `301`s, not left for search engines to pick a winner.

## 6. AI readiness (AEO)

How a site shows up in AI-generated answers from ChatGPT, Claude, Perplexity, and Gemini.

- [ ] **[critical]** Key facts and definitions appear in the first 100 words of any page that should be cited.
- [ ] Pages answer the obvious question at the top, then expand. Not the other way around.
- [ ] Statistics, prices, and claims have visible sources or citations.
- [ ] Author and organisation are identifiable to a crawler in the HTML (not behind JavaScript).
- [ ] `Organization`, `Person`, and `Article` schema link out via `sameAs` to verified profiles (LinkedIn, Wikipedia, Crunchbase).
- [ ] The site is reachable by common AI crawler user-agents (`GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`) unless deliberately blocked.
- [ ] `llms.txt` exists at the root (optional but increasingly used).
- [ ] Robots-noindex pages are not surfacing in AI answer engines. If they are, tighten the robots controls.

## 7. Pre-launch and post-launch checks

Cross-cutting items that catch the things every pillar misses on its own.

- [ ] **[critical]** A staging or preview environment exists, is gated, and gets the same audit pass before merging to production.
- [ ] Analytics is installed, fires on the homepage, and the test event reaches the dashboard.
- [ ] Cookie consent is shown before any non-essential scripts load. Reject is as easy as accept.
- [ ] Privacy policy, terms of service, and contact details are linked from every page.
- [ ] `Contact-Us` page works. Forms submit. Replies arrive. A test message has been sent end to end.
- [ ] `404` and `500` pages are branded, helpful, and link back to the site.
- [ ] A backup of production data exists, can be restored, and the restore has been tested in the last 90 days.
- [ ] You have a documented rollback plan for the launch.

---

## After you ship

Re-run this checklist every quarter, after any major release, and after any algorithm update (Google core update, browser version change, accessibility law change). The fastest path to keeping it green is to run Kritano against your site on a schedule and have the differences surfaced to you automatically.

Start a free scan at [kritano.com](https://kritano.com).
