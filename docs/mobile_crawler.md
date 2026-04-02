# Mobile Crawler Implementation Plan

**Status:** Complete
**Priority:** High — accessibility and performance audits are incomplete without mobile testing
**Estimated effort:** 3–4 implementation sessions

---

## Overview

The spider currently crawls every page with a desktop viewport and user agent only. This means:
- **Accessibility issues unique to mobile** (touch targets, zoom, viewport meta) are missed
- **Performance on mobile** (different Core Web Vitals, render-blocking behaviour) is untested
- **Responsive layout problems** (overflow, hidden content, broken navigation) are invisible

The mobile infrastructure already exists (`user-agents.service.ts` has 4 mobile user agents, 5 mobile viewports, and a `generateFingerprint('mobile')` function) — it's just never called.

---

## Key Decisions

### 1. Dual-pass vs single-pass
**Decision: Dual-pass (desktop crawl, then mobile audit pass on discovered pages).**

The mobile pass does NOT need to re-discover links. The desktop crawl discovers all URLs. The mobile pass takes the already-discovered page list and re-visits each page with a mobile fingerprint, running only accessibility and performance engines. This halves the mobile crawl time and avoids duplicate link discovery.

### 2. Findings storage
**Decision: Add `device_type` column to `audit_findings` table.**

Each finding is tagged as `desktop`, `mobile`, or `both`. The UI can then filter and display findings by device. Findings that appear on both passes are deduplicated and marked `both`.

### 3. Tier gating
**Decision: Mobile audits available at Starter tier and above.**

- Free: Desktop only (current behaviour)
- Starter / Pro / Agency / Enterprise: Desktop + mobile audit pass

Free tier stays desktop-only as an upgrade incentive. Mobile testing is important enough that paying users at any level should have it.

### 4. Page-level scores
**Decision: Add mobile scores alongside desktop scores on `audit_pages`.**

New columns: `mobile_accessibility_score`, `mobile_performance_score`, `mobile_accessibility_issues`, `mobile_performance_issues`. Desktop scores remain in existing columns.

### 5. Job-level configuration
**Decision: Add `include_mobile` boolean to `audit_jobs`.**

Default `false` for Free, `true` for Starter+. Can be toggled in the New Audit form for Starter+ users. Scheduled audits inherit from the user's tier.

---

## Database Changes

### Migration: `100_mobile_audit_support.sql`

```sql
-- Add mobile support to audit jobs
ALTER TABLE audit_jobs ADD COLUMN include_mobile BOOLEAN NOT NULL DEFAULT false;

-- Add device type to findings for filtering
ALTER TABLE audit_findings ADD COLUMN device_type VARCHAR(10) NOT NULL DEFAULT 'desktop'
  CHECK (device_type IN ('desktop', 'mobile', 'both'));

-- Add mobile scores to audit pages
ALTER TABLE audit_pages ADD COLUMN mobile_accessibility_score SMALLINT;
ALTER TABLE audit_pages ADD COLUMN mobile_performance_score SMALLINT;
ALTER TABLE audit_pages ADD COLUMN mobile_accessibility_issues INTEGER DEFAULT 0;
ALTER TABLE audit_pages ADD COLUMN mobile_performance_issues INTEGER DEFAULT 0;

-- Add mobile scores to audit jobs (aggregate)
ALTER TABLE audit_jobs ADD COLUMN mobile_accessibility_score SMALLINT;
ALTER TABLE audit_jobs ADD COLUMN mobile_performance_score SMALLINT;

-- Index for device-type filtering
CREATE INDEX idx_audit_findings_device_type ON audit_findings(device_type);

-- Composite index for common queries (findings by job + device)
CREATE INDEX idx_audit_findings_job_device ON audit_findings(audit_job_id, device_type);
```

---

## Backend Changes

### 1. Spider Service (`spider.service.ts`)

**Change:** Accept `deviceType` parameter in `crawlPage()`.

```typescript
// Before
async crawlPage(url: string): Promise<CrawlResult>

// After
async crawlPage(url: string, deviceType: 'desktop' | 'mobile' = 'desktop'): Promise<CrawlResult>
```

**Implementation:**
- Line 131: Change `generateFingerprint('desktop')` to `generateFingerprint(deviceType)`
- Add `deviceType` and `viewport` to the returned `CrawlResult` object

### 2. CrawlResult Type (`types/spider.types.ts`)

Add fields:
```typescript
interface CrawlResult {
  // ... existing fields
  deviceType: 'desktop' | 'mobile';
  viewport: { width: number; height: number };
}
```

### 3. Coordinator Service (`coordinator.service.ts`)

**This is the main orchestration change.** After the desktop crawl completes:

```
Desktop pass (existing):
  1. Crawl seed URL → discover links → crawl pages → run all engines → store findings

Mobile pass (new, if include_mobile=true):
  2. Get all crawled pages from audit_pages (status='crawled')
  3. For each page (respecting same rate limits):
     a. spider.crawlPage(url, 'mobile')
     b. Run accessibility engine only (axe-core with mobile viewport)
     c. Run performance engine only (mobile-specific checks)
     d. Store findings with device_type='mobile'
     e. Update mobile scores on audit_pages
  4. Deduplicate: findings identical on both passes → set device_type='both'
  5. Calculate aggregate mobile scores on audit_jobs
```

**Key details:**
- Mobile pass reuses the same spider instance (Playwright browser is already running)
- Rate limiting is shared — mobile requests count toward the same rate limit
- Progress tracking: update `current_url` with `[mobile] url` prefix so the UI shows mobile progress
- If a page fails on mobile but succeeded on desktop, log the error but don't mark the page as failed

### 4. Audit Engine Index (`audit-engines/index.ts`)

Add a new method for mobile-only analysis:

```typescript
async analyzeMobilePage(
  crawlResult: CrawlResult,
  page: Page | null,
  config: AuditConfig
): Promise<{ findings: Finding[] }>
```

This runs only:
- Accessibility engine (axe-core — touch targets, contrast at mobile zoom, focus indicators)
- Performance engine (mobile-specific subset — viewport meta, tap delay, font sizes, CLS on mobile)

SEO, security, content, and structured data are device-independent and don't need a mobile pass.

### 5. Accessibility Engine (`accessibility.engine.ts`)

No changes needed for the engine itself — axe-core automatically adapts to the viewport it's running in. When run on a 390x844 viewport, it will:
- Flag touch targets under 44x44px (WCAG 2.5.5 Target Size)
- Detect content that requires horizontal scrolling (WCAG 1.4.10 Reflow)
- Check zoom-triggered issues (WCAG 1.4.4 Resize Text)

The mobile viewport is set by the spider's context options, not by the engine.

### 6. Performance Engine (`performance.engine.ts`)

Add mobile-specific checks (new rules):

| Rule ID | Rule Name | What It Checks | Severity |
|---------|-----------|----------------|----------|
| `perf-mobile-viewport` | Missing Viewport Meta | `<meta name="viewport">` absent or malformed | Critical |
| `perf-mobile-tap-delay` | 300ms Tap Delay | Missing `touch-action: manipulation` or viewport width device-width | Moderate |
| `perf-mobile-font-size` | Small Mobile Font Size | Body font-size < 16px (causes zoom on iOS) | Moderate |
| `perf-mobile-touch-overflow` | Horizontal Scroll on Mobile | Content wider than viewport | Serious |
| `perf-mobile-unoptimized-images` | Large Images on Mobile | Images > 200KB without srcset serving smaller variants | Moderate |

These rules only run during the mobile pass (checked via `crawlResult.deviceType === 'mobile'`).

### 7. Finding Deduplication

After the mobile pass, deduplicate findings:

```typescript
async function deduplicateFindings(auditJobId: string): Promise<void> {
  // Find findings with identical rule_id + audit_page_id + selector
  // that exist as both desktop and mobile
  // → Set the desktop one to device_type='both', delete the mobile duplicate
  await pool.query(`
    WITH duplicates AS (
      SELECT f1.id as desktop_id, f2.id as mobile_id
      FROM audit_findings f1
      JOIN audit_findings f2
        ON f1.audit_job_id = f2.audit_job_id
        AND f1.audit_page_id = f2.audit_page_id
        AND f1.rule_id = f2.rule_id
        AND COALESCE(f1.selector, '') = COALESCE(f2.selector, '')
      WHERE f1.device_type = 'desktop'
        AND f2.device_type = 'mobile'
        AND f1.audit_job_id = $1
    )
    UPDATE audit_findings SET device_type = 'both'
    WHERE id IN (SELECT desktop_id FROM duplicates);

    DELETE FROM audit_findings
    WHERE id IN (SELECT mobile_id FROM duplicates);
  `, [auditJobId]);
}
```

### 8. Audit Service (`audit.service.ts`)

**Job creation:** Set `include_mobile` based on user tier.

```typescript
// In createAudit():
const includeMobile = ['starter', 'pro', 'agency', 'enterprise'].includes(userTier);
// ... insert with include_mobile
```

**Score calculation:** Calculate mobile scores separately.

### 9. API Routes (`routes/audits/index.ts`)

- Existing finding list endpoint: Add `device` query param filter (`desktop`, `mobile`, `both`, or `all`)
- Audit detail endpoint: Include mobile scores in response
- Page detail endpoint: Include mobile scores

### 10. Tier Configuration

Update `docs/TIERS.md` and the frontend tier comparison:

| Feature | Free | Starter | Pro | Agency | Enterprise |
|---------|------|---------|-----|--------|------------|
| Mobile audit pass | No | Yes | Yes | Yes | Yes |

---

## Frontend Changes

### 1. New Audit Form (`pages/audits/NewAudit.tsx`)

For Pro+ users, show a toggle:
```
☑ Include mobile audit
  Runs a second pass with a mobile viewport to catch touch target,
  responsive layout, and mobile performance issues.
```

### 2. Audit Detail Page (`pages/audits/AuditDetail.tsx`)

- Add device filter tabs above findings list: `All | Desktop | Mobile | Both`
- Show mobile scores alongside desktop scores in the score cards
- Badge on findings indicating device: 📱 (mobile only), 🖥️ (desktop only), or nothing (both)

### 3. Page Detail (`pages/audits/PageDetail.tsx`)

- Show desktop vs mobile score comparison
- Filter findings by device

### 4. Dashboard (`pages/dashboard/Dashboard.tsx`)

- If audit has mobile data, show mobile scores in the overview

### 5. PDF Export

- Add "Mobile Findings" section when `include_mobile` is true
- Show desktop vs mobile score comparison
- Mobile-only findings clearly labelled

### 6. CSV Export

- Add `device_type` column to exported findings

---

## Implementation Order

### Phase 1: Database + Types (30 min) -- DONE
1. ~~Create migration `100_mobile_audit_support.sql`~~ -- Done
2. ~~Update `CrawlResult` type with `deviceType` and `viewport`~~ -- Done
3. ~~Update `Finding` type with optional `deviceType`~~ -- Done
4. ~~Update TIERS.md~~ -- Done (Starter+)
5. ~~Update `spider.crawlPage()` to accept `deviceType` parameter~~ -- Done
6. ~~Update `storeFindings()` to accept and store `device_type`~~ -- Done
7. ~~Update `AuditJob` type with `include_mobile` and mobile scores~~ -- Done
8. ~~Fix test mock CrawlResult to include new fields~~ -- Done

### Phase 2: Spider + Engine Changes (1-2 hours) -- DONE
1. ~~Update `spider.crawlPage()` to accept `deviceType` parameter~~ -- Done (Phase 1)
2. ~~Add mobile-specific performance rules to `performance.engine.ts`~~ -- Done (5 rules: viewport meta, font size, overflow, images, tap delay)
3. ~~Add `analyzeMobilePage()` to audit engine index~~ -- Done (runs accessibility + mobile performance only)
4. ~~Add `analyzeMobile()` to performance engine~~ -- Done (runs standard + mobile-specific rules)
5. ~~Add finding deduplication function~~ -- Done (`deduplicateFindings()` merges desktop+mobile duplicates to `both`)

### Phase 3: Coordinator Dual-Pass (1-2 hours) -- DONE
1. ~~Update coordinator to check `include_mobile` on job~~ -- Done (audit-worker.service.ts)
2. ~~Implement mobile pass loop after desktop crawl~~ -- Done (iterates crawled HTML pages, creates mobile Playwright context with `isMobile: true, hasTouch: true`)
3. ~~Wire up mobile score calculation~~ -- Done (per-page mobile scores + aggregate job-level mobile scores)
4. ~~Update job progress tracking for mobile pass~~ -- Done (`[mobile] url` prefix on current_url, activity log messages)
5. ~~Call deduplication after mobile pass~~ -- Done (deduplicateFindings with activity log)
6. ~~Wire up `include_mobile` in all 4 audit creation points~~ -- Done (main route, v1 API, schedule service, re-audit)
7. ~~Set `include_mobile` based on tier~~ -- Done (Starter+ = any non-free tier)


### Phase 4: API + Frontend (1-2 hours) -- DONE
1. ~~Add `device` filter to findings API~~ -- Done (query param `device=desktop|mobile|both|all`)
2. ~~Add `include_mobile` to audit creation API~~ -- Done (Phase 3)
3. ~~Update New Audit form with mobile toggle~~ -- Done (checkbox in Advanced Options)
4. ~~Add device filter dropdown to Audit Detail findings tab~~ -- Done (only shows when mobile data exists)
5. ~~Update score display for mobile~~ -- Done (mobile A11y + mobile Perf score cards)
6. ~~Add `device_type` to frontend Finding type~~ -- Done
7. ~~Add mobile scores to Audit and AuditPage types~~ -- Done

### Phase 5: Exports + Polish (1 hour) -- DONE
1. ~~Update PDF export with mobile scores~~ -- Done (mobile score cards, device badges on findings)
2. ~~Update CSV export with device_type column~~ -- Done (Device column added)
3. ~~JSON export~~ -- Already includes device_type (SELECT * returns it)
4. ~~Update Pricing page~~ -- Done (Mobile Audit Pass row added, Starter+)












---

## Performance Considerations

- **Mobile pass is page-level only, not a full crawl.** No link discovery, no new pages added. This limits the cost to: (pages crawled) x (1 additional HTTP request + axe-core + perf checks).
- **Rate limiting is shared.** The mobile pass respects the same rate limit profile as desktop. Total crawl time roughly doubles for Pro+ users who enable mobile.
- **Memory:** Each mobile page visit creates a new Playwright context (same as desktop). Memory usage during mobile pass is identical to desktop pass. Contexts are closed immediately after each page.
- **Concurrency:** Mobile pass can reuse the same concurrency settings. On a 2GB droplet, this means 1-2 concurrent mobile pages (same as desktop).
- **Optional per-audit.** Users can disable mobile pass on individual audits if they only care about desktop. Scheduled audits default to include_mobile based on tier.

---

## What Mobile Audits Catch That Desktop Misses

| Issue | Why Mobile Catches It | WCAG Criteria |
|-------|----------------------|---------------|
| Touch targets too small (< 44x44px) | Only visible at mobile viewport | 2.5.5 Target Size (Enhanced) |
| Content requires horizontal scrolling | Hidden at desktop widths | 1.4.10 Reflow |
| Text too small without zooming | 16px+ is fine on desktop, not on mobile | 1.4.4 Resize Text |
| Missing viewport meta tag | Browsers zoom out on mobile | Performance / usability |
| Hamburger menu inaccessible | Only rendered at mobile breakpoints | 4.1.2 Name, Role, Value |
| Fixed positioning overlaps content | Only on small screens | 1.3.1 Info and Relationships |
| Hover-only interactions | No hover on touch devices | 1.4.13 Content on Hover or Focus |
| 300ms tap delay | Only affects touch browsers | Performance |
| Large images without srcset | Desktop image served to mobile | Performance |
| CLS differences | Layout shifts differ by viewport | Core Web Vitals |

---

## Competitive Advantage

Most affordable-tier competitors (A11y Pulse, Pope Tech) do not offer mobile viewport testing. Siteimprove does at enterprise pricing. Adding mobile audits at the Pro tier ($49/mo) is a genuine differentiator:

> "Kritano is the only tool under $100/month that audits both desktop and mobile viewports for accessibility and performance."

---

## Testing Plan

1. **Unit test:** Mobile-specific performance rules fire correctly
2. **Integration test:** Spider generates mobile fingerprint when `deviceType='mobile'`
3. **E2E test:** Create audit with `include_mobile=true`, verify mobile findings appear with correct `device_type`
4. **Deduplication test:** Same finding on both passes → merged to `device_type='both'`
5. **Tier gating test:** Free/Starter user cannot set `include_mobile=true`
6. **Visual test:** Audit detail page shows device filter tabs and mobile scores
