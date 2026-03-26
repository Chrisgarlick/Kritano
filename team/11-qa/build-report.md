# Build Verification Report

**Date:** 2026-03-25
**Branch:** phase-15
**Scope:** Iteration 2 features (CQS, Fix Snippets, Compliance Passport) + Phase 15 bug fixes

---

## Client Build

### Vite Production Build: PASS
- `npx vite build` completes in ~4.4s
- No build errors
- All chunks generated successfully
- Largest bundle: `charts-ClowTTL5.js` at 398 KB (115 KB gzipped)

### TypeScript Compilation: 0 ERRORS (Fixed)

All 5 errors resolved on 2026-03-25:

| # | File | Error | Fix |
|---|------|-------|-----|
| 1 | `IndexExposureTab.tsx` | Unused `AlertTriangle` import | Removed import |
| 2 | `IndexExposureTab.tsx` | Unused `tier` variable | Changed to `[, setTier]` destructure |
| 3 | `RichSnippetPreview.tsx` | Unused `extractImage` function | Removed function |
| 4 | `SchemaTab.tsx` | Type mismatch on `setSummary` | Added `as SchemaSummary` cast |
| 5 | `RegisterForm.tsx` | `utmSource` not in `RegisterData` | Added `utmSource/utmMedium/utmCampaign` to interface |

---

## Server Build

### TypeScript Compilation: 66 ERRORS

**Breakdown by file:**

| File | Error Count | Category |
|------|-------------|----------|
| `services/audit-engines/security.engine.ts` | 16 | Implicit `any` on cheerio callbacks |
| `services/audit-engines/seo.engine.ts` | 20 | Implicit `any` on cheerio callbacks + missing `Root` export |
| `services/audit-engines/performance.engine.ts` | ~20 | Implicit `any` on cheerio callbacks |
| `services/audit-engines/index.ts` | ~5 | Related type issues |
| `services/spider/spider.service.ts` | 3 | Missing `Root` export + implicit `any` |
| `__tests__/email.service.test.ts` | ~2 | Test type issues |

**Root Causes:**
1. **Cheerio `Root` type missing** (2 occurrences): The installed cheerio version's CommonJS export no longer exposes `Root` as a named type. **Suggested Fix:** Use `import type { CheerioAPI } from 'cheerio'` instead of `Root`, or use `ReturnType<typeof cheerio.load>`.
2. **Implicit `any` on cheerio callbacks** (60+ occurrences): All `.each((_, el) => ...)` callbacks need typed parameters. **Suggested Fix:** Type as `(_: number, el: cheerio.Element) => void` or add explicit type annotations.

**Note:** These are pre-existing issues from earlier phases, not introduced by Iteration 2 features.

---

## npm Audit

- **Client:** Has audit warnings (non-breaking)
- **Server:** Has audit warnings (non-breaking)

---

## Verdict

| Component | Status |
|-----------|--------|
| Client Vite build | PASS |
| Client TypeScript | PASS (0 errors, all fixed) |
| Server TypeScript | FAIL (66 errors, pre-existing) |
| Dependencies install | PASS |

**Overall: CONDITIONAL PASS** — Client builds successfully with 0 TypeScript errors. Server TS errors are pre-existing cheerio type issues from earlier phases, not introduced by Iteration 2.

---

## Remaining Accessibility Issues (4 Minor — Deferred)

These are low-severity enhancements that were not fixed in this pass.

| # | Issue | Detail | Files Affected |
|---|-------|--------|----------------|
| A11Y-18 | Dark mode contrast not verified | Dark mode colour combos (e.g. `text-emerald-300` on `bg-emerald-900/20`) need manual contrast ratio checks. Requires visual testing in dark mode. | Multiple CQS and compliance components |
| A11Y-19 | Lock icons lack accessible description | Lock icons used for tier-gating have no `aria-label`. Parent text provides some context but screen readers miss the icon meaning. | `client/src/pages/audits/AccessibilityStatement.tsx` lines 389, 486 |
| A11Y-20 | ComplianceBadge icons rely on colour alone | Icon meaning (check, warning, cross) is reinforced only by colour. Text labels already present so impact is minimal. | `client/src/components/audit/ComplianceBadge.tsx` line 55 |
| A11Y-21 | Statement preview heading semantics | Preview title uses `Display` component without `as="h2"` prop, so it renders as a `<div>` instead of a heading. | `client/src/pages/audits/AccessibilityStatement.tsx` line 583 |

---

## Feature Gaps (Unfinished Iteration 2 Work)

These are not bugs — they are PRD requirements or CLAUDE.md rules that have not yet been implemented.

### P0 — Must Fix Before Launch — ALL FIXED (2026-03-25)

| # | Gap | Status | Fix Applied |
|---|-----|--------|-------------|
| 1 | Fix snippets in PDF export | FIXED | `pdf-report.service.ts`: Extended `PdfReportData` with `fixSnippets` map, added CSS + HTML rendering in `buildCategoryPage`. Route handler resolves snippets per rule_id with tier gating. |
| 2 | Fix snippets in CSV export | FIXED | `audits/index.ts` CSV handler: Added `Fix Explanation`, `Fix Code`, `Fix Effort` columns. Resolves via `resolveFixSnippet` with tier gating (free = no code). |
| 3 | Fix snippets in JSON export | FIXED | `audits/index.ts` JSON handler: Resolves fix snippets for each finding with tier gating before sending response. |
| 4 | Compliance in PDF export | FIXED | `pdf-report.service.ts`: Added `buildCompliancePage()` with status banner, summary cards, clause table, and disclaimer. Route handler resolves compliance data inline for Pro+ tiers. |

### P1 — Should Fix Before Launch — ALL FIXED (2026-03-25)

| # | Gap | Status | Fix Applied |
|---|-----|--------|-------------|
| 5 | CQS in analytics trend charts | FIXED | Added `cqs` to `ScoreCategory` type, `SCORE_CATEGORIES`, `CATEGORY_COLORS` (teal-500), `CATEGORY_LABELS`. Added `cqs: number | null` to all score interfaces in both client + server types. Added `cqs_score` to all SQL queries and mappings in `analytics.service.ts`. |
| 6 | CQS in shared public reports | FIXED | Added `cqs_score` to public-reports SQL query and response. Added CQS `ScoreCard` (Sparkles icon) to `SharedReport.tsx` grid — conditionally shown when score exists. |
| 7 | Syntax highlighting in code blocks | FIXED | Added regex-based `highlightCode()` to `FixSnippet.tsx`. Highlights keywords (`indigo-400`), strings (`emerald-400`), and comments (`slate-500`) for HTML/CSS/JS/JSON. No external dependency. |

### P2 — Fix Post-Launch — ALL FIXED (2026-03-25)

| # | Gap | Status | Fix Applied |
|---|-----|--------|-------------|
| 8 | CQS findings tagged by sub-score impact | FIXED | Created `server/src/data/cqs-impact-map.ts` mapping 50+ content rule_ids to CQS sub-scores. Findings endpoint attaches `cqsImpact: { subScores, weight }` to each content finding. |
| 9 | CQS findings sortable by impact | FIXED | Added `?sort=cqs_impact` query param to `GET /api/audits/:id/findings`. Sorts by CQS impact weight (highest first) in-memory after enrichment. |
| 10 | Short page flag (<100 words) | FIXED | Added `word_count` to content-quality endpoint page response. `CQSBreakdown.tsx` shows amber "Low content" warning with AlertTriangle icon for pages with <100 words. |
