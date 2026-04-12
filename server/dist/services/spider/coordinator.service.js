"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlCoordinator = void 0;
exports.createCoordinator = createCoordinator;
const spider_service_1 = require("./spider.service");
const url_normalizer_service_1 = require("./url-normalizer.service");
const robots_parser_service_1 = require("./robots-parser.service");
const rate_limiter_service_1 = require("./rate-limiter.service");
const DEFAULT_SPIDER_CONFIG = {
    maxPages: 100,
    maxDepth: 5,
    maxConcurrentPages: 3,
    requestDelayMs: 500,
    timeoutMs: 30000,
    respectRobotsTxt: true,
    includeSubdomains: false,
    userAgent: 'KritanoBot/1.0 (+https://kritano.com/bot)',
};
class CrawlCoordinator {
    pool;
    spider = null;
    urlNormalizer = null;
    robotsParser = null;
    rateLimiter = null;
    job = null;
    onProgress = null;
    isRunning = false;
    shouldStop = false;
    constructor(config) {
        this.pool = config.pool;
        this.onProgress = config.onProgress || null;
    }
    /**
     * Run a complete audit crawl
     */
    async run(job) {
        this.job = job;
        this.isRunning = true;
        this.shouldStop = false;
        try {
            // 1. Initialize services
            await this.initializeServices();
            // 2. Load robots.txt if configured
            if (job.respect_robots_txt && this.robotsParser) {
                await this.robotsParser.loadFromUrl(job.target_url);
                const crawlDelay = this.robotsParser.getCrawlDelay();
                if (crawlDelay && this.rateLimiter) {
                    this.rateLimiter.setCrawlDelay(job.target_domain, crawlDelay);
                }
            }
            // 3. Add seed URL to queue
            await this.addToQueue(job.target_url, 0, null, 100); // Priority 100 for homepage
            // 4. Update job status to processing
            await this.updateJobStatus('processing');
            // 5. Process the crawl queue
            await this.processQueue();
            // 6. Calculate final scores
            await this.calculateFinalScores();
            // 7. Mark as completed
            await this.updateJobStatus('completed');
            this.emitProgress({
                type: 'spider_completed',
                pagesTotal: job.pages_crawled,
                pagesFailed: await this.getFailedPagesCount(),
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            await this.updateJobError(message);
            throw error;
        }
        finally {
            await this.shutdown();
            this.isRunning = false;
        }
    }
    /**
     * Stop the crawl gracefully
     */
    stop() {
        this.shouldStop = true;
    }
    /**
     * Initialize all required services
     */
    async initializeServices() {
        if (!this.job)
            throw new Error('No job configured');
        const config = {
            ...DEFAULT_SPIDER_CONFIG,
            maxPages: this.job.max_pages,
            maxDepth: this.job.max_depth,
            respectRobotsTxt: this.job.respect_robots_txt,
            includeSubdomains: this.job.include_subdomains,
        };
        this.urlNormalizer = (0, url_normalizer_service_1.createUrlNormalizer)(this.job.target_url, this.job.include_subdomains);
        this.rateLimiter = (0, rate_limiter_service_1.createRateLimiter)();
        this.robotsParser = (0, robots_parser_service_1.createRobotsParser)(config.userAgent);
        this.spider = (0, spider_service_1.createSpider)(config, this.urlNormalizer, this.rateLimiter);
        await this.spider.initialize();
    }
    /**
     * Process the crawl queue
     */
    async processQueue() {
        if (!this.job || !this.spider)
            return;
        while (!this.shouldStop) {
            // Check if we've hit the page limit
            const progress = await this.getProgress();
            if (progress.pagesCrawled >= this.job.max_pages) {
                break;
            }
            // Get next URL from queue
            const queueItem = await this.getNextFromQueue();
            if (!queueItem) {
                // Check if there are pending pages being crawled
                const hasPending = await this.hasPendingPages();
                if (!hasPending) {
                    break; // Queue is empty and nothing pending
                }
                // Wait a bit and try again
                await this.sleep(100);
                continue;
            }
            // Process the URL
            await this.processUrl(queueItem);
        }
    }
    /**
     * Process a single URL
     */
    async processUrl(queueItem) {
        if (!this.job || !this.spider || !this.urlNormalizer || !this.robotsParser)
            return;
        const { url, depth, discoveredFrom } = queueItem;
        // Check robots.txt
        if (this.job.respect_robots_txt && !this.robotsParser.isAllowed(url)) {
            await this.markPageSkipped(url, 'Blocked by robots.txt');
            this.emitProgress({ type: 'page_skipped', url, reason: 'robots.txt' });
            return;
        }
        // Create/get page record
        const pageId = await this.createOrGetPage(url, depth, discoveredFrom);
        try {
            // Update status
            await this.updatePageStatus(pageId, 'crawling');
            this.emitProgress({ type: 'page_started', url });
            // Update job's current URL
            await this.updateCurrentUrl(url);
            // Crawl the page
            const result = await this.spider.crawlPage(url);
            // Store page data
            await this.storePageData(pageId, result);
            // Add discovered links to queue
            await this.queueDiscoveredLinks(result, depth);
            // Update status
            await this.updatePageStatus(pageId, 'crawled');
            await this.incrementCrawledCount();
            this.emitProgress({
                type: 'page_completed',
                url,
                statusCode: result.statusCode,
                responseTimeMs: result.responseTimeMs,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            await this.updatePageError(pageId, message);
            this.emitProgress({ type: 'page_failed', url, error: message });
        }
        // Remove from queue
        await this.removeFromQueue(url);
    }
    /**
     * Add URL to crawl queue
     */
    async addToQueue(url, depth, discoveredFrom, priority = 0) {
        if (!this.job || !this.urlNormalizer)
            return false;
        const urlHash = this.urlNormalizer.hashUrl(url);
        try {
            const result = await this.pool.query(`
        INSERT INTO crawl_queue (audit_job_id, url, url_hash, depth, discovered_from, priority)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (audit_job_id, url_hash) DO NOTHING
      `, [this.job.id, url, urlHash, depth, discoveredFrom, priority]);
            // Only track in pages_found if a row was actually inserted (not a duplicate)
            if (result.rowCount && result.rowCount > 0) {
                await this.pool.query(`
          UPDATE audit_jobs SET pages_found = pages_found + 1 WHERE id = $1
        `, [this.job.id]);
                this.emitProgress({ type: 'page_discovered', url, depth });
            }
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get next URL from queue
     */
    async getNextFromQueue() {
        if (!this.job)
            return null;
        const result = await this.pool.query(`
      SELECT url, depth, discovered_from
      FROM crawl_queue
      WHERE audit_job_id = $1
      ORDER BY priority DESC, created_at ASC
      LIMIT 1
    `, [this.job.id]);
        if (result.rows.length === 0)
            return null;
        return {
            url: result.rows[0].url,
            depth: result.rows[0].depth,
            discoveredFrom: result.rows[0].discovered_from,
        };
    }
    /**
     * Remove URL from queue
     */
    async removeFromQueue(url) {
        if (!this.job || !this.urlNormalizer)
            return;
        const urlHash = this.urlNormalizer.hashUrl(url);
        await this.pool.query(`
      DELETE FROM crawl_queue WHERE audit_job_id = $1 AND url_hash = $2
    `, [this.job.id, urlHash]);
    }
    /**
     * Create or get existing page record
     */
    async createOrGetPage(url, depth, discoveredFrom) {
        if (!this.job || !this.urlNormalizer)
            throw new Error('Not initialized');
        const urlHash = this.urlNormalizer.hashUrl(url);
        const result = await this.pool.query(`
      INSERT INTO audit_pages (audit_job_id, url, url_hash, depth, discovered_from)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (audit_job_id, url_hash) DO UPDATE SET url = EXCLUDED.url
      RETURNING id
    `, [this.job.id, url, urlHash, depth, discoveredFrom]);
        return result.rows[0].id;
    }
    /**
     * Store crawl result data in page record
     */
    async storePageData(pageId, result) {
        await this.pool.query(`
      UPDATE audit_pages SET
        status_code = $2,
        content_type = $3,
        response_time_ms = $4,
        page_size_bytes = $5,
        title = $6,
        meta_description = $7,
        canonical_url = $8,
        h1_text = $9,
        word_count = $10,
        crawled_at = NOW()
      WHERE id = $1
    `, [
            pageId,
            result.statusCode,
            result.contentType,
            result.responseTimeMs,
            result.pageSizeBytes,
            result.title,
            result.metaDescription,
            result.canonicalUrl,
            result.h1Text,
            result.wordCount,
        ]);
    }
    /**
     * Queue discovered links for crawling
     */
    async queueDiscoveredLinks(result, currentDepth) {
        if (!this.job)
            return;
        const nextDepth = currentDepth + 1;
        if (nextDepth > this.job.max_depth)
            return;
        // Calculate priority based on depth
        const priority = Math.max(0, 100 - (nextDepth * 10));
        for (const link of result.links) {
            // Only queue internal links
            if (!link.isExternal && !link.isNoFollow) {
                await this.addToQueue(link.href, nextDepth, result.url, priority);
            }
        }
    }
    /**
     * Update page status
     */
    async updatePageStatus(pageId, status) {
        await this.pool.query(`
      UPDATE audit_pages SET crawl_status = $2 WHERE id = $1
    `, [pageId, status]);
    }
    /**
     * Mark page as skipped
     */
    async markPageSkipped(url, reason) {
        if (!this.job || !this.urlNormalizer)
            return;
        const urlHash = this.urlNormalizer.hashUrl(url);
        await this.pool.query(`
      INSERT INTO audit_pages (audit_job_id, url, url_hash, depth, crawl_status, error_message)
      VALUES ($1, $2, $3, 0, 'skipped', $4)
      ON CONFLICT (audit_job_id, url_hash) DO UPDATE SET
        crawl_status = 'skipped',
        error_message = $4
    `, [this.job.id, url, urlHash, reason]);
    }
    /**
     * Update page error
     */
    async updatePageError(pageId, error) {
        await this.pool.query(`
      UPDATE audit_pages SET crawl_status = 'failed', error_message = $2 WHERE id = $1
    `, [pageId, error]);
    }
    /**
     * Increment crawled count
     */
    async incrementCrawledCount() {
        if (!this.job)
            return;
        await this.pool.query(`
      UPDATE audit_jobs SET pages_crawled = pages_crawled + 1 WHERE id = $1
    `, [this.job.id]);
    }
    /**
     * Update current URL being processed
     */
    async updateCurrentUrl(url) {
        if (!this.job)
            return;
        await this.pool.query(`
      UPDATE audit_jobs SET current_url = $2 WHERE id = $1
    `, [this.job.id, url]);
    }
    /**
     * Update job status
     */
    async updateJobStatus(status) {
        if (!this.job)
            return;
        const updates = ['status = $2'];
        const values = [this.job.id, status];
        if (status === 'processing') {
            updates.push('started_at = NOW()');
        }
        else if (status === 'completed' || status === 'failed') {
            updates.push('completed_at = NOW()');
            updates.push('current_url = NULL');
        }
        await this.pool.query(`
      UPDATE audit_jobs SET ${updates.join(', ')} WHERE id = $1
    `, values);
    }
    /**
     * Update job with error
     */
    async updateJobError(errorMessage) {
        if (!this.job)
            return;
        await this.pool.query(`
      UPDATE audit_jobs SET
        status = 'failed',
        error_message = $2,
        completed_at = NOW(),
        current_url = NULL
      WHERE id = $1
    `, [this.job.id, errorMessage]);
    }
    /**
     * Get crawl progress
     */
    async getProgress() {
        if (!this.job)
            return { pagesFound: 0, pagesCrawled: 0 };
        const result = await this.pool.query(`
      SELECT pages_found, pages_crawled FROM audit_jobs WHERE id = $1
    `, [this.job.id]);
        return {
            pagesFound: result.rows[0]?.pages_found || 0,
            pagesCrawled: result.rows[0]?.pages_crawled || 0,
        };
    }
    /**
     * Check if there are pending pages
     */
    async hasPendingPages() {
        if (!this.job)
            return false;
        const result = await this.pool.query(`
      SELECT COUNT(*) as count FROM audit_pages
      WHERE audit_job_id = $1 AND crawl_status = 'crawling'
    `, [this.job.id]);
        return parseInt(result.rows[0].count, 10) > 0;
    }
    /**
     * Get failed pages count
     */
    async getFailedPagesCount() {
        if (!this.job)
            return 0;
        const result = await this.pool.query(`
      SELECT COUNT(*) as count FROM audit_pages
      WHERE audit_job_id = $1 AND crawl_status = 'failed'
    `, [this.job.id]);
        return parseInt(result.rows[0].count, 10);
    }
    /**
     * Calculate final scores for the audit
     */
    async calculateFinalScores() {
        if (!this.job)
            return;
        // Get findings summary
        const findingsResult = await this.pool.query(`
      SELECT category, severity, COUNT(*) as count
      FROM audit_findings
      WHERE audit_job_id = $1
      GROUP BY category, severity
    `, [this.job.id]);
        // Calculate scores per category
        const categoryScores = {
            seo: { total: 100, deductions: 0 },
            accessibility: { total: 100, deductions: 0 },
            security: { total: 100, deductions: 0 },
            performance: { total: 100, deductions: 0 },
        };
        // Deduction weights by severity
        const severityWeights = {
            critical: 15,
            serious: 10,
            moderate: 5,
            minor: 2,
            info: 0,
        };
        let totalIssues = 0;
        let criticalIssues = 0;
        for (const row of findingsResult.rows) {
            const count = parseInt(row.count, 10);
            const deduction = severityWeights[row.severity] || 0;
            if (categoryScores[row.category]) {
                categoryScores[row.category].deductions += deduction * count;
            }
            totalIssues += count;
            if (row.severity === 'critical') {
                criticalIssues += count;
            }
        }
        // Calculate final scores (minimum 0)
        const seoScore = Math.max(0, categoryScores.seo.total - categoryScores.seo.deductions);
        const accessibilityScore = Math.max(0, categoryScores.accessibility.total - categoryScores.accessibility.deductions);
        const securityScore = Math.max(0, categoryScores.security.total - categoryScores.security.deductions);
        const performanceScore = Math.max(0, categoryScores.performance.total - categoryScores.performance.deductions);
        // Update job with scores
        await this.pool.query(`
      UPDATE audit_jobs SET
        total_issues = $2,
        critical_issues = $3,
        seo_score = $4,
        accessibility_score = $5,
        security_score = $6,
        performance_score = $7
      WHERE id = $1
    `, [
            this.job.id,
            totalIssues,
            criticalIssues,
            this.job.check_seo ? seoScore : null,
            this.job.check_accessibility ? accessibilityScore : null,
            this.job.check_security ? securityScore : null,
            this.job.check_performance ? performanceScore : null,
        ]);
    }
    /**
     * Emit progress event
     */
    emitProgress(event) {
        if (this.onProgress) {
            this.onProgress(event);
        }
    }
    /**
     * Shutdown services
     */
    async shutdown() {
        if (this.spider) {
            await this.spider.shutdown();
            this.spider = null;
        }
        // Clear queue for this job
        if (this.job) {
            await this.pool.query('DELETE FROM crawl_queue WHERE audit_job_id = $1', [this.job.id]);
        }
        // Clear rate limiter state
        if (this.rateLimiter && this.job) {
            this.rateLimiter.clearDomain(this.job.target_domain);
        }
        this.urlNormalizer = null;
        this.robotsParser = null;
        this.rateLimiter = null;
        this.job = null;
    }
    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.CrawlCoordinator = CrawlCoordinator;
/**
 * Create a crawl coordinator
 */
function createCoordinator(config) {
    return new CrawlCoordinator(config);
}
//# sourceMappingURL=coordinator.service.js.map