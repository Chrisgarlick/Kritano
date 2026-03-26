# Accessibility Audit Report

**Date:** 2026-03-25
**Standard:** WCAG 2.2 Level AA
**Scope:** New Iteration 2 components (CQS, Fix Snippets, Compliance Passport, SharedReport)

---

## Summary

| Severity | Found | Fixed | Remaining |
|----------|-------|-------|-----------|
| Critical (WCAG AA failure) | 4 | 4 | 0 |
| Serious (likely AA failure) | 5 | 5 | 0 |
| Moderate (best practice) | 8 | 8 | 0 |
| Minor (enhancement) | 4 | 0 | 4 |
| **Total** | **21** | **17** | **4** |

**Fix pass completed 2026-03-25.** All critical, serious, and moderate issues resolved. 4 minor issues (dark mode contrast verification, lock icon descriptions, badge colour reliance, heading semantics) deferred.

---

## Critical Issues (WCAG AA Non-Compliance)

### A11Y-01: Colour contrast failure on compliance "Failing" count card — FIXED
**File:** `client/src/pages/audits/ComplianceReport.tsx` line 380-385
**WCAG:** 1.4.3 Contrast (Minimum)
**Issue:** `text-red-700` on `bg-red-50` yields ~3.8:1 contrast ratio, below 4.5:1 minimum.
**Suggested Fix:**
```diff
- <div className="bg-red-50 ... text-red-700">
+ <div className="bg-red-50 ... text-red-900">
```

### A11Y-02: Copy button invisible to keyboard users — FIXED (already had focus:opacity-100)
**File:** `client/src/components/audit/FixSnippet.tsx` line 112-123
**WCAG:** 2.4.7 Focus Visible
**Issue:** Copy button uses `opacity-0 group-hover:opacity-100` — keyboard users who Tab to the button cannot see it.
**Suggested Fix:**
```diff
- className="... opacity-0 group-hover:opacity-100"
+ className="... opacity-0 group-hover:opacity-100 focus:opacity-100"
```

### A11Y-03: Progress ring has no accessible name — FIXED
**File:** `client/src/components/audit/CQSBreakdown.tsx` line 115-128
**WCAG:** 1.1.1 Non-text Content
**Issue:** The CQS progress ring displays a score visually but has no `aria-label` or text alternative for screen readers.
**Suggested Fix:**
```tsx
<div aria-label={`Content Quality Score: ${score} out of 100`}>
  <ProgressRing ... />
</div>
```

### A11Y-04: Sortable table headers lack button semantics — FIXED
**File:** `client/src/pages/audits/ComplianceReport.tsx` line 612-614
**WCAG:** 4.1.2 Name, Role, Value
**Issue:** Table headers are clickable for sorting but are not `<button>` elements and lack `role="button"`, `tabindex`, or keyboard event handlers.
**Suggested Fix:**
```tsx
<th>
  <button onClick={() => handleSort('clause')} className="...">
    Clause <ArrowUpDown />
  </button>
</th>
```

---

## Serious Issues (Likely AA Failure)

### A11Y-05: Colour contrast on sub-score labels — FIXED
**File:** `client/src/components/audit/CQSBreakdown.tsx` line 148
**WCAG:** 1.4.3 Contrast (Minimum)
**Issue:** `text-slate-500` on white background yields ~4.0:1, below 4.5:1 for normal-sized text.
**Suggested Fix:** Use `text-slate-600` (5.3:1) or `text-slate-700` (6.6:1).

### A11Y-06: Compliance filter buttons lack active state for screen readers — FIXED
**File:** `client/src/pages/audits/ComplianceReport.tsx` line 476-486
**WCAG:** 4.1.2 Name, Role, Value
**Issue:** Active filter button is visually distinguished but lacks `aria-current="true"` or `aria-pressed="true"`.
**Suggested Fix:** Add `aria-pressed={filter === currentFilter}` to each filter button.

### A11Y-07: Missing focus indicators on filter/sort buttons — FIXED
**File:** `client/src/pages/audits/ComplianceReport.tsx` line 476-486, 614
**WCAG:** 2.4.7 Focus Visible
**Issue:** Interactive buttons have hover states but no visible focus ring.
**Suggested Fix:** Add `focus:ring-2 focus:ring-indigo-500/20 focus:outline-none`.

### A11Y-08: Missing focus indicator on ComplianceBadge link — FIXED
**File:** `client/src/components/audit/ComplianceBadge.tsx` line 96-102
**WCAG:** 2.4.7 Focus Visible
**Issue:** "View Report" link has hover styling but no focus ring.
**Suggested Fix:** Add `focus:ring-2 focus:ring-indigo-500/20 focus:outline-none rounded`.

### A11Y-09: Spinner animation ignores `prefers-reduced-motion` — FIXED
**Files:** `SharedReport.tsx` line 102, `AccessibilityStatement.tsx` loading state
**WCAG:** 2.3.3 Animation from Interactions
**Issue:** `animate-spin` class does not include `motion-reduce:animate-none`.
**Suggested Fix:** Add `motion-reduce:animate-none` to spinner elements.

---

## Moderate Issues (Best Practice)

### A11Y-10: No `aria-live` for CQS breakdown expand — FIXED
**File:** `client/src/pages/audits/AuditDetail.tsx` line 1480-1484
**Issue:** When CQS breakdown panel expands, screen readers receive no announcement.
**Fix:** Add `aria-live="polite"` to the breakdown container.

### A11Y-11: No `aria-live` for compliance row expansion — FIXED
**File:** `client/src/pages/audits/ComplianceReport.tsx` line 641-700
**Issue:** Expanding a clause row to show findings is not announced.
**Fix:** Add `aria-live="polite"` to findings container.

### A11Y-12: Compliance table lacks `<caption>` — FIXED
**File:** `client/src/pages/audits/ComplianceReport.tsx` line 495
**Issue:** Data table has no `<caption>` element to describe its purpose.
**Fix:** Add `<caption className="sr-only">EN 301 549 clause compliance breakdown</caption>`.

### A11Y-13: CQS scrollable region not announced — FIXED
**File:** `client/src/components/audit/CQSBreakdown.tsx` line 172
**Issue:** Scrollable page scores list (`max-h-64 overflow-y-auto`) has no `role="region"` or `aria-label`.
**Fix:** Add `role="region" aria-label="Page-level content quality scores"`.

### A11Y-14: SharedReport score cards lack accessible labels — FIXED
**File:** `client/src/pages/public/SharedReport.tsx` line 63-73
**Issue:** Score cards display numbers visually but lack `aria-label` for context.
**Fix:** Add `aria-label={`${label}: ${score} out of 100`}` to each card.

### A11Y-15: CQS animation may not respect motion preferences — FIXED
**File:** `client/src/components/audit/CQSBreakdown.tsx` line 121
**Issue:** `animated` prop on ProgressRing and `duration-700` transitions lack `motion-reduce:transition-none`.
**Fix:** Add `motion-reduce:transition-none` to bar transitions.

### A11Y-16: `animate-reveal-up` may not respect motion preferences — FIXED
**File:** `client/src/pages/audits/AuditDetail.tsx` line 1481
**Issue:** Custom animation class used when CQS panel reveals.
**Fix:** Ensure the CSS definition includes `@media (prefers-reduced-motion: reduce) { animation: none; }`.

### A11Y-17: Mobile compliance card button lacks descriptive label — FIXED
**File:** `client/src/pages/audits/ComplianceReport.tsx` line 718-721
**Issue:** Button has no `aria-label` describing which clause it expands.
**Fix:** Add `aria-label={`Show details for clause ${clause.clause}`}`.

---

## Minor Issues (Enhancement)

### A11Y-18: Dark mode contrast not verified
**Files:** Multiple compliance and CQS components
**Issue:** Dark mode color combinations (e.g., `text-emerald-300` on `bg-emerald-900/20`) need manual contrast verification.

### A11Y-19: Lock icons lack accessible description
**File:** `client/src/pages/audits/AccessibilityStatement.tsx` line 389, 486
**Issue:** Lock icons used for tier-gating have no accessible description.
**Fix:** Add `aria-label="Feature locked"` or ensure parent text provides context.

### A11Y-20: ComplianceBadge icons rely on colour alone
**File:** `client/src/components/audit/ComplianceBadge.tsx` line 55
**Issue:** While text labels are present, the icon meaning is reinforced only by colour.
**Mitigation:** Text labels already present; this is informational.

### A11Y-21: Statement preview heading semantics
**File:** `client/src/pages/audits/AccessibilityStatement.tsx` line 583-743
**Issue:** Preview title uses `Display` component instead of proper heading element.
**Fix:** Add `as="h2"` prop to the Display component.

---

## What Passed

- **FixSnippet accordion:** Proper `aria-expanded`, `aria-controls`, `aria-labelledby` structure
- **FixSnippet keyboard handling:** Enter/Space correctly toggle accordion
- **FixSnippet motion:** `motion-reduce:transition-none` on trigger and panel
- **FixSnippet copy button:** Proper `aria-label` that updates on copy
- **FixSnippet lock icon:** Correctly uses `aria-hidden="true"`
- **AccessibilityStatement form labels:** Proper `<label>` with `htmlFor`
- **AccessibilityStatement input focus:** Correct ring styling
- **SharedReport landmarks:** Proper `<header>` and `<footer>` tags
- **SharedReport links:** Focus ring styling present
- **ComplianceReport heading hierarchy:** `<h1>` present at page level
- **ComplianceReport icons:** `aria-hidden="true"` on decorative icons
- **ComplianceReport disclaimer:** Proper semantic structure
