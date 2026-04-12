"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SitemapParserService = void 0;
exports.createSitemapParser = createSitemapParser;
const zlib_1 = require("zlib");
/**
 * Sitemap parser service
 * Handles standard XML sitemaps, sitemap index files, and gzipped sitemaps
 */
class SitemapParserService {
    userAgent;
    timeoutMs;
    maxSitemaps;
    maxUrlsPerSitemap;
    constructor(options = {}) {
        this.userAgent = options.userAgent || 'KritanoBot/1.0';
        this.timeoutMs = options.timeoutMs || 30000;
        this.maxSitemaps = options.maxSitemaps || 10; // Limit nested sitemaps
        this.maxUrlsPerSitemap = options.maxUrlsPerSitemap || 50000; // Standard limit
    }
    /**
     * Discover and parse all sitemaps for a domain
     * Checks robots.txt sitemaps and common locations
     */
    async discoverAndParse(baseUrl, robotsSitemaps = []) {
        const allUrls = [];
        const errors = [];
        const processedSitemaps = new Set();
        // Collect sitemap URLs to check
        const sitemapsToCheck = [...robotsSitemaps];
        // Add common sitemap locations if not already in robots.txt
        const commonLocations = [
            '/sitemap.xml',
            '/sitemap_index.xml',
            '/sitemap-index.xml',
        ];
        for (const path of commonLocations) {
            try {
                const url = new URL(path, baseUrl).toString();
                if (!sitemapsToCheck.includes(url)) {
                    sitemapsToCheck.push(url);
                }
            }
            catch {
                // Invalid URL, skip
            }
        }
        // Process sitemaps (with limit to prevent infinite loops)
        const queue = [...sitemapsToCheck];
        let sitemapsProcessed = 0;
        while (queue.length > 0 && sitemapsProcessed < this.maxSitemaps) {
            const sitemapUrl = queue.shift();
            if (processedSitemaps.has(sitemapUrl)) {
                continue;
            }
            processedSitemaps.add(sitemapUrl);
            console.log(`📍 Fetching sitemap: ${sitemapUrl}`);
            const result = await this.fetchAndParse(sitemapUrl);
            sitemapsProcessed++;
            if (result.errors.length > 0) {
                errors.push(...result.errors.map(e => `${sitemapUrl}: ${e}`));
            }
            // Add discovered URLs
            for (const url of result.urls) {
                if (allUrls.length < this.maxUrlsPerSitemap) {
                    allUrls.push(url);
                }
            }
            // Queue nested sitemaps (from sitemap index)
            for (const nestedSitemap of result.sitemapUrls) {
                if (!processedSitemaps.has(nestedSitemap)) {
                    queue.push(nestedSitemap);
                }
            }
        }
        console.log(`📍 Sitemap discovery complete: ${allUrls.length} URLs from ${sitemapsProcessed} sitemap(s)`);
        return { urls: allUrls, errors };
    }
    /**
     * Fetch and parse a single sitemap
     */
    async fetchAndParse(sitemapUrl) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
            const response = await fetch(sitemapUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'application/xml, text/xml, */*',
                },
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                if (response.status === 404) {
                    // Sitemap not found is common, not an error
                    return { urls: [], sitemapUrls: [], errors: [] };
                }
                return {
                    urls: [],
                    sitemapUrls: [],
                    errors: [`HTTP ${response.status}`],
                };
            }
            let content;
            const contentType = response.headers.get('content-type') || '';
            const isGzipped = sitemapUrl.endsWith('.gz') || contentType.includes('gzip');
            if (isGzipped) {
                const buffer = Buffer.from(await response.arrayBuffer());
                content = (0, zlib_1.gunzipSync)(buffer).toString('utf-8');
            }
            else {
                content = await response.text();
            }
            return this.parseXml(content);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return {
                urls: [],
                sitemapUrls: [],
                errors: [message],
            };
        }
    }
    /**
     * Parse sitemap XML content
     * Handles both regular sitemaps and sitemap index files
     */
    parseXml(content) {
        const urls = [];
        const sitemapUrls = [];
        const errors = [];
        try {
            // Check if this is a sitemap index
            if (content.includes('<sitemapindex')) {
                // Parse sitemap index - extract nested sitemap URLs
                const sitemapMatches = content.matchAll(/<sitemap[^>]*>([\s\S]*?)<\/sitemap>/gi);
                for (const match of sitemapMatches) {
                    const sitemapBlock = match[1];
                    const locMatch = sitemapBlock.match(/<loc[^>]*>([^<]+)<\/loc>/i);
                    if (locMatch) {
                        const loc = this.decodeXmlEntities(locMatch[1].trim());
                        try {
                            new URL(loc); // Validate URL
                            sitemapUrls.push(loc);
                        }
                        catch {
                            errors.push(`Invalid sitemap URL: ${loc}`);
                        }
                    }
                }
            }
            else if (content.includes('<urlset')) {
                // Parse regular sitemap - extract page URLs
                const urlMatches = content.matchAll(/<url[^>]*>([\s\S]*?)<\/url>/gi);
                for (const match of urlMatches) {
                    const urlBlock = match[1];
                    const locMatch = urlBlock.match(/<loc[^>]*>([^<]+)<\/loc>/i);
                    if (locMatch) {
                        const loc = this.decodeXmlEntities(locMatch[1].trim());
                        try {
                            new URL(loc); // Validate URL
                            const sitemapUrl = { loc };
                            // Extract optional fields
                            const lastmodMatch = urlBlock.match(/<lastmod[^>]*>([^<]+)<\/lastmod>/i);
                            if (lastmodMatch) {
                                sitemapUrl.lastmod = lastmodMatch[1].trim();
                            }
                            const changefreqMatch = urlBlock.match(/<changefreq[^>]*>([^<]+)<\/changefreq>/i);
                            if (changefreqMatch) {
                                sitemapUrl.changefreq = changefreqMatch[1].trim();
                            }
                            const priorityMatch = urlBlock.match(/<priority[^>]*>([^<]+)<\/priority>/i);
                            if (priorityMatch) {
                                const priority = parseFloat(priorityMatch[1].trim());
                                if (!isNaN(priority) && priority >= 0 && priority <= 1) {
                                    sitemapUrl.priority = priority;
                                }
                            }
                            urls.push(sitemapUrl);
                        }
                        catch {
                            errors.push(`Invalid URL: ${loc}`);
                        }
                    }
                }
            }
            else {
                errors.push('Not a valid sitemap (missing urlset or sitemapindex)');
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Parse error';
            errors.push(message);
        }
        return { urls, sitemapUrls, errors };
    }
    /**
     * Decode XML entities in URL strings
     */
    decodeXmlEntities(str) {
        return str
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'");
    }
}
exports.SitemapParserService = SitemapParserService;
/**
 * Create a sitemap parser instance
 */
function createSitemapParser(options) {
    return new SitemapParserService(options);
}
//# sourceMappingURL=sitemap-parser.service.js.map