# Gated Resources — Integration Guide

A handoff document for adding email-gated resource downloads with branded
PDF/DOCX rendering to another project. Based on what's actually shipping on
chrisgarlick.com, including all the dead ends and gotchas worth skipping.

The stack assumed: Kritano CMS + Astro (static output) + Bun/Hono server +
Postgres + Resend for email + Typeset for PDF/DOCX rendering. Where the
patterns translate cleanly to other stacks the parts are flagged.

---

## What this gives you

Visitors:

1. Browse a list of free resources at `/resources`.
2. Click into a resource detail page.
3. Enter their email + optional name/company/sector + GDPR consent.
4. Get a magic-link email + redirect to a thanks page with download buttons.
5. Pick **PDF**, **DOCX**, or **Markdown** — the file downloads to their device.
6. On future visits to *any* resource on the same device, the email gate
   is skipped (90-day HttpOnly cookie). The magic link in the email also
   works on a different device for 7 days.

You (the operator):

1. Author each resource as a markdown document (with YAML frontmatter) in
   the CMS. Frontmatter drives PDF metadata (title, author, date, etc.).
2. Set a `typesetClient` field on each resource to pick a branded theme.
3. Every download is logged with format + IP. Each lead is a row in
   `resource_leads` (unique by email, never downgrades marketing consent),
   visible in admin under `forms/resource-gate/submissions` *and*
   queryable as a typed list via SQL.
4. PDF/DOCX are rendered on first request, then cached on disk by
   content hash. Subsequent clicks serve from cache.

---

## High-level architecture

```
                ┌─────────────────────────────────────────────────────────┐
                │  CMS  (Kritano — Postgres + admin SPA)                  │
                │    • resource collection (content + branding pointer)   │
                │    • resource_leads, resource_downloads tables          │
                │    • forms/resource-gate (admin-visible submissions)    │
                └────────────────────┬────────────────────────────────────┘
                                     │
                  Astro static build │ reads at build time → /resources/*
                                     ▼
                ┌─────────────────────────────────────────────────────────┐
                │  Static frontend (Astro)                                │
                │    • /resources                  — listing              │
                │    • /resources/<slug>           — detail + gate        │
                │    • /resources/<slug>/thanks    — post-submit picker   │
                │    • ResourceGate.astro          — email modal          │
                │    • FormatPicker.astro          — download buttons     │
                └────────────────────┬────────────────────────────────────┘
                                     │
              POST /api/resources/   │ GET /api/resources/<slug>/download
              request                │
                                     ▼
                ┌─────────────────────────────────────────────────────────┐
                │  API server  (Hono on Bun, in server.ts)                │
                │    • upsert lead, sign HMAC token, set cookie           │
                │    • send delivery email + internal notification        │
                │    • validate token on download                         │
                │    • call typeset.<your-domain>/api/render for PDF/DOCX │
                │    • cache rendered bytes on disk by SHA-256            │
                └────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
                ┌─────────────────────────────────────────────────────────┐
                │  Typeset (separate service — typeset.<your-domain>)     │
                │    • Markdown → PDF / DOCX                              │
                │    • Brand profiles (cover + body styling)              │
                └─────────────────────────────────────────────────────────┘
```

---

## Step-by-step integration

### 1. CMS schema

Add a `resource` collection. The shape that turned out to work:

```ts
defineCollection('resource', {
  fields: {
    title:         text().required(),
    slug:          slug().from('title'),

    // What you read in admin to know what this is.
    summary:       textarea().maxLength(300),   // shown on the listing card
    description:   richText(),                  // shown on the detail page

    // The actual content — markdown with YAML frontmatter at the top.
    // Sent verbatim to typeset; downloaded as-is when format=md.
    markdownBody:  textarea(),

    // Which typeset brand profile this resource renders with.
    // Editable per-resource so you can theme different assets differently.
    typesetClient: text().nullable(),

    // Filtering / sorting / categorisation.
    sector:        select(['All', 'Legal', 'Accountancy', 'Agency']).default('All'),
    tier:          select(['1', '2', '3']).default('1'),
    funnelStage:   select(['TOFU', 'MOFU', 'BOFU']).default('TOFU'),
    coverImage:    media(),

    // If a hand-authored DOCX exists at public/resources/<slug>/<slug>.docx
    // (e.g. an editable policy template), set hasDocx=yes and the download
    // endpoint serves that file directly instead of asking typeset to render.
    hasDocx:       select(['no', 'yes']).default('no'),

    relatedArticles: text().nullable(),         // comma-sep slugs of related blog posts
    sortOrder:     number(),
    status:        select(['draft', 'published']).default('draft'),
    seo:           seoBlock(),
  },
}),
```

Also declare the gate form at the top of `cms.config.ts` so submissions
show up in `/admin/forms/resource-gate`:

```ts
addForm('resource-gate', {
  name: 'Resource gate',
  fields: [
    { name: 'email',            type: 'email',    label: 'Email',          required: true },
    { name: 'firstName',        type: 'text',     label: 'First name' },
    { name: 'company',          type: 'text',     label: 'Company' },
    { name: 'sector',           type: 'select',   label: 'Sector', options: ['Legal', 'Accountancy', 'Agency', 'Other'] },
    { name: 'marketingConsent', type: 'checkbox', label: 'Marketing consent' },
    { name: 'resourceSlug',     type: 'text',     label: 'Resource', required: true },
  ],
})
```

### 2. Database tables for lead/download tracking

These tables aren't CMS collections — they're for state that doesn't
need to be CMS-editable. Create them inline at server boot using the
same pattern as Kritano's other auto-created system tables:

```ts
// server.ts, after createServer(config)
const sql = getClient()

sql`
  CREATE TABLE IF NOT EXISTS resource_leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    first_name text,
    company text,
    sector text,
    source_slug text,                            -- which resource they first hit
    marketing_consent boolean NOT NULL DEFAULT false,
    ip text,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`.catch((err) => console.warn('[Resources] resource_leads setup:', err))

sql`
  CREATE TABLE IF NOT EXISTS resource_downloads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES resource_leads(id) ON DELETE CASCADE,
    resource_slug text NOT NULL,
    format text NOT NULL,                        -- md | pdf | docx
    ip text,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`.catch((err) => console.warn('[Resources] resource_downloads setup:', err))

sql`CREATE INDEX IF NOT EXISTS resource_downloads_slug_idx ON resource_downloads (resource_slug)`
  .catch((err) => console.warn('[Resources] index setup:', err))
```

> **Why three sources of truth?** `resource_leads` is the canonical per-person
> state (upserted by email). `resource_downloads` tracks each format click for
> analytics. `form_submissions` (Kritano's standard form storage) is what the
> admin form UI displays. The gate writes to all three. They serve different
> consumers and don't fight each other because the gate writes once per submit.

### 3. The HMAC-token machinery

The gate doesn't use a real auth system — it uses a signed cookie. This
removes the need for accounts but still lets you say "this device has
already given us their email."

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'

const TOKEN_SECRET = process.env.RESOURCE_TOKEN_SECRET || process.env.JWT_SECRET || 'dev-secret-change-me'
const COOKIE_NAME = 'cg_lead'                    // HttpOnly, server-only
const COOKIE_FLAG = 'cg_lead_flag'               // readable by JS, used by detail page to decide whether to show gate
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90         // 90 days
const EMAIL_TOKEN_TTL = 60 * 60 * 24 * 7         // magic link valid 7 days
const COOKIE_TOKEN_TTL = 60 * 60 * 24 * 90       // cookie token valid 90 days

function b64url(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf) : buf
  return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

function signToken(leadId: string, ttlSeconds: number): string {
  const payload = { l: leadId, e: Math.floor(Date.now() / 1000) + ttlSeconds }
  const body = b64url(JSON.stringify(payload))
  const sig = createHmac('sha256', TOKEN_SECRET).update(body).digest()
  return `${body}.${b64url(sig)}`
}

function verifyToken(token: string | undefined | null): { leadId: string } | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = createHmac('sha256', TOKEN_SECRET).update(body).digest()
  const provided = b64urlDecode(sig)
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null
  try {
    const payload = JSON.parse(b64urlDecode(body).toString('utf8'))
    if (typeof payload.l !== 'string' || typeof payload.e !== 'number') return null
    if (payload.e < Math.floor(Date.now() / 1000)) return null
    return { leadId: payload.l }
  } catch { return null }
}
```

> **Important**: the token contains *only* the lead id and expiry — no slug.
> That means once a visitor has gated for *any* resource, they can download
> *every* resource without re-gating. If you want per-resource gating, add
> the slug to the payload and check it in the download handler. The
> all-access default is the right UX for a binge-able resource library.

The dual-cookie trick: the *server* trusts only the HttpOnly `cg_lead`
cookie. But the static HTML page can't read HttpOnly cookies to decide
whether to show the gate. So we also set a readable `cg_lead_flag=1`
cookie — it carries no auth weight, just signals "this device has
already gated, skip the form."

### 4. The two API endpoints

#### `POST /api/resources/request` — gate submit

```
Request body:
{
  "slug": "<resource-slug>",
  "email": "you@example.com",
  "firstName": "Jane",            // optional
  "company": "Acme LLP",          // optional
  "sector": "Legal",              // optional
  "marketingConsent": false,
  "_hp": ""                       // honeypot — if non-empty, silently 200
}

Response (success):
{ "ok": true, "redirect": "/resources/<slug>/thanks?t=<emailToken>" }
Set-Cookie: cg_lead=<cookieToken>; HttpOnly; Path=/; Max-Age=7776000; SameSite=Lax; Secure
Set-Cookie: cg_lead_flag=1; Path=/; Max-Age=7776000; SameSite=Lax; Secure
```

Server flow:
1. Rate-limit by IP (5/hour, simple in-memory `Map`).
2. Validate email shape + slug format (`^[a-z0-9-]+$` to prevent traversal).
3. Upsert into `resource_leads` by email. Critically: **never downgrade
   marketing consent from `true` to `false`** — use `marketing_consent =
   resource_leads.marketing_consent OR EXCLUDED.marketing_consent` in
   ON CONFLICT. If a user submits a second time and unticks the box, the
   original consent stands.
4. Mirror into `form_submissions` for admin visibility (see step 1).
5. Sign two tokens (email = 7d, cookie = 90d).
6. Send delivery email to lead (magic link to thanks page).
7. Send internal notification to your `CONTACT_EMAIL`.
8. Set both cookies.
9. Return JSON with redirect URL.

> **GDPR / PECR note (UK):** the download delivery email is a *transactional*
> response to a request, so it goes regardless of `marketingConsent`. Only
> add to a newsletter list if `marketingConsent === true`. The modal copy
> should be clear that the consent checkbox is for marketing, not for
> receiving the requested file.

#### `GET /api/resources/:slug/download?format=md|pdf|docx[&t=<token>]`

Server flow:
1. Validate `slug` format.
2. Look up the auth token — query string `?t=...` first, then `cg_lead`
   cookie. Either is valid. Querystring auth is for magic-link arrivals
   on a different device.
3. For DOCX: if `public/resources/<slug>/<slug>.docx` exists (hand-authored),
   serve that. Otherwise fall through to typeset.
4. Read `markdown_body` + `typeset_client` from the resource row.
5. Log to `resource_downloads`.
6. Refresh cookies (extends 90-day window).
7. For `md`: stream the markdown body as `text/markdown` with
   `Content-Disposition: attachment`.
8. For `pdf`/`docx`: call typeset (see below), stream the result.

### 5. Typeset integration — the actual hard-won bit

Typeset takes markdown + a brand profile slug and returns a styled
PDF/DOCX. The contract:

```
POST https://typeset.<your-domain>/api/render
Authorization: Bearer <TYPESET_API_KEY>
Content-Type: application/json

{
  "document_type": "general",                 // logging only, accepts a fixed enum
  "format":        "pdf"  or  "docx",
  "client":        "<brand-profile-slug>",    // optional; defaults to typeset's plain default
  "content":       "---\ntitle: ...\n---\n# Body...\n"
}

Response:
200 OK, raw bytes (application/pdf or DOCX mime)
Content-Disposition: attachment; filename="document.<ext>"
```

The renderer logic:

```ts
import { createHash } from 'node:crypto'
import { resolve, join } from 'node:path'
import { mkdirSync } from 'node:fs'

const TYPESET_API_URL = process.env.TYPESET_API_URL || 'https://typeset.<your-domain>'
const TYPESET_API_KEY = process.env.TYPESET_API_KEY
const TYPESET_CACHE_DIR = resolve(import.meta.dir, '.cache/typeset')
try { mkdirSync(TYPESET_CACHE_DIR, { recursive: true }) } catch {}

async function renderViaTypeset(opts: {
  slug: string
  markdown: string
  format: 'pdf' | 'docx'
  client?: string | null
}) {
  if (!TYPESET_API_KEY) return { ok: false as const, status: 503, error: 'rendering not configured' }

  // Cache key includes the client slug — switching brands invalidates the cache.
  const clientKey = opts.client || ''
  const hash = createHash('sha256')
    .update(`${opts.slug}|${opts.format}|${clientKey}|${opts.markdown}`)
    .digest('hex').slice(0, 16)
  const cachePath = join(TYPESET_CACHE_DIR, `${opts.slug}-${opts.format}-${hash}.${opts.format}`)

  const cached = Bun.file(cachePath)
  if (await cached.exists()) return { ok: true as const, bytes: await cached.arrayBuffer() }

  const body: Record<string, unknown> = {
    document_type: 'general',
    format: opts.format,
    content: opts.markdown,
  }
  if (opts.client) body.client = opts.client

  const res = await fetch(`${TYPESET_API_URL}/api/render`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TYPESET_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`[Typeset] ${res.status}: ${text.slice(0, 300)}`)
    return { ok: false as const, status: 502, error: 'render failed' }
  }

  const bytes = await res.arrayBuffer()
  Bun.write(cachePath, bytes).catch(() => {})
  return { ok: true as const, bytes }
}
```

> **Cache invalidation:** the cache key is a hash of slug + format + client
> slug + full markdown body. When *any* of those change, the hash changes,
> the cache misses, and a fresh render happens. No TTL needed. Old hashes
> accumulate on disk over time — periodic cleanup is fine but rarely urgent.

### 6. Typeset brand profiles — the mental model

This is the part that took the longest to get right. The renderer treats
the **cover page** and the **body pages** as two independently-styled zones:

| Field | Where it shows up |
|---|---|
| `colour_primary` | H1 headings + body-page accents |
| `colour_secondary` | H2 headings |
| `colour_accent` | Accent rules under H1, list bullets, links |
| `colour_text` | Body text on body pages (must contrast with `colour_background`) |
| `colour_background` | Body page background |
| `cover_bg_colour` | Cover page background only |
| `cover_text_colour` | Cover title, subtitle, metadata (must contrast with `cover_bg_colour`) |
| `colour_table_header` / `_border` / `colour_callout_bg` | Tables and callouts on body pages |

The trap that ate hours: I tried to make a "dark theme" by setting
`colour_background: #1A1715` (dark) + `colour_text: #FAF8F5` (cream),
expecting *every* page to be dark. Body pages stayed white. Then I tried
adding `client: ...` in the markdown's YAML frontmatter — typeset's
frontmatter only takes `title/subtitle/recipient/date/author/document_type`
and **does not** drive the `client` field. The client slug must be in
the API body's top-level `client` field, not in frontmatter.

The mental model that works:

```
Cover  = cover_bg_colour  + cover_text_colour       (your "hero" zone)
Body   = colour_background + colour_text + colour_primary  (your "reading" zone)
Cover and body do NOT need to be visually consistent — they can be opposites.
```

So for an editorial dark-cover/light-body look:

```yaml
slug: "your-brand"
name: "Your Brand"

# Body pages — light, readable
colour_background: "#FAF8F5"
colour_text:       "#1A1715"
colour_primary:    "#B5522F"   # H1
colour_secondary:  "#9E4828"   # H2
colour_accent:     "#B5522F"   # rules, bullets, links

# Cover — dark, dramatic
cover_enabled:     true
cover_template:    bold        # "minimal" does NOT do the full-bleed fill
cover_bg_colour:   "#1A1715"
cover_text_colour: "#B5522F"

# Tables / callouts
colour_table_header: "#F3F0EB"
colour_table_border: "#E8E4DE"
colour_callout_bg:   "#FDF0EC"

# Type
font_heading:      "Instrument Serif"
font_body:         "IBM Plex Mono"
font_mono:         "IBM Plex Mono"
font_size_base:    11
font_size_h1:      28
font_size_h2:      18
font_size_h3:      13
line_height:       1.65

# Page
page_size:         A4
margin_top:        26
margin_bottom:     26
margin_left:       26
margin_right:      26
header_enabled:    true
footer_enabled:    true
```

Push to typeset with `POST /api/clients` (idempotent — same slug = upsert):

```bash
curl -X POST https://typeset.<your-domain>/api/clients \
  -H "Authorization: Bearer $TYPESET_API_KEY" \
  -H "Content-Type: application/json" \
  -d @brand.json
```

Verify it's accessible to the render endpoint:

```bash
# Should return your brand record (not 404, not [])
curl -H "Authorization: Bearer $TYPESET_API_KEY" \
  "https://typeset.<your-domain>/api/clients/your-brand"
```

If you get `404 not found` on the GET despite a successful POST, typeset
may have an auth-scoping bug between its create and read paths (we hit
this — the create call stored under `user_id=null` while reads scoped to
the API key's UUID). Fix on the typeset side: ensure `POST /api/clients`
extracts `user_id` from the auth middleware the same way `GET` /
`POST /api/render` do.

### 7. Markdown authoring convention

Every resource's `markdownBody` should start with a YAML frontmatter
block. The keys typeset reads:

```markdown
---
title: The Document Title
subtitle: A descriptive subtitle
author: Chris Garlick
date: 2026-05-12
document_type: brief
---

# The Document Title

Lede paragraph...
```

Notes worth memorising:

- Typeset's frontmatter parser is single-line `key: value` only. **No
  nested structures, no arrays, no multi-line strings.** Quotes are
  optional, stripped if present.
- `document_type` in frontmatter is informational; it doesn't change
  rendering. Valid values: `proposal | report | brief | sop | invoice |
  general`.
- The body H1 (`# Title`) does *not* automatically suppress when
  `title:` is set in frontmatter. The frontmatter title shows on the
  cover; the H1 shows in the body. Either keep both (cover is title,
  body H1 is title repeated as section start) or omit the H1 and start
  with a lede paragraph.
- Each `## H2` in the body triggers a **page break** before it. Plan
  your structure around that — don't use H2s as decorative section
  labels mid-flow. Use bold paragraphs or H3 for inline grouping. If
  you want a TOC on the same page as the H1+lede, render it as a bold
  paragraph block, not an H2 section.

### 8. The frontend (Astro components)

Four Astro files, plus one nav update:

- `src/pages/resources/index.astro` — listing page, filters by sector.
- `src/pages/resources/[slug].astro` — detail page, renders the gate
  modal by default; JS reveals the format picker if `cg_lead_flag` cookie
  is present.
- `src/pages/resources/[slug]/thanks.astro` — landing for magic-link
  arrivals; reads `?t=<token>` from URL and injects it into the format
  picker's download URLs.
- `src/components/ResourceGate.astro` — the email form (email, name,
  company, sector, consent, honeypot). Posts to `/api/resources/request`.
- `src/components/FormatPicker.astro` — buttons for PDF, DOCX, MD.

Cookie-reveal pattern on the detail page:

```html
<script>
  function hasLeadFlag() {
    return document.cookie.split(';').some((c) => c.trim().startsWith('cg_lead_flag='))
  }
  if (hasLeadFlag()) {
    document.getElementById('gate-container')?.classList.add('hidden')
    document.getElementById('picker-container')?.classList.remove('hidden')
  }
</script>
```

Token injection pattern on the thanks page (for magic-link arrivals):

```html
<script>
  const token = new URLSearchParams(window.location.search).get('t')
  if (token) {
    document.querySelectorAll('[data-format-picker] a[data-format]').forEach((el) => {
      const url = new URL(el.href, window.location.origin)
      url.searchParams.set('t', token)
      el.href = url.toString()
    })
  }
</script>
```

### 9. Email templates (Resend)

Two transactional emails per submit:

**Delivery email** — to the lead:

> Subject: `Your download: <Resource Title>`
> Body: short thanks, single CTA button to the thanks page (`/resources/<slug>/thanks?t=<emailToken>`), note that the link works for 7 days.

**Internal notification** — to your `CONTACT_EMAIL`:

> Subject: `Resource lead: <email> → <Resource Title>`
> Body: bullet list of email, name, company, sector, resource slug, marketing consent, IP.

The pattern is identical to a standard contact form notification — see
`server.ts` in this repo for working examples.

### 10. Env vars

```
# CMS / DB
DATABASE_URL=postgresql://...
JWT_SECRET=<32+ random chars>

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=Your Name <noreply@yourdomain.com>
CONTACT_EMAIL=your@inbox.com

# Resource gating
RESOURCE_TOKEN_SECRET=<32+ random chars>     # optional; falls back to JWT_SECRET

# Typeset
TYPESET_API_URL=https://typeset.<your-domain>
TYPESET_API_KEY=<shared-secret-token>
SITE_ORIGIN=https://www.<your-domain>
```

`TYPESET_CLIENT_SLUG` is **not** an env var — the brand is per-resource via
the CMS field. This is intentional: you can have different brands for
different assets, switch them in admin without a deploy, and add new
brands as you build them.

---

## Operational checklist

### Initial setup (one-off)

- [ ] Add `resource` collection + `addForm('resource-gate')` to
      `cms.config.ts`.
- [ ] Run `bun run migrate:create && bun run migrate` to create the
      `resources` table.
- [ ] Add `RESOURCE_TOKEN_SECRET` + `TYPESET_API_KEY` to `.env` (local
      and prod).
- [ ] Boot the server once to auto-create `resource_leads` and
      `resource_downloads` tables.
- [ ] Create at least one typeset brand profile via `POST /api/clients`
      (or commit a YAML and POST it once manually).

### Adding a new resource

1. In `/admin/resources` → New resource.
2. Fill: title, summary, description (for the detail page), markdownBody
   (with YAML frontmatter), sector, tier, funnelStage, typesetClient,
   sortOrder.
3. Publish.
4. Rebuild the static site (`bun run build`) and redeploy so the
   `/resources/<slug>` page exists. (API endpoints don't need rebuild —
   they're dynamic.)

### Smoke-test the full flow

```bash
# 1. POST a fake lead through the gate
curl -s -X POST https://www.<your-domain>/api/resources/request \
  -H 'Content-Type: application/json' \
  -d '{"slug":"<resource-slug>","email":"test@example.com","marketingConsent":false}' \
  -c /tmp/cookies.txt

# 2. Grab the token from the redirect URL in the response, then download:
curl -s "https://www.<your-domain>/api/resources/<slug>/download?format=pdf&t=<token>" \
  -o /tmp/test.pdf
file /tmp/test.pdf       # → "PDF document, version 1.x, N pages"

# 3. Confirm lead landed in admin
psql "$DATABASE_URL" -c "SELECT email, source_slug, marketing_consent FROM resource_leads ORDER BY created_at DESC LIMIT 5"
```

### Cache busting

Whenever a brand profile or markdown body changes:

```bash
rm -rf <project-root>/.cache/typeset/*
```

(Cache key includes content hash, so it *should* invalidate automatically
on body changes — but if you change a YAML in typeset's frontend without
touching the markdown, the cache won't know. Manual clear is the safe
move.)

---

## Lessons learned worth carrying over

1. **Resource collection table isn't created by `bun run migrate` alone.**
   You need `bun run migrate:create` first to diff the schema and emit
   the migration file. Add `"migrate:create": "cms migrate:create"` to
   `package.json` scripts. (Kritano CMS DX issue — known.)

2. **JWTs from Kritano admin login expire in ~60 minutes.** Don't rely
   on them for batch scripts. For one-off seed/update runs, mint a
   fresh token immediately before running. For ongoing automation, use
   the long-lived `API_KEY` — but note that **PATCH** via API key 500s
   on Kritano due to a UUID resolution bug; sticking to JWT for writes
   is the workaround until that's fixed.

3. **Kritano API responses are snake_case** (`markdown_body`,
   `typeset_client`) even when fields are declared camelCase in
   `cms.config.ts`. Inputs accept both, but reads need snake_case access.

4. **Astro static output requires a rebuild** after adding a new
   resource for the page to exist. The API works immediately. Plan for
   that delay (or move detail pages to SSR if you want zero-rebuild
   resource publishing).

5. **The admin UI ships pre-built in `@kritano/cms` now (post-fix), but
   `cms build` still rebuilds it unconditionally** — which can OOM on
   small VPS instances. For frontend-only deploys, run `bunx astro
   build` instead of `bun run build`, skipping the admin rebuild
   entirely.

6. **Typeset's `cover_template: minimal` does NOT do a full-bleed
   background fill.** Use `cover_template: bold` (or `full`, `dark`)
   for an edge-to-edge `cover_bg_colour`. The `minimal` template
   produces a frame-and-rules look instead.

7. **Typeset's `client` field belongs in the API body**, not in YAML
   frontmatter. Frontmatter `client:` is documented but silently
   ignored by the renderer. Pass `body.client = "<slug>"` on every
   `/api/render` call.

8. **PDF/DOCX cache key must include the client slug.** If you cache
   only by slug + format + markdown hash, swapping a resource's
   `typesetClient` won't invalidate the cache and you'll serve the old
   brand's render until manual cache clear.

9. **Inline `**bold**` and `*italic*` in typeset markdown render
   subtly.** If you need stronger visual hierarchy mid-paragraph,
   either use H3 (gets a page break — avoid for inline use) or use
   typographic conventions (colons, em-dashes, all caps short labels).

10. **`## H2` always page-breaks before the heading.** Don't use H2
    for in-flow section labels you want kept on the same page —
    bold-paragraph fakes it cleanly.

---

## File map

If you're porting this into a new project, these are the files to copy
or adapt:

```
cms.config.ts                                # add resource collection + addForm('resource-gate')
server.ts                                    # add the two API endpoints + the token helpers + table creates
src/pages/resources/index.astro              # listing page
src/pages/resources/[slug].astro             # detail page with gate + cookie reveal
src/pages/resources/[slug]/thanks.astro      # post-submit landing
src/components/ResourceCard.astro            # listing card
src/components/ResourceGate.astro            # email modal
src/components/FormatPicker.astro            # download buttons
src/components/Nav.astro                     # add a Resources link
public/resources/<slug>/<slug>.docx          # optional hand-authored DOCX overrides
```

That's the lot. Everything else (analytics, related-articles
cross-linking, lead admin UI, etc.) is downstream of this core.
