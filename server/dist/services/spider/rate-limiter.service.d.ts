/**
 * Domain-based rate limiter for polite crawling
 * Ensures we don't overwhelm target servers
 */
export interface RateLimiterConfig {
    requestsPerSecond: number;
    burstLimit: number;
    minDelayMs: number;
    maxDelayMs: number;
}
export declare class DomainRateLimiter {
    private config;
    private domainStates;
    private robotsCrawlDelays;
    private pendingRequests;
    constructor(config?: Partial<RateLimiterConfig>);
    /**
     * Set crawl delay from robots.txt for a domain
     */
    setCrawlDelay(domain: string, delayMs: number | null): void;
    /**
     * Wait for rate limit slot for a domain
     * Ensures polite crawling and sequential requests per domain
     */
    waitForSlot(url: string): Promise<void>;
    /**
     * Calculate and perform the actual wait
     */
    private performWait;
    /**
     * Report an error for adaptive rate limiting (#8)
     * Increases delay when errors occur, decreases on success
     */
    reportError(url: string): void;
    /**
     * Report success for adaptive rate limiting
     */
    reportSuccess(url: string): void;
    /**
     * Get estimated wait time for a domain (for progress estimation)
     */
    getEstimatedWaitMs(url: string): number;
    /**
     * Clear state for a domain (when audit completes)
     */
    clearDomain(domain: string): void;
    /**
     * Get statistics for monitoring
     */
    getStats(): {
        domains: number;
        totalRequests: number;
    };
    /**
     * Extract domain from URL
     */
    private extractDomain;
    /**
     * Sleep helper
     */
    private sleep;
}
/**
 * Create a rate limiter with custom config
 */
export declare function createRateLimiter(config?: Partial<RateLimiterConfig>): DomainRateLimiter;
//# sourceMappingURL=rate-limiter.service.d.ts.map