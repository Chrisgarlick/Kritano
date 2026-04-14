"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpiderService = void 0;
exports.createSpider = createSpider;
const playwright_1 = require("playwright");
const cheerio = __importStar(require("cheerio"));
const stealth_service_1 = require("./stealth.service");
const user_agents_service_1 = require("./user-agents.service");
const wait_strategies_service_1 = require("./wait-strategies.service");
const behavior_service_1 = require("./behavior.service");
const timing_service_1 = require("./timing.service");
// Content types that should be processed as HTML
const HTML_CONTENT_TYPES = ['text/html', 'application/xhtml+xml'];
// Maximum HTML size to process (5MB)
const MAX_HTML_SIZE = 5 * 1024 * 1024;
// Challenge/verification page detection patterns
const CHALLENGE_PAGE_PATTERNS = [
    /please wait while your request is being verified/i,
    /checking your browser/i,
    /just a moment/i,
    /verifying you are human/i,
    /please wait\.\.\./i,
    /ddos protection/i,
    /attention required/i,
    /one more step/i,
    /please complete the security check/i,
    /ray id/i, // Cloudflare specific
];
// Challenge page retry configuration
const CHALLENGE_RETRY_DELAY_MS = 5000; // 5 seconds between retries
const CHALLENGE_MAX_RETRIES = 3;
// Resource type mapping
const RESOURCE_TYPE_MAP = {
    script: 'script',
    stylesheet: 'stylesheet',
    image: 'image',
    font: 'font',
    media: 'media',
};
class SpiderService {
    config;
    browser = null;
    urlNormalizer;
    rateLimiter;
    options;
    timingController;
    proxyService = null;
    constructor(config, urlNormalizer, rateLimiter, options = {}) {
        this.config = config;
        this.urlNormalizer = urlNormalizer;
        this.rateLimiter = rateLimiter;
        this.options = {
            useSmartWait: true,
            behaviorIntensity: 'minimal',
            ...options,
        };
        this.timingController = (0, timing_service_1.createTimingController)(options.timingProfile || timing_service_1.NORMAL_TIMING);
        this.proxyService = options.proxyService || null;
    }
    /**
     * Initialize the browser instance
     */
    async initialize() {
        if (this.browser)
            return;
        this.browser = await playwright_1.chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-background-networking',
                '--disable-sync',
                '--disable-translate',
                '--metrics-recording-only',
                '--mute-audio',
                '--no-first-run',
                '--safebrowsing-disable-auto-update',
                ...stealth_service_1.STEALTH_BROWSER_ARGS,
            ],
        });
    }
    /**
     * Crawl a single page and extract information
     * @param deviceType - 'desktop' (default) or 'mobile' for mobile viewport crawl
     */
    async crawlPage(url, deviceType = 'desktop') {
        if (!this.browser) {
            throw new Error('Spider not initialized. Call initialize() first.');
        }
        // Wait for rate limit slot and timing delay
        await this.rateLimiter.waitForSlot(url);
        await this.timingController.waitBeforeRequest();
        // Generate a random browser fingerprint for this request
        const fingerprint = (0, user_agents_service_1.generateFingerprint)(deviceType);
        // Get proxy if available
        const proxy = this.proxyService?.getNextProxy();
        // Merge fingerprint headers with any custom headers from config
        const headers = {
            ...fingerprint.headers,
            ...(this.config.customHeaders || {}),
        };
        const contextOptions = {
            userAgent: fingerprint.userAgent.userAgent,
            viewport: fingerprint.viewport,
            ignoreHTTPSErrors: false,
            javaScriptEnabled: true,
            locale: fingerprint.locale,
            timezoneId: fingerprint.timezone,
            extraHTTPHeaders: headers,
        };
        // Add proxy if available
        if (proxy) {
            contextOptions.proxy = {
                server: proxy.server,
                username: proxy.username,
                password: proxy.password,
            };
        }
        const context = await this.browser.newContext(contextOptions);
        // Apply stealth evasion scripts to mask automation
        await (0, stealth_service_1.applyStealthToContext)(context);
        // Track resources
        const resources = [];
        // Listen for responses to track resources
        context.on('response', (response) => {
            this.trackResource(response, resources);
        });
        const page = await context.newPage();
        try {
            // Set timeouts
            page.setDefaultTimeout(this.config.timeoutMs);
            page.setDefaultNavigationTimeout(this.config.timeoutMs);
            // Navigate to page
            const startTime = Date.now();
            const response = await page.goto(url, {
                waitUntil: 'domcontentloaded', // Start with faster initial load
                timeout: this.config.timeoutMs,
            });
            if (!response) {
                throw new Error('No response received');
            }
            // Apply smart wait strategies for SPAs and dynamic content
            let spaInfo = { isSPA: false, framework: null };
            if (this.options.useSmartWait) {
                const waitResult = await (0, wait_strategies_service_1.smartWait)(page, {
                    waitForNetworkIdle: true,
                    waitForDOMStability: true,
                    waitForLoadingIndicators: true,
                    detectSPA: true,
                    maxWaitMs: Math.min(15000, this.config.timeoutMs - (Date.now() - startTime)),
                });
                spaInfo = { isSPA: waitResult.isSPA, framework: waitResult.framework };
            }
            else {
                // Fallback to simple networkidle wait
                try {
                    await page.waitForLoadState('networkidle', { timeout: 10000 });
                }
                catch {
                    // Timeout is okay
                }
            }
            // Simulate human behavior if enabled
            const behaviorSettings = (0, behavior_service_1.getBehaviorSettings)(this.options.behaviorIntensity || 'none');
            if (behaviorSettings.enabled) {
                await (0, behavior_service_1.simulateHumanBehavior)(page, {
                    moveCount: behaviorSettings.moveCount,
                    scrollCount: behaviorSettings.scrollCount,
                    pauseToRead: behaviorSettings.pauseToRead,
                });
            }
            const responseTimeMs = Date.now() - startTime;
            // Measure actual TTFB via Navigation Timing API (server response, not full page load)
            let ttfbMs = responseTimeMs; // fallback to full load time
            try {
                const timing = await page.evaluate(() => {
                    const nav = performance.getEntriesByType('navigation')[0];
                    if (nav) {
                        return { responseStart: nav.responseStart, requestStart: nav.requestStart, fetchStart: nav.fetchStart };
                    }
                    return null;
                });
                if (timing && timing.responseStart > 0) {
                    // TTFB = time from request start to first byte of response
                    const base = timing.requestStart > 0 ? timing.requestStart : timing.fetchStart;
                    ttfbMs = Math.round(timing.responseStart - base);
                }
            }
            catch {
                // Navigation timing not available - keep fallback
            }
            const statusCode = response.status();
            const headers = await response.allHeaders();
            const contentType = headers['content-type'] || '';
            // Capture redirect chain
            const redirectChain = [];
            const request = response.request();
            let redirected = request.redirectedFrom();
            while (redirected) {
                const redirectResponse = await redirected.response();
                redirectChain.unshift({
                    url: redirected.url(),
                    statusCode: redirectResponse?.status() || 0,
                });
                redirected = redirected.redirectedFrom();
            }
            // Check if it's HTML
            const isHtml = HTML_CONTENT_TYPES.some(type => contentType.toLowerCase().includes(type));
            if (!isHtml) {
                return this.createNonHtmlResult(url, statusCode, contentType, responseTimeMs, headers, deviceType);
            }
            // Get HTML content with challenge page detection and retry
            let html = await page.content();
            let pageSizeBytes = Buffer.byteLength(html, 'utf8');
            // Check size limit
            if (pageSizeBytes > MAX_HTML_SIZE) {
                throw new Error(`Page too large: ${pageSizeBytes} bytes`);
            }
            // Parse HTML with Cheerio for extraction
            let $ = cheerio.load(html);
            let bodyText = $('body').text();
            // Detect and handle challenge/verification pages (Cloudflare, etc.)
            let retryCount = 0;
            while (this.isChallengePage(html, bodyText) && retryCount < CHALLENGE_MAX_RETRIES) {
                retryCount++;
                // Wait for challenge to complete
                await new Promise(resolve => setTimeout(resolve, CHALLENGE_RETRY_DELAY_MS));
                // Get updated content
                html = await page.content();
                pageSizeBytes = Buffer.byteLength(html, 'utf8');
                $ = cheerio.load(html);
                bodyText = $('body').text();
            }
            // If still a challenge page after retries, throw descriptive error
            if (this.isChallengePage(html, bodyText)) {
                throw new Error('Page is protected by bot verification (Cloudflare or similar). ' +
                    'The crawler could not access the actual content after multiple attempts. ' +
                    'This may require manual verification or whitelisting the crawler.');
            }
            // Extract page metadata
            const title = $('title').first().text().trim() || null;
            const metaDescription = $('meta[name="description"]').attr('content')?.trim() || null;
            const metaKeywords = $('meta[name="keywords"]').attr('content')?.trim() || null;
            const canonicalUrl = $('link[rel="canonical"]').attr('href') || null;
            const h1Text = $('h1').first().text().trim() || null;
            // Count words (approximate)
            const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;
            // Extract links
            const links = await this.extractLinks($, url);
            // Get cookies
            const cookies = await this.extractCookies(context);
            // Normalize the URL
            const normalizedUrl = this.urlNormalizer.normalize(url).normalizedUrl || url;
            return {
                url,
                normalizedUrl,
                statusCode,
                contentType,
                responseTimeMs,
                ttfbMs,
                pageSizeBytes,
                html,
                title,
                metaDescription,
                metaKeywords,
                canonicalUrl,
                h1Text,
                wordCount,
                links,
                resources,
                headers,
                cookies,
                redirectChain,
                deviceType,
                viewport: fingerprint.viewport,
            };
        }
        finally {
            await context.close();
        }
    }
    /**
     * Extract links from HTML
     */
    extractLinks($, baseUrl) {
        const links = [];
        const seen = new Set();
        $('a[href]').each((_, element) => {
            const href = $(element).attr('href');
            if (!href)
                return;
            // Resolve relative URL
            const resolvedUrl = this.urlNormalizer.resolveUrl(href, baseUrl);
            if (!resolvedUrl)
                return;
            // Normalize URL
            const validation = this.urlNormalizer.normalize(resolvedUrl);
            if (!validation.isValid || !validation.normalizedUrl)
                return;
            // Skip duplicates
            if (seen.has(validation.normalizedUrl))
                return;
            seen.add(validation.normalizedUrl);
            // Check if should skip (binary files, etc.)
            const skip = this.urlNormalizer.shouldSkip(validation.normalizedUrl);
            if (skip.skip)
                return;
            // Get link attributes
            const rel = $(element).attr('rel') || null;
            const isNoFollow = rel?.includes('nofollow') || false;
            const isExternal = !validation.isInScope;
            const text = $(element).text().trim().substring(0, 200);
            links.push({
                href: validation.normalizedUrl,
                text,
                isExternal,
                isNoFollow,
                rel,
            });
        });
        return links;
    }
    /**
     * Extract cookies for security analysis
     */
    async extractCookies(context) {
        const cookies = await context.cookies();
        return cookies.map(cookie => ({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            sameSite: cookie.sameSite,
            expires: cookie.expires > 0 ? new Date(cookie.expires * 1000) : null,
        }));
    }
    /**
     * Detect if the page is a challenge/verification page (Cloudflare, etc.)
     */
    isChallengePage(html, bodyText) {
        // Check for challenge page patterns in HTML
        for (const pattern of CHALLENGE_PAGE_PATTERNS) {
            if (pattern.test(html) || pattern.test(bodyText)) {
                return true;
            }
        }
        // Check for Cloudflare-specific elements
        if (html.includes('cf-browser-verification') ||
            html.includes('cf-challenge-running') ||
            html.includes('cf_chl_opt') ||
            html.includes('challenge-platform')) {
            return true;
        }
        // Very short page with verification-like content is suspicious
        const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount < 50 && (bodyText.toLowerCase().includes('wait') ||
            bodyText.toLowerCase().includes('verif') ||
            bodyText.toLowerCase().includes('check'))) {
            return true;
        }
        return false;
    }
    /**
     * Track resource loading
     */
    trackResource(response, resources) {
        try {
            const request = response.request();
            const resourceType = request.resourceType();
            // Only track non-document resources
            if (resourceType === 'document')
                return;
            const type = RESOURCE_TYPE_MAP[resourceType] || 'other';
            const contentLength = parseInt(response.headers()['content-length'] || '0', 10);
            resources.push({
                url: request.url(),
                type,
                size: contentLength,
                loadTimeMs: response.request().timing().responseEnd,
                mimeType: response.headers()['content-type'] || '',
                status: response.status(),
            });
        }
        catch {
            // Ignore errors tracking resources
        }
    }
    /**
     * Create result for non-HTML content
     */
    createNonHtmlResult(url, statusCode, contentType, responseTimeMs, headers, deviceType = 'desktop') {
        return {
            url,
            normalizedUrl: this.urlNormalizer.normalize(url).normalizedUrl || url,
            statusCode,
            contentType,
            responseTimeMs,
            ttfbMs: responseTimeMs,
            pageSizeBytes: 0,
            html: '',
            title: null,
            metaDescription: null,
            metaKeywords: null,
            canonicalUrl: null,
            h1Text: null,
            wordCount: 0,
            links: [],
            resources: [],
            headers,
            cookies: [],
            redirectChain: [],
            deviceType,
            viewport: { width: deviceType === 'mobile' ? 390 : 1920, height: deviceType === 'mobile' ? 844 : 1080 },
        };
    }
    /**
     * Check if URL is in scope
     */
    isInScope(url) {
        return this.urlNormalizer.isInScope(url);
    }
    /**
     * Get URL hash for deduplication
     */
    getUrlHash(url) {
        const normalized = this.urlNormalizer.normalize(url).normalizedUrl || url;
        return this.urlNormalizer.hashUrl(normalized);
    }
    /**
     * Shutdown the browser
     */
    async shutdown() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
exports.SpiderService = SpiderService;
/**
 * Create a spider instance
 */
function createSpider(config, urlNormalizer, rateLimiter, options) {
    return new SpiderService(config, urlNormalizer, rateLimiter, options);
}
//# sourceMappingURL=spider.service.js.map