---
title: "WCAG 2.2: What's New and What It Means for Your Website"
slug: "wcag-2-2-whats-new-what-it-means"
date: "2026-03-18"
author: "Chris Garlick"
description: "WCAG 2.2 added nine new success criteria. Here's what each one means in plain English, how to test for them, and when you need to comply."
keyword: "WCAG 2.2"
category: "accessibility"
tags:
  - "accessibility"
  - "wcag"
  - "website-audit"
post_type: "explainer"
reading_time: "8 min read"
featured: false
---

# WCAG 2.2: What's New and What It Means for Your Website

If you've been following web accessibility at all, you'll know that WCAG — the Web Content Accessibility Guidelines — is the standard that most accessibility laws reference. Version 2.1 has been the benchmark for years, and it's what regulations like the UK's PSBAR and the EU's [European Accessibility Act](/blog/web-accessibility-2026-why-websites-still-failing) point to.

But WCAG 2.2 was published as a W3C Recommendation in October 2023, and it's now the current version. It added nine new success criteria that didn't exist in 2.1 — and removed one. If your site was compliant with 2.1, you've got new ground to cover. And if you're starting fresh, 2.2 is the version you should be targeting.

I'll break down each new criterion in plain English, explain why it was added, show you how to test for it, and give you a realistic sense of how much effort each one requires.

## What Changed at a Glance

WCAG 2.2 added nine new success criteria across Levels A, AA, and AAA. It also removed one criterion from 2.1 — 4.1.1 Parsing — because modern browsers and assistive technology have evolved past the issues it addressed.

Here are the new criteria, grouped by the level that matters most to most businesses (AA):

| Criterion | Level | One-Line Summary |
|-----------|-------|------------------|
| Focus Not Obscured (Minimum) | AA | Focused elements can't be completely hidden |
| Focus Not Obscured (Enhanced) | AAA | Focused elements must be fully visible |
| Focus Appearance | AAA | Focus indicators must meet size and contrast requirements |
| Dragging Movements | AA | Anything you can drag must also work with a click |
| Target Size (Minimum) | AA | Touch targets must be at least 24x24 CSS pixels |
| Consistent Help | A | Help mechanisms appear in the same place across pages |
| Redundant Entry | A | Don't make users re-enter information they've already provided |
| Accessible Authentication (Minimum) | AA | Don't require cognitive tests to log in |
| Accessible Authentication (Enhanced) | AAA | Even stricter rules on login cognitive demands |

Let me walk through the ones that will affect most websites.

## The Level A Criteria (The New Basics)

### Consistent Help (3.2.6)

**In plain English:** If your site has help features — a contact link, a chat widget, a FAQ page, a phone number — they need to appear in the same location on every page. If your "Contact Us" link is in the footer on your homepage but in the header on your services page and missing entirely from your blog, that's a failure.

**Why it was added:** People with cognitive disabilities often learn to find help in a specific location. If that location changes from page to page, they have to re-learn the interface every time — which is disorienting and frustrating.

**How to test:** Navigate through five or six different pages on your site. Is the help mechanism (whatever form it takes) in the same relative position every time? Same header location, same footer position, same chat widget corner? If yes, you pass.

**Effort to fix:** Low. This is usually a template-level fix — make sure your help links or chat widget are in a consistent location across your site template. If you're using a CMS with a shared header/footer, you're probably already compliant.

### Redundant Entry (3.3.7)

**In plain English:** If a user has already given you a piece of information during a process, don't ask them to type it again. If someone enters their delivery address and then gets to a billing address step, the form should either auto-populate from the previous entry or let them select "same as delivery address."

**Why it was added:** Re-entering information is tedious for everyone, but it's a significant barrier for people with cognitive disabilities, memory impairments, or motor disabilities that make typing difficult. Every extra field is effort — don't waste it on information you already have.

**How to test:** Walk through any multi-step process on your site — checkout flows, application forms, booking processes. At any point, are you asked to type something you've already entered? If your billing address form doesn't offer to copy from shipping, or your account creation asks for your email twice, those are failures.

**Exceptions:** Re-entering information for security purposes (like confirming a password) is allowed. So is re-entering information when the previously entered data is no longer valid.

**Effort to fix:** Moderate. It requires changes to multi-step forms, but the fix is usually a checkbox ("Same as delivery address") or auto-population from session data. Most modern form libraries support this.

## The Level AA Criteria (The Ones Most Laws Require)

### Focus Not Obscured — Minimum (2.4.11)

**In plain English:** When a keyboard user tabs to an element, that element can't be completely hidden behind other content. Sticky headers, cookie banners, chat widgets, and fixed navigation bars are the usual culprits — they sit on top of the page and can completely cover the element that currently has focus.

**Why it was added:** Keyboard users need to see where they are on the page. If a sticky header covers the focused element, they're navigating blind — pressing Tab and having no idea what they've just landed on.

**How to test:** Tab through your entire site using your keyboard. At any point, does the focused element disappear behind a sticky header, a cookie banner, a chat widget, or any other fixed-position element? If the focused element is partially obscured, that's fine at Level AA — it just can't be fully hidden. (Level AAA requires it to be fully visible.)

**Effort to fix:** Moderate. The most common fix is adding `scroll-padding-top` in CSS to account for the height of sticky elements, so the browser scrolls far enough to keep focused elements visible. For chat widgets and cookie banners, ensure they don't overlap the main content area, or dismiss them when the user starts navigating with the keyboard.

### Dragging Movements (2.5.7)

**In plain English:** Any functionality that requires a dragging motion — drag-and-drop interfaces, sliders, sortable lists, map panning — must also work with a simple single-pointer action like a click, tap, or keyboard input.

**Why it was added:** Not everyone can perform dragging motions. People with motor impairments, people using head pointers or eye tracking, and people using assistive technology that simulates clicks but not drags are all excluded by drag-only interfaces.

**How to test:** Find every draggable element on your site — sliders, sortable lists, kanban boards, map interactions, image croppers. For each one, try to achieve the same result without dragging. Can you click a point on the slider track to set the value? Can you use buttons to reorder a list? Can you use controls to pan a map? If the only way to operate it is by dragging, that's a failure.

**Effort to fix:** This varies enormously. Adding click-to-set on a slider is straightforward. Making a complex drag-and-drop interface work with keyboard controls is a significant engineering effort. If you're using third-party components, check whether they already support alternative inputs — many modern libraries do.

### Target Size — Minimum (2.5.8)

**In plain English:** Interactive elements — buttons, links, form controls — must be at least **24x24 CSS pixels** in size, or have enough spacing around them that the clickable area doesn't overlap with adjacent targets.

**Why it was added:** Small touch targets are a major barrier for people with motor impairments, tremors, or limited dexterity. They're also frustrating for everyone on mobile — tapping the wrong tiny link is a universal annoyance.

**How to test:** Inspect your interactive elements with Chrome DevTools and check their dimensions. Pay particular attention to:
- Inline text links in body copy (often smaller than 24px tall)
- Icon buttons without padding (a 16px icon in a button with no padding fails)
- Navigation items on mobile
- Close buttons on modals and banners
- Increment/decrement buttons on quantity selectors

**Exceptions:** There are several — inline links within sentences, elements where the size is controlled by the user agent (like native checkboxes), and elements that have sufficient spacing from other targets even if they're smaller than 24px.

**Effort to fix:** Low to moderate. Most fixes involve adding padding to buttons and links. A 16px icon inside a button with 4px padding on each side gives you a 24px target. For inline links, the spacing exception usually applies as long as they're not crammed next to other interactive elements.

### Accessible Authentication — Minimum (3.3.8)

**In plain English:** If your login process requires a cognitive function test — like remembering a password, solving a CAPTCHA, or recognising an image — you must provide an alternative that doesn't rely on cognition. Password managers must be able to fill in credentials, and CAPTCHAs must have non-cognitive alternatives.

**Why it was added:** People with cognitive disabilities, memory impairments, and learning disabilities can struggle with tasks that require memorisation, transcription, or puzzle-solving. A login flow that blocks password managers or relies solely on image-based CAPTCHAs excludes them.

**How to test:**
- Try logging in with a password manager (1Password, Bitwarden, browser autofill). Does it work? If your login form prevents autofill with `autocomplete="off"`, that's a problem
- If you use CAPTCHA, is there an audio alternative, a simpler challenge, or a non-cognitive option? reCAPTCHA v3 (invisible, score-based) is generally compliant. Classic "select all traffic lights" CAPTCHAs are borderline — they rely on object recognition, which is a cognitive test
- Is there a "magic link" or biometric login option as an alternative to password entry?

**Effort to fix:** Low for most sites. Remove any `autocomplete="off"` attributes from login forms. If you're using older CAPTCHA implementations, upgrade to reCAPTCHA v3 or hCaptcha's accessibility mode. If you offer social login or magic links, you likely already have a compliant alternative path.

## The Level AAA Criteria (Aspirational)

Three of the nine new criteria are Level AAA — Focus Not Obscured (Enhanced), Focus Appearance, and Accessible Authentication (Enhanced). These are worth knowing about even if most regulations don't require them:

**Focus Appearance (2.4.13)** requires that focus indicators have a minimum size (at least a 2px outline around the perimeter) and sufficient contrast. This is actually good practice regardless of compliance level — if your focus indicators are invisible or nearly invisible, keyboard users can't navigate your site.

**My recommendation:** Even if you're only targeting Level AA, implement visible focus indicators that meet the AAA Focus Appearance criteria. It's one of the simplest things you can do, and it's the difference between keyboard navigation being possible and it being pleasant.

## The Adoption Timeline

Here's where things stand in terms of regulatory adoption:

**W3C:** WCAG 2.2 became a W3C Recommendation in October 2023. It is now the current standard, and 2.1 is no longer the latest version.

**EU — European Accessibility Act:** The EAA references the EN 301 549 standard, which in turn references WCAG. The European standards bodies are in the process of updating EN 301 549 to reference 2.2 rather than 2.1. Once that update is published, 2.2 becomes the effective legal standard across the EU.

**UK — PSBAR:** The UK's Public Sector Bodies Accessibility Regulations currently reference WCAG 2.1. An update to 2.2 is expected but hasn't been formally adopted yet. However, the GDS recommends targeting 2.2 for new development.

**US — ADA:** The ADA doesn't reference a specific WCAG version. Courts and the Department of Justice have generally pointed to the most current version, which is now 2.2.

**The practical advice:** Target WCAG 2.2 Level AA for all new development. Even where regulations haven't formally updated their references, 2.2 is backwards-compatible with 2.1 — everything in 2.1 is still in 2.2, with the one exception of Parsing (4.1.1). You're not doing extra work by targeting 2.2; you're future-proofing.

## Where to Start

If your site is already compliant with WCAG 2.1 Level AA, here's the order I'd tackle the new 2.2 criteria:

1. **Consistent Help** (Level A) — Quick template check. Probably already compliant
2. **Accessible Authentication** (Level AA) — Remove `autocomplete="off"`, upgrade CAPTCHAs
3. **Redundant Entry** (Level A) — Audit multi-step forms for repeated fields
4. **Target Size** (Level AA) — Add padding to small interactive elements
5. **Focus Not Obscured** (Level AA) — Add `scroll-padding-top` for sticky elements
6. **Dragging Movements** (Level AA) — Audit drag-only interactions. May require significant work depending on your site

If your site isn't yet WCAG 2.1 compliant, don't worry about 2.2-specific criteria first — fix the fundamentals ([alt text, contrast, labels, headings](/blog/improve-accessibility-score-20-points), [keyboard access](/blog/ecommerce-accessibility-guide-online-retailers)) and then address 2.2 as part of your ongoing improvement.

## The Bottom Line

WCAG 2.2 isn't a dramatic overhaul — it's a focused update that addresses real-world gaps in 2.1, particularly around mobile usability, cognitive accessibility, and keyboard navigation. Most of the new criteria reflect things that were already considered best practice; now they're formalised requirements.

In my honest opinion, the most impactful additions are Target Size and Accessible Authentication. Small touch targets and hostile login flows are problems that affect millions of people daily, and having explicit standards for them is long overdue.

If you want to see how your site measures up against the latest WCAG criteria, run an accessibility audit on PagePulser. It tests against the current standard and flags the specific issues — including the new 2.2 criteria — so you know exactly what needs attention.

<!-- Internal linking suggestions:
- Link "WCAG 2.1" or "accessibility regulations" to the web accessibility 2026 post
- Link "alt text, contrast, labels, headings" to the improve score by 20 points post
- Link "keyboard access" to the e-commerce accessibility post
- Link "accessibility score" to the understanding accessibility scores post
- Link "European Accessibility Act" to the web accessibility 2026 post
- Link "PagePulser audit" to the main product/pricing page
-->
