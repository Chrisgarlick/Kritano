-- Migration: 115_seed_p0_resources.sql
-- Seeds the remaining four P0 resources alongside the Website Health Checklist
-- (already seeded by 112 and published by 114). Content hashes match the
-- source MD files at server/src/data/resources/<slug>/source.md.
-- See /docs/gated_resources.md for the strategy and /docs/gated-resources.md
-- for the implementation plan.

INSERT INTO gated_resources (
  slug, title, subtitle, hook, category, audience, description,
  preview_md, source_md_path, formats, content_hash, page_count, published
) VALUES
  (
    'eaa-compliance-guide',
    'European Accessibility Act Compliance Guide',
    'What the EAA requires, who it applies to, and a clause-by-clause audit you can run today.',
    'The 28 June 2025 enforcement date has passed. Most EU-facing sites are non-compliant. This is the guide we wrote to audit ourselves first.',
    'accessibility',
    'EU-facing e-commerce, SaaS, fintech, and anyone selling into the EU',
    'A 13-page technical and operational guide to the European Accessibility Act and EN 301 549 v3.2.1. Covers scope, role-based obligations, a 60-item clause-by-clause audit, the accessibility statement structure regulators expect, and a 30-day fast-path for sites caught short by the deadline.',
    E'## What is inside\n\nThe EAA became enforceable on 28 June 2025. This guide unpacks what it actually asks for, where the obligations bite, and how to audit your site against it before someone else does.\n\n### Section preview\n\n- **Does it apply to you?** The exemptions worth knowing about, including the microenterprise threshold and the disproportionate-burden clause.\n- **Who is responsible.** Manufacturer, importer, distributor, service provider. You are probably more than one.\n- **The clause-by-clause audit.** 60 items mapped to EN 301 549 v3.2.1 across perceivability, operability, understandability, robustness, documentation, e-commerce, and mobile.\n- **The accessibility statement.** What regulators look for first, including the seven required sections and the evidence to retain.\n- **The 30-day fast path.** A practical sequence for sites that need to be defensible quickly.\n\n### A sample of the audit\n\n- Every interactive element is reachable and operable with the keyboard alone.\n- A skip-to-content link is the first focusable element on every page.\n- `<html lang="...">` is set on every page with the correct language code.\n- Pages have no duplicate `id` attributes.\n- An accessibility statement is published, linked from every footer, and includes conformance status, non-accessible content list, assessment date, feedback mechanism, and enforcement link.\n\nGet the full 60-item audit and the fast-path plan below.',
    'resources/eaa-compliance-guide/source.md',
    ARRAY['md','pdf'],
    'a76b1ef38f3e6475e2ccd5c7be4d93345b090ed4bee6d3a8d217a5d7ac08f767',
    13,
    true
  ),
  (
    'wcag-quick-reference-card',
    'WCAG 2.2 Quick Reference Card',
    'The 20 WCAG failures Kritano sees most often, with the fix for each.',
    'A one-page printable cheat sheet for designers and developers. Pin it next to your monitor. Run every new component through it before merging.',
    'accessibility',
    'Frontend developers, designers, accessibility leads',
    'A focused one-pager listing the 20 most commonly failed accessibility checks with a fail example, a pass example, and a working fix snippet for each. Covers contrast, focus, forms, keyboard navigation, ARIA misuse, tap targets, motion, and authentication.',
    E'## What is inside\n\nThe 20 failures we catch most often in real audits, with a copy-paste fix for each. The headings map to WCAG 2.2 success criteria; the fix examples are the ones that actually pass in practice.\n\n### A sample of the checks\n\n**Missing focus indicator (2.4.7)**\n\n```css\n:focus-visible {\n  outline: 2px solid #4F46E5;\n  outline-offset: 2px;\n}\n```\n\n**Form fields with no label (1.3.1, 3.3.2)**\n\nFail: `<input type="text" placeholder="Email">`\nPass: `<label for="email">Email</label><input id="email" type="email" required>`\nPlaceholders disappear when typing. They are not labels.\n\n**Auto-playing video with sound (1.4.2)**\n\nFail: Hero video starts with sound on page load. Pass: Auto-play is muted by default, or there is a clearly visible pause control before the audio begins, or the content is under 3 seconds total.\n\n**Status messages not announced (4.1.3)**\n\n```html\n<div role="status" aria-live="polite">Saved</div>\n<div role="alert" aria-live="assertive">Error: connection lost</div>\n```\n\nGet all 20 checks with fail/pass examples and code snippets below.',
    'resources/wcag-quick-reference-card/source.md',
    ARRAY['md','pdf'],
    'edfbba2c7be4d1e89fe2fab825c0353b6bcffd1bdd0b13d19c055e7e2b6f083f',
    2,
    true
  ),
  (
    'aeo-optimisation-guide',
    'The AEO Optimisation Guide',
    'How to structure your content so AI models cite your pages instead of your competitors''.',
    'AI Engine Optimisation rewards different patterns from classical SEO. This is the framework Kritano uses internally and audits against in our AEO scan.',
    'aeo',
    'Content marketers, SEO leads, product marketers, founders',
    'A 13-page guide to getting cited by ChatGPT, Claude, Perplexity, and Gemini. Covers the five pillars Kritano scores against (frontloading, citability, structure, authority, crawler accessibility), a 60-point AEO audit framework, the most common AEO mistakes, and a six-week implementation programme that produces measurable citation uplift within 90 days.',
    E'## What is inside\n\nAI engines reward structure, citability, and demonstrable expertise. The patterns are different from classical SEO. This is the framework that works in 2025.\n\n### The fundamental shift\n\n```\nSEO answer = your link in the results\nAEO answer = your sentence in the response, with your URL as the citation\n```\n\n### The five pillars\n\n- **Content frontloading.** AI models index and quote the first 100-200 words of a page more heavily than the rest. If your answer lives in paragraph 6, you are not being quoted.\n- **Citation-friendly structure.** Definitive single-sentence facts. Numbered lists. Comparison tables. Stats with inline sources.\n- **Structured data.** `Article`, `FAQPage`, `HowTo`, `Organization`, `Person` schema with verified `sameAs` links.\n- **Authority signals.** Named authors with public footprints. Confident, factual writing. Citations from .gov, .edu, or industry sources.\n- **Crawler accessibility.** Inference-time bots (`OAI-SearchBot`, `Claude-User`, `PerplexityBot`) must be allowed in `robots.txt`.\n\n### A sample of the audit\n\n- The page''s main question is answered in the first 100 words.\n- The first sentence does not start with "In this post" or similar meta-framing.\n- `Article` JSON-LD with named author and dates.\n- Author block links via `sameAs` to a verifiable profile.\n- `robots.txt` does not block `OAI-SearchBot`, `Claude-User`, `PerplexityBot`.\n\nGet the full 60-point audit and the six-week implementation programme below.',
    'resources/aeo-optimisation-guide/source.md',
    ARRAY['md','pdf'],
    '0f6f29cedf0de9cf50ba74b9c86cc8f6ee52693db3381cbd0da3792225ed43e6',
    13,
    true
  ),
  (
    'website-launch-checklist',
    'The Website Launch Checklist',
    'The 65-check pre-launch, launch-day, and post-launch audit Kritano runs automatically.',
    'Don''t ship a broken site. The checklist agencies print and run with clients in the final week before launch.',
    'guides',
    'Agencies running launches, developers shipping new sites, founders',
    'A 65-check launch checklist organised by timeline: T minus 7 days, T minus 1 day, launch day, T plus 24 hours, T plus 7 days, and ongoing. Critical items are flagged. Covers domain and DNS, content audit, SEO foundations, performance, accessibility, security, analytics, backups, on-call, and post-launch monitoring.',
    E'## What is inside\n\nThe 65 checks every website should pass before going live. Items marked **[critical]** are blockers; do not flip the DNS until they are green.\n\n### The structure\n\n- **T minus 7 days.** Domain and DNS, content audit, SEO foundations, performance, accessibility, security, analytics, backups.\n- **T minus 1 day.** Final smoke test, forms, payment flow, monitoring.\n- **Launch day.** Pre-flight, the DNS flip, first hour.\n- **T plus 24 hours.** Real-traffic re-audit, sitemap submission, error triage.\n- **T plus 7 days.** Long-tail issues, Core Web Vitals on real-user data, retro.\n\n### A sample of the critical items\n\n- Production domain is registered to the client (not to the agency).\n- `robots.txt` allows production crawling (NOT the staging-mode `Disallow: /`).\n- HSTS header is set with a year-long max-age and the preload flag.\n- Run an automated accessibility scan against every template. Aim for zero violations on the homepage.\n- A full backup of the production database has been taken and a restore has been tested in the last 7 days.\n- Final smoke test on a real production-like environment (same DNS, same TLS, same database). Not staging.\n\nGet the full 65-check version below, organised by launch timeline.',
    'resources/website-launch-checklist/source.md',
    ARRAY['md','pdf'],
    '1e19b40b2b63290c744ad2be6721c8e62c282872987f09d0b74f25091a96c9a6',
    8,
    true
  )
ON CONFLICT (slug) DO NOTHING;
