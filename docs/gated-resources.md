# Gated Resources Implementation Plan

A library of downloadable lead magnets gated by email capture, with logged-in users bypassing the gate. Markdown is served natively. PDF and HTML are produced by an external rendering service at `typeset.chrisgarlick.com`. DOCX is deferred until typeset supports it. The content catalogue and ranking live in `/docs/gated_resources.md`; this document covers only the system that delivers them.

## Overview / Summary

Visitors land on `/resources` (SSR list page) or `/resources/<slug>` (SSR detail page). The detail page shows a preview of the resource (first ~30% of content), the benefits, and a format chooser. Behaviour from here splits in two:

- **Logged-in users**: the format chooser becomes direct download links. One click downloads.
- **Anonymous visitors**: they submit their email through a small form. We issue a 7-day download token, immediately redirect them to a "Your downloads" page that exposes the available formats, and we also email them the same links.

Every download (logged-in or token-based) goes through `GET /api/resources/:slug/download/:format` and is recorded against either the user or the lead record. The lead record plugs into the existing `lead_scoring` and `crm-trigger` systems so a download starts the nurture sequence we already ship.

Source of truth for each resource is a Markdown file in `server/src/data/resources/<slug>/source.md` plus metadata in the `gated_resources` table. Markdown downloads stream that source file directly. PDF and HTML downloads proxy through our backend to `typeset.chrisgarlick.com`, which renders branded output on demand. The typeset integration itself is wired but stubbed for MVP: the endpoint, the contract, and the response handling are in place so it goes live the moment typeset is ready.

## Key Decisions

1. **Markdown is the only natively-served format.** It is the source of truth, edited in `.md` files in the repo, and shipped as-is to the user. No transformation, no template engine, no toolchain. Everything else is derived elsewhere.

2. **PDF and HTML are rendered by `typeset.chrisgarlick.com`, not by us.** Our download endpoint proxies the request to typeset with the resource's Markdown content plus the requested format, then streams the response back to the user. This keeps Chromium out of this codebase and centralises branded rendering in one place. The typeset client lives in a single service module so the integration can be stubbed today and finished when typeset ships HTML support.

3. **DOCX is deferred.** It was tentative in the original ask and typeset does not support it yet. The system is built so DOCX slots in as a fourth format value the moment typeset (or any future renderer) ships it. No schema or route change needed when it arrives, just a new entry in the `formats` array and a renderer route in `typeset.service.ts`.

4. **Frictionless email gate, not magic link verification.** The user enters an email, we issue a token immediately and email a copy. Magic-link verification kills conversion on lead magnets and the security upside is negligible for free content. Disposable-email domains are rejected at the form.

5. **Token is resource-scoped, multi-format, 7-day TTL, reusable N times.** One token unlocks every available format of one resource for one week. Lets the visitor come back and grab another format later.

6. **Resources are free for every tier (Free through Enterprise).** They are marketing assets, not product features. Tier table gets one new row that just says "Yes" for all five tiers, so anyone reading the tier doc knows resources are universal.

7. **SSR for the resource list and detail pages.** Matches the existing pattern for blog, compare, and public marketing pages. Critical for AEO and Google indexing of these high-intent pages.

8. **Email captured as a `gated_resource_lead`, not a `user`.** A separate table because these are unverified emails with no password. If the lead later signs up, we link them on user creation. Keeps the `users` table clean and avoids confusing the auth audit log.

9. **Branding is typeset's responsibility for PDF/HTML.** We send Markdown plus a brand profile identifier (e.g. `brand: 'kritano'`); typeset owns the visual treatment. Markdown stays plain (no front-matter cruft in the downloaded file). This keeps brand changes to one service rather than scattered across audit PDFs, blog SSR, and resource exports.

10. **Honour existing email preferences and consent system.** Every lead capture goes through `consent.service.ts` to log lawful basis. The form has a checkbox for "Send me Kritano's weekly insights" defaulting to off; downloading the resource itself is legitimate interest, the newsletter opt-in is consent. Unsubscribe link in every nurture email.

11. **Anti-abuse: rate limit, honeypot, disposable email block, signed CSRF on form.** No CAPTCHA in MVP. We add it only if abuse data shows it is needed.

12. **Cache typeset responses by content hash.** First PDF request for a resource triggers a typeset call; the response is cached to `uploads/resources/<slug>/<content_hash>.<format>` and served from disk for every subsequent request. Editing the source MD bumps the hash and forces a re-render. Keeps typeset costs and latency in check, especially on popular resources.

## Database Changes

### Migration: `111_gated_resources.sql`

```sql
-- Catalogue of resources. Edited via admin UI or seed.
CREATE TABLE gated_resources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT NOT NULL UNIQUE,
    title           TEXT NOT NULL,
    subtitle        TEXT,
    hook            TEXT NOT NULL,                  -- one-line value prop on the gate page
    category        TEXT NOT NULL,                  -- maps to a blog category for anchoring
    audience        TEXT,
    description     TEXT NOT NULL,                  -- markdown, shown on the gate page
    preview_md      TEXT NOT NULL,                  -- first ~30% of the resource shown publicly
    source_md_path  TEXT NOT NULL,                  -- e.g. resources/website-health-checklist/source.md
    formats         TEXT[] NOT NULL DEFAULT ARRAY['md','pdf','html'],  -- DOCX added later when typeset supports it
    content_hash    TEXT NOT NULL,                  -- sha256 of source_md, drives typeset render-cache invalidation
    published       BOOLEAN NOT NULL DEFAULT false,
    page_count      INTEGER,                        -- rough, for display
    download_count  INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gated_resources_published_category ON gated_resources(published, category);

-- Anonymous email leads captured by the gate. One row per email per resource.
CREATE TABLE gated_resource_leads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id     UUID NOT NULL REFERENCES gated_resources(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    email_normalised TEXT NOT NULL,                 -- lowercased, trimmed; the dedupe key
    consent_newsletter BOOLEAN NOT NULL DEFAULT false,
    referer         TEXT,
    utm_source      TEXT,
    utm_medium      TEXT,
    utm_campaign    TEXT,
    ip_hash         TEXT,                           -- sha256(ip || pepper), never raw IP
    user_agent      TEXT,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,  -- linked if they later sign up
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (resource_id, email_normalised)
);
CREATE INDEX idx_gated_resource_leads_email ON gated_resource_leads(email_normalised);
CREATE INDEX idx_gated_resource_leads_user ON gated_resource_leads(user_id) WHERE user_id IS NOT NULL;

-- Short-lived download tokens. One token grants access to all formats of one resource.
CREATE TABLE gated_resource_tokens (
    token           TEXT PRIMARY KEY,               -- 32-byte url-safe base64
    resource_id     UUID NOT NULL REFERENCES gated_resources(id) ON DELETE CASCADE,
    lead_id         UUID REFERENCES gated_resource_leads(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at      TIMESTAMPTZ NOT NULL,
    uses_count      INTEGER NOT NULL DEFAULT 0,
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (lead_id IS NOT NULL OR user_id IS NOT NULL)
);
CREATE INDEX idx_gated_resource_tokens_expires ON gated_resource_tokens(expires_at);

-- Per-download audit log for analytics and abuse tracking.
CREATE TABLE gated_resource_downloads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id     UUID NOT NULL REFERENCES gated_resources(id) ON DELETE CASCADE,
    format          TEXT NOT NULL,                  -- 'md' | 'html' | 'pdf' | 'docx'
    lead_id         UUID REFERENCES gated_resource_leads(id) ON DELETE SET NULL,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    token_id        TEXT REFERENCES gated_resource_tokens(token) ON DELETE SET NULL,
    ip_hash         TEXT,
    referer         TEXT,
    downloaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gated_resource_downloads_resource ON gated_resource_downloads(resource_id, downloaded_at DESC);
CREATE INDEX idx_gated_resource_downloads_user ON gated_resource_downloads(user_id) WHERE user_id IS NOT NULL;
```

### Seed

`server/src/db/seed.ts` (or a dedicated `seed-resources.ts`) inserts the five P0 resources with `published = false`. They are flipped to `published = true` from the admin UI once the source MD files are written.

## Backend Changes

### New service: `gated-resource.service.ts`

Single-responsibility module owning the resource lifecycle. Public surface:

```ts
listPublishedResources(filters?: { category?: string }): Promise<ResourceSummary[]>
getResourceBySlug(slug: string): Promise<GatedResource | null>
captureEmailAndIssueToken(input: {
  resourceSlug: string;
  email: string;
  consentNewsletter: boolean;
  request: Request;             // for IP, UA, referer, UTM
}): Promise<{ token: string; lead: GatedResourceLead }>
issueTokenForUser(resourceSlug: string, userId: string): Promise<string>
validateToken(token: string, resourceSlug: string): Promise<TokenContext | null>
recordDownload(input: { resourceId; format; userId?; leadId?; tokenId?; request }): Promise<void>
```

Token generation: `crypto.randomBytes(32).toString('base64url')`. 7-day TTL.

### New service: `resource-delivery.service.ts`

Thin module that fetches the right bytes for a given resource and format. Idempotent and cached.

```ts
deliverFormat(resource: GatedResource, format: 'md'|'pdf'|'html'): Promise<{ path: string; mimeType: string; filename: string }>
```

Internally:

1. **MD**: resolve `source_md_path` (relative to `server/src/data/resources/`), return its absolute path with `text/markdown; charset=utf-8` and `<slug>.md` as the filename. No transformation, no caching layer needed beyond the OS page cache.
2. **PDF or HTML**:
   - Check `uploads/resources/<slug>/<content_hash>-<clientSlug>-<documentType>.<format>` on disk. If present, return it.
   - If absent, call `renderViaTypeset(...)` with the resource's frontmatter metadata. Stream the response body to the cache path, then return it.
3. Unknown format → throw `UnsupportedFormatError` (the route turns this into a 400).

**Cache key composition.** The filename incorporates every input that affects the rendered output: `content_hash` (the source MD), the typeset `clientSlug` (which brand profile renders it), and the `documentType`. Swapping any of these invalidates the cache automatically — no manual purge needed. Per the lessons in `/docs/integration-guide.md` (point 8), caching by `content_hash` alone would silently serve the old brand's render after a profile change. Cache files are immutable, so we serve them with `Cache-Control: private, max-age=86400` (private because downloads are tied to leads, not public CDN material).

### New service: `typeset.service.ts`

Single-responsibility client for `typeset.chrisgarlick.com`. Wraps the HTTP call with auth, timeouts, and error mapping. See `/docs/typeset_integration.md` for the full API reference.

```ts
type TypesetDocumentType = 'proposal' | 'report' | 'brief' | 'sop' | 'invoice' | 'general';

interface TypesetRenderRequest {
  markdown: string;                      // body only — no YAML frontmatter
  format: 'pdf' | 'docx' | 'html';       // html reserved until typeset adds it
  frontmatter?: Record<string, string | number | null | undefined>;
  documentType?: TypesetDocumentType;    // defaults to 'report' for Kritano resources
  clientSlug?: string;                   // falls back to TYPESET_CLIENT_SLUG env
}

interface TypesetRenderResponse {
  bytes: Uint8Array;
  mimeType: string;
}

renderViaTypeset(req: TypesetRenderRequest): Promise<TypesetRenderResponse>
```

Behaviour:

- Reads `TYPESET_BASE_URL`, `TYPESET_API_KEY`, `TYPESET_CLIENT_SLUG`, and `TYPESET_ENABLED` from env. When the flag is off or the URL/key are missing, throws `TypesetNotConfiguredError`. The route surfaces this as a friendly 503 "PDF is being prepared" message; Markdown downloads keep working regardless.
- When enabled, POSTs to `${TYPESET_BASE_URL}/api/render` with the `ts_<uuid>_<random>` key in the `Authorization: Bearer` header. Payload shape per the typeset API: `{ content, document_type, format, client? }`. The `content` field is built by `buildContent(markdown, frontmatter)`, which prepends a YAML frontmatter block (single-line `key: value` pairs only, per typeset's parser).
- 60s timeout to give big documents headroom (typeset doc recommends ≥ 30s).
- `format: 'html'` throws `TypesetRenderError` until typeset adds HTML support; when it does, this is a one-line removal in this file.
- Non-2xx responses include a body excerpt in the error message for easier triage.

This module is the *only* file that knows the typeset wire format. When the contract changes, only this file does.

### One-time client profile setup

Typeset stores per-tenant branding in "client profiles" keyed by slug. Kritano's profile is created once per environment via:

```
npx tsx scripts/setup-typeset-profile.ts
```

The script (`server/scripts/setup-typeset-profile.ts`) POSTs the Kritano colour palette, page size, cover/header/footer templates, and (later) logo URL to `POST /api/clients`. It is idempotent (upsert), so re-running after a branding tweak is safe.

**Cover template choice.** The script uses `cover_template: 'bold'` — not `'minimal'` — because typeset's `minimal` template renders a frame-and-rules layout rather than filling the cover edge-to-edge with `cover_bg_colour`. Per `/docs/integration-guide.md` lesson 6, use `'bold'`, `'full'`, or `'dark'` if you want the indigo cover to actually render full-bleed.

### Env vars added

```
TYPESET_BASE_URL=https://typeset.chrisgarlick.com
TYPESET_API_KEY=                # ts_<uuid>_<random> per typeset's auth scheme
TYPESET_CLIENT_SLUG=kritano     # references the profile created by the setup script
TYPESET_ENABLED=false           # flip to true once the key is set and profile exists
```

Documented in `server/.env.example`. No new npm dependencies are added; the typeset client uses the native `fetch` available in Node 20.

### New SSR routes: `routes/resources-ssr.ts`

Mirrors `blog-ssr.ts` exactly:

- `GET /resources` → branded HTML list page with all published resources grouped by category.
- `GET /resources/:slug` → branded HTML detail page with preview, format chooser, email form (or direct links if `req.cookies.access_token` validates).
- `GET /resources/:slug/thanks?token=...` → "Your downloads are ready" page with one button per format the resource supports (MD always; PDF and HTML if typeset is enabled, with a "we'll email it when it's ready" affordance otherwise).

These three are mounted in `index.ts` alongside `blogSsrRouter` and `compareSsrRouter` and use the same CSP headers and `setSsrHeaders` helper. Add the resource pages to `sitemap.xml`.

### New API routes: `routes/resources/index.ts`

Mounted under `/api/resources`:

- `POST /api/resources/:slug/request` — body `{ email, consentNewsletter, ...utm }`. Captures the lead, issues a token, sends the "Your downloads" email through the existing email-template system, and returns `{ token }` for the success redirect. Rate-limited (5 / hour / IP). Honeypot field (`website` or similar) must be empty.
- `GET /api/resources/:slug/download/:format` — accepts either a valid session cookie or `?token=...`. Calls `resource-delivery.service.deliverFormat(...)` and streams the result with the right Content-Type and Content-Disposition headers. Records a row in `gated_resource_downloads` and increments the resource's download counter. Returns 503 with a friendly JSON body if a non-MD format is requested while `TYPESET_ENABLED=false`.

### Admin endpoints: `routes/admin/resources.ts`

Super-admin only:

- `GET /api/admin/resources` — list with stats (downloads per format, leads captured)
- `POST /api/admin/resources` — create
- `PATCH /api/admin/resources/:id` — edit metadata and publish toggle
- `POST /api/admin/resources/:id/regenerate` — manual cache bust (e.g. after editing the source MD outside the system)
- `GET /api/admin/resources/:id/leads` — paginated list of captured emails for CSV export

### Email template

New system template seeded in a migration after `065_seed_domain_verified_email_template.sql` style:

- Slug: `gated_resource_delivery`
- Subject: `Your {{resource_title}} download is ready`
- Body: Brand-styled MJML with one button per available format (MD always, PDF and HTML when typeset is enabled). Footer mentions: "You received this because you requested {{resource_title}} from kritano.com." Unsubscribe link via the existing `email-preference` system.

### CRM trigger integration

Capturing a lead fires a new event into `crm-trigger.service.ts`:

- Event: `gated_resource_downloaded`
- Payload: `{ resource_slug, resource_title, category }`

The existing trigger engine can then start a nurture sequence (admin-configurable). This requires no new code in the trigger engine itself; it just gets a new event source.

### Lead scoring integration

`lead-scoring.service.ts` is updated to award points for `gated_resource_downloaded`. Suggested scoring:

- First download: +10 points
- Each additional download: +3 points
- Download of a P0 resource: +5 bonus points (intent signal)

These are configured in the existing lead-scoring table, not hard-coded.

### Linking a captured lead to a future user

When a user registers (`auth/register`), after the user row is created we run a single update that ties any matching `gated_resource_leads` rows to their new user ID:

```sql
UPDATE gated_resource_leads
SET user_id = $1
WHERE email_normalised = LOWER(TRIM($2))
  AND user_id IS NULL;
```

The user's existing pre-signup downloads then surface in their account history.

### Cookie consent

A captured email is only used for the requested download and the optional newsletter. The form has:

- A "Send me my download by email and let me know when Kritano publishes new audits" checkbox, defaulting OFF, with explicit consent text.
- A one-line note: "We use your email only to deliver this resource and, if you opt in, our newsletter. Read our [Privacy Policy](/privacy)."

The consent decision is logged via the existing `consent.service.ts`.

## Frontend Changes

There are no React routes for the resource pages themselves; they are SSR. The only React work is the admin CMS and one in-product placement.

### SSR templates (in `resources-ssr.service.ts`)

Three templates, all using the existing `htmlShell` from `ssr-shared.service.ts`:

- **List page** (`/resources`): hero with library positioning, grouped grid (by category), available-formats badge per card, download-count micro-stat.
- **Detail page** (`/resources/:slug`): hero with the resource title, hook, audience, page count; below it a two-column layout. Left: preview content rendered from `preview_md`. Right (sticky): format chooser + email form, or for logged-in users the direct download buttons. Non-MD formats render with a "Render in progress" hint when typeset is disabled, instead of failing on click.
- **Thanks page** (`/resources/:slug/thanks`): confirmation, one button per available format, "we also emailed you these links", and a "Browse the rest of the library" link back to `/resources`.

All three pages carry JSON-LD: `LearningResource` schema, `BreadcrumbList`, and on the list page `ItemList` listing the resources.

### Brand checklist (per CLAUDE.md `BRAND_GUIDELINES.md`)

- Primary CTA: `bg-indigo-600 hover:bg-indigo-700 text-white`
- Secondary CTA: `bg-white border-slate-200 text-slate-700 hover:bg-slate-50`
- Cards: `bg-white border border-slate-200 rounded-lg shadow-sm p-6`
- Focus: `ring-2 ring-indigo-500/20 border-indigo-500`
- Display headings: Instrument Serif
- Body: Outfit
- Code: JetBrains Mono
- No em dashes or smart quotes in any rendered content
- No Tailwind arbitrary classes anywhere in SSR (per memory: blog SSR has had problems with this)

### Admin UI (`client/src/pages/admin/`)

Add `ResourcesAdminPage.tsx` listing all resources with: title, slug, published toggle, downloads (lifetime, last 30 days), leads captured, regenerate button, edit button. Edit page allows updating metadata, preview MD, description, and uploading a new source MD file.

This admin page lives behind `AdminRoute` and reuses the existing admin layout patterns (similar to the existing admin email template editor).

### In-product placements

The empty-state of `client/src/pages/dashboard/` gets a "Free resources" card linking to `/resources`. The dashboard has access to the user session, so the card links straight to the resource detail page; downloads happen with one click.

Other in-product placements (per `gated_resources.md`) are P1 and can be added in a follow-up PR.

### Blog SSR integration

`blog-ssr.service.ts` gets a single addition: an end-of-post anchor card rendered before the related-posts block. The card shows the primary anchor resource for the post's category, pulled from a small in-code map (initially) and later from the `gated_resources` table (an optional `is_primary_anchor_for_category` flag on resources).

This is a one-function addition (`renderResourceAnchor(post)`) and one call site in `renderBlogPost`. It changes nothing about how posts are authored.

## Critical Files Summary

### New files

| Path | Purpose |
|------|---------|
| `server/src/db/migrations/111_gated_resources.sql` | Schema for resources, leads, tokens, downloads |
| `server/src/db/migrations/112_seed_gated_resource_email_template.sql` | Delivery email template |
| `server/src/services/gated-resource.service.ts` | Lifecycle: list, get, capture, validate, record |
| `server/src/services/resource-delivery.service.ts` | Resolves the bytes for a `(resource, format)` request: MD direct, PDF/HTML via typeset with disk cache |
| `server/src/services/resources-ssr.service.ts` | SSR template renderers for list, detail, thanks |
| `server/src/services/typeset.service.ts` | Client for `typeset.chrisgarlick.com` (feature-flagged, stubbed for MVP) |
| `server/src/routes/resources-ssr.ts` | SSR route handlers wired to `resources-ssr.service.ts` |
| `server/src/routes/resources/index.ts` | API: request + download |
| `server/src/routes/admin/resources.ts` | Admin CRUD and lead export |
| `server/src/data/resources/<slug>/source.md` | Source MD files for each P0 resource |
| `server/src/types/gated-resource.types.ts` | Shared types |
| `client/src/pages/admin/ResourcesAdminPage.tsx` | Admin CMS |
| `client/src/pages/admin/ResourceEditPage.tsx` | Edit + preview |

### Modified files

| Path | Change |
|------|--------|
| `server/src/index.ts` | Mount `resourcesSsrRouter`; add resources to sitemap |
| `server/src/routes/index.ts` | Mount `/api/resources` and `/api/admin/resources` |
| `server/src/services/blog-ssr.service.ts` | Add `renderResourceAnchor` call before related-posts |
| `server/src/services/lead-scoring.service.ts` | Recognise `gated_resource_downloaded` event |
| `server/src/services/crm-trigger.service.ts` | Add event source (no logic change, just a new emitter call site) |
| `server/src/services/auth/register.ts` (or equivalent) | Link existing leads to new user on registration |
| `server/.env.example` | Add `TYPESET_BASE_URL`, `TYPESET_API_KEY`, `TYPESET_ENABLED` |
| `docs/TIERS.md` | Add row: "Free resources library: Yes / Yes / Yes / Yes / Yes" |
| `client/src/pages/dashboard/...` | Empty-state resource card |
| `client/src/App.tsx` | Add admin route for resources CMS |

### Untouched but worth noting

- `server/src/services/pdf-report.service.ts`: completely unrelated to this feature now. Audit PDFs continue to use Playwright in-process; resource PDFs go to typeset. The two pipelines stay independent.
- `server/src/services/email-template.service.ts`: no code changes, we just add a new template via migration.
- Audit export pipeline: untouched. Per CLAUDE.md, "new features should appear on any export." Gated resources are not audit data, so they do not belong on audit exports. Worth confirming in code review.

## Testing Plan

Vitest for backend, Playwright for the SSR smoke tests. No new e2e harness needed.

### Unit tests

- `gated-resource.service.spec.ts`:
  - `captureEmailAndIssueToken` deduplicates by `email_normalised + resource_id`
  - Token generation is 32 bytes, base64url, unique per call
  - `validateToken` rejects expired tokens, wrong-resource tokens, deleted leads
  - `recordDownload` increments the resource counter and writes an audit row
- `resource-delivery.service.spec.ts`:
  - MD: returns the source file with `text/markdown` and `<slug>.md` filename
  - PDF/HTML with typeset enabled: calls `typesetClient.render` once, caches the response, second call returns the cached file without a second typeset call
  - PDF/HTML with typeset disabled: raises `TypesetNotConfiguredError`
  - Unknown format: raises `UnsupportedFormatError`
  - Bumping the source content_hash invalidates the cache (new request triggers a fresh typeset call)
- `typeset.service.spec.ts`:
  - Reads env vars; throws cleanly when disabled
  - Builds the right request payload and headers
  - Maps non-2xx responses to `TypesetRenderError`
  - Respects the 30s timeout

### Integration tests

- `POST /api/resources/:slug/request`:
  - Valid request: returns token, writes lead, writes consent record, sends email
  - Honeypot tripped: returns 200 but writes nothing (silent fail to discourage scrapers)
  - Rate limit: 6th request from same IP within an hour returns 429
  - Disposable email domain: 400 with a friendly message
- `GET /api/resources/:slug/download/:format`:
  - Valid token, MD: 200 with `text/markdown`
  - Valid token, PDF or HTML with typeset enabled: 200 with the right MIME type
  - Valid token, PDF or HTML with typeset disabled: 503 with JSON `{ status: 'preparing', emailWhenReady: true }`
  - Expired token: 401
  - Wrong-resource token: 403
  - Logged-in user, no token: 200 (uses session)
  - Unknown format: 400
- Admin endpoints behind `requireSuperAdmin` middleware

### SSR smoke tests (Playwright)

- `/resources` renders, lists all published resources, no console errors, no broken images
- `/resources/<p0-slug>` renders, preview content visible, format chooser visible
- Logged-out flow: submit valid email, redirect to `/resources/<slug>/thanks?token=...`, the MD download link works
- Logged-in flow: format buttons are direct download links, no form
- With `TYPESET_ENABLED=false`: PDF/HTML buttons show the "render in progress" affordance and the API returns 503
- JSON-LD validates against schema.org (parse with `jsonld` package)

### Manual QA

- Confirm the MD download opens cleanly in iA Writer, Obsidian, and VS Code, with no front-matter cruft
- Confirm the email delivers with the working MD link (test domain, prod-like setup)
- Confirm cookie consent log records the capture
- Confirm a registered user who previously downloaded as a lead has their downloads linked
- Confirm the CRM trigger fires once per first-time email and starts the nurture sequence
- Once typeset ships HTML/PDF: re-test the same flows with `TYPESET_ENABLED=true` and confirm rendered output matches brand

## Implementation Order

Numbered milestones, each ending in something that can be tested and reviewed independently.

1. **Schema + types + seed.** Migration 111, types, an empty seed entry for the Website Health Checklist (placeholder source MD). Migration runs cleanly on a fresh DB.
2. **Delivery pipeline (MD-only path).** `resource-delivery.service.ts` resolves and streams the MD source. `typeset.service.ts` exists as a stub returning `TypesetNotConfiguredError`. Unit tests cover both paths and the typeset disabled case.
3. **Service layer.** `gated-resource.service.ts` with lead capture, token, validate, record. Unit tests pass.
4. **API routes.** `/api/resources/:slug/request` and `/api/resources/:slug/download/:format`. Integration tests pass. Rate limit, honeypot, disposable-email check wired up. PDF/HTML routes return 503 cleanly while typeset is disabled.
5. **SSR pages.** `/resources`, `/resources/:slug`, `/resources/:slug/thanks`. Branded, accessible (axe-clean), JSON-LD validated. Sitemap updated. Format buttons render the "preparing" state when typeset is off.
6. **Email template.** Migration 112 seeds the delivery template. Manual send test through admin "send test email" flow.
7. **Auth + lead linking.** Update register flow to link existing leads. Test: capture email anonymously, then register with the same email, verify link.
8. **Lead-scoring + CRM trigger integration.** New event source, points configuration, nurture sequence template (re-use existing nurture infra; this is content work, not code work).
9. **First real resource content.** Author the Website Health Checklist as MD, flip published flag. End-to-end smoke test on staging.
10. **Admin UI.** ResourcesAdminPage, edit page, lead CSV export. Behind AdminRoute.
11. **Blog anchor cards.** `renderResourceAnchor` in blog SSR. Test on a published blog post in each category.
12. **Tiers doc + dashboard empty-state card.** Final polish.
13. **Remaining four P0 resources.** Content work; the system is content-ready by milestone 9.
14. **Typeset go-live.** Once typeset.chrisgarlick.com ships PDF + HTML, fill in `typeset.service.ts`, set `TYPESET_ENABLED=true`, confirm the cache is populating on first request. No code in any other file should need to change.

Milestones 1 through 5 are the core deliverable; everything from milestone 6 onward can be shipped incrementally. Milestone 14 is the future-typeset switch.

## Security Notes (Per CLAUDE.md "Security is a must")

- Tokens are 256-bit random, base64url, stored as the primary key, never logged.
- IPs are hashed with a per-environment pepper before being written to any table.
- The download endpoint never reflects user input (slug and format are matched against a closed set; the file path is derived from the resource record, never from the URL).
- Static file serving uses `res.sendFile` with the resolved absolute path inside `uploads/resources/`, with a containment check (`path.resolve` and `startsWith` on the resolved upload root) to prevent path traversal even though no user input feeds the path.
- The admin endpoints require `requireSuperAdmin` (existing middleware).
- The CSP header from `setSsrHeaders` is reused for resource pages; no inline scripts on SSR pages.
- The lead capture form uses the existing CSRF token middleware.
- Disposable email block uses a static list (committed in repo) plus an optional MX-lookup check, both behind a feature flag.

## Open Questions for Review

1. Do we want a public download-count badge on each resource card, or is that better hidden until volume is meaningful?
2. When the user clicks a PDF/HTML button while typeset is disabled, do we (a) show "preparing, we'll email when ready" and queue an email, or (b) hide those buttons entirely and only surface MD? Recommend (a) because it lets us measure latent demand for non-MD formats during the typeset rollout.
3. The CRM trigger nurture sequence is content, not code. Who owns writing the 3-email sequence per P0 resource?
4. Should resource preview MD be auto-extracted (first N words of source) or hand-curated per resource? Recommend hand-curated, because the first 30% of a checklist is the table of contents and the first 30% of a guide is the intro; auto-extraction sells the resource poorly.
5. What is the typeset request/response contract going to look like? Once you have a draft, paste it into `typeset.service.ts`'s docstring and the rest of the system fits around it without further changes.
