# Content Analysis Engine Specification

## Overview

A deterministic content quality scoring engine that evaluates webpage content using statistical linguistics, structural analysis, and SEO best practices. This engine integrates with PagePulser's existing audit architecture as a new analysis dimension alongside SEO, Accessibility, Security, and Performance.

## Key Decisions

1. **No LLM dependency** - All analysis is deterministic and algorithmic for speed, consistency, and cost
2. **Integrates with existing engine architecture** - Follows the same pattern as `seo.engine.ts`
3. **Separate score category** - Content gets its own 0-100 score, not mixed into SEO
4. **Keyword-optional** - Works without a target keyword but provides enhanced analysis when one is provided
5. **Performance-first** - Sub-200ms execution target per page

## The Content Score Formula

The total Content Score (C) is calculated as a weighted sum of five sub-scores:

```
C = (Q × 0.30) + (R × 0.25) + (S × 0.20) + (E × 0.15) + (K × 0.10)
```

| Component | Variable | Weight | Description |
|-----------|----------|--------|-------------|
| Content Quality | Q | 30% | Depth, originality signals, multimedia |
| Readability | R | 25% | Multiple readability algorithms |
| Structure | S | 20% | Heading hierarchy, content organization |
| Engagement | E | 15% | Hooks, CTAs, questions, power words |
| Keyword Optimization | K | 10% | Target keyword analysis (when provided) |

---

## Component Specifications

### A. Content Quality Score (Q) - 30%

Evaluates the substantive quality of content.

#### A1. Content Depth Analysis

| Metric | Scoring |
|--------|---------|
| Word count < 300 | 0 points (thin content) |
| Word count 300-600 | 40 points |
| Word count 600-1200 | 70 points |
| Word count 1200-2500 | 100 points |
| Word count > 2500 | 90 points (diminishing returns) |

**Implementation:**
```typescript
function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function scoreContentDepth(wordCount: number): number {
  if (wordCount < 300) return 0;
  if (wordCount < 600) return 40;
  if (wordCount < 1200) return 70;
  if (wordCount <= 2500) return 100;
  return 90; // Very long content has diminishing returns
}
```

#### A2. Unique Content Signals

Detect boilerplate and template content:

| Check | Deduction |
|-------|-----------|
| Content < 50% of page HTML | -10 points |
| Repeated paragraph patterns | -15 points |
| Heavy navigation-to-content ratio | -10 points |
| Detected CMS boilerplate phrases | -5 points |

**Boilerplate Detection Phrases:**
```typescript
const BOILERPLATE_PATTERNS = [
  /all rights reserved/i,
  /copyright \d{4}/i,
  /privacy policy/i,
  /terms (of|and) (service|use|conditions)/i,
  /cookie (policy|consent|notice)/i,
  /powered by \w+/i,
  /built with \w+/i,
  /subscribe to our newsletter/i,
  /follow us on/i,
  /share (this|on)/i,
];
```

#### A3. Multimedia Integration

| Element | Points |
|---------|--------|
| At least 1 relevant image | +5 points |
| Image with caption | +3 points (each, max 9) |
| Embedded video | +8 points |
| Infographic/diagram | +5 points |
| Data table | +5 points |
| Code block (technical content) | +3 points |

**Maximum multimedia bonus: +25 points**

#### A4. Content Freshness Signals

| Signal | Points |
|--------|--------|
| Published date detected (< 6 months) | +5 points |
| Last modified date detected (< 3 months) | +5 points |
| "Updated" text with recent year | +3 points |
| References to current year | +2 points |

---

### B. Readability Score (R) - 25%

Uses multiple algorithms for comprehensive readability assessment.

#### B1. Flesch-Kincaid Grade Level

```typescript
function getFleschKincaidGrade(text: string): number {
  const words = getWordCount(text);
  const sentences = getSentenceCount(text);
  const syllables = getSyllableCount(text);

  if (words === 0 || sentences === 0) return 0;

  return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
}
```

| Grade Level | Score | Audience |
|-------------|-------|----------|
| 5-6 | 100 | Very easy (mass audience) |
| 7-8 | 95 | Easy (general web) |
| 9-10 | 85 | Standard |
| 11-12 | 70 | Somewhat difficult |
| 13-16 | 50 | College level |
| 17+ | 30 | Academic/technical |

#### B2. Flesch Reading Ease

```typescript
function getFleschReadingEase(text: string): number {
  const words = getWordCount(text);
  const sentences = getSentenceCount(text);
  const syllables = getSyllableCount(text);

  if (words === 0 || sentences === 0) return 0;

  return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
}
```

| Score | Difficulty |
|-------|------------|
| 90-100 | Very easy |
| 80-89 | Easy |
| 70-79 | Fairly easy |
| 60-69 | Standard |
| 50-59 | Fairly difficult |
| 30-49 | Difficult |
| 0-29 | Very difficult |

#### B3. Gunning Fog Index

```typescript
function getGunningFog(text: string): number {
  const words = getWordCount(text);
  const sentences = getSentenceCount(text);
  const complexWords = getComplexWordCount(text); // 3+ syllables

  if (words === 0 || sentences === 0) return 0;

  return 0.4 * ((words / sentences) + 100 * (complexWords / words));
}
```

#### B4. Automated Readability Index (ARI)

```typescript
function getARI(text: string): number {
  const characters = text.replace(/\s/g, '').length;
  const words = getWordCount(text);
  const sentences = getSentenceCount(text);

  if (words === 0 || sentences === 0) return 0;

  return 4.71 * (characters / words) + 0.5 * (words / sentences) - 21.43;
}
```

#### B5. Combined Readability Score

```typescript
function calculateReadabilityScore(text: string): { score: number; metrics: ReadabilityMetrics } {
  const fkGrade = getFleschKincaidGrade(text);
  const fre = getFleschReadingEase(text);
  const fog = getGunningFog(text);
  const ari = getARI(text);

  // Normalize to 0-100 scale, targeting grade 7-9
  const gradeScore = Math.max(0, Math.min(100, 100 - (Math.abs(fkGrade - 8) * 10)));
  const freScore = Math.min(100, fre);

  // Weighted average
  const score = (gradeScore * 0.4) + (freScore * 0.4) + (Math.max(0, 100 - fog * 5) * 0.2);

  return {
    score: Math.round(score),
    metrics: {
      fleschKincaidGrade: Math.round(fkGrade * 10) / 10,
      fleschReadingEase: Math.round(fre * 10) / 10,
      gunningFog: Math.round(fog * 10) / 10,
      automatedReadabilityIndex: Math.round(ari * 10) / 10,
      avgWordsPerSentence: Math.round((getWordCount(text) / getSentenceCount(text)) * 10) / 10,
      avgSyllablesPerWord: Math.round((getSyllableCount(text) / getWordCount(text)) * 100) / 100,
    }
  };
}
```

#### B6. Sentence Variety Analysis

| Check | Adjustment |
|-------|------------|
| All sentences similar length (< 10% variance) | -10 points |
| Good mix of short/medium/long | +5 points |
| No sentences > 40 words | +5 points |
| Sentences starting with variety | +5 points |

---

### C. Structure Score (S) - 20%

Evaluates content organization and hierarchy.

#### C1. Heading Hierarchy

| Rule | Points |
|------|--------|
| Exactly one H1 | +20 points |
| H1 contains primary topic | +10 points |
| No skipped heading levels | +15 points |
| H2s present for major sections | +10 points |
| H3s for subsections (when needed) | +5 points |
| Headings at regular intervals (every 300-500 words) | +10 points |

**Violations:**
| Issue | Deduction |
|-------|-----------|
| Missing H1 | -25 points |
| Multiple H1s | -15 points |
| H3 before H2 | -10 points |
| Wall of text (> 500 words without heading) | -10 points per instance |

#### C2. Paragraph Structure

| Metric | Scoring |
|--------|---------|
| Avg paragraph length 40-80 words | Optimal |
| Paragraphs > 100 words | -3 points each (max -15) |
| Single-sentence paragraphs > 30% | -10 points |
| No paragraphs > 150 words | +10 points |

#### C3. Content Sectioning

| Element | Points |
|---------|--------|
| Clear introduction (first 100 words) | +10 points |
| Conclusion/summary section | +5 points |
| Logical section progression | +10 points |
| Table of contents (for long content) | +5 points |

#### C4. List Usage

| Check | Points |
|-------|--------|
| At least one list in content | +5 points |
| Lists used appropriately (not overused) | +5 points |
| Bulleted lists for unordered items | +3 points |
| Numbered lists for sequences | +3 points |
| Lists > 70% of content | -15 points |

---

### D. Engagement Score (E) - 15%

Evaluates elements that drive reader engagement.

#### D1. Opening Hook Analysis

First 100 words are analyzed for:

| Element | Points |
|---------|--------|
| Question in first 2 sentences | +10 points |
| Statistic or data point | +8 points |
| Bold claim or statement | +5 points |
| Story opener ("When I..." / "Imagine...") | +8 points |
| Problem statement | +7 points |
| Generic opener detected | -5 points |

**Generic Openers to Detect:**
```typescript
const GENERIC_OPENERS = [
  /^in (this|today's) (article|post|guide)/i,
  /^welcome to/i,
  /^have you ever wondered/i,
  /^are you looking for/i,
  /^if you('re| are) (looking|searching|trying)/i,
];
```

#### D2. Power Words Detection

Detect emotional/action words that drive engagement:

```typescript
const POWER_WORDS = {
  urgency: ['now', 'today', 'immediately', 'instant', 'fast', 'quick', 'hurry', 'limited'],
  exclusivity: ['exclusive', 'secret', 'insider', 'members-only', 'private', 'hidden'],
  value: ['free', 'bonus', 'save', 'discount', 'bargain', 'valuable', 'priceless'],
  trust: ['proven', 'guaranteed', 'certified', 'official', 'authentic', 'secure'],
  emotion: ['amazing', 'incredible', 'remarkable', 'stunning', 'breathtaking', 'shocking'],
  curiosity: ['surprising', 'unexpected', 'unusual', 'strange', 'mysterious', 'revealed'],
};
```

| Power Word Density | Points |
|--------------------|--------|
| 1-2% of content | +10 points |
| 2-4% of content | +5 points |
| > 5% of content | -5 points (oversaturation) |
| 0% of content | -5 points |

#### D3. Question Usage

| Metric | Points |
|--------|--------|
| Questions in content (1-3 per 500 words) | +10 points |
| Rhetorical questions | +5 points |
| No questions | -5 points |
| Excessive questions (> 1 per 100 words) | -10 points |

#### D4. Call-to-Action Analysis

| CTA Quality | Points |
|-------------|--------|
| Clear CTA present | +10 points |
| CTA in conclusion | +5 points |
| Multiple relevant CTAs | +5 points |
| CTA with action verb | +5 points |
| No CTA detected | -10 points |

**CTA Detection Patterns:**
```typescript
const CTA_PATTERNS = [
  /\b(click|tap|press|hit)\s+(here|now|below|the button)/i,
  /\b(sign up|subscribe|register|join|download|get started)/i,
  /\b(learn more|read more|find out|discover|explore)/i,
  /\b(buy|purchase|order|shop|add to cart)/i,
  /\b(contact|call|email|reach out|get in touch)/i,
  /\b(try|start|begin|request|claim)\s+(free|now|today|your)/i,
];
```

#### D5. Transition Words

Measure content flow through transition word usage:

```typescript
const TRANSITION_WORDS = {
  addition: ['additionally', 'furthermore', 'moreover', 'also', 'besides', 'in addition'],
  contrast: ['however', 'nevertheless', 'although', 'despite', 'whereas', 'but', 'yet'],
  cause: ['because', 'since', 'therefore', 'consequently', 'thus', 'hence', 'as a result'],
  sequence: ['first', 'second', 'next', 'then', 'finally', 'subsequently', 'meanwhile'],
  example: ['for example', 'for instance', 'such as', 'specifically', 'namely', 'including'],
  conclusion: ['in conclusion', 'to summarize', 'overall', 'in summary', 'ultimately'],
};
```

| Transition Usage | Points |
|------------------|--------|
| 2-4% of sentences start with transitions | +15 points |
| 1-2% | +10 points |
| 4-6% | +5 points |
| < 1% or > 8% | -5 points |

---

### E. Keyword Optimization Score (K) - 10%

Only calculated when a target keyword is provided. If no keyword, this weight is redistributed.

#### E1. Keyword Density

```typescript
function getKeywordDensity(text: string, keyword: string): number {
  const words = getWordCount(text);
  const keywordCount = countKeywordOccurrences(text, keyword);
  return (keywordCount / words) * 100;
}
```

| Density | Score |
|---------|-------|
| 1.0-2.0% | 100 points |
| 2.0-3.0% | 85 points |
| 0.5-1.0% | 70 points |
| 3.0-4.0% | 50 points |
| > 4.5% | 20 points + "Keyword Stuffing" flag |
| < 0.5% | 40 points |

#### E2. Keyword Placement

| Location | Points |
|----------|--------|
| In H1 | +15 points |
| In first 100 words | +10 points |
| In meta title | +10 points |
| In meta description | +10 points |
| In at least one H2 | +5 points |
| In URL | +5 points |
| In image alt text | +5 points |
| In last 100 words | +5 points |

#### E3. Keyword Variations (LSI-like)

Detect and reward semantic variations:

```typescript
function getKeywordVariations(keyword: string): string[] {
  const words = keyword.toLowerCase().split(/\s+/);
  const variations: string[] = [];

  // Plural/singular forms
  words.forEach(word => {
    if (word.endsWith('s')) variations.push(word.slice(0, -1));
    else variations.push(word + 's');
  });

  // Word order variations (for multi-word keywords)
  if (words.length > 1) {
    variations.push(words.reverse().join(' '));
  }

  return variations;
}
```

| Variation Usage | Points |
|-----------------|--------|
| 2+ variations used naturally | +10 points |
| 1 variation | +5 points |
| Only exact match | 0 points |
| Excessive variations | -5 points |

#### E4. Keyword Proximity

For multi-word keywords, measure how close the words appear:

| Proximity | Points |
|-----------|--------|
| Words adjacent (exact match) | +10 points |
| Words within 3 words | +7 points |
| Words within 5 words | +5 points |
| Words scattered | +2 points |

---

## Findings Generation

The content engine generates findings following PagePulser's existing pattern:

### Finding Categories

```typescript
type ContentFindingCategory =
  | 'content-quality'    // Depth, uniqueness, multimedia
  | 'content-readability' // Reading level, sentence structure
  | 'content-structure'   // Headings, paragraphs, organization
  | 'content-engagement'  // Hooks, CTAs, engagement elements
  | 'content-keywords';   // Keyword optimization (when applicable)
```

### Rule IDs and Severities

| Rule ID | Name | Severity | Category |
|---------|------|----------|----------|
| `thin-content` | Thin Content | serious | content-quality |
| `no-multimedia` | No Images or Media | minor | content-quality |
| `boilerplate-heavy` | High Boilerplate Ratio | moderate | content-quality |
| `outdated-content` | No Freshness Signals | minor | content-quality |
| `poor-readability` | Poor Readability Score | serious | content-readability |
| `long-sentences` | Excessive Sentence Length | moderate | content-readability |
| `no-sentence-variety` | Monotonous Sentence Structure | minor | content-readability |
| `complex-vocabulary` | High Vocabulary Complexity | moderate | content-readability |
| `missing-h1` | Missing H1 Heading | serious | content-structure |
| `multiple-h1` | Multiple H1 Headings | moderate | content-structure |
| `heading-hierarchy-broken` | Broken Heading Hierarchy | moderate | content-structure |
| `wall-of-text` | Wall of Text Detected | serious | content-structure |
| `poor-paragraph-structure` | Poor Paragraph Structure | moderate | content-structure |
| `no-lists` | No List Elements | minor | content-structure |
| `weak-opening` | Weak Opening Hook | moderate | content-engagement |
| `no-cta` | No Call-to-Action | moderate | content-engagement |
| `no-questions` | No Questions in Content | minor | content-engagement |
| `low-transition-words` | Low Transition Word Usage | minor | content-engagement |
| `keyword-stuffing` | Keyword Stuffing Detected | serious | content-keywords |
| `keyword-missing-h1` | Keyword Not in H1 | moderate | content-keywords |
| `keyword-missing-intro` | Keyword Not in Introduction | moderate | content-keywords |
| `low-keyword-density` | Low Keyword Density | minor | content-keywords |

---

## Output Schema

### Content Analysis Response

```typescript
interface ContentAnalysisResult {
  score: number; // 0-100

  subscores: {
    quality: number;
    readability: number;
    structure: number;
    engagement: number;
    keywords: number | null; // null if no keyword provided
  };

  metrics: {
    // Quality metrics
    wordCount: number;
    uniqueContentRatio: number; // 0-1
    multimediaCount: number;
    freshnessScore: number;

    // Readability metrics
    fleschKincaidGrade: number;
    fleschReadingEase: number;
    gunningFog: number;
    automatedReadabilityIndex: number;
    avgWordsPerSentence: number;
    avgSyllablesPerWord: number;
    sentenceVariety: number; // 0-1

    // Structure metrics
    headingCount: { h1: number; h2: number; h3: number; h4: number };
    avgParagraphLength: number;
    listCount: number;
    hasTableOfContents: boolean;

    // Engagement metrics
    hookStrength: number; // 0-100
    ctaCount: number;
    questionCount: number;
    powerWordDensity: number;
    transitionWordRatio: number;

    // Keyword metrics (when applicable)
    keywordDensity?: number;
    keywordOccurrences?: number;
    keywordInTitle?: boolean;
    keywordInH1?: boolean;
    keywordInIntro?: boolean;
    keywordInMeta?: boolean;
  };

  findings: ContentFinding[];

  // Reading time calculation
  readingTimeMinutes: number;

  // Content classification
  contentType: 'article' | 'product' | 'landing' | 'documentation' | 'blog' | 'other';
}

interface ContentFinding {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor' | 'info';
  message: string;
  description: string;
  recommendation: string;
  location?: {
    selector?: string;
    excerpt?: string;
    position?: number; // word position in content
  };
}
```

### Sample Output

```json
{
  "score": 78,
  "subscores": {
    "quality": 82,
    "readability": 85,
    "structure": 70,
    "engagement": 75,
    "keywords": 68
  },
  "metrics": {
    "wordCount": 1847,
    "uniqueContentRatio": 0.78,
    "multimediaCount": 3,
    "freshnessScore": 85,
    "fleschKincaidGrade": 8.2,
    "fleschReadingEase": 65.4,
    "gunningFog": 10.1,
    "automatedReadabilityIndex": 8.7,
    "avgWordsPerSentence": 16.3,
    "avgSyllablesPerWord": 1.48,
    "sentenceVariety": 0.72,
    "headingCount": { "h1": 1, "h2": 5, "h3": 8, "h4": 0 },
    "avgParagraphLength": 67,
    "listCount": 3,
    "hasTableOfContents": false,
    "hookStrength": 72,
    "ctaCount": 2,
    "questionCount": 4,
    "powerWordDensity": 0.018,
    "transitionWordRatio": 0.032,
    "keywordDensity": 1.8,
    "keywordOccurrences": 33,
    "keywordInTitle": true,
    "keywordInH1": true,
    "keywordInIntro": true,
    "keywordInMeta": true
  },
  "findings": [
    {
      "ruleId": "wall-of-text",
      "ruleName": "Wall of Text Detected",
      "category": "content-structure",
      "severity": "serious",
      "message": "Section 3 contains 650+ words without a subheading",
      "description": "Large blocks of text without visual breaks reduce readability and user engagement.",
      "recommendation": "Break up long sections with H3 subheadings every 300-400 words.",
      "location": {
        "excerpt": "The implementation process begins with...",
        "position": 892
      }
    },
    {
      "ruleId": "no-cta",
      "ruleName": "No Call-to-Action in Conclusion",
      "category": "content-engagement",
      "severity": "moderate",
      "message": "Content ends without a clear call-to-action",
      "description": "Articles without CTAs miss conversion opportunities.",
      "recommendation": "Add a relevant CTA in the final section (e.g., 'Learn more', 'Get started', 'Contact us')."
    }
  ],
  "readingTimeMinutes": 8,
  "contentType": "article"
}
```

---

## Implementation Architecture

### File Structure

```
server/src/services/
├── audit-engines/
│   ├── index.ts           # Add content engine coordinator
│   ├── seo.engine.ts      # Existing
│   ├── content.engine.ts  # NEW - Main content engine
│   └── content/
│       ├── readability.ts    # Readability algorithms
│       ├── structure.ts      # Structure analysis
│       ├── engagement.ts     # Engagement analysis
│       ├── keywords.ts       # Keyword analysis
│       └── quality.ts        # Quality signals
```

### Engine Interface

```typescript
// content.engine.ts
import type { PageData } from '../../types/spider.types';
import type { Finding } from '../../types/finding.types';
import type { ContentAnalysisResult } from '../../types/content.types';

export interface ContentEngineOptions {
  targetKeyword?: string;
  minWordCount?: number;      // Default: 300
  targetReadingLevel?: number; // Default: 8 (grade level)
  enableKeywordAnalysis?: boolean;
}

export async function analyzeContent(
  pageData: PageData,
  options: ContentEngineOptions = {}
): Promise<{
  score: number;
  findings: Finding[];
  analysis: ContentAnalysisResult;
}> {
  const text = extractMainContent(pageData.html);

  const quality = analyzeQuality(text, pageData);
  const readability = analyzeReadability(text);
  const structure = analyzeStructure(pageData.html);
  const engagement = analyzeEngagement(text);
  const keywords = options.targetKeyword
    ? analyzeKeywords(text, pageData, options.targetKeyword)
    : null;

  const score = calculateScore(quality, readability, structure, engagement, keywords);
  const findings = generateFindings(quality, readability, structure, engagement, keywords);

  return { score, findings, analysis: { /* ... */ } };
}
```

### Integration with Audit Pipeline

Update `audit-engines/index.ts`:

```typescript
import { analyzeContent } from './content.engine.js';

export async function runAllEngines(pageData: PageData, options: AuditOptions) {
  const results = await Promise.all([
    runSeoEngine(pageData),
    runAccessibilityEngine(pageData, options),
    runSecurityEngine(pageData),
    runPerformanceEngine(pageData),
    options.checkContent ? analyzeContent(pageData, {
      targetKeyword: options.targetKeyword,
    }) : null,
  ]);

  return {
    seo: results[0],
    accessibility: results[1],
    security: results[2],
    performance: results[3],
    content: results[4],
  };
}
```

---

## Database Changes

### Migration: Add Content Score to audit_jobs

```sql
-- 026_add_content_score.sql
ALTER TABLE audit_jobs
ADD COLUMN content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100);

-- Add content score to audit_pages
ALTER TABLE audit_pages
ADD COLUMN content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100);

-- Add content analysis metadata
ALTER TABLE audit_pages
ADD COLUMN content_metrics JSONB DEFAULT '{}';
```

### Migration: Update audit_findings categories

```sql
-- Update category constraint to include content categories
ALTER TABLE audit_findings
DROP CONSTRAINT IF EXISTS audit_findings_category_check;

ALTER TABLE audit_findings
ADD CONSTRAINT audit_findings_category_check
CHECK (category IN (
  'seo', 'accessibility', 'security', 'performance',
  'content-quality', 'content-readability', 'content-structure',
  'content-engagement', 'content-keywords'
));
```

---

## Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| Execution time | < 200ms | Per page, post-scrape |
| Memory usage | < 128MB | For 10,000 word documents |
| CPU usage | Single-threaded | No worker threads needed |

### Optimization Strategies

1. **Lazy calculation** - Only compute metrics needed for score
2. **Early exit** - Skip detailed analysis for very thin content
3. **Regex compilation** - Pre-compile all regex patterns
4. **Syllable caching** - Cache syllable counts for common words
5. **DOM reuse** - Parse HTML once, reuse for all checks

---

## Helper Libraries

### Recommended Dependencies

```json
{
  "syllable": "^2.0.0",        // Syllable counting
  "cheerio": "^1.0.0",         // HTML parsing (already used)
  "compromise": "^14.0.0"      // Optional: NLP for sentence detection
}
```

### Syllable Counting Implementation

```typescript
import syllable from 'syllable';

// Or custom implementation for speed:
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  // Count vowel groups
  const vowels = word.match(/[aeiouy]+/g);
  let count = vowels ? vowels.length : 1;

  // Adjust for silent e
  if (word.endsWith('e') && !word.endsWith('le')) count--;

  // Ensure at least 1 syllable
  return Math.max(1, count);
}
```

---

## Frontend Integration

### New UI Components Needed

1. **Content Score Card** - Display overall content score with subscores
2. **Readability Gauge** - Visual readability level indicator
3. **Content Metrics Panel** - Detailed metrics breakdown
4. **Keyword Analysis Section** - Keyword placement and density visualization
5. **Content Findings List** - Filtered view of content-specific findings

### API Response Extension

Extend existing audit response:

```typescript
interface AuditResponse {
  // ... existing fields
  contentScore: number | null;
  contentAnalysis: ContentAnalysisResult | null;
}
```

---

## Testing Plan

### Unit Tests

```typescript
describe('ContentEngine', () => {
  describe('Readability', () => {
    it('calculates Flesch-Kincaid grade correctly', () => {
      const text = 'The cat sat on the mat. It was a nice day.';
      expect(getFleschKincaidGrade(text)).toBeCloseTo(1.3, 1);
    });

    it('handles empty text gracefully', () => {
      expect(getFleschKincaidGrade('')).toBe(0);
    });
  });

  describe('Keywords', () => {
    it('calculates keyword density correctly', () => {
      const text = 'SEO tips for better SEO. More SEO advice here.';
      expect(getKeywordDensity(text, 'SEO')).toBeCloseTo(33.3, 1);
    });

    it('detects keyword stuffing', () => {
      const text = 'SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO tips';
      const result = analyzeKeywords(text, {}, 'SEO');
      expect(result.findings).toContainEqual(
        expect.objectContaining({ ruleId: 'keyword-stuffing' })
      );
    });
  });
});
```

### Integration Tests

```typescript
describe('Content Analysis Integration', () => {
  it('analyzes real webpage content', async () => {
    const pageData = await crawlPage('https://example.com/blog/post');
    const result = await analyzeContent(pageData);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.analysis.metrics.wordCount).toBeGreaterThan(0);
  });
});
```

---

## Implementation Order

1. **Core utilities** - Syllable counting, sentence detection, word counting
2. **Readability module** - All readability algorithms
3. **Structure module** - Heading and paragraph analysis
4. **Quality module** - Content depth and uniqueness
5. **Engagement module** - Hooks, CTAs, power words
6. **Keywords module** - Keyword analysis (optional)
7. **Main engine** - Score calculation and finding generation
8. **Database migration** - Add content score columns
9. **Pipeline integration** - Add to audit engine coordinator
10. **Frontend components** - Content score display
11. **API updates** - Include content analysis in responses

---

## Future Enhancements

### Phase 2 (Post-MVP)
- Competitor content comparison
- Content gap analysis
- Topic clustering
- Entity extraction
- Sentiment analysis (deterministic rules)

### Phase 3 (Advanced)
- Content templates/recommendations
- AI-assisted content suggestions (optional LLM integration)
- Content calendar integration
- Historical content tracking
