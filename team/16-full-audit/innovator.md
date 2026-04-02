# Innovator Audit

**Overall Assessment:** ADEQUATE
**Score:** 6/10

The platform has an impressive feature surface area and solid foundations, but has not yet executed on the most differentiating capabilities described in its own innovation roadmap. The gap between what is planned and what is shipped creates a window for competitors to establish dominance in AI-powered auditing and regulatory compliance tooling.

## What's Working Well

1. **Comprehensive audit engine breadth.** Six audit engines (SEO, accessibility, security, performance, content/E-E-A-T, structured data) plus AEO analysis is a wider check surface than most competitors offer. The E-E-A-T and AEO modules are genuinely forward-looking.

2. **White-label and agency positioning.** Tiered PDF branding (site colors through to full white-label), per-site member limits, and the agency/enterprise tier structure show clear thought about the agency reseller market, which is where the highest LTV customers live.

3. **Cold prospect pipeline.** The NRD (newly registered domain) feed, email extraction, and outreach tracking pipeline is an unusual and clever growth engine. Combined with the early access founding member strategy, this gives real go-to-market muscle that most SaaS tools at this stage lack.

4. **Content analysis depth.** Readability scoring, keyword analysis, content quality, engagement metrics, AEO, and E-E-A-T go well beyond the typical "run Lighthouse and display the results" approach. This is a genuine differentiator.

5. **Developer-ready API and docs.** A versioned REST API with scoped keys, rate limiting, and a full SPA documentation site is table-stakes for developer adoption but rarely done well at this stage. The `kt_live_` prefix branding is a nice touch.

## Issues Found

### No AI features are actually implemented
**Severity:** CRITICAL
**Finding:** The INNOVATION.md document describes AI-powered fix suggestions, natural language reports, priority scoring, and anomaly detection. None of these have been implemented. There are zero Anthropic/OpenAI API calls in the server codebase. The fix generator service, report generator service, priority scoring service, and anomaly detection service do not exist as files.
**Impact:** AI-assisted remediation is the single biggest differentiator in the 2025-2026 audit tool market. Competitors like Lumar, Siteimprove, and Silktide are already shipping AI-powered fix suggestions. Every month without this is a month where Kritano looks like "just another scanner."
**Recommendation:** Implement a focused MVP: AI fix suggestions for accessibility findings only (highest regulatory urgency, most structured fixes). Use Claude Haiku for cost efficiency. Ship the "Generate Fix" button on finding cards before launching to founding members. Even a basic implementation that generates correct `alt` text suggestions and ARIA fix snippets would be a headline feature.

### No European Accessibility Act (EAA) compliance mode
**Severity:** HIGH
**Finding:** The EAA came into force on 28 June 2025. Kritano's blog content references EAA heavily (there are draw assets and blog posts about it), but the actual audit engine has no EAA-specific compliance mode. The accessibility engine runs axe-core against WCAG 2.2 AA, which is the technical standard underpinning EAA, but there is no EAA-labeled reporting, no EN 301 549 mapping, and no regulatory compliance dashboard.
**Impact:** European businesses are actively searching for tools that help them comply with the EAA. Labelling the same WCAG checks as "EAA Compliance" with a regulatory framing (deadlines, penalties, required standards) is a positioning opportunity that costs almost nothing in engineering effort but dramatically changes the sales conversation.
**Recommendation:** Add an "EAA Compliance Report" export mode and a compliance dashboard that maps WCAG 2.2 AA findings to EN 301 549 clauses. Include a compliance status indicator ("EAA Ready" / "At Risk" / "Non-Compliant") on the site dashboard. This is 80% presentation and 20% logic.

### No user onboarding flow
**Severity:** HIGH
**Finding:** There is no onboarding wizard, getting-started guide, or first-run experience. After registration, users land on a dashboard with no sites and no guidance. The only "getting started" content lives in the API docs.
**Impact:** For a tool with this many features (audits, schedules, sites, teams, branding, API keys, exports), the empty-state experience is the #1 determinant of activation rate. Users who don't run their first audit within 10 minutes of signing up are unlikely to convert to paid.
**Recommendation:** Build a 3-step onboarding flow: (1) Add your first site, (2) Run your first audit, (3) Review your results. Show a progress checklist on the dashboard until all steps are complete. Consider a "sample audit" of a demo site that shows users what a completed report looks like before they add their own domain.

### No webhooks or real-time notifications for users
**Severity:** MEDIUM
**Finding:** The INNOVATION.md describes a webhook system (audit.completed, anomaly.detected, etc.) but it is not implemented. The only webhooks in the codebase are for Stripe and Resend (internal infrastructure). Users have no way to receive programmatic notifications when audits complete, scores drop, or schedules run.
**Impact:** Webhook support is a key requirement for CI/CD integration, which is the primary driver of API adoption. Without webhooks, API users must poll for results, which is a poor developer experience.
**Recommendation:** Implement the webhook infrastructure as described in INNOVATION.md. Start with `audit.completed` and `audit.failed` events. The database schema is already designed; it just needs the delivery service and configuration UI.

### No GitHub Action or CLI tool
**Severity:** MEDIUM
**Finding:** The innovation roadmap describes a GitHub Action and `@kritano/cli` npm package. Neither exists. These are the two most important distribution channels for developer-focused audit tools.
**Impact:** The CI/CD integration story is incomplete. Developers evaluate audit tools by whether they can add a single YAML file to their repo and get audit results on PRs. Without this, Kritano cannot compete for the developer segment.
**Recommendation:** Build a minimal GitHub Action first (it can be a thin wrapper around the API). The CLI can follow. The GitHub Actions marketplace is a discovery channel in itself.

### Dark mode is scaffolded but not implemented
**Severity:** LOW
**Finding:** ThemeContext exists and the brand guidelines include a full dark mode palette, but the actual UI components and pages do not use `dark:` Tailwind variants. The theme toggle likely switches state but has no visual effect.
**Impact:** Minor for launch, but dark mode is expected by developer-heavy audiences and is required for WCAG compliance of Kritano's own interface (ironic for an accessibility tool).
**Recommendation:** Defer to post-launch but ensure it ships within the first quarter. Add `dark:` variants systematically during the next UI pass.

## Opportunities

1. **"Compliance Center" as a premium feature.** Bundle EAA compliance reporting, WCAG 2.2 conformance statements (auto-generated), accessibility policy templates, and a remediation timeline planner into a "Compliance Center" available at Pro tier and above. This positions Kritano as a compliance tool, not just a scanner, and justifies higher pricing. The regulatory urgency of EAA makes this a time-sensitive opportunity.

2. **AI-powered accessibility statement generator.** Most websites are legally required to publish an accessibility statement but have no idea how to write one. Use audit results to auto-generate a WCAG-conformant accessibility statement (listing known issues, remediation timeline, contact information). This is a unique feature no major competitor offers and could be the single best conversion driver from free to paid.

3. **Scheduled audit "health pulse" email digest.** Leverage the existing email and scheduling infrastructure to send weekly/monthly email digests summarizing score trends across all of a user's sites. Include sparkline charts, top new issues, and resolved issues. This creates habitual engagement without users needing to log in, and is a natural upsell touchpoint ("Upgrade to Pro to monitor 10 sites").

4. **Public audit badge/widget.** Let sites embed a "Verified by Kritano" badge that links to a public-facing summary of their latest audit scores. This serves as social proof for the audited site AND as a viral distribution mechanism for Kritano. Similar to how SSL certificate providers use seal images. Could be gated to Starter tier and above.

5. **Bulk/portfolio audit for agencies.** Agencies managing 20-50 sites need a portfolio view: a single dashboard showing all sites' scores, trends, and urgencies ranked by severity. The current site list exists but lacks aggregation. Add a portfolio health score, "worst performers" ranking, and bulk re-audit capability. This is the feature that closes enterprise deals.

## Summary

Kritano has built a genuinely comprehensive platform with more audit depth than most competitors, a smart go-to-market strategy (cold prospects, founding members, agency tiers), and solid technical infrastructure. However, the most differentiating planned features -- AI-powered fixes, webhooks, CI/CD integration, and compliance tooling -- remain unimplemented, sitting as detailed specs in INNOVATION.md. The core risk is that Kritano launches as a well-built but conventional audit tool in a market where AI augmentation and regulatory compliance framing are rapidly becoming table stakes. The founding member launch window is the perfect forcing function: ship AI fix suggestions and an EAA compliance mode before opening the doors to those 200 founding members, and Kritano has a compelling story. Without them, it is competing on breadth of checks alone, which is a harder sell.
