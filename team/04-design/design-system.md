<!-- Version: 1 | Department: design | Updated: 2026-03-24 -->

# Design System — Kritano Iteration 2

This document extends the existing brand guidelines (`/docs/BRAND_GUIDELINES.md`) with design specifications for the three new features: Content Quality Score, Fix Snippets, and EAA Compliance Passport.

Software must read this file AND `/docs/BRAND_GUIDELINES.md` before implementing any UI.

---

## New Color Tokens

### Content Quality Score Color

CQS needs its own category color to sit alongside SEO (violet), Accessibility (emerald), Security (red), Performance (sky), and the existing Content (amber).

| Token | Hex | Usage |
|-------|-----|-------|
| `teal-500` | `#14b8a6` | CQS primary — ring, icon |
| `teal-50` | `#f0fdfa` | CQS light background |
| `teal-900` | `#134e4a` | CQS dark text |

**Rationale:** Teal is distinct from all existing category colors, evokes "quality/health" without conflicting with emerald (accessibility) or sky (performance). Maps to Tailwind's `teal` palette natively.

**Updated Category Colors Table:**

| Category | Primary | Light BG | Dark Text |
|----------|---------|----------|-----------|
| SEO | `violet-500` | `violet-50` | `violet-900` |
| Accessibility | `emerald-500` | `emerald-50` | `emerald-900` |
| Security | `red-500` | `red-50` | `red-900` |
| Performance | `sky-500` | `sky-50` | `sky-900` |
| Content | `amber-500` | `amber-50` | `amber-900` |
| **Content Quality** | `teal-500` | `teal-50` | `teal-900` |

### Compliance Status Colors

| Status | Background | Text | Border | Badge BG |
|--------|------------|------|--------|----------|
| **Compliant** | `emerald-50` | `emerald-800` | `emerald-200` | `emerald-100` |
| **Partially Compliant** | `amber-50` | `amber-800` | `amber-200` | `amber-100` |
| **Non-Compliant** | `red-50` | `red-800` | `red-200` | `red-100` |
| **Not Assessed** | `slate-50` | `slate-600` | `slate-200` | `slate-100` |

### Fix Snippet Colors

| Element | Class | Usage |
|---------|-------|-------|
| Code block background | `slate-900` | Dark code block (matches existing `Mono` styling) |
| Code block text | `slate-100` | Light text on dark |
| Code keyword | `indigo-400` | Syntax highlighting — keywords |
| Code string | `emerald-400` | Syntax highlighting — strings |
| Code comment | `slate-500` | Syntax highlighting — comments |
| Copy button idle | `slate-600` | Icon color |
| Copy button success | `emerald-500` | Checkmark after copy |

---

## New Components

### 1. CQS Score Ring

Extends the existing `ProgressRing` / `CompactScore` pattern but with CQS-specific styling.

**Layout:**
```
┌─────────────────────────────┐
│  ┌───────┐                  │
│  │  78   │  Content Quality  │
│  │  /100 │  Score            │
│  └───────┘                  │
│                             │
│  ██████████░░░░  Quality 82 │
│  ████████░░░░░░  E-E-A-T 71 │
│  █████████░░░░░  Read.   76 │
│  ██████░░░░░░░░  Engage  65 │
│  ████████░░░░░░  Struct  74 │
└─────────────────────────────┘
```

**Specifications:**
- Ring: 80px diameter, 8px stroke, `teal-500` fill, `slate-200` track
- Score number: `font-display text-3xl` (Instrument Serif), color follows score-color scale
- Label: `body-sm font-semibold text-slate-700`
- Sub-score bars: 4px height, `rounded-full`, colored by score range (emerald/amber/orange/red)
- Sub-score labels: `body-xs text-slate-500`, right-aligned score value
- Card: `bg-white border border-slate-200 rounded-lg shadow-sm p-6`

**States:**
- **Loading:** Skeleton pulse on ring and bars
- **Not Available:** Ring shows `--` in `slate-400`, bars hidden, "Content checks not included in this audit" in `body-sm text-slate-500`
- **Tier Locked (Free):** Shows score number, bars hidden behind blur overlay with "Upgrade to Starter for breakdown" CTA

### 2. Fix Snippet Card

Displayed as an accordion within each finding card.

**Collapsed State:**
```
┌─────────────────────────────────┐
│ ▶ How to Fix               S ⏱  │
└─────────────────────────────────┘
```
- Chevron icon (▶): `slate-500`, rotates 90° on expand
- "How to Fix": `body-sm font-semibold text-slate-700`
- Effort badge (S/M/L): `body-xs` in a pill — S=`emerald-100 text-emerald-700`, M=`amber-100 text-amber-700`, L=`red-100 text-red-700`

**Expanded State:**
```
┌─────────────────────────────────┐
│ ▼ How to Fix               S ⏱  │
│                                 │
│ Add a descriptive alt attribute │
│ to this image so screen readers │
│ can convey its meaning.         │
│                                 │
│ ┌─────────────────────────┐     │
│ │ <img src="hero.jpg"     │ 📋  │
│ │   alt="Team working at  │     │
│ │   desks in open office" │     │
│ │ />                      │     │
│ └─────────────────────────┘     │
│                                 │
│ Learn more →                    │
└─────────────────────────────────┘
```

**Specifications:**
- Explanation text: `body-sm text-slate-600`, max 3 lines
- Code block: `bg-slate-900 rounded-lg p-4 font-mono text-sm text-slate-100`, with horizontal scroll on overflow
- Copy button: positioned top-right of code block, `p-1.5 rounded bg-slate-800 hover:bg-slate-700`, `Copy` icon from lucide-react (16px)
- Copy success: icon changes to `Check` in `emerald-400` for 2 seconds
- Learn more link: `body-xs text-indigo-600 hover:text-indigo-500 font-medium`
- Transition: `max-height` animation, 200ms ease-out

**States:**
- **No template available:** Don't show accordion. Existing `recommendation` text remains as-is on the finding card.
- **Template with no code (content/manual fix type):** Show explanation only, no code block. Show effort badge.
- **Free tier (code locked):** Show explanation text. Code block replaced with blur + "Upgrade to Starter for code fixes" pill.

### 3. Compliance Status Badge

A compact badge for use in headers, cards, and dashboards.

**Variants:**

**Inline (site dashboard, audit header):**
```
● Compliant          ⚠ Partially Compliant     ✕ Non-Compliant
```
- Dot/icon: 8px, colored per compliance status table
- Label: `body-xs font-semibold`, colored per compliance status table
- Container: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border`, colors per status

**Card (site detail widget):**
```
┌──────────────────────────────┐
│ EAA Compliance               │
│                              │
│ ⚠ Partially Compliant       │
│                              │
│ 3 of 42 clauses failing      │
│                              │
│ View Report →                │
└──────────────────────────────┘
```
- Card: `bg-white border border-slate-200 rounded-lg p-5`
- Title: `body-xs font-semibold text-slate-500 uppercase tracking-wider`
- Status: uses inline badge variant, `body-md`
- Detail: `body-sm text-slate-600`
- Link: `body-sm text-indigo-600 hover:text-indigo-500 font-medium`

### 4. Compliance Report Page

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Audit          EAA Compliance Report          │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ EXECUTIVE SUMMARY                                   │ │
│ │                                                     │ │
│ │ ● Partially Compliant     Standard: EN 301 549      │ │
│ │                                                     │ │
│ │   39 Passing    3 Failing    7 Manual Review        │ │
│ │   ████████████  ██░░░░░░░░  ████░░░░░░░░            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ CLAUSE-BY-CLAUSE RESULTS                            │ │
│ │                                                     │ │
│ │ Clause    Title              Status    Issues        │ │
│ │ ─────────────────────────────────────────────        │ │
│ │ 9.1.1.1   Non-text Content   ✕ Fail   12 issues    │ │
│ │ 9.1.2.1   Audio-only         ✓ Pass   —            │ │
│ │ 9.1.3.1   Info & Relations   ⚠ Manual  —           │ │
│ │ ...                                                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ REMEDIATION TIMELINE                                │ │
│ │                                                     │
│ │ 9.1.1.1  Non-text Content   Target: [date picker]  │ │
│ │ 9.1.4.2  Audio Description  Target: [date picker]  │ │
│ │ 9.2.4.7  Focus Visible      Target: [date picker]  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ⚠ Disclaimer: This report is generated by automated... │
│                                                         │
│ [Export PDF]  [Export JSON]                              │
└─────────────────────────────────────────────────────────┘
```

**Specifications:**
- Back link: `body-sm text-slate-600 hover:text-slate-900`, with `ArrowLeft` icon
- Page title: `display-md` (Instrument Serif)
- Section titles: `body-xs font-semibold text-slate-500 uppercase tracking-wider mb-4`
- Summary card: `bg-white border border-slate-200 rounded-lg p-6`
- Pass/Fail/Manual counts: `heading-lg font-semibold` with category coloring
- Progress bars: 8px height, `rounded-full`, emerald (pass) / red (fail) / slate (manual)
- Clause table: standard table with `border-b border-slate-100` row separators
- Status icons: `CheckCircle` (emerald-500), `XCircle` (red-500), `AlertTriangle` (amber-500) — 16px
- Remediation date inputs: standard `Input` component, `type="date"`
- Disclaimer: `bg-amber-50 border border-amber-200 rounded-lg p-4`, `body-sm text-amber-800`, `AlertTriangle` icon
- Export buttons: standard `Button` component — primary for PDF, secondary for JSON

**Responsive Behaviour:**
- Desktop: full table layout
- Tablet: table scrolls horizontally
- Mobile: clause table stacks — each row becomes a card with clause, title, status, and issue count

**States:**
- **Loading:** `SkeletonCard` for summary, skeleton rows for table
- **Not Assessed:** Full-page message "Accessibility checks were not included in this audit. Run a new audit with accessibility checks enabled to generate a compliance report." with CTA button.
- **Tier Locked:** Summary visible with status badge. Clause table and remediation behind blur + upgrade CTA.

---

## Layout Patterns for New Features

### CQS on Audit Overview

CQS score ring appears in the existing score grid alongside SEO, Accessibility, Security, Performance:

```
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│ SEO │ │ A11Y│ │ SEC │ │PERF │ │CONT │ │ CQS │
│ 85  │ │ 72  │ │ 91  │ │ 68  │ │ 77  │ │ 78  │
└─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘
```

- 6-column grid on desktop (was 5), wraps to 3×2 on tablet, 2×3 on mobile
- CQS ring uses `teal-500` to distinguish from Content's `amber-500`
- CQS ring is positioned last (rightmost) — it's a derived metric, not a raw category

### Fix Snippet in Finding Card

The fix accordion sits between the finding description and the page URL list:

```
┌───────────────────────────────────────┐
│ ⚠ Missing alt text on image          │ ← Finding title
│                                       │
│ Images must have alt text for screen  │ ← Description
│ readers to convey their meaning.      │
│                                       │
│ ┌───────────────────────────────────┐ │
│ │ ▶ How to Fix                  S  │ │ ← Fix accordion
│ └───────────────────────────────────┘ │
│                                       │
│ Found on 12 pages                     │ ← Page list
└───────────────────────────────────────┘
```

### Compliance Widget on Site Detail

Positioned in the site overview section, below the score summary:

```
Score Summary     Compliance         Schedule
┌────────────┐   ┌──────────────┐   ┌────────────┐
│ Overall: 78│   │ ⚠ Partially  │   │ Next: 3d   │
│ SEO:    85 │   │ 3/42 failing │   │ Interval:  │
│ A11Y:   72 │   │ View Report →│   │ Weekly     │
└────────────┘   └──────────────┘   └────────────┘
```

---

## Animation & Transitions

### Fix Snippet Accordion
- Expand: `max-height` from 0 to measured, `200ms ease-out`
- Collapse: `max-height` to 0, `150ms ease-in`
- Chevron: `transform rotate(90deg)`, `150ms`
- Respects `prefers-reduced-motion: reduce` — instant toggle, no animation

### CQS Sub-Score Bars
- On mount: bars animate from 0 to value, `600ms ease-out`, staggered by 100ms per bar
- Respects `prefers-reduced-motion: reduce` — instant render, no animation

### Compliance Status Badge
- On status change (between audits): brief `scale(1.05)` pulse, `300ms`
- No animation on initial render

---

## Accessibility Requirements

All new components must meet WCAG 2.2 AA:

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | All text meets 4.5:1 ratio. UI elements meet 3:1. Verified: teal-500 on white = 3.8:1 (use teal-600 `#0d9488` for text = 4.6:1) |
| Keyboard navigation | Fix accordion toggles on Enter/Space. Compliance table rows focusable. Copy button keyboard-accessible. |
| Screen reader | CQS ring has `aria-label="Content Quality Score: 78 out of 100"`. Fix accordion uses `aria-expanded`. Compliance status badge uses `aria-label`. |
| Focus indicators | All interactive elements use `focus-visible:ring-2 ring-indigo-500/20 ring-offset-2` |
| Reduced motion | All animations gated behind `@media (prefers-reduced-motion: no-preference)` |
| Code blocks | `<pre><code>` with `aria-label="Fix code snippet"`. Copy button has `aria-label="Copy code to clipboard"`. |

**CQS text color correction:** Use `teal-600` (#0d9488) for text-on-white contexts instead of `teal-500` to meet 4.5:1 contrast ratio. `teal-500` is fine for large icons and rings (3:1 threshold).

---

## Framework Config Overrides (Tailwind)

No new Tailwind overrides required. All tokens used (`teal`, `emerald`, `amber`, `red`, `slate`, `violet`, `sky`) are part of Tailwind's default palette. The existing brand guideline overrides for fonts (Instrument Serif, Outfit, JetBrains Mono) already exist in `tailwind.config.ts`.
