# Reusable Templates & Snippets

Code snippets for common visual patterns. Use these as building blocks — adapt sizes, colours, and positions to fit each design.

## Score Ring (inline SVG)

A circular progress indicator matching the app's `ProgressRing` component.

### Large (200px)
```html
<svg width="200" height="200" viewBox="0 0 200 200" style="display:block;">
  <!-- Track -->
  <circle cx="100" cy="100" r="88" fill="none" stroke="#E2E8F0" stroke-width="8"/>
  <!-- Progress (92/100 = dashoffset 44) -->
  <circle cx="100" cy="100" r="88" fill="none" stroke="#10B981" stroke-width="8"
    stroke-linecap="round"
    stroke-dasharray="553"
    stroke-dashoffset="44"
    transform="rotate(-90 100 100)"/>
  <!-- Score number -->
  <text x="100" y="115" text-anchor="middle"
    font-family="'Instrument Serif', Georgia, serif"
    font-size="64" fill="#0F172A">92</text>
</svg>
```

**Calculating stroke-dashoffset:**
- `circumference = 2 × π × radius` (for r=88: ~553)
- `offset = circumference × (1 - score/100)`

### Small (80px)
```html
<svg width="80" height="80" viewBox="0 0 80 80" style="display:block;">
  <circle cx="40" cy="40" r="34" fill="none" stroke="#E2E8F0" stroke-width="4"/>
  <circle cx="40" cy="40" r="34" fill="none" stroke="#4F46E5" stroke-width="4"
    stroke-linecap="round"
    stroke-dasharray="214"
    stroke-dashoffset="21"
    transform="rotate(-90 40 40)"/>
  <text x="40" y="47" text-anchor="middle"
    font-family="'Instrument Serif', Georgia, serif"
    font-size="24" fill="#0F172A">92</text>
</svg>
```

## Atmospheric Backgrounds

### Light Background with Accents
```html
<div class="container" style="background:#F8FAFC;">
  <!-- Indigo accent — top right -->
  <div style="position:absolute;top:-80px;right:-80px;width:450px;height:450px;background:#EEF2FF;border-radius:50%;opacity:0.6;filter:blur(80px);pointer-events:none;"></div>
  <!-- Amber accent — bottom left -->
  <div style="position:absolute;bottom:-60px;left:-60px;width:350px;height:350px;background:#FFFBEB;border-radius:50%;opacity:0.6;filter:blur(80px);pointer-events:none;"></div>
  <!-- Content (relative to sit above atmospheric elements) -->
  <div style="position:relative;z-index:1;padding:100px;">
    <!-- ... -->
  </div>
</div>
```

### Dark Background with Grid
```html
<div class="container" style="background:linear-gradient(180deg, #1E1B4B 0%, #0F172A 100%);">
  <!-- Grid overlay -->
  <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;"></div>
  <!-- Indigo glow — top right -->
  <div style="position:absolute;top:-100px;right:-100px;width:500px;height:500px;background:rgba(99,102,241,0.15);border-radius:50%;filter:blur(100px);pointer-events:none;"></div>
  <!-- Content -->
  <div style="position:relative;z-index:1;padding:100px;">
    <!-- ... -->
  </div>
</div>
```

### Brand Background (indigo)
```html
<div class="container" style="background:linear-gradient(135deg, #4F46E5 0%, #312E81 100%);">
  <!-- Grid overlay -->
  <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;"></div>
  <!-- Light glow -->
  <div style="position:absolute;top:0;right:0;width:500px;height:500px;background:rgba(99,102,241,0.3);border-radius:50%;filter:blur(120px);pointer-events:none;"></div>
  <!-- Content -->
  <div style="position:relative;z-index:1;padding:100px;">
    <!-- ... -->
  </div>
</div>
```

## Typography Patterns

### Section Label
```html
<p style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:600;color:#4F46E5;text-transform:uppercase;letter-spacing:0.1em;">
  Label Text
</p>
```

### Hero Headline
```html
<h1 style="font-family:'Instrument Serif',Georgia,serif;font-size:88px;font-weight:400;color:#0F172A;line-height:1.08;margin-top:20px;">
  Headline text here.
</h1>
```

### Hero Headline (on dark)
```html
<h1 style="font-family:'Instrument Serif',Georgia,serif;font-size:88px;font-weight:400;color:#FFFFFF;line-height:1.08;margin-top:20px;">
  Headline text here.
</h1>
```

### Body Text
```html
<p style="font-family:'Outfit',sans-serif;font-size:32px;font-weight:400;color:#64748B;line-height:1.5;margin-top:24px;max-width:700px;">
  Supporting description text goes here.
</p>
```

### Large Stat Number
```html
<p style="font-family:'Instrument Serif',Georgia,serif;font-size:180px;font-weight:400;color:#0F172A;line-height:1;">
  47%
</p>
```

### Mono Data Label
```html
<span style="font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:400;color:#64748B;">
  example.com
</span>
```

## Card Patterns

### White Card
```html
<div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,0.1);padding:48px;">
  <!-- Card content -->
</div>
```

### Card with Header Bar
```html
<div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,0.1);overflow:hidden;">
  <!-- Header -->
  <div style="padding:20px 32px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="width:8px;height:8px;border-radius:50%;background:#10B981;"></span>
      <span style="font-family:'Outfit',sans-serif;font-size:14px;font-weight:500;color:#64748B;text-transform:uppercase;letter-spacing:0.05em;">Audit Complete</span>
    </div>
    <span style="font-family:'JetBrains Mono',monospace;font-size:14px;color:#64748B;">example.com</span>
  </div>
  <!-- Body -->
  <div style="padding:32px;">
    <!-- Content -->
  </div>
</div>
```

### Status Footer Bar
```html
<div style="padding:16px 32px;background:#F8FAFC;border-top:1px solid #F1F5F9;display:flex;align-items:center;gap:24px;">
  <span style="display:flex;align-items:center;gap:8px;font-family:'Outfit',sans-serif;font-size:16px;color:#64748B;">
    <span style="width:8px;height:8px;border-radius:50%;background:#EF4444;display:inline-block;"></span> 3 Critical
  </span>
  <span style="display:flex;align-items:center;gap:8px;font-family:'Outfit',sans-serif;font-size:16px;color:#64748B;">
    <span style="width:8px;height:8px;border-radius:50%;background:#F97316;display:inline-block;"></span> 7 Serious
  </span>
  <span style="display:flex;align-items:center;gap:8px;font-family:'Outfit',sans-serif;font-size:16px;color:#64748B;">
    <span style="width:8px;height:8px;border-radius:50%;background:#F59E0B;display:inline-block;"></span> 12 Moderate
  </span>
</div>
```

## Category Score Grid

A row of coloured score badges matching the homepage hero:

```html
<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;">
  <!-- SEO -->
  <div style="background:#F5F3FF;border-radius:16px;padding:20px;display:flex;flex-direction:column;align-items:center;">
    <span style="font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6D28D9;margin-bottom:12px;">SEO</span>
    <!-- Insert small score ring SVG here -->
  </div>
  <!-- Accessibility -->
  <div style="background:#ECFDF5;border-radius:16px;padding:20px;display:flex;flex-direction:column;align-items:center;">
    <span style="font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#047857;margin-bottom:12px;">A11Y</span>
  </div>
  <!-- Security -->
  <div style="background:#FEF2F2;border-radius:16px;padding:20px;display:flex;flex-direction:column;align-items:center;">
    <span style="font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#B91C1C;margin-bottom:12px;">Security</span>
  </div>
  <!-- Performance -->
  <div style="background:#F0F9FF;border-radius:16px;padding:20px;display:flex;flex-direction:column;align-items:center;">
    <span style="font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#0369A1;margin-bottom:12px;">Perf</span>
  </div>
  <!-- Content -->
  <div style="background:#FFFBEB;border-radius:16px;padding:20px;display:flex;flex-direction:column;align-items:center;">
    <span style="font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#B45309;margin-bottom:12px;">Content</span>
  </div>
</div>
```

## Decorative Horizontal Rule

```html
<div style="display:flex;align-items:center;gap:16px;margin:32px 0;">
  <div style="flex:1;height:1px;background:#E2E8F0;"></div>
  <div style="width:8px;height:8px;border-radius:50%;background:#4F46E5;opacity:0.3;"></div>
  <div style="flex:1;height:1px;background:#E2E8F0;"></div>
</div>
```

## PagePulser Wordmark

When branding is appropriate:

```html
<span style="font-family:'Instrument Serif',Georgia,serif;font-size:32px;color:#4F46E5;">
  PagePulser
</span>
```

On dark backgrounds:
```html
<span style="font-family:'Instrument Serif',Georgia,serif;font-size:32px;color:#FFFFFF;">
  PagePulser
</span>
```
