---
name: video
description: Generate brand-consistent animated HTML videos for Instagram Reels, TikTok, and YouTube Shorts. Creates 9:16 portrait (1080x1920) self-contained HTML files with CSS animations that loop seamlessly over 20-40 seconds.
user-invocable: true
argument-hint: [description of what to animate]
---

# Video Skill — Kritano Animated Social Content

Generate 1080×1920px (9:16 portrait) animated HTML files styled to Kritano's editorial brand language. Each file is a self-contained, loopable CSS animation lasting 20–40 seconds, designed for Instagram Reels, TikTok, and YouTube Shorts.

## Input

The user's prompt: $ARGUMENTS

## Workflow

### 1. Parse the prompt

Identify:
- The subject or concept to animate
- Any style hints (dark, light, minimal, bold, data-driven, typographic)
- Quantity override (e.g. "5 variations of..." — default is 3)
- Duration preference (default 36s, range 20–40s)
- Content type best suited (stat reveal, quote, list, before/after, data story, single statement)

### 2. Slugify the prompt

Convert the core concept to a filesystem-safe folder name:
- Lowercase
- Replace spaces and special characters with hyphens
- Strip consecutive hyphens
- Max 50 characters
- Example: "73% of websites fail accessibility" → `73-percent-websites-fail-accessibility`

### 3. Check for existing folder

If `/docs/video/<slug>/` already exists:
- Find the highest numbered file (e.g. if `3.html` exists, next is `4`)
- Continue numbering from there

If it does not exist, create it and start from `1`.

### 4. Read reference files

Read both reference files before generating:
- `brand-motion.md` — Motion-specific brand rules, timing tokens, easing functions, animation patterns
- `templates.md` — Reusable animation code snippets for common patterns

### 5. Choose content type

Select the best template based on the prompt content:

| Type | Best for | Key animation |
|------|----------|---------------|
| **Stat Reveal** | Big numbers, percentages, data points | Number scales up, supporting text fades in |
| **Quote / Insight** | Quotes, insights, thought leadership | Line-by-line text reveal |
| **List / Tips** | Tips, checklists, numbered items | Staggered item entrance |
| **Before / After** | Comparisons, score improvements | Clip-path or crossfade transition |
| **Data Story** | Multiple stats building to conclusion | Sequential reveals with score rings |
| **Single Statement** | Bold claims, hot takes, brand statements | Dramatic enter → hold → exit |

### 6. Plan the timeline

Map content to the 5-act structure:

```
[INTRO]  →  [BUILD]  →  [PEAK]  →  [RESOLVE]  →  [OUTRO/LOOP-RESET]
 0-4s        4-12s       12-24s      24-32s         32-40s
```

| Phase | Duration | Purpose | Animation Style |
|-------|----------|---------|-----------------|
| **Intro** | 0–4s | Background fades in, atmosphere appears, title enters | Fade-in, scale-up, blur-to-sharp |
| **Build** | 4–12s | Supporting content appears sequentially | Staggered reveal-up, count-up |
| **Peak** | 12–24s | Core message fully visible, key stat holds | Subtle pulse, gentle float |
| **Resolve** | 24–32s | Content begins to exit | Fade-out, scale-down, blur |
| **Outro** | 32–40s | Returns to opening state, wordmark pulses | Mirror of Intro in reverse |

Assign each content element a specific enter time, hold duration, and exit time within this structure. Use `animation-delay` to stagger entrances.

### 7. Generate variations

Create 3 files (or user-specified count). Each must be a **distinct creative interpretation** — not minor tweaks:

- **Variation 1 — Clean & Minimal**: Light background, simple animations, generous whitespace, one focal element
- **Variation 2 — Rich & Layered**: Dark background, multiple atmospheric elements, complex staggers, card-like structures
- **Variation 3 — Bold & Different**: Brand-solid background, or unexpected composition, strongest visual impact

### 8. Write files

**Default location:** `/docs/video/<slug>/N.html`.

**IMPORTANT — Output path override:** When invoked by another skill (e.g. `/trend`), the calling skill specifies where files should be saved. ONLY write to that location. Never also write to `/docs/video/` when called from `/trend` — use the trend folder exclusively. Each skill owns its own output directory.

### 9. Write caption file

Create a `captions.md` file in the same folder (`/docs/video/<slug>/captions.md`). If the file already exists, append rather than overwrite.

Structure:

```markdown
# Video Captions — [Title]

## Combined Caption (all platforms)
**Hook:** [First line — the scroll-stopping hook]
**Caption:** [Full caption, conversational Kritano voice, 1-3 sentences]

---

## Instagram Reels
[Caption, max 2200 chars, front-load the hook]

### Hashtags
#WebAccessibility #SEO #Kritano #WebDesign #DigitalAccessibility [15-20 total]

---

## TikTok
[Caption, max 300 chars, punchy and direct]

### Hashtags
#WebAccessibility #SEO #WebDesignTips #TechTok [10-15 total]

---

## YouTube Shorts
**Title**: [max 100 chars]
**Description**: [2-3 sentences]
```

#### Caption guidelines:
- Write in Kritano's brand voice — conversational, authoritative, helpful (not corporate or salesy)
- Use British English spelling (optimise, colour, favour)
- Lead with a scroll-stopping hook in the first line
- Include a soft CTA where natural (e.g. "Link in bio to scan your site")
- 15-20 hashtags on IG — mix broad (#WebDesign) and niche (#WCAG, #A11y)
- Always include #Kritano

### 10. Output summary

After writing all files, output:
- The file paths created (including `captions.md`)
- A one-line description of each variation
- The total animation duration
- A note about how to record to MP4 (screen record or Puppeteer)

---

## HTML Template Skeleton

Every video HTML output MUST use this skeleton:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=450" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      /* Brand colours */
      --indigo-50: #eef2ff;
      --indigo-100: #e0e7ff;
      --indigo-200: #c7d2fe;
      --indigo-300: #a5b4fc;
      --indigo-400: #818cf8;
      --indigo-500: #6366f1;
      --indigo-600: #4f46e5;
      --indigo-700: #4338ca;
      --indigo-800: #3730a3;
      --indigo-900: #312e81;
      --indigo-950: #1e1b4b;
      --amber-50: #fffbeb;
      --amber-200: #fde68a;
      --amber-300: #fcd34d;
      --amber-400: #fbbf24;
      --amber-500: #f59e0b;
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-300: #cbd5e1;
      --slate-400: #94a3b8;
      --slate-500: #64748b;
      --slate-600: #475569;
      --slate-700: #334155;
      --slate-800: #1e293b;
      --slate-900: #0f172a;
      --slate-950: #020617;
      --white: #ffffff;

      /* Category colours */
      --seo: #8b5cf6;
      --a11y: #10b981;
      --security: #ef4444;
      --performance: #0ea5e9;
      --content-cat: #f59e0b;

      /* Score colours */
      --score-excellent: #10b981;
      --score-good: #f59e0b;
      --score-average: #f97316;
      --score-poor: #ef4444;

      /* Timing — adjust per video (20-40s) */
      --video-duration: 36s;

      /* Easing */
      --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
      --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
      --ease-out: cubic-bezier(0, 0, 0.2, 1);
      --ease-gentle-in: cubic-bezier(0.4, 0, 1, 1);
    }

    html {
      width: 450px;
      height: 800px;
      overflow: hidden;
    }

    body {
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      font-family: 'Outfit', system-ui, sans-serif;
      position: relative;
      transform: scale(0.41667);
      transform-origin: top left;
    }

    .canvas {
      width: 1080px;
      height: 1920px;
      position: relative;
      overflow: hidden;
    }

    /* ── Font classes ── */
    .font-display { font-family: 'Instrument Serif', Georgia, serif; }
    .font-body    { font-family: 'Outfit', system-ui, sans-serif; }
    .font-mono    { font-family: 'JetBrains Mono', monospace; }

    /* ── Atmospheric layer (infinite loops, always running) ── */
    .atmosphere {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }

    .gradient-circle {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
    }

    /* ── Content layer ── */
    .content {
      position: relative;
      z-index: 1;
      padding: 100px 100px 100px 100px;
      height: calc(1920px - 60px); /* minus brand reserve */
      display: flex;
      flex-direction: column;
    }

    /* ── Brand reserve (bottom 60px) ── */
    .brand-reserve {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }

    .wordmark {
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      font-size: 18px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      animation: wordmark-pulse 4s ease-in-out infinite;
    }

    @keyframes wordmark-pulse {
      0%, 100% { opacity: 0.5; }
      50%      { opacity: 0.8; }
    }
  </style>
</head>
<body>
  <div class="canvas">

    <!-- Atmospheric background (always looping) -->
    <div class="atmosphere">
      <!-- Gradient circles, grid overlays, etc. -->
    </div>

    <!-- Main content (lifecycle animations) -->
    <div class="content">
      <!-- Content goes here -->
    </div>

    <!-- Brand reserve -->
    <div class="brand-reserve">
      <span class="wordmark" style="color: var(--slate-500);"><svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-right:8px;display:inline-block;"><rect width="32" height="32" rx="7" fill="#4f46e5"/><rect x="3" y="3" width="26" height="26" rx="5" fill="#312e81"/><path d="M10 7 L10 25 L13.5 25 L13.5 17.5 L19.5 25 L24 25 L17 16 L23.5 7 L19.5 7 L13.5 14.5 L13.5 7 Z" fill="white"/><circle cx="24" cy="6.5" r="2.5" fill="#fbbf24"/></svg>Kritano</span>
    </div>

  </div>
</body>
</html>
```

---

## Canvas Specification

```
┌──────────────────────────┐
│      100px top padding    │
│                           │
│  ┌────────────────────┐   │
│  │                    │   │  100px
│  │   Safe Content     │   │  side
│  │   Area             │   │  padding
│  │   880 × 1660 px    │   │
│  │                    │   │
│  │                    │   │
│  │                    │   │
│  └────────────────────┘   │
│      100px bottom pad     │
│   ┌──────────────────┐    │
│   │ Brand Reserve 60 │    │
│   └──────────────────┘    │
└──────────────────────────┘
       1080 × 1920 px
```

- **Canvas**: 1080 × 1920 px (9:16 portrait)
- **Content padding**: 100px all sides (above brand reserve)
- **Brand reserve**: 60px fixed at bottom for Kritano wordmark
- **Safe content area**: ~880 × 1660 px
- **Centre-safe zone**: Keep critical text within inner 80% — some platforms crop edges

---

## Content Overflow — CRITICAL

The 1080×1920px canvas is a hard boundary. **Nothing may overflow or be clipped.** This is the single most common defect — treat it seriously.

### Rules

1. **ALL content uses top-down flex flow** — `flex-direction: column` inside `.content`. No absolute positioning for content elements.
2. **Always calculate total content height EXPLICITLY before writing.** Add up: top padding (100px) + all element heights + all gaps + bottom padding (100px) + brand reserve (60px). Must not exceed 1920px.
3. **Atmospheric elements and branding must be absolute-positioned** with `pointer-events: none`. They sit outside the content flow.
4. **Content that cycles**: If you have more items than can fit (e.g. 8 list items), cycle them in/out — show 4-5 at a time with staggered enter/exit.
5. **When in doubt, make things smaller.** Whitespace is better than clipping.

### Typography Scale (for 1080×1920 video canvas — larger than draw for phone readability)

| Role | Font | Size | Weight | Min Size |
|------|------|------|--------|----------|
| Hero headline | Instrument Serif | 72–96px | 400 | 72px |
| Subheading | Outfit | 42–54px | 600 | 42px |
| Body text | Outfit | 36–42px | 400 | 36px |
| Stat number | Outfit | 120–200px | 700 | 120px |
| Label/caption | Outfit | 24–30px | 500 (uppercase, tracked) | 24px |
| Mono data | JetBrains Mono | 28–36px | 400 | 28px |

**Minimum text size: 24px** — anything smaller won't read on a phone.

**Maximum body text lines visible at once**: 6–8 lines.
**Maximum list items visible at once**: 5 (cycle more by animating in/out).

---

## Loop Mechanism — CRITICAL

The seamless loop is what makes these videos social-ready. Every video MUST loop cleanly.

### How it works

1. **Frame 0 = Frame final**: The last keyframe of every animated element returns it to its `0%` keyframe state
2. **Atmospheric elements**: Run on `animation-iteration-count: infinite` with their own shorter loops (6–12s), so they're always seamless regardless of content timing
3. **Content elements**: Use a single `animation-duration` equal to `--video-duration`, with keyframes that enter, hold, and exit back to start state
4. **Loop hold**: A 0.5–1s static hold at the end (both content gone and atmosphere still moving) gives a natural "reset" moment before the next loop

### Content lifecycle keyframe pattern

Every content element follows this pattern (adjust percentages based on `--video-duration`):

```css
@keyframes lifecycle {
  0%   { opacity: 0; transform: translateY(30px); }     /* hidden — matches 100% */
  8%   { opacity: 1; transform: translateY(0); }         /* enter */
  78%  { opacity: 1; transform: translateY(0); }         /* hold */
  92%  { opacity: 0; transform: translateY(-20px); }     /* exit */
  100% { opacity: 0; transform: translateY(30px); }      /* hidden — matches 0% */
}
```

Each element uses `animation-delay` to stagger entrances across the timeline. All elements must complete their exit before `--video-duration` ends.

### Ambient animations (infinite, independent of content)

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Gradient circle 1 | Drift + scale | 8s | ease-in-out |
| Gradient circle 2 | Counter-drift + opacity pulse | 10s | ease-in-out |
| Grid overlay | Subtle opacity breathe | 6s | ease-in-out |
| Background gradient | Slow colour shift | 12s | linear |

These run independently and loop infinitely, providing constant subtle motion.

---

## Quality Checklist

Before outputting each file, verify:

- [ ] Canvas is exactly 1080 × 1920 px with no overflow
- [ ] All fonts load from Google Fonts (Instrument Serif, Outfit, JetBrains Mono)
- [ ] No external dependencies beyond Google Fonts
- [ ] No JavaScript — pure HTML + CSS only
- [ ] Animation total duration is 20–40 seconds (check `--video-duration`)
- [ ] Last frame visually matches first frame (loop test — verify every `@keyframes` block has matching 0% and 100%)
- [ ] Atmospheric elements loop independently and infinitely
- [ ] Content enters and exits cleanly — no jump cuts or flashes
- [ ] All `animation-fill-mode` values are correct (no flash of unstyled content on load)
- [ ] Brand reserve (Kritano wordmark) is present at bottom, 60px height
- [ ] All text is ≥ 24px (readable on phone)
- [ ] All colours are from the brand palette (indigo, amber, slate, category, score)
- [ ] No content overflows the safe area (880 × 1660 px)
- [ ] Background treatment matches one of the 4 approved styles (light, dark, brand-solid, white)
- [ ] Each variation is visually distinct from the others
- [ ] Self-contained file opens correctly in a browser

---

## Recording Guidance

Include this in the output summary for the user:

### Screen Record (Simplest)
1. Open the HTML file in Chrome
2. Use macOS screen recording (Cmd+Shift+5) or OBS
3. Record for one full loop (duration shown in `--video-duration`)
4. Trim in CapCut / iMovie

### Puppeteer + ffmpeg (Automated)
```bash
# Capture frames at 30fps
node capture.js <file.html> --fps=30 --duration=36
# Stitch to MP4
ffmpeg -framerate 30 -i frame_%04d.png -c:v libx264 -pix_fmt yuv420p output.mp4
```

---

## Reference Files

| File | Purpose |
|------|---------|
| `brand-motion.md` | Motion-specific brand rules — timing tokens, easing, animation patterns, stagger system |
| `templates.md` | Reusable animation code snippets for common video patterns |
