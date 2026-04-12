import type { Severity } from './finding.types.js';
export type ContentFindingCategory = 'content-quality' | 'content-readability' | 'content-structure' | 'content-engagement' | 'content-keywords' | 'content-eeat' | 'content-aeo';
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
        position?: number;
    };
}
export interface ReadabilityMetrics {
    fleschKincaidGrade: number;
    fleschReadingEase: number;
    gunningFog: number;
    automatedReadabilityIndex: number;
    avgWordsPerSentence: number;
    avgSyllablesPerWord: number;
    sentenceCount: number;
    sentenceVariety: number;
}
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
    wallsOfText: number;
}
export interface QualityMetrics {
    wordCount: number;
    uniqueContentRatio: number;
    boilerplateRatio: number;
    multimediaCount: number;
    imageCount: number;
    videoCount: number;
    tableCount: number;
    codeBlockCount: number;
    freshnessScore: number;
    hasPublishedDate: boolean;
    hasModifiedDate: boolean;
}
export interface EngagementMetrics {
    hookStrength: number;
    ctaCount: number;
    questionCount: number;
    powerWordCount: number;
    powerWordDensity: number;
    transitionWordCount: number;
    transitionWordRatio: number;
    hasGenericOpener: boolean;
}
export interface KeywordMetrics {
    keyword: string;
    density: number;
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
export interface EeatEvidence {
    pillar: 'experience' | 'expertise' | 'authority' | 'trust';
    type: string;
    label: string;
    text?: string;
}
export interface EeatMetrics {
    experienceScore: number;
    expertiseScore: number;
    authoritativenessScore: number;
    trustworthinessScore: number;
    hasAuthorBio: boolean;
    hasAuthorCredentials: boolean;
    citationCount: number;
    hasContactInfo: boolean;
    hasPrivacyPolicy: boolean;
    hasTermsOfService: boolean;
    tier: 'ghost-content' | 'standard-web' | 'expert-verified';
    evidence: EeatEvidence[];
}
export interface EeatAnalysis {
    score: number;
    metrics: EeatMetrics;
    findings: ContentFinding[];
}
export interface AeoNugget {
    text: string;
    type: 'definition' | 'summary' | 'faq-answer' | 'data-table' | 'list' | 'concise-answer';
    wordCount: number;
}
export interface AeoMetrics {
    nuggetScore: number;
    factualDensityScore: number;
    sourceAuthorityScore: number;
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
    contentFrontloadingRatio: number;
    tier: 'primary-source' | 'general-reference' | 'ignored';
    nuggets: AeoNugget[];
}
export interface AeoAnalysis {
    score: number;
    metrics: AeoMetrics;
    findings: ContentFinding[];
}
export interface ContentSubscores {
    quality: number;
    readability: number;
    structure: number;
    engagement: number;
    eeat: number | null;
    aeo: number | null;
    keywords: number | null;
}
export type ContentType = 'article' | 'product' | 'landing' | 'documentation' | 'blog' | 'other';
export interface ContentAnalysisResult {
    score: number;
    subscores: ContentSubscores;
    metrics: {
        wordCount: number;
        uniqueContentRatio: number;
        multimediaCount: number;
        freshnessScore: number;
        fleschKincaidGrade: number;
        fleschReadingEase: number;
        gunningFog: number;
        automatedReadabilityIndex: number;
        avgWordsPerSentence: number;
        avgSyllablesPerWord: number;
        sentenceVariety: number;
        headingCount: StructureMetrics['headingCount'];
        avgParagraphLength: number;
        listCount: number;
        hasTableOfContents: boolean;
        hookStrength: number;
        ctaCount: number;
        questionCount: number;
        powerWordDensity: number;
        transitionWordRatio: number;
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
        eeatEvidence?: any;
        aeoNuggetScore?: number;
        aeoFactualDensityScore?: number;
        aeoSourceAuthorityScore?: number;
        aeoTier?: string;
        aeoNuggets?: AeoNugget[];
        aeoContentFrontloaded?: boolean;
        aeoContentFrontloadingRatio?: number;
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
export interface ContentEngineOptions {
    targetKeyword?: string;
    minWordCount?: number;
    targetReadingLevel?: number;
    enableKeywordAnalysis?: boolean;
    enableEeat?: boolean;
    enableAeo?: boolean;
}
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
export interface ExtractedContent {
    text: string;
    html: string;
    title: string | null;
    metaDescription: string | null;
    h1: string | null;
    url: string;
    paragraphs: string[];
    headings: Array<{
        level: number;
        text: string;
        position: number;
    }>;
    sentences: string[];
    words: string[];
}
//# sourceMappingURL=content.types.d.ts.map