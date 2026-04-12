import type { Page } from 'playwright';
import type { PerformanceFinding } from '../../types/finding.types';
import type { CrawlResult } from '../../types/spider.types';
export declare class PerformanceEngine {
    private rules;
    /**
     * Analyze a page for performance issues
     */
    analyze(crawlResult: CrawlResult, page?: Page | null): Promise<PerformanceFinding[]>;
    /**
     * Calculate total resource size
     */
    private calculateTotalSize;
    /**
     * Format bytes to human readable
     */
    private formatBytes;
    /**
     * Measure Core Web Vitals using Playwright CDP (#29)
     */
    private measureCoreWebVitals;
    /**
     * Create a standardized finding
     */
    private createFinding;
    private mobileRules;
    /**
     * Run mobile-specific performance rules only.
     * Called during the mobile audit pass.
     */
    analyzeMobile(crawlResult: CrawlResult, page?: Page | null): Promise<PerformanceFinding[]>;
}
/**
 * Create a performance engine instance
 */
export declare function createPerformanceEngine(): PerformanceEngine;
//# sourceMappingURL=performance.engine.d.ts.map