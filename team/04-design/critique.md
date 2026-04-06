<!-- Version: 1 | Department: critique | Target: design | Updated: 2026-04-05 -->

# Design — Critique

## Overall Score: 33/50

| Dimension | Score | Summary |
|-----------|-------|---------|
| Specificity | 7/10 | The category colour system, "vital signs" metaphor, and CQS teal choice are genuinely tied to Kritano's positioning — not a generic SaaS palette swap |
| Distinction | 6/10 | Typography pairing (Instrument Serif + Outfit) and the editorial tone create real character, but the layout patterns and card structures are standard Tailwind SaaS |
| Craft | 7/10 | Internal consistency is strong — tokens, typography components, accessibility specs, and responsive breakpoints are thorough and mostly correct |
| Usefulness | 7/10 | Specs are precise enough for implementation and the existing full-audit found only straightforward deviations — but the design system doc only covers *new* features, not the holistic system |
| Ambition | 6/10 | Good execution of conventional patterns, but nothing here makes someone stop scrolling — no signature visual moment, no layout surprise, no "you've never seen this before" interaction |

## What's Strong

### 1. The typography system has genuine personality
The Instrument Serif + Outfit pairing is one of the most distinctive choices in the entire design system. Instrument Serif gives headlines an editorial, authoritative weight that directly expresses the "Sage" archetype from the strategy positioning. The `Display`, `Heading`, `Body`, `Mono`, `ScoreNumber` component abstraction is well-executed — it forces consistent type usage across the codebase rather than relying on developers picking the right Tailwind classes. This is a genuinely good design decision that most SaaS products don't make.

### 2. Category colour coding is purposeful and complete
The six-colour system (violet/SEO, emerald/A11Y, red/Security, sky/Performance, amber/Content, teal/CQS) is well-considered. Each colour has semantic meaning, avoids collision with severity colours, and creates instant visual recognition across the app. The teal rationale for CQS — distinct from emerald (accessibility) and sky (performance), evoking "quality/health" — shows genuine design thinking, not just picking the next unused Tailwind colour. The contrast correction (teal-600 for text vs teal-500 for large elements) is a craft detail that matters.

### 3. Accessibility is treated as a first-class design concern
The design system doesn't bolt accessibility on as an afterthought — it integrates it into component specs. Contrast ratios are checked and corrected (the teal-500 → teal-600 fix), `prefers-reduced-motion` is gated at the component level, ARIA patterns are specified per component, and keyboard interactions are defined in the accordion and compliance table specs. For a tool that *audits* accessibility, this is table stakes — but it's executed well, which many competitors fail to do.

## What's Generic

### 1. Every page is the same white-card-on-slate-50 grid
The layout architecture is functional but visually monotonous. Dashboard: white cards in a grid on slate-50. Audit detail: white cards in a grid on slate-50. Compliance report: white cards stacked on slate-50. Settings: white cards stacked on slate-50. The atmospheric design section in the brand guidelines mentions radial gradients, glassmorphism, and a card elevation hierarchy — but the design system specs don't leverage any of these. The result is a clean, professional, and completely forgettable spatial experience. If you put Kritano's dashboard next to Vercel, Linear, PostHog, or Plausible — four very different products — the layout pattern would be indistinguishable.

### 2. No signature visual moment or interaction
The brand guidelines talk about a "pulse signature" — "a subtle, rhythmic animation that suggests continuous monitoring and vitality." This is a great idea. But the actual design system specs contain only standard accordion expand/collapse, standard bar animations, and a brief scale pulse on compliance badge status changes. There is no moment where the user thinks "this feels like Kritano." The score rings animate on mount (standard), the bars fill left-to-right (standard), toasts appear and disappear (standard). Where is the heartbeat? Where is the pulse? The brand has a metaphor — "vital signs monitoring" — but the UI doesn't make you *feel* it.

### 3. The design system document only covers iteration features, not the whole system
The `design-system.md` artifact is scoped to "three new features: Content Quality Score, Fix Snippets, and EAA Compliance Passport." It extends the brand guidelines rather than standing as its own comprehensive design system. This means there is no single document that defines the complete component library, layout patterns, page templates, and interaction vocabulary. A developer joining the project must read `BRAND_GUIDELINES.md` (which mixes brand identity with implementation specs), then `design-system.md` (which only covers new features), then the full-audit report to understand implementation deviations. A real design system should be the single source of truth.

## Recommendations

### 1. Create a signature "pulse" dashboard background
**What:** Replace the flat `slate-50` dashboard background with a subtle, animated radial pulse that emanates from the overall score ring — a soft indigo glow that breathes on a 4-second cycle, visible but not distracting.
**Why:** The brand positioning is built around "vital signs monitoring" and the "pulse" metaphor. The UI currently has no visual representation of this core concept. A living, breathing dashboard would be the single most distinctive visual element in the entire product — something no competitor has. It would make screenshots and demos immediately recognisable.
**How:** Implement using CSS `@keyframes` on a `radial-gradient` background with the existing `pulse-glow` animation token (already defined in `BRAND_GUIDELINES.md` but unused in the design system). Gate behind `prefers-reduced-motion: no-preference`. Make the pulse origin the overall score position. Intensity could scale with score — a healthy site pulses calmly, a struggling site pulses more urgently. This directly ties the visual design to the product's purpose.

### 2. Break the card grid monotony with a split-panel layout on audit detail
**What:** Replace the uniform card grid on the audit detail page with a persistent left panel showing the overall score ring (large, animated, with the "pulse" from recommendation 1) and a scrollable right panel containing category breakdowns, findings, and compliance status.
**Why:** The audit detail page is the product's most important screen — where users spend the most time and derive the most value. Currently it's the same card-grid layout as every other page. A split-panel with a persistent score "hero" on the left would create visual hierarchy, give the score ring more prominence (it's the product's signature UI element), and make the page feel like a diagnostic tool rather than a generic dashboard. Think of it as the difference between a hospital's vital signs monitor (always visible, always updating) and a spreadsheet of numbers.
**How:** Use a `grid-cols-[320px_1fr]` layout on desktop, stacking on mobile. Left panel: sticky, full-height, dark indigo background (`indigo-950`) with large score ring, category mini-rings, and compliance badge. Right panel: scrollable, standard slate-50 background with findings and details. This also solves the "6 columns of tiny rings" problem — the left panel gives each score room to breathe.

### 3. Define dark mode as its own experience, not just an inversion
**What:** Dark mode currently inverts backgrounds to `slate-900/950` and lightens text. Design a dark mode that uses the atmospheric elements more aggressively: deeper gradients, the indigo glow effects, amber accent highlights that pop against dark backgrounds, and glassmorphism for elevated cards.
**Why:** The brand guidelines already define glassmorphism panels and atmospheric backgrounds, but they're barely used. Dark mode is the natural home for these treatments. In light mode, glows and gradients can feel heavy — in dark mode, they look premium. Products like Linear and Raycast have demonstrated that a well-crafted dark mode can become the *preferred* experience and a differentiator in its own right. Right now Kritano's dark mode is functional but forgettable.
**How:** Use `glass-panel` (already defined in brand guidelines) for sidebar and modals in dark mode. Add subtle `shadow-glow` (already defined) to the active score ring. Use amber-400 more liberally for CTAs and accents against the dark palette — it creates much more contrast and visual energy than it does on white. Add a subtle gradient mesh background using the existing atmospheric CSS (defined but unused).

### 4. Add micro-interactions that reinforce the "judge" metaphor
**What:** Define 3-4 signature micro-interactions: (a) a "gavel tap" animation when an audit completes (the score ring lands with a decisive bounce, not a fade-in), (b) a "stamp" effect when compliance status is determined (the badge appears with a brief press-down-and-release), (c) score numbers that count up with a deceleration curve that pauses briefly at the final number before "settling" (like a scale finding its balance), (d) finding cards that slide in from the side when a category filter is applied (like files being pulled from a drawer).
**Why:** Micro-interactions are the most underused tool in the design system. The brand is called "Kritano" (from *krites*, judge/evaluator). The tagline is "Judge your website before others do." But nothing in the UI *feels* like a judgment is being delivered. These interactions would reinforce the brand metaphor at the subconscious level — every time the user sees a score land or a status stamp, they feel the authority of the verdict. This is what separates a product that *looks* good from one that *feels* distinctive.
**How:** Implement using CSS transforms and the existing animation tokens. The "gavel tap" is `scale(0.95) → scale(1.02) → scale(1)` over 400ms with `ease-bounce`. The "stamp" is `scale(1.3) → scale(1)` over 200ms with a subtle shadow burst. The score deceleration is a custom easing curve on the existing count-up animation. All gated behind `prefers-reduced-motion`.

### 5. Consolidate into a single, authoritative design system document
**What:** Merge the component patterns, colour tokens, typography tokens, spacing system, animation tokens, and new feature specs from `BRAND_GUIDELINES.md` and `design-system.md` into a single comprehensive design system document. The brand guidelines should cover identity (logo, voice, personality); the design system should cover implementation (every component, every token, every pattern).
**Why:** The current split means no single document answers "how should I build this component?" The brand guidelines contain implementation details (Tailwind config, CSS variables, component patterns) that belong in a design system. The design system only covers three new features. The full-audit report identified deviations (button secondary variant, input focus ring, card border radius inconsistency) that exist partly because there's no authoritative single reference. A developer shouldn't need to cross-reference three documents to get a focus ring right.
**How:** Create `design-system-v2.md` that includes: (1) all colour tokens with usage rules, (2) all typography tokens with component API, (3) all spacing tokens, (4) every component (Button with all 8 variants, Card with size variants, Input, Badge, Toast, Modal, etc.) with exact specs, (5) all animation tokens with interaction patterns, (6) page layout templates, (7) responsive breakpoints, (8) dark mode-specific treatments. Retire the implementation sections from `BRAND_GUIDELINES.md` and scope that document to brand identity only.

## Competitor Comparison

**Linear:** Shares Kritano's dark sidebar + light content split but goes much further with custom cursor interactions, animated transitions between views, and a distinctive keyboard-first interaction model. Linear's design system is opinionated enough that screenshots are instantly recognisable. Kritano's screenshots could belong to any Tailwind-based SaaS.

**Plausible Analytics:** A direct comparison for "data dashboard" design. Plausible uses an extremely minimal layout — no sidebar, no cards, just clean data with colour as the primary differentiator. This radical simplicity makes it distinctive. Kritano goes the opposite direction (rich components, cards, badges) but doesn't push that richness far enough to become its own thing.

**Vercel Dashboard:** Uses a monochrome palette (black/white/gray) with a single accent colour, creating distinction through restraint. Kritano's six-colour category system could be equally distinctive if the layout gave each colour more room to breathe — currently, the colours are compressed into small rings and badges rather than being a dominant spatial element.

## Verdict

Kritano's design system is solidly crafted — the typography choices, colour semantics, and accessibility integration are above average for a SaaS product at this stage. The gap is between "well-executed conventional" and "distinctively Kritano." The brand has a rich metaphor (vital signs, judgment, verdicts) and a distinctive typographic voice (Instrument Serif), but the spatial design and interaction design don't express these. The single most impactful change would be **recommendation 1 + 2 combined**: a living, breathing audit detail page with a persistent score panel and subtle pulse animation that makes the product feel like a diagnostic instrument rather than a dashboard. That one change would make Kritano screenshots unmistakable, reinforce the brand metaphor at the experiential level, and give the product a visual identity that competitors can't copy by just changing their primary colour.
