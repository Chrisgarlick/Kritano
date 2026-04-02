---
title: "The Website Launch Checklist: 25 Things to Check Before Going Live"
slug: "website-launch-checklist"
date: "2026-03-18"
author: "Chris Garlick"
description: "About to launch a website? Here are 25 things to check across accessibility, SEO, security, and performance — so you don't go live with problems baked in."
keyword: "website launch checklist"
category: "business"
tags:
  - "website-audit"
  - "accessibility"
  - "seo-basics"
  - "performance-optimisation"
  - "website-security"
post_type: "listicle"
reading_time: "8 min read"
featured: false
---

# The Website Launch Checklist: 25 Things to Check Before Going Live

There's a particular kind of dread that comes with launching a website. You've spent weeks — maybe months — building, reviewing, and tweaking. Everything looks right. You hit publish, share the link, and then someone immediately finds a broken form, a missing page, or a glaring typo on the homepage. I've been on both sides of that moment, and it never gets less painful.

The truth is, most launch-day problems aren't surprises. They're things someone forgot to check. Not because they're careless, but because there's genuinely a lot to remember — and it spans accessibility, SEO, security, and performance all at once.

So I've put together a website launch checklist covering the 25 things I check before any site goes live. Bookmark this one. You'll use it more than once.

## Accessibility (Items 1-8)

These aren't optional extras — they're the baseline for making sure everyone can use your site. Many of them are also legal requirements under UK, EU, and US accessibility regulations.

### 1. Every Image Has Proper Alt Text

Check every `<img>` tag. Informative images need descriptive [alt text](/blog/complete-guide-image-alt-text) that explains what the image shows. Decorative images — background patterns, visual flourishes — need an empty alt attribute (`alt=""`). No image should be missing the alt attribute entirely.

**Quick check:** Install the WAVE browser extension and scan each page. It highlights every image and shows its alt text inline.

### 2. Colour Contrast Meets WCAG Standards

All text needs a [colour contrast](/blog/understanding-website-accessibility-scores) ratio of at least **4.5:1** against its background (3:1 for large text). This includes text on images, text over gradients, and placeholder text in form fields — that last one catches people out constantly.

**Quick check:** Use the WebAIM Contrast Checker or Chrome DevTools' built-in contrast inspection.

### 3. Forms Have Proper Labels

Every input field needs a visible `<label>` element associated with it. Placeholder text doesn't count — it disappears when someone starts typing, leaving screen reader users and people with cognitive disabilities with no indication of what the field is for.

### 4. Heading Hierarchy Is Logical

One H1 per page (your page title), then H2s for major sections, H3s for subsections. Never skip levels — going from H2 straight to H4 breaks the navigable outline that screen reader users rely on to understand your page structure.

### 5. Keyboard Navigation Works

Put your mouse down and tab through every page. Can you reach every link, button, form field, and interactive element? Can you see which element is currently focused? Can you operate dropdown menus, modals, and accordions? If anything traps your focus or is unreachable, it needs fixing before launch.

### 6. The Document Language Is Set

Your HTML tag needs a `lang` attribute — `<html lang="en">` for English. Without it, screen readers don't know which language to use for pronunciation. It takes five seconds to add and affects every single page.

### 7. Link Text Is Descriptive

No "click here." No "read more." Every link should make sense out of context. Screen reader users often navigate by pulling up a list of all links on a page — if five of them say "read more," they're useless.

### 8. Skip Navigation Is in Place

Add a "Skip to main content" link as the first focusable element on every page. It's hidden visually but appears when a keyboard user tabs to it, letting them jump past the navigation straight to the content. Without it, keyboard users have to tab through your entire menu on every single page load.

## SEO (Items 9-16)

These are the foundations that help search engines find, understand, and rank your content. Get them wrong at launch and you're starting from behind.

### 9. Every Page Has a Unique Title Tag

Each page needs its own `<title>` — descriptive, under 60 characters, with the primary keyword near the front. "Home" or "Untitled" appearing in your browser tab is a launch-day embarrassment that's entirely avoidable.

### 10. Meta Descriptions Are Written

Every key page should have a unique meta description — 150 to 160 characters, benefit-led, including the target keyword. Google doesn't always use them, but when it does, they're your pitch to the searcher. Leaving them blank hands that pitch to Google's algorithm.

### 11. URL Structure Is Clean

URLs should be short, descriptive, lowercase, and hyphenated. `/services/web-design` is good. `/page?id=47&cat=3` is not. Check that no pages are using auto-generated URLs with random IDs or unnecessary parameters.

### 12. XML Sitemap Is Submitted

Generate an XML sitemap (Yoast SEO handles this automatically on WordPress) and submit it to Google Search Console. This tells Google exactly which pages exist and helps them get indexed faster.

### 13. Robots.txt Isn't Blocking Important Pages

Check your `robots.txt` file. I've seen sites launch with `Disallow: /` still in place from the staging environment — effectively telling every search engine to ignore the entire site. Visit `yourdomain.com/robots.txt` and make sure it's only blocking what you intend.

### 14. Canonical Tags Are Correct

Every page should have a `<link rel="canonical">` tag pointing to its own URL. This prevents duplicate content issues, especially if your site is accessible with and without `www`, or with trailing slashes and without. If you're on WordPress, Yoast handles this automatically.

### 15. Structured Data Is Valid

If you've added JSON-LD markup — Organisation schema on the homepage, Article schema on blog posts, Product schema on e-commerce pages — validate it with Google's Rich Results Test before launch. Invalid structured data is worse than no structured data.

### 16. Google Analytics and Search Console Are Connected

Make sure GA4 is tracking properly on every page (not just the homepage — I've seen this happen) and that your site is verified in Google Search Console. Without these, you're flying blind from day one.

## Security (Items 17-21)

A single security oversight at launch can undermine everything else. These checks take minutes but prevent serious headaches.

### 17. SSL Certificate Is Active and Forcing HTTPS

Your entire site should load over HTTPS with a valid certificate. Check that HTTP requests redirect to HTTPS automatically — don't just assume your hosting provider set this up. Visit `http://yourdomain.com` (without the S) and confirm it redirects.

### 18. No Mixed Content

Even with SSL active, loading any resource — images, scripts, stylesheets, fonts — over plain HTTP creates a mixed content warning and undermines your security. Open Chrome DevTools, check the Console for mixed content warnings, and fix every one.

### 19. Admin Panel Is Protected

If your CMS login is at the default URL (`/wp-admin`, `/admin`, `/login`), move it. Enable two-factor authentication on every admin account. Make sure login attempts are rate-limited. And please — no accounts with "admin" as the username.

### 20. Security Headers Are Configured

Run your domain through **securityheaders.com** before launch. At minimum, you should have Strict-Transport-Security (HSTS), X-Content-Type-Options, X-Frame-Options, and Referrer-Policy in place. These take ten minutes to configure and [block entire categories of attack](/blog/website-security-basics-business-owners).

### 21. Unnecessary Files and Directories Are Removed

Delete staging files, backup archives, database dumps, `.env` files, and anything else that shouldn't be publicly accessible. Check that directory listing is disabled on your server — visiting `/wp-content/uploads/` shouldn't show a browsable file list.

## Performance (Items 22-25)

A slow site on launch day means first impressions are poor — and first impressions with Google are hard to undo.

### 22. Images Are Compressed and Properly Sized

Every image should be compressed (TinyPNG, ShortPixel, or your build tool's image pipeline), served in a modern format like WebP where possible, and sized to the dimensions they're actually displayed at. A 4000px image displayed at 800px is wasting bandwidth.

### 23. Core Web Vitals Are Green

Run every key page through Google PageSpeed Insights. Your three targets: **LCP under 2.5 seconds** (how fast the main content loads), **INP under 200ms** (how quickly the page responds to interaction), and **CLS under 0.1** (how much the layout shifts during loading). All three should be green on both mobile and desktop.

### 24. Render-Blocking Resources Are Deferred

CSS and JavaScript that isn't needed for the initial page render should be loaded with `defer` or `async` attributes. This prevents the browser from stalling on files the user doesn't need yet. Check Lighthouse's "Eliminate render-blocking resources" diagnostic for specifics.

### 25. Caching Is Configured

Browser caching headers should be set so returning visitors don't re-download static assets. If you're on WordPress, a caching plugin like LiteSpeed Cache or WP Rocket handles this. If you're on a custom setup, make sure your server is sending appropriate `Cache-Control` headers for CSS, JS, images, and fonts.

## The One That Ties It All Together

If I had to pick one thing from this entire list, it's this: **don't treat these as four separate checklists.** [Accessibility, SEO, security, and performance overlap](/blog/accessibility-seo-performance-why-you-shouldnt-choose) constantly. A compressed image with proper alt text and dimensions handles performance, accessibility, and SEO in one go. A clean heading hierarchy helps screen readers and search engines equally. Security headers protect your users and your reputation simultaneously.

The most efficient way to check all of this isn't running four separate tools and reconciling four separate reports. It's using something that looks at your site holistically — which is exactly what Kritano does. Run a single audit and you'll get your accessibility score, performance metrics, security checks, and SEO analysis in one place, with every issue prioritised by severity so you know what to fix first.

Whether you use Kritano or work through this list manually, the important thing is that you check before you launch. Every item on this list is something I've seen missed on a live site — and every one of them is easier to fix before launch day than after.

<!-- Internal linking suggestions:
- Link "alt text" to the complete guide to image alt text post
- Link "colour contrast" or "WCAG" to the accessibility scores explainer post
- Link "Core Web Vitals" to the CWV plain-English guide post
- Link "security headers" to the website security basics post
- Link "securityheaders.com" to the security post
- Link "accessibility, SEO, security, and performance overlap" to the holistic website health post
- Link "regular health checks" or "after launch" to the regular health checks post
- Link "Kritano" to the main product/pricing page
-->
