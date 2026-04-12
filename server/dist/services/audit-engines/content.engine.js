"use strict";
/**
 * Content Analysis Engine
 * Orchestrates all content analysis modules to produce comprehensive content quality scores.
 *
 * Scoring uses dynamic weight normalization: only active modules contribute,
 * and their base weights are normalized to sum to 1.0. This eliminates
 * branching for every combination of optional modules (eeat, aeo, keywords).
 *
 * Base weights:
 *   quality=0.30, readability=0.25, structure=0.20, engagement=0.15,
 *   eeat=0.18, aeo=0.15, keywords=0.10
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentEngine = void 0;
exports.createContentEngine = createContentEngine;
exports.calculateContentScore = calculateContentScore;
const cheerio = __importStar(require("cheerio"));
// Import analysis modules
const readability_js_1 = require("./content/readability.js");
const structure_js_1 = require("./content/structure.js");
const quality_js_1 = require("./content/quality.js");
const engagement_js_1 = require("./content/engagement.js");
const keywords_js_1 = require("./content/keywords.js");
const eeat_js_1 = require("./content/eeat.js");
const aeo_js_1 = require("./content/aeo.js");
// Average reading speed (words per minute)
const WORDS_PER_MINUTE = 200;
// Default options
const DEFAULT_OPTIONS = {
    targetKeyword: '',
    minWordCount: 300,
    targetReadingLevel: 8,
    enableKeywordAnalysis: false,
    enableEeat: true,
    enableAeo: false,
};
// Base weights for dynamic normalization
const BASE_WEIGHTS = {
    quality: 0.30,
    readability: 0.25,
    structure: 0.20,
    engagement: 0.15,
    eeat: 0.18,
    aeo: 0.15,
    keywords: 0.10,
};
class ContentEngine {
    options;
    constructor(options = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        // Enable keyword analysis if a keyword is provided
        if (this.options.targetKeyword && this.options.targetKeyword.trim()) {
            this.options.enableKeywordAnalysis = true;
        }
    }
    /**
     * Extract content from HTML for analysis
     */
    extractContent(html, url) {
        const $ = cheerio.load(html);
        // Get title
        const title = $('title').text().trim() || null;
        // Get meta description
        const metaDescription = $('meta[name="description"]').attr('content')?.trim() ||
            $('meta[property="og:description"]').attr('content')?.trim() ||
            null;
        // Get H1
        const h1 = $('h1').first().text().trim() || null;
        // Find main content area
        const mainContent = $('main, article, [role="main"], .content, .post-content, .entry-content, .article-body').first();
        const container = mainContent.length > 0 ? mainContent : $('body');
        // Remove non-content elements
        const contentClone = container.clone();
        contentClone.find('nav, header, footer, aside, .sidebar, .navigation, .menu, .ads, .ad, script, style, noscript').remove();
        // Extract text
        const text = contentClone
            .text()
            .replace(/\s+/g, ' ')
            .trim();
        // Extract HTML of main content
        const contentHtml = contentClone.html() || '';
        // Extract paragraphs
        const paragraphs = [];
        contentClone.find('p').each((_, el) => {
            const pText = $(el).text().trim();
            if (pText.length > 0) {
                paragraphs.push(pText);
            }
        });
        // Extract headings
        const headings = (0, structure_js_1.extractHeadings)(html);
        // Extract sentences and words
        const sentences = (0, readability_js_1.extractSentences)(text);
        const words = (0, readability_js_1.extractWords)(text);
        return {
            text,
            html: contentHtml,
            title,
            metaDescription,
            h1,
            url,
            paragraphs,
            headings,
            sentences,
            words,
        };
    }
    /**
     * Detect content type based on page signals
     */
    detectContentType($, url) {
        // Check for structured data type hints
        const jsonLd = $('script[type="application/ld+json"]').text();
        if (jsonLd) {
            try {
                const data = JSON.parse(jsonLd);
                const type = data['@type']?.toLowerCase() || '';
                if (type.includes('product'))
                    return 'product';
                if (type.includes('article') || type.includes('newsarticle') || type.includes('blogposting'))
                    return 'blog';
                if (type.includes('howto') || type.includes('technicalarticle'))
                    return 'documentation';
            }
            catch {
                // Ignore JSON parse errors
            }
        }
        // Check URL patterns
        const urlLower = url.toLowerCase();
        if (urlLower.includes('/blog/') || urlLower.includes('/news/') || urlLower.includes('/posts/')) {
            return 'blog';
        }
        if (urlLower.includes('/product') || urlLower.includes('/shop/') || urlLower.includes('/store/')) {
            return 'product';
        }
        if (urlLower.includes('/docs/') || urlLower.includes('/documentation/') || urlLower.includes('/api/')) {
            return 'documentation';
        }
        // Check for e-commerce indicators
        if ($('.add-to-cart, [data-add-to-cart], .buy-now, .price, .product-price').length > 0) {
            return 'product';
        }
        // Check for landing page indicators
        if ($('form').length > 0 && $('h1').length === 1 && $('.hero, .cta, [class*="hero"]').length > 0) {
            return 'landing';
        }
        // Check for article indicators
        if ($('article').length > 0 || $('[class*="article"]').length > 0) {
            return 'article';
        }
        return 'other';
    }
    /**
     * Calculate reading time in minutes
     */
    calculateReadingTime(wordCount) {
        return Math.ceil(wordCount / WORDS_PER_MINUTE);
    }
    /**
     * Main analysis function
     */
    async analyze(crawlResult) {
        const $ = cheerio.load(crawlResult.html);
        // Extract content
        const content = this.extractContent(crawlResult.html, crawlResult.url);
        // Run all analysis modules
        const qualityAnalysis = (0, quality_js_1.analyzeQuality)(crawlResult.html, content.text, content.words.length);
        const readabilityAnalysis = (0, readability_js_1.analyzeReadability)(content.text, content.sentences, content.words);
        const structureAnalysis = (0, structure_js_1.analyzeStructure)(crawlResult.html, content.text, content.words.length);
        const engagementAnalysis = (0, engagement_js_1.analyzeEngagement)(crawlResult.html, content.text, content.sentences, content.words);
        // E-E-A-T analysis (gated by tier)
        const eeatAnalysis = this.options.enableEeat
            ? (0, eeat_js_1.analyzeEeat)(crawlResult.html, content.text, content.sentences, content.words)
            : null;
        // AEO analysis (gated by tier)
        const aeoAnalysis = this.options.enableAeo
            ? (0, aeo_js_1.analyzeAeo)(crawlResult.html, content.text, content.sentences, content.words)
            : null;
        // Optional keyword analysis
        let keywordAnalysis = null;
        if (this.options.enableKeywordAnalysis && this.options.targetKeyword) {
            keywordAnalysis = (0, keywords_js_1.analyzeKeywords)(content.text, {
                title: content.title,
                h1: content.h1,
                metaDescription: content.metaDescription,
                url: crawlResult.url,
                html: crawlResult.html,
            }, this.options.targetKeyword);
        }
        // Calculate subscores
        const subscores = {
            quality: qualityAnalysis.score,
            readability: readabilityAnalysis.score,
            structure: structureAnalysis.score,
            engagement: engagementAnalysis.score,
            eeat: eeatAnalysis?.score ?? null,
            aeo: aeoAnalysis?.score ?? null,
            keywords: keywordAnalysis?.score ?? null,
        };
        // Dynamic weight normalization: include only active modules, normalize to sum 1.0
        const activeWeights = {
            quality: BASE_WEIGHTS.quality,
            readability: BASE_WEIGHTS.readability,
            structure: BASE_WEIGHTS.structure,
            engagement: BASE_WEIGHTS.engagement,
        };
        if (eeatAnalysis)
            activeWeights.eeat = BASE_WEIGHTS.eeat;
        if (aeoAnalysis)
            activeWeights.aeo = BASE_WEIGHTS.aeo;
        if (keywordAnalysis)
            activeWeights.keywords = BASE_WEIGHTS.keywords;
        const weightSum = Object.values(activeWeights).reduce((sum, w) => sum + w, 0);
        const scoreMap = {
            quality: qualityAnalysis.score,
            readability: readabilityAnalysis.score,
            structure: structureAnalysis.score,
            engagement: engagementAnalysis.score,
            eeat: eeatAnalysis?.score ?? 0,
            aeo: aeoAnalysis?.score ?? 0,
            keywords: keywordAnalysis?.score ?? 0,
        };
        let score = Math.round(Object.entries(activeWeights).reduce((total, [key, weight]) => total + scoreMap[key] * (weight / weightSum), 0));
        // Ensure score is within bounds
        score = Math.max(0, Math.min(100, score));
        // Combine all findings
        const findings = [
            ...qualityAnalysis.findings,
            ...readabilityAnalysis.findings,
            ...structureAnalysis.findings,
            ...engagementAnalysis.findings,
            ...(eeatAnalysis?.findings || []),
            ...(aeoAnalysis?.findings || []),
            ...(keywordAnalysis?.findings || []),
        ];
        // Sort findings by severity
        const severityOrder = {
            critical: 0,
            serious: 1,
            moderate: 2,
            minor: 3,
            info: 4,
        };
        findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
        // Detect content type
        const contentType = this.detectContentType($, crawlResult.url);
        // Calculate reading time
        const readingTimeMinutes = this.calculateReadingTime(content.words.length);
        // Build result
        const result = {
            score,
            subscores,
            ...(keywordAnalysis && { keywordMetrics: keywordAnalysis.metrics }),
            metrics: {
                // Quality metrics
                wordCount: content.words.length,
                uniqueContentRatio: qualityAnalysis.metrics.uniqueContentRatio,
                multimediaCount: qualityAnalysis.metrics.multimediaCount,
                freshnessScore: qualityAnalysis.metrics.freshnessScore,
                // Readability metrics
                fleschKincaidGrade: readabilityAnalysis.metrics.fleschKincaidGrade,
                fleschReadingEase: readabilityAnalysis.metrics.fleschReadingEase,
                gunningFog: readabilityAnalysis.metrics.gunningFog,
                automatedReadabilityIndex: readabilityAnalysis.metrics.automatedReadabilityIndex,
                avgWordsPerSentence: readabilityAnalysis.metrics.avgWordsPerSentence,
                avgSyllablesPerWord: readabilityAnalysis.metrics.avgSyllablesPerWord,
                sentenceVariety: readabilityAnalysis.metrics.sentenceVariety,
                // Structure metrics
                headingCount: structureAnalysis.metrics.headingCount,
                avgParagraphLength: structureAnalysis.metrics.avgParagraphLength,
                listCount: structureAnalysis.metrics.listCount,
                hasTableOfContents: structureAnalysis.metrics.hasTableOfContents,
                // Engagement metrics
                hookStrength: engagementAnalysis.metrics.hookStrength,
                ctaCount: engagementAnalysis.metrics.ctaCount,
                questionCount: engagementAnalysis.metrics.questionCount,
                powerWordDensity: engagementAnalysis.metrics.powerWordDensity,
                transitionWordRatio: engagementAnalysis.metrics.transitionWordRatio,
                // E-E-A-T metrics (when available)
                ...(eeatAnalysis && {
                    eeatExperienceScore: eeatAnalysis.metrics.experienceScore,
                    eeatExpertiseScore: eeatAnalysis.metrics.expertiseScore,
                    eeatAuthoritativenessScore: eeatAnalysis.metrics.authoritativenessScore,
                    eeatTrustworthinessScore: eeatAnalysis.metrics.trustworthinessScore,
                    hasAuthorBio: eeatAnalysis.metrics.hasAuthorBio,
                    hasAuthorCredentials: eeatAnalysis.metrics.hasAuthorCredentials,
                    citationCount: eeatAnalysis.metrics.citationCount,
                    hasContactInfo: eeatAnalysis.metrics.hasContactInfo,
                    hasPrivacyPolicy: eeatAnalysis.metrics.hasPrivacyPolicy,
                    hasTermsOfService: eeatAnalysis.metrics.hasTermsOfService,
                    eeatTier: eeatAnalysis.metrics.tier,
                    eeatEvidence: eeatAnalysis.metrics.evidence,
                }),
                // AEO metrics (when available)
                ...(aeoAnalysis && {
                    aeoNuggetScore: aeoAnalysis.metrics.nuggetScore,
                    aeoFactualDensityScore: aeoAnalysis.metrics.factualDensityScore,
                    aeoSourceAuthorityScore: aeoAnalysis.metrics.sourceAuthorityScore,
                    aeoTier: aeoAnalysis.metrics.tier,
                    aeoNuggets: aeoAnalysis.metrics.nuggets,
                    aeoContentFrontloaded: aeoAnalysis.metrics.contentFrontloaded,
                    aeoContentFrontloadingRatio: aeoAnalysis.metrics.contentFrontloadingRatio,
                }),
                // Keyword metrics (optional)
                ...(keywordAnalysis && {
                    keywordDensity: keywordAnalysis.metrics.density,
                    keywordOccurrences: keywordAnalysis.metrics.occurrences,
                    keywordInTitle: keywordAnalysis.metrics.inTitle,
                    keywordInH1: keywordAnalysis.metrics.inH1,
                    keywordInIntro: keywordAnalysis.metrics.inFirstParagraph,
                    keywordInMeta: keywordAnalysis.metrics.inMetaDescription,
                }),
            },
            findings,
            readingTimeMinutes,
            contentType,
        };
        return result;
    }
}
exports.ContentEngine = ContentEngine;
/**
 * Create a content engine instance
 */
function createContentEngine(options) {
    return new ContentEngine(options);
}
/**
 * Calculate content score from an existing analysis result
 * Uses dynamic weight normalization — only active modules contribute.
 */
function calculateContentScore(subscores, includeKeywords = false) {
    const activeWeights = {
        quality: BASE_WEIGHTS.quality,
        readability: BASE_WEIGHTS.readability,
        structure: BASE_WEIGHTS.structure,
        engagement: BASE_WEIGHTS.engagement,
    };
    const scoreMap = {
        quality: subscores.quality,
        readability: subscores.readability,
        structure: subscores.structure,
        engagement: subscores.engagement,
    };
    if (subscores.eeat != null) {
        activeWeights.eeat = BASE_WEIGHTS.eeat;
        scoreMap.eeat = subscores.eeat;
    }
    if (subscores.aeo != null) {
        activeWeights.aeo = BASE_WEIGHTS.aeo;
        scoreMap.aeo = subscores.aeo;
    }
    if (includeKeywords && subscores.keywords != null) {
        activeWeights.keywords = BASE_WEIGHTS.keywords;
        scoreMap.keywords = subscores.keywords;
    }
    const weightSum = Object.values(activeWeights).reduce((sum, w) => sum + w, 0);
    return Math.round(Object.entries(activeWeights).reduce((total, [key, weight]) => total + scoreMap[key] * (weight / weightSum), 0));
}
//# sourceMappingURL=content.engine.js.map