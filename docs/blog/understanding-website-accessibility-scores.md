---
title: "Understanding Website Accessibility Scores: What the Numbers Actually Mean"
slug: "understanding-website-accessibility-scores"
date: "2026-03-18"
author: "Chris Garlick"
description: "Got an accessibility score but no idea what it means? Here's a plain-English guide to how scoring works, what WCAG audits check, and what to do next."
keyword: "website accessibility score"
category: "accessibility"
tags:
  - "accessibility"
  - "wcag"
  - "website-audit"
post_type: "explainer"
reading_time: "6 min read"
featured: false
---

# Understanding Website Accessibility Scores: What the Numbers Actually Mean

You've just run your website through an accessibility tool — maybe [Lighthouse](/blog/core-web-vitals-plain-english-guide), maybe something your developer sent over — and you're staring at a number. Maybe it's 62. Maybe it's 84. Maybe it's a terrifying 31. But what does it actually mean? Is 62 decent? Is 84 good enough? And what exactly was it testing?

If you've ever felt lost looking at a website accessibility score, you're not alone. Most business owners I work with see a number, feel either relieved or alarmed, and have no idea what to do next. The number on its own isn't particularly useful — what matters is understanding what went into it and where the real problems are hiding.

## How Accessibility Scoring Actually Works

Here's the first thing to understand: there's no single, universal accessibility score. Different tools calculate their numbers differently, and comparing a score from one tool to a score from another is a bit like comparing temperatures in Celsius and Fahrenheit — the numbers look different even when they're measuring the same thing.

That said, most tools follow the same basic approach. They crawl your webpage, check it against a set of rules derived from the **[Web Content Accessibility Guidelines (WCAG)](/blog/web-accessibility-2026-why-websites-still-failing)** — the international standard for web accessibility — and tally up what passes and what fails.

### What the Tools Check

A typical automated accessibility audit looks at things like:

- **[Colour contrast](/blog/improve-accessibility-score-20-points)** — Is there enough difference between your text colour and background colour for people with low vision to read it?
- **Image [alt text](/blog/complete-guide-image-alt-text)** — Do your images have text descriptions for screen reader users?
- **Form labels** — Are your input fields properly labelled so people know what to type where?
- **Heading structure** — Do your headings follow a logical order (H1, then H2, then H3) so the page has a navigable outline?
- **Link text** — Do your links say something meaningful, or is everything "click here"?
- **Keyboard navigation** — Can someone navigate and use your entire site without a mouse?
- **ARIA attributes** — Are accessibility roles and properties used correctly in your HTML?
- **Document language** — Does your page declare what language it's in so screen readers pronounce words correctly?
- **Focus indicators** — When someone tabs through your page, can they see which element is currently selected?

Each of these checks maps to specific WCAG criteria, and each criterion has a severity level. More on that in a moment.

### What the Tools Can't Check

This is important, and it's something most people don't realise: **automated tools can only detect about 30-40% of accessibility issues**. The rest require human judgement.

A tool can tell you that an image has alt text. It can't tell you whether that alt text is actually useful. `alt="image"` passes the automated check but fails the real-world test completely. Similarly, a tool can check that your page has headings, but it can't judge whether the heading text makes sense or whether the hierarchy reflects the actual content structure.

Automated scores are a starting point — a useful one — but they're not the full picture. A site that scores 95 on Lighthouse could still be unusable for a screen reader user if the automated checks all pass but the content itself is poorly structured.

## What Goes Into a WCAG Audit

WCAG — the Web Content Accessibility Guidelines — is the standard that most accessibility laws reference. It's maintained by the W3C (the organisation that oversees web standards) and is currently on version 2.2, though most legal requirements reference version 2.1.

### The Three Conformance Levels

WCAG organises its criteria into three levels:

**Level A** — The bare minimum. If you fail these, your site has fundamental barriers that prevent some users from accessing content at all. Missing alt text, no keyboard access, auto-playing audio with no way to stop it — these are Level A failures.

**Level AA** — The standard most laws and regulations require. This is where the UK's PSBAR, the EU's European Accessibility Act, and most organisational policies set the bar. It includes everything in Level A plus additional requirements like sufficient colour contrast (4.5:1 ratio for normal text), visible focus indicators, and the ability to resize text without breaking the layout.

**Level AAA** — The gold standard. Enhanced contrast ratios, sign language for video content, simplified reading levels. Very few sites achieve full AAA compliance, and most regulations don't require it. It's aspirational rather than mandatory for most businesses.

When someone says "WCAG 2.1 Level AA compliance," they mean the site meets every Level A criterion and every Level AA criterion in version 2.1 of the guidelines. That's 50 specific success criteria your site needs to pass.

### The Four Principles (POUR)

Every WCAG criterion falls under one of four principles:

- **Perceivable** — Can users perceive the content? (Alt text, captions, contrast)
- **Operable** — Can users operate the interface? (Keyboard access, enough time, no seizure triggers)
- **Understandable** — Can users understand the content and interface? (Readable text, predictable navigation, error handling)
- **Robust** — Does the content work with current and future assistive technologies? (Valid HTML, proper ARIA usage)

A thorough WCAG audit checks your site against all four principles. An automated tool mostly covers Perceivable and bits of Operable — the others need manual testing.

## Score Ranges and What They Indicate

Since Lighthouse is the most common tool business owners encounter, let me break down what its accessibility scores typically mean in practice.

### 90-100: Strong Foundation

Your site handles the fundamentals well. Contrast is solid, images have alt text, forms are labelled, headings are structured. You're in a good position.

**But don't stop here.** A high automated score doesn't mean you're fully accessible. It means the detectable issues are handled. You still need manual testing — particularly for keyboard navigation, screen reader usability, and content clarity — to catch the other 60-70% of potential issues.

### 70-89: Needs Attention

There are meaningful issues that affect real users. You're probably missing alt text on some images, have contrast failures on certain elements, or have form inputs without proper labels. These are typically straightforward fixes.

**What to do:** Review the specific failures listed in the audit. Most tools tell you exactly which elements failed and why. Prioritise anything flagged as a Level A failure — those are the barriers that completely block access.

### 50-69: Significant Problems

Your site has substantial accessibility barriers. Screen reader users are likely struggling. Keyboard navigation may be broken in places. Multiple fundamental checks are failing.

**What to do:** Don't try to fix everything at once. Focus on the highest-impact issues first: missing alt text, broken form labels, missing document language, and major contrast failures. These affect the most users and are usually the quickest to resolve.

### Below 50: Critical

Your site has serious, widespread accessibility failures. It's likely unusable for many people with disabilities. If your business falls under accessibility legislation — and most do now — this represents legal risk as well.

**What to do:** Treat this as urgent. Get a proper audit done, not just an automated scan, and build a remediation plan. The good news is that sites scoring this low often have a small number of systemic issues (like a template that's missing form labels everywhere) that, once fixed, dramatically lift the score across all pages.

## How to Interpret and Act on Your Score

Here's how I'd approach an accessibility score, whether it comes from Lighthouse, axe, WAVE, or a comprehensive audit tool.

### 1. Look at the Issues, Not Just the Number

The score is a summary. The real value is in the list of specific failures underneath it. Two sites can score 72 for completely different reasons — one might have a contrast problem across the whole theme, the other might have fifty images without alt text. The fix is different, the priority is different, and the impact on users is different.

### 2. Understand Severity

Not all failures are equal. A missing form label on your main contact form is far more impactful than a contrast issue on a footer link. Most audit tools categorise findings by severity:

- **Critical** — Blocks access entirely for some users. Fix immediately
- **Serious** — Creates significant barriers. Fix as a priority
- **Moderate** — Causes difficulty but doesn't fully block access. Fix soon
- **Minor** — Best practice improvements. Fix when possible

Focus your time and budget on critical and serious issues first. You'll help the most people with the least effort.

### 3. Check Across Multiple Pages

Your homepage might score 88 while your checkout page scores 41. Automated tools often test one page at a time, so make sure you're checking a representative sample — homepage, a product or service page, your contact page, and any pages with forms or interactive elements.

### 4. Test With Real Assistive Technology

Once you've fixed the automated failures, spend twenty minutes using your site with a screen reader. VoiceOver comes built into every Mac (press Command+F5 to start it). NVDA is free for Windows. Tab through your site with just the keyboard. You'll discover things no automated tool would catch — confusing reading order, unlabelled icons, custom components that don't work without a mouse.

### 5. Make It Ongoing

Accessibility isn't a one-and-done project. Every new page, new feature, or content update can introduce new issues. Build accessibility checks into your workflow — run Lighthouse before publishing new pages, include alt text in your content guidelines, test forms with a keyboard before they go live.

## The Bottom Line

An accessibility score is a useful starting point, but it's not the destination. The number tells you roughly where you stand; the specific failures tell you what to fix; and manual testing tells you whether your site actually works for real people using assistive technology.

In my honest opinion, the biggest mistake I see businesses make isn't having a low score — it's treating the score as the goal instead of the user experience. A site that scores 90 on Lighthouse but hasn't been tested with a screen reader might still be broken for the people who need accessibility most. The score is a tool, not a certificate.

If you're looking at your accessibility score and wondering what to tackle first, get in touch for an audit. I'll walk you through what the numbers mean for your specific site and help you build a practical plan to fix the things that matter most.

<!-- Internal linking suggestions:
- Link "WCAG" or "WCAG 2.1 Level AA" to the web accessibility 2026 state of the web post
- Link "alt text" to the complete guide to image alt text post
- Link "colour contrast" to the accessibility post or a dedicated contrast guide
- Link "Core Web Vitals" or "Lighthouse" to the CWV explainer post
- Link "audit" to the PagePulser audit/pricing page
- Link "accessibility, SEO, and performance" to the holistic website health thought leadership post
-->
