import type { SpiderConfig, CrawlResult, DeviceType } from '../../types/spider.types';
import { UrlNormalizerService } from './url-normalizer.service';
import { DomainRateLimiter } from './rate-limiter.service';
import { type BehaviorIntensity } from './behavior.service';
import { type TimingProfile } from './timing.service';
import { ProxyService } from './proxy.service';
export interface SpiderOptions {
    /** Enable smart wait strategies for SPAs */
    useSmartWait?: boolean;
    /** Enable human-like behavior simulation */
    behaviorIntensity?: BehaviorIntensity;
    /** Timing profile for delays */
    timingProfile?: TimingProfile;
    /** Proxy service for IP rotation */
    proxyService?: ProxyService;
}
export declare class SpiderService {
    private config;
    private browser;
    private urlNormalizer;
    private rateLimiter;
    private options;
    private timingController;
    private proxyService;
    constructor(config: SpiderConfig, urlNormalizer: UrlNormalizerService, rateLimiter: DomainRateLimiter, options?: SpiderOptions);
    /**
     * Initialize the browser instance
     */
    initialize(): Promise<void>;
    /**
     * Crawl a single page and extract information
     * @param deviceType - 'desktop' (default) or 'mobile' for mobile viewport crawl
     */
    crawlPage(url: string, deviceType?: DeviceType): Promise<CrawlResult>;
    /**
     * Extract links from HTML
     */
    private extractLinks;
    /**
     * Extract cookies for security analysis
     */
    private extractCookies;
    /**
     * Detect if the page is a challenge/verification page (Cloudflare, etc.)
     */
    private isChallengePage;
    /**
     * Track resource loading
     */
    private trackResource;
    /**
     * Create result for non-HTML content
     */
    private createNonHtmlResult;
    /**
     * Check if URL is in scope
     */
    isInScope(url: string): boolean;
    /**
     * Get URL hash for deduplication
     */
    getUrlHash(url: string): string;
    /**
     * Shutdown the browser
     */
    shutdown(): Promise<void>;
}
/**
 * Create a spider instance
 */
export declare function createSpider(config: SpiderConfig, urlNormalizer: UrlNormalizerService, rateLimiter: DomainRateLimiter, options?: SpiderOptions): SpiderService;
//# sourceMappingURL=spider.service.d.ts.map