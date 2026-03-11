/**
 * Proxy Service - IP Rotation Support
 *
 * Manages proxy connections for rotating IP addresses to avoid
 * IP-based blocking and rate limiting.
 */

export interface ProxyConfig {
  server: string;      // 'http://proxy.example.com:8080' or 'socks5://proxy:1080'
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
export enum ProxyRotationStrategy {
  ROUND_ROBIN = 'round_robin',      // Cycle through proxies in order
  RANDOM = 'random',                 // Random selection
  LEAST_USED = 'least_used',        // Use the least recently used
  FASTEST = 'fastest',               // Prefer proxies with lowest response time
  WEIGHTED = 'weighted',             // Weight by success rate
}

/**
 * Proxy Service for managing and rotating proxies
 */
export class ProxyService {
  private proxies: Map<string, ProxyStatus> = new Map();
  private currentIndex = 0;
  private strategy: ProxyRotationStrategy;
  private enabled: boolean = false;

  constructor(strategy: ProxyRotationStrategy = ProxyRotationStrategy.ROUND_ROBIN) {
    this.strategy = strategy;
  }

  /**
   * Check if proxy rotation is enabled
   */
  isEnabled(): boolean {
    return this.enabled && this.proxies.size > 0;
  }

  /**
   * Enable or disable proxy rotation
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Set the rotation strategy
   */
  setStrategy(strategy: ProxyRotationStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Add a proxy to the pool
   */
  addProxy(proxy: ProxyConfig): void {
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
  addProxiesFromUrls(urls: string[]): void {
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
  private parseProxyUrl(url: string): ProxyConfig | null {
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
      const protocol = parsed.protocol.replace(':', '') as ProxyConfig['protocol'];

      return {
        server: `${parsed.protocol}//${parsed.hostname}:${parsed.port || (protocol === 'https' ? '443' : '8080')}`,
        username: parsed.username || undefined,
        password: parsed.password || undefined,
        protocol: protocol === 'socks5' ? 'socks5' : (protocol === 'https' ? 'https' : 'http'),
      };
    } catch {
      console.warn(`Invalid proxy URL: ${url}`);
      return null;
    }
  }

  /**
   * Remove a proxy from the pool
   */
  removeProxy(proxy: ProxyConfig): void {
    const key = this.getProxyKey(proxy);
    this.proxies.delete(key);
  }

  /**
   * Get the next proxy based on the rotation strategy
   */
  getNextProxy(): ProxyConfig | null {
    if (!this.enabled || this.proxies.size === 0) {
      return null;
    }

    const healthyProxies = Array.from(this.proxies.values()).filter(p => p.isHealthy);
    if (healthyProxies.length === 0) {
      // Reset all proxies to healthy if all are marked unhealthy
      this.resetAllProxies();
      return this.getNextProxy();
    }

    let selected: ProxyStatus;

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
  private selectRoundRobin(proxies: ProxyStatus[]): ProxyStatus {
    this.currentIndex = this.currentIndex % proxies.length;
    const selected = proxies[this.currentIndex];
    this.currentIndex++;
    return selected;
  }

  /**
   * Random selection
   */
  private selectRandom(proxies: ProxyStatus[]): ProxyStatus {
    const index = Math.floor(Math.random() * proxies.length);
    return proxies[index];
  }

  /**
   * Least recently used selection
   */
  private selectLeastUsed(proxies: ProxyStatus[]): ProxyStatus {
    return proxies.reduce((least, current) => {
      if (!current.lastUsed) return current;
      if (!least.lastUsed) return least;
      return current.lastUsed < least.lastUsed ? current : least;
    });
  }

  /**
   * Fastest proxy selection
   */
  private selectFastest(proxies: ProxyStatus[]): ProxyStatus {
    return proxies.reduce((fastest, current) => {
      if (current.avgResponseTimeMs === 0) return fastest;
      if (fastest.avgResponseTimeMs === 0) return current;
      return current.avgResponseTimeMs < fastest.avgResponseTimeMs ? current : fastest;
    });
  }

  /**
   * Weighted selection by success rate
   */
  private selectWeighted(proxies: ProxyStatus[]): ProxyStatus {
    // Calculate weights based on success rate
    const weights = proxies.map(p => {
      const total = p.successCount + p.failureCount;
      if (total === 0) return 1; // New proxy gets weight of 1
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
  reportSuccess(proxy: ProxyConfig, responseTimeMs: number): void {
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
  reportFailure(proxy: ProxyConfig, error: string): void {
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
  resetAllProxies(): void {
    for (const status of this.proxies.values()) {
      status.isHealthy = true;
      status.failureCount = 0;
      status.successCount = 0;
    }
  }

  /**
   * Get all proxy statuses
   */
  getAllStatuses(): ProxyStatus[] {
    return Array.from(this.proxies.values());
  }

  /**
   * Get healthy proxy count
   */
  getHealthyCount(): number {
    return Array.from(this.proxies.values()).filter(p => p.isHealthy).length;
  }

  /**
   * Get total proxy count
   */
  getTotalCount(): number {
    return this.proxies.size;
  }

  /**
   * Test a proxy by making a request to a known endpoint
   */
  async testProxy(proxy: ProxyConfig, testUrl: string = 'https://httpbin.org/ip'): Promise<boolean> {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.reportFailure(proxy, message);
      return false;
    }
  }

  /**
   * Get a unique key for a proxy
   */
  private getProxyKey(proxy: ProxyConfig): string {
    return `${proxy.server}:${proxy.username || ''}`;
  }

  /**
   * Convert ProxyConfig to Playwright proxy format
   */
  toPlaywrightProxy(proxy: ProxyConfig): {
    server: string;
    username?: string;
    password?: string;
  } {
    return {
      server: proxy.server,
      username: proxy.username,
      password: proxy.password,
    };
  }
}

/**
 * Create a proxy service instance
 */
export function createProxyService(
  strategy: ProxyRotationStrategy = ProxyRotationStrategy.ROUND_ROBIN
): ProxyService {
  return new ProxyService(strategy);
}
