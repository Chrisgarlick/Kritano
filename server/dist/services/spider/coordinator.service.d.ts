import { Pool } from 'pg';
import type { AuditJob } from '../../types/audit.types';
import type { ProgressCallback } from '../../types/spider.types';
export interface CoordinatorConfig {
    pool: Pool;
    onProgress?: ProgressCallback;
}
export declare class CrawlCoordinator {
    private pool;
    private spider;
    private urlNormalizer;
    private robotsParser;
    private rateLimiter;
    private job;
    private onProgress;
    private isRunning;
    private shouldStop;
    constructor(config: CoordinatorConfig);
    /**
     * Run a complete audit crawl
     */
    run(job: AuditJob): Promise<void>;
    /**
     * Stop the crawl gracefully
     */
    stop(): void;
    /**
     * Initialize all required services
     */
    private initializeServices;
    /**
     * Process the crawl queue
     */
    private processQueue;
    /**
     * Process a single URL
     */
    private processUrl;
    /**
     * Add URL to crawl queue
     */
    private addToQueue;
    /**
     * Get next URL from queue
     */
    private getNextFromQueue;
    /**
     * Remove URL from queue
     */
    private removeFromQueue;
    /**
     * Create or get existing page record
     */
    private createOrGetPage;
    /**
     * Store crawl result data in page record
     */
    private storePageData;
    /**
     * Queue discovered links for crawling
     */
    private queueDiscoveredLinks;
    /**
     * Update page status
     */
    private updatePageStatus;
    /**
     * Mark page as skipped
     */
    private markPageSkipped;
    /**
     * Update page error
     */
    private updatePageError;
    /**
     * Increment crawled count
     */
    private incrementCrawledCount;
    /**
     * Update current URL being processed
     */
    private updateCurrentUrl;
    /**
     * Update job status
     */
    private updateJobStatus;
    /**
     * Update job with error
     */
    private updateJobError;
    /**
     * Get crawl progress
     */
    private getProgress;
    /**
     * Check if there are pending pages
     */
    private hasPendingPages;
    /**
     * Get failed pages count
     */
    private getFailedPagesCount;
    /**
     * Calculate final scores for the audit
     */
    private calculateFinalScores;
    /**
     * Emit progress event
     */
    private emitProgress;
    /**
     * Shutdown services
     */
    private shutdown;
    /**
     * Sleep helper
     */
    private sleep;
}
/**
 * Create a crawl coordinator
 */
export declare function createCoordinator(config: CoordinatorConfig): CrawlCoordinator;
//# sourceMappingURL=coordinator.service.d.ts.map