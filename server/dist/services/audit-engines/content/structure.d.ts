/**
 * Structure Analysis Module
 * Analyzes content organization, heading hierarchy, and paragraph structure
 */
import * as cheerio from 'cheerio';
import type { StructureAnalysis, StructureMetrics } from '../../../types/content.types.js';
interface HeadingInfo {
    level: number;
    text: string;
    position: number;
}
/**
 * Extract headings from HTML with their positions
 */
export declare function extractHeadings(html: string): HeadingInfo[];
/**
 * Count headings by level
 */
export declare function countHeadings($: ReturnType<typeof cheerio.load>): StructureMetrics['headingCount'];
/**
 * Check if heading hierarchy is valid (no skipped levels)
 */
export declare function validateHeadingHierarchy(headings: HeadingInfo[]): {
    valid: boolean;
    issues: string[];
};
/**
 * Extract paragraphs from HTML
 */
export declare function extractParagraphs(html: string): string[];
/**
 * Detect walls of text (long sections without headings)
 */
export declare function detectWallsOfText(text: string, headings: HeadingInfo[], wordCount: number): {
    count: number;
    positions: number[];
};
/**
 * Detect table of contents
 */
export declare function detectTableOfContents($: ReturnType<typeof cheerio.load>): boolean;
/**
 * Count lists in content
 */
export declare function countLists($: ReturnType<typeof cheerio.load>): number;
/**
 * Main structure analysis function
 */
export declare function analyzeStructure(html: string, text: string, wordCount: number): StructureAnalysis;
export {};
//# sourceMappingURL=structure.d.ts.map