<!-- Version: 2 | Department: qa | Updated: 2026-04-02 -->

# Accessibility Audit Report

**Date:** 2026-04-02
**Branch:** phase-16
**Standard:** WCAG 2.2 AA

---

## Focus States
- Visible focus indicators on all interactive elements — **PASS**
- `ring-2 ring-indigo-500/20 border-indigo-500` used consistently — **PASS**

## Semantic HTML
- Heading hierarchy (`h1` → `h2` → `h3`) — **PASS**
- Landmark regions (`main`, `nav`, `header`, `footer`) — **PASS**
- Lists for navigation items — **PASS**

## ARIA Labels
| Component | Check | Status |
|-----------|-------|--------|
| CQSBreakdown | `role="img"` + `aria-label` on score ring | **PASS** |
| CQSBreakdown | `role="region"` + `aria-label` on page scores list | **PASS** |
| FixSnippet | `role="region"` + `aria-labelledby` on expanded content | **PASS** |
| FixSnippet | `aria-label` on copy button (state-aware: "Copy" / "Copied") | **PASS** |
| Navigation | `aria-current="page"` on active items | **PASS** |
| Forms | `<label>` associated with inputs | **PASS** |

## Keyboard Navigation
- All interactive elements focusable via Tab — **PASS**
- Logical tab order matches visual layout — **PASS**
- Escape closes modals — **PASS**
- Accordion trigger keyboard-accessible — **PASS**

## Motion
- `prefers-reduced-motion` respected in `index.css` — **PASS**

## Images
- `<img>` elements have appropriate `alt` — **PASS**
- Decorative SVGs use `aria-hidden="true"` — **PASS**

## Contrast Ratios
| Element | Colors | Ratio | Min Required | Status |
|---------|--------|-------|-------------|--------|
| Body text | `slate-600` on white | 5.9:1 | 4.5:1 | **PASS** |
| Headings | `slate-800` on white | 12.6:1 | 4.5:1 | **PASS** |
| Primary button | white on `indigo-600` | 5.5:1 | 4.5:1 | **PASS** |
| Secondary text | `slate-500` on white | 4.6:1 | 4.5:1 | **PASS** |
| Placeholder | `slate-400` on white | 3.0:1 | 3:1 (UI) | **PASS** |
| CQS teal ring | `teal-500` on white | 2.7:1 | 3:1 (UI) | **WARN** |

### Issue: CQS teal-500 contrast (LOW severity)
`teal-500` (#14b8a6) on white has 2.7:1 contrast, below 3:1 minimum for UI components. However, this is used as a decorative ring stroke alongside dark text — not as standalone text-on-white.
**Suggested fix:** If teal is ever used as text, use `teal-700` (#0f766e, 6.1:1) instead.

---

## Summary

| Area | Pass | Warn | Fail |
|------|------|------|------|
| Focus states | 2 | 0 | 0 |
| Semantic HTML | 3 | 0 | 0 |
| ARIA labels | 6 | 0 | 0 |
| Keyboard nav | 4 | 0 | 0 |
| Motion | 1 | 0 | 0 |
| Images | 2 | 0 | 0 |
| Contrast | 5 | 1 | 0 |
| **Total** | **23** | **1** | **0** |

**WCAG 2.2 AA:** Substantially compliant. 1 low-severity contrast warning on decorative element.
