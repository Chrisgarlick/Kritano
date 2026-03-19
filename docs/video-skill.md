# Video Skill — Ultrathink Plan

## Overview / Summary

A new `/video` skill that generates brand-consistent animated HTML files sized for Instagram Reels / TikTok (1080×1920, 9:16 portrait). Each output is a self-contained HTML document that uses CSS `@keyframes` animations to create a 20–40 second motion sequence. The animation is designed to **loop seamlessly** — the opening and closing states match so the file can play on repeat without a visible cut.

The skill shares the draw skill's brand language (colours, typography, atmospheric elements) but adapts it for a vertical, time-based medium.

---

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **9:16 portrait canvas (1080 × 1920 px)** | Native aspect ratio for IG Reels, TikTok, YouTube Shorts |
| 2 | **Pure CSS animation (no JS)** | Self-contained, no runtime dependencies, works in any browser screenshot/recording tool |
| 3 | **Single HTML file per variation** | Matches draw skill pattern — one file = one asset |
| 4 | **20–40 second total duration** | Sweet spot for short-form social; long enough to convey a point, short enough to retain viewers |
| 5 | **Loop-friendly design** | Last keyframe state mirrors first keyframe state with a brief hold, creating seamless replay |
| 6 | **3 variations per prompt** | Same as draw: clean/minimal, rich/layered, bold/different |
| 7 | **CSS `animation-fill-mode: forwards` with loop reset** | Each element animates in, holds, animates out to starting state |
| 8 | **No audio** | HTML/CSS cannot produce audio; user records separately or adds in editor |
| 9 | **Output to `/docs/video/<slug>/`** | Parallel structure to `/docs/draw/<slug>/` |
| 10 | **Recording instructions in README** | Guide user on how to capture the HTML as an MP4 (browser screen record, ffmpeg, Puppeteer) |

---

## Canvas Specification

```
┌──────────────────────────┐
│      Safe Zone Top        │  100px padding
│                           │
│  ┌────────────────────┐   │
│  │                    │   │
│  │   Content Area     │   │  ~880 × 1620 px
│  │   880 × 1620      │   │
│  │                    │   │
│  │                    │   │
│  │                    │   │
│  │                    │   │
│  └────────────────────┘   │
│                           │
│   PagePulser Wordmark     │  60px brand reserve
│      Safe Zone Bottom     │  40px padding
└──────────────────────────┘
       1080 × 1920 px
```

- **Canvas**: 1080 × 1920 px (9:16)
- **Content padding**: 100px top, 100px sides, 100px bottom (above brand reserve)
- **Brand reserve**: 60px fixed at bottom for PagePulser wordmark
- **Safe content area**: ~880 × 1660 px
- **Centre-safe zone**: Keep critical text within inner 80% (864 × 1536 px) — some platforms crop edges

---

## Animation Architecture

### Timeline Structure

Every video follows a **5-act timeline**:

```
[INTRO]  →  [BUILD]  →  [PEAK]  →  [RESOLVE]  →  [OUTRO/LOOP-RESET]
 0-4s        4-12s       12-24s      24-32s         32-40s
```

| Phase | Duration | Purpose | Animation Style |
|-------|----------|---------|-----------------|
| **Intro** | 0–4s | Set the scene. Background fades in, atmospheric elements appear, title enters. | Fade-in, scale-up, blur-to-sharp |
| **Build** | 4–12s | Supporting content appears sequentially (stats, bullets, cards). | Staggered reveal-up, count-up numbers |
| **Peak** | 12–24s | Core message is fully visible. Key stat/quote holds for reading time. | Subtle pulse, gentle float, shimmer |
| **Resolve** | 24–32s | Content begins to exit or transform. Prepares viewer for loop. | Fade-out, scale-down, blur |
| **Outro** | 32–40s | Returns to opening state. CTA or wordmark pulses. Seamless into Intro. | Mirror of Intro in reverse, ending on same visual state as frame 0 |

### Loop Mechanism

The loop works by ensuring:

1. **Frame 0 = Frame final**: The last keyframe of every animated element returns it to its `0%` keyframe state
2. **Background & atmosphere**: These run on `animation-iteration-count: infinite` with their own shorter loops (e.g. 8s ambient drift), so they're always seamless
3. **Content elements**: Use a single `animation-duration` equal to the full video length, with keyframes that enter, hold, and exit
4. **Brief hold at loop point**: A 0.5–1s static hold at the end gives the brain a "reset" moment

### Keyframe Pattern (per element)

```css
@keyframes content-lifecycle {
  0%   { opacity: 0; transform: translateY(30px); }     /* hidden — matches 100% */
  10%  { opacity: 1; transform: translateY(0); }         /* enter */
  75%  { opacity: 1; transform: translateY(0); }         /* hold */
  90%  { opacity: 0; transform: translateY(-20px); }     /* exit */
  100% { opacity: 0; transform: translateY(30px); }      /* hidden — matches 0% */
}
```

Each element uses `animation-delay` to stagger entrances across the timeline.

### Ambient Animations (infinite loop, independent of content)

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Gradient circle 1 | Drift + scale | 8s | ease-in-out |
| Gradient circle 2 | Counter-drift + opacity pulse | 10s | ease-in-out |
| Grid overlay | Subtle opacity breathe | 6s | ease-in-out |
| Background gradient | Slow hue shift | 12s | linear |

These run independently and loop infinitely, providing constant subtle motion even during content holds.

---

## Content Types / Templates

### 1. Stat Reveal
- Big number counts up (CSS counter or pre-rendered frames)
- Supporting context text below
- Good for: "73% of websites fail accessibility checks"

### 2. Quote / Insight
- Large quote text animates in word-by-word or line-by-line
- Attribution fades in after
- Good for: Founder quotes, industry insights

### 3. List / Tips
- Items reveal one-by-one with stagger
- Each item has an icon or number
- Good for: "5 things killing your SEO"

### 4. Before / After
- Split screen or transition between two states
- Good for: Score comparisons, website improvements

### 5. Data Story
- Multiple stats build up to a conclusion
- Score rings animate, bars fill
- Good for: Audit result highlights

### 6. Single Statement
- One bold sentence, maximum impact
- Dramatic enter/hold/exit
- Good for: Hot takes, brand statements

---

## File Structure

```
.claude/skills/video/
├── SKILL.md              # Skill definition (workflow, rules, templates)
├── brand-motion.md       # Motion-specific brand reference (timing, easing, patterns)
└── templates.md          # Reusable animation code snippets

docs/video/
└── <slug>/
    ├── 1.html            # Variation 1 (clean/minimal)
    ├── 2.html            # Variation 2 (rich/layered)
    ├── 3.html            # Variation 3 (bold/different)
    └── captions.md       # Reel/TikTok captions + hashtags
```

---

## SKILL.md — Workflow

1. **Parse prompt** — Identify the core message, supporting data, and emotional tone
2. **Slugify** — Create filesystem-safe folder name from prompt
3. **Check for existing folder** — Continue numbering if outputs exist
4. **Read reference files** — `brand-motion.md` and `templates.md`
5. **Choose content type** — Select from the 6 templates above based on content
6. **Plan the timeline** — Map content to the 5-act structure, assign durations
7. **Generate 3 variations** — Each with distinct visual treatment:
   - **V1 — Clean / Minimal**: Light background, simple animations, lots of whitespace
   - **V2 — Rich / Layered**: Dark background, multiple atmospheric elements, complex staggers
   - **V3 — Bold / Different**: Brand-solid or unexpected composition, strongest visual impact
8. **Write files** — Output to `/docs/video/<slug>/N.html`
9. **Write captions.md** — Platform-specific captions (IG Reels, TikTok, YouTube Shorts)
10. **Output summary** — List created files and brief description of each variation

---

## HTML Template Skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1080, height=1920" />
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

      /* Timing */
      --video-duration: 36s;
      --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
      --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
      --ease-out: cubic-bezier(0, 0, 0.2, 1);
    }

    body {
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      font-family: 'Outfit', sans-serif;
      background: var(--slate-950);
      position: relative;
    }

    .canvas {
      width: 1080px;
      height: 1920px;
      position: relative;
      overflow: hidden;
    }

    /* ── Atmospheric layer (infinite loops) ── */
    .atmosphere { position: absolute; inset: 0; pointer-events: none; z-index: 0; }

    .gradient-circle {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
    }

    .gradient-circle--indigo {
      width: 600px; height: 600px;
      background: var(--indigo-500);
      opacity: 0.15;
      top: -100px; left: -150px;
      animation: drift-1 8s ease-in-out infinite alternate;
    }

    .gradient-circle--amber {
      width: 400px; height: 400px;
      background: var(--amber-400);
      opacity: 0.1;
      bottom: 200px; right: -100px;
      animation: drift-2 10s ease-in-out infinite alternate;
    }

    @keyframes drift-1 {
      0%   { transform: translate(0, 0) scale(1); }
      100% { transform: translate(60px, 80px) scale(1.15); }
    }

    @keyframes drift-2 {
      0%   { transform: translate(0, 0) scale(1); }
      100% { transform: translate(-40px, -60px) scale(1.1); }
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

    /* ── Brand reserve ── */
    .brand-reserve {
      position: absolute;
      bottom: 0; left: 0; right: 0;
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
      color: var(--slate-500);
      animation: wordmark-pulse 4s ease-in-out infinite;
    }

    @keyframes wordmark-pulse {
      0%, 100% { opacity: 0.5; }
      50%      { opacity: 0.8; }
    }

    /* ── Generic content lifecycle animation ── */
    .animate-lifecycle {
      opacity: 0;
      transform: translateY(30px);
      animation: lifecycle var(--video-duration) var(--ease-smooth) infinite;
    }

    @keyframes lifecycle {
      0%   { opacity: 0; transform: translateY(30px); }
      8%   { opacity: 1; transform: translateY(0); }
      78%  { opacity: 1; transform: translateY(0); }
      92%  { opacity: 0; transform: translateY(-20px); }
      100% { opacity: 0; transform: translateY(30px); }
    }

    /* ── Typography ── */
    .font-display { font-family: 'Instrument Serif', serif; }
    .font-body    { font-family: 'Outfit', sans-serif; }
    .font-mono    { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body>
  <div class="canvas">

    <!-- Atmospheric background (always looping) -->
    <div class="atmosphere">
      <div class="gradient-circle gradient-circle--indigo"></div>
      <div class="gradient-circle gradient-circle--amber"></div>
    </div>

    <!-- Main content (lifecycle animation) -->
    <div class="content">
      <!-- Content goes here -->
    </div>

    <!-- Brand reserve -->
    <div class="brand-reserve">
      <span class="wordmark">PagePulser</span>
    </div>

  </div>
</body>
</html>
```

---

## brand-motion.md — Key Contents

### Timing Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--duration-instant` | 100ms | Micro-interactions |
| `--duration-fast` | 200ms | Hover states |
| `--duration-normal` | 300ms | Standard transitions |
| `--duration-slow` | 500ms | Emphasis transitions |
| `--duration-dramatic` | 1000ms | Hero element entrances |
| `--duration-content` | 1500ms | Content block reveals |

### Easing Functions

| Name | Value | Feel |
|------|-------|------|
| Smooth | `cubic-bezier(0.4, 0, 0.2, 1)` | Natural, default |
| Bounce | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful overshoot |
| Sharp-out | `cubic-bezier(0, 0, 0.2, 1)` | Quick start, slow stop |
| Gentle-in | `cubic-bezier(0.4, 0, 1, 1)` | Slow start for exits |

### Stagger Pattern

```css
.stagger-1 { animation-delay: calc(var(--base-delay) + 0.0s); }
.stagger-2 { animation-delay: calc(var(--base-delay) + 0.3s); }
.stagger-3 { animation-delay: calc(var(--base-delay) + 0.6s); }
.stagger-4 { animation-delay: calc(var(--base-delay) + 0.9s); }
.stagger-5 { animation-delay: calc(var(--base-delay) + 1.2s); }
```

### Signature Animations

- **Pulse-glow**: Subtle indigo glow that breathes — used on score rings, key numbers
- **Heartbeat**: Quick double-pulse — used to draw attention to CTA
- **Reveal-up**: Content slides up from below with fade — primary entrance
- **Count-up**: Numbers increment from 0 to target — for statistics (use CSS counters or pre-baked frames)
- **Score-ring-fill**: SVG stroke-dashoffset animates from 0 to score value

---

## templates.md — Key Snippets

Will include reusable code for:

1. **Lifecycle animation with custom timing** — Macro to set enter/hold/exit percentages
2. **Staggered list reveal** — N items entering sequentially
3. **Score ring animation** — SVG circle with stroke-dashoffset
4. **Stat counter** — CSS counter-based number animation (or stepped approach)
5. **Quote text — line-by-line reveal** — Each line has offset delay
6. **Split screen transition** — Clip-path based before/after
7. **Background treatments** — Light, dark, brand-solid, gradient variants (all with atmospheric elements)
8. **Wordmark variations** — Light/dark brand reserve
9. **Progress bar fill** — Horizontal bar that animates to a percentage
10. **Card entrance** — Scale + fade with slight rotation

---

## Content Overflow — CRITICAL

The same discipline from draw applies, adapted for the taller canvas:

- **Never let content overflow** the 880 × 1660 px safe area
- **All content uses top-down flex flow** — no absolute positioning for content elements
- **Font sizes for video** (larger than draw, for mobile readability):
  - Hero headline: 72–96px (Instrument Serif)
  - Subheading: 42–54px (Outfit 600)
  - Body text: 36–42px (Outfit 400)
  - Stat number: 120–200px (Outfit 700)
  - Label/caption: 24–30px (Outfit 500, uppercase, tracked)
  - Mono data: 28–36px (JetBrains Mono 400)
- **Maximum lines of body text visible at once**: 6–8 lines
- **Maximum list items visible at once**: 5 (stagger more by cycling in/out)

---

## Captions Format

```markdown
# Video Captions — [Title]

## Instagram Reels

[Caption text, max 2200 chars, front-load the hook in first line]

### Hashtags
#WebAccessibility #SEO #PagePulser #WebDesign #DigitalAccessibility ...

---

## TikTok

[Caption text, max 300 chars, punchy and direct]

### Hashtags
#WebAccessibility #SEO #WebDesignTips #TechTok ...

---

## YouTube Shorts

**Title**: [max 100 chars]
**Description**: [2-3 sentences]
```

---

## Quality Checklist

Before outputting any video HTML file, verify:

- [ ] Canvas is exactly 1080 × 1920 px with no overflow
- [ ] All fonts load from Google Fonts (Instrument Serif, Outfit, JetBrains Mono)
- [ ] No external dependencies beyond Google Fonts
- [ ] Animation total duration is 20–40 seconds
- [ ] Last frame visually matches first frame (loop test)
- [ ] Atmospheric elements loop independently and infinitely
- [ ] Content enters and exits cleanly — no jump cuts
- [ ] Brand reserve (PagePulser wordmark) is present at bottom
- [ ] Text is large enough to read on a phone (minimum 24px for any text)
- [ ] All colours are from the brand palette
- [ ] No content overflows the safe area
- [ ] `animation-fill-mode` is set correctly (no flashing on load)
- [ ] File is self-contained and opens correctly in a browser
- [ ] Background treatment matches one of the 4 approved styles

---

## Recording / Export Guidance

Since HTML/CSS cannot be directly uploaded as a video, the user needs to capture it. Include this in the skill output:

### Option 1: Browser Screen Record (Simplest)
1. Open the HTML file in Chrome
2. Use macOS screen recording (Cmd+Shift+5) or OBS
3. Record for one full loop (check `--video-duration` value)
4. Trim in CapCut / iMovie

### Option 2: Puppeteer + ffmpeg (Automated)
```bash
# Install
npm install puppeteer

# Screenshot each frame (30fps × 36s = 1080 frames)
node capture.js <file.html> --fps=30 --duration=36

# Stitch to MP4
ffmpeg -framerate 30 -i frame_%04d.png -c:v libx264 -pix_fmt yuv420p output.mp4
```

### Option 3: Chrome DevTools
1. Open DevTools → Performance tab
2. Use "Record" to capture, then export frames

---

## Implementation Order

| Step | Task | Files |
|------|------|-------|
| 1 | Create skill directory and SKILL.md | `.claude/skills/video/SKILL.md` |
| 2 | Create brand-motion.md reference | `.claude/skills/video/brand-motion.md` |
| 3 | Create templates.md with reusable snippets | `.claude/skills/video/templates.md` |
| 4 | Create output directory | `docs/video/` (created on first run) |
| 5 | Test with a sample prompt | Generate 3 variations, verify loop, check brand compliance |

---

## Testing Plan

| Test | Expectation |
|------|-------------|
| Open HTML in Chrome at 100% zoom | Canvas fills 1080×1920 without scroll |
| Let animation play to completion | Content enters, holds, exits over 20-40s |
| Let animation loop twice | No visible cut between end and start |
| Check on mobile (responsive preview) | All text readable at phone scale |
| Validate font loading | Instrument Serif, Outfit, JetBrains Mono all render |
| Verify no JS in output | Pure HTML + CSS only |
| Check brand compliance | Only indigo/amber/slate colours, correct fonts, wordmark present |

---

## Considerations

- **Font loading delay**: Google Fonts may take 1-2s to load. The atmospheric background animating during this time provides visual interest while fonts arrive. Could add `font-display: swap` to prevent invisible text.
- **CSS counter limitations**: True "counting up" numbers are hard in pure CSS. Alternative: use stepped `content` changes with `@keyframes` that swap the displayed number at intervals, or simply animate the number fading in at its final value.
- **Browser compatibility**: Target Chrome/Safari (what users will screen-record from). Avoid experimental CSS properties.
- **File size**: HTML files will be slightly larger than draw outputs due to more keyframes, but should stay under 50KB each.
- **Carousel/series support**: Multiple related videos (e.g., a 3-part series) should share the same slug folder and use consistent visual treatment across parts.
