/**
 * Keyword Analysis Module
 * Analyzes keyword density, placement, variations, and stuffing
 */
import type { KeywordAnalysis, KeywordMetrics } from '../../../types/content.types.js';
interface PageData {
    title: string | null;
    h1: string | null;
    metaDescription: string | null;
    url: string;
    html: string;
}
/**
 * Generate keyword variations (plurals, common forms)
 */
export declare function generateVariations(keyword: string): string[];
/**
 * Count keyword occurrences in text (case-insensitive)
 */
export declare function countKeywordOccurrences(text: string, keyword: string): number;
/**
 * Calculate keyword density
 */
export declare function calculateDensity(occurrences: number, wordCount: number): number;
/**
 * Check if keyword is in title
 */
export declare function isInTitle(title: string | null, keyword: string): boolean;
/**
 * Check if keyword is in H1
 */
export declare function isInH1(h1: string | null, keyword: string): boolean;
/**
 * Check if keyword is in first paragraph
 */
export declare function isInFirstParagraph(html: string, keyword: string): boolean;
/**
 * Check if keyword is in last paragraph
 */
export declare function isInLastParagraph(html: string, keyword: string): boolean;
/**
 * Check if keyword is in meta description
 */
export declare function isInMetaDescription(metaDescription: string | null, keyword: string): boolean;
/**
 * Check if keyword is in URL
 */
export declare function isInUrl(url: string, keyword: string): boolean;
/**
 * Check if keyword is in image alt text
 */
export declare function isInAltText(html: string, keyword: string): boolean;
/**
 * Find which variations are used in the text
 */
export declare function findUsedVariations(text: string, variations: string[]): string[];
/**
 * Detect keyword stuffing
 */
export declare function detectKeywordStuffing(density: number, occurrences: number, wordCount: number): boolean;
/**
 * Score keyword placement (where the keyword appears)
 */
export declare function scoreKeywordPlacement(metrics: KeywordMetrics): number;
/**
 * Score keyword density (optimal is 1-2%)
 */
export declare function scoreDensity(density: number): number;
/**
 * Main keyword analysis function
 */
export declare function analyzeKeywords(text: string, pageData: PageData, targetKeyword: string): KeywordAnalysis;
export {};
//# sourceMappingURL=keywords.d.ts.map