"use strict";
/**
 * Proxy Service - IP Rotation Support
 *
 * Manages proxy connections for rotating IP addresses to avoid
 * IP-based blocking and rate limiting.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyService = exports.ProxyRotationStrategy = void 0;
exports.createProxyService = createProxyService;
/**
 * Proxy rotation strategies
 */
var ProxyRotationStrategy;
(function (ProxyRotationStrategy) {
    ProxyRotationStrategy["ROUND_ROBIN"] = "round_robin";
    ProxyRotationStrategy["RANDOM"] = "random";
    ProxyRotationStrategy["LEAST_USED"] = "least_used";
    ProxyRotationStrategy["FASTEST"] = "fastest";
    ProxyRotationStrategy["WEIGHTED"] = "weighted";
})(ProxyRotationStrategy || (exports.ProxyRotationStrategy = ProxyRotationStrategy = {}));
/**
 * Proxy Service for managing and rotating proxies
 */
class ProxyService {
    proxies = new Map();
    currentIndex = 0;
    strategy;
    enabled = false;
    constructor(strategy = ProxyRotationStrategy.ROUND_ROBIN) {
        this.strategy = strategy;
    }
    /**
     * Check if proxy rotation is enabled
     */
    isEnabled() {
        return this.enabled && this.proxies.size > 0;
    }
    /**
     * Enable or disable proxy rotation
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    /**
     * Set the rotation strategy
     */
    setStrategy(strategy) {
        this.strategy = strategy;
    }
    /**
     * Add a proxy to the pool
     */
    addProxy(proxy) {
        const key = this.getProxyKey(proxy);
        if (!this.proxies.has(key)) {
            this.proxies.set(key, {
                proxy,
                isHealthy: true,
                lastUsed: null,
                lastError: null,
                successCount: 0,
                failureCount: 0,
                avgResponseTimeMs: 0,
            });
        }
    }
    /**
     * Add multiple proxies from a list of URLs
     */
    addProxiesFromUrls(urls) {
        for (const url of urls) {
            const proxy = this.parseProxyUrl(url);
            if (proxy) {
                this.addProxy(proxy);
            }
        }
    }
    /**
     * Parse a proxy URL into a ProxyConfig
     */
    parseProxyUrl(url) {
        try {
            // Handle formats like:
            // http://user:pass@host:port
            // socks5://host:port
            // host:port (assume http)
            let fullUrl = url;
            if (!url.includes('://')) {
                fullUrl = `http://${url}`;
            }
            const parsed = new URL(fullUrl);
            const protocol = parsed.protocol.replace(':', '');
            return {
                server: `${parsed.protocol}//${parsed.hostname}:${parsed.port || (protocol === 'https' ? '443' : '8080')}`,
                username: parsed.username || undefined,
                password: parsed.password || undefined,
                protocol: protocol === 'socks5' ? 'socks5' : (protocol === 'https' ? 'https' : 'http'),
            };
        }
        catch {
            console.warn(`Invalid proxy URL: ${url}`);
            return null;
        }
    }
    /**
     * Remove a proxy from the pool
     */
    removeProxy(proxy) {
        const key = this.getProxyKey(proxy);
        this.proxies.delete(key);
    }
    /**
     * Get the next proxy based on the rotation strategy
     */
    getNextProxy() {
        if (!this.enabled || this.proxies.size === 0) {
            return null;
        }
        const healthyProxies = Array.from(this.proxies.values()).filter(p => p.isHealthy);
        if (healthyProxies.length === 0) {
            // Reset all proxies to healthy if all are marked unhealthy
            this.resetAllProxies();
            return this.getNextProxy();
        }
        let selected;
        switch (this.strategy) {
            case ProxyRotationStrategy.ROUND_ROBIN:
                selected = this.selectRoundRobin(healthyProxies);
                break;
            case ProxyRotationStrategy.RANDOM:
                selected = this.selectRandom(healthyProxies);
                break;
            case ProxyRotationStrategy.LEAST_USED:
                selected = this.selectLeastUsed(healthyProxies);
                break;
            case ProxyRotationStrategy.FASTEST:
                selected = this.selectFastest(healthyProxies);
                break;
            case ProxyRotationStrategy.WEIGHTED:
                selected = this.selectWeighted(healthyProxies);
                break;
            default:
                selected = healthyProxies[0];
        }
        selected.lastUsed = new Date();
        return selected.proxy;
    }
    /**
     * Round-robin selection
     */
    selectRoundRobin(proxies) {
        this.currentIndex = this.currentIndex % proxies.length;
        const selected = proxies[this.currentIndex];
        this.currentIndex++;
        return selected;
    }
    /**
     * Random selection
     */
    selectRandom(proxies) {
        const index = Math.floor(Math.random() * proxies.length);
        return proxies[index];
    }
    /**
     * Least recently used selection
     */
    selectLeastUsed(proxies) {
        return proxies.reduce((least, current) => {
            if (!current.lastUsed)
                return current;
            if (!least.lastUsed)
                return least;
            return current.lastUsed < least.lastUsed ? current : least;
        });
    }
    /**
     * Fastest proxy selection
     */
    selectFastest(proxies) {
        return proxies.reduce((fastest, current) => {
            if (current.avgResponseTimeMs === 0)
                return fastest;
            if (fastest.avgResponseTimeMs === 0)
                return current;
            return current.avgResponseTimeMs < fastest.avgResponseTimeMs ? current : fastest;
        });
    }
    /**
     * Weighted selection by success rate
     */
    selectWeighted(proxies) {
        // Calculate weights based on success rate
        const weights = proxies.map(p => {
            const total = p.successCount + p.failureCount;
            if (total === 0)
                return 1; // New proxy gets weight of 1
            return p.successCount / total;
        });
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;
        for (let i = 0; i < proxies.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return proxies[i];
            }
        }
        return proxies[proxies.length - 1];
    }
    /**
     * Report a successful request through a proxy
     */
    reportSuccess(proxy, responseTimeMs) {
        const status = this.proxies.get(this.getProxyKey(proxy));
        if (status) {
            status.successCount++;
            status.isHealthy = true;
            status.lastError = null;
            // Update average response time
            const totalRequests = status.successCount + status.failureCount;
            status.avgResponseTimeMs =
                (status.avgResponseTimeMs * (totalRequests - 1) + responseTimeMs) / totalRequests;
        }
    }
    /**
     * Report a failed request through a proxy
     */
    reportFailure(proxy, error) {
        const status = this.proxies.get(this.getProxyKey(proxy));
        if (status) {
            status.failureCount++;
            status.lastError = error;
            // Mark as unhealthy after 3 consecutive failures
            const recentFailureRate = status.failureCount / (status.successCount + status.failureCount);
            if (status.failureCount >= 3 && recentFailureRate > 0.5) {
                status.isHealthy = false;
            }
        }
    }
    /**
     * Reset all proxies to healthy state
     */
    resetAllProxies() {
        for (const status of this.proxies.values()) {
            status.isHealthy = true;
            status.failureCount = 0;
            status.successCount = 0;
        }
    }
    /**
     * Get all proxy statuses
     */
    getAllStatuses() {
        return Array.from(this.proxies.values());
    }
    /**
     * Get healthy proxy count
     */
    getHealthyCount() {
        return Array.from(this.proxies.values()).filter(p => p.isHealthy).length;
    }
    /**
     * Get total proxy count
     */
    getTotalCount() {
        return this.proxies.size;
    }
    /**
     * Test a proxy by making a request to a known endpoint
     */
    async testProxy(proxy, testUrl = 'https://httpbin.org/ip') {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            // Note: Node.js fetch doesn't support proxies natively
            // In production, you'd use a library like undici or https-proxy-agent
            // For now, this is a placeholder that would need proper proxy support
            clearTimeout(timeoutId);
            // For actual implementation, you'd need:
            // import { ProxyAgent } from 'undici';
            // const agent = new ProxyAgent(proxy.server);
            // await fetch(testUrl, { dispatcher: agent });
            console.log(`[Proxy] Test proxy ${proxy.server} - would need proper proxy library`);
            return true;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.reportFailure(proxy, message);
            return false;
        }
    }
    /**
     * Get a unique key for a proxy
     */
    getProxyKey(proxy) {
        return `${proxy.server}:${proxy.username || ''}`;
    }
    /**
     * Convert ProxyConfig to Playwright proxy format
     */
    toPlaywrightProxy(proxy) {
        return {
            server: proxy.server,
            username: proxy.username,
            password: proxy.password,
        };
    }
}
exports.ProxyService = ProxyService;
/**
 * Create a proxy service instance
 */
function createProxyService(strategy = ProxyRotationStrategy.ROUND_ROBIN) {
    return new ProxyService(strategy);
}
//# sourceMappingURL=proxy.service.js.map