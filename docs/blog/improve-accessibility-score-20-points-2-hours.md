---
title: "How to Improve Your Website Accessibility Score by 20+ Points in Under 2 Hours"
slug: "improve-accessibility-score-20-points"
date: "2026-03-18"
author: "Chris Garlick"
description: "Most websites score 40-60 on accessibility. Here are the quick wins that can boost your score by 20+ points in under 2 hours — no developer required."
keyword: "improve accessibility score"
category: "accessibility"
tags:
  - "accessibility"
  - "wcag"
  - "website-audit"
post_type: "how-to"
reading_time: "7 min read"
featured: false
---

# How to Improve Your Website Accessibility Score by 20+ Points in Under 2 Hours

You've just run your first accessibility audit — maybe through PagePulser, maybe through Lighthouse — and the number staring back at you is... not great. Maybe it's a 45. Maybe it's a 58. Either way, it's lower than you expected and you're wondering how much time and money it's going to take to sort it out.

Here's the good news: most websites score between 40 and 60 on their first accessibility audit, and the reasons are almost always the same handful of issues. Even better, those issues are some of the fastest and easiest to fix. I've seen sites jump 20, 25, even 30 points in a single afternoon by tackling just four or five things.

Let me walk you through exactly what to fix, how to fix it, and how much each one is likely to improve your score.

## Before You Start

You'll need your audit results open — either your PagePulser report or a Lighthouse accessibility audit. These will show you the specific issues on your site, which makes everything faster because you're not hunting for problems, you're working through a list.

If you haven't run an audit yet, do that first. It takes about five minutes and gives you the roadmap for everything below.

## Fix 1: Add Alt Text to All Images

**Expected impact: +5-10 points | Time: 15-30 minutes**

Missing alt text is the single most common accessibility issue I see — it shows up on roughly 89% of sites we audit. Every time a screen reader hits an image without alt text, it either skips it entirely or reads out the filename. Neither is useful.

**How to fix it:**

- Go through your pages and add a descriptive `alt` attribute to every meaningful image. Describe what the image shows, not what it is — "Woman reviewing analytics dashboard on a laptop" is useful, "photo1.jpg" is not
- Keep it concise. Aim for under 125 characters. Screen readers don't pause mid-alt-text, so long descriptions become exhausting to listen to
- **Decorative images** — background patterns, visual flourishes, generic stock photos that add no information — should get an empty alt attribute: `alt=""`. This tells screen readers to skip them, which is exactly what you want
- Don't start with "Image of" or "Picture of." Screen readers already announce that it's an image before reading the alt text, so you'd get "Image. Image of a bicycle" — redundant

**If you're on WordPress:** Go to your Media Library, filter by "Unattached" or browse through your images, and fill in the "Alt Text" field for each one. If you've got a lot of images, the WP Accessibility plugin can help flag the gaps.

This fix alone is usually worth 5-10 points because alt text failures are weighted heavily — they're a Level A WCAG requirement, which means they're considered fundamental barriers to access.

## Fix 2: Fix Colour Contrast

**Expected impact: +3-8 points | Time: 15-30 minutes**

Insufficient colour contrast affects around 76% of websites. The issue is almost always the same: light grey text on a white background, or white text on a pastel-coloured button. It looks subtle and "clean" in your design, but it's genuinely difficult to read for anyone with low vision — and uncomfortable for everyone else in bright lighting.

**The rules are simple:**

- Normal text needs a contrast ratio of at least **4.5:1** against its background
- Large text (18px bold or 24px regular) needs at least **3:1**
- This applies everywhere — body text, navigation links, form placeholder text, button labels, text over images

**How to fix it:**

- Your audit report will flag the specific elements that fail. Work through them one by one
- Usually it's a matter of darkening your text slightly or choosing a deeper shade for coloured backgrounds. Going from `#999999` to `#767676` on a white background is the difference between failing and passing
- Use the **WebAIM Contrast Checker** to test your colour pairs before committing to changes
- Pay special attention to placeholder text in form fields — this is the one designers miss most often, because placeholders are intentionally lighter. They still need to meet 4.5:1

**The honest take:** Sometimes fixing contrast means adjusting your brand colours slightly. That conversation with your designer can be uncomfortable, but it's worth having. A colour that nobody can read isn't doing your brand any favours.

## Fix 3: Fix Heading Hierarchy

**Expected impact: +2-5 points | Time: 15-20 minutes**

Screen reader users navigate pages by jumping between headings — it's like a table of contents for people who can't see the visual layout. When your headings skip levels or are used for styling rather than structure, that navigation breaks completely.

**How to fix it:**

- Every page should have exactly **one H1** — your page title
- Major sections should use **H2**. Subsections within those should use **H3**
- Never skip levels. Going from H2 to H4 tells a screen reader there's a subsection they can't find
- If you're using heading tags just to make text bigger or bolder, **use CSS instead**. A `<span>` with a font-size class does the same visual job without breaking the document outline

**Quick check:** Install the HeadingsMap browser extension. It shows you the heading hierarchy of any page as a nested outline. If the outline looks logical and complete, you're good. If it looks chaotic or has gaps, those are the pages to fix.

## Fix 4: Add Form Labels

**Expected impact: +3-7 points | Time: 10-20 minutes**

Every form input on your site — every text field, dropdown, checkbox, and search box — needs a visible label that's programmatically linked to it. Placeholder text doesn't count. When someone starts typing, the placeholder disappears, leaving no indication of what the field is for.

**How to fix it:**

- Add a `<label>` element for each input, linked via the `for` attribute matching the input's `id`
- Make sure labels are **visible**, not hidden with CSS. Screen-reader-only labels are a last resort, not a default
- Don't forget the easy-to-miss ones: search fields (usually just a magnifying glass icon with no label), newsletter signup inputs, and login forms
- For checkboxes and radio buttons, the label should be next to the control and clickable — tapping the label should toggle the input

**If you're on WordPress:** Check your contact form plugin. Contact Form 7, WPForms, and Gravity Forms all support labels, but they're not always enabled by default. Go through each form and make sure every field has one.

## Fix 5: Set the Document Language

**Expected impact: +1-2 points | Time: 2 minutes**

This is the quickest fix on the list and one of the most commonly missed. Your HTML tag needs a `lang` attribute:

```html
<html lang="en">
```

Without it, screen readers don't know what language to use for pronunciation. A page without a declared language might be read with French pronunciation rules applied to English text — which is as confusing as it sounds.

**How to fix it:** Open your main HTML template (or your `header.php` file on WordPress) and add `lang="en"` to the opening `<html>` tag. If your site is in another language, use the appropriate code (`de` for German, `fr` for French, etc.).

Two minutes. Done. One to two points.

## Fix 6: Make Links Descriptive

**Expected impact: +2-4 points | Time: 10-15 minutes**

Screen reader users often pull up a list of all links on a page to navigate quickly. If half your links say "click here" or "read more," that list is useless — they all sound identical with no indication of where they go.

**How to fix it:**

- Replace "click here" with descriptive text: "Read our accessibility guide" instead of "Click here to learn more"
- Replace generic "Read more" links with the specific topic: "Read more about colour contrast" or, better yet, just make the article title the link
- Search your site content for "click here" — most CMS platforms have a search function that makes this quick

## What to Expect

If you work through all six fixes, you should see a score improvement of roughly **15-30 points**, depending on your starting point and how many instances of each issue your site has. A site that starts at 45 with hundreds of unlabelled images will see a bigger jump than one starting at 65 with a few contrast issues.

Here's the realistic breakdown:

| Fix | Impact | Time |
|-----|--------|------|
| Alt text | +5-10 points | 15-30 min |
| Colour contrast | +3-8 points | 15-30 min |
| Heading hierarchy | +2-5 points | 15-20 min |
| Form labels | +3-7 points | 10-20 min |
| Document language | +1-2 points | 2 min |
| Descriptive links | +2-4 points | 10-15 min |
| **Total** | **+16-36 points** | **~90-120 min** |

## After the Quick Wins

Once you've made these changes, re-run your audit. The score improvement is usually immediate and satisfying — there's something genuinely motivating about watching a number jump from 48 to 72 in an afternoon.

But in my honest opinion, the real value isn't the number. It's that every one of these fixes makes your website usable by people who couldn't use it before. Someone who was staring at invisible grey text can now read your content. Someone whose screen reader was announcing "image, image, image" can now understand what your photos show. Someone who couldn't figure out which form field was which can now fill in your contact form and become a customer.

These are the fixes that matter most — not because they move a score, but because they remove real barriers for real people. The score is just a nice way to track progress.

From here, work through the remaining issues in your audit report, starting with anything flagged as critical or serious. Progress over perfection. Every fix helps.

If you want to see exactly where your site stands and get a prioritised list of what to fix first, run a free audit on PagePulser. It takes five minutes and gives you the roadmap for everything above.

<!-- Internal linking suggestions:
- Link "alt text" to the complete guide to image alt text post
- Link "colour contrast" to the accessibility scores explainer post
- Link "WCAG" to the web accessibility 2026 state of the web post
- Link "heading hierarchy" to the website launch checklist post
- Link "accessibility score" to the understanding accessibility scores post
- Link "PagePulser" or "free audit" to the main product/pricing page
-->
