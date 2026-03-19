---
title: "The Complete Guide to Website Security Headers"
slug: "complete-guide-website-security-headers"
date: "2026-03-18"
author: "Chris Garlick"
description: "Security headers are one of the easiest ways to protect your website — and most sites are missing them. Here's what each one does and how to add them."
keyword: "website security headers"
category: "security"
tags:
  - "website-security"
  - "website-audit"
  - "performance-optimisation"
post_type: "how-to"
reading_time: "8 min read"
featured: false
---

# The Complete Guide to Website Security Headers

If I asked you whether your website has security headers configured, there's a good chance you'd say "I have no idea what those are." And honestly, that's completely normal — security headers are one of the most effective ways to protect a website, and almost nobody talks about them outside of security circles.

Here's the problem: from our PagePulser audits, the majority of websites are missing at least one critical security header. Some are missing all of them. These aren't obscure, enterprise-level configurations — they're straightforward instructions that tell browsers how to handle your site's content safely. Most can be added in under 30 minutes, and they dramatically reduce your exposure to common attacks.

Let me explain what each one does, why it matters, and exactly how to add them — regardless of what platform you're running.

## What Are Security Headers?

When your browser requests a web page, the server doesn't just send back the page content. It also sends HTTP headers — bits of metadata about the response. You never see them (unless you open developer tools), but they control a lot of behind-the-scenes behaviour.

Security headers are specific headers that instruct the browser to enable or enforce certain security rules when displaying your site. Think of them as a bouncer's instructions: "Only let these people in. Don't let anyone frame my content. Always use the secure entrance."

Without them, browsers use their default behaviour — which is often more permissive than you'd want.

## The Essential Headers (And What They Protect Against)

### Content-Security-Policy (CSP)

**What it does:** Controls exactly which resources — scripts, stylesheets, images, fonts, embeds — the browser is allowed to load on your page. If a resource isn't on the approved list, the browser blocks it.

**What it protects against:** Cross-Site Scripting (XSS) — one of the most common web attacks. Without CSP, if an attacker manages to inject malicious JavaScript into your page (through a vulnerable plugin, a compromised form input, or a third-party script), the browser will happily execute it. CSP stops this by refusing to run any script that doesn't come from an approved source.

**Basic implementation:**

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;
```

This tells the browser: only load scripts from my own domain, only load styles from my domain (plus inline styles), and only load images from my domain, data URIs, or any HTTPS source.

**The honest caveat:** CSP is the most powerful header on this list, but it's also the trickiest to get right. Set it too strictly and you'll break your own site by blocking legitimate resources — your analytics script, your chat widget, your Google Fonts. I'd recommend starting with **report-only mode** (`Content-Security-Policy-Report-Only`) to see what would be blocked before enforcing it. This logs violations without actually breaking anything, giving you time to build your allow-list.

**Found missing on:** 61% of PagePulser-audited sites

### X-Frame-Options

**What it does:** Prevents your website from being embedded inside an iframe on someone else's site.

**What it protects against:** Clickjacking. Here's how it works: an attacker creates a page with your site loaded in a transparent iframe layered over a decoy page. The user thinks they're clicking a button on the decoy, but they're actually clicking a button on your site — potentially transferring money, changing settings, or submitting a form they never intended to.

**Implementation:**

```
X-Frame-Options: DENY
```

This blocks all framing. If you need your site to be embeddable within your own domain (for example, if you use iframes internally), use:

```
X-Frame-Options: SAMEORIGIN
```

**When to use which:** `DENY` is the safest default. Only use `SAMEORIGIN` if you have a specific, known reason to embed your own pages. If you're not sure, go with `DENY`.

**Found missing on:** 44% of PagePulser-audited sites

### Strict-Transport-Security (HSTS)

**What it does:** Tells browsers to always connect to your site over HTTPS, even if the user types `http://` or clicks an HTTP link. Once a browser receives this header, it automatically upgrades all future requests to HTTPS for the duration you specify.

**What it protects against:** Downgrade attacks. Without HSTS, there's a brief moment during the initial HTTP request — before the redirect to HTTPS — where an attacker on the same network can intercept the connection. HSTS eliminates that window entirely by telling the browser to never even attempt an insecure connection.

**Implementation:**

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

The `max-age` is in seconds — 31536000 is one year. `includeSubDomains` applies the rule to every subdomain too.

**Important:** Only add this header once you're certain that HTTPS is working correctly across your entire site and all subdomains. Once a browser caches this header, it will refuse to connect over HTTP for the specified duration — so if your SSL certificate breaks, visitors won't be able to reach your site at all. Start with a shorter `max-age` (like 86400, which is one day) to test, then increase it once you're confident.

**Found missing on:** 38% of PagePulser-audited sites

### X-Content-Type-Options

**What it does:** Prevents browsers from "MIME-type sniffing" — which is when a browser ignores the declared content type of a file and tries to guess what it actually is based on the content.

**What it protects against:** An attacker uploads a file that looks like an image but is actually a script. Without this header, the browser might look at the file's content, decide it's JavaScript, and execute it — even though it was supposed to be treated as an image.

**Implementation:**

```
X-Content-Type-Options: nosniff
```

That's it. One value, one header, no configuration needed. There's genuinely no reason not to have this on every site.

### Referrer-Policy

**What it does:** Controls how much information about the referring page gets sent when a visitor navigates from your site to another site (or when your site loads a resource from an external domain).

**Why it matters:** By default, browsers send the full URL of the referring page — including any query parameters, which might contain sensitive information like search terms, session tokens, or user IDs. Referrer-Policy lets you limit this.

**Implementation:**

```
Referrer-Policy: strict-origin-when-cross-origin
```

This sends the full URL for same-origin requests (internal navigation within your site), but only sends the domain name for cross-origin requests (when someone clicks a link to an external site). It's the sensible middle ground between sharing nothing and sharing everything.

### Permissions-Policy

**What it does:** Controls which browser features — camera, microphone, geolocation, payment API, USB access — your site is allowed to use. If your site doesn't need the camera, you can explicitly deny it.

**Why it matters:** If an attacker manages to inject code into your page, this header limits what that code can do. Without it, injected scripts could potentially access the user's camera, microphone, or location.

**Implementation:**

```
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

The empty parentheses mean "nobody can use this feature, not even my own site." If you do need a feature (like geolocation for a store finder), you can allow it specifically: `geolocation=(self)`.

## How to Check Yours

The quickest way to see where you stand is **securityheaders.com** — enter your URL and it'll give you a grade from A+ to F, along with a clear list of what's missing and what's configured correctly. Most small business sites I've tested score a D or lower on their first check.

PagePulser also checks all of these headers automatically as part of your security audit, alongside SSL configuration, mixed content, and other vulnerabilities. If you've already got a PagePulser report, check the security section — it'll tell you exactly which headers are missing.

## How to Add Them

The good news: adding security headers doesn't require changing any of your website's content or code. They're configured at the server level, and most platforms make it straightforward.

### Apache (.htaccess)

If your site runs on Apache (most shared hosting and many WordPress setups), add these lines to your `.htaccess` file:

```apache
Header set X-Frame-Options "SAMEORIGIN"
Header set X-Content-Type-Options "nosniff"
Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header set Referrer-Policy "strict-origin-when-cross-origin"
Header set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
```

### Nginx

If your server runs Nginx, add these to your server block:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
```

The `always` keyword ensures headers are sent even on error responses — which is important for security.

### WordPress (Without Touching Config Files)

If you're not comfortable editing server configuration, the **Headers Security Advanced & HSTS WP** plugin lets you configure all of these through the WordPress admin panel. Install it, enable the headers you want, and you're done.

### Other Platforms

Vercel uses `vercel.json`, Netlify uses a `_headers` file, and Cloudflare has a dashboard for response headers. Check your hosting provider's documentation — most modern platforms have a straightforward way to set custom headers.

## The Priority Order

If you're adding headers for the first time, here's the order I'd tackle them:

1. **X-Content-Type-Options** — Simplest to add, zero risk of breaking anything, immediate protection
2. **X-Frame-Options** — Simple, low-risk, blocks a whole category of attacks
3. **Strict-Transport-Security** — Start with a short `max-age`, then increase once you've verified HTTPS works everywhere
4. **Referrer-Policy** — Simple, no risk, good privacy practice
5. **Permissions-Policy** — Easy wins by denying features you don't use
6. **Content-Security-Policy** — Most powerful but needs careful testing. Start in report-only mode

## Wrapping Up

Security headers are one of those rare things in web development where the effort-to-impact ratio is genuinely exceptional. Thirty minutes of configuration can protect your site against entire categories of attacks — clickjacking, XSS, MIME confusion, downgrade attacks — and the majority of websites simply aren't doing it.

In my honest opinion, every website should have at least the first five headers on this list configured. They cost nothing, they don't affect your site's appearance or functionality, and they provide meaningful protection that compounds with everything else in your security posture.

If you want to see which headers you're missing and get your security score alongside accessibility, SEO, and performance, run an audit on PagePulser. The security section flags every missing header with specific implementation guidance for your setup.

<!-- Internal linking suggestions:
- Link "SSL" or "HTTPS" to the website security basics post
- Link "PagePulser audit" or "security audit" to the main product/pricing page
- Link "securityheaders.com" inline (already a named tool)
- Link "common attacks" to the website security basics post
- Link "accessibility, SEO, and performance" to the holistic website health post
- Link "website launch checklist" to the launch checklist post (security headers are item 20)
-->
