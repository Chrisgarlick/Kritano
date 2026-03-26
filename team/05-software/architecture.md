<!-- Version: 2 | Department: software | Updated: 2026-03-25 -->
<!-- Changelog:
  V2: Added CQS, Fix Snippets, and Compliance Passport architecture for Iteration 2
  V1: Initial architecture from full audit
-->

# Architecture — PagePulser Iteration 2

## Existing Stack (No Changes)
- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Database:** PostgreSQL via `pg` (raw SQL, no ORM)
- **Queue:** BullMQ + Redis
- **Hosting:** Docker on DigitalOcean

## Iteration 2 Feature Architecture

### Feature 1: Content Quality Score (CQS)

**Key insight:** All 5 sub-scores already exist as columns on `audit_pages`:
- `content_quality_score` (quality/freshness/multimedia)
- `content_readability_score` (Flesch-Kincaid, Gunning Fog)
- `content_structure_score` (heading hierarchy, paragraphs)
- `content_engagement_score` (hooks, CTAs, power words)
- `eeat_score` (E-E-A-T evidence)

CQS is a **derived metric** — no new crawling or analysis. It's a weighted average of existing data.

**Data Model:**
- **New column on `audit_pages`:** `cqs_score INTEGER` — computed after all content sub-scores are available
- **New column on `audit_jobs`:** `cqs_score INTEGER` — weighted average of all page CQS scores
- **Migration:** `097_content_quality_score.sql`
- Page importance weighting: homepage (depth=0) = 3x, depth=1 = 2x, all others = 1x

**Calculation (server-side):**
```
CQS = round(
  content_quality_score * 0.25 +
  eeat_score * 0.25 +
  content_readability_score * 0.20 +
  content_engagement_score * 0.15 +
  content_structure_score * 0.15
)
```
Where any null sub-score redistributes its weight proportionally to non-null scores.

**API Surface:**
- `GET /api/audits/:id` — extended response includes `cqsScore` and `cqsBreakdown`
- `GET /api/audits/:id/content-quality` — detailed CQS with per-page breakdown (Pro+ only)

**Integration point:** The CQS is calculated in the audit worker (`audit-worker.service.ts`) after all page-level scores are finalised, during the "aggregate scores" phase.

---

### Feature 2: Template-Based Fix Snippets

**Data Model:** No database changes. Templates are code.

**New file:** `server/src/data/fix-templates.ts`
- TypeScript `Record<string, FixTemplate>` mapping `rule_id` → template
- ~50 entries covering accessibility, SEO, security, content rules
- Structure per PRD: `fixType`, `language`, `template`, `variables`, `fallbackTemplate`, `explanation`, `effort`, `learnMoreUrl`

**Variable resolution:** When a finding has a matching template, the server populates template variables from finding context (`selector`, `snippet`, `page_url`). If a variable can't be resolved, falls back to `fallbackTemplate`.

**API Surface:**
- `GET /api/audits/:id/findings` — each finding now includes optional `fixSnippet` object
- Fix snippets are resolved at response time, not stored in DB

**Tier gating (server-side):**
- Free: `fixSnippet.code` omitted, only `fixSnippet.explanation` included
- Starter+: full `fixSnippet` with code

---

### Feature 3: EAA Compliance Passport

**Data Model:** No database changes. Compliance status is derived at query time.

**New file:** `server/src/data/en-301-549-mapping.ts`
- Maps WCAG 2.2 success criteria → EN 301 549 clause numbers
- ~78 mappings covering all Web (Section 9) requirements

**Compliance status derivation:**
```
Critical findings > 0 OR serious findings > 5  → Non-Compliant
Serious findings > 0 AND ≤ 5                   → Partially Compliant
Critical = 0 AND serious = 0                    → Compliant
No accessibility data                           → Not Assessed
```

**API Surface:**
- `GET /api/audits/:id/compliance` — returns compliance status, clause results, failing clause detail
- Tier gating: Free/Starter get status only; Pro+ get full clause detail

**Frontend route:** `/audits/:id/compliance`

---

## Migration Summary

| # | File | Description |
|---|------|-------------|
| 097 | `097_content_quality_score.sql` | Add `cqs_score` column to `audit_pages` and `audit_jobs` |

Note: Features 2 and 3 require no migrations — they use config files and derived queries.

## New Files Summary

| File | Purpose |
|------|---------|
| `server/src/db/migrations/097_content_quality_score.sql` | CQS column migration |
| `server/src/data/fix-templates.ts` | Fix snippet templates for top 50 rules |
| `server/src/data/en-301-549-mapping.ts` | WCAG → EN 301 549 clause mapping |
| `server/src/routes/compliance/index.ts` | Compliance API endpoints |
| `client/src/components/audit/CQSBreakdown.tsx` | CQS score ring + breakdown panel |
| `client/src/components/audit/FixSnippet.tsx` | Fix accordion component |
| `client/src/components/audit/ComplianceBadge.tsx` | Compliance status badge |
| `client/src/pages/audits/ComplianceReport.tsx` | Full compliance report page |
