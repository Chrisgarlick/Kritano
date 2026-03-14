# Ultrathink Plan: Public API Documentation

## Overview/Summary

Replace the current inline HTML API docs page (`GET /api/docs` — a 2000+ line string in Express) with a proper React-based documentation site within the frontend SPA. The docs will be publicly accessible, SEO-optimised via the existing `PageSeo` system, and manageable from the admin SEO panel.

The documentation covers the **public API v1** endpoints (API key authenticated) — this is what external developers/integrators use. Internal session-based endpoints are NOT documented publicly.

## Key Decisions

1. **Frontend SPA pages, not server-rendered HTML** — Move docs into the React app so they use `PageSeo`, `react-helmet-async`, and the existing SEO override system. This gives us proper meta tags, structured data, and admin-controllable SEO.

2. **Multi-page docs structure** — Rather than one giant page, split into logical sections with a shared sidebar layout. Each section gets its own route and SEO entry:
   - `/docs` — Overview + Getting Started
   - `/docs/authentication` — API keys, auth headers, scopes
   - `/docs/rate-limits` — Rate limiting, headers, tiers
   - `/docs/errors` — Error codes, response format
   - `/docs/audits` — Audit endpoints (CRUD + findings)
   - `/docs/webhooks` — Webhook events (future-proofing)

3. **Shared layout component** — A `DocsLayout` with sticky sidebar navigation + mobile hamburger menu, matching the brand guidelines (indigo primary, Instrument Serif headings, Outfit body, JetBrains Mono for code).

4. **Static content, no CMS** — Docs content lives as React components, not in the database. This keeps them version-controlled and avoids needing a markdown renderer. The admin SEO panel only controls meta tags/OG data, not content.

5. **Remove the Express HTML endpoint** — Delete the `/api/docs` route and redirect it to `/docs` on the frontend (301 redirect for any existing links/bookmarks).

6. **Route registry entries** — Add all `/docs/*` routes to `routeRegistry.ts` so they appear in the admin SEO manager under a new `"public"` category.

## Database Changes

None. The existing `page_seo` table handles everything — we just need admin SEO entries for the new routes.

## Backend Changes

### 1. Remove inline docs route
- **File:** `server/src/routes/docs/index.ts` — Delete entirely or reduce to a 301 redirect
- **File:** `server/src/routes/index.ts` (or wherever docs router is mounted) — Remove the mount, or replace with redirect middleware:
  ```ts
  router.get('/docs', (req, res) => res.redirect(301, '/docs'));
  router.get('/docs/*', (req, res) => res.redirect(301, '/docs'));
  ```

### 2. Seed default SEO entries (optional migration)
- Add a migration that inserts default `page_seo` rows for each docs route with good defaults:
  - `/docs` — "API Documentation | PagePulser"
  - `/docs/authentication` — "Authentication - API Docs | PagePulser"
  - `/docs/rate-limits` — "Rate Limits - API Docs | PagePulser"
  - `/docs/errors` — "Error Handling - API Docs | PagePulser"
  - `/docs/audits` — "Audit Endpoints - API Docs | PagePulser"
  - `/docs/webhooks` — "Webhooks - API Docs | PagePulser"
- Each entry should include `og_type: 'article'`, sensible descriptions, and `structured_data` with TechArticle JSON-LD schema.

## Frontend Changes

### 1. Create `DocsLayout` component
- **File:** `client/src/components/docs/DocsLayout.tsx`
- Sticky sidebar with nav links to each docs section
- Active link highlighting based on current route
- Mobile-responsive: hamburger toggle for sidebar on small screens
- Breadcrumb: Home > API Docs > [Section]
- Brand-compliant styling per `/docs/BRAND_GUIDELINES.md`
- "Back to app" link in header

### 2. Create docs page components
Each page is a React component using `PageSeo` with `useOverrides={true}`:

- **`client/src/pages/docs/DocsOverviewPage.tsx`** — `/docs`
  - Quick start guide, base URL, response format overview
  - Links to each section
  - Code example: first API call with curl

- **`client/src/pages/docs/DocsAuthPage.tsx`** — `/docs/authentication`
  - How to create API keys (link to dashboard)
  - Auth header format (`Authorization: Bearer pp_live_xxx` or `X-API-Key`)
  - Available scopes table: `audits:read`, `audits:write`, `findings:read`, `findings:write`, `exports:read`
  - Key security best practices

- **`client/src/pages/docs/DocsRateLimitsPage.tsx`** — `/docs/rate-limits`
  - Rate limit tiers table (per plan)
  - Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`
  - 429 response handling

- **`client/src/pages/docs/DocsErrorsPage.tsx`** — `/docs/errors`
  - Standard error response shape: `{ error, code, details? }`
  - Error codes table with HTTP status, code string, and description
  - Validation error format

- **`client/src/pages/docs/DocsAuditsPage.tsx`** — `/docs/audits`
  - `POST /api/v1/audits` — Create audit (request/response examples)
  - `GET /api/v1/audits` — List audits (query params, pagination)
  - `GET /api/v1/audits/:id` — Get audit details
  - `GET /api/v1/audits/:id/findings` — Get findings (filters, pagination)
  - `POST /api/v1/audits/:id/cancel` — Cancel audit
  - `DELETE /api/v1/audits/:id` — Delete audit
  - Each endpoint: method badge, path, description, auth scope, request params table, response example, error cases

- **`client/src/pages/docs/DocsWebhooksPage.tsx`** — `/docs/webhooks`
  - Coming soon placeholder or initial webhook documentation
  - Event types, payload format, verification

### 3. Shared UI components for docs
- **`client/src/components/docs/CodeBlock.tsx`** — Syntax-highlighted code blocks (use JetBrains Mono, copy button)
- **`client/src/components/docs/EndpointCard.tsx`** — Reusable card for each endpoint: method badge (GET=green, POST=blue, DELETE=red), path, description, expandable request/response examples
- **`client/src/components/docs/ParamTable.tsx`** — Table for request parameters (name, type, required, description)
- **`client/src/components/docs/ResponseExample.tsx`** — JSON response preview with copy button

### 4. Add routes to React Router
- **File:** `client/src/App.tsx`
- Add public routes (no `ProtectedRoute` wrapper):
  ```tsx
  <Route path="/docs" element={<DocsLayout />}>
    <Route index element={<DocsOverviewPage />} />
    <Route path="authentication" element={<DocsAuthPage />} />
    <Route path="rate-limits" element={<DocsRateLimitsPage />} />
    <Route path="errors" element={<DocsErrorsPage />} />
    <Route path="audits" element={<DocsAuditsPage />} />
    <Route path="webhooks" element={<DocsWebhooksPage />} />
  </Route>
  ```

### 5. Update route registry
- **File:** `client/src/config/routeRegistry.ts`
- Add entries for all 6 docs routes with `category: 'public'`:
  ```ts
  { path: '/docs', label: 'API Docs', category: 'public', defaultTitle: 'API Documentation | PagePulser', defaultDescription: '...' },
  { path: '/docs/authentication', label: 'API Auth', category: 'public', ... },
  { path: '/docs/rate-limits', label: 'Rate Limits', category: 'public', ... },
  { path: '/docs/errors', label: 'Error Handling', category: 'public', ... },
  { path: '/docs/audits', label: 'Audit Endpoints', category: 'public', ... },
  { path: '/docs/webhooks', label: 'Webhooks', category: 'public', ... },
  ```

### 6. Add link to docs from public nav/footer
- Add "API Docs" link to the main site navigation and footer (wherever other public pages like Pricing, About are linked)
- Add "API Docs" link to the dashboard sidebar under a "Developers" section (near API Keys)

## Critical Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `server/src/routes/docs/index.ts` | Delete/Replace with redirect | Remove 2000-line inline HTML |
| `client/src/components/docs/DocsLayout.tsx` | Create | Shared sidebar layout |
| `client/src/components/docs/CodeBlock.tsx` | Create | Syntax-highlighted code blocks |
| `client/src/components/docs/EndpointCard.tsx` | Create | Endpoint documentation card |
| `client/src/components/docs/ParamTable.tsx` | Create | Parameter table component |
| `client/src/components/docs/ResponseExample.tsx` | Create | Response JSON previewer |
| `client/src/pages/docs/DocsOverviewPage.tsx` | Create | Overview + getting started |
| `client/src/pages/docs/DocsAuthPage.tsx` | Create | Authentication docs |
| `client/src/pages/docs/DocsRateLimitsPage.tsx` | Create | Rate limits docs |
| `client/src/pages/docs/DocsErrorsPage.tsx` | Create | Error handling docs |
| `client/src/pages/docs/DocsAuditsPage.tsx` | Create | Audit endpoints docs |
| `client/src/pages/docs/DocsWebhooksPage.tsx` | Create | Webhooks docs |
| `client/src/App.tsx` | Edit | Add docs routes |
| `client/src/config/routeRegistry.ts` | Edit | Add docs to SEO registry |
| `server/src/db/migrations/xxx_seed_docs_seo.sql` | Create | Seed SEO defaults |

## Testing Plan

- [ ] Verify all 6 docs pages render correctly at their routes
- [ ] Verify sidebar navigation works and highlights active section
- [ ] Verify mobile responsive layout (sidebar collapses)
- [ ] Verify `PageSeo` renders correct meta tags on each page (inspect `<head>`)
- [ ] Verify admin SEO panel shows all `/docs/*` routes and overrides work
- [ ] Verify old `/api/docs` URL redirects to `/docs` (301)
- [ ] Verify code blocks render with JetBrains Mono and copy buttons work
- [ ] Verify endpoint examples match actual API v1 behaviour
- [ ] Verify pages are crawlable (no `noindex`, proper canonical URLs)
- [ ] Verify structured data (JSON-LD) is valid via Google's Rich Results Test
- [ ] Check Lighthouse SEO score on each docs page

## Implementation Order

1. **Create shared docs components** — `DocsLayout`, `CodeBlock`, `EndpointCard`, `ParamTable`, `ResponseExample`
2. **Create docs pages** — Start with `DocsOverviewPage`, then `DocsAuthPage`, `DocsRateLimitsPage`, `DocsErrorsPage`, `DocsAuditsPage`, `DocsWebhooksPage`
3. **Add routes to App.tsx** — Wire up the new pages
4. **Update route registry** — Add all docs routes for SEO admin
5. **Seed SEO migration** — Create migration with default meta tags
6. **Backend cleanup** — Replace Express docs route with 301 redirect
7. **Add navigation links** — Public nav/footer + dashboard sidebar
8. **Test & polish** — Responsive testing, SEO validation, content review
