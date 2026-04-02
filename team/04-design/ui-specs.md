<!-- Version: 1 | Department: design | Updated: 2026-03-24 -->

# UI Specifications — Kritano Iteration 2

Screen-by-screen specs for the three new features. Read `design-system.md` first for component definitions and color tokens.

---

## Screen 1: CQS on Audit Overview

**Location:** `/audits/:id` — audit detail page, score summary section

### Content Hierarchy
1. **CQS Score Ring** (highest visual weight — same prominence as SEO/A11Y rings)
2. **Sub-score breakdown** (secondary — visible on click/expand for Starter+)
3. **"What is CQS?"** tooltip (tertiary — help text for first-time users)

### Desktop Layout (≥1024px)
- Score rings in a 6-column grid: SEO | A11Y | SEC | PERF | Content | **CQS**
- Each ring: 80px diameter, score number centred, category label below
- CQS ring: teal-500 stroke colour
- Click on CQS ring expands a breakdown panel below the grid (full width)

### Breakdown Panel (expanded)
```
┌─────────────────────────────────────────────────────────┐
│ Content Quality Breakdown                           ✕   │
│                                                         │
│ Quality   ████████████████░░░░  82   Readability ██████████████░░░░░░  76 │
│ E-E-A-T   ██████████████░░░░░░  71   Engagement ████████████░░░░░░░░  65 │
│ Structure ██████████████░░░░░░  74                                    │
│                                                         │
│ Your content quality is GOOD. E-E-A-T and engagement    │
│ scores are holding your CQS back. Improving author      │
│ bios and adding more CTAs would have the biggest impact.│
└─────────────────────────────────────────────────────────┘
```

- Bars: 8px height, `rounded-full`, coloured by score range
- Summary text: `body-sm text-slate-600`, 2-3 sentences max
- Close button: `X` icon top-right, `text-slate-400 hover:text-slate-600`
- Panel animation: slide down 200ms ease-out

### Tablet Layout (768-1023px)
- Score rings in 3-column grid (2 rows)
- Breakdown panel full-width below grid

### Mobile Layout (<768px)
- Score rings in 2-column grid (3 rows)
- Breakdown panel full-width, bars stack vertically

### States
| State | Behaviour |
|-------|-----------|
| Loading | Skeleton ring + pulsing bars |
| No data (content checks not run) | Ring shows `--`, `text-slate-400`. No breakdown. Tooltip: "Run an audit with content checks to see your CQS." |
| Free tier | Ring shows score number. Breakdown locked: blurred overlay + "Upgrade to Starter" pill |
| Perfect score (100) | Ring in `emerald-500`, confetti micro-animation (if `prefers-reduced-motion: no-preference`) |

---

## Screen 2: Fix Snippet on Finding Cards

**Location:** `/audits/:id` — findings list, within each finding card

### Content Hierarchy
1. **Finding severity + title** (existing — unchanged)
2. **Finding description** (existing — unchanged)
3. **Fix accordion** (new — between description and page list)
4. **Page list** (existing — unchanged)

### Interaction Flow
1. User sees finding card with collapsed "How to Fix" accordion
2. Clicks accordion → expands to show explanation + code block
3. Hovers over code block → Copy button highlights
4. Clicks Copy → code copied, button shows checkmark for 2s
5. Clicks "Learn more" → navigates to blog post in new tab

### Accordion Behaviour
- **Collapsed:** Single row — chevron, "How to Fix" label, effort pill
- **Expanded:** Explanation paragraph + code block + learn more link
- **Transition:** 200ms max-height ease-out (expand), 150ms ease-in (collapse)
- **Keyboard:** Enter/Space to toggle, focus ring on the toggle row
- **ARIA:** `aria-expanded="true|false"` on toggle, `aria-controls` pointing to content ID

### Code Block
- Dark theme: `bg-slate-900 rounded-lg p-4`
- Font: JetBrains Mono, `text-sm leading-relaxed`
- Max height: 200px, scrollable if taller
- Copy button: absolute positioned top-right, `p-1.5 bg-slate-800 hover:bg-slate-700 rounded`
- After copy: icon swaps `Copy` → `Check` (emerald-400) for 2000ms

### Responsive Behaviour
- All breakpoints: accordion is full-width within the finding card
- Mobile: code block has horizontal scroll for long lines

### States
| State | Behaviour |
|-------|-----------|
| Has template with code | Full accordion: explanation + code block + learn more |
| Has template, no code (content/manual fix) | Accordion with explanation only, no code block. Effort badge still shown. |
| No template | No accordion shown. Existing `recommendation` text displays as before. |
| Free tier | Accordion shows explanation text. Code block replaced with `bg-slate-100 rounded-lg p-4 text-center text-slate-500 body-sm` + lock icon + "Upgrade to Starter for code fixes" |

---

## Screen 3: EAA Compliance Report

**Location:** `/audits/:id/compliance` — new page

### Page Structure
1. **Header** — back navigation + page title + export buttons
2. **Executive Summary card** — status badge, pass/fail/manual counts, progress bars
3. **Clause-by-Clause table** — sortable, filterable
4. **Failing Clauses detail** — expanded view with findings + fix links
5. **Remediation Timeline** — editable date fields per failing clause
6. **Regulatory Context** — static informational section
7. **Disclaimer** — amber warning box

### Header
```
← Back to Audit                        [Export PDF] [Export JSON]

EAA Compliance Report
example.com — Audited 24 Mar 2026
```
- Back link: `ArrowLeft` icon + "Back to Audit", `body-sm text-slate-600`
- Title: `display-md` (Instrument Serif)
- Subtitle: `body-sm text-slate-500`
- Export buttons: right-aligned, `Button` primary (PDF) + secondary (JSON)

### Executive Summary Card
```
┌──────────────────────────────────────────────────┐
│                                                  │
│  ⚠ Partially Compliant                          │
│  Standard: WCAG 2.2 Level AA / EN 301 549        │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │    39    │  │    3     │  │    7     │       │
│  │ Passing  │  │ Failing  │  │ Manual   │       │
│  └──────────┘  └──────────┘  └──────────┘       │
│                                                  │
│  ████████████████████████████░░░  80% assessed   │
│                                                  │
└──────────────────────────────────────────────────┘
```
- Card: `bg-white border border-slate-200 rounded-lg p-8`
- Status badge: uses Compliance Status Badge component (from design-system.md), `heading-lg` size
- Standard label: `body-sm text-slate-500`
- Count cards: `bg-emerald-50` (passing), `bg-red-50` (failing), `bg-slate-50` (manual) — `p-4 rounded-lg text-center`
- Count number: `heading-xl font-bold`, coloured per category
- Count label: `body-xs text-slate-600`
- Progress bar: full-width, 8px height, segmented (emerald | red | slate)

### Clause Table
| Column | Width | Content |
|--------|-------|---------|
| Clause | 80px | `9.1.1.1` in `mono-sm` |
| Title | flex | EN 301 549 clause title in `body-sm` |
| Status | 100px | Icon + label badge |
| Issues | 80px | Count or `—` |
| Action | 100px | "View" link to jump to detail |

- Header: `bg-slate-50 text-slate-500 body-xs font-semibold uppercase`
- Rows: `border-b border-slate-100`, `hover:bg-slate-50`
- Status column: `CheckCircle` (emerald), `XCircle` (red), `AlertTriangle` (amber) — 16px icons
- Sortable by: Status (fail-first default), Clause number, Issue count
- Filterable: "Show all" / "Failing only" / "Manual review" toggle pills

### Remediation Timeline
- Only shown for failing clauses
- Each row: clause label + title + date picker input
- Date picker: standard `Input` component, `type="date"`, `w-40`
- Save behaviour: auto-save on date change (debounced 500ms), toast confirmation
- Empty state: placeholder text "Set target date"

### Disclaimer Box
- Container: `bg-amber-50 border border-amber-200 rounded-lg p-4 mt-8`
- Icon: `AlertTriangle` in `amber-500`, 20px
- Title: `body-sm font-semibold text-amber-900` — "Important Disclaimer"
- Text: `body-sm text-amber-800`
- Content: "This report is generated by automated testing tools and does not constitute a formal conformance assessment or legal advice. Automated testing can detect approximately 30-40% of WCAG success criteria. Manual expert review is recommended for a comprehensive conformance evaluation. Consult a qualified accessibility professional for legally binding assessments."

### Responsive Behaviour
- **Desktop:** Full table layout, export buttons in header
- **Tablet:** Table scrolls horizontally, export buttons below title
- **Mobile:** Each clause becomes a stacked card:
  ```
  ┌───────────────────────┐
  │ 9.1.1.1               │
  │ Non-text Content       │
  │ ✕ Failing — 12 issues  │
  │ Target: [date picker]  │
  └───────────────────────┘
  ```

### States
| State | Behaviour |
|-------|-----------|
| Loading | SkeletonCard for summary, skeleton rows (6) for table |
| No accessibility data | Full-page empty state: illustration + "Accessibility checks not included" + "Run New Audit" CTA button |
| All passing | Summary shows `Compliant` badge in emerald. Remediation section hidden. Congratulatory message below summary. |
| Tier locked (Free/Starter) | Summary card visible with status badge. Table + remediation behind full-page blur + centered upgrade CTA card |
| PDF export | Renders current page state as PDF via existing Playwright pipeline. Remediation dates included. Disclaimer included. |

---

## Shared Interaction Patterns

### Tier Lock Overlay
Used on CQS breakdown (Free), Fix Snippets code (Free), Compliance report (Free/Starter).

```
┌─────────────────────────────────┐
│                                 │
│   [blurred content behind]      │
│                                 │
│     🔒 Pro Feature              │
│     Upgrade to unlock full      │
│     compliance reporting.       │
│                                 │
│     [Upgrade Plan]              │
│                                 │
└─────────────────────────────────┘
```

- Backdrop: `backdrop-blur-sm bg-white/60`
- Lock icon: `Lock` from lucide-react, 24px, `text-slate-400`
- Title: `body-sm font-semibold text-slate-900`
- Description: `body-xs text-slate-500`
- CTA: `Button` variant primary, size `sm`
- Vertically and horizontally centred within the locked area

### Toast Notifications
- "Code copied to clipboard" — success variant (emerald)
- "Compliance report exported" — success variant
- "Failed to export" — error variant (red)
- "Remediation date saved" — success variant

All use the existing `useToast` hook and `Toast` component.
