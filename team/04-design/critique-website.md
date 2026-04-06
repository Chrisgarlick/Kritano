<!-- Version: 1 | Department: critique | Target: public website | Updated: 2026-04-05 -->

# Public Website — Critique

## Overall Score: 29/50

| Dimension | Score | Summary |
|-----------|-------|---------|
| Specificity | 6/10 | The hero score card is genuinely tied to the product, but the rest of the site reads like any SaaS template with Kritano's name swapped in |
| Distinction | 5/10 | The Instrument Serif typography gives editorial weight, but every layout is the same: centered text → card grid → CTA bar, page after page |
| Craft | 7/10 | Clean execution, consistent spacing, proper accessibility, structured data on every page — the foundations are solid |
| Usefulness | 6/10 | Tells you *what* Kritano does, but doesn't *show* you — no screenshots, no before/after, no live demo, no social proof |
| Ambition | 5/10 | Safe, professional, and completely forgettable — nothing here would stop someone mid-scroll or make them bookmark the page |

## What's Strong

### 1. The hero score card is the right idea
The homepage hero shows a mock audit result card with category score rings, severity dots, and a domain label. This directly mirrors the real product UI, which is smart — it tells the visitor exactly what they'll get. The score rings use the actual category colours from the app. This is the most distinctive element on the entire website.

### 2. Typography creates editorial authority
Instrument Serif for headlines gives every page a magazine-quality weight that most SaaS sites lack. Combined with Outfit for body text, the pairing creates a genuine personality — authoritative without being stuffy. The consistent use of uppercase tracking-wider label text ("Website Intelligence Platform", "Capabilities", "How It Works") reinforces the editorial feel.

### 3. Technical foundations are well-executed
Every page has proper structured data (JSON-LD), semantic HTML, aria labels, focus management, and skip links. The pricing page has FAQ schema. The contact form has proper required/aria-required attributes. The navigation has a proper services dropdown with hover intent. These details matter for credibility — especially for a product that *audits websites*.

## What's Generic

### 1. Every page follows the exact same template
Every single page uses this structure: `Hero (left-aligned text + optional right element) → Section with cards in a grid → Another section with different cards in a grid → Centered CTA`. The visual rhythm is monotonous:

- **Homepage**: Hero → 6 feature cards (3×2 grid) → 3 step cards → 4 stat items → CTA
- **Services**: Hero → 4 zig-zag sections (each identical structure) → 4 mini-feature cards → CTA
- **About**: Hero → 2-column layout (text + 4 value cards) → story section → CTA
- **Pricing**: Hero → 5 pricing cards → comparison table → FAQ accordions → CTA
- **Contact**: Hero → 2-column (form + sidebar with 3 info cards) → nothing

There is no visual surprise anywhere. No full-bleed image. No asymmetric layout. No section that makes you think "I haven't seen this before." Put these pages next to Plausible, Cal.com, or Resend and the spatial design is interchangeable.

### 2. Zero social proof or evidence
The website makes claims ("500+ rules", "< 2min", "6 audit categories") but shows zero evidence that anyone actually uses or trusts the product. There are no:
- Customer logos or testimonials
- Case study references
- User count or audit count ("10,000+ audits run")
- Screenshots of real audit results
- Before/after score comparisons
- Trust badges or certifications

The About page has a "From frustration to solution" story, but it reads like a template founder narrative. For a product whose entire value proposition is *trust and transparency*, the website itself provides neither.

### 3. Feature cards are interchangeable wallpaper
The homepage has 6 feature cards. Each is: `[coloured icon square] + [bold title] + [one-sentence description]`. They look identical except for the icon colour. The descriptions are generic enough to appear on any audit tool's website:

- "Core Web Vitals, broken links, metadata optimization..." — this could be Lighthouse, Semrush, Screaming Frog, or any of 50 other tools
- "Legal compliance audits for screen readers, keyboard navigation..." — this could be axe, WAVE, Siteimprove, or Deque

None of these cards tell you *why Kritano is different*. The strategy positioning says Kritano's uniqueness is **Content Intelligence** (E-E-A-T, AEO, readability scoring) — but there's no dedicated feature card or section for this on the homepage. The actual differentiator is buried.

### 4. The CTA sections are repetitive and low-energy
Every page ends with the same pattern: a centered heading, a paragraph, and a "Start Free Audit" button. The homepage CTA is the only one with visual interest (indigo background with grid pattern), but even that feels template-generated. The other pages just have plain white background CTAs that blend into the page above them.

## Recommendations

### 1. Add a live audit demo to the homepage hero
**What:** Replace the static mock score card with a working "enter your URL" field that runs a real quick-scan (or shows a pre-cached demo result) directly on the homepage. Alternatively, show an animated sequence of a real audit running — pages being discovered, scores appearing, findings populating.
**Why:** The current hero *tells* visitors what Kritano does. A live demo *shows* them. Every great product-led SaaS (Vercel, Linear, Raycast) lets you experience the product before signing up. The score card mockup is static with hardcoded numbers — it doesn't feel real. A working audit would be the single most powerful conversion tool on the page. Even a pre-recorded animation of a real audit would be more compelling than a static card.
**How:** Option A (high effort): Build a lightweight "instant scan" endpoint that checks a single URL for ~10 key rules and returns scores in <5 seconds, rendered directly on the homepage. Option B (medium effort): Create an animated sequence (CSS keyframes or Framer Motion) that shows the score card filling in — pages discovered counting up, score rings animating, findings appearing one by one. Option C (low effort): Replace the static card with a looping video/GIF of a real audit in the actual app.

### 2. Create a visual hierarchy that differentiates the homepage sections
**What:** Each homepage section should have a distinct visual treatment, not the same white/slate-50 alternation. Specifically:
- **Hero**: Keep the current editorial style but add a subtle animated grid or dot pattern background (like the CTA section already has, but lighter)
- **Features**: Instead of 6 identical cards in a grid, make the primary differentiator (Content Intelligence / E-E-A-T / AEO) a full-width hero feature with a screenshot or illustration, then show the 4 standard categories below as a compact row
- **How It Works**: Replace the 3 identical centered text blocks with a horizontal stepper that includes small illustrations or screenshots of each step
- **Stats**: The dark section is good — it's the one visual break. Add the pulse animation from the brand guidelines to the numbers
- **CTA**: The indigo CTA with grid pattern is the best section on the page. Keep it.
**Why:** Right now, scrolling the homepage feels like reading a list. There's no visual rhythm — no tension between wide and narrow, dark and light, dense and sparse. The sections blend into each other. A visitor scanning quickly can't distinguish what's important because everything looks the same.
**How:** The Content Intelligence hero feature should be a wide card with an illustration or screenshot on the left and a description on the right, using a subtle teal-50 background to distinguish it from the standard indigo palette. This immediately communicates "this is what makes us different" before the visitor reaches the standard feature grid.

### 3. Add social proof — even minimal
**What:** Add at least one form of social proof to the homepage: a "10,000+ audits completed" counter, a row of client logos (even if they're small businesses), or 2-3 short testimonial quotes.
**Why:** The website currently has zero evidence that anyone uses or trusts Kritano. For a product that evaluates trustworthiness (E-E-A-T literally includes Trust), the absence of social proof is ironic. Even a simple "Trusted by 500+ website owners" with a few small avatar circles would increase conversion significantly. Visitors to a pricing page need reassurance that other people have made this purchasing decision and been satisfied.
**How:** Add a thin social proof bar between the hero and the features section: `"[avatar circles] Trusted by X website owners | Y audits completed"`. If you don't have testimonials yet, use the audit count from your database as a real-time metric. Even "42 audits completed today" is more convincing than nothing.

### 4. Make the pricing cards scannable at a glance
**What:** The 5 pricing cards are currently dense text blocks that all look the same except for the Pro card (dark background). Add visual distinction: give each tier a coloured top border or accent stripe, add the most important metric (pages per audit) as a large display number, and reduce the feature list to 3-4 items with a "See all features" link to the comparison table.
**Why:** With 5 cards in a row, each containing 5-7 bullet points in xs text, the pricing page requires significant cognitive effort to compare plans. Visitors scan pricing pages in seconds — they need to see the key difference between tiers immediately. Right now the cards reward reading, not scanning. The Free card and Starter card look nearly identical at a glance.
**How:** Each card gets a 3px top border in its tier colour (slate for Free, indigo for Starter, violet for Pro, amber for Agency, emerald for Enterprise). The page count becomes a large display number (`font-display text-2xl`) above the feature list. Feature lists are trimmed to the 3-4 most differentiating items, with "View full comparison" text link below.

### 5. Break the About page out of the template
**What:** The About page is the most template-feeling page on the site. It uses the exact same layout patterns as every other page. Instead, make it feel human: add a photo or illustration of the founder, include a real quote in the founder's voice (from the brand voice guide — "I" voice, conversational), and show the product's journey visually (a simple timeline: "Jan 2025: First prototype → Mar 2025: Public beta → ...").
**Why:** The brand voice guide explicitly says the blog and About content should carry the founder's human voice. But the About page reads like corporate committee copy: "We believe every website deserves a health check" could be on any website. The Story section is better but still generic. For a solo-founder product competing on authenticity and trust, the About page should feel personal and specific. Visitors who click "About" are already interested — give them a reason to believe in the person behind the product, not just the product.
**How:** Replace the hero with a more personal opening: the founder's photo (or a stylised illustration), a direct quote in Instrument Serif italic, and a one-line bio. The "From frustration to solution" section becomes a visual timeline with specific dates and milestones. The values section stays but gets specific examples instead of generic descriptions.

## Competitor Comparison

**Plausible Analytics (plausible.io):** Uses a live, interactive demo on the homepage — you can explore a real dashboard with real data without signing up. This is the gold standard for product-led marketing. Kritano shows a static mock; Plausible shows the real thing.

**Cal.com (cal.com):** Uses a split hero with a working scheduling widget on the right side. You can book a call directly from the homepage. The product IS the marketing. Cal.com's feature sections use alternating layouts with screenshots, not identical card grids.

**Resend (resend.com):** Minimal, high-contrast design with a dark hero and a single code snippet that shows what the product does in 3 lines. No card grids. No feature walls. Just: "here's what it does, here's what it looks like, try it." Their About page has real founder photos and a genuine voice.

**What Kritano can learn:** All three competitors let you *experience* the product on the website, not just read about it. Kritano's homepage tells you about features; it should show you the product working.

## Verdict

The public website is well-crafted technically — clean code, consistent spacing, proper accessibility, structured data — but visually and strategically, it's a template dressed in a good typeface. Every page follows the same layout pattern, there's no social proof, and the actual product differentiator (Content Intelligence) is underrepresented. The single most impactful change would be **recommendation 1**: replacing the static hero score card with something that shows the product in action — a live demo, an animated sequence, or at minimum a real screenshot. That one change would transform the homepage from "a website that describes an audit tool" to "a website that demonstrates an audit tool." For a product whose brand is built on clarity and evidence, the website should be evidence itself.
