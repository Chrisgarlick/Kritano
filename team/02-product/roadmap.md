<!-- Version: 1 | Department: product | Updated: 2026-03-24 -->

# Product Roadmap — Kritano

## Now (Iteration 2 — Founding Member Launch)

These features ship before or alongside the founding member launch. They are fully spec'd and ready to build.

| # | Feature | User Story | Priority Rationale | Effort | RICE Score |
|---|---------|-----------|-------------------|--------|------------|
| 1 | **Content Quality Score** | Agency Alex wants a single content metric to show clients | Lead differentiator per strategy. No competitor has this. | M | 1,800 |
| 2 | **Fix Snippets (Top 50)** | Founder Fran wants copy-paste code fixes | Converts "diagnosis" to "prescription" — the #1 user complaint in audit tools | L | 1,500 |
| 3 | **EAA Compliance Passport** | Agency Alex needs compliance reports for EU clients | Time-sensitive — EAA in force since June 2025. 80% presentation, 20% logic. | M | 1,400 |
| 4 | **Anomaly Detection Alerts** | Agency Alex wants to know when client scores drop | High retention impact. Uses existing scheduled audit data. | M | 1,200 |
| 5 | **Social Proof on Public Pages** | — (growth) | #1 conversion gap from strategy audit. Requires human input (testimonials). | S | N/A |

**RICE Calculation Notes:**
- Reach: all Pro+ users (~200 founding members) = 200
- Impact: 3 (massive) for differentiators, 2 (high) for table-stakes
- Confidence: 80% for CQS/Fix Snippets (validated in audit), 70% for Compliance
- Effort: S=0.5mo, M=1mo, L=2mo

---

## Next (Post-Launch — Q3 2026)

Directional features that need further spec work after founding member feedback.

| # | Feature | User Story | Priority Rationale | Effort |
|---|---------|-----------|-------------------|--------|
| 6 | **Agency Portfolio Dashboard** | Agency Alex wants one screen for all client sites ranked by urgency | Closes Agency tier deals. Data/queries exist, primarily frontend. | M |
| 7 | **Webhook Management UI** | Developer Dana wants to configure webhook endpoints | Infrastructure exists (webhook.service.ts). Need frontend + event delivery. | M |
| 8 | **Weekly Health Pulse Email** | Agency Alex wants automated score summaries without logging in | High retention. Leverages existing scheduling + email infra. | S |
| 9 | **Finding Lifecycle Tracking** | Agency Alex wants to show clients how long issues persisted | Proves agency value. Requires cross-audit finding matching. | M |
| 10 | **In-App Notification Bell** | All personas want real-time feedback on audit completions | Deferred from Iteration 1. Uses existing SSE infrastructure. | M |
| 11 | **AI Fix Suggestions MVP** | Founder Fran wants AI-generated code fixes | Requires Anthropic API key + cost model decision. | L |

---

## Later (Q4 2026+)

Strategic features subject to change based on market feedback.

| # | Feature | Rationale | Effort |
|---|---------|-----------|--------|
| 12 | **GitHub Action + CLI** | Opens developer segment. Requires stable API + documentation. | L |
| 13 | **Public Score Directory** | Viral growth engine + SEO flywheel. Requires critical mass of users. | XL |
| 14 | **Dark Mode (Complete)** | Expected by developer audience. 1,734 dark: variants exist. | M |
| 15 | **Category Deep-Dive Reports** | Per-category narrative reports (template-based). | M |
| 16 | **White-Label Platform** | Agencies deploy Kritano under their own brand. Enterprise play. | XL |
| 17 | **Browser Extension** | "Grammarly for HTML" — lightweight a11y/SEO checker on any page. Acquisition channel. | L |
| 18 | **Google Search Console Integration** | Correlate audit scores with real search traffic. Proves ROI. | M |
| 19 | **Competitive Industry Benchmarks** | Anonymised aggregate scores by industry. Positions Kritano as authority. | L |

---

## What We're NOT Building

These are explicit non-goals, recorded here so they don't creep back into scope.

| Feature | Why Not |
|---------|---------|
| Rank tracking / keyword research | Semrush's territory. Complementary, not competitive. |
| Backlink analysis | Ahrefs' territory. Same reasoning. |
| Competitor scanning (re-enabled) | Per CLAUDE.md: "Competitors should NEVER be brought back." Unverified domain scanning risk. |
| Full EN 301 549 certification | Legal liability. We report, we don't certify. Always include disclaimer. |
| Automated cold email sending | Per CLAUDE.md: "All cold outreach emails will be sent manually." Pipeline drafts only. |
| CI/CD pipelines (GitHub Actions workflows) | Per CLAUDE.md: "We do NOT use GitHub Actions or any CI/CD pipeline." |
| Content writing/generation | We diagnose content, we don't write it. Different product category. |
