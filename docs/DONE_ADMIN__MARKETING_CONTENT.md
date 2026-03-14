# Admin Marketing Content Hub — Ultrathink Plan

## Overview / Summary

A new **Marketing** navigation group in the admin panel that serves as a central content repository for social media posts and marketing materials. Content is organised by platform (Twitter/X, LinkedIn, Instagram, etc.) and tagged with campaign labels for easy filtering and management.

This gives the admin a single place to draft, store, and organise all marketing copy — ready to be copied out to scheduling tools or posted manually. It is **not** a posting/scheduling system; it is a content library.

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Single table vs per-platform tables | **Single `marketing_content` table** with a `platform` enum column | Simpler queries, easier to add new platforms, unified tagging |
| Campaign tagging approach | **Separate `marketing_campaigns` table** + FK on content | Lets admins manage campaign names/colours centrally, reuse across platforms, filter cleanly |
| Rich text or plain text | **Markdown body** with a plain-text preview field | Tweets are plain text, LinkedIn supports some formatting — markdown covers both. Preview is auto-generated (first 280 chars stripped of markdown) |
| Media attachments | **JSON array column** storing media library references (URLs) | Reuses the existing CMS media library; no new upload infra needed |
| Routing structure | `/admin/marketing/content` (main list), `/admin/marketing/content/new`, `/admin/marketing/content/:id/edit`, `/admin/marketing/campaigns` | Follows existing CMS pattern |
| Nav group placement | New **Marketing** group between **Growth** and **Content** | Logical separation — Growth is CRM/email, Marketing is social/content, Content is blog/CMS |

---

## Database Changes

### Migration `068_marketing_content.sql`

```sql
-- Marketing campaigns (labels/tags)
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,            -- e.g. "Campaign 1", "Q1 Launch"
  color VARCHAR(7) DEFAULT '#6366f1',    -- hex colour for badge display
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketing_campaigns_name ON marketing_campaigns(name);

-- Marketing content items
CREATE TABLE marketing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(20) NOT NULL,         -- 'twitter', 'linkedin', 'instagram', 'facebook', 'threads', 'other'
  title VARCHAR(200),                    -- optional internal title/label
  body TEXT NOT NULL,                    -- the actual post content (markdown)
  preview VARCHAR(300),                  -- auto-generated plain text preview (first 280 chars)
  media JSONB DEFAULT '[]',             -- array of { url, alt, type } objects
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft',    -- 'draft', 'ready', 'posted', 'archived'
  notes TEXT,                            -- internal admin notes
  char_count INT DEFAULT 0,             -- computed character count of body
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketing_content_platform ON marketing_content(platform);
CREATE INDEX idx_marketing_content_campaign ON marketing_content(campaign_id);
CREATE INDEX idx_marketing_content_status ON marketing_content(status);
CREATE INDEX idx_marketing_content_created ON marketing_content(created_at DESC);
```

### Platform enum values

`twitter` | `linkedin` | `instagram` | `facebook` | `threads` | `other`

These are stored as varchar (not a Postgres enum) so new platforms can be added without a migration.

### Status flow

`draft` → `ready` → `posted` → `archived`

- **draft**: Work in progress
- **ready**: Approved and ready to post
- **posted**: Has been published externally
- **archived**: No longer relevant

---

## Backend Changes

### New files

| File | Purpose |
|---|---|
| `server/src/routes/admin/marketing.ts` | Express router for marketing endpoints |
| `server/src/services/marketing.service.ts` | Database queries and business logic |

### Route: `server/src/routes/admin/marketing.ts`

Mounted at `/api/admin/marketing` under the existing admin router (which already applies `authenticate` + `requireSuperAdmin`).

**Campaign endpoints:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/campaigns` | List all campaigns (no pagination needed — small dataset) |
| `POST` | `/campaigns` | Create a campaign |
| `PATCH` | `/campaigns/:id` | Update campaign name/color/description |
| `DELETE` | `/campaigns/:id` | Delete campaign (content keeps `campaign_id = NULL`) |

**Content endpoints:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/content` | List content with filters: `?platform=&campaign_id=&status=&search=&page=1&limit=25` |
| `GET` | `/content/stats` | Counts by platform, by campaign, by status |
| `GET` | `/content/:id` | Get single content item |
| `POST` | `/content` | Create content item |
| `PATCH` | `/content/:id` | Update content item |
| `DELETE` | `/content/:id` | Delete content item |
| `PATCH` | `/content/:id/status` | Quick status change (e.g. mark as posted) |

### Service: `server/src/services/marketing.service.ts`

- `listCampaigns()` — `SELECT * FROM marketing_campaigns ORDER BY created_at DESC`
- `createCampaign(data)` — insert + return
- `updateCampaign(id, data)` — partial update
- `deleteCampaign(id)` — delete (FK has `ON DELETE SET NULL`)
- `listContent(filters)` — paginated query with JOINs on campaign, filters on platform/campaign/status/search
- `getContentStats()` — aggregate counts
- `getContent(id)` — single item with campaign info joined
- `createContent(data)` — insert, auto-compute `preview` and `char_count`
- `updateContent(id, data)` — partial update, recompute preview/char_count
- `deleteContent(id)` — hard delete
- `updateContentStatus(id, status)` — status-only update

### Wire into admin router

In `server/src/routes/admin/index.ts`, add:

```typescript
import { marketingRouter } from './marketing';
router.use('/marketing', marketingRouter);
```

### Activity logging

All create/update/delete operations log to `admin_activity_log` using the existing `logAdminActivity()` pattern with `target_type: 'marketing_content'` or `'marketing_campaign'`.

---

## Frontend Changes

### New files

| File | Purpose |
|---|---|
| `client/src/pages/admin/marketing/ContentListPage.tsx` | Main content list with filters |
| `client/src/pages/admin/marketing/ContentEditorPage.tsx` | Create/edit a content item |
| `client/src/pages/admin/marketing/CampaignsPage.tsx` | Manage campaign labels |

### Types: `client/src/types/admin.types.ts`

```typescript
// Marketing platforms
type MarketingPlatform = 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'threads' | 'other';

// Marketing content status
type MarketingContentStatus = 'draft' | 'ready' | 'posted' | 'archived';

interface MarketingCampaign {
  id: string;
  name: string;
  color: string;
  description: string | null;
  created_at: string;
  content_count?: number;  // from aggregate join
}

interface MarketingContent {
  id: string;
  platform: MarketingPlatform;
  title: string | null;
  body: string;
  preview: string;
  media: { url: string; alt: string; type: string }[];
  campaign_id: string | null;
  campaign?: MarketingCampaign;  // joined
  status: MarketingContentStatus;
  notes: string | null;
  char_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface MarketingContentStats {
  total: number;
  by_platform: Record<MarketingPlatform, number>;
  by_status: Record<MarketingContentStatus, number>;
  by_campaign: { id: string; name: string; count: number }[];
}
```

### API methods: `client/src/services/api.ts`

Add to `adminApi`:

```typescript
// Marketing - Campaigns
listMarketingCampaigns: () => api.get('/admin/marketing/campaigns'),
createMarketingCampaign: (data) => api.post('/admin/marketing/campaigns', data),
updateMarketingCampaign: (id, data) => api.patch(`/admin/marketing/campaigns/${id}`, data),
deleteMarketingCampaign: (id) => api.delete(`/admin/marketing/campaigns/${id}`),

// Marketing - Content
listMarketingContent: (params) => api.get('/admin/marketing/content?...'),
getMarketingContentStats: () => api.get('/admin/marketing/content/stats'),
getMarketingContent: (id) => api.get(`/admin/marketing/content/${id}`),
createMarketingContent: (data) => api.post('/admin/marketing/content', data),
updateMarketingContent: (id, data) => api.patch(`/admin/marketing/content/${id}`, data),
deleteMarketingContent: (id) => api.delete(`/admin/marketing/content/${id}`),
updateMarketingContentStatus: (id, status) => api.patch(`/admin/marketing/content/${id}/status`, { status }),
```

### Routes: `client/src/App.tsx`

Add inside the `<AdminRoute>` block:

```tsx
<Route path="/admin/marketing/content" element={<AdminRoute><ContentListPage /></AdminRoute>} />
<Route path="/admin/marketing/content/new" element={<AdminRoute><ContentEditorPage /></AdminRoute>} />
<Route path="/admin/marketing/content/:id/edit" element={<AdminRoute><ContentEditorPage /></AdminRoute>} />
<Route path="/admin/marketing/campaigns" element={<AdminRoute><CampaignsPage /></AdminRoute>} />
```

### Navigation: `AdminLayout.tsx`

Add a new **Marketing** nav group between Growth and Content:

```typescript
{
  label: 'Marketing',
  defaultOpen: true,
  items: [
    { href: '/admin/marketing/content', label: 'Social Content', icon: Share2 },
    { href: '/admin/marketing/campaigns', label: 'Campaigns', icon: Tags },
  ],
},
```

Import `Share2` and `Tags` from `lucide-react`.

---

## Page Designs

### ContentListPage (`/admin/marketing/content`)

**Header row:**
- Title: "Marketing Content"
- "New Content" button (primary, top-right)
- Stats bar: total items, quick counts by platform (as small badges)

**Filter bar:**
- Platform dropdown: All / Twitter / LinkedIn / Instagram / Facebook / Threads / Other
- Campaign dropdown: All / (list from campaigns table)
- Status dropdown: All / Draft / Ready / Posted / Archived
- Search input: searches title and body text

**Content grid/list:**
- Card-based layout (not table — content is visual)
- Each card shows:
  - Platform icon + name badge (colour-coded: Twitter=sky, LinkedIn=blue, Instagram=pink, Facebook=blue, Threads=slate)
  - Campaign badge (using campaign's custom colour) or "No campaign" in muted text
  - Status badge (draft=slate, ready=amber, posted=green, archived=slate)
  - Title (if set) in bold, or first line of body
  - Preview text (truncated to ~140 chars)
  - Character count (with platform-specific limit indicator, e.g. red if over 280 for Twitter)
  - Created date
  - Quick actions: Edit, Copy text (clipboard), Change status, Delete

**Pagination:** Standard prev/next with page count

### ContentEditorPage (`/admin/marketing/content/new` and `/admin/marketing/content/:id/edit`)

**Layout:** Two-column on desktop

**Left column (content):**
- Platform selector (icon buttons for each platform — highlight selected)
- Title input (optional, placeholder: "Internal title...")
- Body textarea (large, monospace for tweet-style, with live character count)
  - Show character limit bar for the selected platform (280 for Twitter, 3000 for LinkedIn, 2200 for Instagram, etc.)
  - Colour shifts from green → amber → red as approaching/exceeding limit
- Media section: "Attach media" button linking to existing CMS media picker
- Notes textarea (collapsible, for internal notes)

**Right column (metadata):**
- Status selector (radio buttons or dropdown)
- Campaign selector (dropdown + "New campaign" inline option)
- Preview card showing how it roughly looks
- Save / Delete buttons

### CampaignsPage (`/admin/marketing/campaigns`)

**Simple CRUD list:**
- Table with columns: Name, Colour (swatch), Description, Content Count, Created, Actions
- Inline create form at top (name + colour picker + description)
- Edit via inline editing or modal
- Delete with confirmation (warns that content will be untagged, not deleted)

---

## Platform Character Limits (reference)

| Platform | Limit |
|---|---|
| Twitter/X | 280 (or 25,000 for long-form if premium) |
| LinkedIn | 3,000 |
| Instagram | 2,200 |
| Facebook | 63,206 |
| Threads | 500 |
| Other | No limit shown |

These are stored as a frontend constant — not in the database.

---

## Critical Files Summary

### New files to create

| # | File | Type |
|---|---|---|
| 1 | `server/src/db/migrations/068_marketing_content.sql` | Migration |
| 2 | `server/src/services/marketing.service.ts` | Backend service |
| 3 | `server/src/routes/admin/marketing.ts` | Backend routes |
| 4 | `client/src/pages/admin/marketing/ContentListPage.tsx` | Frontend page |
| 5 | `client/src/pages/admin/marketing/ContentEditorPage.tsx` | Frontend page |
| 6 | `client/src/pages/admin/marketing/CampaignsPage.tsx` | Frontend page |

### Existing files to modify

| # | File | Change |
|---|---|---|
| 1 | `server/src/routes/admin/index.ts` | Mount marketing router |
| 2 | `client/src/App.tsx` | Add marketing routes |
| 3 | `client/src/components/layout/AdminLayout.tsx` | Add Marketing nav group |
| 4 | `client/src/services/api.ts` | Add marketing API methods |
| 5 | `client/src/types/admin.types.ts` | Add marketing types |

---

## Testing Plan

- **Migration:** Run migration, verify tables/indexes created, insert test data, verify FK constraints and ON DELETE SET NULL behaviour
- **API:** Test all CRUD endpoints via curl/Postman; verify 403 for non-admin; verify pagination, filtering, search
- **Campaign deletion:** Confirm content retains but campaign_id becomes NULL
- **Character count:** Verify auto-computation on create and update
- **Preview generation:** Confirm preview strips markdown and truncates correctly
- **Frontend filters:** Test all filter combinations, ensure page resets to 1 on filter change
- **Clipboard copy:** Verify body text copies correctly
- **Status transitions:** Verify status changes persist and display correctly
- **Activity log:** Confirm all admin actions are logged

---

## Implementation Order

1. **Database migration** — `068_marketing_content.sql` (campaigns + content tables)
2. **Backend service** — `marketing.service.ts` (all query functions)
3. **Backend routes** — `marketing.ts` + mount in admin index
4. **Frontend types** — Add types to `admin.types.ts`
5. **Frontend API** — Add methods to `api.ts`
6. **Admin nav** — Add Marketing group to `AdminLayout.tsx`
7. **CampaignsPage** — Simple CRUD page (needed before content, as content references campaigns)
8. **ContentListPage** — List with filters, stats, quick actions
9. **ContentEditorPage** — Create/edit form with character counting
10. **App routes** — Wire up routes in `App.tsx`
