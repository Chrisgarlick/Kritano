# SEO & AEO Status Report

Last updated: 2026-04-10

---

## What's Done

### Technical SEO
- [x] H1/title/URL alignment across all public pages
- [x] PageSeo component on every page with title, description, canonical URL
- [x] Open Graph tags (title, description, image, type, locale, site_name)
- [x] Twitter Card tags with @kritanoapp handle
- [x] SEO admin override system enabled by default
- [x] robots.txt properly configured (blocks app routes, allows public)
- [x] Static sitemap with all pages including service detail pages and author page
- [x] Dynamic blog sitemap at /api/blog/sitemap.xml
- [x] Pre-rendering middleware for bot user agents (Puppeteer, cached 1hr)
- [x] Consistent semantic HTML structure (no duplicate labels, proper heading hierarchy)
- [x] Code splitting and lazy loading for performance
- [x] Font preconnect hints
- [x] Image lazy loading on non-critical images
- [x] RSS/Atom feed at `/api/blog/feed.xml` with `<link rel="alternate">` discovery tag on all public pages
- [x] Semantic `<time datetime>` elements on blog posts, Terms, and Privacy
- [x] `rel="next/prev"` on paginated blog list pages
- [x] Image alt text audit -- all public images have descriptive alt or are correctly decorative

### Structured Data (JSON-LD)
- [x] Home: WebApplication + WebSite with SearchAction
- [x] About: Organization (logo, founder, sameAs, contactPoint) + Person (Chris Garlick with expertise) + BreadcrumbList
- [x] Author page: Person (sameAs social links, knowsAbout, worksFor) + BreadcrumbList
- [x] Services: ItemList with Service objects + BreadcrumbList
- [x] Service detail pages: Service + BreadcrumbList (3-level)
- [x] Pricing: Product with Offers + FAQPage (9 questions) + BreadcrumbList
- [x] FAQ: FAQPage (24 questions across 4 categories) + BreadcrumbList
- [x] Contact: ContactPage + BreadcrumbList
- [x] Blog list: Blog + BreadcrumbList
- [x] Blog posts: Article + BreadcrumbList (3-level) -- always present
- [x] Blog posts: HowTo schema (auto-parsed from headings when schema_type = howto)
- [x] Blog posts: FAQPage schema (auto-parsed from headings ending in ? when schema_type = faq)
- [x] Blog posts: ClaimReview schema (with claim text + rating when schema_type = claim_review)
- [x] Blog posts: VideoObject schema (auto-detected from embed blocks)
- [x] Schema type dropdown in blog admin editor sidebar
- [x] Waitlist: WebPage

### AI Citation (AEO)
- [x] llms.txt with comprehensive product description, CQS breakdown, E-E-A-T tiers, AEO explanation, pricing, blog categories
- [x] Pre-rendering ensures AI crawlers (GPTBot, Claude, Perplexity) see full rendered HTML
- [x] Person schema establishes Chris Garlick as domain expert (knowsAbout: SEO, WCAG, Security, Performance, Content Quality, AEO)
- [x] Organization schema with founder, contact, social links
- [x] FAQ content highly citable (24 question/answer pairs with schema)
- [x] Blog Article schema includes publisher, author, dates, section, keywords
- [x] Dedicated author page at `/author/chris-garlick` with Person schema and sameAs social links

### E-E-A-T Signals
- [x] Founder identified by name with Person schema and expertise areas
- [x] Organization schema with founding date, contact point, social profiles
- [x] Author attribution on all blog posts with link to dedicated author page
- [x] Dedicated author page (`/author/chris-garlick`) with bio, expertise areas, and article archive
- [x] Contact page with business email
- [x] Privacy policy and terms of service pages with semantic date elements
- [x] GDPR compliance (data export, deletion)

### Blog Featured Images
- [x] `/blog` skill auto-generates a 16:9 (1920x1080) featured image via `/draw` skill
- [x] `/draw` skill supports `wide` format alongside existing `square` (1:1)
- [x] Category-aware colour accents (indigo for SEO, emerald for Accessibility, etc.)

### Performance Hints
- [x] `rel="preload"` for Google Fonts CSS and nav logo SVG in `index.html`
- [x] `fetchPriority="high"` on nav logo (above fold on every page) and blog post featured images
- [x] `rel="prefetch"` for /services, /pricing, /blog when on the homepage

---

## Architecture Notes

### Pre-rendering
- Middleware at `server/src/middleware/prerender.middleware.ts`
- Service at `server/src/services/prerender.service.ts`
- Uses Puppeteer with headless Chrome
- In-memory cache, 1hr TTL, max 200 pages
- Configurable via `PRERENDER_CACHE_TTL` and `PRERENDER_MAX_CACHE` env vars
- Bot list covers: Google, Bing, Yahoo, DuckDuckGo, Baidu, Yandex, GPTBot, ChatGPT, Claude, Perplexity, Cohere, Meta, Facebook, Twitter, LinkedIn, Slack, Discord, WhatsApp, Telegram, Semrush, Ahrefs, Moz

### SEO Override System
- Admin panel at /admin/seo lets you override title, description, keywords, OG tags, structured data per route
- Stored in `page_seo` database table
- Frontend fetches all overrides on app load via `useSeoOverrides` hook (5-min cache)
- `PageSeo` component merges overrides on top of page defaults (enabled by default)

### Structured Data
- `PageSeo` component supports single object or array of JSON-LD objects
- Each page can output multiple schema types (e.g., Service + BreadcrumbList)
- Blog posts use `buildBlogStructuredData()` utility (`client/src/utils/blogSchemaBuilder.ts`) to generate schema based on `schema_type` column
- Schema type selectable per post in admin editor (Article, HowTo, FAQ, ClaimReview)

### llms.txt
- Located at `client/public/llms.txt`
- Served as static file
- Covers: product description, services, CQS methodology, E-E-A-T tiers, AEO explanation, pricing, blog categories, dynamic content URLs

### Blog Schema Enhancements
- See `/docs/DONE_blog-schema-enhancements.md` for full implementation details
- Migration: `104_blog_schema_type.sql`
- New columns: `schema_type`, `schema_claim_reviewed`, `schema_review_rating`

---

## Quick Reference: Page SEO Summary

| Page | H1 | Schema Types | Breadcrumb |
|------|----|-------------|------------|
| `/` | Website Auditing Platform | WebApplication, WebSite+SearchAction | No (homepage) |
| `/about` | About Kritano | Organization, Person, BreadcrumbList | Yes |
| `/author/chris-garlick` | Chris Garlick | Person, BreadcrumbList | Yes |
| `/services` | Website Auditing Services | ItemList+Service, BreadcrumbList | Yes |
| `/services/:slug` | {Service Title} | Service, BreadcrumbList (3-level) | Yes |
| `/pricing` | Pricing | Product+Offers, FAQPage, BreadcrumbList | Yes |
| `/faq` | Frequently Asked Questions | FAQPage, BreadcrumbList | Yes |
| `/contact` | Contact Us | ContactPage, BreadcrumbList | Yes |
| `/blog` | Blog | Blog, BreadcrumbList | Yes |
| `/blog/:slug` | {Post Title} | Article + optional HowTo/FAQPage/ClaimReview/VideoObject, BreadcrumbList (3-level) | Yes |
| `/waitlist` | Join the Waitlist | WebPage | No |
| `/terms` | Terms of Service | None | No |
| `/privacy` | Privacy Policy | None | No |

---

## What's Remaining -- All Manual (Chris To Do)

All code/technical SEO work is complete. Everything below requires manual action.

### Do Now (10-15 mins each)

- [ ] **Google Search Console** -- Go to search.google.com/search-console, verify kritano.com (DNS or HTML tag), submit `https://kritano.com/sitemap.xml` and `https://kritano.com/api/blog/sitemap.xml`
- [ ] **Google Business Profile** -- Create at business.google.com if you want a knowledge panel and local signals

### Do Before/At Launch (editorial)

- [ ] **Write 10-15 blog posts** -- Use `/blog [topic]` in Claude Code. Featured images are auto-generated. Suggested first 10:
  1. "What is a Website Audit and Why Does It Matter?" (pillar/guide)
  2. "WCAG 2.2: What Changed and How to Comply" (accessibility)
  3. "Security Headers Every Website Needs in 2026" (security)
  4. "Core Web Vitals: A Practical Guide to LCP, INP, and CLS" (performance)
  5. "E-E-A-T: What Google Really Looks For" (content quality)
  6. "Answer Engine Optimisation: How to Get Cited by AI" (AEO)
  7. "How to Read Your Kritano Audit Report" (product/guide)
  8. "The Content Quality Score Explained" (product/content quality)
  9. "Schema.org Markup: The Complete Guide for 2026" (structured data)
  10. "Website Accessibility Laws: EAA, ADA, and EN 301 549" (accessibility/legal)
- [ ] **Internal linking** -- When writing each post, link to 2-3 other posts and 1-2 service pages. This builds topical clusters.
- [ ] **Upload featured images** -- After `/blog` generates the PNG, upload it via the admin media library and set it as the post's featured image.

### Do After Launch (ongoing marketing)

- [ ] **Backlinks** -- Guest post on web dev/accessibility/SEO blogs, get listed on "best audit tools" roundups, publish original research ("We Audited 1,000 UK Websites"), answer questions on Reddit/Stack Overflow/X with links to blog posts
- [ ] **Launch PR** -- Product Hunt, Hacker News, relevant subreddits
- [ ] **Topical authority clusters** -- Once you have 5+ posts per pillar, group them with "Related Articles" sections linking within each cluster
- [ ] **AggregateRating schema** -- Add once you have customer reviews (code change needed at that point -- ask Claude)
- [ ] **WebP/AVIF images** -- Convert blog featured images to modern formats for smaller file sizes (can be done via the media library or a build step later)
- [ ] **Monitoring** -- Check GSC weekly for indexing issues, monitor Core Web Vitals, track keyword rankings, search for "Kritano" in ChatGPT/Perplexity to monitor AI citation
