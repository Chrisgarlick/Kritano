---
title: "The Complete Guide to Image Alt Text: What It Is, Why It Matters, and How to Write It"
slug: "complete-guide-image-alt-text"
date: "2026-03-18"
author: "Chris Garlick"
description: "Alt text isn't just an SEO trick — it's how millions of people experience your images. Learn how to write it properly with real examples and common mistakes."
keyword: "image alt text"
category: "accessibility"
tags:
  - "accessibility"
  - "wcag"
  - "seo-basics"
  - "content-strategy"
post_type: "how-to"
reading_time: "7 min read"
featured: false
---

# The Complete Guide to Image Alt Text: What It Is, Why It Matters, and How to Write It

Have you ever hovered over an image on a website and seen a little tooltip that says "IMG_4582.jpg" or just "image"? That's a sign someone skipped their alt text — and it's one of the most common issues I find when auditing websites. It seems like a small thing, but for the millions of people who rely on screen readers to browse the web, bad or missing image alt text means entire chunks of your page simply don't exist.

The good news is that writing proper alt text is one of the easiest things you can do to make your website more accessible — and it happens to help your SEO at the same time. Let me walk you through exactly how to do it.

## What Is Alt Text, Actually?

Alt text — short for "alternative text" — is a written description attached to an image in your website's HTML. It looks like this:

```html
<img src="team-photo.jpg" alt="The Kritano team standing outside the office on a sunny day">
```

That `alt` attribute serves three purposes:

1. **Screen readers read it aloud** — When someone using a screen reader (like VoiceOver on Mac or NVDA on Windows) encounters an image, it reads the alt text instead. Without it, the reader either skips the image entirely or announces the filename, which is useless
2. **It displays when images fail to load** — Slow connection, broken link, images blocked by email clients — the alt text shows up as a fallback so users still understand what was supposed to be there
3. **Search engines use it to understand your images** — Google can't "see" your photos. Alt text is how it knows what an image contains, which affects image search rankings and overall page relevance

## Why It Matters More Than You Think

### For Accessibility

This is the big one. Over 2.2 billion people globally have a vision impairment. In the UK alone, around 2 million people live with sight loss. Many of them use screen readers to navigate the web, and your images are invisible to them without alt text.

WebAIM's 2025 Million report found that **54.5% of all images** across the top million homepages were missing alt text. That's more than half the images on the web effectively hidden from anyone using assistive technology.

Under [WCAG 2.1](/blog/web-accessibility-2026-why-websites-still-failing) — the standard referenced by both UK and EU accessibility regulations — providing text alternatives for non-text content is a **Level A requirement**. That's the lowest, most fundamental level. It's not optional.

### For SEO

Google has been clear that alt text is a ranking signal for image search, and it contributes to the overall context of your page. A product page with properly described images tells Google far more about what you're selling than one with "photo1.jpg" and "photo2.jpg."

However, there are a few things to think about. Alt text isn't a place to stuff keywords. Google is smart enough to spot that, and it actively hurts your accessibility. Writing "best affordable running shoes buy running shoes cheap running shoes" as alt text doesn't help anyone — not the screen reader user, not Google, and not your rankings.

## The Key Decision: Informative vs Decorative

Before writing alt text for any image, you need to answer one question: **does this image convey meaningful information, or is it purely decorative?**

### Informative Images

These are images that add something to the content. They convey information, illustrate a point, or show something the reader needs to see. Product photos, team headshots, charts, screenshots, infographics — all informative. They need descriptive alt text.

### Decorative Images

These are images that exist purely for visual appeal — background patterns, divider lines, generic stock photos of a handshake that add nothing to the content. These should have an **empty alt attribute**:

```html
<img src="decorative-wave.svg" alt="">
```

That empty `alt=""` tells screen readers to skip the image entirely, which is exactly what you want. Without it, the reader will try to announce the image, often reading out the filename — which is distracting and useless.

**The litmus test:** If you removed the image entirely, would the reader miss any information? If not, it's decorative. Mark it with `alt=""` and move on.

## How to Write Good Alt Text (With Examples)

Here's where most guides give you a vague rule and leave you to it. I'd rather show you what good and bad actually look like.

### Product Photos

- **Bad:** `alt="shoe"` — Too vague. Which shoe? What colour? What's distinctive about it?
- **Bad:** `alt="Nike Air Max 90 best running shoe buy now free shipping"` — Keyword stuffing. Useless for accessibility
- **Good:** `alt="Nike Air Max 90 in white and grey, side profile view on a white background"`

Describe what the image shows as if you were telling someone on the phone what they're looking at. Be specific, but don't write an essay — one clear sentence is usually enough.

### Team and People Photos

- **Bad:** `alt="team"` — Who? Doing what?
- **Bad:** `alt="image of people"` — Screen readers already announce it's an image. Don't start with "image of" or "photo of"
- **Good:** `alt="Sarah Johnson, Head of Marketing, speaking at the 2025 company conference"`

Include names and context when they're relevant. If it's a generic stock photo of office workers and their identities don't matter to the content, keep it brief: `alt="Two colleagues reviewing a document at a desk"`.

### Charts and Graphs

This is where alt text gets tricky, because a chart contains data that can't easily be captured in a short sentence.

- **Bad:** `alt="chart"` — Tells the user nothing
- **Bad:** `alt="Graph showing data"` — Which data?
- **Good:** `alt="Bar chart showing website traffic growth from 12,000 monthly visitors in January to 34,000 in June 2025"`

For simple charts, summarise the key takeaway — what should the reader learn from this image? For complex data visualisations, write a brief alt text summarising the main insight and provide a longer description in the surrounding text or a linked data table.

### Screenshots

- **Bad:** `alt="screenshot"` — Of what?
- **Good:** `alt="Google PageSpeed Insights results showing a performance score of 42 on mobile with LCP flagged as poor at 4.8 seconds"`

Describe what the screenshot shows that's relevant to your content. You don't need to describe every pixel — focus on what the reader needs to understand.

### Infographics

Infographics are the hardest to handle well because they often contain a lot of information.

- **Bad:** `alt="infographic about web accessibility"` — This tells a screen reader user almost nothing about the actual content
- **Good:** `alt="Infographic: 5 most common accessibility issues — low contrast text (81%), missing alt text (55%), empty links (49%), missing form labels (46%), missing document language (19%)"` — with a full text version provided below or linked

For information-dense images, the best approach is a brief alt text summarising the topic plus a full text alternative elsewhere on the page. WCAG actually has a specific technique for this — providing a `longdesc` attribute or a link to a detailed description.

## Common Mistakes I See on Every Audit

I've audited hundreds of websites, and these mistakes come up again and again:

### 1. Starting With "Image of" or "Photo of"

Screen readers already announce that something is an image before reading the alt text. So `alt="Image of a red bicycle"` gets read as "Image. Image of a red bicycle." It's redundant. Just write `alt="Red bicycle parked against a brick wall"`.

The one exception: `alt="Painting of..."` or `alt="Illustration of..."` — where the medium itself is relevant information.

### 2. Using the Filename

`alt="IMG_4582.jpg"` or `alt="hero-banner-v3-final-FINAL.png"` — I see this constantly. It usually means the CMS auto-populated the alt field with the filename and nobody went back to fix it. If you're using WordPress, plugins like Yoast SEO will flag images without proper alt text.

### 3. Leaving Alt Text Completely Empty on Informative Images

There's a difference between `alt=""` (intentionally empty for decorative images) and no `alt` attribute at all. The first is correct for decoration. The second causes screen readers to read the image URL — which sounds like "/wp-content/uploads/2025/03/hero-banner-dark-blue-v2.jpg" spoken aloud. Awful.

### 4. Making It Too Long

Alt text should be concise — ideally under 125 characters. Screen readers don't pause for breath in the middle of alt text, so a 300-word paragraph gets read as one continuous stream. If you need to convey that much information, use the surrounding page content instead.

### 5. Keyword Stuffing

I've seen alt text like "web design Newcastle web designer North East website development affordable web design." This doesn't help anyone. Google knows what you're doing, and screen reader users have to sit through it. Write for humans first. If your target keyword fits naturally, great. If it doesn't, don't force it.

### 6. Using the Same Alt Text for Every Image

When every product photo on your e-commerce site has `alt="product image"`, you've made it impossible for a screen reader user to distinguish between them. Each image needs its own unique description.

## A Quick Checklist

Before you publish any page, run through this:

- [ ] Every informative image has descriptive, specific alt text
- [ ] Decorative images have `alt=""` (empty, not missing)
- [ ] No alt text starts with "image of" or "photo of"
- [ ] Alt text is under 125 characters where possible
- [ ] Keywords appear naturally, not stuffed
- [ ] Charts and infographics have a text alternative for the data
- [ ] No images are using filenames as alt text

## Tools That Help

- **[Lighthouse](/blog/core-web-vitals-plain-english-guide) / Chrome DevTools** — Flags images with missing alt text in the accessibility audit
- **axe DevTools** (browser extension) — Catches missing and potentially poor alt text
- **WAVE** (by WebAIM) — Visual overlay that highlights every image and shows its alt text inline — brilliant for a quick visual scan
- **WordPress plugins** — Yoast SEO, WP Accessibility, and All in One SEO all flag missing alt text during editing

## Wrapping Up

Writing good image alt text isn't difficult — it just requires a small habit change. Every time you add an image to your site, take ten seconds to describe what it shows. That's genuinely all it takes to make your content accessible to millions more people and give Google a clearer picture of what your page is about.

In my honest opinion, alt text is the single highest-impact accessibility fix most websites can make. It's quick, it's free, and the WebAIM data tells us that over half the web still isn't doing it. That's a problem, but it also means you've got a real opportunity to do better than most.

If you're not sure how your website's images stack up, get in touch for an accessibility audit. I'll flag every missing or poorly written alt text across your site and help you prioritise what to fix first.

<!-- Internal linking suggestions:
- Link "accessibility audit" to the Kritano audit/pricing page
- Link "WCAG 2.1" to the web accessibility 2026 blog post
- Link "WebAIM's 2025 Million report" to the accessibility state of the web post
- Link "Lighthouse" or "Core Web Vitals" to the CWV explainer post
- Link "screen readers" to an assistive technology explainer if one exists
-->
