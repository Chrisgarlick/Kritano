<!-- Version: 1 | Department: product | Updated: 2026-03-24 -->

# Product Requirements Document — Kritano Iteration 2

## Problem Statement

Kritano has a comprehensive audit engine and strong infrastructure, but three critical gaps prevent it from delivering on its "Website Intelligence Platform" positioning:

1. **Content intelligence is hidden.** E-E-A-T, AEO, readability, engagement, and content structure scores exist but are scattered across sub-scores with no unified metric. The unique differentiator identified in strategy is invisible to users.

2. **Findings are diagnosis without prescription.** Users see what's wrong but get no code-level guidance on how to fix it. Every competitor at least links to documentation; the most advanced offer AI-generated fixes.

3. **Compliance has no dedicated surface.** The EAA is in force. Kritano checks WCAG 2.2 AA but has no compliance-specific reporting, no regulatory framing, and no way to generate the documents that compliance officers need.

**Why now:** The founding member launch is imminent. These three features — Content Quality Score, Fix Snippets, and Compliance Passport — are the minimum viable differentiation that justifies "Website Intelligence Platform" over "yet another scanner."

## Goals

| Goal | OKR Link |
|------|----------|
| Establish content intelligence as the lead differentiator | Q2 KR: Content Quality Score is #1 cited feature; ≥70% E-E-A-T/AEO usage rate |
| Give users actionable remediation for every finding | Q3 KR: Fix snippets live for top 50 findings |
| Position Kritano for EAA compliance market | Q3 KR: Compliance Passport shipped and generating reports |

## Non-Goals

- **AI-generated fixes.** Template-based fix snippets only. AI integration is deferred until API key and cost model are decided.
- **Rank tracking or keyword research.** This is Semrush's territory. Kritano audits existing content, it doesn't prescribe new content.
- **Full EN 301 549 certification.** The Compliance Passport is a reporting tool, not a legal certification. Disclaimer required.
- **Portfolio dashboard for agencies.** High value but separate scope. Deferred to Iteration 3.
- **GitHub Action / CLI.** Important for Developer Dana persona but requires API stability and documentation. Deferred.
- **Dark mode completion.** Nice-to-have, not a differentiator. Deferred.

---

## Feature 1: Content Quality Score (CQS)

### User Stories

- **As Agency Alex,** I want a single content quality score for each page so that I can show clients their content health alongside SEO and accessibility scores.
- **As Founder Fran,** I want to understand if my content is good enough for Google so that I can improve my search rankings without hiring a content consultant.
- **As Developer Dana,** I want a content score API endpoint so that I can track content quality regressions in my monitoring dashboard.

### Functional Requirements

**CQS Calculation:**
- Unified score (0-100) computed from 5 existing sub-scores:
  - **Content Quality** (word count, boilerplate, multimedia, freshness) — weight: 25%
  - **Readability** (Flesch-Kincaid, Gunning Fog, ARI) — weight: 20%
  - **Content Structure** (heading hierarchy, paragraph metrics, text walls) — weight: 15%
  - **E-E-A-T** (experience, expertise, authority, trust evidence) — weight: 25%
  - **Engagement** (hook strength, CTAs, power words, transitions) — weight: 15%
- Score is calculated per page and aggregated per audit (weighted average by page importance)
- Page importance = homepage (3x), top-level pages (2x), all others (1x)
- CQS is stored alongside existing category scores on `audit_jobs` and `audit_pages` tables

**CQS Display:**
- New column in the audit overview: "Content Quality" score ring alongside SEO, Accessibility, Security, Performance
- CQS trend chart on the analytics dashboard (reuse existing trend infrastructure)
- CQS breakdown panel on audit detail: show the 5 sub-scores with explanations
- CQS appears on shareable public reports and PDF exports

**CQS in Findings:**
- Content-category findings are tagged with which CQS sub-score they affect
- Findings sorted by CQS impact (which fixes would improve the score most)

**Tier Gating:**
- Free: sees CQS as a single number, no breakdown
- Starter: sees CQS with basic breakdown (5 sub-scores)
- Pro+: sees full breakdown with per-page detail, trend tracking, and E-E-A-T evidence

### Data Requirements

- **New column:** `content_quality_score` (integer, nullable) on `audit_jobs` and `audit_pages`
- **Migration:** Add column, backfill from existing content sub-scores if data exists
- **API:** Extend `GET /api/audits/:id` response to include `contentQualityScore`
- **API:** New endpoint `GET /api/audits/:id/content-quality` for detailed CQS breakdown

### Edge Cases

- Pages with no text content (e.g., image galleries): CQS = null, display "Not applicable"
- Audits where content checks are disabled (Free tier without content check): CQS = null
- Very short pages (<100 words): CQS calculated but flagged as "Limited content — score may not be representative"

### Success Metrics

- ≥70% of Pro+ audits have CQS enabled and visible
- CQS is mentioned in ≥3 founding member feedback responses
- CQS breakdown page has ≥50% click-through rate from audit overview

---

## Feature 2: Template-Based Fix Snippets

### User Stories

- **As Founder Fran,** I want to see a code fix for each issue so that I can paste it into my CMS without understanding the technical details.
- **As Agency Alex,** I want fix code included in client reports so that my developers can implement fixes without re-interpreting the findings.
- **As Developer Dana,** I want copy-paste fix snippets so that I can resolve common issues without researching each one individually.

### Functional Requirements

**Fix Snippet Data:**
- Each finding's `rule_id` maps to a fix template
- Fix templates stored as a JSON/TypeScript config file, not in the database (easier to update, version-controlled)
- Template structure:
  ```
  {
    ruleId: "missing-alt-text",
    fixType: "code" | "config" | "content" | "manual",
    language: "html" | "css" | "javascript" | "config",
    template: "Add alt attribute: <img src=\"{{src}}\" alt=\"{{suggestedAlt}}\">",
    variables: ["src", "suggestedAlt"],
    fallbackTemplate: "Add a descriptive alt attribute to this image.",
    explanation: "Screen readers use alt text to describe images to visually impaired users.",
    effort: "small",
    learnMoreUrl: "https://kritano.com/blog/complete-guide-image-alt-text"
  }
  ```
- Variables are populated from the finding context (selector, snippet, page URL)
- If a variable can't be populated, use `fallbackTemplate`

**Fix Snippet Display:**
- "How to Fix" accordion on each finding card (collapsed by default)
- Shows: code snippet (syntax highlighted), plain English explanation, effort estimate, "Learn More" link
- "Copy Fix" button copies the code snippet to clipboard
- If no fix template exists for a rule_id, show the existing `recommendation` field instead

**Fix Snippet Coverage:**
- Phase 1: Top 50 most common findings (covers ~80% of all issues users encounter)
- Priority order: accessibility (alt text, ARIA, heading hierarchy, lang attribute, form labels), SEO (meta descriptions, title tags, canonical URLs, structured data, heading structure), security (CSP headers, HTTPS, X-Frame-Options), content (readability, heading structure)
- Each fix template must be reviewed for correctness before shipping

**Tier Gating:**
- Free: sees fix explanations (text) but not code snippets
- Starter+: sees full code snippets with copy button

**PDF/CSV Export:**
- Fix snippets included in PDF export (code block styling)
- Fix snippets included in CSV export (new `fix_snippet` column)
- Fix snippets included in JSON export

### Data Requirements

- **New file:** `server/src/data/fix-templates.ts` — TypeScript object mapping rule_id → fix template
- **No database changes** — templates are code, not data
- **API:** Extend finding responses to include `fixSnippet` when template exists

### Edge Cases

- Finding with no template: show existing `recommendation` text, no code block
- Finding where variables can't be resolved: show `fallbackTemplate` (generic fix)
- Multiple findings with the same rule_id on different pages: same template, different variable values
- Fix template references a URL that changed: learn more links should be relative (`/blog/...`) not absolute

### Success Metrics

- Fix templates cover ≥80% of findings by volume (top 50 rules)
- "Copy Fix" button clicked ≥ 500 times in first month
- Founding member feedback mentions "fixes" or "how to fix" positively

---

## Feature 3: EAA Compliance Passport

### User Stories

- **As Agency Alex,** I want to generate an EAA compliance report for each client site so that I can hand it to their legal team and demonstrate our audit value.
- **As Founder Fran,** I want to know if my site is EAA compliant so that I can avoid fines without hiring a compliance consultant.
- **As Developer Dana,** I want to see which specific EN 301 549 clauses my site fails so that I can prioritise fixes by regulatory requirement.

### Functional Requirements

**WCAG → EN 301 549 Mapping:**
- Each accessibility finding's `wcag_criteria` field is mapped to the corresponding EN 301 549 clause(s)
- Mapping stored as a config file: `server/src/data/en-301-549-mapping.ts`
- Structure:
  ```
  {
    "1.1.1": { clause: "9.1.1.1", title: "Non-text Content", section: "Web" },
    "1.3.1": { clause: "9.1.3.1", title: "Info and Relationships", section: "Web" },
    ...
  }
  ```
- Not all WCAG criteria map 1:1; some EN 301 549 clauses cover multiple WCAG criteria

**Compliance Status:**
- Per-site compliance status derived from latest audit:
  - **Compliant:** 0 accessibility findings of severity critical or serious
  - **Partially Compliant:** ≤5 serious findings, 0 critical
  - **Non-Compliant:** any critical findings OR >5 serious findings
- Status displayed as a traffic-light badge on the site dashboard and audit detail
- Status includes: compliance level, number of failing clauses, total clauses checked

**Compliance Report:**
- Dedicated page: `/audits/:id/compliance`
- Sections:
  1. **Executive Summary** — compliance status, total clauses checked, passing/failing count
  2. **Clause-by-Clause Results** — table of EN 301 549 clauses with pass/fail status, linked findings
  3. **Failing Clauses Detail** — for each failing clause: description, severity, affected pages, fix guidance (from fix snippets if available)
  4. **Remediation Timeline** — editable field for target remediation date per failing clause
  5. **Regulatory Context** — static text explaining EAA requirements, enforcement dates, penalties
  6. **Disclaimer** — "This report is generated by automated testing and does not constitute legal advice. Manual testing is recommended for full compliance assessment."
- Export as PDF (reuse existing PDF infrastructure, new template)
- Export as JSON (API endpoint)

**Compliance Dashboard Widget:**
- On site detail page: small compliance status card showing traffic-light badge, failing clause count, and "View Report" link
- On audit detail page: compliance status badge in the header

**Tier Gating:**
- Free/Starter: see compliance status badge only (traffic light)
- Pro+: see full compliance report with clause detail, PDF export, remediation timeline

### Data Requirements

- **New file:** `server/src/data/en-301-549-mapping.ts` — WCAG ↔ EN 301 549 mapping
- **No database changes** — compliance status is derived at query time from existing findings
- **API:** New endpoint `GET /api/audits/:id/compliance` returning full compliance data
- **API:** Extend site response to include `complianceStatus` field

### Edge Cases

- Audit with no accessibility checks enabled (Free tier): compliance status = "Not assessed"
- Audit with 0 accessibility findings: compliance status = "Compliant" (but note: automated testing only)
- WCAG criteria not covered by axe-core (manual-only checks): listed as "Requires manual verification" in the clause table
- Multiple audits for same site: compliance status always uses the latest completed audit

### Success Metrics

- ≥20% of Pro+ users generate at least one compliance report in first 60 days
- Compliance PDF exported ≥50 times in first 60 days
- At least 2 agency founding members use compliance reports in client deliverables

---

## Non-Functional Requirements

### Performance
- CQS calculation adds ≤2 seconds to audit processing time (computed from existing sub-scores, no new crawling)
- Fix snippet lookup is O(1) — static config file, no database query
- Compliance report page loads in ≤1 second (derived from cached audit data)

### Security
- Fix snippet templates must not contain executable code or user-injectable values
- Compliance report PDF generation uses existing Playwright sandbox
- Template variables are sanitised before rendering

### Accessibility
- All new pages meet WCAG 2.2 AA (Kritano must practise what it preaches)
- CQS breakdown page is keyboard-navigable
- Compliance report table has proper ARIA attributes and column headers
- Fix snippet code blocks use `<pre><code>` with appropriate `aria-label`

### Browser Support
- All features work in Chrome, Firefox, Safari, Edge (latest 2 versions)
- PDF exports render correctly in all browsers

---

## Open Questions

1. **CQS weights** — The proposed 25/20/15/25/15 weighting needs validation with founding member feedback. Should E-E-A-T and content quality really be weighted equally? Consider making weights adjustable per-site for agencies.

2. **Fix snippet review process** — Who reviews templates for correctness before shipping? A wrong fix suggestion is worse than no suggestion. Propose: batch of 10 templates, manually test each on a real site, then ship.

3. **Compliance disclaimer wording** — Legal should review the disclaimer text. Automated testing cannot verify all WCAG criteria (some require human judgment). The disclaimer must be clear without undermining the feature's value.

4. **Remediation timeline persistence** — Should the editable remediation dates in the compliance report be saved per-audit or per-site? Per-site makes more sense (deadlines don't change between audits) but requires a new database table.

5. **CQS on Free tier** — Strategy says Free tier should see CQS as a single number. But Free tier only gets SEO + Security + Content checks (not E-E-A-T or AEO, which are Pro+). Should Free tier CQS only factor in the sub-scores available to that tier? Or show the full score as a teaser?
