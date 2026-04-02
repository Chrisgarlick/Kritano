# Frontend Accessibility & SEO Improvements — Ultrathink Plan

## Overview

A comprehensive plan to bring Kritano's frontend up to WCAG 2.2 Level AA compliance and implement SEO best practices across all public-facing pages. The audit identified 24 issues — 10 high priority and 14 medium priority. Several things are already done well (prefers-reduced-motion, lang attribute, IconButton aria-label requirement, Alert roles, input label associations, focus rings).

## Key Decisions

1. **Skip link pattern**: A single visually-hidden skip link at the top of every layout, visible on focus, targeting `<main id="main-content">`.
2. **Modal focus management**: Build a shared `useFocusTrap` hook rather than adding focus trapping logic to each modal individually.
3. **SEO meta approach**: Create a shared `PageSeo` component that standardises OG tags, canonical URLs, and structured data across all pages.
4. **Contrast fixes**: Replace `text-slate-400` with `text-slate-500` on light backgrounds. `text-slate-500` (`#64748b`) on white gives ~4.6:1 contrast (passes AA).
5. **Sitemap**: Static `sitemap.xml` for now (public pages + blog index). Blog post URLs will be handled server-side later.
6. **No new dependencies**: All fixes use native HTML, ARIA attributes, React refs, and existing Tailwind utilities.

## Implementation Plan

### Phase 1: Foundation — Shared Utilities & Components ✅ COMPLETED

#### 1.1 Create `useFocusTrap` Hook

**New file:** `client/src/hooks/useFocusTrap.ts`

A reusable hook for trapping keyboard focus inside modals and menus.

```typescript
function useFocusTrap(isActive: boolean, containerRef: RefObject<HTMLElement>): void
```

Behaviour:
- When `isActive` becomes `true`: store the currently focused element, move focus to the first focusable child in the container
- Tab/Shift+Tab cycles through focusable elements within the container
- Escape key calls an optional `onEscape` callback
- When `isActive` becomes `false`: restore focus to the previously focused element

#### 1.2 Create `PageSeo` Component

**New file:** `client/src/components/seo/PageSeo.tsx`

Wraps `react-helmet-async` with standardised meta tags:

```typescript
interface PageSeoProps {
  title: string;               // Page title (appended with " | Kritano")
  description: string;         // Meta description + og:description
  path: string;                // Path for canonical URL (e.g., "/pricing")
  ogImage?: string;            // OG image URL (default: Kritano social card)
  ogType?: string;             // Default: "website"
  structuredData?: object;     // JSON-LD structured data
  noindex?: boolean;           // For auth/dashboard pages
}
```

Renders:
- `<title>`
- `<meta name="description">`
- `<link rel="canonical">`
- `<meta property="og:title">`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`
- `<meta name="twitter:card">`, `twitter:title`, `twitter:description`, `twitter:image`
- `<script type="application/ld+json">` if structured data provided

#### 1.3 Create `SkipLink` Component

**New file:** `client/src/components/a11y/SkipLink.tsx`

```tsx
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]
                 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg
                 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
    >
      Skip to main content
    </a>
  );
}
```

---

### Phase 2: Layout Accessibility ✅ COMPLETED

#### 2.1 PublicLayout — Skip Link, Landmarks, Mobile Menu

**File:** `client/src/components/layout/PublicLayout.tsx`

Changes:
- Add `<SkipLink />` as the first child
- Add `aria-label="Main navigation"` to `<nav>`
- Add `id="main-content"` to the `<main>` element (or wrap `{children}` in `<main id="main-content">`)
- Add `aria-label="Footer navigation"` to footer nav
- Mobile menu button: add `aria-expanded={mobileMenuOpen}`, `aria-controls="mobile-menu"`
- Mobile menu container: add `id="mobile-menu"`, `role="dialog"`, `aria-modal="true"`, `aria-label="Navigation menu"`
- Add Escape key handler to close mobile menu
- Apply `useFocusTrap` to mobile menu when open
- Add overlay `<div>` with `aria-hidden="true"` behind mobile menu

#### 2.2 DashboardLayout + Sidebar — Skip Link, Landmarks

**Files:** `client/src/components/layout/DashboardLayout.tsx`, `client/src/components/layout/Sidebar.tsx`

Changes:
- Add `<SkipLink />` as the first child of `DashboardLayout`
- Add `id="main-content"` to the `<main>` element
- `Sidebar.tsx` `<nav>`: add `aria-label="Dashboard navigation"`
- Theme toggle button: add `aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}`
- Collapse button: add `aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}`
- Mobile sidebar overlay: add `role="presentation"`, `aria-hidden="true"`, Escape key handler
- Apply `useFocusTrap` to mobile sidebar when open

---

### Phase 3: Form Accessibility ✅ COMPLETED

#### 3.1 Input Component — Error Association

**File:** `client/src/components/ui/Input.tsx`

Changes:
- Generate a stable `id` for the input if not provided (e.g., `useId()`)
- Generate an error message `id` as `${inputId}-error`
- When `error` prop is truthy:
  - Add `aria-invalid="true"` to the input
  - Add `aria-describedby="${inputId}-error"` to the input
  - Add `id="${inputId}-error"` to the error `<p>` element
  - Add `role="alert"` to the error `<p>` element (this provides `aria-live="assertive"` implicitly)

#### 3.2 Contact Form — Required Attributes and Error Announcements

**File:** `client/src/pages/public/Contact.tsx`

Changes:
- Add `required` attribute to name, email, subject, and message fields
- Add `aria-required="true"` to each required field
- Add `role="alert"` to the form-level error message
- Add `role="status"` to the success message
- Replace `<a href="/pricing">` etc. with `<Link to="/pricing">`

#### 3.3 Register Form — Fieldset, Legend, Checkbox Error

**File:** `client/src/components/auth/RegisterForm.tsx`

Changes:
- Wrap first/last name inputs in `<fieldset><legend className="sr-only">Name</legend>...</fieldset>`
- Wrap password/confirm password in `<fieldset><legend className="sr-only">Password</legend>...</fieldset>`
- Add `id` to the Terms checkbox and `aria-describedby` linking to its error message
- Add `required` to required fields

---

### Phase 4: Modal Accessibility ✅ COMPLETED

#### 4.1 BugReportModal

**File:** `client/src/components/bug-report/BugReportModal.tsx`

Changes:
- Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby="bug-report-title"` to the modal container
- Add `id="bug-report-title"` to the heading
- Add `aria-label="Close"` to the close button (X icon)
- Apply `useFocusTrap` hook
- Severity radio group: wrap in `<fieldset><legend>Severity</legend>...</fieldset>`

#### 4.2 FeatureRequestModal

**File:** `client/src/components/feature-request/FeatureRequestModal.tsx`

Same changes as BugReportModal:
- Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby="feature-request-title"`
- Add `id="feature-request-title"` to the heading
- Add `aria-label="Close"` to the close button
- Apply `useFocusTrap` hook
- Impact radio group: wrap in `<fieldset><legend>Impact</legend>...</fieldset>`

#### 4.3 FeedbackButton Popup

**File:** `client/src/components/feedback/FeedbackButton.tsx`

Changes:
- Add `aria-expanded={isOpen}`, `aria-haspopup="true"` to the trigger button
- Add `role="menu"`, `aria-label="Feedback options"` to the popup container
- Add `role="menuitem"` to each option
- Add Escape key handler to close
- Add arrow key navigation between menu items

---

### Phase 5: SEO Meta Tags ✅ COMPLETED

#### 5.1 Replace Helmet with PageSeo on All Public Pages

| Page | `title` | `description` | `path` | Structured Data |
|------|---------|--------------|--------|-----------------|
| Home | `Website Auditing for SEO, Accessibility, Security & Performance` | `Kritano audits your website...` | `/` | `WebApplication` |
| About | `About Kritano` | `Learn about Kritano's mission...` | `/about` | `Organization` |
| Services | `Services \| Kritano` | `Comprehensive website auditing...` | `/services` | `Service` (×4) |
| Pricing | `Pricing \| Kritano` | `Free and paid plans for...` | `/pricing` | `Product` with `offers` |
| Contact | `Contact \| Kritano` | `Get in touch with the Kritano team...` | `/contact` | `ContactPage` |
| Blog List | `Blog \| Kritano` | `SEO guides, accessibility tips...` | `/blog` | `Blog` |
| Blog Detail | Keep existing (already good) | — | — | — |

#### 5.2 Auth Pages — Add Title Tags

**Files:** `Login.tsx`, `Register.tsx`, `RegisterSuccess.tsx`

Add `<Helmet><title>Sign In | Kritano</title></Helmet>` (with `noindex` meta tag since these shouldn't be indexed).

#### 5.3 Fix `index.html` Default Title

**File:** `client/index.html`

Change `kritano` → `Kritano` in the default title. Add default OG meta tags:

```html
<meta property="og:site_name" content="Kritano" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

---

### Phase 6: Static SEO Assets ✅ COMPLETED

#### 6.1 Create `robots.txt`

**New file:** `client/public/robots.txt`

```
User-agent: *
Allow: /

Sitemap: https://kritano.com/sitemap.xml

# Disallow authenticated areas
Disallow: /dashboard
Disallow: /settings
Disallow: /admin
Disallow: /audits
Disallow: /sites
Disallow: /analytics
Disallow: /compare
```

#### 6.2 Create `sitemap.xml`

**New file:** `client/public/sitemap.xml`

Static sitemap with public pages:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://kritano.com/</loc><priority>1.0</priority></url>
  <url><loc>https://kritano.com/about</loc><priority>0.7</priority></url>
  <url><loc>https://kritano.com/services</loc><priority>0.8</priority></url>
  <url><loc>https://kritano.com/pricing</loc><priority>0.9</priority></url>
  <url><loc>https://kritano.com/contact</loc><priority>0.5</priority></url>
  <url><loc>https://kritano.com/blog</loc><priority>0.8</priority></url>
</urlset>
```

Blog post URLs should eventually be generated dynamically via a server-side sitemap endpoint.

#### 6.3 Create `site.webmanifest`

**New file:** `client/public/site.webmanifest`

```json
{
  "name": "Kritano",
  "short_name": "Kritano",
  "description": "Website auditing for SEO, accessibility, security, and performance",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4f46e5"
}
```

Add `<link rel="manifest" href="/site.webmanifest">` to `index.html`.

---

### Phase 7: Content Accessibility Fixes ✅ COMPLETED

#### 7.1 Contrast Fixes

Global find-and-replace where `text-slate-400` is used on light backgrounds:

| File | Line(s) | Change |
|------|---------|--------|
| `PublicLayout.tsx` | Footer copyright, privacy/terms links | `text-slate-400` → `text-slate-500` |
| `PostListPage.tsx` | Post metadata (clock, date) | `text-slate-400` → `text-slate-500` |
| `PostDetailPage.tsx` | Author/date metadata | `text-slate-400` → `text-slate-500` |
| `Home.tsx` | Hero card metadata | `text-slate-400` → `text-slate-500` |

Note: `text-slate-400` on dark backgrounds (e.g., `bg-slate-900`) is fine and should not be changed.

#### 7.2 Blog Featured Images — Alt Text

**File:** `client/src/pages/blog/PostListPage.tsx`, line 165

Change `alt=""` to `alt={post.title}` so the featured image has a meaningful description.

#### 7.3 Pricing Comparison Icons — Screen Reader Text

**File:** `client/src/pages/public/Pricing.tsx` (ComparisonCell)

Add `<span className="sr-only">` text alongside the icons:

```tsx
{value ? (
  <>
    <CheckCircle className="w-4 h-4 text-indigo-600 mx-auto" aria-hidden="true" />
    <span className="sr-only">Included</span>
  </>
) : (
  <>
    <X className="w-4 h-4 text-slate-300 mx-auto" aria-hidden="true" />
    <span className="sr-only">Not included</span>
  </>
)}
```

#### 7.4 Pricing FAQ — `aria-expanded`

**File:** `client/src/pages/public/Pricing.tsx`

- FAQ toggle button: add `aria-expanded={open}`
- Feature comparison toggle: add `aria-expanded={showComparison}`

#### 7.5 Pricing Table — `scope="col"`

**File:** `client/src/pages/public/Pricing.tsx`

Add `scope="col"` to all `<th>` elements in the comparison table header row.

#### 7.6 SVG Score Rings — Accessible Names

**File:** `client/src/pages/Home.tsx` (HeroRing)

Add `role="img"` and `aria-label` to each SVG:

```tsx
<svg ... role="img" aria-label={`${label} score: ${score} out of 100`}>
```

#### 7.7 Auth Page Heading Hierarchy

**Files:** `Login.tsx`, `Register.tsx`, `RegisterSuccess.tsx`

Change the brand heading from `<h1>` to a styled `<p>` or `<div>`, and promote the page title to `<h1>`:

```tsx
<p className="text-2xl font-bold text-indigo-600">Kritano</p>
<h1 className="text-xl font-semibold">Sign in to your account</h1>
```

#### 7.8 Loading State Announcements

**Files:** `PostListPage.tsx`, `PostDetailPage.tsx`

Add a visually-hidden live region that announces loading:

```tsx
<div aria-live="polite" className="sr-only">
  {loading ? 'Loading posts...' : `${posts.length} posts loaded`}
</div>
```

---

## Critical Files Summary

### New Files (5)

| # | File | Purpose |
|---|------|---------|
| 1 | `client/src/hooks/useFocusTrap.ts` | Reusable focus trap hook for modals/menus |
| 2 | `client/src/components/seo/PageSeo.tsx` | Standardised SEO meta tag component |
| 3 | `client/src/components/a11y/SkipLink.tsx` | Skip-to-content link component |
| 4 | `client/public/robots.txt` | Search engine crawl directives |
| 5 | `client/public/sitemap.xml` | Static sitemap for public pages |
| 6 | `client/public/site.webmanifest` | Web app manifest |

### Modified Files (18)

| # | File | Changes |
|---|------|---------|
| 1 | `client/src/components/layout/PublicLayout.tsx` | Skip link, nav labels, mobile menu a11y, contrast fixes |
| 2 | `client/src/components/layout/DashboardLayout.tsx` | Skip link, main id |
| 3 | `client/src/components/layout/Sidebar.tsx` | Nav label, button labels, mobile overlay a11y |
| 4 | `client/src/components/ui/Input.tsx` | aria-invalid, aria-describedby, error role |
| 5 | `client/src/components/bug-report/BugReportModal.tsx` | Dialog role, focus trap, close label, fieldset |
| 6 | `client/src/components/feature-request/FeatureRequestModal.tsx` | Dialog role, focus trap, close label, fieldset |
| 7 | `client/src/components/feedback/FeedbackButton.tsx` | Menu role, aria-expanded, keyboard nav |
| 8 | `client/src/components/auth/RegisterForm.tsx` | Fieldset/legend, checkbox error link, required |
| 9 | `client/src/pages/Home.tsx` | PageSeo, SVG aria-labels, contrast fixes |
| 10 | `client/src/pages/public/About.tsx` | PageSeo with Organization structured data |
| 11 | `client/src/pages/public/Services.tsx` | PageSeo with Service structured data |
| 12 | `client/src/pages/public/Pricing.tsx` | PageSeo, comparison icons sr-only text, FAQ aria-expanded, th scope |
| 13 | `client/src/pages/public/Contact.tsx` | PageSeo, required attrs, error roles, Link components |
| 14 | `client/src/pages/blog/PostListPage.tsx` | Image alt text, loading announcement, contrast fixes |
| 15 | `client/src/pages/blog/PostDetailPage.tsx` | Loading announcement, contrast fixes |
| 16 | `client/src/pages/auth/Login.tsx` | Helmet title, heading hierarchy |
| 17 | `client/src/pages/auth/Register.tsx` | Helmet title, heading hierarchy |
| 18 | `client/src/pages/auth/RegisterSuccess.tsx` | Helmet title, heading hierarchy |
| 19 | `client/index.html` | Fix title casing, add default OG/Twitter meta, manifest link |

## Testing Plan

1. **Automated**: Run axe-core via browser devtools on every modified page — zero violations target
2. **Keyboard**: Tab through every page end-to-end without mouse. Verify skip link, modal trapping, menu navigation, focus restoration
3. **Screen reader**: Test with VoiceOver (macOS) on Safari — verify page titles announced, landmarks navigable, form errors announced, modal focus correct
4. **Contrast**: Use Chrome DevTools contrast checker on all `text-slate-*` instances on light backgrounds
5. **Lighthouse**: Run Lighthouse accessibility + SEO audits on all public pages — target 95+ on both
6. **Social preview**: Test OG tags with opengraph.xyz or Twitter Card Validator

## Implementation Order

1. ~~Shared utilities: `useFocusTrap`, `PageSeo`, `SkipLink`~~ ✅ COMPLETED
2. ~~Layout fixes: PublicLayout, DashboardLayout, Sidebar~~ ✅ COMPLETED
3. ~~Form fixes: Input, Contact, RegisterForm~~ ✅ COMPLETED
4. ~~Modal fixes: BugReportModal, FeatureRequestModal, FeedbackButton~~ ✅ COMPLETED
5. ~~SEO meta: All public pages + auth pages + index.html~~ ✅ COMPLETED
6. ~~Static assets: robots.txt, sitemap.xml, site.webmanifest~~ ✅ COMPLETED
7. ~~Content fixes: Contrast, alt text, aria-expanded, headings, loading states~~ ✅ COMPLETED
