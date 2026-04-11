---
name: draw
description: Generate brand-consistent visual assets (HTML or SVG). Supports 1:1 (social media) and 16:9 wide (blog featured images, OG images). Use when the user wants social graphics, illustrations, diagrams, blog hero images, or visual content.
user-invocable: true
argument-hint: [description of what to draw]
---

# Draw Skill — Kritano Brand Visual Assets

Generate visual assets styled to Kritano's editorial brand language. Outputs self-contained HTML or SVG files.

## Formats

| Format | Dimensions | Aspect Ratio | Use Case |
|--------|-----------|--------------|----------|
| `square` (default) | 1080×1080px | 1:1 | Social media posts (Instagram, LinkedIn, X) |
| `wide` | 1920×1080px | 16:9 | Blog featured images, OG images, YouTube thumbnails |

## Input

The user's prompt: $ARGUMENTS

## Workflow

### 1. Parse the prompt

Identify:
- The subject or concept to visualise
- Any style hints (dark, light, minimal, bold, typographic, data-driven)
- Quantity override (e.g. "5 variations of..." — default is 3)
- Format preference (HTML or SVG — default is HTML)
- Aspect ratio: `wide` or `16:9` for 1920×1080; otherwise default to `square` (1080×1080). When invoked from the `/blog` skill, always use `wide`.

### 2. Slugify the prompt

Convert the core concept to a filesystem-safe folder name:
- Lowercase
- Replace spaces and special characters with hyphens
- Strip consecutive hyphens
- Max 50 characters
- Example: "Core Web Vitals stats post" → `core-web-vitals-stats-post`

### 3. Check for existing folder

If `/docs/draw/<slug>/` already exists:
- Find the highest numbered file (e.g. if `3.html` exists, next is `4`)
- Continue numbering from there

If it does not exist, create it and start from `1`.

### 4. Read reference files

Read both reference files before generating:
- `brand-style.md` — Visual rules, palette, typography, atmospheric elements
- `templates.md` — Reusable code snippets for common patterns

### 5. Choose format

- **HTML** (default): For anything with text, data, cards, atmospheric effects, blurred gradients, typography-heavy compositions. Most social posts should be HTML.
- **SVG**: For simpler illustrations, abstract patterns, icons, or when the user explicitly requests SVG.

The format can differ per variation if it makes sense.

### 6. Carousel consistency rules

When generating multi-slide carousels, these elements MUST be identical across every slide:

- **Slide indicator position**: Always `position: absolute; top: 48px; left: 100px;` — taken out of document flow so it doesn't shift based on content padding. Use `z-index: 2`.
- **Content padding**: All slides use the same padding (e.g. `padding: 90px 100px`). The indicator sits above this area via absolute positioning.
- **Branding position**: Kritano inline SVG logo + wordmark at a consistent absolute bottom-right or bottom-centre across all slides. Always include the inline SVG chip icon before the "Kritano" text (see `brand-style.md` for the SVG code).
- **Font sizes for matching elements**: Issue number badges, titles, body text, quick fix cards should use the same sizes across all issue slides.

### 7. Generate variations

Create 3 files (or user-specified count). Each must be a **distinct creative interpretation** — not minor tweaks of the same layout:

- **Variation 1 — Clean & minimal**: Focused composition, generous whitespace, one focal element. Light background.
- **Variation 2 — Rich & layered**: Multiple elements, atmospheric depth, blurred gradients, card-like structures. Can use light or dark background.
- **Variation 3 — Bold & different**: Dark background, or centred typographic layout, or unconventional grid. Should feel noticeably different from 1 and 2.

### 8. Write files

**Default location:** `/docs/draw/<slug>/N.html` or `N.svg`.

**IMPORTANT — Output path override:** When invoked by another skill (e.g. `/trend` or `/blog`), the calling skill specifies where files should be saved. ONLY write to that location. Never also write to `/docs/draw/` when called from `/trend` (use the trend folder), and never write to `/docs/draw/` when called from `/blog` (use the blog folder). Each skill owns its own output directory.

### 9. Write caption file

Create a `captions.md` file in the same folder (`/docs/draw/<slug>/captions.md`). If the file already exists (from a previous run), append to it rather than overwriting.

The file should contain a caption and hashtags **for each slide/variation**, structured as:

```markdown
# Captions — [Prompt Title]

## Slide 1
**Caption:** [Instagram-ready caption for this slide. Conversational, on-brand Kritano voice. 1-3 sentences. Can include line breaks for readability.]

**Hashtags:** #WebAccessibility #SEO #Kritano #WebDesign [etc — 15-20 relevant hashtags]

---

## Slide 2
...
```

#### Caption guidelines:
- Write in Kritano's brand voice — conversational, authoritative, helpful (not corporate or salesy)
- Use British English spelling (optimise, colour, favour)
- Keep captions concise — Instagram truncates after ~125 characters in feed, so lead with the hook
- For carousel posts, write one **combined caption** for the full carousel as well as per-slide captions. The combined caption goes first.
- Include a soft CTA where natural (e.g. "Link in bio to scan your site")
- 15-20 hashtags — mix of broad (#WebDesign, #SEO) and niche (#WCAG, #A11y, #CoreWebVitals)
- Always include #Kritano

### 10. Convert to PNG

After writing all HTML/SVG files, convert each one to a PNG using Playwright.

Run this bash command for **each** generated file:

```bash
# For square (1080×1080):
npx playwright screenshot \
  --viewport-size="1080,1080" \
  --full-page \
  "file:///absolute/path/to/N.html" \
  "/absolute/path/to/N.png"

# For wide (1920×1080):
npx playwright screenshot \
  --viewport-size="1920,1080" \
  --full-page \
  "file:///absolute/path/to/N.html" \
  "/absolute/path/to/N.png"
```

- Use `file://` URLs with the absolute path to each HTML/SVG file
- Output the PNG to the same folder with the same name but `.png` extension (e.g. `1.html` → `1.png`)
- Match the viewport size to the format used (1080×1080 for square, 1920×1080 for wide)
- If the screenshot command fails for any file, note the error and continue with the remaining files

### 11. Output summary

After writing all files and converting to PNG, output:
- The file paths created (HTML/SVG, PNG, and `captions.md`)
- A one-line description of each variation
- Confirm which PNGs were successfully generated

## HTML Template

Every HTML output MUST use one of these skeletons based on the format:

### Square (1080×1080) — default

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
    }
    .container {
      width: 1080px;
      height: 1080px;
      position: relative;
      overflow: hidden;
      font-family: 'Outfit', system-ui, sans-serif;
      /* Background set per design */
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

### Wide (1920×1080) — for blog featured images, OG images

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
      width: 1920px;
      height: 1080px;
      overflow: hidden;
    }
    .container {
      width: 1920px;
      height: 1080px;
      position: relative;
      overflow: hidden;
      font-family: 'Outfit', system-ui, sans-serif;
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

## SVG Templates

### Square
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <!-- Gradients, filters, clip paths -->
  </defs>
  <!-- Content here -->
</svg>
```

### Wide
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <!-- Gradients, filters, clip paths -->
  </defs>
  <!-- Content here -->
</svg>
```

## Content Overflow — CRITICAL

The 1080×1080px canvas is a hard boundary. **Nothing may overflow or be clipped.** This is the single most common defect — treat it seriously.

### The #1 Rule: ALL slides use the SAME layout method

**Every slide — including cover slides and CTA slides — MUST use the same top-down flow layout:**

```html
<div style="position:relative;z-index:1;padding:90px 90px 70px;height:100%;">
  <!-- Content flows top to bottom, normal document flow -->
  <!-- Branding: position:absolute;bottom:32px;right:90px; -->
</div>
```

**NEVER use any of these on cover or CTA slides:**
- ❌ `position: absolute` with pixel `top` values for content elements
- ❌ `justify-content: center` on a flex column
- ❌ `top: 50%; transform: translateY(-50%)` centring
- ❌ Different padding values than content slides

Cover/CTA slides should look different through **background colour, text alignment (`text-align:center`), and content choices** — NOT through different layout methods. The content simply flows top-to-bottom inside the same padded container, with `text-align:center` and `margin: 0 auto` for centred appearance.

**Vertical centering on cover/CTA slides:** These slides typically have less content than content slides, so they look top-heavy with `padding-top:90px`. Use `padding-top:200px` on cover and CTA slides to push content toward the visual centre. Content slides keep `padding-top:90px` because they're full of content. This is the ONLY padding value that should differ between slide types.

### Additional rules
1. **Always calculate total content height EXPLICITLY before writing.** Add up every element: top padding + all element heights + all gaps + bottom padding + branding reserve (50px). If it exceeds 1080px, reduce sizes BEFORE writing the file.
2. **Prefer fixed padding over centring.** `padding: 90px 90px 70px` is the standard. Never change this between slides.
3. **Atmospheric elements and branding must be absolute-positioned** with `pointer-events: none`. They sit outside the content flow.
4. **Budget for branding.** The Kritano wordmark at `position:absolute;bottom:32px;right:90px;` needs ~50px of clearance at the bottom.
5. **Keep stat numbers ≤56px on grid layouts.** Reserve 72px+ only for hero/single-stat layouts.
6. **When in doubt, make things smaller.** It's better to have whitespace at the bottom than to clip content.

### Safe content area

**Square (1080×1080):**
- Recommended padding: 80-90px on all sides
- Bottom reserve for branding: 50px
- Usable content area: ~900×880px
- **Max stacked content height: ~880px**

**Wide (1920×1080):**
- Recommended padding: 80-100px on all sides
- Bottom reserve for branding: 50px
- Usable content area: ~1720×880px
- **Max stacked content height: ~880px** (same as square)
- The extra horizontal space allows side-by-side layouts, larger typography, or visual elements alongside the title
- Blog featured images should be typographic and atmospheric — the title, category label, and Kritano branding. No need to cram in data visualisations.

## Quality Checklist

Before outputting each file, verify:
- [ ] **ALL content is visible within the 1080×1080px canvas — nothing is clipped or overflowing** (most important check)
- [ ] Total content height (padding + elements + gaps) does not exceed 1080px
- [ ] Canvas is exactly 1080×1080px (HTML body or SVG viewBox)
- [ ] Uses ONLY Kritano brand fonts (Instrument Serif, Outfit, JetBrains Mono)
- [ ] Uses ONLY brand palette colours (indigo, amber, slate — see `brand-style.md`)
- [ ] Includes at least one atmospheric element (blurred gradient, grid overlay, or subtle texture)
- [ ] Has generous padding from canvas edges (minimum 80px)
- [ ] Is self-contained — no external CSS, no JS, no external images
- [ ] Opens correctly in a browser as a standalone file
- [ ] Each variation is visually distinct from the others
- [ ] Text is large enough to read on mobile social feeds (minimum ~28px body, ~48px headlines)
- [ ] Composition has clear visual hierarchy — one focal point

## Reference Files

| File | Purpose |
|------|---------|
| `brand-style.md` | Kritano visual DNA — colours, typography, atmospheric elements, do's & don'ts |
| `templates.md` | Reusable HTML/SVG snippets for common patterns (score rings, backgrounds, stat cards) |
