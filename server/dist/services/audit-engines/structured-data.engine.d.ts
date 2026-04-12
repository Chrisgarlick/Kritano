/**
 * Structured Data Engine
 *
 * Analyzes JSON-LD, Microdata, and Open Graph data on web pages.
 * Validates schema.org structured data for completeness and correctness.
 *
 * Scoring:
 * - Presence of structured data: 40 points
 * - Valid JSON-LD syntax: 20 points
 * - Contextual match (right schema for page type): 20 points
 * - Completeness (required/recommended fields): 20 points
 */
import type { StructuredDataFinding } from '../../types/finding.types.js';
import type { CrawlResult } from '../../types/spider.types.js';
import type { StructuredDataAnalysis } from '../../types/structured-data.types.js';
export declare class StructuredDataEngine {
    private rules;
    /**
     * Analyze a page for structured data
     * Returns both findings and the analysis result
     */
    analyze(crawlResult: CrawlResult): Promise<{
        findings: StructuredDataFinding[];
        analysis: StructuredDataAnalysis;
    }>;
    /**
     * Analyze structured data on the page
     */
    private analyzeStructuredData;
    /**
     * Extract JSON-LD scripts from the page
     */
    private extractJsonLd;
    /**
     * Extract types from parsed JSON-LD
     */
    private extractTypesFromJsonLd;
    /**
     * Extract Microdata from the page
     */
    private extractMicrodata;
    /**
     * Extract Open Graph data
     */
    private extractOpenGraph;
    /**
     * Extract Twitter Card data
     */
    private extractTwitterCard;
    /**
     * Get all detected schema types
     */
    private getDetectedTypes;
    /**
     * Detect page type and expected schemas
     */
    private detectPageTypeAndExpectations;
    /**
     * Calculate structured data score
     */
    private calculateScore;
    /**
     * Calculate Open Graph completeness
     */
    private calculateOpenGraphCompleteness;
    /**
     * Calculate Twitter Card completeness
     */
    private calculateTwitterCardCompleteness;
    /**
     * Get validation errors from JSON-LD
     */
    private getValidationErrors;
    /**
     * Create a structured data finding
     */
    private createFinding;
    /**
     * Get the full analysis (for detailed reporting)
     */
    getAnalysis(crawlResult: CrawlResult): StructuredDataAnalysis;
}
/**
 * Factory function to create the engine
 */
export declare function createStructuredDataEngine(): StructuredDataEngine;
//# sourceMappingURL=structured-data.engine.d.ts.map