"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleIndexExposureService = void 0;
exports.createGoogleIndexExposureService = createGoogleIndexExposureService;
const CATEGORY_LABELS = {
    'config-file': 'Configuration File',
    'env-file': 'Environment File',
    'database': 'Database Export',
    'git': 'Git Repository',
    'log-file': 'Log File',
    'admin-panel': 'Admin Panel',
    'login-page': 'Login Page',
    'phpinfo': 'PHP Info Page',
    'staging': 'Staging Environment',
    'dev-environment': 'Development Environment',
    'backup': 'Backup File',
    'debug': 'Debug Endpoint',
    'unknown': 'Sensitive URL',
};
class GoogleIndexExposureService {
    apiKey;
    cseId;
    constructor() {
        this.apiKey = process.env.GOOGLE_CSE_API_KEY || '';
        this.cseId = process.env.GOOGLE_CSE_ID || '';
    }
    /**
     * Check if the service is configured with valid API credentials
     */
    isConfigured() {
        return !!(this.apiKey && this.cseId);
    }
    /**
     * Scan a domain for indexed sensitive URLs via Google Custom Search API
     * Uses 2 queries to cover all dork categories
     */
    async scanDomain(domain) {
        if (!this.isConfigured())
            return [];
        const allItems = [];
        // Query 1: admin panels, config files, env/sql/log/git
        const q1 = 'intitle:"index of" OR filetype:env OR filetype:sql OR filetype:log OR ".git/config" OR inurl:admin OR inurl:phpinfo';
        // Query 2: staging/dev/backup/debug
        const q2 = 'inurl:staging OR inurl:dev OR inurl:backup OR inurl:debug OR intitle:"phpMyAdmin" OR filetype:bak';
        const [r1, r2] = await Promise.all([
            this.executeQuery(q1, domain),
            this.executeQuery(q2, domain),
        ]);
        if (r1?.items)
            allItems.push(...r1.items);
        if (r2?.items)
            allItems.push(...r2.items);
        // Deduplicate by URL
        const seen = new Set();
        return allItems.filter(item => {
            if (seen.has(item.link))
                return false;
            seen.add(item.link);
            return true;
        });
    }
    /**
     * Execute a single Google Custom Search query scoped to a domain
     */
    async executeQuery(query, domain) {
        try {
            const params = new URLSearchParams({
                key: this.apiKey,
                cx: this.cseId,
                q: query,
                siteSearch: domain,
                siteSearchFilter: 'i', // include only results from this site
                num: '10',
            });
            const url = `https://www.googleapis.com/customsearch/v1?${params.toString()}`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);
            const response = await fetch(url, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' },
            });
            clearTimeout(timeout);
            if (!response.ok) {
                const errorBody = await response.text().catch(() => '');
                console.warn(`Google CSE API error (${response.status}): ${errorBody.substring(0, 200)}`);
                return null;
            }
            return await response.json();
        }
        catch (error) {
            console.warn('Google CSE query failed:', error instanceof Error ? error.message : String(error));
            return null;
        }
    }
    /**
     * Classify a search result URL into a category and severity
     */
    classifyResult(url, title) {
        const lowerUrl = url.toLowerCase();
        const lowerTitle = title.toLowerCase();
        // Critical: direct exposure of secrets/data
        if (lowerUrl.includes('.env') || lowerUrl.includes('env.') || lowerTitle.includes('env')) {
            return { url, title, snippet: '', category: 'env-file', severity: 'critical' };
        }
        if (lowerUrl.includes('.sql') || lowerUrl.includes('/dump') || lowerTitle.includes('sql dump')) {
            return { url, title, snippet: '', category: 'database', severity: 'critical' };
        }
        if (lowerUrl.includes('.git') || lowerUrl.includes('git/config')) {
            return { url, title, snippet: '', category: 'git', severity: 'critical' };
        }
        // Serious: admin/login/phpinfo
        if (lowerUrl.includes('/admin') || lowerTitle.includes('admin panel') || lowerTitle.includes('dashboard')) {
            return { url, title, snippet: '', category: 'admin-panel', severity: 'serious' };
        }
        if (lowerUrl.includes('/login') || lowerUrl.includes('/signin') || lowerTitle.includes('login')) {
            return { url, title, snippet: '', category: 'login-page', severity: 'serious' };
        }
        if (lowerUrl.includes('phpinfo') || lowerTitle.includes('phpinfo')) {
            return { url, title, snippet: '', category: 'phpinfo', severity: 'serious' };
        }
        if (lowerUrl.includes('.log') || lowerTitle.includes('log file') || lowerTitle.includes('error log')) {
            return { url, title, snippet: '', category: 'log-file', severity: 'serious' };
        }
        // Serious: config files
        if (lowerUrl.includes('config') && (lowerUrl.includes('.json') || lowerUrl.includes('.yml') || lowerUrl.includes('.yaml') || lowerUrl.includes('.xml') || lowerUrl.includes('.ini'))) {
            return { url, title, snippet: '', category: 'config-file', severity: 'serious' };
        }
        // Moderate: staging/dev/backup/debug
        if (lowerUrl.includes('/staging') || lowerTitle.includes('staging')) {
            return { url, title, snippet: '', category: 'staging', severity: 'moderate' };
        }
        if (lowerUrl.includes('/dev') || lowerUrl.includes('/development') || lowerTitle.includes('development')) {
            return { url, title, snippet: '', category: 'dev-environment', severity: 'moderate' };
        }
        if (lowerUrl.includes('/backup') || lowerUrl.includes('.bak') || lowerTitle.includes('backup')) {
            return { url, title, snippet: '', category: 'backup', severity: 'moderate' };
        }
        if (lowerUrl.includes('/debug') || lowerTitle.includes('debug')) {
            return { url, title, snippet: '', category: 'debug', severity: 'moderate' };
        }
        if (lowerTitle.includes('phpmyadmin')) {
            return { url, title, snippet: '', category: 'admin-panel', severity: 'serious' };
        }
        // Index of (directory listing)
        if (lowerTitle.includes('index of')) {
            return { url, title, snippet: '', category: 'config-file', severity: 'serious' };
        }
        return { url, title, snippet: '', category: 'unknown', severity: 'moderate' };
    }
    /**
     * Explain why a URL may have been indexed, using robots.txt data
     */
    explainWithRobots(url, robotsParser) {
        if (!robotsParser) {
            return 'Unable to check robots.txt — ensure robots.txt is properly configured to block sensitive paths.';
        }
        const isAllowed = robotsParser.isAllowed(url);
        const rules = robotsParser.getRules();
        if (isAllowed) {
            // URL is allowed by robots.txt — that's why Google indexed it
            const path = new URL(url).pathname;
            return `This URL is NOT blocked by robots.txt, which allows Google to index it. Add "Disallow: ${path}" to robots.txt to prevent future indexing.`;
        }
        else {
            // URL is disallowed but still indexed — robots.txt doesn't remove existing results
            return 'This URL is blocked by robots.txt, but Google may have indexed it before the block was added. Use Google Search Console to request removal.';
        }
    }
    /**
     * Convert Google search results into SecurityFinding objects
     */
    convertToFindings(items, robotsParser) {
        return items.map(item => {
            const classified = this.classifyResult(item.link, item.title);
            const robotsExplanation = this.explainWithRobots(item.link, robotsParser);
            const categoryLabel = CATEGORY_LABELS[classified.category];
            return {
                ruleId: `google-indexed-${classified.category}`,
                ruleName: `Google-Indexed ${categoryLabel}`,
                category: 'security',
                severity: classified.severity,
                message: `Google has indexed a ${categoryLabel.toLowerCase()} at ${item.link}`,
                description: `This URL was found in Google's search index, meaning anyone can discover it via a simple search. ${item.snippet || ''}`.trim(),
                recommendation: robotsExplanation,
                selector: item.link,
                snippet: `robots.txt: ${robotsExplanation}`,
                helpUrl: 'https://developers.google.com/search/docs/crawling-indexing/remove-information',
            };
        });
    }
}
exports.GoogleIndexExposureService = GoogleIndexExposureService;
function createGoogleIndexExposureService() {
    return new GoogleIndexExposureService();
}
//# sourceMappingURL=google-index-exposure.service.js.map