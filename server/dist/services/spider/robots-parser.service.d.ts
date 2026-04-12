import type { RobotsTxtRules } from '../../types/spider.types';
export declare class RobotsParserService {
    private rules;
    private crawlDelay;
    private sitemaps;
    private userAgent;
    private loaded;
    constructor(userAgent?: string);
    /**
     * Fetch and parse robots.txt from a URL
     */
    loadFromUrl(baseUrl: string, timeoutMs?: number): Promise<boolean>;
    /**
     * Parse robots.txt content
     */
    parse(content: string): void;
    /**
     * Check if a path is allowed for crawling
     */
    isAllowed(url: string): boolean;
    /**
     * Get the crawl delay in milliseconds
     */
    getCrawlDelay(): number | null;
    /**
     * Get discovered sitemaps
     */
    getSitemaps(): string[];
    /**
     * Get parsed rules for debugging/logging
     */
    getRules(): RobotsTxtRules;
    /**
     * Add a rule with proper regex conversion
     */
    private addRule;
    /**
     * Convert robots.txt pattern to regex
     * Supports * (wildcard) and $ (end anchor)
     */
    private patternToRegex;
    /**
     * Calculate rule specificity for ordering
     * More specific rules should match first
     */
    private calculateSpecificity;
}
/**
 * Create a robots.txt parser for Kritano
 */
export declare function createRobotsParser(userAgent?: string): RobotsParserService;
//# sourceMappingURL=robots-parser.service.d.ts.map