import type { UrlValidation } from '../../types/spider.types';
export declare class UrlNormalizerService {
    private targetDomain;
    private includeSubdomains;
    constructor(targetDomain: string, includeSubdomains?: boolean);
    /**
     * Normalize a URL for consistent comparison and storage
     */
    normalize(urlString: string, baseUrl?: string): UrlValidation;
    /**
     * Check if a URL should be skipped (non-HTML resources)
     */
    shouldSkip(urlString: string): {
        skip: boolean;
        reason?: string;
    };
    /**
     * Generate a hash for URL deduplication
     */
    hashUrl(normalizedUrl: string): string;
    /**
     * Check if URL is within crawl scope
     */
    isInScope(url: URL | string): boolean;
    /**
     * Get the target domain
     */
    getTargetDomain(): string;
    /**
     * Resolve a relative URL against a base URL
     */
    resolveUrl(href: string, baseUrl: string): string | null;
    /**
     * Extract clean domain from hostname (removes www.)
     */
    private extractDomain;
    /**
     * Normalize URL for consistent comparison
     */
    private normalizeUrl;
    /**
     * Check if hostname is a private/local IP (SSRF protection)
     */
    private isPrivateIp;
}
/**
 * Create a URL normalizer for a specific target
 */
export declare function createUrlNormalizer(targetUrl: string, includeSubdomains?: boolean): UrlNormalizerService;
//# sourceMappingURL=url-normalizer.service.d.ts.map