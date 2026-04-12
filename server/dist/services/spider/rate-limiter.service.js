"use strict";
/**
 * Domain-based rate limiter for polite crawling
 * Ensures we don't overwhelm target servers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainRateLimiter = void 0;
exports.createRateLimiter = createRateLimiter;
const DEFAULT_CONFIG = {
    requestsPerSecond: 2,
    burstLimit: 5,
    minDelayMs: 500,
    maxDelayMs: 10000,
};
class DomainRateLimiter {
    config;
    domainStates = new Map();
    robotsCrawlDelays = new Map();
    pendingRequests = new Map();
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Set crawl delay from robots.txt for a domain
     */
    setCrawlDelay(domain, delayMs) {
        if (delayMs !== null && delayMs > 0) {
            // Respect robots.txt but cap at maxDelayMs for UX
            const cappedDelay = Math.min(delayMs, this.config.maxDelayMs);
            this.robotsCrawlDelays.set(domain, cappedDelay);
        }
    }
    /**
     * Wait for rate limit slot for a domain
     * Ensures polite crawling and sequential requests per domain
     */
    async waitForSlot(url) {
        const domain = this.extractDomain(url);
        // If there's a pending request for this domain, wait for it
        const pending = this.pendingRequests.get(domain);
        if (pending) {
            await pending;
        }
        // Create a new promise for this request
        const waitPromise = this.performWait(domain);
        this.pendingRequests.set(domain, waitPromise);
        try {
            await waitPromise;
        }
        finally {
            this.pendingRequests.delete(domain);
        }
    }
    /**
     * Calculate and perform the actual wait
     */
    async performWait(domain) {
        const now = Date.now();
        const state = this.domainStates.get(domain) || {
            lastRequestTime: 0,
            requestCount: 0,
            windowStart: now,
        };
        // Reset window if more than 1 second has passed
        if (now - state.windowStart >= 1000) {
            state.requestCount = 0;
            state.windowStart = now;
        }
        // Calculate required delay
        let requiredDelay = 0;
        // 1. Respect minimum delay
        const timeSinceLastRequest = now - state.lastRequestTime;
        if (timeSinceLastRequest < this.config.minDelayMs) {
            requiredDelay = this.config.minDelayMs - timeSinceLastRequest;
        }
        // 2. Respect robots.txt crawl-delay
        const crawlDelay = this.robotsCrawlDelays.get(domain);
        if (crawlDelay && timeSinceLastRequest < crawlDelay) {
            requiredDelay = Math.max(requiredDelay, crawlDelay - timeSinceLastRequest);
        }
        // 3. Check burst limit
        if (state.requestCount >= this.config.burstLimit) {
            const timeUntilWindowReset = 1000 - (now - state.windowStart);
            if (timeUntilWindowReset > 0) {
                requiredDelay = Math.max(requiredDelay, timeUntilWindowReset);
            }
        }
        // 4. Check requests per second
        if (state.requestCount >= this.config.requestsPerSecond) {
            const intervalMs = 1000 / this.config.requestsPerSecond;
            requiredDelay = Math.max(requiredDelay, intervalMs);
        }
        // Apply the delay
        if (requiredDelay > 0) {
            await this.sleep(requiredDelay);
        }
        // Update state
        const afterDelay = Date.now();
        state.lastRequestTime = afterDelay;
        state.requestCount++;
        // Reset window if needed
        if (afterDelay - state.windowStart >= 1000) {
            state.requestCount = 1;
            state.windowStart = afterDelay;
        }
        this.domainStates.set(domain, state);
    }
    /**
     * Report an error for adaptive rate limiting (#8)
     * Increases delay when errors occur, decreases on success
     */
    reportError(url) {
        const domain = this.extractDomain(url);
        const current = this.config.minDelayMs;
        // Double the delay on error, capped at maxDelayMs
        const newDelay = Math.min(current * 2, this.config.maxDelayMs);
        this.robotsCrawlDelays.set(domain, Math.max(this.robotsCrawlDelays.get(domain) || 0, newDelay));
    }
    /**
     * Report success for adaptive rate limiting
     */
    reportSuccess(url) {
        const domain = this.extractDomain(url);
        const currentDelay = this.robotsCrawlDelays.get(domain);
        if (currentDelay && currentDelay > this.config.minDelayMs) {
            // Gradually reduce back towards minDelay
            const newDelay = Math.max(this.config.minDelayMs, Math.floor(currentDelay * 0.8));
            this.robotsCrawlDelays.set(domain, newDelay);
        }
    }
    /**
     * Get estimated wait time for a domain (for progress estimation)
     */
    getEstimatedWaitMs(url) {
        const domain = this.extractDomain(url);
        const state = this.domainStates.get(domain);
        if (!state)
            return 0;
        const now = Date.now();
        const timeSinceLastRequest = now - state.lastRequestTime;
        // Check minimum delay
        let waitTime = Math.max(0, this.config.minDelayMs - timeSinceLastRequest);
        // Check crawl delay
        const crawlDelay = this.robotsCrawlDelays.get(domain);
        if (crawlDelay) {
            waitTime = Math.max(waitTime, crawlDelay - timeSinceLastRequest);
        }
        return Math.max(0, waitTime);
    }
    /**
     * Clear state for a domain (when audit completes)
     */
    clearDomain(domain) {
        this.domainStates.delete(domain);
        this.robotsCrawlDelays.delete(domain);
        this.pendingRequests.delete(domain);
    }
    /**
     * Get statistics for monitoring
     */
    getStats() {
        let totalRequests = 0;
        for (const state of this.domainStates.values()) {
            totalRequests += state.requestCount;
        }
        return {
            domains: this.domainStates.size,
            totalRequests,
        };
    }
    /**
     * Extract domain from URL
     */
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.toLowerCase();
        }
        catch {
            return url;
        }
    }
    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.DomainRateLimiter = DomainRateLimiter;
/**
 * Create a rate limiter with custom config
 */
function createRateLimiter(config) {
    return new DomainRateLimiter(config);
}
//# sourceMappingURL=rate-limiter.service.js.map