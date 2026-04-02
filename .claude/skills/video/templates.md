# Reusable Video Templates & Snippets

Animation code snippets for common video patterns. Use these as building blocks — adapt timing, colours, and content to fit each design.

---

## 1. Content Lifecycle (Master Pattern)

The core animation for any content element. Enter → hold → exit → return to start.

### Single element (full video duration)

```css
@keyframes lifecycle-title {
  0%   { opacity: 0; transform: translateY(40px); }
  8%   { opacity: 1; transform: translateY(0); }
  78%  { opacity: 1; transform: translateY(0); }
  90%  { opacity: 0; transform: translateY(-25px); }
  100% { opacity: 0; transform: translateY(40px); }
}

.title {
  opacity: 0;
  animation: lifecycle-title var(--video-duration) var(--ease-smooth) infinite;
}
```

### Staggered group (title, subtitle, body)

```css
@keyframes lifecycle-a {
  0%   { opacity: 0; transform: translateY(40px); }
  6%   { opacity: 1; transform: translateY(0); }
  78%  { opacity: 1; transform: translateY(0); }
  88%  { opacity: 0; transform: translateY(-25px); }
  100% { opacity: 0; transform: translateY(40px); }
}

@keyframes lifecycle-b {
  0%   { opacity: 0; transform: translateY(40px); }
  4%   { opacity: 0; transform: translateY(40px); }
  12%  { opacity: 1; transform: translateY(0); }
  75%  { opacity: 1; transform: translateY(0); }
  86%  { opacity: 0; transform: translateY(-25px); }
  100% { opacity: 0; transform: translateY(40px); }
}

@keyframes lifecycle-c {
  0%   { opacity: 0; transform: translateY(40px); }
  8%   { opacity: 0; transform: translateY(40px); }
  17%  { opacity: 1; transform: translateY(0); }
  72%  { opacity: 1; transform: translateY(0); }
  84%  { opacity: 0; transform: translateY(-25px); }
  100% { opacity: 0; transform: translateY(40px); }
}

.el-a { animation: lifecycle-a var(--video-duration) var(--ease-smooth) infinite; opacity: 0; }
.el-b { animation: lifecycle-b var(--video-duration) var(--ease-smooth) infinite; opacity: 0; }
.el-c { animation: lifecycle-c var(--video-duration) var(--ease-smooth) infinite; opacity: 0; }
```

---

## 2. Atmospheric Backgrounds

### Light Background with Animated Accents

```html
<div class="canvas" style="background: #F8FAFC;">
  <div class="atmosphere">
    <!-- Indigo accent — top left -->
    <div style="
      position: absolute; top: -120px; left: -100px;
      width: 600px; height: 600px;
      background: #EEF2FF; border-radius: 50%;
      opacity: 0.7; filter: blur(100px);
      animation: drift-indigo 8s ease-in-out infinite;
    "></div>
    <!-- Amber accent — bottom right -->
    <div style="
      position: absolute; bottom: 100px; right: -80px;
      width: 450px; height: 450px;
      background: #FFFBEB; border-radius: 50%;
      opacity: 0.6; filter: blur(100px);
      animation: drift-amber 10s ease-in-out infinite;
    "></div>
  </div>
  <!-- content + brand-reserve here -->
</div>

<style>
@keyframes drift-indigo {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(80px, 120px) scale(1.2); }
}
@keyframes drift-amber {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(-60px, -80px) scale(1.15); }
}
</style>
```

### Dark Background with Grid & Glow

```html
<div class="canvas" style="background: linear-gradient(180deg, #1E1B4B 0%, #0F172A 100%);">
  <div class="atmosphere">
    <!-- Grid overlay -->
    <div style="
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      animation: grid-breathe 6s ease-in-out infinite;
    "></div>
    <!-- Indigo glow — upper area -->
    <div style="
      position: absolute; top: -150px; right: -100px;
      width: 700px; height: 700px;
      background: rgba(99, 102, 241, 0.12);
      border-radius: 50%; filter: blur(120px);
      animation: drift-indigo 8s ease-in-out infinite;
    "></div>
    <!-- Amber glow — lower area -->
    <div style="
      position: absolute; bottom: 200px; left: -120px;
      width: 500px; height: 500px;
      background: rgba(251, 191, 36, 0.06);
      border-radius: 50%; filter: blur(100px);
      animation: drift-amber 10s ease-in-out infinite;
    "></div>
  </div>
  <!-- content + brand-reserve here -->
</div>

<style>
@keyframes grid-breathe {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 0.7; }
}
</style>
```

### Brand Solid Background (Indigo)

```html
<div class="canvas" style="background: linear-gradient(135deg, #4F46E5 0%, #312E81 100%); background-size: 200% 200%; animation: bg-shift 12s linear infinite;">
  <div class="atmosphere">
    <!-- Grid overlay -->
    <div style="
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
      background-size: 40px 40px;
    "></div>
    <!-- Light glow -->
    <div style="
      position: absolute; top: 300px; left: 50%;
      transform: translateX(-50%);
      width: 800px; height: 800px;
      background: rgba(129, 140, 248, 0.2);
      border-radius: 50%; filter: blur(150px);
      animation: drift-indigo 8s ease-in-out infinite;
    "></div>
  </div>
  <!-- content + brand-reserve here -->
</div>

<style>
@keyframes bg-shift {
  0%, 100% { background-position: 0% 0%; }
  50%      { background-position: 100% 100%; }
}
</style>
```

---

## 3. Stat Reveal Pattern

Big number scales in with emphasis, supporting text fades up after.

```html
<div class="content">
  <!-- Section label -->
  <p class="el-label" style="
    font-family: 'Outfit', sans-serif;
    font-size: 26px; font-weight: 600;
    color: #4F46E5; text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0;
    animation: lifecycle-a var(--video-duration) var(--ease-smooth) infinite;
  ">Did you know?</p>

  <!-- Big stat number -->
  <p class="el-stat" style="
    font-family: 'Outfit', sans-serif;
    font-size: 180px; font-weight: 700;
    color: #0F172A; line-height: 1;
    margin-top: 40px;
    opacity: 0;
    animation: stat-lifecycle var(--video-duration) var(--ease-smooth) infinite;
  ">73%</p>

  <!-- Supporting text -->
  <p class="el-body" style="
    font-family: 'Outfit', sans-serif;
    font-size: 42px; font-weight: 400;
    color: #475569; line-height: 1.4;
    margin-top: 40px; max-width: 700px;
    opacity: 0;
    animation: lifecycle-c var(--video-duration) var(--ease-smooth) infinite;
  ">of websites fail basic accessibility checks.</p>
</div>

<style>
@keyframes stat-lifecycle {
  0%   { opacity: 0; transform: scale(0.6); }
  5%   { opacity: 0; transform: scale(0.6); }
  14%  { opacity: 1; transform: scale(1); }
  75%  { opacity: 1; transform: scale(1); }
  88%  { opacity: 0; transform: scale(0.8); }
  100% { opacity: 0; transform: scale(0.6); }
}
</style>
```

---

## 4. Quote Reveal Pattern

Lines of a quote appear one by one from left.

```html
<div class="content" style="justify-content: center;">
  <div style="max-width: 780px;">
    <p class="quote-line-1" style="
      font-family: 'Instrument Serif', Georgia, serif;
      font-size: 64px; font-weight: 400;
      color: #FFFFFF; line-height: 1.25;
      opacity: 0;
      animation: quote-line-1 var(--video-duration) var(--ease-smooth) infinite;
    ">"The power of the Web</p>
    <p class="quote-line-2" style="
      font-family: 'Instrument Serif', Georgia, serif;
      font-size: 64px; font-weight: 400;
      color: #FFFFFF; line-height: 1.25;
      opacity: 0;
      animation: quote-line-2 var(--video-duration) var(--ease-smooth) infinite;
    ">is in its universality.</p>
    <p class="quote-line-3" style="
      font-family: 'Instrument Serif', Georgia, serif;
      font-size: 64px; font-weight: 400;
      color: #FFFFFF; line-height: 1.25;
      opacity: 0;
      animation: quote-line-3 var(--video-duration) var(--ease-smooth) infinite;
    ">Access by everyone."</p>

    <!-- Attribution -->
    <p class="attribution" style="
      font-family: 'Outfit', sans-serif;
      font-size: 28px; font-weight: 400;
      color: #94A3B8; margin-top: 48px;
      opacity: 0;
      animation: lifecycle-attribution var(--video-duration) var(--ease-smooth) infinite;
    ">— Tim Berners-Lee</p>
  </div>
</div>

<style>
@keyframes quote-line-1 {
  0%   { opacity: 0; transform: translateX(-30px); }
  8%   { opacity: 1; transform: translateX(0); }
  75%  { opacity: 1; transform: translateX(0); }
  88%  { opacity: 0; transform: translateX(20px); }
  100% { opacity: 0; transform: translateX(-30px); }
}
@keyframes quote-line-2 {
  0%   { opacity: 0; transform: translateX(-30px); }
  6%   { opacity: 0; transform: translateX(-30px); }
  14%  { opacity: 1; transform: translateX(0); }
  73%  { opacity: 1; transform: translateX(0); }
  86%  { opacity: 0; transform: translateX(20px); }
  100% { opacity: 0; transform: translateX(-30px); }
}
@keyframes quote-line-3 {
  0%   { opacity: 0; transform: translateX(-30px); }
  12%  { opacity: 0; transform: translateX(-30px); }
  20%  { opacity: 1; transform: translateX(0); }
  71%  { opacity: 1; transform: translateX(0); }
  84%  { opacity: 0; transform: translateX(20px); }
  100% { opacity: 0; transform: translateX(-30px); }
}
@keyframes lifecycle-attribution {
  0%   { opacity: 0; transform: translateY(20px); }
  18%  { opacity: 0; transform: translateY(20px); }
  25%  { opacity: 1; transform: translateY(0); }
  69%  { opacity: 1; transform: translateY(0); }
  82%  { opacity: 0; transform: translateY(-15px); }
  100% { opacity: 0; transform: translateY(20px); }
}
</style>
```

---

## 5. Staggered List Pattern

Items enter one by one from below.

```html
<div class="content">
  <h2 class="el-title" style="
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 72px; font-weight: 400;
    color: #0F172A; line-height: 1.15;
    opacity: 0;
    animation: lifecycle-a var(--video-duration) var(--ease-smooth) infinite;
  ">5 quick wins for accessibility.</h2>

  <div style="display: flex; flex-direction: column; gap: 28px; margin-top: 60px;">
    <div class="list-item" style="
      display: flex; align-items: flex-start; gap: 24px;
      opacity: 0;
      animation: list-item-1 var(--video-duration) var(--ease-smooth) infinite;
    ">
      <span style="
        font-family: 'Outfit', sans-serif;
        font-size: 24px; font-weight: 700;
        color: #FFFFFF; background: #4F46E5;
        width: 48px; height: 48px; border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      ">1</span>
      <p style="
        font-family: 'Outfit', sans-serif;
        font-size: 38px; font-weight: 400;
        color: #334155; line-height: 1.35;
        padding-top: 4px;
      ">Add alt text to every image</p>
    </div>

    <!-- Repeat for items 2-5 with list-item-2 through list-item-5 animations -->
  </div>
</div>

<style>
@keyframes list-item-1 {
  0%   { opacity: 0; transform: translateY(30px); }
  11%  { opacity: 0; transform: translateY(30px); }
  17%  { opacity: 1; transform: translateY(0); }
  72%  { opacity: 1; transform: translateY(0); }
  83%  { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 0; transform: translateY(30px); }
}
@keyframes list-item-2 {
  0%   { opacity: 0; transform: translateY(30px); }
  15%  { opacity: 0; transform: translateY(30px); }
  21%  { opacity: 1; transform: translateY(0); }
  70%  { opacity: 1; transform: translateY(0); }
  81%  { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 0; transform: translateY(30px); }
}
@keyframes list-item-3 {
  0%   { opacity: 0; transform: translateY(30px); }
  19%  { opacity: 0; transform: translateY(30px); }
  25%  { opacity: 1; transform: translateY(0); }
  68%  { opacity: 1; transform: translateY(0); }
  79%  { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 0; transform: translateY(30px); }
}
@keyframes list-item-4 {
  0%   { opacity: 0; transform: translateY(30px); }
  23%  { opacity: 0; transform: translateY(30px); }
  29%  { opacity: 1; transform: translateY(0); }
  66%  { opacity: 1; transform: translateY(0); }
  77%  { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 0; transform: translateY(30px); }
}
@keyframes list-item-5 {
  0%   { opacity: 0; transform: translateY(30px); }
  27%  { opacity: 0; transform: translateY(30px); }
  33%  { opacity: 1; transform: translateY(0); }
  64%  { opacity: 1; transform: translateY(0); }
  75%  { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 0; transform: translateY(30px); }
}
</style>
```

---

## 6. Score Ring Animation (SVG)

Animated score ring that fills on entrance and empties on exit.

```html
<svg width="280" height="280" viewBox="0 0 280 280" style="display: block; margin: 0 auto;">
  <!-- Track -->
  <circle cx="140" cy="140" r="120" fill="none" stroke="#E2E8F0" stroke-width="10" />
  <!-- Progress -->
  <circle cx="140" cy="140" r="120" fill="none" stroke="#10B981" stroke-width="10"
    stroke-linecap="round"
    stroke-dasharray="754"
    stroke-dashoffset="754"
    transform="rotate(-90 140 140)"
    style="animation: ring-fill-lifecycle var(--video-duration) var(--ease-smooth) infinite;"
  />
  <!-- Score number -->
  <text x="140" y="155" text-anchor="middle"
    font-family="'Instrument Serif', Georgia, serif"
    font-size="80" fill="#0F172A"
    style="opacity: 0; animation: lifecycle-a var(--video-duration) var(--ease-smooth) infinite;"
  >92</text>
</svg>

<style>
@keyframes ring-fill-lifecycle {
  0%   { stroke-dashoffset: 754; }                /* empty — matches 100% */
  8%   { stroke-dashoffset: 754; }                /* wait for entrance */
  20%  { stroke-dashoffset: 60; }                 /* fill to score (92/100) */
  75%  { stroke-dashoffset: 60; }                 /* hold */
  90%  { stroke-dashoffset: 754; }                /* empty out */
  100% { stroke-dashoffset: 754; }                /* empty — matches 0% */
}
</style>
```

**Calculating stroke-dashoffset:**
- `circumference = 2 × π × radius` (for r=120: ~754)
- `filled offset = circumference × (1 - score/100)`
- Score 92 → offset = 754 × 0.08 = ~60

---

## 7. Progress Bar Fill

Horizontal bar that fills to a percentage.

```html
<div style="width: 100%; height: 12px; background: #E2E8F0; border-radius: 6px; overflow: hidden;">
  <div style="
    width: 73%;
    height: 100%;
    background: linear-gradient(90deg, #4F46E5, #818CF8);
    border-radius: 6px;
    transform-origin: left;
    transform: scaleX(0);
    animation: bar-fill-lifecycle var(--video-duration) var(--ease-smooth) infinite;
  "></div>
</div>

<style>
@keyframes bar-fill-lifecycle {
  0%   { transform: scaleX(0); }
  10%  { transform: scaleX(0); }
  22%  { transform: scaleX(1); }
  75%  { transform: scaleX(1); }
  90%  { transform: scaleX(0); }
  100% { transform: scaleX(0); }
}
</style>
```

---

## 8. Card Entrance

Card scales in with subtle rotation for visual interest.

```html
<div style="
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08);
  padding: 48px;
  opacity: 0;
  animation: card-lifecycle var(--video-duration) var(--ease-smooth) infinite;
">
  <!-- Card content -->
</div>

<style>
@keyframes card-lifecycle {
  0%   { opacity: 0; transform: translateY(40px) scale(0.95); }
  10%  { opacity: 0; transform: translateY(40px) scale(0.95); }
  18%  { opacity: 1; transform: translateY(0) scale(1); }
  72%  { opacity: 1; transform: translateY(0) scale(1); }
  86%  { opacity: 0; transform: translateY(-30px) scale(0.97); }
  100% { opacity: 0; transform: translateY(40px) scale(0.95); }
}
</style>
```

---

## 9. Decorative Divider (Animated)

A horizontal rule with a pulsing centre dot.

```html
<div style="display: flex; align-items: center; gap: 20px; margin: 40px 0; opacity: 0; animation: lifecycle-b var(--video-duration) var(--ease-smooth) infinite;">
  <div style="flex: 1; height: 1px; background: #E2E8F0;"></div>
  <div style="width: 10px; height: 10px; border-radius: 50%; background: #4F46E5; animation: pulse-glow 3s ease-in-out infinite;"></div>
  <div style="flex: 1; height: 1px; background: #E2E8F0;"></div>
</div>
```

---

## 10. Kritano Wordmark (Brand Reserve)

### On light backgrounds
```html
<div class="brand-reserve">
  <span style="
    font-family: 'Outfit', sans-serif;
    font-weight: 600; font-size: 18px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #94A3B8;
    animation: wordmark-pulse 4s ease-in-out infinite;
  ">Kritano</span>
</div>
```

### On dark backgrounds
```html
<div class="brand-reserve">
  <span style="
    font-family: 'Outfit', sans-serif;
    font-weight: 600; font-size: 18px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #64748B;
    animation: wordmark-pulse 4s ease-in-out infinite;
  ">Kritano</span>
</div>
```

### On brand-solid backgrounds
```html
<div class="brand-reserve">
  <span style="
    font-family: 'Outfit', sans-serif;
    font-weight: 600; font-size: 18px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.4);
    animation: wordmark-pulse 4s ease-in-out infinite;
  ">Kritano</span>
</div>
```

---

## 11. Single Statement (Maximum Impact)

One bold line, dramatic entrance, long hold.

```html
<div class="content" style="justify-content: center; align-items: center; text-align: center;">
  <p style="
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 84px; font-weight: 400;
    color: #FFFFFF; line-height: 1.15;
    max-width: 800px;
    opacity: 0;
    animation: statement-lifecycle var(--video-duration) var(--ease-smooth) infinite;
  ">Your website is your most important employee.</p>
</div>

<style>
@keyframes statement-lifecycle {
  0%   { opacity: 0; transform: scale(0.85); filter: blur(8px); }
  12%  { opacity: 1; transform: scale(1); filter: blur(0); }
  80%  { opacity: 1; transform: scale(1); filter: blur(0); }
  94%  { opacity: 0; transform: scale(1.05); filter: blur(8px); }
  100% { opacity: 0; transform: scale(0.85); filter: blur(8px); }
}
</style>
```

---

## 12. Category Score Grid (Animated)

Five category scores that fill in sequence.

```html
<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-top: 48px;">
  <!-- SEO -->
  <div style="
    text-align: center; padding: 24px 12px;
    background: rgba(139, 92, 246, 0.08); border-radius: 16px;
    opacity: 0;
    animation: list-item-1 var(--video-duration) var(--ease-smooth) infinite;
  ">
    <p style="font-family:'Outfit',sans-serif;font-size:16px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6D28D9;margin-bottom:12px;">SEO</p>
    <p style="font-family:'Instrument Serif',serif;font-size:42px;color:#0F172A;">87</p>
  </div>

  <!-- A11Y -->
  <div style="
    text-align: center; padding: 24px 12px;
    background: rgba(16, 185, 129, 0.08); border-radius: 16px;
    opacity: 0;
    animation: list-item-2 var(--video-duration) var(--ease-smooth) infinite;
  ">
    <p style="font-family:'Outfit',sans-serif;font-size:16px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#047857;margin-bottom:12px;">A11Y</p>
    <p style="font-family:'Instrument Serif',serif;font-size:42px;color:#0F172A;">92</p>
  </div>

  <!-- Security -->
  <div style="
    text-align: center; padding: 24px 12px;
    background: rgba(239, 68, 68, 0.08); border-radius: 16px;
    opacity: 0;
    animation: list-item-3 var(--video-duration) var(--ease-smooth) infinite;
  ">
    <p style="font-family:'Outfit',sans-serif;font-size:16px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#B91C1C;margin-bottom:12px;">Security</p>
    <p style="font-family:'Instrument Serif',serif;font-size:42px;color:#0F172A;">78</p>
  </div>

  <!-- Performance -->
  <div style="
    text-align: center; padding: 24px 12px;
    background: rgba(14, 165, 233, 0.08); border-radius: 16px;
    opacity: 0;
    animation: list-item-4 var(--video-duration) var(--ease-smooth) infinite;
  ">
    <p style="font-family:'Outfit',sans-serif;font-size:16px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#0369A1;margin-bottom:12px;">Perf</p>
    <p style="font-family:'Instrument Serif',serif;font-size:42px;color:#0F172A;">95</p>
  </div>

  <!-- Content -->
  <div style="
    text-align: center; padding: 24px 12px;
    background: rgba(245, 158, 11, 0.08); border-radius: 16px;
    opacity: 0;
    animation: list-item-5 var(--video-duration) var(--ease-smooth) infinite;
  ">
    <p style="font-family:'Outfit',sans-serif;font-size:16px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#B45309;margin-bottom:12px;">Content</p>
    <p style="font-family:'Instrument Serif',serif;font-size:42px;color:#0F172A;">81</p>
  </div>
</div>
```

---

## 13. Before/After Split

Clip-path transition between two states.

```html
<div style="position: relative; width: 100%; height: 600px; margin-top: 40px;">
  <!-- "Before" state (underneath) -->
  <div style="
    position: absolute; inset: 0;
    background: #FEF2F2; border-radius: 20px;
    padding: 48px; display: flex; flex-direction: column; justify-content: center;
  ">
    <p style="font-family:'Outfit',sans-serif;font-size:30px;font-weight:600;color:#B91C1C;text-transform:uppercase;letter-spacing:0.1em;">Before</p>
    <p style="font-family:'Instrument Serif',serif;font-size:96px;color:#EF4444;margin-top:16px;">47</p>
    <p style="font-family:'Outfit',sans-serif;font-size:36px;color:#64748B;margin-top:12px;">Accessibility score</p>
  </div>
  <!-- "After" state (on top, clip-path reveals) -->
  <div style="
    position: absolute; inset: 0;
    background: #ECFDF5; border-radius: 20px;
    padding: 48px; display: flex; flex-direction: column; justify-content: center;
    clip-path: inset(0 100% 0 0);
    animation: split-reveal var(--video-duration) var(--ease-smooth) infinite;
  ">
    <p style="font-family:'Outfit',sans-serif;font-size:30px;font-weight:600;color:#047857;text-transform:uppercase;letter-spacing:0.1em;">After</p>
    <p style="font-family:'Instrument Serif',serif;font-size:96px;color:#10B981;margin-top:16px;">94</p>
    <p style="font-family:'Outfit',sans-serif;font-size:36px;color:#64748B;margin-top:12px;">Accessibility score</p>
  </div>
</div>

<style>
@keyframes split-reveal {
  0%   { clip-path: inset(0 100% 0 0); }  /* fully hidden */
  25%  { clip-path: inset(0 100% 0 0); }  /* wait */
  40%  { clip-path: inset(0 0% 0 0); }    /* fully revealed */
  75%  { clip-path: inset(0 0% 0 0); }    /* hold */
  90%  { clip-path: inset(0 100% 0 0); }  /* hide again */
  100% { clip-path: inset(0 100% 0 0); }  /* matches 0% */
}
</style>
```
