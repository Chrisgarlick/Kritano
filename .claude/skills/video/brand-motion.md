# PagePulser Brand Motion — Video Asset Reference

This file defines the motion rules for all `/video` outputs. Every generated animation must feel like a natural extension of the PagePulser brand — smooth, confident, unhurried.

## Motion Philosophy

PagePulser motion is:
- **Smooth**: No jarring cuts or snappy transitions. Everything eases in and out gracefully.
- **Confident**: Elements move with purpose. No bouncing or wobbling unless intentional emphasis.
- **Unhurried**: Content holds long enough to read. The viewer should never feel rushed.
- **Atmospheric**: Background elements drift constantly, giving the feeling of a living, breathing design.

## Timing Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--duration-instant` | 100ms | Micro-interactions (not common in video) |
| `--duration-fast` | 200ms | Quick secondary reveals |
| `--duration-normal` | 300ms | Standard element transitions |
| `--duration-slow` | 500ms | Emphasis transitions, important elements |
| `--duration-dramatic` | 1000ms | Hero element entrances |
| `--duration-content` | 1500ms | Full content block reveals |
| `--duration-hold-short` | 3s | Minimum readable hold for short text |
| `--duration-hold-long` | 6s | Hold for longer text or data |
| `--duration-scene` | 8–12s | Full scene (enter + hold + exit) |

## Easing Functions

| Name | CSS Value | Feel | Use |
|------|-----------|------|-----|
| **Smooth** | `cubic-bezier(0.4, 0, 0.2, 1)` | Natural, default | Most transitions |
| **Bounce** | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful overshoot | Stat numbers, emphasis moments |
| **Sharp-out** | `cubic-bezier(0, 0, 0.2, 1)` | Quick start, slow stop | Content entering view |
| **Gentle-in** | `cubic-bezier(0.4, 0, 1, 1)` | Slow start, fast end | Content exiting view |
| **Linear** | `linear` | Constant speed | Background colour shifts, progress bars |

### When to use each

- **Enter** animations: Use `--ease-out` (sharp-out) — elements arrive quickly and settle
- **Exit** animations: Use `--ease-gentle-in` — elements leave slowly then accelerate away
- **Hold** animations (pulse, float): Use `--ease-smooth` — gentle and symmetrical
- **Ambient** animations (drift, breathe): Use `ease-in-out` — smooth reversal at endpoints

## Stagger System

Content elements enter sequentially, not simultaneously. Use `animation-delay` with consistent intervals.

### Base stagger intervals

| Context | Interval | Example |
|---------|----------|---------|
| List items | 300ms | 5 items = 0s, 0.3s, 0.6s, 0.9s, 1.2s |
| Cards | 400ms | 3 cards = 0s, 0.4s, 0.8s |
| Text blocks | 500ms | Title → subtitle → body = 0s, 0.5s, 1.0s |
| Data points | 200ms | Fast cascade for numbers |
| Scenes | 8–12s | Each scene gets a full lifecycle |

### CSS Pattern

```css
.stagger-1 { animation-delay: calc(var(--base-delay) + 0.0s); }
.stagger-2 { animation-delay: calc(var(--base-delay) + 0.3s); }
.stagger-3 { animation-delay: calc(var(--base-delay) + 0.6s); }
.stagger-4 { animation-delay: calc(var(--base-delay) + 0.9s); }
.stagger-5 { animation-delay: calc(var(--base-delay) + 1.2s); }
```

Where `--base-delay` positions the group within the overall video timeline.

## Signature Animations

### 1. Pulse-Glow
Subtle indigo glow that breathes — used on score rings, key numbers, active elements.

```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
  50%      { box-shadow: 0 0 30px 10px rgba(79, 70, 229, 0.15); }
}
```
Duration: 3–4s | Easing: ease-in-out | Iteration: infinite

### 2. Heartbeat
Quick double-pulse to draw attention — used sparingly on CTAs or key moments.

```css
@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  14%      { transform: scale(1.05); }
  28%      { transform: scale(1); }
  42%      { transform: scale(1.08); }
  56%      { transform: scale(1); }
}
```
Duration: 2s | Easing: ease-in-out | Iteration: 2–3 times (not infinite)

### 3. Reveal-Up
Primary entrance animation — content slides up from below with fade.

```css
@keyframes reveal-up {
  0%   { opacity: 0; transform: translateY(40px); }
  100% { opacity: 1; transform: translateY(0); }
}
```
Duration: 800ms–1200ms | Easing: sharp-out | Iteration: 1

### 4. Reveal-Down (exit)
Content slides up and fades out — reverse of entrance direction for natural flow.

```css
@keyframes reveal-down-exit {
  0%   { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-30px); }
}
```
Duration: 600ms–1000ms | Easing: gentle-in | Iteration: 1

### 5. Scale-In
Element scales from small to full size with fade — good for stat numbers.

```css
@keyframes scale-in {
  0%   { opacity: 0; transform: scale(0.7); }
  100% { opacity: 1; transform: scale(1); }
}
```
Duration: 600ms–1000ms | Easing: bounce | Iteration: 1

### 6. Score-Ring-Fill
SVG stroke-dashoffset animates from empty to target score.

```css
@keyframes ring-fill {
  0%   { stroke-dashoffset: 553; } /* full circumference = empty */
  100% { stroke-dashoffset: 44; }  /* target offset = filled to score */
}
```
Duration: 1500ms–2000ms | Easing: sharp-out | Iteration: 1

### 7. Float
Gentle vertical drift for elements during their hold phase — adds life without distraction.

```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}
```
Duration: 4–6s | Easing: ease-in-out | Iteration: infinite

### 8. Shimmer
Subtle highlight sweep across text or cards — premium feel.

```css
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
/* Apply to element with: */
/* background: linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%); */
/* background-size: 200% 100%; */
```
Duration: 3s | Easing: linear | Iteration: infinite

## Atmospheric Animation Patterns

These run infinitely and independently of content animations.

### Gradient Circle Drift

```css
/* Circle 1 — Indigo, top-left */
@keyframes drift-indigo {
  0%   { transform: translate(0, 0) scale(1); opacity: 0.15; }
  50%  { transform: translate(80px, 120px) scale(1.2); opacity: 0.2; }
  100% { transform: translate(0, 0) scale(1); opacity: 0.15; }
}

/* Circle 2 — Amber, bottom-right */
@keyframes drift-amber {
  0%   { transform: translate(0, 0) scale(1); opacity: 0.1; }
  50%  { transform: translate(-60px, -80px) scale(1.15); opacity: 0.12; }
  100% { transform: translate(0, 0) scale(1); opacity: 0.1; }
}
```
- Indigo circle: 8s, ease-in-out, infinite
- Amber circle: 10s, ease-in-out, infinite
- Use `animation-direction: alternate` OR write full 0%→100% that returns to start

### Grid Breathe (dark backgrounds only)

```css
@keyframes grid-breathe {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 0.7; }
}
```
Duration: 6s | Easing: ease-in-out | Iteration: infinite

### Background Gradient Shift

```css
@keyframes bg-shift {
  0%   { background-position: 0% 0%; }
  50%  { background-position: 100% 100%; }
  100% { background-position: 0% 0%; }
}
/* Apply to canvas with background-size: 200% 200% */
```
Duration: 12s | Easing: linear | Iteration: infinite

## Content Lifecycle Pattern

The master pattern for any content element in a looping video. This single animation handles enter, hold, and exit.

```css
/* For a 36s video: */
@keyframes content-lifecycle {
  0%   { opacity: 0; transform: translateY(30px); }     /* hidden — matches 100% */
  8%   { opacity: 1; transform: translateY(0); }         /* enter (~2.9s) */
  78%  { opacity: 1; transform: translateY(0); }         /* hold */
  92%  { opacity: 0; transform: translateY(-20px); }     /* exit (~33.1s) */
  100% { opacity: 0; transform: translateY(30px); }      /* return to start */
}

.element {
  animation: content-lifecycle var(--video-duration) var(--ease-smooth) infinite;
  animation-fill-mode: both;
}
```

### Adjusting for staggered elements

Each element gets a different slice of the timeline. Adjust the keyframe percentages:

- **Title** (enters first): 0%→8% enter, hold to 78%, exit 78%→92%, rest 92%→100%
- **Subtitle** (enters second): 5%→13% enter, hold to 75%, exit 75%→88%, rest 88%→100%
- **Body** (enters third): 10%→18% enter, hold to 72%, exit 72%→85%, rest 85%→100%

Each element needs its OWN `@keyframes` rule with adjusted percentages — they share the same `animation-duration` (the full video length) but have shifted enter/exit windows.

## Colour Palette (Quick Reference)

Same as `/draw` — see `brand-style.md` in the draw skill for the full palette. Key values:

- **Primary brand**: `#4F46E5` (indigo-600)
- **Dark background**: `linear-gradient(180deg, #1E1B4B, #0F172A)`
- **Light background**: `#F8FAFC` (slate-50)
- **Accent**: `#FBBF24` (amber-400)
- **Text on light**: `#0F172A` (slate-900)
- **Text on dark**: `#FFFFFF`
- **Secondary text light**: `#475569` (slate-600)
- **Secondary text dark**: `#CBD5E1` (slate-300)
- **Wordmark**: `#64748B` (slate-500) on any background

## Do's

- Use smooth, confident easing — no linear content transitions
- Hold text long enough to read (minimum 3s for short, 6s for long)
- Keep atmospheric elements moving at all times
- Ensure 0% and 100% keyframes are identical for all looping animations
- Test that the loop point feels natural
- Use stagger delays for sequential content
- Keep motion subtle during hold phases (gentle float, pulse-glow)

## Don'ts

- Don't use JavaScript for animation — CSS only
- Don't use `animation-direction: alternate` on content lifecycle (it reverses the order)
- Don't make elements move so fast they're hard to track
- Don't have more than 3 elements animating entrance simultaneously
- Don't use rotation > 5° for content elements (atmospheric elements can rotate more)
- Don't use colours outside the brand palette
- Don't skip the hold phase — content needs reading time
- Don't use `animation-iteration-count: infinite` on content lifecycle unless using the full lifecycle keyframe pattern (which self-loops)
