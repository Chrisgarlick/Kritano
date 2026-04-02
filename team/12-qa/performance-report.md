<!-- Version: 2 | Department: qa | Updated: 2026-04-02 -->

# Performance Baseline Report

**Date:** 2026-04-02
**Branch:** phase-16

---

## Bundle Analysis

### Total Build Output
- **Total dist size:** 12MB (includes source maps)
- **JS chunks:** 176 (code-split via React.lazy)

### Largest Bundles

| Bundle | Raw Size | Gzip Size | Status |
|--------|----------|-----------|--------|
| `charts-*.js` | 398 KB | 115 KB | **INFO** — Recharts (lazy-loaded) |
| `index-*.js` | 225 KB | 62 KB | OK — main app bundle |
| `vendor-*.js` | 165 KB | 54 KB | OK — shared vendor |
| `markdown-*.js` | 163 KB | 50 KB | OK — markdown renderer (lazy) |
| `AuditDetail-*.js` | 124 KB | 28 KB | OK |
| `PostEditorPage-*.js` | 81 KB | 24 KB | OK |
| `forms-*.js` | 78 KB | 21 KB | OK |

### Assessment
- Main bundle: 225 KB raw / 62 KB gzip — **below 500KB gate**
- All route bundles: <55 KB each — excellent code splitting
- Charts library is the largest single chunk but is lazy-loaded

---

## Code Splitting

| Check | Status |
|-------|--------|
| Route-level code splitting (React.lazy) | **PASS** — 78 routes |
| Heavy libraries isolated in separate chunks | **PASS** |
| Suspense fallback present | **PASS** |

---

## Anti-Pattern Checks

| Check | Status |
|-------|--------|
| Blocking scripts in `<head>` | **PASS** — `type="module"` |
| CSS-in-JS runtime overhead | **PASS** — Tailwind (build-time) |
| Missing lazy loading | **PASS** — all non-critical routes lazy |

---

## Performance Metrics

| Metric | Value | Gate | Status |
|--------|-------|------|--------|
| Main JS bundle | 225 KB (62 KB gzip) | < 500 KB | **PASS** |
| Largest chunk | 398 KB (115 KB gzip) | — | Lazy-loaded |
| Total JS chunks | 176 | — | Good splitting |
| Initial network requests | ~5-8 | < 50 | **PASS** |
| Blocking resources | 0 | 0 | **PASS** |

---

## Recommendations

| Priority | Item |
|----------|------|
| P3 | Monitor main bundle growth as features are added |
| P3 | Consider tree-shaking unused Recharts components if analytics pages become high-traffic |
| P3 | Add route prefetching for high-traffic transitions |
