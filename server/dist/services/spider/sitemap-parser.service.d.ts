export interface SitemapUrl {
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: number;
}
export interface SitemapParseResult {
    urls: SitemapUrl[];
    sitemapUrls: string[];
    errors: string[];
}
/**
 * Sitemap parser service
 * Handles standard XML sitemaps, sitemap index files, and gzipped sitemaps
 */
export declare class SitemapParserService {
    private userAgent;
    private timeoutMs;
    private maxSitemaps;
    private maxUrlsPerSitemap;
    constructor(options?: {
        userAgent?: string;
        timeoutMs?: number;
        maxSitemaps?: number;
        maxUrlsPerSitemap?: number;
    });
    /**
     * Discover and parse all sitemaps for a domain
     * Checks robots.txt sitemaps and common locations
     */
    discoverAndParse(baseUrl: string, robotsSitemaps?: string[]): Promise<{
        urls: SitemapUrl[];
        errors: string[];
    }>;
    /**
     * Fetch and parse a single sitemap
     */
    fetchAndParse(sitemapUrl: string): Promise<SitemapParseResult>;
    /**
     * Parse sitemap XML content
     * Handles both regular sitemaps and sitemap index files
     */
    parseXml(content: string): SitemapParseResult;
    /**
     * Decode XML entities in URL strings
     */
    private decodeXmlEntities;
}
/**
 * Create a sitemap parser instance
 */
export declare function createSitemapParser(options?: {
    userAgent?: string;
    timeoutMs?: number;
    maxSitemaps?: number;
    maxUrlsPerSitemap?: number;
}): SitemapParserService;
//# sourceMappingURL=sitemap-parser.service.d.ts.map