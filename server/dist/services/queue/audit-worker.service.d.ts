import { Pool } from 'pg';
import type { AuditJob } from '../../types/audit.types';
import type { SpiderEvent } from '../../types/spider.types';
export interface AuditWorkerConfig {
    pool: Pool;
    pollingIntervalMs?: number;
    /** Maximum number of jobs to process concurrently (default: 3) */
    maxConcurrentJobs?: number;
    onJobStart?: (job: AuditJob) => void | Promise<void>;
    onJobComplete?: (job: AuditJob) => void | Promise<void>;
    onJobFail?: (job: AuditJob, error: Error) => void | Promise<void>;
    onProgress?: (job: AuditJob, event: SpiderEvent) => void | Promise<void>;
}
/**
 * Audit worker that processes jobs from the queue
 */
export declare class AuditWorkerService {
    private pool;
    private queue;
    private auditCoordinator;
    private browser;
    private isRunning;
    private config;
    private maxConcurrentJobs;
    private effectiveConcurrency;
    private discoveredLinksPerJob;
    private activeJobs;
    private staleRecoveryInterval;
    constructor(config: AuditWorkerConfig);
    /**
     * Get the current effective concurrency (adjusted by memory pressure)
     */
    getEffectiveConcurrency(): number;
    /**
     * Get worker ID
     */
    getWorkerId(): string;
    /**
     * Check if currently processing any jobs
     */
    isProcessing(): boolean;
    /**
     * Start the worker
     */
    start(): Promise<void>;
    /**
     * Stop the worker gracefully
     */
    stop(): Promise<void>;
    /**
     * Initialize browser instance
     */
    private initializeBrowser;
    /**
     * Shutdown browser
     */
    private shutdownBrowser;
    /**
     * Main processing loop - supports concurrent job processing
     */
    private processLoop;
    /**
     * Process a single audit job
     */
    private processJob;
    /**
     * Run the actual audit
     */
    private runAudit;
    /**
     * Get next URL from queue
     */
    private getNextFromQueue;
    /**
     * Remove URL from queue
     */
    private removeFromQueue;
    /**
     * Create page record
     */
    private createPage;
    /**
     * Update page with crawl data
     */
    private updatePageData;
    /**
     * Queue discovered links
     */
    private queueDiscoveredLinks;
    /**
     * Mark page as crawled
     */
    private markPageCrawled;
    /**
     * Store discovered assets for a page (upsert + junction rows)
     */
    private storeAssets;
    /**
     * Mark page as failed with detailed error information
     */
    private markPageFailed;
    /**
     * Update retry count for a page
     */
    private updatePageRetryCount;
    /**
     * Mark page as skipped
     */
    private markPageSkipped;
    /**
     * Calculate final scores for the audit
     */
    private calculateFinalScores;
    /**
     * Calculate Content Quality Score (CQS) for each page and the overall audit.
     *
     * Per-page CQS = weighted average of 5 content sub-scores:
     *   quality 25%, eeat 25%, readability 20%, engagement 15%, structure 15%
     * If any sub-score is null its weight is redistributed proportionally.
     *
     * Audit-level CQS = depth-weighted average:
     *   homepage (depth 0) = 3x, depth 1 = 2x, others = 1x
     */
    private calculateCqsScores;
    /**
     * Calculate and store error summary for the audit
     */
    private calculateErrorSummary;
    /**
     * Sleep helper
     */
    private sleep;
    /**
     * Check if content type is HTML (should be audited)
     */
    private isHtmlContentType;
    /**
     * Check all discovered links for broken URLs (4xx/5xx)
     */
    private checkBrokenLinks;
    /**
     * Batch check URLs with HEAD requests (5 concurrent)
     */
    private batchCheckUrls;
    /**
     * Check a single URL status via HEAD request (fallback to GET)
     * Returns status code, or -1 for timeout/network errors
     */
    private checkUrlStatus;
    /**
     * Cross-page SEO checks: duplicate titles, duplicate meta descriptions, orphan pages
     */
    private crossPageSeoChecks;
    /**
     * Clean up remaining items from crawl queue after audit completes (#7)
     */
    private cleanupCrawlQueue;
}
/**
 * Create an audit worker
 */
export declare function createAuditWorker(config: AuditWorkerConfig): AuditWorkerService;
//# sourceMappingURL=audit-worker.service.d.ts.map