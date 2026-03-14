# PagePulser Blog & Content CMS

## 1. Purpose

A modular blog and content publishing system that serves two goals:

1. **SEO & Marketing** — Publish guides, case studies, and data-driven articles (e.g. "87% of sites we scan have broken Schema") to drive organic traffic to PagePulser
2. **Product Education** — Help users understand audit findings with in-depth articles linked directly from the dashboard

The blog is **public-facing** (no auth required to read) but **admin-authored** (only super admins can create/edit/publish content through the admin panel).

---

## 2. What Already Exists

| Capability | Status | Where |
|---|---|---|
| Admin auth + activity logging | Done | `requireSuperAdmin` middleware, `admin_activity_log` table |
| Brand guidelines (colors, typography, spacing) | Done | `/docs/BRAND_GUIDELINES.md` |
| PDF rendering via Playwright + Chromium | Done | `pdf-report.service.ts` |
| Tier-based branding (colors, logos, white-label) | Done | `pdf-branding.service.ts` |
| Email service (Resend) | Done | `email.service.ts` |
| Typography components (Display, Heading, Body) | Done | `client/src/components/ui/Typography/` |
| Global audit trend data (top issues across all users) | Done | `admin.service.ts` analytics queries |
| Asset type classification (image, video, doc, etc.) | Done | `asset.types.ts` |

**Not yet built:**

| Gap | Needed |
|---|---|
| File upload handling | Multer + storage backend |
| Image processing / optimization | Sharp (resize, WebP, thumbnails) |
| Markdown / rich text rendering | `react-markdown` + `rehype` plugins |
| Block editor UI | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Public content routes | `/api/blog/*` endpoints |
| Static file serving | `express.static` or S3/CDN |
| SEO meta tags for SPA | `react-helmet-async` |
| Sitemap generation | Dynamic `sitemap.xml` endpoint |
| HTML sanitization | `sanitize-html` on server |

---

## 3. Content Architecture

### 3.1 Block-Based Content Model

Every post is stored as an ordered array of typed blocks (not a single Markdown string). This enables drag-and-drop reordering, mixed layouts, and structured rendering for both web and PDF export.

#### Block Types

| Type | Description | Props |
|---|---|---|
| `text` | Rich text / Markdown content | `markdown: string` |
| `heading` | Section heading (H2-H4) | `text: string, level: 2 \| 3 \| 4` |
| `image` | Single image with caption | `src: string, alt: string, caption?: string, width?: 'full' \| 'wide' \| 'content'` |
| `two_column` | Side-by-side content | `left: Block[], right: Block[]` |
| `callout` | Highlighted tip/warning/info box | `type: 'tip' \| 'warning' \| 'info' \| 'example', title?: string, markdown: string` |
| `code` | Code snippet with syntax highlighting | `language: string, code: string, filename?: string` |
| `quote` | Blockquote with attribution | `text: string, attribution?: string` |
| `divider` | Horizontal rule | (none) |
| `embed` | YouTube/Vimeo embed | `url: string, caption?: string` |
| `cta` | Call-to-action button | `text: string, url: string, variant: 'primary' \| 'secondary'` |
| `stat_highlight` | Data callout (e.g. "87% of sites...") | `stat: string, description: string, source?: string` |
| `audit_link` | Link to a specific audit rule | `ruleId: string, customText?: string` |

#### Block Schema

```typescript
interface ContentBlock {
  id: string;           // UUID, generated client-side for drag-drop keys
  type: BlockType;
  props: Record<string, unknown>;  // type-specific, validated by Zod on save
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string;               // Plain text, max 300 chars, used in cards + meta description
  featured_image_url: string | null;
  featured_image_alt: string | null;
  content: ContentBlock[];       // The block array — source of truth
  category: PostCategory;
  tags: string[];
  author_id: string;             // References users.id (the admin who wrote it)
  author_name: string;           // Denormalized for display
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  seo_title: string | null;      // Override for <title> tag
  seo_description: string | null; // Override for meta description
  reading_time_minutes: number;
  created_at: string;
  updated_at: string;
}

type PostCategory =
  | 'seo'
  | 'accessibility'
  | 'security'
  | 'performance'
  | 'content-quality'
  | 'structured-data'
  | 'eeat'
  | 'aeo'
  | 'guides'
  | 'case-studies'
  | 'product-updates';

type BlockType =
  | 'text' | 'heading' | 'image' | 'two_column' | 'callout'
  | 'code' | 'quote' | 'divider' | 'embed' | 'cta'
  | 'stat_highlight' | 'audit_link';
```

### 3.2 Why Blocks Over Markdown

| Concern | Flat Markdown | Block Array |
|---|---|---|
| Drag-and-drop reorder | Impossible without parsing | Native — reorder array indices |
| Two-column layouts | Requires raw HTML hacks | First-class `two_column` block |
| Callout boxes | Non-standard extensions | Typed block with `callout` variant |
| Audit rule linking | Manual link construction | `audit_link` block with `ruleId` lookup |
| PDF export | Parse markdown back to HTML | Render blocks directly to HTML for Playwright |
| Structured data (schema.org) | Manual | Auto-generate `Article` schema from post metadata |
| Content validation | Regex at best | Zod schema per block type |

Markdown is still used _inside_ `text` blocks for inline formatting (bold, italic, links, lists). The block array is the structural layer; Markdown is the inline formatting layer.

---

## 4. Database Schema

### 4.1 Posts Table

```sql
-- Migration: 049_create_blog_posts.sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(200) UNIQUE NOT NULL,
  title VARCHAR(300) NOT NULL,
  subtitle VARCHAR(500),
  excerpt VARCHAR(500) NOT NULL,
  featured_image_url VARCHAR(1000),
  featured_image_alt VARCHAR(300),
  content JSONB NOT NULL DEFAULT '[]',
  category VARCHAR(30) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  author_id UUID NOT NULL REFERENCES users(id),
  author_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  seo_title VARCHAR(200),
  seo_description VARCHAR(400),
  reading_time_minutes INTEGER NOT NULL DEFAULT 1,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blog_posts_slug ON blog_posts (slug);
CREATE INDEX idx_blog_posts_status ON blog_posts (status, published_at DESC);
CREATE INDEX idx_blog_posts_category ON blog_posts (category) WHERE status = 'published';
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN (tags);
```

### 4.2 Media Library

```sql
-- Migration: 050_create_blog_media.sql
CREATE TABLE blog_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(300) NOT NULL,          -- original filename
  storage_key VARCHAR(500) UNIQUE NOT NULL, -- path in storage (local or S3)
  mime_type VARCHAR(100) NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  width INTEGER,                           -- for images
  height INTEGER,                          -- for images
  alt_text VARCHAR(300),
  thumbnail_key VARCHAR(500),              -- resized thumbnail path
  webp_key VARCHAR(500),                   -- WebP variant path
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blog_media_type ON blog_media (mime_type);
```

### 4.3 Post Revisions (Audit Trail)

```sql
-- Migration: 051_create_blog_revisions.sql
CREATE TABLE blog_post_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  title VARCHAR(300) NOT NULL,
  revision_note VARCHAR(200),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blog_revisions_post ON blog_post_revisions (post_id, created_at DESC);
```

Keep last 20 revisions per post. Older revisions are pruned by a nightly job.

---

## 5. File Upload & Image Processing

### 5.1 Storage Strategy

**Phase 1 (Local):** Store uploads in `server/uploads/blog/` served via `express.static`. Simple, no external dependencies.

**Phase 2 (S3/CDN):** Swap storage backend to S3-compatible storage (AWS S3, Cloudflare R2, or DigitalOcean Spaces). The service interface stays the same — only the storage adapter changes.

### 5.2 Upload Pipeline

```
Client uploads file
  -> POST /api/admin/cms/media (multer, 10MB limit)
  -> Validate: mime type allowlist (image/png, image/jpeg, image/webp, image/gif, image/svg+xml)
  -> Sharp processing:
      1. Original: strip EXIF, resize if > 2400px wide
      2. Thumbnail: 400x300 cover crop
      3. WebP: convert original to WebP (quality 80)
  -> Save all three variants to storage
  -> Insert row into blog_media
  -> Return { id, url, thumbnailUrl, webpUrl, width, height }
```

### 5.3 Implementation

Create `server/src/services/blog-media.service.ts`:

```typescript
// Dependencies to add to server/package.json:
// "multer": "^1.4.5-lts.1"
// "sharp": "^0.33.x"

interface UploadResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  webpUrl: string;
  width: number;
  height: number;
  fileSizeBytes: number;
}

export async function uploadMedia(file: Express.Multer.File, uploadedBy: string): Promise<UploadResult>
export async function deleteMedia(mediaId: string): Promise<void>
export async function listMedia(page: number, limit: number): Promise<{ media: BlogMedia[]; total: number }>
```

---

## 6. Server API

### 6.1 Public Blog Endpoints (No Auth)

```
GET /api/blog/posts
    ?category=seo
    &tag=schema
    &page=1
    &limit=12
    -> Returns: { posts: PostSummary[], total, page, totalPages }
    -> PostSummary: id, slug, title, subtitle, excerpt, featured_image_url, category, tags, author_name, published_at, reading_time_minutes

GET /api/blog/posts/:slug
    -> Returns: full BlogPost with content blocks
    -> Increments view_count (debounced, not on every request)
    -> 404 if not published

GET /api/blog/categories
    -> Returns: [{ category, count }] for published posts

GET /api/blog/sitemap.xml
    -> Returns: XML sitemap of all published posts with lastmod dates

GET /api/blog/feed.xml
    -> Returns: RSS/Atom feed of latest 20 published posts
```

### 6.2 Admin CMS Endpoints (requireSuperAdmin)

```
-- Posts
GET    /api/admin/cms/posts?status=draft&category=seo&search=...&page=1&limit=20
GET    /api/admin/cms/posts/:id          -> full post with content (by ID, not slug — allows draft access)
POST   /api/admin/cms/posts              -> create post (auto-generates slug from title)
PUT    /api/admin/cms/posts/:id          -> update post (saves revision automatically)
DELETE /api/admin/cms/posts/:id          -> soft delete (set status = 'archived')
POST   /api/admin/cms/posts/:id/publish  -> set status = 'published', published_at = NOW()
POST   /api/admin/cms/posts/:id/unpublish -> set status = 'draft', published_at = NULL

-- Revisions
GET    /api/admin/cms/posts/:id/revisions         -> list revisions (newest first)
POST   /api/admin/cms/posts/:id/revisions/:revId/restore -> replace current content with revision

-- Media
GET    /api/admin/cms/media?page=1&limit=24       -> paginated media library
POST   /api/admin/cms/media                        -> upload file (multipart/form-data)
DELETE /api/admin/cms/media/:id                     -> delete file + storage variants
PATCH  /api/admin/cms/media/:id                     -> update alt_text

-- Stats
GET    /api/admin/cms/stats
    -> { totalPosts, published, drafts, totalViews, topPosts: [...] }
```

### 6.3 Validation

Every block in the `content` array is validated on save using Zod discriminated unions:

```typescript
const TextBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('text'),
  props: z.object({ markdown: z.string().max(50000) }),
});

const ImageBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('image'),
  props: z.object({
    src: z.string().url(),
    alt: z.string().max(300),
    caption: z.string().max(200).optional(),
    width: z.enum(['full', 'wide', 'content']).default('content'),
  }),
});

// ... one schema per block type

const ContentBlockSchema = z.discriminatedUnion('type', [
  TextBlockSchema,
  ImageBlockSchema,
  HeadingBlockSchema,
  // ...
]);

const BlogPostSchema = z.object({
  title: z.string().min(1).max(300),
  subtitle: z.string().max(500).nullable(),
  excerpt: z.string().min(1).max(500),
  content: z.array(ContentBlockSchema),
  category: z.enum(['seo', 'accessibility', ...]),
  tags: z.array(z.string().max(30)).max(10),
  seo_title: z.string().max(200).nullable(),
  seo_description: z.string().max(400).nullable(),
});
```

---

## 7. Admin Editor Frontend

### 7.1 Dependencies to Add

```json
{
  "@dnd-kit/core": "^6.x",
  "@dnd-kit/sortable": "^8.x",
  "@dnd-kit/utilities": "^3.x",
  "react-markdown": "^9.x",
  "rehype-highlight": "^7.x",
  "rehype-sanitize": "^6.x",
  "remark-gfm": "^4.x"
}
```

### 7.2 Editor Page Structure

Route: `/admin/cms/posts/:id/edit`

```
+---------------------------------------------------+
| Post Settings Bar                                 |
| [Title input] [Category dropdown] [Tags input]    |
| [Featured Image picker] [SEO fields toggle]       |
+---------------------------------------------------+
|                                                   |
| +-- Block 1 ---------------------- [drag] [x] --+|
| | text                                           ||
| | [Markdown editor textarea]                     ||
| +------------------------------------------------+|
|                                                   |
| +-- Block 2 ---------------------- [drag] [x] --+|
| | image                                          ||
| | [Image preview] [Alt text] [Caption]           ||
| +------------------------------------------------+|
|                                                   |
| +-- Block 3 ---------------------- [drag] [x] --+|
| | callout (tip)                                  ||
| | [Type selector] [Title] [Markdown body]        ||
| +------------------------------------------------+|
|                                                   |
|             [ + Add Block ]                       |
|                                                   |
+---------------------------------------------------+
| [Save Draft]  [Preview]  [Publish]                |
+---------------------------------------------------+
```

### 7.3 Key Components

| Component | File | Responsibility |
|---|---|---|
| `PostEditor` | `pages/admin/cms/PostEditor.tsx` | Top-level editor page, manages block array state |
| `BlockList` | `components/cms/BlockList.tsx` | `@dnd-kit/sortable` container, renders block wrappers |
| `BlockWrapper` | `components/cms/BlockWrapper.tsx` | Drag handle, type label, delete button, wraps each block editor |
| `BlockRenderer` | `components/cms/BlockRenderer.tsx` | Switch on `block.type`, renders correct editor component |
| `TextBlockEditor` | `components/cms/blocks/TextBlockEditor.tsx` | Markdown textarea with live preview toggle |
| `ImageBlockEditor` | `components/cms/blocks/ImageBlockEditor.tsx` | Media picker + alt/caption fields |
| `TwoColumnEditor` | `components/cms/blocks/TwoColumnEditor.tsx` | Nested `BlockList` for left/right columns |
| `CalloutEditor` | `components/cms/blocks/CalloutEditor.tsx` | Type selector + markdown body |
| `AddBlockMenu` | `components/cms/AddBlockMenu.tsx` | Grid of block type buttons |
| `MediaPicker` | `components/cms/MediaPicker.tsx` | Modal with media library grid + upload button |
| `PostPreview` | `components/cms/PostPreview.tsx` | Read-only rendered preview using `BlockDisplay` |
| `BlockDisplay` | `components/cms/BlockDisplay.tsx` | Renders a block for public viewing (used in preview + public blog) |

### 7.4 Auto-Save

- Debounce saves to `PUT /api/admin/cms/posts/:id` every 10 seconds after changes
- Show "Saved" / "Saving..." / "Unsaved changes" indicator in the toolbar
- Each save creates a revision automatically (server-side)
- Warn on navigation with unsaved changes (`beforeunload` event)

---

## 8. Public Blog Frontend

### 8.1 Routes

```
/blog                          -> PostListPage (paginated, filterable by category/tag)
/blog/:slug                    -> PostDetailPage (full article)
/blog/category/:category       -> PostListPage (filtered)
```

### 8.2 SEO

Install `react-helmet-async` for per-page meta tags.

**Post list page:**
```html
<title>Blog | PagePulser</title>
<meta name="description" content="SEO guides, accessibility tips, and web performance insights from PagePulser." />
```

**Post detail page:**
```html
<title>{post.seo_title || post.title} | PagePulser</title>
<meta name="description" content="{post.seo_description || post.excerpt}" />
<meta property="og:title" content="{post.title}" />
<meta property="og:description" content="{post.excerpt}" />
<meta property="og:image" content="{post.featured_image_url}" />
<meta property="og:type" content="article" />
<meta property="article:published_time" content="{post.published_at}" />
<meta property="article:tag" content="{post.tags}" />
<link rel="canonical" href="https://pagepulser.com/blog/{post.slug}" />
```

**Structured data** — auto-generated `Article` schema per post:
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "description": "...",
  "image": "...",
  "author": { "@type": "Person", "name": "..." },
  "publisher": { "@type": "Organization", "name": "PagePulser" },
  "datePublished": "...",
  "dateModified": "..."
}
```

### 8.3 Sitemap

`GET /api/blog/sitemap.xml` generates:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://pagepulser.com/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://pagepulser.com/blog/fix-broken-schema</loc>
    <lastmod>2026-02-10T12:00:00Z</lastmod>
    <priority>0.6</priority>
  </url>
</urlset>
```

### 8.4 RSS Feed

`GET /api/blog/feed.xml` returns Atom feed of latest 20 published posts. Standard format for feed readers and aggregators.

---

## 9. Content and Product Integration

### 9.1 Audit Rule Linking

The `audit_link` block type connects blog content to the product. When a user clicks an audit rule reference in a blog post, it links to a guide explaining what the rule checks and how to fix it.

Flow:
1. Admin creates a blog post about "Fixing Missing Alt Text"
2. Adds an `audit_link` block with `ruleId: "missing-alt-text"`
3. On the public blog, this renders as a styled card with the rule name, severity, and category (looked up from `audit_findings` or the `audit_advice_templates` table from the CRM spec)
4. In the dashboard audit detail view, issues can link back to relevant blog posts via `ruleId` matching

### 9.2 Stat Highlights from Real Data

The `stat_highlight` block is designed for data-driven marketing. Admins can reference global audit trends:

- "87% of sites we scanned this month have missing meta descriptions"
- "Average accessibility score across our platform: 54/100"

These stats come from the admin analytics endpoints (`GET /api/admin/analytics/global-trends`). The admin manually creates `stat_highlight` blocks with current data — stats are not auto-updating (to prevent stale claims in published content).

### 9.3 Newsletter / Email Digest

When a post is published, optionally trigger an email to subscribed users:

1. Add `email_on_publish` boolean to `blog_posts` table
2. On publish, if `email_on_publish = true`, queue a BullMQ job
3. Job sends via Resend to users who have `notifications.blog = true` in their preferences
4. Uses the existing `email.service.ts` infrastructure

This is Phase 3 — not needed for initial launch.

---

## 10. Markdown Rendering

### 10.1 Inside `text` Blocks

Text blocks store Markdown that supports:
- **GFM** (GitHub Flavored Markdown): tables, strikethrough, task lists, autolinks
- **Syntax highlighting** in fenced code blocks via `rehype-highlight`
- **Sanitization** via `rehype-sanitize` (strip scripts, event handlers, iframes)

### 10.2 Rendering Pipeline

```
Markdown string (stored in block)
  -> remark-parse (parse to AST)
  -> remark-gfm (GFM extensions)
  -> rehype (convert to HTML AST)
  -> rehype-highlight (syntax highlighting)
  -> rehype-sanitize (XSS protection)
  -> React components (render to DOM)
```

Use `react-markdown` which handles this pipeline declaratively:

```tsx
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeHighlight, rehypeSanitize]}
>
  {block.props.markdown}
</ReactMarkdown>
```

### 10.3 Markdown Export

For portability (SEO crawlers, external syndication), provide a plain Markdown export:

```
POST /api/admin/cms/posts/:id/export?format=markdown
```

The transformer walks the block array and flattens:

| Block Type | Markdown Output |
|---|---|
| `text` | Verbatim markdown |
| `heading` | `## Title` (matching level) |
| `image` | `![alt](src)` + `*caption*` |
| `two_column` | Renders left blocks then right blocks sequentially |
| `callout` | `> **Tip:** content` |
| `code` | Fenced code block with language |
| `quote` | `> text` + `> — attribution` |
| `divider` | `---` |
| `cta` | `[text](url)` |
| `stat_highlight` | `**stat** — description` |
| `audit_link` | `[rule_name](link)` |

---

## 11. PDF Export

Reuse the existing Playwright-based PDF rendering from `pdf-report.service.ts`.

```
POST /api/admin/cms/posts/:id/export?format=pdf
```

Pipeline:
1. Render the block array to a complete HTML document (same as public blog rendering, but wrapped in print-friendly CSS)
2. Apply PagePulser branding (header with logo, footer with URL)
3. Pass to Playwright `page.pdf()` with A4 format
4. Return PDF buffer

This uses the same infrastructure as audit PDF exports — no new rendering engine needed.

---

## 12. Implementation Order

### Phase 1: Database & API (Week 1)

1. **Migration 049:** `blog_posts` table
2. **Migration 050:** `blog_media` table
3. **Migration 051:** `blog_post_revisions` table
4. **Dependencies:** Add `multer`, `sharp`, `sanitize-html` to server `package.json`
5. **Service:** `blog.service.ts` — CRUD for posts, slug generation, revision management
6. **Service:** `blog-media.service.ts` — upload, resize, WebP conversion, delete
7. **Routes:** `server/src/routes/admin/cms.ts` — all admin CMS endpoints
8. **Routes:** `server/src/routes/blog.ts` — public blog endpoints
9. **Validation:** Zod schemas for every block type + post metadata

### Phase 2: Admin Editor (Week 2-3)

10. **Dependencies:** Add `@dnd-kit/*`, `react-markdown`, `remark-gfm`, `rehype-highlight`, `rehype-sanitize` to client `package.json`
11. **Components:** `BlockList`, `BlockWrapper`, `BlockRenderer`, `AddBlockMenu`
12. **Block editors:** One editor component per block type (text, image, heading, callout, code, quote, cta, stat_highlight, audit_link, embed, two_column, divider)
13. **Media picker:** `MediaPicker` modal with upload + library grid
14. **Post editor page:** `/admin/cms/posts/:id/edit` with auto-save
15. **Post list page:** `/admin/cms/posts` with status/category filters
16. **Preview:** `PostPreview` component with `BlockDisplay` renderer

### Phase 3: Public Blog (Week 4)

17. **Dependencies:** Add `react-helmet-async` to client `package.json`
18. **Pages:** `PostListPage`, `PostDetailPage` at `/blog` routes
19. **Component:** `BlockDisplay` — public read-only block renderer (shared with preview)
20. **SEO:** Meta tags, Open Graph, Article structured data, canonical URLs
21. **Sitemap:** `GET /api/blog/sitemap.xml`
22. **RSS:** `GET /api/blog/feed.xml`
23. **Navigation:** Add "Blog" link to the public navbar / homepage

### Phase 4: Export & Integration (Week 5)

24. **Markdown export:** Block-to-markdown transformer
25. **PDF export:** Reuse Playwright pipeline with blog-specific HTML template
26. **Audit rule linking:** Connect `audit_link` blocks to `audit_advice_templates` / findings
27. **Stats page:** `/admin/cms/stats` with view counts, top posts, publishing frequency
28. **Revision browser:** UI to view and restore past revisions

### Phase 5: Polish (Week 6)

29. **View counting:** Debounced increment (max once per session per post)
30. **Related posts:** Query posts with overlapping tags/category, show at bottom of article
31. **Reading time:** Calculate on save from total text content word count (avg 200 wpm)
32. **Image lazy loading:** `loading="lazy"` on all rendered images
33. **OG image generation:** Auto-generate social share images from post title + featured image (optional, uses Playwright screenshot)

---

## 13. New Files Summary

### Server

| File | Responsibility |
|---|---|
| `server/src/services/blog.service.ts` | Post CRUD, slug generation, revisions, reading time calc |
| `server/src/services/blog-media.service.ts` | Upload handling, Sharp processing, storage management |
| `server/src/routes/blog.ts` | Public endpoints: list, detail, sitemap, RSS |
| `server/src/routes/admin/cms.ts` | Admin endpoints: post CRUD, media CRUD, stats, export |
| `server/src/types/blog.types.ts` | Post, Block, Media TypeScript interfaces |
| `server/src/validators/blog.validators.ts` | Zod schemas for all block types + post metadata |
| `server/src/db/migrations/049_create_blog_posts.sql` | Posts table |
| `server/src/db/migrations/050_create_blog_media.sql` | Media library table |
| `server/src/db/migrations/051_create_blog_revisions.sql` | Revision history table |

### Client

| File | Responsibility |
|---|---|
| `client/src/pages/admin/cms/PostList.tsx` | Admin post list with filters |
| `client/src/pages/admin/cms/PostEditor.tsx` | Block editor with drag-drop |
| `client/src/pages/admin/cms/MediaLibrary.tsx` | Media management grid |
| `client/src/pages/admin/cms/CmsStats.tsx` | Publishing analytics |
| `client/src/pages/blog/PostListPage.tsx` | Public blog listing |
| `client/src/pages/blog/PostDetailPage.tsx` | Public article view |
| `client/src/components/cms/BlockList.tsx` | Sortable block container |
| `client/src/components/cms/BlockWrapper.tsx` | Drag handle + controls per block |
| `client/src/components/cms/BlockRenderer.tsx` | Editor-mode block type switch |
| `client/src/components/cms/BlockDisplay.tsx` | Read-only block renderer (public + preview) |
| `client/src/components/cms/AddBlockMenu.tsx` | Block type picker |
| `client/src/components/cms/MediaPicker.tsx` | Upload + select modal |
| `client/src/components/cms/blocks/*.tsx` | One editor per block type (12 files) |

---

## 14. Dependencies to Add

### Server (`server/package.json`)

```
"multer": "^1.4.5-lts.1"        — multipart file upload handling
"sharp": "^0.33.x"              — image resize, WebP, thumbnail
"sanitize-html": "^2.x"         — HTML sanitization for markdown output
"@types/multer": "^1.4.x"       — TypeScript types (devDependency)
```

### Client (`client/package.json`)

```
"@dnd-kit/core": "^6.x"         — drag-drop foundation
"@dnd-kit/sortable": "^8.x"     — sortable lists
"@dnd-kit/utilities": "^3.x"    — drag-drop helpers
"react-markdown": "^9.x"        — markdown to React rendering
"remark-gfm": "^4.x"            — GitHub Flavored Markdown
"rehype-highlight": "^7.x"      — syntax highlighting
"rehype-sanitize": "^6.x"       — XSS protection
"react-helmet-async": "^2.x"    — per-page head management
```
