# The European Accessibility Act Compliance Guide

What the EAA requires, who it applies to, and a clause-by-clause audit you can run today.

The European Accessibility Act (Directive 2019/882) became enforceable on 28 June 2025. If you sell into the EU and your product touches one of the covered categories, you are now responsible for meeting it. This guide unpacks what it actually asks for, where the obligations bite, and how to audit your site against it before someone else does.

This is not legal advice. It is a practical engineering guide written from the perspective of someone running audits against real sites every week.

## How to use this guide

1. Confirm the EAA applies to you (section 1).
2. Identify your obligations as either an economic operator or service provider (section 2).
3. Run the clause-by-clause technical audit (section 3).
4. Document conformance, evidence, and remediation actions (section 4).
5. Establish the ongoing process: monitoring, reporting, complaint handling (section 5).

If your scan shows gaps, treat the **[urgent]** items as the ones a regulator or claimant would notice first. Everything else is quality bar.

## 1. Does it apply to you?

The EAA covers products and services placed on the EU market on or after 28 June 2025. It is **product-and-service-scoped**, not country-scoped. Selling from outside the EU does not exempt you.

### Covered services include

- E-commerce (any consumer-facing online sales channel)
- Banking services and consumer-facing payment services
- Consumer-grade ATMs and self-service terminals
- Passenger transport services (websites, mobile apps, ticketing machines)
- Audiovisual media services and access to them
- E-books and dedicated software
- Electronic communications services
- Emergency communications via the 112 number

### Covered products include

- Consumer general-purpose computer hardware systems and their operating systems
- Self-service terminals (payment terminals, ATMs, ticketing machines, check-in)
- Consumer terminal equipment for electronic communications
- Consumer terminal equipment used to access audiovisual media services
- E-readers

### The exemptions worth knowing about

- **Microenterprises providing services.** Companies with fewer than 10 employees AND annual turnover or balance sheet total of EUR 2 million or less are exempt for services (but not for products).
- **Disproportionate burden clause (Article 14).** Compliance can be partial if the cost is judged disproportionate to the benefit. This is documented, justified, and audited. It is not "we did not get round to it." Microenterprises must still document the assessment.
- **Fundamental alteration clause.** If full compliance would require changing the basic nature of the product or service, partial compliance is allowed with documentation.

If you are an EU-based business with employees and consumer-facing digital products, the EAA almost certainly applies to you. Plan accordingly.

## 2. Who is responsible

The EAA distinguishes four roles. You can be more than one.

- **Manufacturer**: places a product on the market under their name or trademark. Bears the strictest obligations. Must produce a technical file, issue an EU declaration of conformity, and affix the CE marking.
- **Importer**: brings a product from outside the EU into the EU market. Verifies the manufacturer's documentation; refuses non-compliant product.
- **Distributor**: makes a product available in the EU after it has been placed on the market. Verifies CE marking and required documentation.
- **Service provider**: provides one of the covered services to EU consumers. Issues a general accessibility statement and complaint mechanism.

If you run an e-commerce site selling into the EU, you are a service provider, and almost certainly a distributor for any hardware you ship. Both sets of obligations apply.

## 3. Clause-by-clause audit

The EAA references the technical standard **EN 301 549 v3.2.1**, which in turn maps closely to **WCAG 2.1 AA** for web content. WCAG 2.2 is not yet legally required but is recommended, and Kritano audits against it for forward-compatibility.

The following audit organises EAA obligations into the seven areas where engineers actually have something to verify.

### 3.1 Perceivability of web content

- [ ] **[urgent]** Every non-decorative image has a meaningful `alt` attribute.
- [ ] Audio content has a transcript; video has captions and audio description where the meaning depends on it.
- [ ] Text contrast meets 4.5:1 for body text and 3:1 for large text against its background.
- [ ] Information is never conveyed by colour alone. Error states use an icon or text label too.
- [ ] Content reflows at 320 CSS pixels of width without horizontal scrolling or loss of information.
- [ ] Pages are operable at 200% zoom and at user-defined text spacing without breaking.
- [ ] Pre-recorded video has captions; live video has captions where reasonably possible.

### 3.2 Operability

- [ ] **[urgent]** Every interactive element is reachable and operable with the keyboard alone.
- [ ] Focus order through the page is logical and predictable.
- [ ] Focus indicator is visible on every focusable element with at least 3:1 contrast and 2 CSS pixel thickness.
- [ ] No keyboard traps. Tab and Shift+Tab move freely through the page.
- [ ] **[urgent]** A skip-to-content link is the first focusable element on every page.
- [ ] Tap targets on mobile are at least 24x24 CSS pixels (aim for 44x44).
- [ ] Timing on time-limited operations (sessions, forms) is adjustable, extendable, or removable.
- [ ] No content flashes more than three times in any one-second period.

### 3.3 Understandability

- [ ] **[urgent]** `<html lang="...">` is set on every page with the correct language code.
- [ ] Page titles describe the topic or purpose. Generic titles ("Untitled", "Home", "Page") are not acceptable.
- [ ] Form fields have visible labels associated programmatically with `<label for>` or `aria-labelledby`.
- [ ] Error messages identify the field and explain how to fix the problem in plain language.
- [ ] Required fields are marked visually and programmatically (`aria-required="true"`).
- [ ] Inputs that ask for established personal data use the correct `autocomplete` token.
- [ ] Significant changes of context happen only on explicit user request (no `onchange="window.location='...'"` on selects).

### 3.4 Robustness

- [ ] **[urgent]** Pages have no duplicate `id` attributes.
- [ ] Custom widgets follow ARIA Authoring Practices for their role and use the appropriate `role`, `aria-*`, and keyboard behaviour.
- [ ] Live regions (notifications, validation errors) use `aria-live` with an appropriate politeness level.
- [ ] Status messages can be received programmatically without receiving focus.
- [ ] The site works with at least one major screen reader (NVDA on Windows or VoiceOver on macOS/iOS) and one major browser (Chrome or Firefox or Safari).

### 3.5 Documentation and communication

- [ ] **[urgent]** An accessibility statement is published, linked from the footer of every page, and includes:
  - The standard the site claims conformance with (e.g. EN 301 549 v3.2.1, WCAG 2.1 AA)
  - Conformance status (fully, partially, or non-conformant)
  - Non-accessible content list, with reason and an alternative if available
  - Date of last assessment and method (self-assessment or third-party)
  - Contact details for accessibility feedback
  - Enforcement procedure (link to the national supervisory authority)
- [ ] A feedback mechanism exists. Replies are sent within a reasonable timeframe.
- [ ] Where compliance is partial under Article 14 (disproportionate burden), the rationale is documented and proportionality is reassessed at least every five years.

### 3.6 E-commerce specific

- [ ] Product information includes accessibility-relevant details (e.g. printed font size for books, captioning availability for video content).
- [ ] Checkout is fully operable by keyboard and assistive technology.
- [ ] Payment forms identify and explain errors.
- [ ] Account creation and login are accessible. Authentication does not rely solely on cognitive function tests like remembering an image (CAPTCHA needs an alternative).
- [ ] Order confirmations and post-purchase communications are accessible.

### 3.7 Mobile and apps

- [ ] Native mobile apps meet the same WCAG 2.1 AA criteria as the web property.
- [ ] Pinch-to-zoom is not disabled in the viewport meta tag.
- [ ] Screen orientation is not locked unless essential to the function.
- [ ] Concurrent multi-input operations have a single-input alternative.

## 4. Documenting conformance

The accessibility statement is the headline artifact. It is also the artifact a regulator or claimant will read first. Treat it accordingly.

### Recommended structure

1. **Scope.** Domains, apps, and self-service terminals covered.
2. **Conformance status.** "Fully conformant", "partially conformant", or "non-conformant", with the standard named.
3. **Non-accessible content.** Plain-language description of any non-conformances, the reason (technical, disproportionate burden, third-party), and an alternative path if one exists.
4. **Preparation method.** Self-assessment, third-party audit, automated scan, or a combination. Name the auditor or tool.
5. **Date of last assessment.** Including the date of the most recent substantive update.
6. **Feedback mechanism.** An email address, phone number, and (ideally) a form. Promise a response timeframe.
7. **Enforcement procedure.** Link to the national supervisory authority's complaint route. Each member state has one; the European Disability Forum maintains a directory.

### Evidence to retain

- Audit reports (Kritano exports, axe-core scans, manual test logs)
- Third-party reviews if commissioned
- Code review notes when accessibility fixes ship
- Article 14 disproportionate-burden assessments, including the calculation
- Feedback received and responses sent

Retain for at least five years.

## 5. Operationalising compliance

Compliance is a steady-state property, not a project. The plan that works:

- **Quarterly audit.** Re-run a full WCAG 2.1 AA scan. Track regressions. Kritano can schedule this and flag the delta between runs.
- **Every release.** Run an automated scan against any page that changed. Pull requests that introduce new keyboard-trapped widgets or missing alt text fail review.
- **Annual statement refresh.** Update the accessibility statement with the date of the latest assessment and any new non-conformances.
- **Quarterly feedback review.** Read every accessibility report from users. Most regulators consider non-response a violation in itself.
- **Article 14 reassessment.** Where partial compliance has been claimed, recheck whether the disproportionate-burden case still holds. Operating costs that justified the exemption two years ago may not justify it today.

## 6. What enforcement looks like

Each EU member state appointed a supervisory authority by mid-2025. The enforcement model varies:

- Some authorities accept complaints from individuals and conduct investigations.
- Others perform market-surveillance sweeps.
- Several have published penalty schedules: fines per non-conformance, plus daily penalties for ongoing breaches.
- Civil liability remains available in most jurisdictions; class actions are now active in Germany, France, and Spain.

The pattern from analogous regulations (GDPR enforcement timelines) suggests the first significant penalties will land 18-24 months after the enforcement date, targeting high-profile non-compliers. If you are a large platform with poor accessibility, you are exposed.

## 7. The fast path

If you are reading this and the deadline has already passed, here is the minimum-viable path to defensibility:

1. Run a Kritano audit (or any credible accessibility scanner) today. Save the report.
2. Publish a draft accessibility statement based on the scan results. Be honest about non-conformances. Honesty is protective.
3. Fix the **[urgent]** items in this checklist within 30 days. They are also the ones automated scanners catch.
4. Document a remediation plan with target dates for the rest.
5. Stand up the feedback mechanism. Reply to every report.
6. Schedule the next assessment for 90 days out.

A site with an honest, in-progress accessibility statement and a working feedback mechanism is in a defensible position. A site with no statement, no feedback channel, and easily-detectable failures is not.

## 8. How Kritano helps

Kritano runs the full WCAG 2.1 and 2.2 audit on every scan. The EAA-specific layer maps each finding to the relevant EN 301 549 clause so the gap list double-doubles as a conformance audit trail. Kritano's EAA Compliance Passport feature exports the mapped findings as a PDF you can attach to the accessibility statement as evidence of the last assessment.

[Start a free scan at kritano.com](https://kritano.com).

## Disclaimer

This guide summarises the European Accessibility Act and EN 301 549 v3.2.1 as of late 2025. It is not legal advice. National implementations vary in detail and enforcement. For an authoritative interpretation in your jurisdiction, consult a qualified accessibility lawyer.
