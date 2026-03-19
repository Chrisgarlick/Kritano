# Ultrathink Plan: `/draw` Skill — Brand Visual Asset Generation

## Overview / Summary

A new Claude Code skill invoked via `/draw <prompt>` that generates **brand-consistent visual assets** — either SVG or self-contained HTML files — for use as **social media posts**. Outputs are 1:1 aspect ratio, styled to match PagePulser's editorial design language (as seen on the homepage: atmospheric gradients, Instrument Serif display type, indigo/amber palette, clean card layouts, circular progress rings). Multiple variations are generated per prompt and saved to `/docs/draw/<slugified-prompt>/1.html` (or `.svg`).

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Output format** | HTML (default) or SVG | HTML allows richer styling (Tailwind-like inline, Google Fonts, gradients, blur effects). SVG for simpler icon/illustration work. Claude picks the best format per prompt. |
| **Aspect ratio** | 1:1 — enforced via container styling | Social media standard (Instagram, LinkedIn square, Twitter). 1080×1080px rendered size. |
| **Canvas size** | `1080px × 1080px` fixed container | Standard social media resolution for crisp rendering |
| **Multiple outputs** | 3 per prompt (default), user can override | Gives variety — different compositions/treatments of the same concept |
| **File organisation** | `/docs/draw/<slug>/1.html`, `2.html`, `3.svg` | Grouped by prompt, numbered sequentially, mixed formats allowed |
| **Slug generation** | Lowercase, hyphens, max 50 chars, stripped of special chars | Filesystem-safe, readable folder names |
| **Self-contained** | Each file must work standalone in a browser | No external CSS files, no JS dependencies. Google Fonts via `<link>` is OK. Inline styles or `<style>` block. |
| **Append behaviour** | If folder exists, continue numbering from highest existing | Allows iterating on a prompt across conversations |
| **Brand adherence** | Always PagePulser brand style | Not generic — these are brand social assets |

## Visual Style Reference: The Homepage

The homepage (`client/src/pages/Home.tsx`) defines PagePulser's visual DNA. Every `/draw` output should feel like it belongs on the same page:

### Atmospheric Elements
- **Blurred gradient accents**: Large `rounded-full` circles with `opacity-60 blur-3xl` in `indigo-50` and `amber-50`
- **Grid overlays**: Subtle `40px` grid pattern at `rgba(255,255,255,0.04)` on dark backgrounds
- **Layered depth**: Absolute-positioned decorative elements behind content

### Typography
- **Display**: Instrument Serif (Google Fonts) — for headlines, scores, hero text
- **Body**: Outfit — for descriptions, labels, supporting text
- **Mono**: JetBrains Mono — for URLs, data, code
- **Patterns**: Uppercase `text-xs tracking-wider` for labels; large `font-display` for impact

### Colour Palette
- **Primary**: Indigo (`#4F46E5` primary, `#EEF2FF` light, `#1E1B4B` darkest)
- **Accent**: Amber (`#F59E0B`, `#FBBF24`)
- **Neutrals**: Warm slate (`#F8FAFC` bg, `#334155` text, `#E2E8F0` borders)
- **Category**: Violet (SEO), Emerald (A11Y), Red (Security), Sky (Performance), Amber (Content)
- **Scores**: Emerald 90+, Amber 70-89, Orange 50-69, Red <50

### Component Patterns
- **Cards**: `bg-white border border-slate-200 rounded-2xl shadow-sm` with subtle hover states
- **Score rings**: SVG circular progress indicators with `stroke-dasharray` animation
- **Status dots**: Small `w-2 h-2 rounded-full` coloured circles
- **Severity badges**: Coloured dots with text labels
- **Section labels**: `text-indigo-600 font-medium tracking-wide uppercase text-xs`

### Layout Principles
- Generous whitespace (`px-6 lg:px-20`, `py-24`)
- Grid-based layouts (`grid-cols-2`, `grid-cols-3`, `grid-cols-5`)
- Left-aligned copy with right visual, or centred compositions
- `max-w-7xl` container constraint

## File Structure

```
.claude/skills/draw/
├── SKILL.md              # Main skill definition (workflow, input/output)
├── brand-style.md        # PagePulser visual DNA extracted from homepage
└── templates.md          # Reusable HTML/SVG patterns and snippets
```

Output:
```
docs/draw/
├── seo-score-highlight/
│   ├── 1.html
│   ├── 2.html
│   └── 3.html
├── accessibility-stat/
│   ├── 1.html
│   └── 2.svg
└── ...
```

## Skill Definition: `SKILL.md`

### Frontmatter

```yaml
---
name: draw
description: Generate brand-consistent visual assets (HTML or SVG) for social media. Creates 1:1 ratio images matching PagePulser's editorial design language. Use when the user wants social graphics, illustrations, diagrams, or visual content.
user-invocable: true
argument-hint: [description of what to draw]
---
```

### Workflow

1. **Parse the prompt** — Extract the subject, any style hints, quantity override (e.g. "draw 5 variations of..."), and format preference (HTML vs SVG)
2. **Slugify the prompt** — Convert to a filesystem-safe folder name (lowercase, hyphens, max 50 chars)
3. **Check for existing folder** — If `/docs/draw/<slug>/` exists, find the highest numbered file and continue from there
4. **Read reference files** — Load `brand-style.md` and `templates.md`
5. **Choose format per variation**:
   - **HTML** (default): For anything with text, data visualisations, card-like layouts, atmospheric effects, blurred gradients, typography. Most social posts will be HTML.
   - **SVG**: For simpler illustrations, icons, abstract patterns, or when the user explicitly requests SVG.
6. **Generate variations** — Write 3 files (or user-specified count), each as a distinct creative interpretation:
   - Variation 1: Clean, minimal — focused composition, lots of whitespace
   - Variation 2: Rich, detailed — multiple elements, layered depth, atmospheric
   - Variation 3: Bold, different layout — dark background, or centred, or typographic-led
7. **Write files** — Save each to `/docs/draw/<slug>/N.html` or `N.svg`
8. **Summary** — Output file paths and brief description of each variation

### HTML Template Skeleton

Every HTML output must follow this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1080px;
      overflow: hidden;
      font-family: 'Outfit', system-ui, sans-serif;
    }
    .container {
      width: 1080px;
      height: 1080px;
      position: relative;
      overflow: hidden;
      /* Background — choose per design */
    }
    .font-display { font-family: 'Instrument Serif', Georgia, serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Content here -->
  </div>
</body>
</html>
```

### SVG Template Skeleton

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <!-- Gradients, filters, clip paths -->
  </defs>
  <!-- Content here -->
</svg>
```

## Reference File: `brand-style.md`

Extracted from the homepage and brand guidelines — the visual rules every output must follow:

### Mandatory Brand Elements
- **Always** use the PagePulser font stack (Instrument Serif / Outfit / JetBrains Mono)
- **Always** use the indigo/amber/slate palette — never introduce off-brand colours
- **Always** include atmospheric depth (blurred gradient circles, subtle backgrounds)
- **Always** maintain generous whitespace — don't fill every pixel
- **Always** 1080×1080px canvas

### Background Treatments (pick one per variation)
1. **Light**: `#F8FAFC` (slate-50) with blurred indigo/amber accents
2. **Dark**: `#0F172A` (slate-900) to `#1E1B4B` (indigo-950) gradient with subtle grid overlay
3. **Brand**: `#4F46E5` (indigo-600) solid or gradient with white/light content
4. **White**: Pure white with strong card/border compositions

### Typography Scale (for 1080px canvas)
| Role | Font | Size | Weight | Colour |
|------|------|------|--------|--------|
| Hero headline | Instrument Serif | 72-96px | 400 | slate-900 or white |
| Subheadline | Instrument Serif | 48-60px | 400 | slate-900 or white |
| Body | Outfit | 28-36px | 400 | slate-600 or slate-300 |
| Label | Outfit | 18-22px | 600 | indigo-600, uppercase, tracking-wider |
| Data/URL | JetBrains Mono | 22-28px | 400 | slate-500 |
| Large number/stat | Instrument Serif | 120-200px | 400 | slate-900 or white |

### Atmospheric Elements
- **Gradient circles**: `border-radius: 50%` with `filter: blur(80px)` and `opacity: 0.4-0.6`
  - Position: corners, behind focal elements
  - Colours: `#EEF2FF` (indigo-50), `#FFFBEB` (amber-50), or `rgba(99, 102, 241, 0.15)` on dark
- **Grid overlay** (on dark backgrounds): `background-size: 40px 40px` with thin white lines at 4% opacity
- **Subtle borders**: `1px solid #E2E8F0` (slate-200) on light, `1px solid rgba(255,255,255,0.1)` on dark

### Card Patterns
- White card on light bg: `background: white; border: 1px solid #E2E8F0; border-radius: 16px; box-shadow: 0 1px 3px rgba(15,23,42,0.1); padding: 48px;`
- Status bar: `background: #F8FAFC; border-top: 1px solid #F1F5F9; padding: 16px 24px;`
- Score ring: SVG circle with `stroke-dasharray` and `stroke-dashoffset`

### Do's and Don'ts
- **Do** leave 80-120px padding from canvas edges
- **Do** use the PagePulser logo/wordmark when relevant (Instrument Serif "PagePulser" text)
- **Do** use score rings, status dots, severity badges as visual elements
- **Don't** use stock imagery or external images
- **Don't** use colours outside the brand palette
- **Don't** use fonts outside the three brand fonts
- **Don't** create busy, cluttered compositions — editorial restraint
- **Don't** add the PagePulser URL/watermark unless the prompt asks for it

## Reference File: `templates.md`

Reusable code snippets for common social post patterns:

### Score Ring (SVG inline)
```html
<svg width="200" height="200" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="88" fill="none" stroke="#E2E8F0" stroke-width="8"/>
  <circle cx="100" cy="100" r="88" fill="none" stroke="#4F46E5" stroke-width="8"
    stroke-linecap="round" stroke-dasharray="553" stroke-dashoffset="55"
    transform="rotate(-90 100 100)"/>
  <text x="100" y="112" text-anchor="middle" font-family="'Instrument Serif', serif"
    font-size="64" fill="#0F172A">92</text>
</svg>
```

### Atmospheric Background (light)
```html
<div style="position:absolute;top:-60px;right:-60px;width:400px;height:400px;background:#EEF2FF;border-radius:50%;opacity:0.6;filter:blur(80px);"></div>
<div style="position:absolute;bottom:-40px;left:-40px;width:300px;height:300px;background:#FFFBEB;border-radius:50%;opacity:0.6;filter:blur(80px);"></div>
```

### Atmospheric Background (dark)
```html
<div style="position:absolute;top:-100px;right:-100px;width:500px;height:500px;background:rgba(99,102,241,0.15);border-radius:50%;filter:blur(100px);"></div>
<div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:40px 40px;"></div>
```

### Section Label
```html
<p style="font-family:'Outfit',sans-serif;font-size:18px;font-weight:600;color:#4F46E5;text-transform:uppercase;letter-spacing:0.1em;">Label Text</p>
```

### Stat Card
```html
<div style="text-align:center;">
  <p style="font-family:'Instrument Serif',serif;font-size:160px;color:#0F172A;line-height:1;">47%</p>
  <p style="font-family:'Outfit',sans-serif;font-size:28px;color:#64748B;margin-top:16px;">of websites fail accessibility checks</p>
</div>
```

### Status Dot Row
```html
<div style="display:flex;align-items:center;gap:24px;font-family:'Outfit',sans-serif;font-size:20px;color:#64748B;">
  <span style="display:flex;align-items:center;gap:8px;">
    <span style="width:10px;height:10px;border-radius:50%;background:#EF4444;"></span> 3 Critical
  </span>
  <span style="display:flex;align-items:center;gap:8px;">
    <span style="width:10px;height:10px;border-radius:50%;background:#F97316;"></span> 7 Serious
  </span>
</div>
```

## Implementation Order

1. **Create `/docs/draw/` directory**
2. **Create `.claude/skills/draw/brand-style.md`** — Visual DNA reference
3. **Create `.claude/skills/draw/templates.md`** — Reusable snippets
4. **Create `.claude/skills/draw/SKILL.md`** — Main skill definition with full workflow
5. **Test** — Run `/draw a social post about website accessibility stats` and verify output

## Testing Plan

| Test | Expected Result |
|------|----------------|
| `/draw a social post about Core Web Vitals` | Creates 3 HTML files in `/docs/draw/core-web-vitals/`, all 1080×1080, brand-styled |
| `/draw 5 variations of a score dashboard graphic` | Creates 5 files in `/docs/draw/score-dashboard-graphic/` |
| Re-running same prompt | Appends from highest existing number |
| Open any output in browser | Renders correctly at 1080×1080, fonts load, gradients visible |
| `/draw an abstract indigo pattern` as SVG | At least one output is `.svg` format |
| Check brand adherence | Only uses Instrument Serif/Outfit/JetBrains Mono, indigo/amber/slate palette |

## Capturing as Image

The HTML files are designed to be screenshotted at 1080×1080 for social posting. Users can:
- Open in browser and screenshot
- Use a headless browser tool (`npx capture-website-cli file.html --width=1080 --height=1080`)
- Paste the file path directly into design tools

## Considerations

- **Font loading**: HTML files reference Google Fonts via `<link>`. If opened offline, falls back to Georgia/system-ui/monospace. This is acceptable.
- **Browser rendering**: Tested pattern — blurred gradients, inline SVGs, and CSS all work in modern browsers when opening local HTML files.
- **Repo size**: HTML files are tiny (2-8KB each). Even hundreds won't bloat the repo.
- **No build step**: Zero dependencies. The skill is pure prompt engineering.
- **Quality floor**: The `brand-style.md` and `templates.md` files provide concrete code snippets that anchor quality — Claude isn't starting from scratch each time.
