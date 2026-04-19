<!-- Version: 1 | Department: seo | Updated: 2026-04-19 -->

# Technical SEO Requirements - Kritano

## Current State Assessment

**What's in place:**
- robots.txt (correctly configured, disallows /app/, /admin, /api/)
- PageSeo.tsx component handling meta tags, OG, Twitter Cards
- JSON-LD structured data on homepage (WebApplication + WebSite)
- Canonical URL support
- Noindex on protected pages

**What's missing (priority order):**

---

## 1. Sitemap XML (CRITICAL - P0)

robots.txt references `https://kritano.com/sitemap.xml` but no sitemap exists.

**Requirements:**
- Auto-generate sitemap.xml including all public pages
- Include: homepage, pricing, all blog posts, any feature/landing pages
- Exclude: /app/*, /admin/*, /api/*, auth pages
- Include `<lastmod>` dates based on content update timestamps
- Include `<priority>` values: homepage 1.0, pricing 0.9, pillar pages 0.8, blog posts 0.7
- Include `<changefreq>`: homepage weekly, blog monthly, pricing monthly
- Submit to Google Search Console after generation
- Regenerate automatically when new blog posts are published

**Implementation:** Server-side route at `/sitemap.xml` that dynamically builds the XML from the blog content directory and known static pages.

---

## 2. Structured Data Expansion (HIGH - P1)

### Organization Schema (homepage - missing)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Kritano",
  "url": "https://kritano.com",
  "logo": "https://kritano.com/brand/logo.png",
  "description": "Website intelligence platform that audits SEO, accessibility, security, performance, content quality and structured data.",
  "sameAs": [
    "https://x.com/kritanoapp",
    "https://www.linkedin.com/company/kritano"
  ]
}
```

### Article Schema (every blog post - missing)
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[Post Title]",
  "author": {
    "@type": "Person",
    "name": "Chris Garlick"
  },
  "datePublished": "[YYYY-MM-DD]",
  "dateModified": "[YYYY-MM-DD]",
  "publisher": {
    "@type": "Organization",
    "name": "Kritano",
    "logo": {
      "@type": "ImageObject",
      "url": "https://kritano.com/brand/logo.png"
    }
  },
  "mainEntityOfPage": "[canonical URL]",
  "image": "[featured image URL]"
}
```

### FAQPage Schema (pricing page + blog posts with FAQ sections)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[Question text]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Answer text]"
      }
    }
  ]
}
```

### BreadcrumbList Schema (all pages)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://kritano.com" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://kritano.com/blog" },
    { "@type": "ListItem", "position": 3, "name": "[Post Title]" }
  ]
}
```

---

## 3. Core Web Vitals Targets

Kritano audits CWV for clients. Its own site must pass:

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP (Largest Contentful Paint) | < 2.5s | Homepage, pricing, blog pages |
| INP (Interaction to Next Paint) | < 150ms (new 2026 threshold) | All interactive pages |
| CLS (Cumulative Layout Shift) | < 0.1 | All pages |

**Actions:**
- Preload critical fonts (Instrument Serif, Outfit)
- Lazy-load images below the fold
- Use WebP format for all images
- Minimise render-blocking CSS/JS
- Server-side render or pre-render all public marketing pages
- Set proper cache headers for static assets (1 year for hashed assets)

---

## 4. Performance Requirements

- **SSR or SSG for all public pages** - client-side-only rendering is invisible to crawlers
- **Blog pages must be server-rendered** with full HTML content in the initial response
- **Compress all images** - WebP preferred, fallback to optimised JPEG/PNG
- **Font optimisation** - `font-display: swap`, preload critical fonts, subset where possible
- **Bundle splitting** - separate vendor, framework, and application code
- **Critical CSS inlined** in the `<head>` for above-the-fold content

---

## 5. Mobile-First Requirements

Google uses mobile-first indexing. Every public page must:

- [ ] Responsive at all breakpoints (320px to 1440px+)
- [ ] Touch-friendly tap targets (minimum 48x48px)
- [ ] No horizontal scroll on any viewport
- [ ] Viewport meta tag present: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- [ ] Text readable without zooming (minimum 16px body text)
- [ ] Images resize appropriately (srcset or responsive CSS)

---

## 6. Meta & Open Graph (Partially Implemented)

**Already in place via PageSeo.tsx:**
- og:title, og:description, og:image, og:url, og:type, og:site_name, og:locale
- twitter:card, twitter:site, twitter:creator

**Still needed:**
- [ ] Unique og:image for every blog post (use the /draw skill to generate)
- [ ] og:image dimensions: 1200x630px for optimal display
- [ ] twitter:image:alt text on every card
- [ ] Ensure all og:image URLs are absolute, not relative

---

## 7. Crawlability Checklist

- [ ] robots.txt correctly configured (done)
- [ ] sitemap.xml generated and submitted (MISSING)
- [ ] Canonical URLs on every page (done via PageSeo.tsx)
- [ ] No orphan pages (every page reachable via internal links)
- [ ] No redirect chains (301 redirects only, no chains > 2 hops)
- [ ] 404 page returns proper 404 status code
- [ ] All internal links return 200 status codes
- [ ] Hreflang tags if multi-language (not needed currently)
- [ ] Pagination handled with rel=next/prev or infinite scroll with proper URLs
