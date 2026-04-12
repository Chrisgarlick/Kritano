"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RobotsParserService = void 0;
exports.createRobotsParser = createRobotsParser;
class RobotsParserService {
    rules = [];
    crawlDelay = null;
    sitemaps = [];
    userAgent;
    loaded = false;
    constructor(userAgent = 'KritanoBot') {
        // Extract just the bot name from user agent string
        this.userAgent = userAgent.split('/')[0].toLowerCase();
    }
    /**
     * Fetch and parse robots.txt from a URL
     */
    async loadFromUrl(baseUrl, timeoutMs = 10000) {
        try {
            const robotsUrl = new URL('/robots.txt', baseUrl).toString();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            const response = await fetch(robotsUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': this.userAgent,
                },
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                // No robots.txt or error - allow all
                this.loaded = true;
                return true;
            }
            const text = await response.text();
            this.parse(text);
            this.loaded = true;
            return true;
        }
        catch (error) {
            // Network error or timeout - be permissive
            console.warn('Failed to fetch robots.txt:', error);
            this.loaded = true;
            return false;
        }
    }
    /**
     * Parse robots.txt content
     */
    parse(content) {
        this.rules = [];
        this.sitemaps = [];
        this.crawlDelay = null;
        const lines = content.split('\n');
        let currentUserAgent = null;
        let isRelevantBlock = false;
        let hasMatchedSpecific = false;
        for (const rawLine of lines) {
            // Remove comments and trim
            const line = rawLine.split('#')[0].trim();
            if (!line)
                continue;
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1)
                continue;
            const directive = line.substring(0, colonIndex).toLowerCase().trim();
            const value = line.substring(colonIndex + 1).trim();
            if (directive === 'user-agent') {
                const ua = value.toLowerCase();
                currentUserAgent = ua;
                // Check if this block applies to us
                if (ua === '*') {
                    // Wildcard matches if we haven't matched a specific agent
                    isRelevantBlock = !hasMatchedSpecific;
                }
                else if (ua === this.userAgent || this.userAgent.includes(ua) || ua.includes(this.userAgent)) {
                    // Specific match - takes precedence
                    if (!hasMatchedSpecific) {
                        // Clear rules from wildcard block
                        this.rules = [];
                        this.crawlDelay = null;
                    }
                    isRelevantBlock = true;
                    hasMatchedSpecific = true;
                }
                else {
                    isRelevantBlock = false;
                }
            }
            else if (isRelevantBlock) {
                switch (directive) {
                    case 'disallow':
                        if (value) {
                            this.addRule(value, false);
                        }
                        break;
                    case 'allow':
                        if (value) {
                            this.addRule(value, true);
                        }
                        break;
                    case 'crawl-delay':
                        const delay = parseFloat(value);
                        if (!isNaN(delay) && delay >= 0) {
                            this.crawlDelay = delay * 1000; // Convert to milliseconds
                        }
                        break;
                }
            }
            // Sitemaps are global, not per user-agent
            if (directive === 'sitemap') {
                try {
                    new URL(value); // Validate URL
                    this.sitemaps.push(value);
                }
                catch {
                    // Invalid sitemap URL, skip
                }
            }
        }
        // Sort rules by specificity (more specific rules first)
        this.rules.sort((a, b) => b.specificity - a.specificity);
    }
    /**
     * Check if a path is allowed for crawling
     */
    isAllowed(url) {
        if (!this.loaded) {
            // If not loaded, allow by default
            return true;
        }
        if (this.rules.length === 0) {
            // No rules = allow all
            return true;
        }
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname + urlObj.search;
            // Find the most specific matching rule
            for (const rule of this.rules) {
                if (rule.regex.test(path)) {
                    return rule.allow;
                }
            }
            // No matching rule = allowed
            return true;
        }
        catch {
            // Invalid URL, allow to let other validation catch it
            return true;
        }
    }
    /**
     * Get the crawl delay in milliseconds
     */
    getCrawlDelay() {
        return this.crawlDelay;
    }
    /**
     * Get discovered sitemaps
     */
    getSitemaps() {
        return [...this.sitemaps];
    }
    /**
     * Get parsed rules for debugging/logging
     */
    getRules() {
        return {
            allowedPaths: this.rules.filter(r => r.allow).map(r => r.pattern),
            disallowedPaths: this.rules.filter(r => !r.allow).map(r => r.pattern),
            crawlDelay: this.crawlDelay,
            sitemaps: this.sitemaps,
        };
    }
    /**
     * Add a rule with proper regex conversion
     */
    addRule(pattern, allow) {
        const regex = this.patternToRegex(pattern);
        this.rules.push({
            pattern,
            regex,
            allow,
            specificity: this.calculateSpecificity(pattern),
        });
    }
    /**
     * Convert robots.txt pattern to regex
     * Supports * (wildcard) and $ (end anchor)
     */
    patternToRegex(pattern) {
        // Escape special regex characters except * and $
        let regexStr = pattern
            .replace(/[.+?^{}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*')
            .replace(/\$$/, '$');
        // If pattern doesn't end with $ or *, match as prefix
        if (!pattern.endsWith('$') && !pattern.endsWith('*')) {
            regexStr += '.*';
        }
        // Ensure pattern matches from start
        if (!regexStr.startsWith('.*')) {
            regexStr = '^' + regexStr;
        }
        return new RegExp(regexStr, 'i');
    }
    /**
     * Calculate rule specificity for ordering
     * More specific rules should match first
     */
    calculateSpecificity(pattern) {
        // Base specificity is pattern length (without wildcards)
        let specificity = pattern.replace(/\*/g, '').length;
        // End anchor increases specificity
        if (pattern.endsWith('$')) {
            specificity += 10;
        }
        // Wildcards decrease specificity
        specificity -= (pattern.match(/\*/g) || []).length;
        return specificity;
    }
}
exports.RobotsParserService = RobotsParserService;
/**
 * Create a robots.txt parser for Kritano
 */
function createRobotsParser(userAgent) {
    return new RobotsParserService(userAgent);
}
//# sourceMappingURL=robots-parser.service.js.map