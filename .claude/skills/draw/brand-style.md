# Kritano Brand Style — Visual Asset Reference

This file defines the visual rules for all `/draw` outputs. Every generated asset must look like it belongs on the Kritano homepage.

## Colour Palette

### Primary — Indigo
| Name | Hex | Usage |
|------|-----|-------|
| indigo-50 | `#EEF2FF` | Blurred background accents, light tints |
| indigo-100 | `#E0E7FF` | Hover highlights |
| indigo-200 | `#C7D2FE` | Light borders |
| indigo-400 | `#818CF8` | Secondary elements |
| indigo-500 | `#6366F1` | Links, secondary actions |
| indigo-600 | `#4F46E5` | **Primary brand colour** — buttons, brand blocks |
| indigo-700 | `#4338CA` | Hover on primary |
| indigo-900 | `#312E81` | Dark text on light |
| indigo-950 | `#1E1B4B` | Darkest — hero backgrounds |

### Accent — Amber
| Name | Hex | Usage |
|------|-----|-------|
| amber-50 | `#FFFBEB` | Blurred background accents, warm tints |
| amber-200 | `#FDE68A` | Borders, badges |
| amber-300 | `#FCD34D` | Icons, light accents |
| amber-400 | `#FBBF24` | Primary accent |
| amber-500 | `#F59E0B` | CTAs, important highlights |

### Neutrals — Warm Slate
| Name | Hex | Usage |
|------|-----|-------|
| slate-50 | `#F8FAFC` | Light backgrounds |
| slate-100 | `#F1F5F9` | Card section backgrounds |
| slate-200 | `#E2E8F0` | Borders, dividers |
| slate-300 | `#CBD5E1` | Disabled states |
| slate-400 | `#94A3B8` | Placeholder text |
| slate-500 | `#64748B` | Secondary text |
| slate-600 | `#475569` | Body text |
| slate-700 | `#334155` | Headings |
| slate-800 | `#1E293B` | Primary text |
| slate-900 | `#0F172A` | Dark backgrounds |
| slate-950 | `#020617` | Near black |
| white | `#FFFFFF` | Card backgrounds, light text on dark |

### Category Colours (for data visualisation)
| Category | Colour | Hex |
|----------|--------|-----|
| SEO | Violet | `#8B5CF6` |
| Accessibility | Emerald | `#10B981` |
| Security | Red | `#EF4444` |
| Performance | Sky | `#0EA5E9` |
| Content | Amber | `#F59E0B` |

### Score Colours
| Range | Colour | Hex |
|-------|--------|-----|
| 90-100 | Emerald | `#10B981` |
| 70-89 | Amber | `#F59E0B` |
| 50-69 | Orange | `#F97316` |
| 0-49 | Red | `#EF4444` |

## Typography

### Font Stack
1. **Display**: `'Instrument Serif', Georgia, serif` — Headlines, scores, hero text, large numbers
2. **Body**: `'Outfit', system-ui, sans-serif` — Descriptions, labels, supporting text
3. **Mono**: `'JetBrains Mono', monospace` — URLs, data points, code

### Scale (for 1080×1080 canvas)
| Role | Font | Size | Weight | Colour |
|------|------|------|--------|--------|
| Hero headline | Instrument Serif | 80-100px | 400 | `#0F172A` or `#FFFFFF` |
| Subheadline | Instrument Serif | 48-64px | 400 | `#0F172A` or `#FFFFFF` |
| Large stat/number | Instrument Serif | 140-220px | 400 | `#0F172A` or `#FFFFFF` |
| Body text | Outfit | 28-36px | 400 | `#475569` or `#CBD5E1` |
| Section label | Outfit | 18-22px | 600 | `#4F46E5` |
| Small label | Outfit | 16-20px | 500 | `#64748B` |
| Data/URL | JetBrains Mono | 22-28px | 400 | `#64748B` |

### Label Pattern
Section labels use: `font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; font-size: 18-22px; color: #4F46E5;`

## Background Treatments

Choose one per variation:

### 1. Light (default)
```css
background: #F8FAFC;
```
Add blurred indigo and amber accent circles in corners.

### 2. Dark
```css
background: linear-gradient(180deg, #1E1B4B 0%, #0F172A 100%);
```
Add subtle grid overlay and blurred indigo accent at reduced opacity.

### 3. Brand Solid
```css
background: #4F46E5;
/* or gradient: */
background: linear-gradient(135deg, #4F46E5 0%, #312E81 100%);
```
Content in white. Add blurred lighter indigo circle and grid overlay.

### 4. White
```css
background: #FFFFFF;
```
Use strong card/border compositions for structure. Add subtle atmospheric accents.

## Atmospheric Elements

These are the signature Kritano visual elements. **Every output must include at least one.**

### Blurred Gradient Circles
Large, soft circles positioned in corners or behind focal elements:
```css
position: absolute;
width: 400px;
height: 400px;
border-radius: 50%;
opacity: 0.5;
filter: blur(80px);
pointer-events: none;
```
- On light backgrounds: use `#EEF2FF` (indigo-50) and `#FFFBEB` (amber-50)
- On dark backgrounds: use `rgba(99, 102, 241, 0.15)` and `rgba(251, 191, 36, 0.08)`

### Grid Overlay (dark backgrounds only)
```css
position: absolute;
inset: 0;
background-image:
  linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
background-size: 40px 40px;
```

### Subtle Border Cards
```css
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 16px;
box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
```

## Composition Rules

- **Padding**: Minimum 80px from canvas edges to content. 100-120px is preferred.
- **Visual hierarchy**: One clear focal element (large number, headline, score ring). Supporting elements at smaller scale.
- **Whitespace**: Generous. Don't fill every pixel. Let elements breathe.
- **Alignment**: Left-aligned or centred. Never right-aligned as primary layout.
- **Grid**: Use CSS flexbox/grid for alignment. Items should feel intentionally placed.

## Do's

- Use the Kritano font stack — always
- Use the brand palette — always
- Include atmospheric depth (blurred gradients)
- Use score rings, status dots, and severity badges as visual vocabulary
- Reference "Kritano" as text where branding makes sense (Instrument Serif, indigo-600)
- Keep text large enough for mobile social feeds
- Create distinct variations — different backgrounds, layouts, and compositions

## Don'ts

- Don't use colours outside the brand palette
- Don't use fonts outside the three brand fonts
- Don't use external images or stock photos
- Don't create cluttered, busy compositions
- Don't use thin text under 24px — it won't read on mobile
- Don't use JavaScript — HTML files must be static
- Don't add watermarks or URLs unless the prompt asks for them
- Don't use emoji in the designs
