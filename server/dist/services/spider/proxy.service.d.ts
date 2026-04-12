/**
 * Proxy Service - IP Rotation Support
 *
 * Manages proxy connections for rotating IP addresses to avoid
 * IP-based blocking and rate limiting.
 */
export interface ProxyConfig {
    server: string;
    username?: string;
    password?: string;
    protocol?: 'http' | 'https' | 'socks5';
}
export interface ProxyStatus {
    proxy: ProxyConfig;
    isHealthy: boolean;
    lastUsed: Date | null;
    lastError: string | null;
    successCount: number;
    failureCount: number;
    avgResponseTimeMs: number;
}
/**
 * Proxy rotation strategies
 */
export declare enum ProxyRotationStrategy {
    ROUND_ROBIN = "round_robin",// Cycle through proxies in order
    RANDOM = "random",// Random selection
    LEAST_USED = "least_used",// Use the least recently used
    FASTEST = "fastest",// Prefer proxies with lowest response time
    WEIGHTED = "weighted"
}
/**
 * Proxy Service for managing and rotating proxies
 */
export declare class ProxyService {
    private proxies;
    private currentIndex;
    private strategy;
    private enabled;
    constructor(strategy?: ProxyRotationStrategy);
    /**
     * Check if proxy rotation is enabled
     */
    isEnabled(): boolean;
    /**
     * Enable or disable proxy rotation
     */
    setEnabled(enabled: boolean): void;
    /**
     * Set the rotation strategy
     */
    setStrategy(strategy: ProxyRotationStrategy): void;
    /**
     * Add a proxy to the pool
     */
    addProxy(proxy: ProxyConfig): void;
    /**
     * Add multiple proxies from a list of URLs
     */
    addProxiesFromUrls(urls: string[]): void;
    /**
     * Parse a proxy URL into a ProxyConfig
     */
    private parseProxyUrl;
    /**
     * Remove a proxy from the pool
     */
    removeProxy(proxy: ProxyConfig): void;
    /**
     * Get the next proxy based on the rotation strategy
     */
    getNextProxy(): ProxyConfig | null;
    /**
     * Round-robin selection
     */
    private selectRoundRobin;
    /**
     * Random selection
     */
    private selectRandom;
    /**
     * Least recently used selection
     */
    private selectLeastUsed;
    /**
     * Fastest proxy selection
     */
    private selectFastest;
    /**
     * Weighted selection by success rate
     */
    private selectWeighted;
    /**
     * Report a successful request through a proxy
     */
    reportSuccess(proxy: ProxyConfig, responseTimeMs: number): void;
    /**
     * Report a failed request through a proxy
     */
    reportFailure(proxy: ProxyConfig, error: string): void;
    /**
     * Reset all proxies to healthy state
     */
    resetAllProxies(): void;
    /**
     * Get all proxy statuses
     */
    getAllStatuses(): ProxyStatus[];
    /**
     * Get healthy proxy count
     */
    getHealthyCount(): number;
    /**
     * Get total proxy count
     */
    getTotalCount(): number;
    /**
     * Test a proxy by making a request to a known endpoint
     */
    testProxy(proxy: ProxyConfig, testUrl?: string): Promise<boolean>;
    /**
     * Get a unique key for a proxy
     */
    private getProxyKey;
    /**
     * Convert ProxyConfig to Playwright proxy format
     */
    toPlaywrightProxy(proxy: ProxyConfig): {
        server: string;
        username?: string;
        password?: string;
    };
}
/**
 * Create a proxy service instance
 */
export declare function createProxyService(strategy?: ProxyRotationStrategy): ProxyService;
//# sourceMappingURL=proxy.service.d.ts.map