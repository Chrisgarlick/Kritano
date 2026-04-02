---
title: "Image Optimisation: The Single Biggest Performance Win for Most Websites"
slug: "image-optimisation-biggest-performance-win"
date: "2026-03-18"
author: "Chris Garlick"
description: "Unoptimised images are the #1 performance issue on 83% of websites. Here's how to fix them with modern formats, compression, lazy loading, and responsive images."
keyword: "image optimisation"
category: "performance"
tags:
  - "performance-optimisation"
  - "page-speed"
  - "core-web-vitals"
  - "website-audit"
post_type: "how-to"
reading_time: "7 min read"
featured: false
---

# Image Optimisation: The Single Biggest Performance Win for Most Websites

Have you ever wondered why your website takes so long to load, even though there's "not that much on it"? Nine times out of ten, when I dig into the data, the answer is the same: images. Massive, uncompressed, incorrectly sized images that are silently dragging your entire site down.

From our Kritano audits, unoptimised images show up on **83% of websites** — making them the single most common performance issue by a significant margin. And the fix is usually straightforward, doesn't cost anything, and can cut your page load time in half. If you're only going to do one thing to speed up your website, this is the one.

## Why Images Are the #1 Performance Bottleneck

The average web page in 2026 is over 2.5MB in size. Images typically account for **50-70% of that total**. To put that in perspective, a single unoptimised photograph straight from a camera or stock library can be 3-5MB on its own — larger than many entire web pages should be.

This matters for three reasons:

- **Larger files take longer to download.** Every extra megabyte adds seconds to your load time, and those seconds compound when you've got multiple large images on a page
- **Mobile users are hit hardest.** Someone on a 4G connection in a rural area isn't downloading your 5MB hero image as fast as your office broadband suggests. And mobile is where the majority of your traffic comes from
- **Google is watching.** Page load speed directly affects your [Core Web Vitals](/blog/core-web-vitals-plain-english-guide) scores, which directly affect your [search rankings](/blog/why-accessible-websites-rank-higher). Your Largest Contentful Paint (LCP) metric — the time it takes for the biggest visible element to appear — is almost always an image. If that image is 4MB, your LCP is going to suffer

## Modern Image Formats

The format you save your images in matters more than most people realise. Here's what you should actually be using in 2026:

**JPEG** — The classic. Still perfectly fine for photographs. Supports lossy compression, which means you can reduce file size by sacrificing a tiny bit of quality that nobody will notice.

**PNG** — Best for graphics with transparency, screenshots, or images with text. Significantly larger than JPEG for photographs, so don't use it for product photos or team pictures.

**WebP** — This should be your default format for most images. Developed by Google, WebP files are **25-35% smaller** than equivalent JPEGs with no visible quality loss. Every modern browser supports it. If you're still serving JPEGs for everything, switching to WebP is one of the quickest wins available to you.

**AVIF** — The newest contender. Even smaller than WebP — up to **50% smaller than JPEG** — with excellent quality. Browser support has grown rapidly and it's now usable in production, though I'd recommend serving it with WebP as a fallback for the remaining edge cases.

**SVG** — For icons, logos, and simple vector graphics. Infinitely scalable, tiny file sizes, and they look crisp at any resolution. If your logo is a 200KB PNG, it should probably be an SVG.

**My recommendation:** Serve WebP as your primary format, with AVIF for browsers that support it and JPEG as a fallback. Most image processing tools and CDNs can handle this automatically.

## Compression: The Numbers Are Staggering

This is where the real savings happen. Compression reduces file size either by removing image data you can't see (lossy) or by optimising how the data is stored (lossless).

### Lossy Compression

At 80-85% quality, the difference between a compressed and uncompressed photograph is virtually imperceptible to the human eye. But the file size difference is enormous:

| Version | File Size | Reduction |
|---------|-----------|-----------|
| Original JPEG | 2.4MB | — |
| 85% quality | 420KB | 82% smaller |
| 80% quality | 310KB | 87% smaller |

That's the same image, visually identical to most people, at a fraction of the file size. Multiply that across every image on your site and you're looking at seconds off your load time.

### Lossless Compression

Lossless compression reduces file size without removing any data at all — it just stores it more efficiently. Savings are typically 10-30%, which is smaller than lossy but still meaningful, especially for graphics and screenshots where precision matters.

**The practical approach:** Use lossy compression at 80-85% quality for photographs, product images, and hero banners. Use lossless for screenshots, diagrams, and images where text or fine detail needs to stay sharp.

### Tools That Do the Work for You

- **TinyPNG** (tinypng.com) — Drag and drop compression for PNG and JPEG. Free for up to 20 images at a time. Dead simple
- **Squoosh** (squoosh.app) — Google's open-source image compression tool. Lets you compare formats and quality settings side by side in the browser. Brilliant for understanding the trade-offs
- **ShortPixel** — WordPress plugin that compresses images automatically on upload and can bulk-optimise your existing library. This is what I'd recommend if you're on WordPress and want a set-it-and-forget-it solution
- **Imagify** — Another solid WordPress option with a generous free tier

## Lazy Loading

Here's a quick win that takes about two seconds to understand and five minutes to implement. Lazy loading tells the browser: don't load images that aren't currently visible on screen. Only load them when the user scrolls down to them.

Without lazy loading, your browser downloads every single image on the page when it first loads — including the ones buried at the bottom that nobody's going to see for another thirty seconds of scrolling. That's wasted bandwidth and wasted time.

**Implementation is a single HTML attribute:**

```html
<img src="photo.webp" alt="Description" loading="lazy">
```

That's it. Add `loading="lazy"` to your image tags and the browser handles the rest. On pages with lots of images — product listings, galleries, blog archives — this can dramatically reduce initial load time.

**When NOT to lazy load:**

- **Your hero image** or any image visible when the page first loads (above the fold). You want these to load immediately — lazy loading them would actually make the perceived load time worse
- **Images critical to the page's core content.** If it's the first thing a user needs to see, load it eagerly
- **Very small images** like icons or thumbnails. The overhead of lazy loading isn't worth it for a 2KB icon

If you're on WordPress, most modern themes support lazy loading natively, and WordPress itself has added native lazy loading since version 5.5.

## Responsive Images

This is the one that catches a lot of people out. You upload a beautiful 2000px-wide photograph for your desktop layout — and then that exact same 2000px file gets served to a phone with a 400px-wide screen. The user downloads five times more data than they need, and the browser has to resize it on the fly, wasting processing power.

Responsive images solve this by serving appropriately sized versions based on the device:

```html
<img
  srcset="photo-400.webp 400w, photo-800.webp 800w, photo-1200.webp 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  src="photo-800.webp"
  alt="Description"
  loading="lazy"
>
```

The browser looks at the device's screen width, picks the most appropriate image from the `srcset`, and only downloads that one. A phone gets the 400px version. A tablet gets 800px. A desktop gets the full 1200px. Same visual result, massively different download sizes.

**The honest take:** Generating multiple sizes of every image takes effort. If you're doing it manually, it's tedious. But most CMSs and image CDNs handle this automatically. WordPress generates multiple sizes on upload. Services like Cloudinary, imgix, and Bunny Optimizer can serve responsive images from a single upload with no extra work on your end.

## One Image, All Four Techniques

Here's what a fully optimised image tag looks like when you combine everything — modern format, compression, lazy loading, and responsive sizing:

```html
<img
  srcset="photo-400.webp 400w, photo-800.webp 800w, photo-1200.webp 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  src="photo-800.webp"
  alt="Product designer reviewing wireframes on a tablet"
  width="1200"
  height="800"
  loading="lazy"
>
```

Notice the `width` and `height` attributes — these tell the browser how much space to reserve before the image loads, preventing layout shift (CLS). Without them, the page content jumps around as images pop in, which is frustrating for users and penalised by Google.

## The Impact: A Real Before and After

Here's what image optimisation typically looks like in practice, based on what we see in Kritano audits:

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Page size | 4.2MB | 890KB | 79% smaller |
| Load time | 8.1 seconds | 2.3 seconds | 72% faster |
| Performance score | 38/100 | 76/100 | +38 points |

Same images. Same visual quality. Same content. The only difference is format, compression, lazy loading, and responsive sizing. That's a performance score nearly doubling from work that doesn't require any design changes, any new content, or any structural changes to the site.

## Wrapping Up

Image optimisation isn't glamorous. It's not a redesign, it's not a new feature, and nobody's going to look at your website and say "wow, those images are really well compressed." But it's the single most impactful thing most websites can do to improve their performance — and by extension, their search rankings, their user experience, and their conversion rates.

In my honest opinion, if your website is slow and you haven't optimised your images yet, stop everything else and do this first. It's the highest return on time you'll get.

If you want to see exactly which images on your site need attention, run an audit on Kritano. The performance report flags unoptimised images, missing lazy loading, and opportunities for format improvements — so you know precisely where to start.

<!-- Internal linking suggestions:
- Link "Core Web Vitals" or "LCP" to the CWV plain-English guide
- Link "alt text" or alt attribute in code examples to the complete guide to image alt text post
- Link "search rankings" to the accessibility and SEO data post
- Link "performance score" to the website launch checklist post
- Link "Kritano audit" to the main product/pricing page
-->
