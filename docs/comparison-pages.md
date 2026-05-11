# Comparison Pages - Implementation Plan

## Overview

Create a new `/compare` section on the public site with "Kritano vs [Competitor]" and "Kritano vs [Category]" pages. These are MOFU (middle of funnel) content pages targeting users actively evaluating tools - the highest-intent traffic before conversion.

This is NOT the same as the in-app `/app/compare` feature (which compares your own audits). These are public marketing pages that explain how Kritano stacks up against specific competitors and tool categories.

## Why This Matters

The keyword strategy already identifies these as high-priority MOFU keywords:

| Keyword | Volume | Priority |
|---------|--------|----------|
| Siteimprove alternatives | 1,600/mo | P1 |
| best WCAG testing tools 2026 | 1,900/mo | P1 |
| WAVE alternative | 720/mo | P1 |
| Screaming Frog alternative free | 880/mo | P2 |
| Semrush site audit vs standalone tools | 480/mo | P2 |
| best website audit tools 2026 | 2,900/mo | P1 |
| all in one website checker | 390/mo | P1 |
| free accessibility checker vs paid | 590/mo | P1 |

These are the keywords where buying decisions happen. AI engines love to cite comparison content. People searching "Siteimprove alternatives" are ready to switch.

## Key Decisions

### 1. Two page types: "vs" pages and "alternatives" pages

**"vs" pages** (`/compare/kritano-vs-semrush`): Direct 1-to-1 comparison. Structured as a feature-by-feature breakdown. Targets "[tool] alternative" and "Kritano vs [tool]" keywords.

**"alternatives" pages** (`/compare/siteimprove-alternatives`): Roundup-style. Positions Kritano as the best option among several alternatives. Targets "[tool] alternatives" keywords.

Both types are data-driven - the content comes from a structured data file, not hardcoded in each page component.

### 2. Honest, not salesy

Per the brand voice: acknowledge where competitors are strong. If Semrush has better backlink analysis, say so. Kritano wins on breadth (6 pillars in one scan), content intelligence, pricing, and simplicity. Being honest builds trust and passes the editorial filter. Dishonest comparison pages get ignored by both users and AI engines.

### 3. SSR from day one

These pages follow the same SSR pattern as the public pages we just built. Express renders full HTML, nginx proxies to Express. No SPA-only pages.

### 4. Data-driven templates

All comparison data lives in a single TypeScript data file (like `serviceData.ts`). Adding a new comparison is a data-only change - add an entry to the file and the page renders automatically. No new components or routes needed per comparison.

## Database Changes

None. All comparison data is static content in TypeScript files.

## Backend Changes

### New files

#### `client/src/pages/public/compare/compareData.ts`

Structured data file containing all comparison entries. Each entry has:

```typescript
interface ComparisonEntry {
  slug: string;                    // URL slug: "kritano-vs-semrush"
  type: 'vs' | 'alternatives';    // Page template type
  competitor: string;              // Display name: "Semrush"
  competitorUrl: string;           // Their website (for attribution)
  seo: {
    title: string;                 // "Kritano vs Semrush - Website Audit Comparison"
    description: string;           // Meta description
    keyword: string;               // Primary target keyword
  };
  intro: string;                   // Opening paragraph
  tldr: string;                    // One-sentence verdict for AI extraction
  categories: ComparisonCategory[];// Feature comparison rows
  pricing: {
    kritano: string;               // "Free - $99/mo"
    competitor: string;            // "$129.95 - $499.95/mo"
    verdict: string;               // Who wins on price and why
  };
  bestFor: {
    kritano: string[];             // "Best for" bullet points
    competitor: string[];
  };
  verdict: string;                 // Final verdict paragraph
  faqs: { question: string; answer: string }[];
}

interface ComparisonCategory {
  name: string;                    // "SEO Auditing"
  features: ComparisonFeature[];
}

interface ComparisonFeature {
  name: string;                    // "Heading hierarchy validation"
  kritano: string | boolean;       // true, false, or descriptive text
  competitor: string | boolean;
  note?: string;                   // Optional context
}
```

#### `client/src/pages/public/compare/CompareLandingPage.tsx`

Landing page at `/compare` listing all comparison pages. Grid of cards, each linking to a specific comparison. Grouped by type (vs pages, alternatives pages).

#### `client/src/pages/public/compare/CompareDetailPage.tsx`

Template component for individual comparison pages. Takes the slug from the URL, looks up the data, and renders:

- Hero with h1 "[Kritano] vs [Competitor]" and TLDR verdict
- Side-by-side summary cards (Kritano vs Competitor at a glance)
- Feature comparison table by category
- Pricing comparison
- "Best for" section
- Verdict
- FAQs
- CTA

#### SSR equivalents

Following the pattern we just built:

- `server/src/services/compare-ssr.service.ts` - Server-side copy of comparison data + render functions
- `server/src/routes/compare-ssr.ts` - Express routes for `/compare` and `/compare/:slug`

### Modified files

#### `client/src/App.tsx`
Add routes:
- `/compare` -> CompareLandingPage
- `/compare/:slug` -> CompareDetailPage

#### `server/src/index.ts`
Mount the compare SSR router.

#### `scripts/nginx.conf`
Add location blocks for `/compare` routes proxying to Express.

#### `team/18-seo/topic-clusters.md`
Add a "Comparison & Alternatives" cluster with all comparison page URLs.

## Frontend Changes

### Page structure: "vs" template

```
Hero
  h1: "Kritano vs [Competitor]"
  TLDR verdict (bold, for AI extraction)
  Last updated date

At a Glance (two-column summary)
  Kritano card: logo, tagline, price range, best for bullets
  Competitor card: logo/name, tagline, price range, best for bullets

Feature Comparison (table)
  Grouped by category (SEO, Accessibility, Security, Performance, Content, Pricing)
  Rows: feature name | Kritano | Competitor
  Check/X/text per cell

Pricing Comparison
  Side-by-side pricing tiers
  Verdict paragraph

Who Should Choose What
  "Choose Kritano if..." bullets
  "Choose [Competitor] if..." bullets

Final Verdict
  Honest summary paragraph

FAQ (3-5 questions)
  "Is Kritano better than [Competitor]?"
  "Is Kritano free?"
  "Does [Competitor] check accessibility?"
  etc.

Author Bio
CTA
```

### Page structure: "alternatives" template

```
Hero
  h1: "Best [Competitor] Alternatives in 2026"
  Intro paragraph

Why Look for Alternatives
  2-3 paragraphs on competitor limitations

Top Alternatives (numbered list)
  1. Kritano (featured, expanded)
  2-5. Other alternatives (brief, honest)

Comparison Table
  All alternatives side by side

FAQ

Author Bio
CTA
```

## Initial Comparison Pages (Priority Order)

Based on keyword volumes and strategic value:

### Phase 1 - Highest priority (build first)

| Slug | Type | Target Keyword | Volume |
|------|------|---------------|--------|
| `siteimprove-alternatives` | alternatives | Siteimprove alternatives | 1,600/mo |
| `kritano-vs-semrush` | vs | Semrush site audit alternative | 480/mo |
| `wave-alternative` | alternatives | WAVE alternative | 720/mo |
| `best-website-audit-tools` | alternatives | best website audit tools 2026 | 2,900/mo |

### Phase 2 - High priority

| Slug | Type | Target Keyword | Volume |
|------|------|---------------|--------|
| `screaming-frog-alternative` | alternatives | Screaming Frog alternative free | 880/mo |
| `kritano-vs-lighthouse` | vs | Lighthouse alternative | - |
| `best-wcag-testing-tools` | alternatives | best WCAG testing tools 2026 | 1,900/mo |
| `kritano-vs-silktide` | vs | Silktide alternative | - |

### Phase 3 - Growth

| Slug | Type | Target Keyword | Volume |
|------|------|---------------|--------|
| `kritano-vs-ahrefs` | vs | Ahrefs site audit alternative | - |
| `kritano-vs-pope-tech` | vs | Pope Tech alternative | - |
| `free-vs-paid-accessibility-checker` | vs | free accessibility checker vs paid | 590/mo |
| `kritano-vs-monsido` | vs | Monsido alternative | - |

## Kritano's Winning Arguments (Use Across All Pages)

These are the consistent differentiators to highlight:

1. **6 pillars in one scan** - Most tools only cover 1-2 areas. Kritano checks SEO + accessibility + security + performance + content quality + structured data in a single audit.
2. **Content Intelligence** - Only tool with E-E-A-T scoring, AEO analysis, and Content Quality Score. No competitor has this.
3. **Pricing** - Free tier with real functionality. Paid plans from $19/mo. Most competitors start at $49+/mo or require annual contracts.
4. **No installation required** - External scan, nothing to install. Some competitors require browser extensions, code snippets, or CI integration.
5. **Plain English results** - Findings explain the problem AND the fix in non-technical language. Many competitors dump raw WCAG codes or technical jargon.
6. **Agency-ready** - White-label PDF exports, multi-site management, team seats. Built for agencies from day one.

## Structured Data

Each comparison page includes:

- **FAQPage** schema for all FAQ questions
- **BreadcrumbList**: Home > Compare > [Page title]
- **WebPage** with `about` pointing to both products

## SEO Strategy Per Page

- Primary keyword in title tag, h1, first paragraph, and meta description
- h2s target related keywords ("Is [competitor] free?", "[competitor] pricing", etc.)
- First 1-2 sentences under each h2 directly answer the question (AI extraction pattern)
- Internal links to relevant service pages (/services/seo, /services/accessibility, etc.)
- External link to competitor's website (for credibility, nofollow)
- FAQ section targets People Also Ask queries

## Content Rules (Same as Blog)

- British English throughout
- No em dashes - use ` - ` instead
- Honest comparisons - acknowledge competitor strengths
- Credit sources with links
- Kritano voice: conversational expert
- Educational first, not salesy
- Every claim backed by data or specific feature comparison

## Testing Plan

1. Verify each comparison page renders via SSR (curl + WebFetch)
2. Verify structured data with Google Rich Results Test
3. Verify meta tags (title, description, OG) are unique per page
4. Verify internal links to service pages work
5. Verify FAQ expand/collapse works without JS (details/summary)
6. Verify mobile layout (comparison table scrolls horizontally)
7. Check Google Search Console after indexing for any issues

## Implementation Order

1. Create `compareData.ts` with the data structure and first 2 entries (Siteimprove alternatives + Kritano vs Semrush)
2. Build the SPA components (CompareLandingPage + CompareDetailPage)
3. Build the SSR equivalents (compare-ssr.service.ts + compare-ssr.ts)
4. Mount routes in Express + add nginx location blocks
5. Add remaining comparison entries (data-only changes)
6. Update sitemap to include comparison pages
7. Update topic clusters document
