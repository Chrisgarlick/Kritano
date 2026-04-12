import type { SeoFinding } from '../../types/finding.types';
import type { CrawlResult } from '../../types/spider.types';
export declare class SeoEngine {
    private rules;
    /**
     * Analyze a page for SEO issues
     */
    analyze(crawlResult: CrawlResult, depth?: number): Promise<SeoFinding[]>;
    /**
     * Create a standardized finding
     */
    private createFinding;
}
/**
 * Create an SEO engine instance
 */
export declare function createSeoEngine(): SeoEngine;
//# sourceMappingURL=seo.engine.d.ts.map