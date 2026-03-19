// Content Analysis Types for PagePulser

import type { Severity } from './finding.types.js';

// Content finding categories
export type ContentFindingCategory =
  | 'content-quality'
  | 'content-readability'
  | 'content-structure'
  | 'content-engagement'
  | 'content-keywords'
  | 'content-eeat'
  | 'content-aeo';

// Content finding interface
export interface ContentFinding {
  ruleId: string;
  ruleName: string;
  category: ContentFindingCategory;
  severity: Severity;
  message: string;
  description?: string;
  recommendation?: string;
  location?: {
    selector?: string;
    excerpt?: string;
    position?: number; // word position in content
  };
}

// Readability metrics from multiple algorithms
export interface ReadabilityMetrics {
  fleschKincaidGrade: number;
  fleschReadingEase: number;
  gunningFog: number;
  automatedReadabilityIndex: number;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  sentenceCount: number;
  sentenceVariety: number; // 0-1 coefficient of variation
}

// Structure metrics
export interface StructureMetrics {
  headingCount: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
  };
  headingHierarchyValid: boolean;
  avgParagraphLength: number;
  maxParagraphLength: number;
  paragraphCount: number;
  listCount: number;
  hasTableOfContents: boolean;
  wallsOfText: number; // sections > 500 words without heading
}

// Quality metrics
export interface QualityMetrics {
  wordCount: number;
  uniqueContentRatio: number; // 0-1
  boilerplateRatio: number; // 0-1
  multimediaCount: number;
  imageCount: number;
  videoCount: number;
  tableCount: number;
  codeBlockCount: number;
  freshnessScore: number; // 0-100
  hasPublishedDate: boolean;
  hasModifiedDate: boolean;
}

// Engagement metrics
export interface EngagementMetrics {
  hookStrength: number; // 0-100
  ctaCount: number;
  questionCount: number;
  powerWordCount: number;
  powerWordDensity: number; // percentage
  transitionWordCount: number;
  transitionWordRatio: number; // percentage of sentences
  hasGenericOpener: boolean;
}

// Keyword metrics (optional, when keyword provided)
export interface KeywordMetrics {
  keyword: string;
  density: number; // percentage
  occurrences: number;
  inTitle: boolean;
  inH1: boolean;
  inFirstParagraph: boolean;
  inMetaDescription: boolean;
  inUrl: boolean;
  inAltText: boolean;
  inLastParagraph: boolean;
  variationsUsed: string[];
  isStuffed: boolean;
}

// E-E-A-T evidence item
export interface EeatEvidence {
  pillar: 'experience' | 'expertise' | 'authority' | 'trust';
  type: string;     // e.g. 'experience-phrase', 'technical-term', 'author-bio', 'privacy-policy'
  label: string;    // human-readable label
  text?: string;    // actual extracted text from the page (if applicable)
}

// E-E-A-T metrics
export interface EeatMetrics {
  experienceScore: number;       // 0-100
  expertiseScore: number;        // 0-100
  authoritativenessScore: number; // 0-100
  trustworthinessScore: number;  // 0-100
  hasAuthorBio: boolean;
  hasAuthorCredentials: boolean;
  citationCount: number;
  hasContactInfo: boolean;
  hasPrivacyPolicy: boolean;
  hasTermsOfService: boolean;
  tier: 'ghost-content' | 'standard-web' | 'expert-verified';
  evidence: EeatEvidence[];
}

// E-E-A-T analysis result
export interface EeatAnalysis {
  score: number;
  metrics: EeatMetrics;
  findings: ContentFinding[];
}

// AEO nugget (extractable citation-ready snippet)
export interface AeoNugget {
  text: string;
  type: 'definition' | 'summary' | 'faq-answer' | 'data-table' | 'list' | 'concise-answer';
  wordCount: number;
}

// AEO metrics
export interface AeoMetrics {
  nuggetScore: number;           // 0-100
  factualDensityScore: number;   // 0-100
  sourceAuthorityScore: number;  // 0-100
  definitionBlockCount: number;
  summaryStatementCount: number;
  faqSectionCount: number;
  dataTableCount: number;
  extractableListCount: number;
  conciseAnswerCount: number;
  hardNumberCount: number;
  namedEntityCount: number;
  verifiableClaimCount: number;
  specificDateCount: number;
  hasAuthorSameAs: boolean;
  hasFaqSchema: boolean;
  hasHowToSchema: boolean;
  hasClaimReviewSchema: boolean;
  authoritativeLinkCount: number;
  semanticCitationCount: number;
  contentFrontloaded: boolean;
  contentFrontloadingRatio: number; // 0-1, proportion of words in first third of body
  tier: 'primary-source' | 'general-reference' | 'ignored';
  nuggets: AeoNugget[];
}

// AEO analysis result
export interface AeoAnalysis {
  score: number;
  metrics: AeoMetrics;
  findings: ContentFinding[];
}

// Sub-scores for each component
export interface ContentSubscores {
  quality: number;      // 0-100
  readability: number;  // 0-100
  structure: number;    // 0-100
  engagement: number;   // 0-100
  eeat: number | null;  // 0-100
  aeo: number | null;   // 0-100
  keywords: number | null; // 0-100 or null if no keyword
}

// Content type classification
export type ContentType = 'article' | 'product' | 'landing' | 'documentation' | 'blog' | 'other';

// Full content analysis result
export interface ContentAnalysisResult {
  score: number; // 0-100 overall content score

  subscores: ContentSubscores;

  metrics: {
    // Quality metrics
    wordCount: number;
    uniqueContentRatio: number;
    multimediaCount: number;
    freshnessScore: number;

    // Readability metrics
    fleschKincaidGrade: number;
    fleschReadingEase: number;
    gunningFog: number;
    automatedReadabilityIndex: number;
    avgWordsPerSentence: number;
    avgSyllablesPerWord: number;
    sentenceVariety: number;

    // Structure metrics
    headingCount: StructureMetrics['headingCount'];
    avgParagraphLength: number;
    listCount: number;
    hasTableOfContents: boolean;

    // Engagement metrics
    hookStrength: number;
    ctaCount: number;
    questionCount: number;
    powerWordDensity: number;
    transitionWordRatio: number;

    // E-E-A-T metrics
    eeatExperienceScore?: number;
    eeatExpertiseScore?: number;
    eeatAuthoritativenessScore?: number;
    eeatTrustworthinessScore?: number;
    hasAuthorBio?: boolean;
    hasAuthorCredentials?: boolean;
    citationCount?: number;
    hasContactInfo?: boolean;
    hasPrivacyPolicy?: boolean;
    hasTermsOfService?: boolean;
    eeatTier?: string;

    // AEO metrics (when available)
    aeoNuggetScore?: number;
    aeoFactualDensityScore?: number;
    aeoSourceAuthorityScore?: number;
    aeoTier?: string;
    aeoNuggets?: AeoNugget[];
    aeoContentFrontloaded?: boolean;
    aeoContentFrontloadingRatio?: number;

    // Keyword metrics (when applicable)
    keywordDensity?: number;
    keywordOccurrences?: number;
    keywordInTitle?: boolean;
    keywordInH1?: boolean;
    keywordInIntro?: boolean;
    keywordInMeta?: boolean;
  };

  findings: ContentFinding[];

  readingTimeMinutes: number;

  contentType: ContentType;

  keywordMetrics?: KeywordMetrics;
}

// Content engine options
export interface ContentEngineOptions {
  targetKeyword?: string;
  minWordCount?: number;        // Default: 300
  targetReadingLevel?: number;  // Default: 8 (grade level)
  enableKeywordAnalysis?: boolean;
  enableEeat?: boolean;         // Default: true (gated by tier)
  enableAeo?: boolean;          // Default: false (gated by tier)
}

// Analysis sub-results used internally
export interface QualityAnalysis {
  score: number;
  metrics: QualityMetrics;
  findings: ContentFinding[];
}

export interface ReadabilityAnalysis {
  score: number;
  metrics: ReadabilityMetrics;
  findings: ContentFinding[];
}

export interface StructureAnalysis {
  score: number;
  metrics: StructureMetrics;
  findings: ContentFinding[];
}

export interface EngagementAnalysis {
  score: number;
  metrics: EngagementMetrics;
  findings: ContentFinding[];
}

export interface KeywordAnalysis {
  score: number;
  metrics: KeywordMetrics;
  findings: ContentFinding[];
}

// Content extraction result
export interface ExtractedContent {
  text: string;           // Main content text (cleaned)
  html: string;           // Main content HTML
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  url: string;
  paragraphs: string[];   // Individual paragraphs
  headings: Array<{ level: number; text: string; position: number }>;
  sentences: string[];    // Individual sentences
  words: string[];        // Individual words
}
