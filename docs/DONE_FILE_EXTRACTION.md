# File Extraction Feature — Plan

## Context

Users want to see an inventory of all files/assets discovered during a site audit: images, PDFs, Word docs, videos, audio, fonts, etc. This gives a site-wide view of what media and documents exist, helping identify missing alt text, orphaned files, oversized images, and linked documents.

The feature should be opt-in (checkbox on audit creation), gated to paid tiers (Starter+), and displayed in a new "Files" tab on the audit detail page.

---

## Key Decisions

1. **Dedicated `audit_assets` table** (not JSONB) — assets can number in hundreds per page; need cross-page deduplication, filtering, and sorting via SQL
2. **Deduplication via upsert** — same asset URL on multiple pages = 1 row with `page_count` incremented, plus a junction table `audit_asset_pages` for "found on which pages"
3. **Two extraction sources merged**: Playwright network responses (already tracked) + new HTML parsing (img, video, a[href=*.pdf], etc.)
4. **Extraction runs in the crawl loop**, not as a separate engine — reuses existing HTML `$` and `resources[]`
5. **Tier gating via existing `available_checks` mechanism** — add `'file-extraction'` to Starter+

---

## Implementation Order

### 1. Migration `045_create_audit_assets.sql`

```sql
CREATE TABLE audit_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_job_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    url_hash TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('image','document','video','audio','font','other')),
    mime_type TEXT,
    file_extension TEXT,
    file_name TEXT,
    file_size_bytes INT,
    source TEXT NOT NULL DEFAULT 'html' CHECK (source IN ('network','html','both')),
    http_status INT,
    page_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(audit_job_id, url_hash)
);

CREATE TABLE audit_asset_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_asset_id UUID NOT NULL REFERENCES audit_assets(id) ON DELETE CASCADE,
    audit_page_id UUID NOT NULL REFERENCES audit_pages(id) ON DELETE CASCADE,
    html_element TEXT,
    html_attribute TEXT,
    UNIQUE(audit_asset_id, audit_page_id)
);

CREATE INDEX idx_audit_assets_job_id ON audit_assets(audit_job_id);
CREATE INDEX idx_audit_assets_type ON audit_assets(audit_job_id, asset_type);
CREATE INDEX idx_audit_asset_pages_asset ON audit_asset_pages(audit_asset_id);

ALTER TABLE audit_jobs ADD COLUMN IF NOT EXISTS check_file_extraction BOOLEAN DEFAULT FALSE;
```

### 2. Migration `046_add_file_extraction_to_tiers.sql`

Add `'file-extraction'` to `available_checks` for Starter, Pro, Agency, Enterprise (not Free).

### 3. New: `server/src/types/asset.types.ts`

```typescript
export type AssetCategory = 'image' | 'document' | 'video' | 'audio' | 'font' | 'other';

export interface DiscoveredAsset {
  url: string;
  urlHash: string;
  assetType: AssetCategory;
  mimeType: string | null;
  fileExtension: string | null;
  fileName: string | null;
  fileSizeBytes: number | null;
  source: 'network' | 'html' | 'both';
  httpStatus: number | null;
  htmlElement: string | null;
  htmlAttribute: string | null;
}
```

Extension-to-category mapping: jpg/png/gif/webp/svg/avif → image, pdf/doc/docx/xls/xlsx/ppt/pptx/csv → document, mp4/webm/avi/mov → video, mp3/wav/ogg/flac → audio, woff/woff2/ttf/eot/otf → font.

### 4. New: `server/src/services/asset-extractor.service.ts`

Core `extractAssets($, baseUrl, networkResources)` function. Parses HTML for:

| Element | Attribute | Category |
|---------|-----------|----------|
| `<img>` | `src`, `data-src`, `data-lazy-src`, `srcset` | image |
| `<picture><source>` | `srcset` | image |
| `<video>` | `src`, `poster` | video |
| `<audio>` | `src` | audio |
| `<source>` (inside video/audio) | `src` | video/audio |
| `<a>` | `href` (matching binary extensions) | by extension |
| `<object>` | `data` | by extension |
| `<embed>` | `src` | by extension |
| inline `style` | `background-image: url(...)` | image |

Merges with network-tracked `ResourceInfo[]` by URL. Resolves relative URLs via existing `UrlNormalizerService.resolveUrl()`. Does NOT filter by domain scope (CDN assets included).

### 5. Modify: `server/src/routes/audits/index.ts`

- Add `checkFileExtraction: z.boolean().optional()` to Zod schema (~line 50)
- Tier-gate: `checkFileExtraction = checkFileExtraction && availableChecks.includes('file-extraction')`
- Add `check_file_extraction` to INSERT columns (~line 219)
- **New endpoint**: `GET /:id/assets` — returns paginated assets with type filter, search, sort, plus summary counts by type
- **New endpoint**: `GET /:id/assets/:assetId/pages` — returns pages referencing a specific asset

### 6. Modify: `server/src/services/queue/audit-worker.service.ts`

After `updatePageData(pageId, crawlResult)` in the crawl loop (~line 586):

```typescript
if (job.check_file_extraction && isHtmlContent) {
  const $ = cheerio.load(crawlResult.html);
  const assets = extractAssets($, crawlResult.url, crawlResult.resources);
  await this.storeAssets(job.id, pageId, assets); // upsert loop
}
```

Upsert pattern: `INSERT ... ON CONFLICT (audit_job_id, url_hash) DO UPDATE SET page_count = page_count + 1, source = CASE...`

### 7. Frontend types: `client/src/types/audit.types.ts`

Add `AuditAsset`, `AssetSummary` interfaces. Add `checkFileExtraction` to `StartAuditInput.options`.

### 8. Frontend API: `client/src/services/api.ts`

Add `auditsApi.getAssets(id, params)` and `auditsApi.getAssetPages(auditId, assetId)`.

### 9. New: `client/src/components/audit/FilesTab.tsx`

Follows `SchemaTab.tsx` pattern — standalone component receiving `auditId`, fetches own data.

**UI layout:**
- Summary bar: total count + breakdown chips by type with icons
- Filter row: type chips (All | Images | Documents | Videos | Audio | Fonts), search input, sort dropdown
- Asset table/list: file type icon, filename, extension badge, size (formatted), "on N pages" count, source badge, external link button
- Expandable rows showing which pages reference the asset
- Empty state when no assets found

**Icons** (lucide-react): `Image`, `FileText`, `Video`, `Music`, `Type` (fonts), `File` (other)

### 10. Modify: `client/src/pages/audits/AuditDetail.tsx`

- Add `'files'` to `TabType` union (~line 260)
- Add to tab bar array and labels (~line 1010)
- Add tab content: `{activeTab === 'files' && id && <FilesTab auditId={id} />}`
- Only show tab when `audit.check_file_extraction` is true (or show with locked state for upgrade prompt)

### 11. Modify: `client/src/pages/audits/NewAudit.tsx`

- Add `checkFileExtraction: boolean` to `AuditOptions` interface
- Default to `false`
- Add checkbox in the Audit Types grid after Performance, with lock icon for free tier users

---

## Critical Files

| File | Action |
|------|--------|
| `server/src/db/migrations/045_create_audit_assets.sql` | **NEW** |
| `server/src/db/migrations/046_add_file_extraction_to_tiers.sql` | **NEW** |
| `server/src/types/asset.types.ts` | **NEW** |
| `server/src/services/asset-extractor.service.ts` | **NEW** |
| `server/src/routes/audits/index.ts` | Zod schema, INSERT, new endpoints |
| `server/src/services/queue/audit-worker.service.ts` | Hook extraction into crawl loop |
| `client/src/types/audit.types.ts` | Add asset types |
| `client/src/services/api.ts` | Add getAssets methods |
| `client/src/components/audit/FilesTab.tsx` | **NEW** |
| `client/src/pages/audits/AuditDetail.tsx` | Add files tab |
| `client/src/pages/audits/NewAudit.tsx` | Add checkbox |

---

## Verification

1. Run migrations 045 + 046
2. As a Starter+ user, create an audit with "File Extraction" checked — verify checkbox visible and submittable
3. As a Free user, verify checkbox is locked/disabled
4. After audit completes, open "Files" tab — verify assets listed with correct types, sizes, page counts
5. Filter by type (images only) — verify filtering works
6. Search by filename — verify search works
7. Click an asset to expand — verify page list shows correctly
8. Verify deduplication: same image on 3 pages = 1 row, page_count=3
9. Verify both sources work: network-tracked images AND HTML-parsed linked documents (e.g., PDF links)
