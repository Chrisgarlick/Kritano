# Kritano.com Audit Fixes -- Implementation Plan

**Based on:** kritano-audit-findings.md (29 Apr 2026)
**Current Score:** 75/100
**Target Score:** 90+/100

## Score Snapshot

| Category | Current | Target |
|----------|---------|--------|
| SEO | 86 | 92+ |
| Accessibility | 41 | 80+ |
| Security | 98 | 98 |
| Performance | 91 | 91 |
| Content | 57 | 65+ |
| Schema | 91 | 91 |

---

## Priority 1: SSR Arbitrary CSS Classes Not Compiled (touch targets still broken)

**Impact:** Clears ~326 accessibility instances on blog SSR pages
**Effort:** Deploy -- fix already applied locally

**Root cause found:** The SSR HTML uses Tailwind arbitrary value classes like `min-h-[44px]`, `w-[72px]`, `leading-[28px]`, `hover:text-[#0A66C2]` etc. These were NOT compiled into the Vite-built CSS (`/assets/index-*.css`) because Tailwind only scans the React client source files, not the server SSR service.

**Fix applied:** Added inline `<style>` definitions for all arbitrary/JIT classes used by the SSR templates directly in `blog-ssr.service.ts`. This ensures sizing, focus states, and color overrides work regardless of what's in the Vite CSS.

**Action:** Push and deploy `server/src/services/blog-ssr.service.ts`

---

## Priority 2: Color Contrast -- indigo-500 on white (SERIOUS, 99 instances)

**Problem:** `#6366f1` (indigo-500) on `#ffffff` = 4.46:1 ratio. WCAG AA requires 4.5:1 for normal text.

**Fix:** Replace `text-indigo-500` with `text-indigo-600` (`#4f46e5`, 5.67:1 ratio) on white backgrounds.

**Scope:** SPA pages only -- homepage, pricing, docs, services. NOT blog SSR pages.

**Search pattern:**
```
text-indigo-500
```

Only change when used as foreground text on white/light backgrounds. Do NOT change `bg-indigo-500`, `border-indigo-500`, `ring-indigo-500`, or uses on dark backgrounds.

**Files to check:**
- `client/src/components/layout/PublicLayout.tsx`
- `client/src/pages/pricing/*.tsx`
- `client/src/pages/home/*.tsx` or `client/src/pages/LandingPage.tsx`
- `client/src/pages/docs/*.tsx`
- `client/src/pages/services/*.tsx`
- `client/src/components/layout/Footer.tsx`

**Expected impact:** Accessibility +15-20 points

---

## Priority 3: SPA Touch Targets (SERIOUS, remaining instances)

**Problem:** The SPA's nav and footer links have the same touch target issue as the SSR pages -- 17px height on links.

**Fix:** Add `min-h-[44px]` and padding to interactive elements in the SPA's shared layout.

**Files to change:**
- `client/src/components/layout/PublicLayout.tsx` -- main nav links, footer links
- Any shared Footer component

**Pattern for nav links:**
```tsx
// Before
<a href="/about" className="hover:text-slate-900">About</a>

// After
<a href="/about" className="hover:text-slate-900 py-2 px-3 min-h-[44px] inline-flex items-center">About</a>
```

**Pattern for footer links:**
```tsx
// Before
<a href="/pricing" className="hover:text-slate-900">Pricing</a>

// After
<a href="/pricing" className="hover:text-slate-900 inline-block py-1.5">Pricing</a>
```

**Expected impact:** Clears remaining touch target findings on SPA pages

---

## Priority 4: Blog Listing SEO (titles, descriptions, thin content)

### 4a. Title Too Short (MODERATE, 21 pages)

SSR tag/category listing pages generate titles like `#seo - Blog | Kritano` (17 chars).

**Fix in `server/src/services/blog-ssr.service.ts` `renderBlogListing()`:**

```typescript
// Tags
title = `Articles Tagged "${tag}" -- SEO, Accessibility & Web Performance | Kritano`
// Categories
title = `${CATEGORY_LABELS[category]} Articles -- Insights & Guides | Kritano`
// Main blog
title = `Blog -- SEO, Accessibility, Security & Performance Insights | Kritano`
```

### 4b. Meta Description Too Short (MINOR, 22 pages)

Same pages have short descriptions like `Articles tagged with "seo" from the Kritano blog.`

**Fix:** Generate longer descriptions:
```typescript
// Tags
description = `Browse articles about ${tag}. Expert insights on web auditing, WCAG compliance, and site optimisation from the Kritano team.`
// Categories
description = `Read our ${label} articles. Practical guides, expert analysis, and actionable tips from the Kritano auditing platform.`
```

### 4c. Thin Content on Listing Pages (SERIOUS, 28 pages)

Tag/category pages only have post cards, no introductory text.

**Fix:** Add a contextual intro paragraph above the post grid in `renderBlogListing()`. Include the tag/category name and a 2-3 sentence description of what readers will find.

**Expected impact:** SEO +4-6 points

---

## Priority 5: Duplicate Landmarks (MODERATE, 5 instances)

**Problem:** Docs pages have multiple `<nav>` elements without unique `aria-label`.

**Fix:** Add distinct `aria-label` to each nav:
- Main nav: `aria-label="Main navigation"` (may already have this)
- Sidebar: `aria-label="Documentation sidebar"`
- Footer: `aria-label="Footer navigation"`

**Files:** Docs layout component(s) in `client/src/pages/docs/`

---

## Priority 6: Missing Canonicals (MODERATE, 4 pages)

**Pages:** `/faq`, `/app`, `/author/chris-garlick`, `/waitlist`

**Fix:** Add `<PageSeo>` or `<Helmet>` with canonical URL to each page component.

**Files:**
- `client/src/pages/FaqPage.tsx`
- `client/src/pages/app/*.tsx` (dashboard entry)
- `client/src/pages/AuthorPage.tsx`
- `client/src/pages/WaitlistPage.tsx`

---

## Priority 7: Broken Link (SERIOUS, 2 pages)

Internal link to `https://kritano.com/blog/website-launch-checklist` returns 404.

**Fix:** Either:
- Publish the "Website Launch Checklist" blog post (if it exists as a draft)
- Or remove/update the link in the blog post "The State of Web Accessibility in 2026"

---

## Priority 8: Empty Table Header (MINOR, 1 instance)

**Page:** `/blog/the-complete-guide-to-website-audits`

**Fix:** Check the blog post content for a markdown table with an empty header cell. Either add header text or restructure the table.

---

## Not Actionable (Code)

These are content/editorial items, not code fixes:
- **Poor Readability** (22 pages) -- simplify language on docs/services pages
- **Academic Reading Level** (22 pages) -- same pages, overlapping issue
- **Excessive Sentence Length** (26 pages) -- editorial
- **Low Content-to-HTML Ratio** (40 pages) -- mostly thin listing pages, addressed in 4c
- **Third-Party Cookie Missing Secure Flag** (23 pages) -- GA `_ga` cookie, Google controls this
- **Render-Blocking CSS** (54 pages) -- the main Vite CSS file, standard for SPAs
- **Unverifiable Links** (26 pages) -- LinkedIn returns 999 to bots, link is valid

---

## Implementation Order

| Step | Fix | Issues Cleared | Score Impact |
|------|-----|---------------|--------------|
| 1 | Deploy SSR fixes (push + deploy) | ~326 a11y + ~54 perf | A11y: 41 -> 55 |
| 2 | Color contrast (indigo-500 -> 600) | ~99 a11y | A11y: 55 -> 72 |
| 3 | SPA touch targets | remaining a11y | A11y: 72 -> 80+ |
| 4 | Blog listing SEO (titles/desc/intros) | ~70 SEO | SEO: 86 -> 92 |
| 5 | Duplicate landmarks on docs | 5 a11y | A11y: +1-2 |
| 6 | Missing canonicals | 4 SEO | SEO: +1 |
| 7 | Fix broken link | 2 SEO | SEO: +1 |

Steps 1-3 are the highest leverage -- they should lift the overall score from 75 to ~85+.
