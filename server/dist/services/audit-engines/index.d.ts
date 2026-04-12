import { Pool } from 'pg';
import { Page } from 'playwright';
import type { CrawlResult } from '../../types/spider.types';
import type { Finding, FindingCategory } from '../../types/finding.types';
import type { WcagVersion, WcagLevel } from '../../types/audit.types';
import type { ContentAnalysisResult } from '../../types/content.types';
import type { StructuredDataAnalysis } from '../../types/structured-data.types';
export { SeoEngine, createSeoEngine } from './seo.engine';
export { AccessibilityEngine, createAccessibilityEngine } from './accessibility.engine';
export { SecurityEngine, createSecurityEngine } from './security.engine';
export { PerformanceEngine, createPerformanceEngine } from './performance.engine';
export { ContentEngine, createContentEngine } from './content.engine';
export { StructuredDataEngine, createStructuredDataEngine } from './structured-data.engine';
export interface AuditConfig {
    checkSeo: boolean;
    checkAccessibility: boolean;
    checkSecurity: boolean;
    checkPerformance: boolean;
    checkContent: boolean;
    checkStructuredData: boolean;
    checkEeat: boolean;
    checkAeo: boolean;
    wcagVersion?: WcagVersion;
    wcagLevel?: WcagLevel;
    targetKeyword?: string;
}
export interface PageAuditResult {
    pageId: string;
    url: string;
    findings: Finding[];
    scores: {
        seo: number | null;
        accessibility: number | null;
        security: number | null;
        performance: number | null;
        content: number | null;
        structuredData: number | null;
    };
    issueCounts: {
        seo: number;
        accessibility: number;
        security: number;
        performance: number;
        content: number;
        structuredData: number;
    };
    contentAnalysis?: ContentAnalysisResult;
    structuredDataAnalysis?: StructuredDataAnalysis;
}
/**
 * Coordinates all audit engines for analyzing pages
 */
export declare class AuditEngineCoordinator {
    private seoEngine;
    private securityEngine;
    private performanceEngine;
    private structuredDataEngine;
    private pool;
    constructor(pool: Pool);
    /**
     * Analyze content quality for a page
     */
    analyzeContent(crawlResult: CrawlResult, targetKeyword?: string, enableEeat?: boolean, enableAeo?: boolean, metaKeywords?: string | null): Promise<ContentAnalysisResult>;
    /**
     * Convert content findings to standard Finding format
     */
    private convertContentFindings;
    /**
     * Analyze a single page with all configured engines
     * Note: For accessibility, we need the Playwright Page object
     */
    analyzePage(crawlResult: CrawlResult, page: Page | null, config: AuditConfig, depth?: number): Promise<{
        findings: Finding[];
        contentAnalysis?: ContentAnalysisResult;
        structuredDataAnalysis?: StructuredDataAnalysis;
    }>;
    /**
     * Analyze a single page with mobile-only engines (accessibility + performance).
     * Called during the mobile audit pass — does not run SEO, security, content, or structured data.
     */
    analyzeMobilePage(crawlResult: CrawlResult, page: Page | null, config: AuditConfig): Promise<{
        findings: Finding[];
    }>;
    /**
     * Deduplicate findings that appear on both desktop and mobile passes.
     * Identical findings (same rule_id + page + selector) get merged to device_type='both',
     * and the mobile duplicate is removed.
     */
    deduplicateFindings(auditJobId: string): Promise<number>;
    /**
     * Probe for exposed sensitive files (run once per audit)
     */
    probeExposedFiles(baseUrl: string): Promise<Finding[]>;
    /**
     * Store findings in the database
     */
    storeFindings(auditJobId: string, pageId: string | null, findings: Finding[], deviceType?: 'desktop' | 'mobile'): Promise<void>;
    /**
     * Calculate score for a category based on findings
     */
    calculateScore(findings: Finding[], category: FindingCategory): number;
    /**
     * Count issues by category
     */
    countByCategory(findings: Finding[]): Record<FindingCategory, number>;
    /**
     * Update page record with audit results
     */
    updatePageAuditResults(pageId: string, findings: Finding[], config: AuditConfig, contentAnalysis?: ContentAnalysisResult, structuredDataAnalysis?: StructuredDataAnalysis): Promise<void>;
    /**
     * Get summary of findings for an audit job
     */
    getFindingsSummary(auditJobId: string): Promise<{
        total: number;
        bySeverity: Record<string, number>;
        byCategory: Record<string, number>;
    }>;
}
/**
 * Create an audit engine coordinator
 */
export declare function createAuditEngineCoordinator(pool: Pool): AuditEngineCoordinator;
//# sourceMappingURL=index.d.ts.map