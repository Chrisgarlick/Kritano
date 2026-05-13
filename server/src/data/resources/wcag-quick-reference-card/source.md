# WCAG 2.2 Quick Reference Card

The 20 WCAG failures Kritano sees most often, with the fix for each.

This is a one-page printable cheat sheet. Pin it next to your monitor. Run a new component through it before merging. The headings map to WCAG 2.2 success criteria; the fix examples are the ones that pass in practice, not just in theory.

## 1. Images missing meaningful alt text (1.1.1)

**Fail:** `<img src="chart.png">` or `<img src="chart.png" alt="image">`

**Pass:** `<img src="chart.png" alt="Bar chart showing 40% growth in Q3">` for informative images, `<img src="divider.png" alt="">` for decorative.

The alt should convey what the image conveys. If the surrounding text already does, use `alt=""`.

## 2. Insufficient text contrast (1.4.3)

**Fail:** Light grey body text (`#999999`) on white. Ratio: 2.85:1.

**Pass:** 4.5:1 minimum for body text, 3:1 for text 18pt+ or 14pt bold+. Use a tool like Stark or browser dev tools. Don't trust your eyes.

```css
/* Fail */ color: #999999;
/* Pass */ color: #595959;
```

## 3. Form fields with no label (1.3.1, 3.3.2)

**Fail:** `<input type="text" placeholder="Email">`

**Pass:** `<label for="email">Email</label><input id="email" type="email" required>`

Placeholders disappear when the user starts typing. They are not labels. Visually-hidden labels for icon-only buttons are fine (`<label class="sr-only" for="search">Search</label>`).

## 4. Keyboard trap in a modal or carousel (2.1.2)

**Fail:** A modal opens, Tab cycles inside it forever; Escape does nothing; clicking outside dismisses but Tab does not.

**Pass:** Trap focus inside the modal *while it is open*. Return focus to the trigger element on close. Escape closes the modal. The headless UI dialog primitives in most frameworks handle this; raw custom modals usually do not.

## 5. Missing focus indicator (2.4.7)

**Fail:** `:focus { outline: none; }` with nothing replacing it.

**Pass:** Either don't remove the default outline, or replace it with something at least as visible. Minimum: 2 CSS pixels thick, 3:1 contrast against the surrounding background.

```css
:focus-visible {
  outline: 2px solid #4F46E5;
  outline-offset: 2px;
}
```

## 6. Skip-to-content link missing (2.4.1)

**Fail:** First tab on the page focuses a logo link or a nav item, forcing keyboard users through the entire nav on every page.

**Pass:** First focusable element is a skip link, visually hidden until focused.

```html
<a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>
...
<main id="main">...</main>
```

## 7. Page title generic or missing (2.4.2)

**Fail:** `<title>Untitled</title>` or every page shares the same title.

**Pass:** `<title>Pricing | Kritano</title>` — describe the page, then the site.

## 8. Heading hierarchy skipping levels (1.3.1)

**Fail:** H1, then H4 with no H2 or H3 between.

**Pass:** H1, H2, H2, H3, H3, H2 — never skip down a level (skipping up to close a section is fine).

Use heading levels structurally. Don't pick them for visual size. Style them with CSS.

## 9. Single `<h1>` per page rule broken (1.3.1)

**Fail:** Three `<h1>` elements on a marketing landing page because the visual emphasis was nice.

**Pass:** Exactly one `<h1>`, matching the page's main topic.

The HTML5 sectioning model technically permits multiple H1s, but screen reader behaviour around it is inconsistent. Stick to one.

## 10. Colour-only meaning (1.4.1)

**Fail:** Required form fields shown only in red. Error messages shown only by red borders.

**Pass:** Required fields show an asterisk and `aria-required="true"`. Error messages have an icon AND red text AND `aria-invalid="true"`.

## 11. Non-text contrast (1.4.11)

**Fail:** Form input borders the same colour as the background. Disabled button text indistinguishable from the button.

**Pass:** 3:1 contrast for any UI control's boundaries against its adjacent colours. Disabled states are exempt, but should still be perceivable.

## 12. ARIA misuse (4.1.2)

**Fail:** `<div role="button" tabindex="0" onclick="...">Click</div>` — missing keyboard handler.

**Pass:** Use `<button>`. It handles keyboard, focus, role, and Enter/Space activation for free.

The first rule of ARIA: if you can use a native element with the same behaviour and meaning, use the native element. ARIA is for cases the native HTML element cannot express.

## 13. Tap targets too small (2.5.8)

**Fail:** A 16x16 pixel close button on mobile.

**Pass:** Minimum 24x24 CSS pixels for any pointer target. Aim for 44x44. Pad the hit area even if the visible element is smaller.

```css
.close { width: 44px; height: 44px; padding: 14px; }
```

## 14. Reflow at narrow viewports broken (1.4.10)

**Fail:** Page requires horizontal scrolling at 320 CSS pixels wide.

**Pass:** Content reflows. The exception is content that genuinely needs two dimensions (maps, tables of comparison data, code blocks).

Test by setting your browser to 320px width or by emulating an iPhone SE in dev tools.

## 15. Auto-playing video or audio (1.4.2)

**Fail:** A video starts with sound on page load.

**Pass:** Auto-play is muted by default, or there is a clearly visible pause/stop control accessible before the audio begins, or content is under 3 seconds total.

## 16. Time limits without warning (2.2.1)

**Fail:** A checkout session expires after 5 minutes with no indication.

**Pass:** Either remove the limit, allow the user to turn it off, allow them to adjust it (10x default), or warn 20 seconds before expiry with a "Stay logged in" option.

Exceptions: real-time auctions, anti-fraud session timeouts where adjustment would defeat the purpose. Document the exception.

## 17. Animations that can't be turned off (2.3.3)

**Fail:** Parallax effects on scroll. Infinite-loop hero animations. Cannot be paused.

**Pass:** Respect `prefers-reduced-motion`.

```css
@media (prefers-reduced-motion: reduce) {
  .hero { animation: none; }
  * { transition: none !important; }
}
```

## 18. Sufficient redundant entry (3.3.7)

**Fail:** Form asks for the same email twice in a multi-step flow with no autofill or carryover.

**Pass:** Information the user has already provided in the session is either prefilled, selectable from a list, or automatically transferred.

Exception: re-entry for security purposes (password confirmation on first set), where redundant entry is essential.

## 19. Authentication relies on cognitive function (3.3.8)

**Fail:** Login requires the user to identify objects in pictures (image CAPTCHA) with no alternative.

**Pass:** Provide an alternative. Common acceptable alternatives:
- Email magic links
- Passkeys
- Biometric where available
- A no-CAPTCHA challenge for trusted devices

If you must use a cognitive challenge, make sure there is a non-cognitive path through.

## 20. Status messages not announced (4.1.3)

**Fail:** A toast notification appears saying "Saved", but a screen reader never speaks it.

**Pass:** Use `aria-live` with the right politeness level.

```html
<div role="status" aria-live="polite">Saved</div>
<div role="alert" aria-live="assertive">Error: connection lost</div>
```

`polite` for informational updates (saved, copied). `assertive` for critical (errors, warnings).

## How to use this card

1. Pin it where the team writes code.
2. Run any new component through every check on the list before merging.
3. When something fails, link the offending pull request comment to the relevant item by number.
4. Kritano scans against all of these (and the rest of WCAG 2.2 AA) automatically on every audit run.

[Start a free scan at kritano.com](https://kritano.com).
