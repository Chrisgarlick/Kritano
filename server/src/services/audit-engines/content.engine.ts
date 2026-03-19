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

import * as cheerio from 'cheerio';
import type {
  ContentAnalysisResult,
  ContentEngineOptions,
  ContentFinding,
  ContentType,
  ExtractedContent,
  ContentSubscores,
} from '../../types/content.types.js';
import type { CrawlResult } from '../../types/spider.types.js';

// Import analysis modules
import { extractWords, extractSentences, analyzeReadability } from './content/readability.js';
import { analyzeStructure, extractHeadings } from './content/structure.js';
import { analyzeQuality } from './content/quality.js';
import { analyzeEngagement } from './content/engagement.js';
import { analyzeKeywords } from './content/keywords.js';
import { analyzeEeat } from './content/eeat.js';
import { analyzeAeo } from './content/aeo.js';

// Average reading speed (words per minute)
const WORDS_PER_MINUTE = 200;

// Default options
const DEFAULT_OPTIONS: Required<ContentEngineOptions> = {
  targetKeyword: '',
  minWordCount: 300,
  targetReadingLevel: 8,
  enableKeywordAnalysis: false,
  enableEeat: true,
  enableAeo: false,
};

// Base weights for dynamic normalization
const BASE_WEIGHTS: Record<string, number> = {
  quality: 0.30,
  readability: 0.25,
  structure: 0.20,
  engagement: 0.15,
  eeat: 0.18,
  aeo: 0.15,
  keywords: 0.10,
};

export class ContentEngine {
  private options: Required<ContentEngineOptions>;

  constructor(options: ContentEngineOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Enable keyword analysis if a keyword is provided
    if (this.options.targetKeyword && this.options.targetKeyword.trim()) {
      this.options.enableKeywordAnalysis = true;
    }
  }

  /**
   * Extract content from HTML for analysis
   */
  extractContent(html: string, url: string): ExtractedContent {
    const $ = cheerio.load(html);

    // Get title
    const title = $('title').text().trim() || null;

    // Get meta description
    const metaDescription =
      $('meta[name="description"]').attr('content')?.trim() ||
      $('meta[property="og:description"]').attr('content')?.trim() ||
      null;

    // Get H1
    const h1 = $('h1').first().text().trim() || null;

    // Find main content area
    const mainContent = $(
      'main, article, [role="main"], .content, .post-content, .entry-content, .article-body'
    ).first();
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
    const paragraphs: string[] = [];
    contentClone.find('p').each((_, el) => {
      const pText = $(el).text().trim();
      if (pText.length > 0) {
        paragraphs.push(pText);
      }
    });

    // Extract headings
    const headings = extractHeadings(html);

    // Extract sentences and words
    const sentences = extractSentences(text);
    const words = extractWords(text);

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
  detectContentType($: ReturnType<typeof cheerio.load>, url: string): ContentType {
    // Check for structured data type hints
    const jsonLd = $('script[type="application/ld+json"]').text();
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd);
        const type = data['@type']?.toLowerCase() || '';
        if (type.includes('product')) return 'product';
        if (type.includes('article') || type.includes('newsarticle') || type.includes('blogposting')) return 'blog';
        if (type.includes('howto') || type.includes('technicalarticle')) return 'documentation';
      } catch {
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
  calculateReadingTime(wordCount: number): number {
    return Math.ceil(wordCount / WORDS_PER_MINUTE);
  }

  /**
   * Main analysis function
   */
  async analyze(crawlResult: CrawlResult): Promise<ContentAnalysisResult> {
    const $ = cheerio.load(crawlResult.html);

    // Extract content
    const content = this.extractContent(crawlResult.html, crawlResult.url);

    // Run all analysis modules
    const qualityAnalysis = analyzeQuality(crawlResult.html, content.text, content.words.length);
    const readabilityAnalysis = analyzeReadability(content.text, content.sentences, content.words);
    const structureAnalysis = analyzeStructure(crawlResult.html, content.text, content.words.length);
    const engagementAnalysis = analyzeEngagement(
      crawlResult.html,
      content.text,
      content.sentences,
      content.words
    );

    // E-E-A-T analysis (gated by tier)
    const eeatAnalysis = this.options.enableEeat
      ? analyzeEeat(
          crawlResult.html,
          content.text,
          content.sentences,
          content.words
        )
      : null;

    // AEO analysis (gated by tier)
    const aeoAnalysis = this.options.enableAeo
      ? analyzeAeo(
          crawlResult.html,
          content.text,
          content.sentences,
          content.words
        )
      : null;

    // Optional keyword analysis
    let keywordAnalysis = null;
    if (this.options.enableKeywordAnalysis && this.options.targetKeyword) {
      keywordAnalysis = analyzeKeywords(content.text, {
        title: content.title,
        h1: content.h1,
        metaDescription: content.metaDescription,
        url: crawlResult.url,
        html: crawlResult.html,
      }, this.options.targetKeyword);
    }

    // Calculate subscores
    const subscores: ContentSubscores = {
      quality: qualityAnalysis.score,
      readability: readabilityAnalysis.score,
      structure: structureAnalysis.score,
      engagement: engagementAnalysis.score,
      eeat: eeatAnalysis?.score ?? null,
      aeo: aeoAnalysis?.score ?? null,
      keywords: keywordAnalysis?.score ?? null,
    };

    // Dynamic weight normalization: include only active modules, normalize to sum 1.0
    const activeWeights: Record<string, number> = {
      quality: BASE_WEIGHTS.quality,
      readability: BASE_WEIGHTS.readability,
      structure: BASE_WEIGHTS.structure,
      engagement: BASE_WEIGHTS.engagement,
    };
    if (eeatAnalysis) activeWeights.eeat = BASE_WEIGHTS.eeat;
    if (aeoAnalysis) activeWeights.aeo = BASE_WEIGHTS.aeo;
    if (keywordAnalysis) activeWeights.keywords = BASE_WEIGHTS.keywords;

    const weightSum = Object.values(activeWeights).reduce((sum, w) => sum + w, 0);
    const scoreMap: Record<string, number> = {
      quality: qualityAnalysis.score,
      readability: readabilityAnalysis.score,
      structure: structureAnalysis.score,
      engagement: engagementAnalysis.score,
      eeat: eeatAnalysis?.score ?? 0,
      aeo: aeoAnalysis?.score ?? 0,
      keywords: keywordAnalysis?.score ?? 0,
    };

    let score = Math.round(
      Object.entries(activeWeights).reduce(
        (total, [key, weight]) => total + scoreMap[key] * (weight / weightSum),
        0
      )
    );

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Combine all findings
    const findings: ContentFinding[] = [
      ...qualityAnalysis.findings,
      ...readabilityAnalysis.findings,
      ...structureAnalysis.findings,
      ...engagementAnalysis.findings,
      ...(eeatAnalysis?.findings || []),
      ...(aeoAnalysis?.findings || []),
      ...(keywordAnalysis?.findings || []),
    ];

    // Sort findings by severity
    const severityOrder: Record<string, number> = {
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
    const result: ContentAnalysisResult = {
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

/**
 * Create a content engine instance
 */
export function createContentEngine(options?: ContentEngineOptions): ContentEngine {
  return new ContentEngine(options);
}

/**
 * Calculate content score from an existing analysis result
 * Uses dynamic weight normalization — only active modules contribute.
 */
export function calculateContentScore(
  subscores: ContentSubscores,
  includeKeywords: boolean = false
): number {
  const activeWeights: Record<string, number> = {
    quality: BASE_WEIGHTS.quality,
    readability: BASE_WEIGHTS.readability,
    structure: BASE_WEIGHTS.structure,
    engagement: BASE_WEIGHTS.engagement,
  };
  const scoreMap: Record<string, number> = {
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
  return Math.round(
    Object.entries(activeWeights).reduce(
      (total, [key, weight]) => total + scoreMap[key] * (weight / weightSum),
      0
    )
  );
}
