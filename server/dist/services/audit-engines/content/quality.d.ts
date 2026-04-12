/**
 * Quality Analysis Module
 * Analyzes content depth, uniqueness, multimedia, and freshness
 */
import * as cheerio from 'cheerio';
import type { QualityAnalysis } from '../../../types/content.types.js';
/**
 * Score content depth based on word count
 */
export declare function scoreContentDepth(wordCount: number): number;
/**
 * Calculate unique content ratio (main content vs total HTML)
 */
export declare function calculateUniqueContentRatio(mainContentLength: number, totalHtmlLength: number): number;
/**
 * Detect boilerplate content and calculate ratio
 */
export declare function detectBoilerplate(text: string): {
    ratio: number;
    matches: string[];
};
/**
 * Count multimedia elements
 */
export declare function countMultimedia($: ReturnType<typeof cheerio.load>): {
    total: number;
    images: number;
    videos: number;
    tables: number;
    codeBlocks: number;
};
/**
 * Detect content freshness signals
 */
export declare function detectFreshness($: ReturnType<typeof cheerio.load>, text: string): {
    score: number;
    hasPublishedDate: boolean;
    hasModifiedDate: boolean;
    detectedYear: number | null;
};
/**
 * Main quality analysis function
 */
export declare function analyzeQuality(html: string, text: string, wordCount: number): QualityAnalysis;
//# sourceMappingURL=quality.d.ts.map