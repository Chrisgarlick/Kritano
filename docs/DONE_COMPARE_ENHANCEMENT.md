# Compare Feature Enhancement — Ultrathink Plan

## Overview

The compare feature currently displays scores, content subscores, E-E-A-T pillars, AEO pillars, keywords, and readability — but the system stores significantly more data per URL that goes unused. This plan adds **six new comparison sections** and deepens three existing ones, turning the compare page into a comprehensive diagnostic tool.

**Scope:** URL comparison only. Sites and Audits tabs already work well with their existing components.

---

## Key Decisions

1. **No new database tables or migrations** — all data already exists in `audit_pages`, `audit_findings`, and structured data columns
2. **Backend changes are additive** — expand `getUrlPageSnapshot()` to fetch missing fields; add a new `getUrlFindings()` query for per-URL issue diff
3. **Issue diff reuses the same pattern as audit comparison** — group findings by `rule_id`, show unique-to-A, unique-to-B, and shared
4. **Structured data comparison is side-by-side** — show schema types, JSON-LD count, OG/Twitter presence, detected page type
5. **Performance metrics are simple** — response time, page size, status code as a quick comparison row
6. **No AI-generated content** — all insights remain deterministic rule-based

---

## New & Enhanced Sections (Implementation Order)

### Section 1: Issue Count Summary Bar (NEW)

**What:** A visual bar chart showing issue counts by category for each URL, side-by-side.

**Data source:** `audit_pages` columns `seo_issues`, `accessibility_issues`, `security_issues`, `performance_issues`, `content_issues`, `structured_data_issues` (already in DB, not fetched).

**Backend changes:**
- Add these 6 issue-count fields to `UrlPageSnapshot` type
- Add them to the `getUrlPageSnapshot()` SQL query
- Add to `generateUrlInsights()` — if one URL has 3x+ more issues in a category, generate a high-severity insight

**Frontend:**
- New section between "Score Comparison" table and "Content Subscores"
- Two stacked horizontal bar charts (one per URL) showing issue counts by category
- Color-coded by category (matching existing `CATEGORY_COLORS`)
- Total issue count badge on each bar

**Client type changes:**
- Add `issueCountByCategory` to `UrlPageSnapshot`: `{ seo: number; accessibility: number; security: number; performance: number; content: number; structuredData: number }`

---

### Section 2: Issue Diff Table (NEW)

**What:** Like the audit comparison's `IssueDiffTable`, but comparing findings between two specific URLs.

**Data source:** `audit_findings` table, joined on `audit_page_id`. For each URL we find the `audit_page_id` from the same audit we used to get the snapshot, then query findings for that page.

**Backend changes:**

New service function: `getUrlFindingsDiff(auditPageIdA: string, auditPageIdB: string)`
- Query `audit_findings` WHERE `audit_page_id IN ($1, $2)`
- Group by `rule_id` → determine: unique to A, unique to B, shared
- Return typed result with severity, category, message, recommendation per finding
- Cap at 100 findings per URL to keep response reasonable

New type: `UrlFindingsDiff`
```ts
interface UrlFindingItem {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: string;
  message: string;
  recommendation: string;
}

interface UrlFindingsDiff {
  uniqueToA: UrlFindingItem[];
  uniqueToB: UrlFindingItem[];
  shared: UrlFindingItem[];
  summaryA: { critical: number; serious: number; moderate: number; minor: number };
  summaryB: { critical: number; serious: number; moderate: number; minor: number };
}
```

Extend `UrlComparison` response to include `findingsDiff: UrlFindingsDiff`.

Extend `getUrlPageSnapshot()` query to also return `ap.id as page_id` so we can query findings.

**Frontend:**
- New collapsible section after "Actionable Insights"
- Three sub-sections: "Issues only on URL A", "Issues only on URL B", "Shared Issues"
- Each issue row shows: severity badge, category badge, rule name, message
- Expandable to show recommendation
- Severity summary counts at the top of each sub-section
- Pattern follows existing `IssueDiffTable` but adapted for two URLs

---

### Section 3: HTTP & Performance Metrics (NEW)

**What:** Side-by-side comparison of page load characteristics.

**Data source:** `audit_pages` columns `status_code`, `response_time_ms`, `page_size_bytes` (already in DB, not fetched).

**Backend changes:**
- Add to `UrlPageSnapshot` type:
```ts
performance: {
  statusCode: number | null;
  responseTimeMs: number | null;
  pageSizeBytes: number | null;
}
```
- Add to `getUrlPageSnapshot()` SQL query
- Add to `generateUrlInsights()`:
  - Response time delta > 500ms → medium insight
  - Response time delta > 1500ms → high insight
  - Page size ratio > 2x → medium insight

**Frontend:**
- New section between "Score Comparison" and "Content Subscores"
- Simple 3-row comparison table: Status Code, Response Time (formatted as ms), Page Size (formatted as KB/MB)
- Delta indicators (green/red) for response time and page size
- Color coding: green < 500ms, amber 500-1500ms, red > 1500ms

---

### Section 4: Structured Data Deep Dive (NEW)

**What:** Side-by-side comparison of structured data coverage — schema types, JSON-LD count, Open Graph, Twitter Cards.

**Data source:** `audit_pages` columns: `json_ld_count`, `has_open_graph`, `has_twitter_card`, `detected_schema_types` (text array), `detected_page_type`, `open_graph_data` (JSONB), `twitter_card_data` (JSONB), `json_ld_items` (JSONB), `structured_data_issues`.

**Backend changes:**
- Add to `UrlPageSnapshot` type:
```ts
structuredData: {
  jsonLdCount: number;
  hasOpenGraph: boolean;
  hasTwitterCard: boolean;
  detectedSchemaTypes: string[];
  detectedPageType: string | null;
  structuredDataIssues: number;
}
```
- Add these to `getUrlPageSnapshot()` SQL query
- Add to `generateUrlInsights()`:
  - One has OG/Twitter, other doesn't → medium insight
  - One has schema types, other doesn't → high insight
  - JSON-LD count difference → low insight

**Frontend:**
- New section after AEO comparison
- Two columns showing:
  - JSON-LD count with delta
  - Open Graph: present/absent (checkmark/x per URL)
  - Twitter Card: present/absent
  - Detected page type
  - Schema types: list of detected types per URL, highlighting types present in one but not the other (green = has, red = missing)
  - Structured data issue count comparison

---

### Section 5: E-E-A-T Evidence Expansion (ENHANCE existing)

**What:** Expand the existing E-E-A-T section to show the actual evidence items stored in `eeat_evidence` JSONB.

**Data source:** `audit_pages.eeat_evidence` — JSONB array of `{ pillar: string, type: string, label: string, text: string }`.

**Backend changes:**
- Add `eeatEvidence` to `UrlPageSnapshot.eeat`:
```ts
eeat: {
  // ... existing fields ...
  evidence: Array<{ pillar: string; type: string; label: string; text: string }>;
}
```
- Add `ap.eeat_evidence` to the SQL query in `getUrlPageSnapshot()`

**Frontend:**
- Below the existing E-E-A-T pillar progress bars, add a collapsible "Evidence Details" section
- Two columns (URL A / URL B)
- Group evidence by pillar (Experience, Expertise, Authoritativeness, Trustworthiness)
- Each evidence item shows type badge + label + text snippet
- Highlight evidence items present in one URL but not the other
- Count of evidence items per pillar shown as badge

---

### Section 6: AEO Nuggets Comparison (ENHANCE existing)

**What:** Show the actual AI-extractable nuggets found on each page, with type classification and word counts.

**Data source:** `audit_pages.aeo_nuggets` — JSONB array of `{ text: string, type: string, wordCount: number }`.

**Backend changes:**
- Add `nuggets` to `UrlPageSnapshot.aeo`:
```ts
aeo: {
  // ... existing fields ...
  nuggets: Array<{ text: string; type: string; wordCount: number }>;
}
```
- Add `ap.aeo_nuggets` to the SQL query in `getUrlPageSnapshot()`
- Add to insights: nugget count comparison, type diversity comparison

**Frontend:**
- Below existing AEO pillar bars, add collapsible "AI-Extractable Nuggets" section
- Two columns showing nuggets for each URL
- Each nugget: type badge (definition, statistic, how-to, etc.), text preview (truncated), word count
- Summary row: total nuggets, types found, average word count
- Visual indicator showing which URL is more "AI-ready"

---

### Section 7: Meta & SEO Signals (ENHANCE existing)

**What:** Expand the Readability section into a full "Content & SEO Signals" comparison.

**Currently:** Shows grade level, reading ease, word count, reading time, content type.

**Add:**
- Title comparison (side-by-side with character counts — optimal 50-60)
- Meta description comparison (side-by-side with character counts — optimal 150-160)
- H1 text comparison
- Canonical URL presence
- Title/description length indicators (green if optimal, amber if too short/long)

**Backend changes:**
- Already fetching `title`, `meta_description`, `h1_text` — just need to ensure they're passed through to the comparison view
- Add `canonical_url` to the query

**Frontend:**
- Rename section from "Readability & Content" to "Content & SEO Signals"
- Add title/description/H1 rows with the actual text (truncated) + character count
- Color-code character counts: green = optimal range, amber = suboptimal, red = missing

---

## Summary of Backend Type Changes

### `UrlPageSnapshot` additions:
```ts
// Add to existing type
issueCountByCategory: {
  seo: number;
  accessibility: number;
  security: number;
  performance: number;
  content: number;
  structuredData: number;
};
httpPerformance: {
  statusCode: number | null;
  responseTimeMs: number | null;
  pageSizeBytes: number | null;
};
structuredDataDetail: {
  jsonLdCount: number;
  hasOpenGraph: boolean;
  hasTwitterCard: boolean;
  detectedSchemaTypes: string[];
  detectedPageType: string | null;
  structuredDataIssues: number;
};
// Expand eeat to include evidence
eeat.evidence: Array<{ pillar: string; type: string; label: string; text: string }>;
// Expand aeo to include nuggets
aeo.nuggets: Array<{ text: string; type: string; wordCount: number }>;
// Add canonical URL to meta
meta.canonicalUrl: string | null;
// Add pageId for findings query
pageId: string;
```

### New type: `UrlFindingsDiff`
(As described in Section 2 above)

### `UrlComparison` expansion:
```ts
interface UrlComparison {
  urls: [UrlPageSnapshot, UrlPageSnapshot];
  scoreDeltas: Record<string, number | null>;
  insights: UrlComparisonInsight[];
  findingsDiff: UrlFindingsDiff;  // NEW
}
```

---

## Critical Files Summary

| File | Action |
|------|--------|
| `server/src/types/analytics.types.ts` | Expand `UrlPageSnapshot`, add `UrlFindingsDiff`, expand `UrlComparison` |
| `server/src/services/analytics.service.ts` | Expand `getUrlPageSnapshot()` SQL, add `getUrlFindingsDiff()`, expand `generateUrlInsights()`, expand `compareUrls()` |
| `client/src/types/analytics.types.ts` | Mirror server type changes |
| `client/src/components/compare/UrlComparisonView.tsx` | Add 4 new sections, enhance 3 existing sections |

---

## Frontend Section Order (Final)

1. **Header Cards** (existing — no change)
2. **Radar Chart** (existing — no change)
3. **Score Comparison Table** (existing — no change)
4. **Issue Count Summary Bar** (NEW)
5. **HTTP & Performance Metrics** (NEW)
6. **Content Subscores** (existing — no change)
7. **Content & SEO Signals** (ENHANCED — was "Readability & Content", add title/desc/H1/canonical)
8. **E-E-A-T Analysis** (ENHANCED — add evidence expansion)
9. **AEO Analysis** (ENHANCED — add nuggets expansion)
10. **Structured Data Deep Dive** (NEW)
11. **Keyword Analysis** (existing — no change)
12. **Actionable Insights** (existing — enhanced with new insight rules)
13. **Issue Diff Table** (NEW — collapsible, at the bottom for detailed drill-down)

---

## New Insight Rules for `generateUrlInsights()`

Add these to the existing insight generator:

| Condition | Severity | Category |
|-----------|----------|----------|
| Issue count ratio > 3x in a category | high | Issues |
| Total issues delta > 20 | high | Issues |
| Response time delta > 1500ms | high | Performance |
| Response time delta > 500ms | medium | Performance |
| Page size ratio > 2x | medium | Performance |
| One has OG tags, other doesn't | medium | Structured Data |
| One has Twitter card, other doesn't | low | Structured Data |
| Schema type count difference > 2 | medium | Structured Data |
| One has JSON-LD, other has 0 | high | Structured Data |
| EEAT evidence count difference > 3 | medium | E-E-A-T |
| AEO nugget count difference > 3 | medium | AEO |
| Title missing or < 30 chars | high | SEO |
| Meta description missing or < 70 chars | medium | SEO |
| Canonical URL mismatch/missing | medium | SEO |

---

## Implementation Order

1. **Backend types** — Expand `UrlPageSnapshot`, add `UrlFindingsDiff`
2. **Backend service** — Expand `getUrlPageSnapshot()` SQL to fetch all missing columns, add `getUrlFindingsDiff()`, expand `compareUrls()` to include findings diff
3. **Backend insights** — Add new insight rules for issues, performance, structured data, evidence
4. **Client types** — Mirror all backend type changes
5. **Issue Count Summary Bar** — New component section in `UrlComparisonView`
6. **HTTP & Performance section** — New section
7. **Structured Data Deep Dive** — New section
8. **Content & SEO Signals enhancement** — Expand readability section
9. **E-E-A-T Evidence expansion** — Enhance existing section
10. **AEO Nuggets expansion** — Enhance existing section
11. **Issue Diff Table** — New section (most complex frontend piece)
12. **Test end-to-end** — Compare two URLs, verify all sections render with real data

---

## Verification

1. Compare two URLs from different sites — all 13 sections should render
2. Structured data section shows schema types, OG/Twitter presence
3. Issue diff shows unique findings per URL and shared findings
4. E-E-A-T evidence shows per-pillar proof items
5. AEO nuggets show extractable snippets with type badges
6. HTTP performance shows response time and page size deltas
7. Issue count bar shows visual breakdown by category
8. Content & SEO signals shows title/description with length indicators
9. Insights section includes new rules (issues, performance, structured data)
10. No N+1 queries — all data fetched in 2-3 queries max per URL
