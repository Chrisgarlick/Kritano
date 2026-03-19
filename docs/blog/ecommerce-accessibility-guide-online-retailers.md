---
title: "E-Commerce Accessibility: A Complete Guide for Online Retailers"
slug: "ecommerce-accessibility-guide-online-retailers"
date: "2026-03-18"
author: "Chris Garlick"
description: "Your online shop might be turning away customers without you knowing. Here's how to make product pages, checkout flows, and filters accessible to everyone."
keyword: "e-commerce accessibility"
category: "accessibility"
tags:
  - "accessibility"
  - "wcag"
  - "e-commerce"
  - "website-audit"
post_type: "how-to"
reading_time: "8 min read"
featured: false
---

# E-Commerce Accessibility: A Complete Guide for Online Retailers

Imagine trying to buy a pair of shoes online, but you can't see the product photos. You can't tell which size is currently selected. The colour filter doesn't respond to your keyboard. And when you finally get to checkout, the form fields aren't labelled so you're guessing which box is asking for your card number and which wants your postcode.

That's the reality of online shopping for millions of people with disabilities — and it's happening on your website right now if you haven't specifically designed against it.

E-commerce accessibility isn't just an ethical issue, though it absolutely is that. It's a commercial one. The disability community controls over **$13 trillion** in annual disposable income globally. In the UK alone, the "Purple Pound" is worth approximately $309 billion. If your shop isn't accessible, you're not just excluding people — you're actively turning away customers who want to give you money.

And with the European Accessibility Act now in full force, it's also a legal requirement for anyone selling to EU consumers. This isn't theoretical. Let me walk you through the specific areas where e-commerce sites most commonly fail and exactly how to fix them.

## Product Pages

Product pages are where the shopping decision happens, and they're riddled with accessibility problems on most sites I audit.

### Product Images

Every product image needs descriptive alt text — not "product image" or "IMG_4521.jpg," but an actual description of what the image shows. For a clothing retailer, that means including the colour, the style, and what makes the image different from the other product photos:

- **Bad:** `alt="dress"` — Which dress? What colour? What view?
- **Good:** `alt="Navy blue midi wrap dress with short sleeves, front view on model"`

If you have multiple images showing different angles, each one needs its own alt text describing that specific view: front, back, detail of the fabric, close-up of the stitching. A screen reader user viewing your product page should get the same level of visual information as everyone else — just in words rather than pixels.

**Image zoom features** need to be keyboard accessible too. If your zoom only works on mouse hover, keyboard and screen reader users can't access the detail view. Make sure zoom can be triggered with keyboard focus and that the zoomed content is announced to assistive technology.

### Product Variants (Size, Colour, Quantity)

This is one of the trickiest areas, and most sites get it wrong. When a customer selects a colour or size:

- **The selected option must be clearly indicated** — not just visually (a highlighted border) but programmatically. Use `aria-selected="true"` or proper radio button inputs so screen readers announce which option is chosen
- **Colour swatches need text labels**, not just colour circles. A red dot means nothing to someone who can't see it. Add a visible label or at minimum a tooltip and an `aria-label` with the colour name
- **Out-of-stock variants** need to be announced, not just visually greyed out. Use `aria-disabled="true"` and ideally a text label like "(Sold out)" that screen readers can pick up
- **Quantity selectors** should use proper `<input type="number">` with a visible label, not custom JavaScript widgets that don't expose their state to assistive technology

### Price and Availability

- Prices need to be in actual text, not embedded in images
- Sale prices should clearly indicate both the original and discounted price, with the relationship between them clear to screen readers. Something like `<s>Was £45.00</s> Now £29.00` with appropriate `aria-label` if the visual layout is more complex
- Stock status should be in text, not just conveyed through colour (a green dot for in-stock and a red dot for out-of-stock fails colour-blind users)

### Reviews and Ratings

Star ratings are one of the most commonly inaccessible elements I see. Five star icons with no text alternative are meaningless to a screen reader. Add an `aria-label` like "Rated 4.2 out of 5 stars" and ensure individual review text is properly structured with headings.

## Checkout Flow

If your checkout is inaccessible, everything else is academic — the customer has found what they want, decided to buy it, and now your checkout is the barrier between their money and your bank account.

### Form Labels and Validation

This is foundational. Every single field in your checkout form needs a visible `<label>` element programmatically linked to its input. Every one. That includes:

- Name fields (first name, last name — labelled separately, not just "Name")
- Address fields (each line labelled individually)
- Card number, expiry, and CVV
- Email and phone
- The billing/shipping address toggle

**Placeholder text is not a label.** The moment someone starts typing, the placeholder disappears. For a sighted user this is annoying; for a screen reader user relying on labels, the field becomes unidentifiable.

**Error handling** needs to be specific, visible, and announced. "Please correct the errors below" with a red border on a field isn't enough. Each error message should appear next to the relevant field, explain what's wrong ("Please enter a valid UK postcode"), and be announced to screen readers using `aria-describedby` or a live region.

### Multi-Step Checkouts

If your checkout spans multiple pages or steps:

- **Indicate progress clearly.** A visual progress bar is good, but it also needs text: "Step 2 of 4: Shipping address." Screen reader users need to know where they are in the process
- **Don't lose data on navigation.** If someone goes back a step, their previously entered information should still be there. Losing form data is frustrating for everyone; for someone who uses assistive technology and takes longer to fill in forms, it's a dealbreaker
- **Allow sufficient time.** If your checkout session expires, give plenty of warning and the ability to extend. WCAG requires that users be warned before time runs out and given the option to continue

### Payment Integration

Third-party payment forms (Stripe, PayPal, Worldpay) are a common accessibility blind spot because they're embedded iframes that you don't directly control. However:

- **Test them.** Tab through the payment form with your keyboard. Try it with a screen reader. If the third-party form isn't accessible, that's your problem to solve — your customers don't care whose code it is
- **Stripe Elements** and **PayPal's accessible checkout** have both improved significantly in recent years, but they still need proper labels on your end for the surrounding context
- **Provide alternatives.** If your primary payment form has accessibility issues, make sure there's a fallback — PayPal, phone ordering, or a simpler form layout

### Order Confirmation

The confirmation page should clearly announce that the order was successful. Don't rely on a colour change or icon alone. A clear heading — "Order confirmed" — and a summary of what was purchased, the total, and the expected delivery gives screen reader users the same confidence that their order went through.

## Filters and Search

Product filtering and search are where e-commerce accessibility falls apart most dramatically, because these interfaces tend to be heavily custom-built with JavaScript and rarely tested with assistive technology.

### Search

- The search input needs a **visible label** or at minimum an `aria-label`. A magnifying glass icon with no text is not a label
- **Autocomplete suggestions** must be keyboard navigable. Can you arrow-key through them? Does pressing Enter select the highlighted option? Is the currently highlighted suggestion announced to screen readers?
- **Search results** should announce how many results were found. "Showing 47 results for 'blue dress'" as a live region update or heading gives context immediately

### Filters

Filters are the hardest piece to get right, and I won't pretend there's a quick fix — but these are the non-negotiables:

- **Every filter control needs a label.** Checkboxes for "Size: Small, Medium, Large" need to be actual `<input type="checkbox">` elements with associated `<label>` elements, not styled `<div>` elements with click handlers
- **Results must update accessibly.** When someone applies a filter, the updated result count and products need to be announced. Use an `aria-live="polite"` region to announce "Showing 12 results" after filtering, so screen reader users know the page changed
- **Filter state must be clear.** Which filters are currently active? Sighted users see highlighted buttons or checked boxes. Screen reader users need `aria-pressed`, `aria-checked`, or equivalent states exposed programmatically
- **Clear all / remove filter** should be keyboard accessible and clearly labelled. "X" is not a label. "Remove size filter: Medium" is

### Sorting

Dropdown sorting menus ("Sort by: Price low to high") need proper `<select>` elements or ARIA-compliant custom dropdowns. When the sort order changes, the page content should update and focus should either remain in a logical position or move to the updated results with an announcement.

## Mobile Accessibility for E-Commerce

Over 60% of e-commerce traffic is mobile, and mobile introduces its own set of accessibility challenges on top of everything above.

### Touch Targets

Buttons, links, and interactive elements need to be large enough to tap accurately. WCAG 2.2 specifies a minimum target size of **24x24 CSS pixels**, with a recommendation of 44x44. This matters especially for:

- Add to basket buttons
- Quantity increment/decrement buttons (those tiny +/- controls are a nightmare on mobile)
- Filter checkboxes
- Colour swatches
- Navigation menu items

If your users are regularly tapping the wrong thing, your touch targets are too small.

### Pinch-to-Zoom

**Never disable pinch-to-zoom.** I still see e-commerce sites with `<meta name="viewport" content="... maximum-scale=1.0, user-scalable=no">` in their HTML. This prevents people with low vision from zooming in to read text or see product details. It's a WCAG Level AA failure and it's easy to fix — just remove those attributes.

### Mobile Forms

Checkout forms on mobile need appropriate `inputmode` attributes so the right keyboard appears — numeric keyboard for card numbers and phone fields, email keyboard for email fields. This isn't strictly an accessibility requirement, but it significantly reduces friction for everyone and is essential for users with motor impairments who find switching keyboard modes difficult.

### Orientation

Don't lock your site to portrait mode. Some users with motor impairments have their device mounted in a specific orientation. WCAG requires that content works in both portrait and landscape unless a specific orientation is essential.

## The Honest Take on Overlays

I should address this directly, because I know someone reading this is thinking "can't I just install an accessibility overlay widget and tick the box?"

No. Accessibility overlays — those floating toolbar widgets that promise to make your site compliant with one line of JavaScript — don't work. They can't fix structural issues like missing form labels, broken heading hierarchy, inaccessible custom components, or keyboard traps. Many accessibility professionals and disability advocacy organisations have publicly spoken against them. Some have even been the subject of legal action for making misleading compliance claims.

There's no shortcut. E-commerce accessibility requires the actual product experience to be built correctly. The good news is that most of the fixes I've described are straightforward — they're about using HTML properly, not about complex engineering.

## Wrapping Up

E-commerce accessibility is about one thing: making sure everyone can complete the journey from browsing to buying. Every barrier in that journey — an unlabelled form field, an inaccessible filter, a colour swatch with no text — is a point where you lose a customer who was ready to spend money.

In my honest opinion, the biggest mistake online retailers make isn't ignoring accessibility entirely — it's assuming their platform handles it. Shopify, WooCommerce, Magento — they all provide a reasonable starting point, but your theme, your plugins, your custom components, and your content all introduce issues that only you can fix.

If you want to see where your shop stands, run an accessibility audit on PagePulser. It'll flag the specific issues across your product pages, checkout, and navigation — and help you prioritise the fixes that remove the biggest barriers for the most customers.

<!-- Internal linking suggestions:
- Link "alt text" to the complete guide to image alt text post
- Link "colour contrast" to the improve accessibility score post
- Link "form labels" to the understanding accessibility scores post
- Link "European Accessibility Act" to the web accessibility 2026 post
- Link "Core Web Vitals" to the CWV explainer post
- Link "PagePulser audit" to the main product/pricing page
-->
