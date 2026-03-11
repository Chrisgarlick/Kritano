# PagePulser Brand Guidelines

## Brand Identity

### Brand Name
**PagePulser** (one word, camelCase in code: `pagePulser` or `PagePulser`)

### Tagline Options
- "Feel the Pulse of Your Pages"
- "Website Health, Measured"
- "Insights at Every Beat"

### Brand Etymology
**Page** (web page, digital content) + **Pulser** (one who takes a pulse, measures vital signs)

The name evokes health monitoring, regular check-ups, and the ability to detect vital signs of website performance. A PagePulser doesn't just scan—they *measure* the heartbeat of a website's health, security, and potential.

---

## Brand Personality

### Voice & Tone
| Attribute | Description |
|-----------|-------------|
| **Authoritative** | We know our craft. Confident without arrogance. |
| **Clear** | No jargon soup. Technical concepts made accessible. |
| **Precise** | Every word matters. Data-driven, not hyperbolic. |
| **Helpful** | Findings come with guidance, not just criticism. |
| **Forward-thinking** | We help you see what's coming, not just what's broken. |

### Brand Archetypes
- **Primary**: The Sage (wisdom, insight, expertise)
- **Secondary**: The Explorer (discovery, revealing the unknown)

---

## Color System

### Philosophy
The PagePulser palette draws from the metaphor of **vital signs monitoring**—the careful observation of health indicators that reveal the true state of a system. Deep, contemplative primary tones paired with illuminating accents suggest both depth of analysis and clarity of insight.

### Primary Palette

#### Indigo (Primary Brand Color)
The foundation of PagePulser's identity. Deep, authoritative, and distinct from generic tech blues.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `indigo-50` | `#eef2ff` | 238, 242, 255 | Subtle backgrounds |
| `indigo-100` | `#e0e7ff` | 224, 231, 255 | Hover states, highlights |
| `indigo-200` | `#c7d2fe` | 199, 210, 254 | Borders, dividers |
| `indigo-300` | `#a5b4fc` | 165, 180, 252 | Disabled states |
| `indigo-400` | `#818cf8` | 129, 140, 248 | Secondary actions |
| `indigo-500` | `#6366f1` | 99, 102, 241 | Primary actions, links |
| `indigo-600` | `#4f46e5` | 79, 70, 229 | **Primary brand color** |
| `indigo-700` | `#4338ca` | 67, 56, 202 | Hover states on primary |
| `indigo-800` | `#3730a3` | 55, 48, 163 | Active states |
| `indigo-900` | `#312e81` | 49, 46, 129 | Dark text on light backgrounds |
| `indigo-950` | `#1e1b4b` | 30, 27, 75 | Darkest, headers |

#### Amber (Accent Color)
Represents illumination, discovery, and valuable insights. The "aha!" moment when an issue is revealed.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `amber-50` | `#fffbeb` | 255, 251, 235 | Subtle warm backgrounds |
| `amber-100` | `#fef3c7` | 254, 243, 199 | Highlight backgrounds |
| `amber-200` | `#fde68a` | 253, 230, 138 | Borders, badges |
| `amber-300` | `#fcd34d` | 252, 211, 77 | Icons, accents |
| `amber-400` | `#fbbf24` | 251, 191, 36 | **Primary accent** |
| `amber-500` | `#f59e0b` | 245, 158, 11 | CTAs, important highlights |
| `amber-600` | `#d97706` | 217, 119, 6 | Hover on accent |
| `amber-700` | `#b45309` | 180, 83, 9 | Active states |
| `amber-800` | `#92400e` | 146, 64, 14 | Dark accent text |
| `amber-900` | `#78350f` | 120, 53, 15 | Darkest accent |

### Neutral Palette (Warm Slate)
Intentionally warmer than pure grays to feel more approachable and less clinical.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `slate-50` | `#f8fafc` | 248, 250, 252 | Page backgrounds |
| `slate-100` | `#f1f5f9` | 241, 245, 249 | Card backgrounds, sections |
| `slate-200` | `#e2e8f0` | 226, 232, 240 | Borders, dividers |
| `slate-300` | `#cbd5e1` | 203, 213, 225 | Disabled states |
| `slate-400` | `#94a3b8` | 148, 163, 184 | Placeholder text |
| `slate-500` | `#64748b` | 100, 116, 139 | Secondary text |
| `slate-600` | `#475569` | 71, 85, 105 | Body text |
| `slate-700` | `#334155` | 51, 65, 85 | Headings |
| `slate-800` | `#1e293b` | 30, 41, 59 | Primary text |
| `slate-900` | `#0f172a` | 15, 23, 42 | Darkest text |
| `slate-950` | `#020617` | 2, 6, 23 | Near black |

### Semantic Colors

#### Status Colors (Audit States)
| State | Background | Text | Border | Icon |
|-------|------------|------|--------|------|
| **Pending** | `amber-50` | `amber-800` | `amber-200` | `amber-500` |
| **Processing** | `indigo-50` | `indigo-800` | `indigo-200` | `indigo-500` |
| **Completed** | `emerald-50` | `emerald-800` | `emerald-200` | `emerald-500` |
| **Failed** | `red-50` | `red-800` | `red-200` | `red-500` |
| **Cancelled** | `slate-100` | `slate-600` | `slate-200` | `slate-400` |

#### Severity Colors (Findings)
| Severity | Background | Text | Border | Accent |
|----------|------------|------|--------|--------|
| **Critical** | `red-50` | `red-900` | `red-200` | `red-600` |
| **Serious** | `orange-50` | `orange-900` | `orange-200` | `orange-600` |
| **Moderate** | `amber-50` | `amber-900` | `amber-200` | `amber-600` |
| **Minor** | `sky-50` | `sky-900` | `sky-200` | `sky-600` |
| **Info** | `slate-50` | `slate-700` | `slate-200` | `slate-500` |

#### Category Colors (Audit Types)
| Category | Primary | Light | Dark |
|----------|---------|-------|------|
| **SEO** | `violet-500` | `violet-50` | `violet-900` |
| **Accessibility** | `emerald-500` | `emerald-50` | `emerald-900` |
| **Security** | `red-500` | `red-50` | `red-900` |
| **Performance** | `sky-500` | `sky-50` | `sky-900` |

#### Score Colors
| Score Range | Color | Usage |
|-------------|-------|-------|
| 90-100 | `emerald-600` | Excellent |
| 70-89 | `amber-500` | Good, needs attention |
| 50-69 | `orange-500` | Poor, action required |
| 0-49 | `red-600` | Critical, immediate action |

### Dark Mode Palette
For future dark mode implementation:

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `slate-50` | `slate-950` |
| Surface | `white` | `slate-900` |
| Surface elevated | `white` | `slate-800` |
| Border | `slate-200` | `slate-700` |
| Text primary | `slate-900` | `slate-50` |
| Text secondary | `slate-600` | `slate-400` |
| Primary | `indigo-600` | `indigo-400` |
| Accent | `amber-500` | `amber-400` |

---

## Typography

### Philosophy
Typography should feel **editorial and authoritative** without being stuffy. We pair a distinctive display typeface with a highly readable geometric sans-serif for body text.

### Type Scale

#### Display Font: Instrument Serif
*Elegant, modern serif with editorial quality. Used for major headlines and brand moments.*

**Fallback stack:** `'Instrument Serif', 'Playfair Display', Georgia, serif`

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `display-2xl` | 72px / 4.5rem | 400 | 1.0 | -0.02em | Hero headlines |
| `display-xl` | 60px / 3.75rem | 400 | 1.1 | -0.02em | Page titles |
| `display-lg` | 48px / 3rem | 400 | 1.1 | -0.01em | Section headers |
| `display-md` | 36px / 2.25rem | 400 | 1.2 | -0.01em | Card titles |
| `display-sm` | 30px / 1.875rem | 400 | 1.2 | 0 | Subheadings |

#### Body Font: Outfit
*Clean geometric sans-serif with excellent readability and a friendly, modern feel.*

**Fallback stack:** `'Outfit', 'Inter', system-ui, sans-serif`

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `heading-xl` | 24px / 1.5rem | 600 | 1.3 | -0.01em | Page section titles |
| `heading-lg` | 20px / 1.25rem | 600 | 1.4 | 0 | Card headers |
| `heading-md` | 18px / 1.125rem | 600 | 1.4 | 0 | Subsections |
| `heading-sm` | 16px / 1rem | 600 | 1.5 | 0 | Labels, small headers |
| `body-lg` | 18px / 1.125rem | 400 | 1.6 | 0 | Lead paragraphs |
| `body-md` | 16px / 1rem | 400 | 1.6 | 0 | Body text |
| `body-sm` | 14px / 0.875rem | 400 | 1.5 | 0 | Secondary text, captions |
| `body-xs` | 12px / 0.75rem | 400 | 1.5 | 0.01em | Fine print, labels |

#### Mono Font: JetBrains Mono
*For code snippets, technical data, and URLs.*

**Fallback stack:** `'JetBrains Mono', 'Fira Code', 'Consolas', monospace`

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `mono-md` | 14px | 400 | Code blocks, URLs |
| `mono-sm` | 12px | 400 | Inline code, data |

### Font Loading
```html
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## Logo & Iconography

### Logo Concept
The PagePulser logo incorporates an abstract **pulse/wave** motif, suggesting monitoring, health checks, and continuous analysis. The mark works as a standalone icon while the wordmark uses the display typeface.

### Logo Variations
| Variant | Usage |
|---------|-------|
| **Full Logo** | Website header, documentation, marketing |
| **Icon Only** | Favicon, app icon, small spaces |
| **Wordmark Only** | When icon is shown separately |
| **Horizontal** | Email signatures, wide spaces |
| **Stacked** | Square spaces, social media |

### Logo Colors
| Context | Primary Mark | Wordmark |
|---------|--------------|----------|
| Light background | `indigo-600` | `slate-900` |
| Dark background | `white` or `indigo-400` | `white` |
| Monochrome | `slate-900` or `white` | Same |

### Minimum Size
- **Icon**: 24px minimum (digital), 10mm (print)
- **Full logo**: 120px width minimum (digital), 30mm (print)

### Clear Space
Maintain clear space equal to the height of the "P" in PagePulser around all sides of the logo.

### Logo Don'ts
- Don't rotate or skew the logo
- Don't change the logo colors outside approved palettes
- Don't add effects (shadows, gradients, outlines)
- Don't place on busy backgrounds without a container
- Don't stretch or distort proportions

---

## Spacing System

### Base Unit
**4px base** with an 8px primary scale for most spacing.

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0 | Reset |
| `space-0.5` | 2px | Micro spacing |
| `space-1` | 4px | Tight spacing |
| `space-2` | 8px | Default gap |
| `space-3` | 12px | Small padding |
| `space-4` | 16px | Standard padding |
| `space-5` | 20px | Medium spacing |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Large sections |
| `space-10` | 40px | Major sections |
| `space-12` | 48px | Page sections |
| `space-16` | 64px | Hero spacing |
| `space-20` | 80px | Major landmarks |
| `space-24` | 96px | Full sections |

### Component Spacing Patterns
| Component | Padding | Gap |
|-----------|---------|-----|
| Button (sm) | 8px 12px | - |
| Button (md) | 10px 16px | - |
| Button (lg) | 12px 24px | - |
| Card | 24px | 16px |
| Modal | 24px | 24px |
| Form field | - | 8px (label to input) |
| Form group | - | 24px |
| Section | 48px | 32px |
| Page | 48px 24px | 48px |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-none` | 0 | Square elements |
| `rounded-sm` | 4px | Small elements, badges |
| `rounded` | 6px | Inputs, small buttons |
| `rounded-md` | 8px | Buttons, cards |
| `rounded-lg` | 12px | Modals, large cards |
| `rounded-xl` | 16px | Feature sections |
| `rounded-2xl` | 24px | Hero elements |
| `rounded-full` | 9999px | Pills, avatars |

---

## Shadows & Elevation

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-xs` | `0 1px 2px rgba(15, 23, 42, 0.05)` | Subtle lift |
| `shadow-sm` | `0 1px 3px rgba(15, 23, 42, 0.1)` | Cards at rest |
| `shadow-md` | `0 4px 6px rgba(15, 23, 42, 0.1)` | Dropdowns |
| `shadow-lg` | `0 10px 15px rgba(15, 23, 42, 0.1)` | Modals |
| `shadow-xl` | `0 20px 25px rgba(15, 23, 42, 0.15)` | Popovers |
| `shadow-glow` | `0 0 40px rgba(99, 102, 241, 0.15)` | Focus/featured |
| `shadow-inner` | `inset 0 2px 4px rgba(15, 23, 42, 0.05)` | Pressed states |

---

## Motion & Animation

### Principles
1. **Purposeful**: Every animation should communicate something
2. **Quick**: UI animations should feel snappy (150-300ms)
3. **Natural**: Use easing that mimics physical movement
4. **Subtle**: Motion should enhance, not distract

### Timing Tokens
| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `duration-instant` | 50ms | - | Color changes |
| `duration-fast` | 150ms | `ease-out` | Hovers, micro-interactions |
| `duration-normal` | 200ms | `ease-out` | Transitions |
| `duration-slow` | 300ms | `ease-in-out` | Page transitions |
| `duration-slower` | 500ms | `ease-in-out` | Complex animations |

### Easing Functions
```css
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Common Animations
| Animation | Properties | Duration | Usage |
|-----------|------------|----------|-------|
| Fade in | opacity 0→1 | 200ms | Page elements appearing |
| Slide up | translateY 8px→0, opacity | 300ms | Cards, modals |
| Scale in | scale 0.95→1, opacity | 200ms | Dropdowns, popovers |
| Pulse | scale 1→1.02→1 | 2000ms | Loading, attention |

---

## Iconography

### Icon Style
Use **Lucide Icons** (or Heroicons) for consistency:
- Stroke weight: 1.5px (default)
- Rounded corners and caps
- 24x24 default size, 20x20 for inline, 16x16 for compact

### Icon Sizes
| Size | Pixels | Usage |
|------|--------|-------|
| `icon-xs` | 12px | Dense tables, badges |
| `icon-sm` | 16px | Inline with small text |
| `icon-md` | 20px | Buttons, list items |
| `icon-lg` | 24px | Standalone icons |
| `icon-xl` | 32px | Feature highlights |
| `icon-2xl` | 48px | Empty states, heroes |

---

## Component Patterns

### Buttons
| Variant | Background | Text | Border | Hover |
|---------|------------|------|--------|-------|
| **Primary** | `indigo-600` | `white` | none | `indigo-700` |
| **Secondary** | `white` | `slate-700` | `slate-200` | `slate-50` bg |
| **Ghost** | transparent | `slate-600` | none | `slate-100` bg |
| **Danger** | `red-600` | `white` | none | `red-700` |
| **Accent** | `amber-500` | `slate-900` | none | `amber-600` |

### Cards
```
Background: white
Border: 1px solid slate-200
Border radius: rounded-lg (12px)
Shadow: shadow-sm
Padding: 24px
Hover (if interactive): shadow-md, translateY(-2px)
```

### Inputs
```
Background: white
Border: 1px solid slate-300
Border radius: rounded-md (8px)
Padding: 10px 14px
Focus: ring-2 ring-indigo-500/20, border-indigo-500
Error: border-red-500, ring-red-500/20
```

---

## Application to Business Materials

### Website
- Hero: Dark indigo (`indigo-950`) background with amber accents
- Navigation: White/light with indigo-600 active states
- CTAs: Primary amber (`amber-500`) for conversion, indigo for secondary

### Email Templates
- Header: Indigo-600 background with white logo
- Body: White background, slate-700 text
- CTAs: Indigo-600 buttons
- Footer: Slate-100 background

### Documentation
- Clean white backgrounds
- Indigo for links and navigation
- Code blocks: Slate-900 background, syntax highlighting

### Social Media
- Profile: Icon on indigo-600 background
- Posts: Use brand colors, avoid busy backgrounds
- Consistent use of Outfit font in graphics

### Business Cards / Print
- Front: Logo on white, indigo accent line
- Back: Indigo-600 solid or gradient with white text
- Paper: Uncoated for premium feel

---

## Code Implementation

### Tailwind Config Extension
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      fontFamily: {
        display: ['Instrument Serif', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 40px rgba(99, 102, 241, 0.15)',
        'glow-amber': '0 0 40px rgba(251, 191, 36, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
};
```

### CSS Variables
```css
/* index.css */
:root {
  /* Colors */
  --color-primary: #4f46e5;
  --color-primary-light: #6366f1;
  --color-primary-dark: #4338ca;
  --color-accent: #fbbf24;
  --color-accent-dark: #f59e0b;

  /* Typography */
  --font-display: 'Instrument Serif', serif;
  --font-body: 'Outfit', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing */
  --space-unit: 4px;

  /* Transitions */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
}
```

---

## Motion Design

### The Pulse Signature
PagePulser's signature motion is the "pulse" - a subtle, rhythmic animation that suggests continuous monitoring and vitality. This differentiates us from static, lifeless dashboards.

### Core Animation Keyframes

```css
/* Signature pulse glow - for active/monitoring states */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  50% { box-shadow: 0 0 20px 4px rgba(99, 102, 241, 0.2); }
}

/* Heartbeat - for processing/scanning states */
@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  14% { transform: scale(1.1); }
  28% { transform: scale(1); }
  42% { transform: scale(1.15); }
  56% { transform: scale(1); }
}

/* Reveal up - for page element entrance */
@keyframes reveal-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Count up - for animated number transitions */
@keyframes count-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Animation Tokens

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `pulse-glow` | 2000ms | ease-in-out | Active monitoring states, focused inputs |
| `heartbeat` | 1500ms | custom | Processing indicators, scanning states |
| `reveal-up` | 300ms | ease-out | Page element entrance animations |
| `count-up` | 800ms | ease-out | Number animations, stat changes |

### Stagger Pattern
When revealing multiple elements (cards, list items, stats), use 50ms delay between items for a cohesive cascade effect:

```css
.stagger-1 { animation-delay: 0ms; }
.stagger-2 { animation-delay: 50ms; }
.stagger-3 { animation-delay: 100ms; }
.stagger-4 { animation-delay: 150ms; }
/* Continue as needed */
```

### Motion Principles
1. **Purposeful**: Every animation communicates meaning (loading, success, attention)
2. **Respectful**: Honor `prefers-reduced-motion` for accessibility
3. **Consistent**: Same interactions produce same animations across the app
4. **Performant**: Use `transform` and `opacity` only (GPU accelerated)

---

## Score Visualization

### Circular Progress Display
Scores are displayed in circular progress indicators, embodying the "vital signs" metaphor:

| Property | Large (lg) | Medium (md) | Small (sm) |
|----------|------------|-------------|------------|
| Ring width | 8px | 6px | 4px |
| Diameter | 120px | 80px | 48px |
| Font size | display-lg | display-md | heading-lg |

**Colors:**
- Background ring: `slate-200` (light), `slate-700` (dark)
- Progress ring: Based on score threshold (see below)
- Inner number: Instrument Serif, font-weight 400

### Score Thresholds & Colors

| Range | Color | Light Mode | Dark Mode | Label |
|-------|-------|------------|-----------|-------|
| 90-100 | Emerald | `emerald-500` | `emerald-400` | Excellent |
| 70-89 | Amber | `amber-500` | `amber-400` | Good |
| 50-69 | Orange | `orange-500` | `orange-400` | Fair |
| 0-49 | Red | `red-500` | `red-400` | Poor |

### Trend Indicators
Always show context with scores:
- **Arrow direction**: ▲ (up), ▼ (down), ─ (stable)
- **Delta value**: "+5" or "-3" or "─"
- **Color**: Emerald for improvement, red for decline, slate for stable

### Animation on Mount
Scores should animate in:
1. Ring progress fills clockwise over 800ms
2. Number counts up to final value
3. Trend indicator fades in after number settles

---

## Atmospheric Design

### Philosophy
Avoid flat, sterile interfaces. PagePulser's UI should feel *alive* and *dimensional*, reflecting the dynamic nature of website health monitoring.

### Background Treatments

#### Dashboard Background
```css
.dashboard-bg {
  background:
    radial-gradient(ellipse at top right, rgba(99, 102, 241, 0.03) 0%, transparent 50%),
    radial-gradient(ellipse at bottom left, rgba(251, 191, 36, 0.02) 0%, transparent 50%),
    #f8fafc;
}

.dark .dashboard-bg {
  background:
    radial-gradient(ellipse at top right, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at bottom left, rgba(251, 191, 36, 0.04) 0%, transparent 50%),
    #020617;
}
```

#### Hero Sections (Marketing)
```css
.hero-bg {
  background: linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%);
}
```

### Card Elevation Hierarchy

| Level | Usage | Properties |
|-------|-------|------------|
| 0 | Flat content areas | `bg-white border-slate-200` (no shadow) |
| 1 | Standard cards | `shadow-sm` + `hover:shadow-md` |
| 2 | Featured/Active elements | `shadow-md` + `ring-1 ring-indigo-100` |
| 3 | Modals, Dropdowns | `shadow-xl` |
| 4 | Floating elements | `shadow-2xl` + `backdrop-blur` |

### Glassmorphism (Premium Elements)
Reserved for elevated UI: sidebar in collapsed state, modal overlays, floating actions.

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .glass-panel {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Accent Usage
The amber accent (`amber-400`/`amber-500`) should be used sparingly for maximum impact:
- Primary CTA buttons (conversion-focused)
- Important notifications
- Achievement/success celebrations
- Score improvements

---

## Brand Assets Checklist

### Required Assets
- [ ] Logo (SVG, PNG at 1x, 2x, 3x)
- [ ] Icon mark only (SVG, PNG, ICO for favicon)
- [ ] App icons (iOS, Android, PWA sizes)
- [ ] Open Graph image (1200x630)
- [ ] Twitter card image (1200x600)
- [ ] Email header logo
- [ ] Favicon package (16, 32, 180, 192, 512)
- [ ] Loading animation/spinner

### File Locations
```
client/
├── public/
│   ├── favicon.ico
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── og-image.png
│   ├── twitter-card.png
│   └── logo.svg
├── src/
│   └── assets/
│       ├── logo-full.svg
│       ├── logo-icon.svg
│       ├── logo-wordmark.svg
│       └── logo-dark.svg
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-XX-XX | Initial brand guidelines |
| 1.1 | 2025-XX-XX | Rebrand from SiteSeer to PagePulser |
| 1.2 | 2025-02-01 | Added Motion Design, Score Visualization, and Atmospheric Design sections |
