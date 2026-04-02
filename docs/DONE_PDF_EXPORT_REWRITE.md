# PDF Export Rewrite — PDFKit to Playwright HTML-to-PDF

## Context

The current PDF export uses PDFKit (programmatic x/y coordinate drawing) and produces a badly broken layout: score gauge arcs render incorrectly, stats cards stack vertically instead of horizontally, the date badge appears as a white rectangle, and the overall design looks unprofessional. Since **Playwright v1.58.0 is already installed** for web crawling, we can switch to HTML-to-PDF via `page.pdf()` with **zero new dependencies** — giving us full CSS layout control (flexbox, grid, SVG gauges, proper page breaks).

---

## Approach

Create a new service (`pdf-report.service.ts`) that builds a complete HTML document with embedded CSS, renders it via Playwright's headless Chromium, and returns a PDF buffer. The audit route replaces ~550 lines of PDFKit code with a single service call.

---

## Implementation Steps

### 1. Create PDF Report Service (NEW)
**File**: `server/src/services/pdf-report.service.ts`

**Exports:**
- `generateAuditPdf(data: PdfReportData): Promise<Buffer>` — main entry
- `shutdownPdfBrowser(): Promise<void>` — graceful shutdown

**Browser lifecycle:** Module-level singleton (`let browser: Browser | null`). `getBrowser()` launches if null, reuses otherwise. Mirrors spider.service.ts pattern for launch args (`--no-sandbox`, `--disable-dev-shm-usage`, `--disable-gpu`).

**PDF generation flow:**
1. Pre-fetch logo as base64 data URI (if agency+ with logoUrl) — 5s timeout, graceful fallback
2. Call `buildReportHtml(data)` to produce full HTML string
3. Create new browser context + page
4. `page.setContent(html, { waitUntil: 'load' })`
5. `page.pdf()` with A4 format, `printBackground: true`, `displayHeaderFooter: true` for page numbers + branding footer
6. Close context in `finally` block
7. Return PDF buffer

**Helper functions:**
- `svgGauge(score, size)` — SVG circle with `stroke-dasharray` for score visualization
- `getScoreColor(score)` — aligned with brand guidelines (90+=#10b981, 70+=#f59e0b, 50+=#f97316, <50=#ef4444)
- `severityColor(severity)` — critical=#ef4444, serious=#f97316, moderate=#f59e0b, minor=#64748b
- `escapeHtml(str)` — XSS-safe template interpolation
- `truncateUrl(url, max)` — URL display truncation

### 2. HTML Template Structure

All CSS embedded in `<style>` tag with CSS custom properties for branding colors. Content flows naturally with `break-before: page` for section breaks and `break-inside: avoid` for finding cards.

**Sections:**

| Section | Content |
|---------|---------|
| **Cover Page** | Branded header banner (primary color), logo (agency+), "Website Audit Report" title, domain, date, large SVG overall score gauge |
| **Score Overview** | 2x3 grid of category score cards (SEO, A11y, Security, Performance, Content, Structured Data) — each with mini SVG gauge + colored top bar. Only shows categories with non-null scores |
| **Key Stats** | 3-column row: Pages Crawled, Total Issues, Broken Links |
| **Executive Summary** | Issues by severity horizontal bar chart (CSS widths), Top 10 priorities list with severity badges |
| **Category Detail Pages** | One section per category (break-before: page). Colored header with score badge. Findings grouped by rule_id, sorted by severity. Each finding: severity badge, rule name, page count, message, recommendation, affected URLs (max 3 + overflow) |
| **Broken Links** | Table with status code badges (color-coded by 4xx/5xx), broken URL, source page. Max 40 rows |

**Footer:** Playwright's `displayHeaderFooter` with `footerTemplate` — "Page X of Y" left, `branding.footerText` right.

### 3. Refactor Audit Route
**File**: `server/src/routes/audits/index.ts`

- Remove `import PDFDocument from 'pdfkit'` (line 5)
- Add `import { generateAuditPdf } from '../../services/pdf-report.service.js'`
- Keep lines 1478-1545 (auth, audit query, branding check, findings query, broken links query)
- **Delete lines 1551-2067** (all PDFKit drawing code)
- Replace with single service call
- Move severity/category counting logic into the service (it's presentation logic)

### 4. Wire Up Graceful Shutdown
**File**: `server/src/index.ts`

Add `shutdownPdfBrowser()` call in the existing `shutdown()` function.

### 5. Remove PDFKit Dependency
```bash
cd server && npm uninstall pdfkit @types/pdfkit
```

---

## Critical Files

| File | Action |
|------|--------|
| `server/src/services/pdf-report.service.ts` | **NEW** — HTML template + Playwright PDF generation |
| `server/src/routes/audits/index.ts` | Remove ~550 lines of PDFKit, replace with service call |
| `server/src/index.ts` | Add `shutdownPdfBrowser()` to shutdown handler |
| `server/src/services/pdf-branding.service.ts` | Reference — `ResolvedBranding` interface (no changes) |
| `server/src/services/spider/spider.service.ts` | Reference — Playwright launch args pattern (no changes) |
| `server/package.json` | Remove pdfkit, @types/pdfkit |

## Verification

1. Export PDF for an audit with findings across all categories — verify layout, scores, colors
2. Export as free tier → 403
3. Export as starter with site branding → site colors, "Generated by Kritano" footer, no logo
4. Export as agency with org branding + logo → logo in header, custom footer
5. Audit with 0 findings → empty states render cleanly
6. Audit with 500+ findings → multi-page category sections flow correctly
7. Audit with 100 broken links → table pagination works
8. Logo URL that 404s → PDF generates without logo
