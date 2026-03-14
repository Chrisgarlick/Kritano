# Brand Voice Analysis — Feature Plan

## Overview

A new audit module that analyses the tone of voice and writing style across a user's website, producing a comprehensive "Brand Voice Profile". This gives users an at-a-glance understanding of how their website communicates — covering formality, emotional tone, vocabulary patterns, consistency, and actionable recommendations.

This runs as part of the existing content analysis pipeline (alongside E-E-A-T and AEO), aggregating per-page voice signals into a site-wide profile stored on the `audit_jobs` record and surfaced in a dedicated UI tab and all exports.

**No LLM/API calls required.** All analysis is regex, NLP heuristic, and cheerio-based — consistent with the existing engine patterns (E-E-A-T, AEO, Content Quality).

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Tier gate | Pro+ | Aligns with E-E-A-T/AEO — advanced content analysis |
| LLM dependency | None | Regex/heuristic only — fast, free, predictable |
| Scope | Per-page + site-wide aggregate | Individual page scores + aggregated voice profile |
| Category name | `content-brand-voice` | Follows `content-eeat` / `content-aeo` naming |
| Integration point | Inside `ContentEngine` | Same pattern as eeat/aeo modules |
| Score weight | 0.12 (base) | Added to dynamic weight normalization pool |

---

## Database Changes

### Migration: `074_add_brand_voice.sql`

```sql
-- Brand Voice Analysis support
-- Adds per-page and per-job brand voice scoring and profile data

-- Per-page brand voice score
ALTER TABLE audit_pages
  ADD COLUMN IF NOT EXISTS brand_voice_score INT;

-- Per-job aggregate brand voice score + profile JSON
ALTER TABLE audit_jobs
  ADD COLUMN IF NOT EXISTS brand_voice_score INT,
  ADD COLUMN IF NOT EXISTS brand_voice_profile JSONB;

-- Tier gate
ALTER TABLE tier_limits
  ADD COLUMN IF NOT EXISTS enable_brand_voice BOOLEAN DEFAULT FALSE;

-- Enable for Pro+ tiers
UPDATE tier_limits SET enable_brand_voice = TRUE
  WHERE tier IN ('pro', 'agency', 'enterprise');

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_audit_pages_brand_voice_score
  ON audit_pages(brand_voice_score) WHERE brand_voice_score IS NOT NULL;
```

### `brand_voice_profile` JSONB Structure

This is the site-wide aggregated profile stored on `audit_jobs`:

```jsonc
{
  "score": 72,                          // 0-100 overall voice score

  // Core voice attributes (each 0-100)
  "formality": 35,                      // 0 = very casual, 100 = very formal
  "emotionalTone": 65,                  // 0 = cold/clinical, 100 = warm/enthusiastic
  "confidence": 78,                     // 0 = hedging/uncertain, 100 = authoritative/assertive
  "technicality": 42,                   // 0 = layperson, 100 = expert jargon
  "personality": 70,                    // 0 = anonymous/generic, 100 = distinctive/personal

  // Tier classification
  "tier": "conversational-expert",      // see tier definitions below

  // Consistency metrics
  "consistency": {
    "overallScore": 82,                 // 0-100 how consistent voice is across pages
    "formalityVariance": 0.15,          // lower = more consistent
    "toneVariance": 0.10,
    "outlierPages": ["https://..."]     // pages that deviate significantly
  },

  // Detected patterns
  "patterns": {
    "pointOfView": "first-singular",    // first-singular | first-plural | second | third | mixed
    "sentenceStyle": "mixed",           // short | long | mixed
    "paragraphLength": "medium",        // short | medium | long
    "usesContractions": true,
    "usesRhetoricalQuestions": true,
    "usesEmDashes": true,
    "usesExclamations": false,
    "usesImperatives": true,
    "dialectHint": "british"            // british | american | neutral
  },

  // Vocabulary analysis
  "vocabulary": {
    "avgWordLength": 4.8,
    "uniqueWordRatio": 0.62,
    "topRecurringPhrases": [
      { "phrase": "get in touch", "count": 8 },
      { "phrase": "user experience", "count": 6 }
    ],
    "powerWords": ["seamless", "transform", "boost", "empower"],
    "brandTerms": ["PagePulser", "Coffee Design"],  // Proper nouns recurring 3+ times
    "ctaLanguage": ["Get in touch", "Read more", "View Work"],
    "jargonTerms": ["SEO", "CMS", "HubSpot", "WCAG"],
    "readingLevel": "secondary-school"  // elementary | secondary-school | undergraduate | graduate | expert
  },

  // Content structure patterns
  "contentPatterns": {
    "avgHeadingStyle": "conversational", // conversational | formal | mixed
    "ctaPlacement": "end",              // start | middle | end | throughout
    "opensWithQuestion": 0.75,          // ratio of pages that open with a question
    "usesListsFrequently": true,
    "avgSectionsPerPage": 5.2
  },

  // Evidence samples (up to 20 — for UI display)
  "evidence": [
    {
      "type": "tone-sample",
      "label": "Conversational opener",
      "text": "Have you ever landed on a website that looked slick...",
      "url": "https://example.com/blog/ui-ux"
    }
  ],

  // Per-page breakdown (summary only — full data in audit_pages)
  "pageBreakdown": [
    {
      "url": "https://...",
      "formality": 30,
      "emotionalTone": 70,
      "contentType": "blog",
      "voiceScore": 75
    }
  ]
}
```

---

## Backend Changes

### 1. New Types — `server/src/types/content.types.ts`

Add the following types alongside the existing E-E-A-T and AEO types:

```typescript
// Brand Voice finding category
// Add 'content-brand-voice' to ContentFindingCategory union

// Brand Voice evidence item
export interface BrandVoiceEvidence {
  type: 'tone-sample' | 'pattern' | 'vocabulary' | 'consistency' | 'cta';
  label: string;
  text?: string;
  url?: string;
}

// Brand Voice detected patterns
export interface BrandVoicePatterns {
  pointOfView: 'first-singular' | 'first-plural' | 'second' | 'third' | 'mixed';
  sentenceStyle: 'short' | 'long' | 'mixed';
  paragraphLength: 'short' | 'medium' | 'long';
  usesContractions: boolean;
  usesRhetoricalQuestions: boolean;
  usesEmDashes: boolean;
  usesExclamations: boolean;
  usesImperatives: boolean;
  dialectHint: 'british' | 'american' | 'neutral';
}

// Brand Voice vocabulary analysis
export interface BrandVoiceVocabulary {
  avgWordLength: number;
  uniqueWordRatio: number;
  topRecurringPhrases: Array<{ phrase: string; count: number }>;
  powerWords: string[];
  brandTerms: string[];
  ctaLanguage: string[];
  jargonTerms: string[];
  readingLevel: 'elementary' | 'secondary-school' | 'undergraduate' | 'graduate' | 'expert';
}

// Brand Voice consistency metrics
export interface BrandVoiceConsistency {
  overallScore: number;
  formalityVariance: number;
  toneVariance: number;
  outlierPages: string[];
}

// Per-page brand voice metrics (used during analysis)
export interface BrandVoicePageMetrics {
  formality: number;         // 0-100
  emotionalTone: number;     // 0-100
  confidence: number;        // 0-100
  technicality: number;      // 0-100
  personality: number;       // 0-100
}

// Brand Voice tier classification
export type BrandVoiceTier =
  | 'corporate-formal'       // High formality, low personality
  | 'professional-polished'  // Medium-high formality, moderate personality
  | 'conversational-expert'  // Low-medium formality, high confidence + personality
  | 'casual-friendly'        // Low formality, high warmth
  | 'generic-bland'          // No distinctive voice detected
  | 'inconsistent';          // High variance across pages

// Full brand voice analysis result (per-page)
export interface BrandVoiceAnalysis {
  score: number;  // 0-100
  metrics: BrandVoicePageMetrics;
  patterns: BrandVoicePatterns;
  findings: ContentFinding[];
  evidence: BrandVoiceEvidence[];
}

// Site-wide aggregated profile (stored in audit_jobs.brand_voice_profile)
export interface BrandVoiceProfile {
  score: number;
  formality: number;
  emotionalTone: number;
  confidence: number;
  technicality: number;
  personality: number;
  tier: BrandVoiceTier;
  consistency: BrandVoiceConsistency;
  patterns: BrandVoicePatterns;
  vocabulary: BrandVoiceVocabulary;
  contentPatterns: {
    avgHeadingStyle: 'conversational' | 'formal' | 'mixed';
    ctaPlacement: 'start' | 'middle' | 'end' | 'throughout';
    opensWithQuestion: number;
    usesListsFrequently: boolean;
    avgSectionsPerPage: number;
  };
  evidence: BrandVoiceEvidence[];
  pageBreakdown: Array<{
    url: string;
    formality: number;
    emotionalTone: number;
    contentType: string;
    voiceScore: number;
  }>;
}
```

### 2. New Module — `server/src/services/audit-engines/content/brand-voice.ts`

Follows the exact same pattern as `eeat.ts` — a single exported function that takes extracted content and returns analysis results.

```typescript
export function analyzeBrandVoice(
  html: string,
  text: string,
  sentences: string[],
  words: string[],
  paragraphs: string[],
  headings: Array<{ level: number; text: string }>,
  url: string
): BrandVoiceAnalysis
```

#### Analysis Dimensions (all regex/heuristic — no API calls)

**A. Formality Score (0-100)**

| Signal | Low Formality | High Formality |
|---|---|---|
| Contractions | "don't", "I'm", "you'll" | "do not", "I am" |
| Pronouns | "I", "you", "we" | "one", "the organization" |
| Sentence starters | "But", "And", "So" | Never starts with conjunction |
| Colloquialisms | "a lot", "kind of", "pretty much" | Formal alternatives |
| Exclamations | Frequent "!" | Rare or absent |
| Slang/informal | "awesome", "cool", "gonna" | Absent |

Detection approach:
- Count contractions via regex (`/\b\w+'(t|re|ve|ll|d|s|m)\b/gi`)
- Count informal sentence starters (`/^(But|And|So|Plus|Also)\b/`)
- Count first/second person pronouns vs third person
- Check for colloquialism word list
- Ratio calculations produce 0-100 scale

**B. Emotional Tone Score (0-100)**

| Signal | Cold/Clinical (0) | Warm/Enthusiastic (100) |
|---|---|---|
| Power words | Absent | "amazing", "love", "passionate" |
| Empathy phrases | Absent | "I've been there", "we understand" |
| Exclamation marks | 0 | Moderate use |
| Positive sentiment | Neutral vocabulary | Positive adjectives |
| Personal anecdotes | Absent | Present |

Detection approach:
- Power word density (existing engagement module already detects these)
- Positive vs negative sentiment word ratio (curated word lists)
- Empathy/connection phrase regex patterns
- Personal pronoun + feeling verb combinations ("I love", "we're passionate about")

**C. Confidence Score (0-100)**

| Signal | Uncertain/Hedging (0) | Assertive/Authoritative (100) |
|---|---|---|
| Hedging words | "maybe", "might", "perhaps", "sort of" | Absent |
| Definitive language | Absent | "will", "always", "never", "must" |
| Imperative mood | Absent | "Do this", "Try", "Use" |
| Qualifiers | "a little", "somewhat" | Direct statements |
| Opinion markers | Absent | "I recommend", "The best approach is" |

Detection approach:
- Hedge word count (`/\b(maybe|might|perhaps|sort of|kind of|possibly|somewhat)\b/gi`)
- Definitive word count
- Imperative sentence detection (starts with verb)
- Qualifier ratio

**D. Technicality Score (0-100)**

Reuses existing expertise detection from E-E-A-T module:
- Technical term density (3+ syllable non-common words)
- Jargon/acronym frequency
- Average word length
- Flesch-Kincaid grade level (already computed by readability module)

**E. Personality Score (0-100)**

| Signal | Generic/Anonymous (0) | Distinctive/Personal (100) |
|---|---|---|
| First person | Absent | Frequent |
| Rhetorical questions | Absent | Present |
| Em dashes | Absent | Used for asides |
| Humor/wit markers | Absent | Present |
| Unique phrases | Generic | Recurring distinctive phrases |
| Story-telling | Absent | Anecdotal openings |

Detection approach:
- First person pronoun density
- Rhetorical question count (`/^[A-Z][^.?]*\?$/` at paragraph start)
- Em dash count (`/—|--/`)
- Parenthetical asides count
- Unique bigram/trigram analysis for recurring phrases

#### Pattern Detection

**Point of View:**
- Count I/me/my (first-singular), we/our/us (first-plural), you/your (second), the/one/it (third)
- Dominant POV = highest count; "mixed" if no clear winner (>60%)

**Dialect Detection:**
- British spelling patterns: `-ise`, `-our`, `-ised`, `-yse`, `whilst`
- American spelling patterns: `-ize`, `-or`, `-ized`, `-yze`, `while`
- Count matches, classify based on ratio

**Contraction Detection:**
- Regex for common contractions
- Boolean: >2% of words are contractions = `true`

**Sentence Style:**
- Average words per sentence (already computed by readability module)
- <12 = "short", 12-20 = "mixed", >20 = "long"

#### Tier Classification

```
if (consistency.overallScore < 50): 'inconsistent'
if (personality < 30 && confidence < 40): 'generic-bland'
if (formality >= 70 && personality < 50): 'corporate-formal'
if (formality >= 50 && formality < 70): 'professional-polished'
if (formality < 50 && confidence >= 50 && personality >= 50): 'conversational-expert'
if (formality < 40 && emotionalTone >= 60): 'casual-friendly'
else: 'professional-polished' (fallback)
```

#### Findings Generated

| Rule ID | Severity | Trigger |
|---|---|---|
| `brand-voice-inconsistent` | serious | Consistency score < 50 |
| `brand-voice-generic` | moderate | Personality score < 30 |
| `brand-voice-overly-formal` | minor | Formality > 85 for non-legal/financial content |
| `brand-voice-too-casual` | minor | Formality < 15 for professional services |
| `brand-voice-low-confidence` | moderate | Confidence < 30 (excessive hedging) |
| `brand-voice-no-cta-language` | moderate | No CTAs detected across pages |
| `brand-voice-no-personality` | moderate | No first-person, questions, or em-dashes |
| `brand-voice-mixed-dialect` | minor | Both British and American spellings detected |
| `brand-voice-jargon-heavy` | minor | Technicality > 80 without explanation patterns |
| `brand-voice-strong-voice` | info | Score >= 75 — positive reinforcement |

### 3. Content Engine Integration — `server/src/services/audit-engines/content.engine.ts`

```typescript
// Add import
import { analyzeBrandVoice } from './content/brand-voice.js';

// Add to ContentEngineOptions
export interface ContentEngineOptions {
  // ... existing options
  enableBrandVoice?: boolean;  // Default: false (gated by tier)
}

// Add to BASE_WEIGHTS
const BASE_WEIGHTS: Record<string, number> = {
  // ... existing weights
  brandVoice: 0.12,
};

// Add to ContentSubscores
export interface ContentSubscores {
  // ... existing subscores
  brandVoice: number | null;
}

// In analyze() method, after eeat/aeo analysis:
if (this.options.enableBrandVoice) {
  const brandVoiceResult = analyzeBrandVoice(
    html, extracted.text, extracted.sentences,
    extracted.words, extracted.paragraphs, extracted.headings, url
  );
  subscores.brandVoice = brandVoiceResult.score;
  allFindings.push(...brandVoiceResult.findings);
  // Store per-page metrics for later aggregation
}

// Add 'brandVoice' to dynamic weight normalization pool
```

### 4. Audit Config — `server/src/types/audit.types.ts`

```typescript
// Add to AuditJob interface
check_brand_voice?: boolean;
brand_voice_score?: number | null;
brand_voice_profile?: BrandVoiceProfile | null;

// Add to AuditConfig (in audit-engines/index.ts)
checkBrandVoice: boolean;
```

### 5. Audit Engine Coordinator — `server/src/services/audit-engines/index.ts`

In the `analyzeContent()` method, pass the new flag:

```typescript
const contentResult = await this.contentEngine.analyze(crawlResult, {
  // ... existing options
  enableBrandVoice: config.checkBrandVoice,
});
```

After all pages are processed, aggregate per-page brand voice metrics into the site-wide `BrandVoiceProfile` and store it on the `audit_jobs` record as `brand_voice_profile` JSONB.

### 6. Aggregation Logic — `server/src/services/audit-engines/brand-voice-aggregator.ts`

New file responsible for combining per-page voice metrics into the site-wide profile:

```typescript
export function aggregateBrandVoiceProfile(
  pageResults: Array<{
    url: string;
    contentType: string;
    analysis: BrandVoiceAnalysis;
    words: string[];
    sentences: string[];
  }>
): BrandVoiceProfile
```

This:
1. Averages per-page formality/tone/confidence/technicality/personality scores
2. Calculates variance for consistency scoring
3. Identifies outlier pages (>1.5 standard deviations from mean)
4. Merges vocabulary across pages (recurring phrases, power words, brand terms)
5. Classifies the overall voice tier
6. Selects best evidence samples (up to 20)

### 7. Tier Gating — `server/src/routes/audits/index.ts`

In the audit creation route, check `enable_brand_voice` from the site owner's tier limits:

```typescript
const tierLimits = await getSiteOwnerTierLimits(siteId);
const checkBrandVoice = tierLimits.enable_brand_voice && requestBody.check_brand_voice;
```

### 8. Export Integration

#### PDF — `server/src/services/pdf-report.service.ts`

Add to `CATEGORY_LABELS`:
```typescript
'content-brand-voice': { short: 'Brand Voice', full: 'Brand Voice Analysis' }
```

Add to `CATEGORY_COLORS`:
```typescript
'content-brand-voice': '#ec4899' // Pink — distinctive, not used by other categories
```

Add a dedicated `buildBrandVoicePage()` method that renders:
- Voice tier badge (e.g. "Conversational Expert")
- 5-axis radar/spider chart (formality, tone, confidence, technicality, personality)
- Consistency score bar
- Top recurring phrases table
- Detected patterns summary
- Evidence samples
- Per-page breakdown table
- Findings list

#### CSV — automatic

Findings with `category = 'content-brand-voice'` will automatically appear in CSV exports via the existing `exportCsv()` logic which groups by `rule_id`.

#### JSON — automatic

The `brand_voice_profile` JSONB field is included in the full audit JSON export automatically.

#### Markdown / HTML — update report builder

Add a "Brand Voice" section that renders the profile summary in text format.

---

## Frontend Changes

### 1. New Tab — `BrandVoiceTab.tsx`

Add a new tab in `AuditDetail.tsx` (visible when `brand_voice_profile` exists on the audit):

```
client/src/pages/audits/components/BrandVoiceTab.tsx
```

#### Tab Layout

**A. Voice Profile Hero**
- Large tier badge: e.g. "Conversational Expert" with description
- Overall voice score (0-100) with gauge
- One-line summary generated from attributes: e.g. "Your website has a warm, conversational tone with high confidence and a strong personal voice."

**B. Voice Attributes Panel**
- 5 horizontal bars or a radar chart:
  - Formality: 0 (Casual) → 100 (Formal)
  - Emotional Tone: 0 (Clinical) → 100 (Warm)
  - Confidence: 0 (Hedging) → 100 (Assertive)
  - Technicality: 0 (Layperson) → 100 (Expert)
  - Personality: 0 (Generic) → 100 (Distinctive)

**C. Consistency Panel**
- Consistency score with progress bar
- If inconsistent: list outlier pages with their individual scores
- Recommendation if variance is high

**D. Writing Patterns Panel**
- Grid of detected patterns:
  - Point of view: "First Person Singular (I/me/my)"
  - Sentence style: "Mixed — varies between short and long"
  - Contractions: "Yes — uses contractions frequently"
  - Rhetorical questions: "Yes — often opens with questions"
  - Dialect: "British English"
  - Em dashes: "Frequent — used for asides"

**E. Vocabulary Panel**
- Top recurring phrases as tag pills
- Power words list
- Brand-specific terms
- CTA language patterns
- Jargon/technical terms
- Reading level indicator

**F. Page Breakdown Table**
- Sortable table: URL | Content Type | Formality | Tone | Voice Score
- Click to expand for per-page details

**G. Evidence Panel**
- Collapsible list of text samples with source URLs
- Labelled by type (opener, CTA, opinion, etc.)

**H. Findings List**
- Standard findings display (reuse existing `FindingsList` component)
- Filtered to `category = 'content-brand-voice'`

### 2. Audit Detail Overview

Add brand voice score to the scores overview section in `AuditDetail.tsx`:
- New score card: "Brand Voice" with the voice score
- Mini tier badge showing the classification

### 3. New Audit Form

Add a "Brand Voice Analysis" checkbox to the new audit form:
- Only visible when user's tier supports it (Pro+)
- Disabled with upgrade prompt for lower tiers

### 4. Tier Display Updates

Update the frontend tier comparison table/cards to include:
```
| Brand Voice Analysis | - | - | Yes | Yes | Yes |
```

---

## Critical Files Summary

| Purpose | File |
|---|---|
| **New** Brand voice module | `server/src/services/audit-engines/content/brand-voice.ts` |
| **New** Brand voice aggregator | `server/src/services/audit-engines/brand-voice-aggregator.ts` |
| **New** Brand voice types | Added to `server/src/types/content.types.ts` |
| **New** Migration | `server/src/db/migrations/074_add_brand_voice.sql` |
| **New** Frontend tab | `client/src/pages/audits/components/BrandVoiceTab.tsx` |
| **Modify** Content engine | `server/src/services/audit-engines/content.engine.ts` |
| **Modify** Audit types | `server/src/types/audit.types.ts` |
| **Modify** Finding types | `server/src/types/finding.types.ts` (add category) |
| **Modify** Engine coordinator | `server/src/services/audit-engines/index.ts` |
| **Modify** Audit routes | `server/src/routes/audits/index.ts` |
| **Modify** PDF report | `server/src/services/pdf-report.service.ts` |
| **Modify** Markdown/HTML export | Export builders |
| **Modify** Audit detail page | `client/src/pages/audits/AuditDetail.tsx` |
| **Modify** New audit form | `client/src/pages/audits/NewAudit.tsx` |
| **Modify** Tier display | Frontend tier comparison components |
| **Modify** Tiers doc | `docs/TIERS.md` |

---

## Testing Plan

### Unit Tests
- [ ] `brand-voice.ts` — test each dimension independently with crafted HTML/text
- [ ] Test formality scoring with known casual vs formal text samples
- [ ] Test dialect detection with British vs American spelling
- [ ] Test contraction, rhetorical question, em dash detection
- [ ] Test confidence scoring (hedging vs assertive)
- [ ] Test personality scoring (generic vs distinctive)
- [ ] Test tier classification logic with edge cases
- [ ] `brand-voice-aggregator.ts` — test aggregation with multiple page results
- [ ] Test consistency scoring with uniform vs varied inputs
- [ ] Test outlier detection

### Integration Tests
- [ ] Run full audit with `check_brand_voice: true` on test site
- [ ] Verify findings stored with `category = 'content-brand-voice'`
- [ ] Verify `brand_voice_profile` JSONB populated on `audit_jobs`
- [ ] Verify `brand_voice_score` populated on `audit_pages`
- [ ] Verify tier gating — Free/Starter users cannot enable brand voice

### Export Tests
- [ ] PDF contains Brand Voice section with all profile data
- [ ] CSV includes brand voice findings grouped by rule_id
- [ ] JSON export includes `brand_voice_profile`
- [ ] Markdown export includes brand voice summary

### Frontend Tests
- [ ] Brand Voice tab renders when data exists
- [ ] Brand Voice tab hidden when data is null
- [ ] Score cards display correctly
- [ ] Pattern grid renders all detected patterns
- [ ] Vocabulary panel displays phrase pills
- [ ] Page breakdown table is sortable
- [ ] Findings list filters correctly
- [ ] Tier comparison updated

---

## Implementation Order

1. **Types** — Add all new types to `content.types.ts`
2. **Migration** — Create and run `074_add_brand_voice.sql`
3. **Finding types** — Add `'content-brand-voice'` to `FindingCategory` and `ContentFindingCategory`
4. **Core module** — Build `brand-voice.ts` with all 5 dimension analysers + pattern detection + findings
5. **Aggregator** — Build `brand-voice-aggregator.ts` for site-wide profile generation
6. **Content engine** — Integrate brand voice into `content.engine.ts` (weight normalisation, options, result merging)
7. **Audit config** — Add `checkBrandVoice` to config types and coordinator
8. **Routes** — Add tier gating and `check_brand_voice` to audit creation
9. **Worker** — Ensure aggregated profile is stored on job completion
10. **PDF export** — Add brand voice section to PDF report builder
11. **Other exports** — Update markdown/HTML export builders
12. **Frontend: Tab** — Build `BrandVoiceTab.tsx`
13. **Frontend: Integration** — Add tab to `AuditDetail.tsx`, score to overview, checkbox to new audit form
14. **Frontend: Tiers** — Update tier comparison display
15. **Docs** — Update `TIERS.md`
16. **Tests** — Unit, integration, export, and frontend tests
