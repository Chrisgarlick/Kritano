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
import type { ContentAnalysisResult, ContentEngineOptions, ContentType, ExtractedContent, ContentSubscores } from '../../types/content.types.js';
import type { CrawlResult } from '../../types/spider.types.js';
export declare class ContentEngine {
    private options;
    constructor(options?: ContentEngineOptions);
    /**
     * Extract content from HTML for analysis
     */
    extractContent(html: string, url: string): ExtractedContent;
    /**
     * Detect content type based on page signals
     */
    detectContentType($: ReturnType<typeof cheerio.load>, url: string): ContentType;
    /**
     * Calculate reading time in minutes
     */
    calculateReadingTime(wordCount: number): number;
    /**
     * Main analysis function
     */
    analyze(crawlResult: CrawlResult): Promise<ContentAnalysisResult>;
}
/**
 * Create a content engine instance
 */
export declare function createContentEngine(options?: ContentEngineOptions): ContentEngine;
/**
 * Calculate content score from an existing analysis result
 * Uses dynamic weight normalization — only active modules contribute.
 */
export declare function calculateContentScore(subscores: ContentSubscores, includeKeywords?: boolean): number;
//# sourceMappingURL=content.engine.d.ts.map