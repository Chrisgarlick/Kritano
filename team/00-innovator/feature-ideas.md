<!-- Version: 1 | Department: innovator | Updated: 2026-03-24 -->

# Feature Ideas — Kritano

## Core Features (Reimagined)

### 1. Smart Priority Queue
Current state: findings are listed by severity. Better: rank findings by **business impact** — combining severity, affected page importance (homepage vs deep page), fix effort (one line vs architecture change), and compliance risk (EAA deadline approaching). Show a single "Fix This Next" recommendation at the top of every audit.

### 2. Audit Comparison Timeline
Current state: users can compare two audits. Better: a **timeline view** showing every audit for a site on a horizontal axis, with score sparklines and the ability to annotate "what changed" at each point. Agencies show clients: "here's what we fixed, here's the impact."

### 3. Category Deep-Dive Reports
Current state: scores are top-level numbers. Better: each category (SEO, Content, Accessibility) gets its own **mini-report** with a narrative arc: "Your SEO is strong on meta tags but weak on internal linking. Your 3 highest-traffic pages have no structured data. Here are the 5 changes that would have the biggest impact." Template-based, no AI required.

### 4. Finding Lifecycle Tracking
Current state: findings appear and disappear between audits. Better: track each finding across audits — when it first appeared, when it was fixed, how long it persisted. Show "mean time to fix" metrics. Agencies use this to prove their value to clients.

---

## Signature Features (Unique & Memorable)

### 5. Compliance Passport (EAA + WCAG)
A dedicated compliance dashboard that maps audit findings to specific regulatory requirements. Shows a traffic-light status per EN 301 549 clause, generates compliance reports on demand, and tracks remediation deadlines. Positions Kritano as a *compliance platform*, not just a scanner. Time-sensitive: the EAA is already in force.

### 6. Content Quality Score (CQS)
Kritano already has readability, E-E-A-T, AEO, engagement, and structure analysis — but they're scattered across sub-scores. Unify them into a single **Content Quality Score** with its own dashboard, trend tracking, and competitive benchmarking. Market it as "the only tool that scores your content the way Google does." This is the positioning play that separates Kritano from Lighthouse-wrapper tools.

### 7. Anomaly Detection & Score Alerts
Detect sudden score drops, critical issue spikes, or category failures after scheduled audits. Send intelligent alerts: "Your security score dropped 15 points. 2 new critical CSP issues detected. Last change: deploy at 14:32." Connect score changes to probable causes. Requires no AI — just trend analysis on existing data.

### 8. Public Score Directory
An opt-in, searchable directory of verified websites and their Kritano scores. Sites that maintain high scores get a "Verified Healthy" badge. Creates an SEO flywheel: every indexed score page is a long-tail keyword. Creates social pressure: site owners want to improve their public score. Creates a discovery channel: agencies browse the directory to find clients.

### 9. Agency Portfolio Dashboard
Aggregate view for agencies managing 10-50 sites: a single screen showing every client site's health, ranked by urgency, with bulk re-audit and "worst performers" flagging. The dashboard that makes Agency tier users say "I could never go back to managing these individually."

---

## Delight Features (Small Touches)

### 10. Audit Progress Pulse
Replace the boring progress bar during audits with a live "pulse" animation — show which URL is being crawled in real-time, with a minimap of the site structure building itself as pages are discovered. Makes the wait feel productive.

### 11. Score Celebrations
When a user's score improves by 10+ points, show a confetti animation and a personalised message: "Your accessibility score jumped from 62 to 78! That's 16 points in two weeks." Small dopamine hit that creates habitual re-scanning.

### 12. Weekly Health Pulse Email
A beautifully designed weekly/monthly email digest showing score trends across all sites with sparkline charts. "Your portfolio health: 3 improving, 1 declining, 2 stable." Creates engagement without requiring login. Natural upsell: "Monitor 10 sites → upgrade to Pro."

### 13. Finding Fix Snippets (Template-Based)
Even without AI, many common findings have predictable fixes. Missing alt text → template: `alt="Descriptive text for [image filename]"`. Missing lang attribute → `<html lang="en">`. Missing viewport meta → the exact tag. Pre-written snippets for the 50 most common findings would cover 80% of issues.

### 14. Dark Mode (Complete)
1,734 dark: Tailwind variants already exist. Complete the implementation — Kritano is an accessibility tool that doesn't support dark mode. The irony is bad optics.

---

## Moonshot Features (V2/V3)

### 15. AI-Powered Fix Generator
When LLM integration happens: generate precise, copy-paste code fixes for every finding. Start with accessibility (alt text, ARIA labels, heading hierarchy) and SEO (meta tags, structured data, heading structure), then expand to content (readability rewrites, E-E-A-T improvements). Use Claude Haiku for speed/cost. This is the single feature that transforms Kritano from "scanner" to "remediation platform."

### 16. GitHub Action + CLI
`npx kritano audit https://example.com --checks seo,a11y --fail-under 80` in CI/CD. Thin wrapper around the existing API. Publish to GitHub Actions marketplace — it becomes a discovery channel. Every repo that uses it is free advertising.

### 17. White-Label Platform
Let agencies deploy Kritano under their own brand, domain, and pricing. Not just white-label exports — a fully white-labelled instance. Revenue model: platform licensing fee + per-audit overage. This is the Enterprise play.

### 18. Competitive Benchmarking
The competitor comparison feature exists in the database but is disabled. Re-frame it: instead of "scan your competitors" (which CLAUDE.md prohibits for unverified domains), offer **industry benchmarks**. "Your SEO score is 78. The average for e-commerce sites in your region is 72." Aggregate anonymised scores to create benchmark data.

### 19. Accessibility Remediation Marketplace
Connect site owners who need accessibility fixes with verified developers/agencies who can fix them. Kritano takes a referral fee. The audit findings become the work order. The marketplace is the monetisation layer that doesn't require users to upgrade their plan.

---

## Cross-Pollination Ideas

### 20. "Strava for Websites" (From Fitness)
Show weekly/monthly "activity" — pages scanned, issues fixed, scores improved. Let users share their improvement streaks. Add a leaderboard for agency teams (opt-in). Gamify the remediation process.

### 21. "Grammarly for HTML" (From Writing Tools)
A browser extension that highlights accessibility and SEO issues on the page the user is currently viewing, with inline fix suggestions. Lightweight, free, drives signups to the full platform. The extension is the acquisition channel.

### 22. "Credit Score for Websites" (From Finance)
Consolidate all category scores into a single 0-100 "Website Health Score" with the same emotional weight as a credit score. Show what impacts it, how to improve it, and historical trends. People intuitively understand credit scores — they'll understand website health scores.

### 23. "Canary Deployments for Content" (From DevOps)
Before publishing a page change, run a quick audit on the modified page and compare scores to the current version. "This change would drop your accessibility score by 4 points. Proceed?" Preview the impact of changes before they go live.
