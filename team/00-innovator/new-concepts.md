<!-- Version: 1 | Department: innovator | Updated: 2026-03-24 -->

# New Concepts — PagePulser

## Adjacent Product Ideas

### 1. PagePulser Academy
An educational platform (blog-evolved) teaching website owners how to improve their scores. Free courses on SEO, accessibility, content quality. Each lesson ties back to PagePulser features. Acquisition channel disguised as education. The 20 existing blog posts are the seed content.

### 2. PagePulser Certifications
Offer a "Certified PagePulser Professional" badge to agencies and freelancers who pass a skills assessment. Creates a community of power users, generates referrals, and builds brand authority. The assessment tool uses the same audit engine — it's dogfooding.

### 3. PagePulser Connect (Marketplace)
A directory connecting businesses that need website improvements with agencies/developers who can deliver them. PagePulser's audit becomes the work order. Revenue: referral fees on completed engagements. The cold prospect pipeline already identifies sites with poor scores — they're the demand side.

---

## Platform Plays

### 4. Audit Engine as a Service (AEaaS)
Expose the audit engines as a standalone API product — let other SaaS tools embed PagePulser's auditing into their own products. A website builder (Wix, Squarespace) could integrate PagePulser checks into their editor. A CMS (WordPress, Webflow) could run audits on publish. Revenue: per-audit API pricing, separate from the main SaaS tiers.

### 5. Industry Benchmark Platform
Aggregate anonymised audit data to create the definitive benchmarks for website quality by industry, region, and site size. Publish quarterly reports ("The State of Website Accessibility in E-Commerce 2026"). Become the authority that journalists and analysts cite. The data already exists in the database — it just needs aggregation and anonymisation.

### 6. Compliance Ecosystem
Build around regulatory compliance: EAA, Section 508, AODA (Canada), DDA (Australia). Each regulation gets its own mapping, reporting template, and dashboard. Partner with accessibility consultancies and law firms. Position PagePulser as the compliance *platform* that works with any regulatory framework.

---

## Pivot Options

### 7. Content Quality Platform (If SEO/A11y Saturates)
If the audit market becomes too crowded, PagePulser's E-E-A-T, AEO, readability, and content analysis modules are unique. Pivot to "the tool that scores your content the way Google does" — competing with Clearscope, SurferSEO, and MarketMuse rather than Lighthouse and axe-core. The content engines already exist; the positioning just needs to shift.

### 8. Developer Tools (If Enterprise Doesn't Convert)
If the agency/enterprise market is too slow, the API + webhooks + future CLI already form the basis of a developer-first product. Add GitHub Actions, VS Code extension, and Slack integration. Compete with Calibre, SpeedCurve, and DebugBear. The infrastructure is already API-first.

---

## Mashup Concepts

### 9. PagePulser × Google Search Console
Import GSC data (clicks, impressions, positions) and correlate with audit scores. "Pages with SEO scores above 80 get 3x more organic traffic." Prove the ROI of auditing with real search data. The insight is powerful: "fixing these 5 issues would improve visibility for 12,000 monthly searches."

### 10. PagePulser × Uptime Monitoring
Add lightweight uptime/availability checks to scheduled audits. "Your site was down for 23 minutes on Tuesday. Your performance score dropped 8 points that day." Consolidate two tools into one. UptimeRobot charges $7/mo for basic monitoring — PagePulser could include it free with Starter+ and eliminate a separate subscription.

### 11. PagePulser × Heatmaps
Partner with or build lightweight click/scroll heatmaps. Overlay engagement data onto content quality scores. "This page has a content quality score of 45 and users stop scrolling at 30%. Here's why." The content analysis already measures engagement markers — pairing with real user data closes the loop.

### 12. Expose Backlink Graph Per Page
The crawler already stores `discovered_from` (parent URL) on every crawled page and maintains a full in-memory link map during auditing. This data exists in the database but isn't surfaced in the API or UI. Exposing it would let users see "these 5 pages link to this page" — turning the existing orphan detection into a full internal link graph. Agencies could use this to audit site architecture, identify link equity distribution, and recommend internal linking improvements. Low effort (data already collected), high value.

### 13. Internal Link Graph Visualisation
Build on the backlink data (#12) to render an interactive site map / link graph. Nodes are pages, edges are internal links, colour-coded by score or orphan status. Agencies would use this as a client deliverable — "here's your site architecture, here are the orphans, here's where link equity is pooling." Tools like Screaming Frog charge extra for visualisation; PagePulser could include it at Agency tier.
