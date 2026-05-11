# Public Pages SSR - Implementation Plan

## Overview

The React SPA serves an empty HTML shell for all public marketing pages (homepage, about, pricing, services, contact, FAQ, docs). Search engines, AI crawlers, and fetch tools that don't execute JavaScript see nothing. Blog pages already work because they're server-rendered via Express.

This plan extends the blog SSR pattern to cover all public-facing pages, so every public URL returns complete HTML with content, meta tags, and structured data - without breaking the existing SPA for browser users.

**There is already a Puppeteer-based prerender middleware**, but it has issues: it's slow (launches headless Chrome per request), has a limited bot list, and clearly isn't catching all crawlers (Claude Desktop failed to fetch the homepage). SSR is the proper fix - serve real HTML from Express, same as the blog.

## Key Decisions

### 1. Extend the existing blog SSR pattern, don't introduce a framework

We already have `htmlShell()`, `renderNav()`, `renderFooter()` in `blog-ssr.service.ts`. Extract these shared functions into a new `ssr-shared.service.ts` and reuse them for all public pages. No new dependencies, no SSR framework (Next.js, Remix, etc.), no build pipeline changes.

### 2. Content lives in the SSR service files, not a database

All public pages are static content (hardcoded in React components). We'll hardcode the same content in the SSR service. This means content changes require code changes in two places (React component + SSR service), but this is the same pattern the blog nav/footer already uses, and it avoids the complexity of a CMS or shared template system.

### 3. SSR pages are the primary response; SPA hydrates on top

When a user visits `/about`, nginx proxies to Express, which returns full HTML. The HTML includes the Vite CSS and a script tag pointing to the SPA bundle. The browser renders the SSR HTML immediately (fast first paint), then the SPA boots and takes over (hydration). If JS fails to load, the page still works.

### 4. Phased rollout - marketing pages first, docs later

Phase 1: Homepage, About, Services, Services/:slug, Pricing, Contact, FAQ, Author
Phase 2: Docs pages (lower priority - mostly developer audience who have JS enabled)
Phase 3: Legal pages (Terms, Privacy - lowest priority but easy wins)

## Database Changes

None. All public page content is static.

## Backend Changes

### New files

#### `server/src/services/ssr-shared.service.ts`
Extract from `blog-ssr.service.ts`:
- `htmlShell()` function (builds the full HTML document)
- `renderNav()` function
- `renderFooter()` function
- `setSsrHeaders()` function
- `discoverCssFile()` and `VITE_CSS_PATH` constant
- Font face declarations and shared CSS
- `BASE_URL` constant

The blog SSR service then imports these instead of defining them locally.

#### `server/src/services/public-ssr.service.ts`
New file containing render functions for each public page:
- `renderHomepage(): string`
- `renderAboutPage(): string`
- `renderServicesPage(): string`
- `renderServiceDetailPage(slug: string): string`
- `renderPricingPage(): string`
- `renderContactPage(): string`
- `renderFaqPage(): string`
- `renderAuthorPage(): string`

Each function:
1. Calls `htmlShell()` with page-specific title, description, OG tags, canonical URL
2. Passes a `body` string containing the page content as semantic HTML with Tailwind classes
3. Includes structured data where appropriate (Organization, FAQPage, etc.)

**Content approach**: Read the React component for each page, translate the JSX to static HTML strings. Strip React-specific stuff (useState, useEffect, event handlers). Keep all Tailwind classes, semantic HTML structure, and text content identical.

**Interactive elements** (contact form, pricing toggle, FAQ accordions): Render the default/initial state in HTML. The SPA will hydrate and make them interactive. For non-JS users, the contact form submits normally (add a `<form action="/api/contact" method="POST">` fallback), FAQ answers are all visible, pricing shows the default tier view.

#### `server/src/routes/public-ssr.ts`
New Express router with routes:
```
GET /                    -> renderHomepage()
GET /about               -> renderAboutPage()
GET /services            -> renderServicesPage()
GET /services/:slug      -> renderServiceDetailPage(slug)
GET /pricing             -> renderPricingPage()
GET /contact             -> renderContactPage()
GET /faq                 -> renderFaqPage()
GET /author/chris-garlick -> renderAuthorPage()
```

Each route:
1. Calls `setSsrHeaders(res)` to set Content-Type and CSP
2. Sets `Cache-Control: public, max-age=300, stale-while-revalidate=86400` (5 min cache, 1 day stale)
3. Sends the rendered HTML

### Modified files

#### `server/src/services/blog-ssr.service.ts`
- Remove `htmlShell()`, `renderNav()`, `renderFooter()`, `setSsrHeaders()`, `discoverCssFile()`, font declarations, shared CSS
- Import them from `ssr-shared.service.ts` instead
- Everything else stays the same

#### `server/src/index.ts`
- Import and mount `publicSsrRouter`
- Mount it AFTER the API router, at the same level as `blogSsrRouter`
- Mount order: API routes -> Blog SSR -> **Public SSR** -> Prerender middleware -> 404

```typescript
app.use('/api', apiRouter);
app.use('/blog', blogSsrRouter);
app.use(publicSsrRouter);  // handles /, /about, /pricing, etc.
app.use(prerenderMiddleware);
```

The public SSR router only matches the specific routes it defines. Any route it doesn't handle (e.g. `/app/dashboard`, `/login`) falls through to the prerender middleware and then 404, same as before.

### SPA hydration script

Each SSR page needs to load the SPA bundle so the React app can hydrate on top of the server-rendered HTML. Add to the `htmlShell()` `extraHead` or at the bottom of body:

```html
<script type="module" src="/assets/index-[hash].js"></script>
```

Discover the hashed JS entry point the same way we discover the CSS file - scan `client/dist/assets/` for the entry JS file. The SPA's `main.tsx` calls `createRoot(document.getElementById('root'))` - we need the SSR HTML to include `<div id="root">` wrapping the content so React can hydrate it.

**Important**: The SSR body content must be wrapped in `<div id="root">` so React can attach to it. The skip link, nav, and footer should be INSIDE this div (matching the SPA's DOM structure) so React doesn't see a mismatch during hydration.

Actually - **simpler approach**: Don't hydrate at all for public pages. The SSR HTML is complete and functional. Interactive elements (contact form, FAQ toggles) can work with minimal inline JS or CSS-only patterns (like the blog's checkbox hamburger). This avoids hydration mismatches entirely and means the SPA bundle only loads when users navigate to authenticated routes.

**Recommended approach**: Serve complete SSR HTML without the SPA bundle. Add a small inline script that only redirects to the SPA for authenticated routes (`/app/*`, `/admin/*`) or when a user clicks "Sign in" / "Dashboard". This keeps public pages fast and fully functional without JS.

## Frontend Changes

### Minimal changes needed

The React SPA continues to work as-is for:
- Authenticated routes (`/app/*`, `/admin/*`)
- Client-side navigation between pages (once the SPA is loaded)
- Development (`npm run dev` serves the SPA as before)

No React component changes are needed. The SSR pages are a separate rendering path that produces the same visual output.

### Navigation links

SSR pages use regular `<a href>` tags (full page loads). SPA pages use React Router `<Link>` (client-side navigation). This is fine - when a user lands on an SSR page and clicks a link to another SSR page, it's a normal page load. Fast, cacheable, works without JS.

If we later want SPA-style navigation on SSR pages, we can add a small script that intercepts link clicks and does client-side fetches, but this is a future optimisation, not a requirement.

## Nginx Changes

### Proxy public routes to Express

Currently, nginx serves the SPA shell for all non-API, non-blog routes. We need to proxy the SSR routes to Express instead.

**Before:**
```nginx
location / {
    root /home/deploy/kritano/client/dist;
    try_files $uri $uri/ /index.html;
}
```

**After:**
```nginx
# SSR public pages - proxy to Express
location = / { proxy_pass http://127.0.0.1:3001; }
location = /about { proxy_pass http://127.0.0.1:3001; }
location = /services { proxy_pass http://127.0.0.1:3001; }
location ~ ^/services/[a-z0-9-]+$ { proxy_pass http://127.0.0.1:3001; }
location = /pricing { proxy_pass http://127.0.0.1:3001; }
location = /contact { proxy_pass http://127.0.0.1:3001; }
location = /faq { proxy_pass http://127.0.0.1:3001; }
location = /author/chris-garlick { proxy_pass http://127.0.0.1:3001; }

# SPA catch-all (authenticated routes, login, register, etc.)
location / {
    root /home/deploy/kritano/client/dist;
    try_files $uri $uri/ /index.html;
}
```

The `location =` exact matches take priority over the `location /` prefix match in nginx, so SSR routes are handled first and everything else falls through to the SPA.

**Important**: These nginx locations need the same `proxy_set_header` directives as the existing `/api/` and `/blog` locations (Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto).

**Important**: The existing `location /blog` block that proxies to Express must remain unchanged.

## Critical Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `server/src/services/ssr-shared.service.ts` | **Create** | Shared SSR utilities (shell, nav, footer, headers) |
| `server/src/services/public-ssr.service.ts` | **Create** | Render functions for each public page |
| `server/src/routes/public-ssr.ts` | **Create** | Express routes for public SSR pages |
| `server/src/services/blog-ssr.service.ts` | **Modify** | Import shared functions instead of defining locally |
| `server/src/index.ts` | **Modify** | Mount public SSR router |
| `scripts/nginx.conf` | **Modify** | Proxy SSR routes to Express |

## Testing Plan

### Before deployment

1. **Verify blog still works** - Blog listing and individual posts render identically after extracting shared functions
2. **Verify each SSR page** - curl each URL and confirm complete HTML with correct title, description, OG tags, content, nav, footer
3. **Verify SPA still works** - Login, dashboard, admin pages all load correctly via the SPA
4. **Verify meta tags** - Each page has unique, correct title, description, canonical URL, OG image
5. **Verify structured data** - Homepage has Organization schema, FAQ has FAQPage schema, etc.
6. **Verify mobile nav** - Hamburger toggle works on SSR pages (CSS-only, no JS)
7. **Verify contact form** - Works with and without JavaScript
8. **Verify caching** - Response headers show correct Cache-Control values
9. **Verify CSP** - No console errors for blocked resources on SSR pages

### After deployment

1. **Fetch test** - Use WebFetch on each public URL and confirm full content is returned
2. **Google Search Console** - Check for any indexing issues after rollout
3. **PageSpeed Insights** - Run on SSR pages to confirm performance improvement
4. **Bot test** - Verify Googlebot, Claude, ChatGPT user agents all get full HTML

### Rollback plan

If anything breaks:
1. Remove the nginx `location =` blocks for SSR routes
2. Reload nginx (`sudo nginx -s reload`)
3. All traffic falls back to the SPA catch-all immediately
4. No Express changes needed for rollback - the SSR routes just stop receiving traffic

This is the key safety net: **nginx is the switch**. Adding or removing the proxy rules instantly toggles between SSR and SPA for any route, with zero downtime.

## Implementation Order

1. **Extract shared SSR functions** into `ssr-shared.service.ts` - refactor blog-ssr to import from it - verify blog still works identically
2. **Build the homepage SSR** - the most important page, and the one that proves the pattern works
3. **Add the Express route and mount it** - test locally with curl
4. **Add the nginx proxy rule for `/`** - deploy and verify the homepage is now SSR
5. **Build remaining pages** one at a time (About, Services, Pricing, Contact, FAQ, Author) - each is a new render function + nginx rule
6. **Add structured data** - Organization on homepage, FAQPage on FAQ, etc.
7. **Phase 2**: Docs pages (if needed)
8. **Phase 3**: Legal pages (Terms, Privacy)

Each step is independently deployable and independently reversible via nginx.
