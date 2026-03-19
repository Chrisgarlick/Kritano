---
title: "Website Performance Benchmarks by Industry: Where Does Your Site Stand?"
slug: "website-performance-benchmarks-by-industry"
date: "2026-03-18"
author: "Chris Garlick"
description: "Is your website fast for your industry — or just fast in general? Here are performance benchmarks by sector so you can see where you really stand."
keyword: "website performance benchmarks"
category: "performance"
tags:
  - "performance-optimisation"
  - "core-web-vitals"
  - "page-speed"
  - "website-audit"
post_type: "explainer"
reading_time: "7 min read"
featured: false
---

# Website Performance Benchmarks by Industry: Where Does Your Site Stand?

You've run a speed test, you've got your numbers, and now you're staring at them wondering — is this actually good? A 3.2-second load time feels slow, but is it slow for a law firm's website? What about an e-commerce site with 500 products? What about a SaaS landing page?

Context matters enormously when it comes to website performance benchmarks. A score that's excellent for a media-heavy e-commerce shop might be mediocre for a simple service business site. And Google's thresholds — while useful — don't account for the reality that some types of websites are inherently heavier than others.

I've pulled together performance data from publicly available sources like the HTTP Archive, Google's Chrome User Experience Report, and patterns from our own PagePulser audits to give you realistic benchmarks by industry. Not theoretical ideals — actual numbers that reflect what sites in each sector are doing in the real world.

## The Universal Benchmarks

Before we get into industry specifics, here are Google's Core Web Vitals thresholds. These apply to everyone regardless of sector:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | Under 2.5s | 2.5-4.0s | Over 4.0s |
| **INP** (Interaction to Next Paint) | Under 200ms | 200-500ms | Over 500ms |
| **CLS** (Cumulative Layout Shift) | Under 0.1 | 0.1-0.25 | Over 0.25 |

These are the targets Google uses for ranking purposes. But here's the thing — meeting "good" puts you in the top tier according to Google, yet in some industries, even the average site is nowhere near these numbers. Knowing where your industry sits helps you understand whether you're competing or lagging.

## E-Commerce

E-commerce sites are the heaviest on the web, and the performance benchmarks reflect that.

| Metric | Industry Average | Top 25% | Target |
|--------|-----------------|---------|--------|
| LCP | 4.1s | 2.4s | Under 2.5s |
| INP | 340ms | 180ms | Under 200ms |
| CLS | 0.18 | 0.06 | Under 0.1 |
| Total Page Weight | 3.8MB | 1.6MB | Under 2MB |
| Performance Score | 41 | 72 | 70+ |

**Why e-commerce is heavy:** Product images are the obvious culprit — most category pages load dozens of them simultaneously. But the bigger issue is often JavaScript. Product filtering, dynamic pricing, cart widgets, recommendation engines, analytics, A/B testing scripts, chat widgets, and retargeting pixels all compete for the browser's attention. I've audited e-commerce sites running 40+ third-party scripts on a single page.

**Common bottlenecks:**
- Uncompressed product images — often the single biggest win. Switching to WebP with lazy loading can halve your page weight
- Heavy JavaScript bundles — especially React or Angular-based storefronts that ship entire framework libraries for pages that don't need them
- Third-party scripts — each marketing tool adds weight. Audit what you're actually using versus what someone installed two years ago and forgot about
- No CDN — serving assets from a single origin server means users far from that server wait longer. A content delivery network like Cloudflare or Bunny CDN makes a measurable difference

**The honest take:** If your e-commerce site has an LCP under 3 seconds on mobile, you're ahead of most of your competition. Under 2.5 seconds and you're in genuinely strong territory.

## Professional Services (Law, Accounting, Consulting)

Professional services sites should be some of the fastest on the web — they're typically content-light with a few service pages, a team section, and a contact form. The reality is often different.

| Metric | Industry Average | Top 25% | Target |
|--------|-----------------|---------|--------|
| LCP | 3.2s | 1.8s | Under 2.0s |
| INP | 210ms | 120ms | Under 150ms |
| CLS | 0.12 | 0.04 | Under 0.05 |
| Total Page Weight | 2.4MB | 1.1MB | Under 1.5MB |
| Performance Score | 54 | 81 | 80+ |

**Why they're slower than they should be:** Cheap shared hosting, page builders like Elementor or Divi loading massive CSS and JavaScript bundles regardless of what's on the page, uncompressed stock photography, and web fonts loading without optimisation. A simple five-page law firm site has no business being 2.4MB, but that's the average.

**Common bottlenecks:**
- Page builder bloat — Elementor and Divi ship enormous frontend libraries. A page with three paragraphs and a contact form loads the same JavaScript as a complex interactive page
- Oversized hero images — that stock photo of a handshake or a skyline is probably 2-3MB straight from the stock library
- Hosting — many professional services sites are on bottom-tier shared hosting because "it's just a brochure site." Server response times of 800ms+ are common
- Unused plugins — WordPress sites in this sector average 20-30 plugins, many of which add frontend scripts whether they're needed on that page or not

**Target:** There's no reason a professional services site shouldn't score 80+ on performance. The content is simple, the interactivity is minimal. If yours is scoring below 60, it's almost certainly a hosting or page builder issue.

## SaaS and Technology

SaaS companies tend to have two very different performance profiles: their marketing site and their application. We're talking about the marketing site here.

| Metric | Industry Average | Top 25% | Target |
|--------|-----------------|---------|--------|
| LCP | 2.8s | 1.6s | Under 2.0s |
| INP | 190ms | 95ms | Under 150ms |
| CLS | 0.08 | 0.03 | Under 0.05 |
| Total Page Weight | 2.1MB | 1.0MB | Under 1.5MB |
| Performance Score | 62 | 86 | 85+ |

**Why SaaS sites tend to perform better:** They're typically built by technical teams who understand performance, use modern frameworks with server-side rendering, and deploy on quality infrastructure. The engineering culture naturally produces faster sites.

**Common bottlenecks:**
- Hero animations and interactive demos — these look impressive but can tank LCP and INP if they're not carefully optimised
- Analytics and tracking overload — SaaS companies love their data. HubSpot, Segment, Mixpanel, Intercom, Hotjar, FullStory — each one adds JavaScript
- Video embeds — product demo videos that autoplay or load heavy players on the homepage

**Target:** SaaS marketing sites should be aiming for 85+. If you've got engineering resources and you're below 70, something has gone wrong — likely too many third-party scripts or an unoptimised framework build.

## Healthcare and Medical

Healthcare sites face unique challenges because they often need to be information-dense while remaining accessible to an audience that skews older and may be using assistive technology.

| Metric | Industry Average | Top 25% | Target |
|--------|-----------------|---------|--------|
| LCP | 3.6s | 2.1s | Under 2.5s |
| INP | 280ms | 150ms | Under 200ms |
| CLS | 0.15 | 0.05 | Under 0.1 |
| Total Page Weight | 3.1MB | 1.4MB | Under 2MB |
| Performance Score | 48 | 74 | 70+ |

**Common bottlenecks:**
- Legacy CMS platforms — many healthcare sites run on older systems with limited performance optimisation options
- Embedded maps and location finders — practice locators with Google Maps embeds are heavy and often render-blocking
- Cookie consent and compliance banners — healthcare sites often have more complex consent requirements, and the tools that manage them add weight
- PDF-heavy content — instead of web pages, information is locked in PDFs that are slow to load and inaccessible

**Target:** Healthcare sites should prioritise LCP above all else. When someone is looking up symptoms or trying to book an appointment, every second of delay is genuinely stressful. Getting under 2.5 seconds should be the minimum standard.

## Media and Publishing

Content sites with articles, images, and advertising are fighting a constant battle between monetisation and performance.

| Metric | Industry Average | Top 25% | Target |
|--------|-----------------|---------|--------|
| LCP | 4.5s | 2.6s | Under 3.0s |
| INP | 380ms | 200ms | Under 250ms |
| CLS | 0.22 | 0.08 | Under 0.1 |
| Total Page Weight | 4.6MB | 2.0MB | Under 2.5MB |
| Performance Score | 35 | 62 | 60+ |

**Why media sites are the slowest:** Advertising. Display ads, video ads, programmatic auction scripts — they inject content after page load (causing massive CLS), add hundreds of milliseconds of JavaScript execution (tanking INP), and load heavy assets that compete with your actual content for bandwidth (destroying LCP).

**The honest take:** If you rely on advertising revenue, there's a genuine tension between performance and monetisation. I won't pretend otherwise. But the sites that manage this best are the ones that limit ad slots per page, lazy-load below-fold ads, and use lighter ad formats. A site that loads in 2 seconds and shows 4 ads will make more money than one that loads in 8 seconds and shows 8 ads — because fewer people will stick around for the second one.

**Target:** Realistically, media sites should aim for 60+ on performance. Breaking into the 70s puts you ahead of the vast majority of publishers.

## Restaurants and Hospitality

These sites are often surprisingly slow for how simple they are, primarily because of image-heavy design and embedded third-party booking systems.

| Metric | Industry Average | Top 25% | Target |
|--------|-----------------|---------|--------|
| LCP | 3.8s | 2.0s | Under 2.5s |
| INP | 240ms | 130ms | Under 200ms |
| CLS | 0.16 | 0.05 | Under 0.1 |
| Total Page Weight | 3.2MB | 1.3MB | Under 1.5MB |
| Performance Score | 45 | 76 | 75+ |

**Common bottlenecks:**
- Full-bleed food photography — beautiful but enormous. A gallery page with 20 uncompressed food photos can easily hit 15MB
- Embedded booking widgets (OpenTable, Resy, ResDiary) — these inject their own JavaScript and CSS, often render-blocking
- Google Maps embeds — loading the full Maps SDK for a single location pin is overkill. A static map image with a link to Google Maps is far lighter
- Background videos — atmospheric but devastating for performance on mobile

## How to Use These Benchmarks

Here's my practical advice for making these numbers useful:

1. **Find your industry.** Look at the average and the top 25% columns. Where does your site fall?
2. **Set a realistic target.** If you're at the industry average, aim for the top 25%. If you're already in the top 25%, aim for Google's "good" thresholds
3. **Identify your specific bottleneck.** The "common bottlenecks" for your industry will probably ring true. Start there
4. **Measure on mobile.** All of these benchmarks are based on mobile performance, which is what Google uses for ranking. Your desktop scores will almost always be better — don't let that give you a false sense of comfort
5. **Track over time.** A single measurement is a snapshot. Monthly measurements show whether you're improving or drifting

## The Bottom Line

Knowing that your site scores 52 on performance doesn't mean much in isolation. Knowing that the industry average is 41 and the top performers hit 72 — that gives you context, a target, and motivation.

In my honest opinion, every industry in this list has room for improvement. The averages are, frankly, poor across the board. That's bad news for the web in general, but it's an opportunity for you — because hitting even the top 25% doesn't require heroic effort. Image compression, script auditing, decent hosting, and lazy loading will get most sites there.

If you want to see exactly where your site stands and how it compares, run an audit on PagePulser. Your performance report breaks down every Core Web Vitals metric alongside your other scores — so you can see the full picture and know precisely where to start.

<!-- Internal linking suggestions:
- Link "Core Web Vitals" or "LCP, INP, CLS" to the CWV plain-English guide
- Link "image compression" or "WebP" to the image optimisation post
- Link "third-party scripts" to the website launch checklist post
- Link "accessibility" to the e-commerce accessibility guide
- Link "PagePulser audit" to the main product/pricing page
-->
