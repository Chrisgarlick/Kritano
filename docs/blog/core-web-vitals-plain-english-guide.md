---
title: "What Google Actually Looks At: A Plain-English Guide to Core Web Vitals"
slug: "core-web-vitals-plain-english-guide"
date: "2026-03-18"
author: "Chris Garlick"
description: "Core Web Vitals sound technical, but they're not. Here's what LCP, INP, and CLS actually mean, why Google cares, and how to check yours for free."
keyword: "core web vitals"
category: "performance"
tags:
  - "core-web-vitals"
  - "page-speed"
  - "performance-optimisation"
  - "seo-basics"
post_type: "explainer"
reading_time: "6 min read"
featured: false
---

# What Google Actually Looks At: A Plain-English Guide to Core Web Vitals

Have you ever been told your website needs to "improve its Core Web Vitals" and thought — what on earth does that actually mean? You're not alone. It's one of those phrases that gets thrown around in web development as if everyone should already know it, but most business owners I speak to have either never heard of it or have a vague sense that it's "something to do with speed."

Core Web Vitals are three specific measurements that Google uses to judge how your website *feels* to use. Not how it looks. Not what it says. How it actually performs when a real person tries to use it. And yes, they directly affect where you show up in search results.

I'll break down each one in plain English — no jargon, no fluff — and show you exactly how to check yours today.

## The Three Metrics (And What They Actually Mean)

Google boils website experience down to three questions:

1. **How fast does the main content appear?**
2. **How quickly does the page respond when you interact with it?**
3. **Does the page jump around while it's loading?**

Each of those questions maps to a metric with an intimidating acronym. Let's demystify them.

### LCP — Largest Contentful Paint

**In plain English:** How long does it take before the biggest visible thing on your page actually shows up?

When someone lands on your homepage, there's usually a hero image, a large headline, or a product photo that dominates the screen. LCP measures how long a visitor stares at a blank or half-loaded page before that main element appears.

**What Google wants:** Under **2.5 seconds**. Anything over 4 seconds is considered poor.

**Why it matters for rankings:** Google's logic is straightforward — if people have to wait too long to see your content, they leave. A slow LCP means higher bounce rates, which signals to Google that your page isn't delivering a good experience. Pages with poor LCP scores get pushed down in favour of faster competitors.

**Common causes of poor LCP scores:**

- **Uncompressed images** — This is the number one culprit I see. A 3MB hero image that could be 200KB with proper compression. Tools like TinyPNG or ShortPixel handle this in seconds
- **Slow server response** — If your hosting takes too long to respond, everything else is delayed. Cheap shared hosting is often the bottleneck here
- **Render-blocking CSS and JavaScript** — Your browser has to download and process these files before it can show anything. If you've got heavy stylesheets or scripts loading in the head of your page, they're holding everything up
- **No image lazy loading** — Loading every image on the page at once, even the ones nobody can see yet, slows down the bits people are actually waiting for

### INP — Interaction to Next Paint

**In plain English:** When someone taps a button or clicks a link, how long before the page actually responds?

INP replaced the old First Input Delay (FID) metric in March 2024, and it's a much better measure of real-world responsiveness. It doesn't just measure the first click — it tracks every interaction throughout the visit and reports the worst one.

Think of it like this: you tap "Add to basket" and nothing happens for a full second. That hesitation — that moment of "did it work?" — is exactly what INP measures.

**What Google wants:** Under **200 milliseconds**. Over 500ms is poor.

**Why it matters for rankings:** A sluggish site feels broken. Users lose confidence. If clicking a button on your site feels laggy while your competitor's site responds instantly, Google knows which one delivers a better experience. INP is particularly important for e-commerce sites, forms, and anything interactive.

**Common causes of poor INP scores:**

- **Heavy JavaScript** — The biggest offender by far. If your browser is busy executing a massive JavaScript bundle, it can't respond to clicks until it's finished. Third-party scripts (analytics, chat widgets, social embeds) pile up quickly
- **Too many event listeners** — Every interactive element on your page has code listening for clicks, hovers, and scrolls. If those handlers are doing complex work, they block the response
- **Main thread congestion** — Your browser only has one main thread. If it's occupied parsing a large script, your button click has to wait in the queue. It's like trying to get served at a bar with one bartender and thirty people waiting
- **Unoptimised third-party scripts** — That live chat widget, those social sharing buttons, the cookie consent banner — each one adds JavaScript that competes for your browser's attention

### CLS — Cumulative Layout Shift

**In plain English:** Does the page jump around while you're trying to use it?

You know when you're about to tap a link on your phone and suddenly an advert loads above it, pushes everything down, and you tap the wrong thing? That's layout shift. CLS measures how much the visible content moves around unexpectedly during the entire time you're on the page.

It's the metric that measures frustration — and it's the one most people notice without knowing the technical term for it.

**What Google wants:** A score under **0.1**. Over 0.25 is poor.

**Why it matters for rankings:** Layout shift is a trust killer. If your page is visually unstable, users feel like they can't control it. Google treats this as a strong negative signal because it directly degrades the experience, especially on mobile where screen space is limited and mis-taps are common.

**Common causes of poor CLS scores:**

- **Images without dimensions** — If your HTML doesn't specify width and height for images, the browser doesn't know how much space to reserve. When the image loads, everything shifts to make room
- **Ads and banners injected late** — Any content that gets inserted into the page after the initial load pushes existing content around. Cookie banners, promotional bars, and ad units are common offenders
- **Web fonts loading late** — If your custom font takes a moment to load, the browser first shows text in a fallback font and then swaps it. The two fonts are rarely the same size, so text blocks shift
- **Dynamic content above the fold** — Anything that appears after the page has rendered — pop-ups, notification bars, injected elements — can cause layout shift if space wasn't reserved for it

## How to Check Your Core Web Vitals (For Free)

You don't need to hire a developer to find out where you stand. Here are the tools I'd recommend, all completely free:

**Google PageSpeed Insights** — Pop in your URL and you'll get scores for all three metrics on both mobile and desktop. It also tells you exactly what's causing issues and how to fix them. This is the one I use most often — it gives you real-world data from actual Chrome users alongside lab test results.

**Google Search Console** — If your site is verified in Search Console (and it should be), head to the "Core Web Vitals" section. It shows you scores across your entire site, grouped by status — good, needs improvement, or poor. This is where you'll spot patterns, like every product page having bad CLS.

**Chrome DevTools (Lighthouse)** — Open any page in Chrome, right-click, select "Inspect", then go to the Lighthouse tab. Run a performance audit and you'll get detailed breakdowns of each metric. It's more technical than PageSpeed Insights but gives you granular detail.

**web.dev/measure** — Google's own testing tool. Clean interface, straightforward results. Good for a quick sanity check.

However, there are a few things to think about. Automated tools catch a lot, but they don't catch everything. INP in particular is tricky to test in a lab because it depends on real user interactions. The field data in PageSpeed Insights (from actual visitors) is more reliable than lab data for INP specifically. If your site is new or has low traffic, you might not have enough field data yet — in which case, lab scores are your best starting point.

## What to Fix First

If your scores aren't where they should be, here's the order I'd tackle things:

1. **Compress and properly size your images** — This alone fixes the majority of LCP issues I see. Use WebP format where possible, and always specify width and height attributes in your HTML
2. **Audit your third-party scripts** — Do you actually need that chat widget, those five analytics tools, and three marketing pixels? Every one of them adds JavaScript that impacts INP
3. **Reserve space for dynamic content** — Set explicit dimensions for ads, images, videos, and embeds. Use CSS `aspect-ratio` or min-height to prevent layout shift
4. **Defer non-critical JavaScript** — Anything that isn't needed for the initial page render should load after the main content. The `defer` and `async` attributes on script tags are your friends here
5. **Consider your hosting** — If your server response time is consistently over 600ms, no amount of front-end optimisation will get your LCP where it needs to be. A decent managed hosting provider makes a real difference

## The Bottom Line

Core Web Vitals aren't just a technical checkbox — they're Google's way of measuring whether your website is actually pleasant to use. Fast loading, responsive interactions, and stable layouts. That's it. Three things that every visitor notices, whether they know the acronyms or not.

The good news is that most of the fixes are straightforward, and the free tools Google provides tell you exactly what to address. You don't need to hit perfect scores — you just need to be in the green.

If you want to see where your website stands across all three metrics and get a clear plan for what to fix first, get in touch for a performance audit. I'll walk you through the results and help you prioritise the changes that'll make the biggest difference.

<!-- Internal linking suggestions:
- Link "accessibility audit" or "performance audit" to the PagePulser audit/pricing page
- Link "web accessibility" to the accessibility 2026 blog post if published
- Link "TinyPNG" or "ShortPixel" to a page speed how-to post if one exists
- Link "Google Search Console" to any GSC setup guide if published
-->
