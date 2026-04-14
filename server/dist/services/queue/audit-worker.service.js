"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditWorkerService = void 0;
exports.createAuditWorker = createAuditWorker;
const playwright_1 = require("playwright");
const job_queue_service_1 = require("./job-queue.service");
const spider_service_1 = require("../spider/spider.service");
const url_normalizer_service_1 = require("../spider/url-normalizer.service");
const robots_parser_service_1 = require("../spider/robots-parser.service");
const rate_limiter_service_1 = require("../spider/rate-limiter.service");
const audit_engines_1 = require("../audit-engines");
const error_classifier_service_1 = require("../spider/error-classifier.service");
const consent_constants_js_1 = require("../../constants/consent.constants.js");
const domain_verification_service_js_1 = require("../domain-verification.service.js");
const asset_extractor_service_js_1 = require("../asset-extractor.service.js");
const audit_shared_1 = require("./audit-shared");
const memory_monitor_1 = require("./memory-monitor");
const webhook_service_js_1 = require("../webhook.service.js");
// Maximum audit duration (30 minutes)
const AUDIT_TIMEOUT_MS = 30 * 60 * 1000;
// Max retries for failed page crawls
const MAX_PAGE_RETRIES = 2;
// Security blocking detection thresholds
const SECURITY_BLOCK_THRESHOLD = 5; // Consecutive security errors to trigger early fail
const SECURITY_BLOCK_RATIO_THRESHOLD = 0.8; // 80% security errors triggers early fail
const MIN_PAGES_FOR_RATIO_CHECK = 10; // Minimum pages before checking ratio
// Security-related error types that indicate blocking
const SECURITY_ERROR_TYPES = [
    error_classifier_service_1.CrawlErrorType.CLOUDFLARE_CHALLENGE,
    error_classifier_service_1.CrawlErrorType.CAPTCHA_REQUIRED,
    error_classifier_service_1.CrawlErrorType.BOT_DETECTED,
    error_classifier_service_1.CrawlErrorType.ACCESS_DENIED,
    error_classifier_service_1.CrawlErrorType.WAF_BLOCKED,
    error_classifier_service_1.CrawlErrorType.RATE_LIMITED,
    error_classifier_service_1.CrawlErrorType.IP_BLOCKED,
];
const DEFAULT_SPIDER_CONFIG = {
    maxPages: 100,
    maxDepth: 5,
    maxConcurrentPages: 3,
    requestDelayMs: 500,
    timeoutMs: 30000,
    respectRobotsTxt: true,
    includeSubdomains: false,
    userAgent: consent_constants_js_1.SCANNER_INFO.USER_AGENT,
};
/**
 * Audit worker that processes jobs from the queue
 */
class AuditWorkerService {
    pool;
    queue;
    auditCoordinator;
    browser = null;
    isRunning = false;
    config;
    maxConcurrentJobs;
    effectiveConcurrency;
    // Track discovered links per job (keyed by job ID)
    discoveredLinksPerJob = new Map();
    // Track active jobs being processed
    activeJobs = new Map();
    // Periodic stale job recovery
    staleRecoveryInterval = null;
    // Timestamp of last successful poll loop iteration
    lastPollAt = 0;
    constructor(config) {
        this.config = config;
        this.pool = config.pool;
        this.queue = (0, job_queue_service_1.createJobQueue)({ pool: config.pool });
        this.auditCoordinator = (0, audit_engines_1.createAuditEngineCoordinator)(config.pool);
        this.maxConcurrentJobs = config.maxConcurrentJobs ?? 3;
        this.effectiveConcurrency = this.maxConcurrentJobs;
    }
    /**
     * Get the current effective concurrency (adjusted by memory pressure)
     */
    getEffectiveConcurrency() {
        return this.effectiveConcurrency;
    }
    /**
     * Get worker ID
     */
    getWorkerId() {
        return this.queue.getWorkerId();
    }
    /**
     * Check if currently processing any jobs
     */
    isProcessing() {
        return this.queue.isProcessing();
    }
    /**
     * Start the worker
     */
    async start() {
        console.log(`🚀 Starting audit worker: ${this.getWorkerId()} (max ${this.maxConcurrentJobs} concurrent jobs)`);
        // Initialize browser
        await this.initializeBrowser();
        // Recover any stale jobs
        const recovered = await this.queue.recoverStaleJobs();
        if (recovered > 0) {
            console.log(`♻️  Recovered ${recovered} stale job(s)`);
        }
        // Start processing
        this.isRunning = true;
        this.queue.start();
        // Run stale job recovery and process loop watchdog periodically (every 5 minutes)
        this.lastPollAt = Date.now();
        this.staleRecoveryInterval = setInterval(async () => {
            try {
                const recovered = await this.queue.recoverStaleJobs();
                if (recovered > 0) {
                    console.log(`♻️  Recovered ${recovered} stale job(s)`);
                }
            }
            catch (err) {
                console.error('Stale recovery check failed:', err);
            }
            // Watchdog: if the process loop hasn't polled in 2 minutes, restart it
            if (this.isRunning && this.lastPollAt > 0 && Date.now() - this.lastPollAt > 120_000) {
                console.error('🐕 Watchdog: process loop appears stalled — restarting...');
                this.lastPollAt = Date.now();
                this.processLoop().catch((err) => {
                    console.error('Process loop restart failed:', err);
                });
            }
        }, 300_000);
        await this.processLoop();
    }
    /**
     * Stop the worker gracefully
     */
    async stop() {
        console.log('🛑 Stopping audit worker...');
        this.isRunning = false;
        this.queue.stop();
        if (this.staleRecoveryInterval) {
            clearInterval(this.staleRecoveryInterval);
            this.staleRecoveryInterval = null;
        }
        // Release current job if any
        await this.queue.releaseCurrentJob();
        // Shutdown browser
        await this.shutdownBrowser();
        console.log('✅ Worker stopped');
    }
    /**
     * Initialize browser instance
     */
    async initializeBrowser() {
        this.browser = await playwright_1.chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
            ],
        });
    }
    /**
     * Shutdown browser
     */
    async shutdownBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    /**
     * Main processing loop - supports concurrent job processing
     */
    async processLoop() {
        while (this.isRunning) {
            try {
                this.lastPollAt = Date.now();
                // Clean up completed jobs from activeJobs map
                for (const [jobId, promise] of this.activeJobs) {
                    // Check if the promise is settled by racing with an immediate resolve
                    const isSettled = await Promise.race([
                        promise.then(() => true).catch(() => true),
                        Promise.resolve(false),
                    ]);
                    if (isSettled) {
                        this.activeJobs.delete(jobId);
                    }
                }
                // Check browser health - restart if crashed
                if (this.browser && !this.browser.isConnected()) {
                    console.warn('⚠️  Browser disconnected — restarting...');
                    try {
                        await this.browser.close();
                    }
                    catch { /* already dead */ }
                    this.browser = null;
                    await this.initializeBrowser();
                    console.log('✅ Browser restarted');
                }
                // Adaptive concurrency based on memory pressure
                const mem = (0, memory_monitor_1.getMemoryUsage)();
                const prevConcurrency = this.effectiveConcurrency;
                if (mem.usedPercent < 60) {
                    this.effectiveConcurrency = Math.min(this.maxConcurrentJobs + 1, this.maxConcurrentJobs * 2);
                }
                else if (mem.usedPercent <= 85) {
                    this.effectiveConcurrency = this.maxConcurrentJobs;
                }
                else {
                    this.effectiveConcurrency = Math.max(1, this.activeJobs.size);
                }
                if (prevConcurrency !== this.effectiveConcurrency) {
                    console.log(`🔧 Effective concurrency adjusted: ${prevConcurrency} → ${this.effectiveConcurrency} (memory ${mem.usedPercent}%)`);
                }
                // Try to fill available job slots
                while (this.activeJobs.size < this.effectiveConcurrency) {
                    if (!(0, memory_monitor_1.canAcceptJob)()) {
                        console.log(`⚠️  Memory usage above ${(0, memory_monitor_1.getMemoryThreshold)()}% — skipping job claim`);
                        break;
                    }
                    const job = await this.queue.claimJob();
                    if (!job)
                        break; // No more pending jobs
                    console.log(`📋 Starting job ${job.id} (${this.activeJobs.size + 1}/${this.effectiveConcurrency} slots): ${job.target_url}`);
                    // Start job processing without awaiting (concurrent)
                    const jobPromise = this.processJob(job).catch((error) => {
                        // Log but don't throw - error handling is done in processJob
                        console.error(`Job ${job.id} failed:`, error);
                    });
                    this.activeJobs.set(job.id, jobPromise);
                }
                // If we have no active jobs and no jobs were claimed, wait before polling again
                if (this.activeJobs.size === 0) {
                    await this.sleep(this.config.pollingIntervalMs || 1000);
                }
                else {
                    // Wait a bit before checking for more jobs
                    await this.sleep(500);
                }
            }
            catch (error) {
                console.error('Error in process loop:', error);
                await this.sleep(5000); // Wait before retrying
            }
        }
        // Wait for all active jobs to complete on shutdown
        if (this.activeJobs.size > 0) {
            console.log(`⏳ Waiting for ${this.activeJobs.size} active job(s) to complete...`);
            await Promise.allSettled(this.activeJobs.values());
        }
    }
    /**
     * Process a single audit job
     */
    async processJob(job) {
        console.log(`📋 Processing job ${job.id}: ${job.target_url}`);
        await this.config.onJobStart?.(job);
        try {
            // Run the audit
            await this.runAudit(job);
            // Mark as completed
            await this.queue.completeJob(job.id);
            // Deliver webhook event (non-blocking)
            if (job.site_id) {
                (0, webhook_service_js_1.deliverEvent)('audit.completed', job.site_id, {
                    auditId: job.id,
                    siteId: job.site_id,
                    status: 'completed',
                    targetUrl: job.target_url,
                    scores: {
                        seo: job.seo_score,
                        accessibility: job.accessibility_score,
                        security: job.security_score,
                        performance: job.performance_score,
                        content: job.content_score,
                        structuredData: job.structured_data_score,
                    },
                    totalIssues: job.total_issues,
                    criticalIssues: job.critical_issues,
                    completedAt: new Date().toISOString(),
                }).catch((err) => console.error('Webhook delivery error (completed):', err.message));
            }
            console.log(`✅ Completed job ${job.id}`);
            await this.config.onJobComplete?.(job);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error(`❌ Failed job ${job.id}:`, err.message);
            await this.queue.failJob(job.id, err.message);
            // Deliver webhook event (non-blocking)
            if (job.site_id) {
                (0, webhook_service_js_1.deliverEvent)('audit.failed', job.site_id, {
                    auditId: job.id,
                    siteId: job.site_id,
                    status: 'failed',
                    targetUrl: job.target_url,
                    error: err.message,
                    failedAt: new Date().toISOString(),
                }).catch((webhookErr) => console.error('Webhook delivery error (failed):', webhookErr.message));
            }
            await this.config.onJobFail?.(job, err);
        }
    }
    /**
     * Run the actual audit
     */
    async runAudit(job) {
        if (!this.browser) {
            throw new Error('Browser not initialized');
        }
        // Initialize services
        const urlNormalizer = (0, url_normalizer_service_1.createUrlNormalizer)(job.target_url, job.include_subdomains);
        const rateLimiter = (0, rate_limiter_service_1.createRateLimiter)();
        const robotsParser = (0, robots_parser_service_1.createRobotsParser)(DEFAULT_SPIDER_CONFIG.userAgent);
        // Build spider config - apply stricter limits for unverified domains
        const isUnverifiedMode = job.unverified_mode === true;
        // Look up domain bypass settings for verified domains
        const domainSettings = job.organization_id
            ? await (0, domain_verification_service_js_1.getDomainSettingsForAudit)(job.organization_id, job.target_domain)
            : null;
        // Determine rate limit profile settings
        let rateLimitConfig = {
            minDelayMs: DEFAULT_SPIDER_CONFIG.requestDelayMs,
            concurrentPages: DEFAULT_SPIDER_CONFIG.maxConcurrentPages,
        };
        if (isUnverifiedMode) {
            // Unverified mode: strictest limits
            rateLimitConfig = {
                minDelayMs: consent_constants_js_1.UNVERIFIED_DOMAIN_LIMITS.MIN_DELAY_MS,
                concurrentPages: consent_constants_js_1.UNVERIFIED_DOMAIN_LIMITS.CONCURRENT_PAGES,
            };
        }
        else if (domainSettings?.verified && domainSettings.rateLimitProfile) {
            // Verified domain with custom rate limit profile
            const profile = consent_constants_js_1.RATE_LIMIT_PROFILES[domainSettings.rateLimitProfile];
            if (profile) {
                rateLimitConfig = {
                    minDelayMs: profile.minDelayMs,
                    concurrentPages: profile.concurrentPages,
                };
            }
        }
        // Determine robots.txt behavior
        let respectRobotsTxt = job.respect_robots_txt;
        if (isUnverifiedMode) {
            // Always respect robots.txt for unverified domains
            respectRobotsTxt = true;
        }
        else if (domainSettings?.verified && domainSettings.ignoreRobotsTxt) {
            // Verified domain owner opted to ignore robots.txt
            respectRobotsTxt = false;
        }
        // Prepare custom headers for verified domains
        const customHeaders = {};
        if (domainSettings?.verified && domainSettings.sendVerificationHeader && domainSettings.verificationToken) {
            customHeaders[consent_constants_js_1.SCANNER_INFO.VERIFICATION_HEADER] = domainSettings.verificationToken;
        }
        const spiderConfig = {
            ...DEFAULT_SPIDER_CONFIG,
            maxPages: isUnverifiedMode
                ? Math.min(job.max_pages, consent_constants_js_1.UNVERIFIED_DOMAIN_LIMITS.MAX_PAGES)
                : job.max_pages,
            maxDepth: job.max_depth,
            respectRobotsTxt,
            includeSubdomains: job.include_subdomains,
            maxConcurrentPages: rateLimitConfig.concurrentPages,
            requestDelayMs: rateLimitConfig.minDelayMs,
            customHeaders: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
        };
        // Log mode information
        if (isUnverifiedMode) {
            console.log(`⚠️  Running in RESTRICTED MODE (unverified domain): Max ${consent_constants_js_1.UNVERIFIED_DOMAIN_LIMITS.MAX_PAGES} pages, sequential crawling, ${consent_constants_js_1.UNVERIFIED_DOMAIN_LIMITS.MIN_DELAY_MS}ms delay`);
            await (0, audit_shared_1.addActivityLog)(this.pool, job.id, `Running in restricted mode (unverified domain): Max ${consent_constants_js_1.UNVERIFIED_DOMAIN_LIMITS.MAX_PAGES} pages, sequential crawling, slower requests`, 'info');
        }
        else if (domainSettings?.verified) {
            const profileName = domainSettings.rateLimitProfile
                ? consent_constants_js_1.RATE_LIMIT_PROFILES[domainSettings.rateLimitProfile]?.label || 'Default'
                : 'Default';
            console.log(`✓ Verified domain - Rate profile: ${profileName}, Robots.txt: ${respectRobotsTxt ? 'Respected' : 'Bypassed'}, Verification header: ${domainSettings.sendVerificationHeader ? 'Sent' : 'Not sent'}`);
            await (0, audit_shared_1.addActivityLog)(this.pool, job.id, `Verified domain scan - ${profileName} speed${!respectRobotsTxt ? ', robots.txt bypassed' : ''}`, 'info');
        }
        const spider = (0, spider_service_1.createSpider)(spiderConfig, urlNormalizer, rateLimiter);
        await spider.initialize();
        // Build audit config using shared utility (tier checks for premium features)
        const auditConfig = await (0, audit_shared_1.buildAuditConfig)(this.pool, job);
        // Check file extraction separately since it depends on the job flag
        let checkFileExtraction = false;
        try {
            const tierCheck = await this.pool.query(`SELECT tl.available_checks FROM tier_limits tl
         JOIN (
           SELECT COALESCE(
             (SELECT s.tier FROM subscriptions s WHERE s.user_id = sites.owner_id AND s.status = 'active' ORDER BY s.created_at DESC LIMIT 1),
             (SELECT s.tier FROM subscriptions s JOIN organizations o ON o.id = s.organization_id WHERE o.owner_id = sites.owner_id AND s.status = 'active' ORDER BY s.created_at DESC LIMIT 1),
             (SELECT s.tier FROM subscriptions s JOIN organization_members om ON om.organization_id = s.organization_id WHERE om.user_id = sites.owner_id AND s.status = 'active' ORDER BY s.created_at DESC LIMIT 1),
             'free'
           ) as tier
           FROM sites WHERE sites.id = $1
         ) ut ON tl.tier = ut.tier::subscription_tier`, [job.site_id]);
            const availableChecks = tierCheck.rows[0]?.available_checks || [];
            checkFileExtraction = job.check_file_extraction && availableChecks.includes('file-extraction');
        }
        catch {
            // Default to disabled
        }
        // Initialize discovered links map for this job
        this.discoveredLinksPerJob.set(job.id, new Map());
        try {
            const isSinglePageMode = job.max_pages === 1;
            // Load robots.txt for isAllowed() checks during crawling (discovery already seeded the queue)
            if (job.respect_robots_txt && !isSinglePageMode) {
                await robotsParser.loadFromUrl(job.target_url);
                const crawlDelay = robotsParser.getCrawlDelay();
                if (crawlDelay) {
                    rateLimiter.setCrawlDelay(job.target_domain, crawlDelay);
                }
            }
            // Track unique issues (by rule_id) for progress reporting
            // Load any issues already found during discovery phase
            const uniqueRuleIds = new Set();
            const uniqueCriticalRuleIds = new Set();
            try {
                const existingFindings = await this.pool.query(`SELECT DISTINCT rule_id, severity FROM audit_findings WHERE audit_job_id = $1`, [job.id]);
                for (const f of existingFindings.rows) {
                    uniqueRuleIds.add(f.rule_id);
                    if (f.severity === 'critical')
                        uniqueCriticalRuleIds.add(f.rule_id);
                }
            }
            catch {
                // Non-fatal
            }
            // Process the crawl queue (discovery worker already seeded it)
            let pagesCrawled = 0;
            let pagesAudited = 0;
            const retryCount = new Map();
            const auditStartTime = Date.now();
            // Security blocking detection
            let consecutiveSecurityErrors = 0;
            let totalSecurityErrors = 0;
            let totalAttempts = 0;
            let securityBlocked = false;
            const concurrency = isSinglePageMode ? 1 : spiderConfig.maxConcurrentPages;
            if (isSinglePageMode) {
                console.log(`🔍 Auditing single page: ${job.target_url}`);
                await (0, audit_shared_1.addActivityLog)(this.pool, job.id, 'Starting single page audit', 'info');
            }
            else {
                console.log(`🕷️  Starting crawl of ${job.target_url}`);
                console.log(`   Max pages: ${job.max_pages}, Max depth: ${job.max_depth}, Concurrency: ${concurrency}`);
                await (0, audit_shared_1.addActivityLog)(this.pool, job.id, `Starting crawl (max ${job.max_pages} pages, depth ${job.max_depth})`, 'info');
            }
            while (this.isRunning && pagesCrawled < job.max_pages) {
                // Check overall audit timeout (#4)
                if (Date.now() - auditStartTime > AUDIT_TIMEOUT_MS) {
                    console.log('⏰ Audit timeout reached (30 min)');
                    await (0, audit_shared_1.addActivityLog)(this.pool, job.id, 'Audit timed out after 30 minutes', 'warning');
                    break;
                }
                // Fetch a batch of queue items for concurrent processing (#1)
                const batchSize = Math.min(concurrency, job.max_pages - pagesCrawled);
                const batch = [];
                for (let i = 0; i < batchSize; i++) {
                    const queueItem = await this.getNextFromQueue(job.id);
                    if (!queueItem)
                        break;
                    // Check robots.txt
                    if (job.respect_robots_txt && !robotsParser.isAllowed(queueItem.url)) {
                        console.log(`🚫 Blocked by robots.txt: ${queueItem.url}`);
                        await this.markPageSkipped(job.id, queueItem.url, 'Blocked by robots.txt');
                        await this.removeFromQueue(job.id, queueItem.urlHash);
                        i--; // Don't count this towards batch size
                        continue;
                    }
                    batch.push(queueItem);
                    // Remove from queue immediately to prevent other concurrent fetches from re-taking
                    await this.removeFromQueue(job.id, queueItem.urlHash);
                }
                if (batch.length === 0) {
                    console.log('📭 Queue empty, crawl complete');
                    break;
                }
                // Track the starting page number for this batch for accurate logging
                const batchStartNumber = pagesCrawled;
                // Process batch concurrently with indexed items for proper logging
                const batchPromises = batch.map(async (queueItem, batchIndex) => {
                    // Each page in the batch gets a unique number
                    const pageNumber = batchStartNumber + batchIndex + 1;
                    const pageId = await this.createPage(job.id, queueItem);
                    try {
                        const urlPath = new URL(queueItem.url).pathname || '/';
                        console.log(`🔍 [${pageNumber}/${job.max_pages}] Crawling: ${queueItem.url}`);
                        await (0, audit_shared_1.addActivityLog)(this.pool, job.id, `Crawling ${urlPath}`, 'info');
                        const crawlResult = await spider.crawlPage(queueItem.url);
                        // Increment counters atomically and update progress immediately
                        pagesCrawled++;
                        await this.queue.updateProgress(job.id, {
                            currentUrl: queueItem.url,
                            pagesCrawled,
                        });
                        await this.updatePageData(pageId, crawlResult);
                        await this.queueDiscoveredLinks(job, crawlResult, queueItem.depth);
                        if (crawlResult.links.length > 0) {
                            const jobLinks = this.discoveredLinksPerJob.get(job.id);
                            jobLinks.set(pageId, {
                                pageId,
                                pageUrl: queueItem.url,
                                links: crawlResult.links,
                            });
                        }
                        // File extraction (non-blocking)
                        if (checkFileExtraction) {
                            try {
                                const assets = (0, asset_extractor_service_js_1.extractAssets)(crawlResult.html, crawlResult.url, crawlResult.resources);
                                if (assets.length > 0) {
                                    await this.storeAssets(job.id, pageId, assets);
                                }
                            }
                            catch (assetErr) {
                                console.log(`   ⚠️ Asset extraction failed: ${assetErr instanceof Error ? assetErr.message : assetErr}`);
                            }
                        }
                        const isHtmlContent = this.isHtmlContentType(crawlResult.contentType);
                        let auditResult = { findings: [] };
                        if (isHtmlContent) {
                            let page = null;
                            if (job.check_accessibility || job.check_performance) {
                                const context = await this.browser.newContext({
                                    userAgent: spiderConfig.userAgent,
                                    viewport: { width: 1920, height: 1080 },
                                });
                                page = await context.newPage();
                                await page.goto(queueItem.url, {
                                    waitUntil: 'networkidle',
                                    timeout: 30000,
                                });
                            }
                            auditResult = await this.auditCoordinator.analyzePage(crawlResult, page, auditConfig, queueItem.depth);
                            if (page) {
                                await page.context().close();
                            }
                        }
                        else {
                            console.log(`   ⏭️  Skipping audit for non-HTML content: ${crawlResult.contentType}`);
                        }
                        const { findings, contentAnalysis, structuredDataAnalysis } = auditResult;
                        if (findings.length > 0) {
                            await this.auditCoordinator.storeFindings(job.id, pageId, findings);
                            for (const f of findings) {
                                uniqueRuleIds.add(f.ruleId);
                                if (f.severity === 'critical')
                                    uniqueCriticalRuleIds.add(f.ruleId);
                            }
                            // Update issues count immediately (unique issues)
                            await this.queue.updateProgress(job.id, {
                                totalIssues: uniqueRuleIds.size,
                                criticalIssues: uniqueCriticalRuleIds.size,
                            });
                        }
                        await this.auditCoordinator.updatePageAuditResults(pageId, findings, auditConfig, contentAnalysis, structuredDataAnalysis);
                        pagesAudited++;
                        const pageFindings = findings.length;
                        const pageCritical = findings.filter(f => f.severity === 'critical').length;
                        console.log(`   ✓ Found ${pageFindings} issues${pageCritical > 0 ? ` (${pageCritical} critical)` : ''}, ${crawlResult.links.length} links`);
                        const issueText = pageFindings > 0
                            ? `${pageFindings} issue${pageFindings !== 1 ? 's' : ''}${pageCritical > 0 ? ` (${pageCritical} critical)` : ''}`
                            : 'No issues';
                        await (0, audit_shared_1.addActivityLog)(this.pool, job.id, `✓ ${urlPath} - ${issueText}`, pageFindings > 0 ? 'warning' : 'success');
                        await this.markPageCrawled(pageId);
                    }
                    catch (error) {
                        const urlPath = new URL(queueItem.url).pathname || '/';
                        // Classify the error for user-friendly messages and tracking
                        const rawErrorMessage = error instanceof Error ? error.message : String(error);
                        const classifiedError = (0, error_classifier_service_1.classifyError)(error instanceof Error ? error : String(error));
                        console.log(`   ❌ Failed: ${classifiedError.userMessage}`);
                        // Log the raw error for debugging if it's an unknown error type
                        if (classifiedError.type === error_classifier_service_1.CrawlErrorType.UNKNOWN) {
                            console.log(`      Raw error: ${rawErrorMessage}`);
                        }
                        // Track security errors for early blocking detection
                        totalAttempts++;
                        const isSecurityError = SECURITY_ERROR_TYPES.includes(classifiedError.type);
                        if (isSecurityError) {
                            consecutiveSecurityErrors++;
                            totalSecurityErrors++;
                        }
                        else {
                            consecutiveSecurityErrors = 0; // Reset on non-security error
                        }
                        // Retry logic (#2) - only retry for retryable errors
                        const attempts = (retryCount.get(queueItem.url) || 0) + 1;
                        retryCount.set(queueItem.url, attempts);
                        if (classifiedError.retryable && attempts <= MAX_PAGE_RETRIES) {
                            console.log(`   🔄 Retrying (${attempts}/${MAX_PAGE_RETRIES})...`);
                            await (0, audit_shared_1.addActivityLog)(this.pool, job.id, `Retrying ${urlPath} (attempt ${attempts + 1})`, 'info');
                            // Re-add to queue with lower priority for retry (forRetry=true skips duplicate check)
                            await (0, audit_shared_1.addToQueue)(this.pool, job.id, queueItem.url, queueItem.depth, null, 10, true);
                            // Update retry count in page record
                            await this.updatePageRetryCount(pageId, attempts);
                        }
                        else {
                            await this.markPageFailed(pageId, classifiedError);
                            await (0, audit_shared_1.addActivityLog)(this.pool, job.id, `✗ ${urlPath} - ${classifiedError.userMessage}`, 'error');
                        }
                    }
                });
                await Promise.all(batchPromises);
                // Check for security blocking after each batch
                const securityRatio = totalAttempts > 0 ? totalSecurityErrors / totalAttempts : 0;
                const hitConsecutiveThreshold = consecutiveSecurityErrors >= SECURITY_BLOCK_THRESHOLD;
                const hitRatioThreshold = totalAttempts >= MIN_PAGES_FOR_RATIO_CHECK && securityRatio >= SECURITY_BLOCK_RATIO_THRESHOLD;
                if (hitConsecutiveThreshold || hitRatioThreshold) {
                    securityBlocked = true;
                    console.log(`🛡️ Security blocking detected: ${totalSecurityErrors}/${totalAttempts} pages blocked`);
                    await (0, audit_shared_1.addActivityLog)(this.pool, job.id, `Website security protection is blocking the crawler (${totalSecurityErrors} pages blocked)`, 'error');
                    // Update job with security blocked status
                    await this.pool.query(`
            UPDATE audit_jobs SET
              error_message = 'This website has security protection (e.g., Cloudflare) that blocks automated crawling. The audit cannot complete.',
              pages_blocked = $2
            WHERE id = $1
          `, [job.id, totalSecurityErrors]);
                    // Break out of the crawl loop
                    break;
                }
                // Final progress update after batch (ensures pagesAudited is synced)
                await this.queue.updateProgress(job.id, {
                    pagesCrawled,
                    pagesAudited,
                    totalIssues: uniqueRuleIds.size,
                    criticalIssues: uniqueCriticalRuleIds.size,
                });
            }
            // If security blocked, fail the audit early with a clear error
            if (securityBlocked) {
                // Still clean up and calculate what we can
                await this.cleanupCrawlQueue(job.id);
                await this.calculateErrorSummary(job.id);
                // Throw error to fail the job properly
                throw new Error(`This website has security protection (e.g., Cloudflare, WAF) that is blocking automated access. ` +
                    `${totalSecurityErrors} out of ${totalAttempts} pages were blocked. ` +
                    `The audit cannot complete - please whitelist the crawler or disable bot protection.`);
            }
            // ── Mobile audit pass ──────────────────────────────────────────────
            if (job.include_mobile && (job.check_accessibility || job.check_performance)) {
                await (0, audit_shared_1.addActivityLog)(this.pool, job.id, 'Starting mobile audit pass...', 'info');
                await this.queue.updateProgress(job.id, { currentUrl: '[mobile] Starting mobile pass...' });
                // Get all crawled HTML pages for mobile re-visit
                const crawledPages = await this.pool.query(`
          SELECT id, url FROM audit_pages
          WHERE audit_job_id = $1 AND crawl_status = 'crawled'
            AND content_type LIKE '%html%'
          ORDER BY depth ASC, url ASC
        `, [job.id]);
                let mobileAudited = 0;
                const totalMobilePages = crawledPages.rows.length;
                for (const pageRow of crawledPages.rows) {
                    if (!this.isRunning)
                        break;
                    try {
                        await this.queue.updateProgress(job.id, { currentUrl: `[mobile] ${pageRow.url}` });
                        // Crawl with mobile fingerprint
                        const mobileCrawlResult = await spider.crawlPage(pageRow.url, 'mobile');
                        if (!this.isHtmlContentType(mobileCrawlResult.contentType))
                            continue;
                        // Create mobile Playwright page for axe-core
                        let mobilePage = null;
                        if (this.browser && (job.check_accessibility || job.check_performance)) {
                            const mobileContext = await this.browser.newContext({
                                userAgent: mobileCrawlResult.viewport ? `Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1` : spiderConfig.userAgent,
                                viewport: mobileCrawlResult.viewport || { width: 390, height: 844 },
                                isMobile: true,
                                hasTouch: true,
                            });
                            mobilePage = await mobileContext.newPage();
                            try {
                                await mobilePage.goto(pageRow.url, {
                                    waitUntil: 'networkidle',
                                    timeout: 30000,
                                });
                            }
                            catch {
                                // Page load failed on mobile — skip but don't fail the audit
                                await mobilePage.context().close();
                                continue;
                            }
                        }
                        // Run mobile-only engines (accessibility + performance)
                        const mobileResult = await this.auditCoordinator.analyzeMobilePage(mobileCrawlResult, mobilePage, auditConfig);
                        if (mobilePage) {
                            await mobilePage.context().close();
                        }
                        // Store mobile findings
                        if (mobileResult.findings.length > 0) {
                            await this.auditCoordinator.storeFindings(job.id, pageRow.id, mobileResult.findings, 'mobile');
                        }
                        // Calculate and store mobile page scores
                        const mobileA11yScore = this.auditCoordinator.calculateScore(mobileResult.findings.filter(f => f.category === 'accessibility'), 'accessibility');
                        const mobilePerfScore = this.auditCoordinator.calculateScore(mobileResult.findings.filter(f => f.category === 'performance'), 'performance');
                        const mobileA11yIssues = mobileResult.findings.filter(f => f.category === 'accessibility').length;
                        const mobilePerfIssues = mobileResult.findings.filter(f => f.category === 'performance').length;
                        await this.pool.query(`
              UPDATE audit_pages SET
                mobile_accessibility_score = $2,
                mobile_performance_score = $3,
                mobile_accessibility_issues = $4,
                mobile_performance_issues = $5
              WHERE id = $1
            `, [pageRow.id, mobileA11yScore, mobilePerfScore, mobileA11yIssues, mobilePerfIssues]);
                        mobileAudited++;
                        if (mobileAudited % 5 === 0 || mobileAudited === totalMobilePages) {
                            await (0, audit_shared_1.addActivityLog)(this.pool, job.id, `Mobile pass: ${mobileAudited}/${totalMobilePages} pages audited`, 'info');
                        }
                    }
                    catch (err) {
                        console.warn(`Mobile audit failed for ${pageRow.url}:`, err instanceof Error ? err.message : err);
                    }
                }
                // Deduplicate findings that appear on both desktop and mobile
                const deduped = await this.auditCoordinator.deduplicateFindings(job.id);
                if (deduped > 0) {
                    await (0, audit_shared_1.addActivityLog)(this.pool, job.id, `Deduplicated ${deduped} findings found on both desktop and mobile`, 'info');
                }
                // Calculate aggregate mobile scores for the job
                const mobileScores = await this.pool.query(`
          SELECT
            ROUND(AVG(mobile_accessibility_score)) as avg_a11y,
            ROUND(AVG(mobile_performance_score)) as avg_perf
          FROM audit_pages
          WHERE audit_job_id = $1
            AND mobile_accessibility_score IS NOT NULL
        `, [job.id]);
                if (mobileScores.rows[0]) {
                    await this.pool.query(`
            UPDATE audit_jobs SET
              mobile_accessibility_score = $2,
              mobile_performance_score = $3
            WHERE id = $1
          `, [
                        job.id,
                        mobileScores.rows[0].avg_a11y ? parseInt(mobileScores.rows[0].avg_a11y) : null,
                        mobileScores.rows[0].avg_perf ? parseInt(mobileScores.rows[0].avg_perf) : null,
                    ]);
                }
                await (0, audit_shared_1.addActivityLog)(this.pool, job.id, `Mobile pass complete: ${mobileAudited} pages audited`, 'success');
            }
            // Post-crawl SEO checks
            if (job.check_seo) {
                await (0, audit_shared_1.addActivityLog)(this.pool, job.id, 'Checking for broken links...', 'info');
                await this.checkBrokenLinks(job.id);
                await (0, audit_shared_1.addActivityLog)(this.pool, job.id, 'Running cross-page SEO analysis...', 'info');
                await this.crossPageSeoChecks(job.id);
            }
            // Calculate final scores
            await (0, audit_shared_1.addActivityLog)(this.pool, job.id, 'Calculating final scores...', 'info');
            await this.calculateFinalScores(job.id, auditConfig);
            // Calculate Content Quality Score (CQS)
            await this.calculateCqsScores(job.id);
            // Calculate error summary
            await this.calculateErrorSummary(job.id);
            // Clean up crawl queue (#7)
            await this.cleanupCrawlQueue(job.id);
            await (0, audit_shared_1.addActivityLog)(this.pool, job.id, `Audit complete! ${pagesCrawled} pages crawled, ${uniqueRuleIds.size} unique issues found`, 'success');
        }
        finally {
            await spider.shutdown();
            // Clean up discovered links for this job
            this.discoveredLinksPerJob.delete(job.id);
        }
    }
    /**
     * Get next URL from queue
     */
    async getNextFromQueue(jobId) {
        const result = await this.pool.query(`
      SELECT url, url_hash, depth
      FROM crawl_queue
      WHERE audit_job_id = $1
      ORDER BY priority DESC, created_at ASC
      LIMIT 1
    `, [jobId]);
        if (result.rows.length === 0)
            return null;
        return {
            url: result.rows[0].url,
            urlHash: result.rows[0].url_hash,
            depth: result.rows[0].depth,
        };
    }
    /**
     * Remove URL from queue
     */
    async removeFromQueue(jobId, urlHash) {
        await this.pool.query(`
      DELETE FROM crawl_queue WHERE audit_job_id = $1 AND url_hash = $2
    `, [jobId, urlHash]);
    }
    /**
     * Create page record
     */
    async createPage(jobId, queueItem) {
        const result = await this.pool.query(`
      INSERT INTO audit_pages (audit_job_id, url, url_hash, depth, crawl_status)
      VALUES ($1, $2, $3, $4, 'crawling')
      ON CONFLICT (audit_job_id, url_hash) DO UPDATE SET crawl_status = 'crawling'
      RETURNING id
    `, [jobId, queueItem.url, queueItem.urlHash, queueItem.depth]);
        return result.rows[0].id;
    }
    /**
     * Update page with crawl data
     */
    async updatePageData(pageId, result) {
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
        word_count = $10
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
     * Queue discovered links
     */
    async queueDiscoveredLinks(job, result, currentDepth) {
        const nextDepth = currentDepth + 1;
        if (nextDepth > job.max_depth)
            return;
        const priority = Math.max(0, 100 - (nextDepth * 10));
        for (const link of result.links) {
            if (!link.isExternal && !link.isNoFollow) {
                // Skip sitemap, robots.txt, and feed URLs
                if ((0, audit_shared_1.shouldExcludeUrl)(link.href)) {
                    continue;
                }
                await (0, audit_shared_1.addToQueue)(this.pool, job.id, link.href, nextDepth, result.url, priority);
            }
        }
    }
    /**
     * Mark page as crawled
     */
    async markPageCrawled(pageId) {
        await this.pool.query(`
      UPDATE audit_pages SET crawl_status = 'crawled', crawled_at = NOW() WHERE id = $1
    `, [pageId]);
    }
    /**
     * Store discovered assets for a page (upsert + junction rows)
     */
    async storeAssets(auditJobId, pageId, assets) {
        for (const asset of assets) {
            try {
                // Upsert asset row — increment page_count on conflict, upgrade source to 'both' if mixed
                const result = await this.pool.query(`
          INSERT INTO audit_assets (audit_job_id, url, url_hash, asset_type, mime_type, file_extension, file_name, file_size_bytes, source, http_status, page_count)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)
          ON CONFLICT (audit_job_id, url_hash) DO UPDATE SET
            page_count = audit_assets.page_count + 1,
            source = CASE
              WHEN audit_assets.source != EXCLUDED.source THEN 'both'
              ELSE audit_assets.source
            END,
            mime_type = COALESCE(EXCLUDED.mime_type, audit_assets.mime_type),
            file_size_bytes = COALESCE(EXCLUDED.file_size_bytes, audit_assets.file_size_bytes),
            http_status = COALESCE(EXCLUDED.http_status, audit_assets.http_status)
          RETURNING id
        `, [
                    auditJobId,
                    asset.url,
                    asset.urlHash,
                    asset.assetType,
                    asset.mimeType,
                    asset.fileExtension,
                    asset.fileName,
                    asset.fileSizeBytes,
                    asset.source,
                    asset.httpStatus,
                ]);
                const assetId = result.rows[0].id;
                // Insert junction row (ignore duplicate)
                await this.pool.query(`
          INSERT INTO audit_asset_pages (audit_asset_id, audit_page_id, html_element, html_attribute)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (audit_asset_id, audit_page_id) DO NOTHING
        `, [assetId, pageId, asset.htmlElement, asset.htmlAttribute]);
            }
            catch (err) {
                // Skip individual asset errors silently
                console.log(`   ⚠️ Failed to store asset ${asset.url}: ${err instanceof Error ? err.message : err}`);
            }
        }
    }
    /**
     * Mark page as failed with detailed error information
     */
    async markPageFailed(pageId, error) {
        await this.pool.query(`
      UPDATE audit_pages SET
        crawl_status = 'failed',
        error_message = $2,
        error_type = $3,
        error_category = $4,
        error_suggestion = $5
      WHERE id = $1
    `, [pageId, error.userMessage, error.type, error.category, error.suggestion]);
    }
    /**
     * Update retry count for a page
     */
    async updatePageRetryCount(pageId, retryCount) {
        await this.pool.query(`
      UPDATE audit_pages SET retry_count = $2, last_retry_at = NOW() WHERE id = $1
    `, [pageId, retryCount]);
    }
    /**
     * Mark page as skipped
     */
    async markPageSkipped(jobId, url, reason) {
        const urlNormalizer = (0, url_normalizer_service_1.createUrlNormalizer)(url, false);
        // IMPORTANT: Hash the NORMALIZED URL for proper deduplication
        const normalized = urlNormalizer.normalize(url);
        const normalizedUrl = normalized.normalizedUrl || url;
        const urlHash = urlNormalizer.hashUrl(normalizedUrl);
        await this.pool.query(`
      INSERT INTO audit_pages (audit_job_id, url, url_hash, depth, crawl_status, error_message)
      VALUES ($1, $2, $3, 0, 'skipped', $4)
      ON CONFLICT (audit_job_id, url_hash) DO UPDATE SET
        crawl_status = 'skipped',
        error_message = $4
    `, [jobId, normalizedUrl, urlHash, reason]);
    }
    /**
     * Calculate final scores for the audit
     */
    async calculateFinalScores(jobId, config) {
        // Calculate overall scores as the AVERAGE of individual page scores
        // This gives a more intuitive result than aggregating all findings
        const result = await this.pool.query(`
      SELECT
        ROUND(AVG(seo_score)) as avg_seo,
        ROUND(AVG(accessibility_score)) as avg_accessibility,
        ROUND(AVG(security_score)) as avg_security,
        ROUND(AVG(performance_score)) as avg_performance,
        ROUND(AVG(content_score)) as avg_content,
        ROUND(AVG(structured_data_score)) as avg_structured_data,
        COUNT(*) as page_count
      FROM audit_pages
      WHERE audit_job_id = $1 AND crawl_status = 'crawled'
    `, [jobId]);
        const row = result.rows[0];
        const pageCount = parseInt(row.page_count, 10);
        // Only set scores if we have pages and the category was checked
        const scores = {
            seo: config.checkSeo && pageCount > 0 && row.avg_seo !== null
                ? parseInt(row.avg_seo, 10) : null,
            accessibility: config.checkAccessibility && pageCount > 0 && row.avg_accessibility !== null
                ? parseInt(row.avg_accessibility, 10) : null,
            security: config.checkSecurity && pageCount > 0 && row.avg_security !== null
                ? parseInt(row.avg_security, 10) : null,
            performance: config.checkPerformance && pageCount > 0 && row.avg_performance !== null
                ? parseInt(row.avg_performance, 10) : null,
            content: config.checkContent && pageCount > 0 && row.avg_content !== null
                ? parseInt(row.avg_content, 10) : null,
            structuredData: config.checkStructuredData && pageCount > 0 && row.avg_structured_data !== null
                ? parseInt(row.avg_structured_data, 10) : null,
        };
        console.log(`📊 Final scores (avg of ${pageCount} pages):`, scores);
        // Get actual counts from database (not in-memory counters which may be inflated)
        const countsResult = await this.pool.query(`
      SELECT
        (SELECT COUNT(*) FROM audit_pages WHERE audit_job_id = $1 AND crawl_status = 'crawled') as actual_pages,
        (SELECT COUNT(DISTINCT rule_id) FROM audit_findings WHERE audit_job_id = $1) as actual_findings,
        (SELECT COUNT(DISTINCT rule_id) FROM audit_findings WHERE audit_job_id = $1 AND severity = 'critical') as critical_findings
    `, [jobId]);
        const actualPages = parseInt(countsResult.rows[0].actual_pages, 10);
        const actualFindings = parseInt(countsResult.rows[0].actual_findings, 10);
        const criticalFindings = parseInt(countsResult.rows[0].critical_findings, 10);
        console.log(`📊 Actual counts: ${actualPages} pages, ${actualFindings} findings (${criticalFindings} critical)`);
        await this.queue.updateScores(jobId, {
            seoScore: scores.seo,
            accessibilityScore: scores.accessibility,
            securityScore: scores.security,
            performanceScore: scores.performance,
            contentScore: scores.content,
            structuredDataScore: scores.structuredData,
        });
        // Fix the counts based on actual database data
        await this.pool.query(`
      UPDATE audit_jobs SET
        pages_crawled = $2,
        total_issues = $3,
        critical_issues = $4
      WHERE id = $1
    `, [jobId, actualPages, actualFindings, criticalFindings]);
    }
    /**
     * Calculate Content Quality Score (CQS) for each page and the overall audit.
     *
     * Per-page CQS = weighted average of 5 content sub-scores:
     *   quality 25%, eeat 25%, readability 20%, engagement 15%, structure 15%
     * If any sub-score is null its weight is redistributed proportionally.
     *
     * Audit-level CQS = depth-weighted average:
     *   homepage (depth 0) = 3x, depth 1 = 2x, others = 1x
     */
    async calculateCqsScores(jobId) {
        // Fetch pages with their content sub-scores
        const pagesResult = await this.pool.query(`
      SELECT id, depth,
        content_quality_score, content_readability_score,
        content_structure_score, content_engagement_score,
        eeat_score
      FROM audit_pages
      WHERE audit_job_id = $1 AND crawl_status = 'crawled'
    `, [jobId]);
        if (pagesResult.rows.length === 0)
            return;
        const weights = [
            { key: 'content_quality_score', weight: 0.25 },
            { key: 'eeat_score', weight: 0.25 },
            { key: 'content_readability_score', weight: 0.20 },
            { key: 'content_engagement_score', weight: 0.15 },
            { key: 'content_structure_score', weight: 0.15 },
        ];
        let weightedSum = 0;
        let totalWeight = 0;
        for (const page of pagesResult.rows) {
            // Calculate per-page CQS with proportional weight redistribution
            let availableWeight = 0;
            let scoreSum = 0;
            for (const { key, weight } of weights) {
                const val = page[key];
                if (val !== null && val !== undefined) {
                    availableWeight += weight;
                    scoreSum += val * weight;
                }
            }
            if (availableWeight === 0)
                continue; // No sub-scores at all
            const pageCqs = Math.round(scoreSum / availableWeight);
            // Store per-page CQS
            await this.pool.query(`UPDATE audit_pages SET cqs_score = $2 WHERE id = $1`, [page.id, pageCqs]);
            // Accumulate for audit-level weighted average
            const depthWeight = page.depth === 0 ? 3 : page.depth === 1 ? 2 : 1;
            weightedSum += pageCqs * depthWeight;
            totalWeight += depthWeight;
        }
        // Store audit-level CQS
        if (totalWeight > 0) {
            const auditCqs = Math.round(weightedSum / totalWeight);
            await this.pool.query(`UPDATE audit_jobs SET cqs_score = $2 WHERE id = $1`, [jobId, auditCqs]);
            console.log(`📊 CQS score: ${auditCqs} (from ${pagesResult.rows.length} pages)`);
        }
    }
    /**
     * Calculate and store error summary for the audit
     */
    async calculateErrorSummary(jobId) {
        // Get error counts by type and category
        const errorCounts = await this.pool.query(`
      SELECT error_type, error_category, COUNT(*) as count
      FROM audit_pages
      WHERE audit_job_id = $1 AND crawl_status = 'failed' AND error_type IS NOT NULL
      GROUP BY error_type, error_category
    `, [jobId]);
        // Build error summary
        const byType = {};
        const byCategory = {};
        let pagesBlocked = 0;
        let pagesTimeout = 0;
        let pagesServerError = 0;
        for (const row of errorCounts.rows) {
            const count = parseInt(row.count, 10);
            if (row.error_type) {
                byType[row.error_type] = (byType[row.error_type] || 0) + count;
                // Track specific error types for summary columns
                if (['CLOUDFLARE_CHALLENGE', 'CAPTCHA_REQUIRED', 'BOT_DETECTED', 'ACCESS_DENIED', 'RATE_LIMITED'].includes(row.error_type)) {
                    pagesBlocked += count;
                }
                else if (row.error_type === 'TIMEOUT') {
                    pagesTimeout += count;
                }
                else if (row.error_type === 'SERVER_ERROR') {
                    pagesServerError += count;
                }
            }
            if (row.error_category) {
                byCategory[row.error_category] = (byCategory[row.error_category] || 0) + count;
            }
        }
        const errorSummary = { byType, byCategory };
        // Update audit_jobs with error summary
        await this.pool.query(`
      UPDATE audit_jobs SET
        pages_blocked = $2,
        pages_timeout = $3,
        pages_server_error = $4,
        error_summary = $5
      WHERE id = $1
    `, [jobId, pagesBlocked, pagesTimeout, pagesServerError, JSON.stringify(errorSummary)]);
        // Log if there were significant blocking issues
        if (pagesBlocked > 0) {
            console.log(`⚠️  ${pagesBlocked} page(s) blocked by bot detection/rate limiting`);
            await (0, audit_shared_1.addActivityLog)(this.pool, jobId, `${pagesBlocked} page(s) were blocked by security measures`, 'warning');
        }
    }
    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Check if content type is HTML (should be audited)
     */
    isHtmlContentType(contentType) {
        if (!contentType)
            return false;
        const lower = contentType.toLowerCase();
        return lower.includes('text/html') || lower.includes('application/xhtml');
    }
    /**
     * Check all discovered links for broken URLs (4xx/5xx)
     */
    async checkBrokenLinks(jobId) {
        // Get all crawled internal page URLs and their status codes
        const internalPages = await this.pool.query('SELECT url, status_code FROM audit_pages WHERE audit_job_id = $1', [jobId]);
        const internalStatusMap = new Map();
        for (const row of internalPages.rows) {
            internalStatusMap.set(row.url, row.status_code);
        }
        // Collect all URLs that need HEAD-request checking, grouped by source page
        const urlsToCheck = new Map();
        const brokenFindings = [];
        const discoveredLinks = this.discoveredLinksPerJob.get(jobId) || new Map();
        for (const [pageId, pageData] of discoveredLinks) {
            const pageBrokenFindings = [];
            for (const link of pageData.links) {
                if (link.isExternal && !link.isNoFollow) {
                    // Collect external links for batch checking (skip nofollow links)
                    if (!urlsToCheck.has(link.href)) {
                        urlsToCheck.set(link.href, []);
                    }
                    urlsToCheck.get(link.href).push({ sourcePageId: pageId, linkText: link.text, isExternal: true });
                }
                else {
                    // Check internal links against crawled pages
                    const status = internalStatusMap.get(link.href);
                    if (status !== undefined && status !== null && status >= 400) {
                        pageBrokenFindings.push({
                            ruleId: 'broken-link',
                            ruleName: 'Broken Link',
                            category: 'seo',
                            severity: status >= 500 ? 'moderate' : 'serious',
                            message: `Internal link to ${link.href} returns ${status}`,
                            description: `This page contains a link to ${link.href} which returns HTTP ${status}.`,
                            recommendation: 'Fix or remove the broken link, or update it to point to a valid page.',
                            selector: link.href,
                            snippet: link.text || undefined,
                        });
                    }
                    else if (status === undefined) {
                        // Internal link not in audit_pages (not crawled) — needs HEAD check
                        if (!urlsToCheck.has(link.href)) {
                            urlsToCheck.set(link.href, []);
                        }
                        urlsToCheck.get(link.href).push({ sourcePageId: pageId, linkText: link.text, isExternal: false });
                    }
                }
            }
            if (pageBrokenFindings.length > 0) {
                brokenFindings.push({ pageId, findings: pageBrokenFindings });
            }
        }
        // Batch check URLs with HEAD requests
        console.log(`🔗 Checking ${urlsToCheck.size} URLs for broken links...`);
        const checkResults = await this.batchCheckUrls(Array.from(urlsToCheck.keys()));
        // Create findings for broken links
        for (const [url, status] of checkResults) {
            if (status >= 400 || status === -1) {
                const sources = urlsToCheck.get(url) || [];
                for (const source of sources) {
                    const isExternal = source.isExternal;
                    const statusText = status === -1 ? 'timed out / unreachable' : `returns ${status}`;
                    const linkType = isExternal ? 'External' : 'Internal';
                    const finding = {
                        ruleId: isExternal ? 'broken-link-external' : 'broken-link',
                        ruleName: isExternal ? 'Broken External Link' : 'Broken Link',
                        category: 'seo',
                        severity: status === -1 || status >= 500 ? 'moderate' : 'serious',
                        message: `${linkType} link to ${url} ${statusText}`,
                        description: `This page contains a link to ${isExternal ? 'an external' : 'an internal'} URL that ${status === -1 ? 'could not be reached' : `returns HTTP ${status}`}.`,
                        recommendation: isExternal
                            ? 'Verify the external link is correct and the target site is still available. Remove or update broken links.'
                            : 'Fix or remove the broken link, or update it to point to a valid page.',
                        selector: url,
                        snippet: source.linkText || undefined,
                    };
                    const existing = brokenFindings.find(bf => bf.pageId === source.sourcePageId);
                    if (existing) {
                        existing.findings.push(finding);
                    }
                    else {
                        brokenFindings.push({ pageId: source.sourcePageId, findings: [finding] });
                    }
                }
            }
        }
        // Store all broken link findings
        let totalBrokenLinks = 0;
        for (const { pageId, findings } of brokenFindings) {
            await this.auditCoordinator.storeFindings(jobId, pageId, findings);
            totalBrokenLinks += findings.length;
        }
        if (totalBrokenLinks > 0) {
            console.log(`🔗 Found ${totalBrokenLinks} broken links`);
            await (0, audit_shared_1.addActivityLog)(this.pool, jobId, `Found ${totalBrokenLinks} broken link${totalBrokenLinks !== 1 ? 's' : ''}`, 'warning');
        }
        else {
            console.log('🔗 No broken links found');
        }
    }
    /**
     * Batch check URLs with HEAD requests (5 concurrent)
     */
    async batchCheckUrls(urls) {
        const results = new Map();
        const concurrency = 5;
        for (let i = 0; i < urls.length; i += concurrency) {
            const batch = urls.slice(i, i + concurrency);
            const promises = batch.map(async (url) => {
                const status = await this.checkUrlStatus(url);
                results.set(url, status);
            });
            await Promise.all(promises);
        }
        return results;
    }
    /**
     * Check a single URL status via HEAD request (fallback to GET)
     * Returns status code, or -1 for timeout/network errors
     */
    async checkUrlStatus(url) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal,
                redirect: 'follow',
                headers: {
                    'User-Agent': consent_constants_js_1.SCANNER_INFO.USER_AGENT,
                },
            });
            // Some servers reject HEAD requests or return errors — retry with GET
            if (response.status >= 400) {
                clearTimeout(timeout);
                const controller2 = new AbortController();
                const timeout2 = setTimeout(() => controller2.abort(), 5000);
                try {
                    const getResponse = await fetch(url, {
                        method: 'GET',
                        signal: controller2.signal,
                        redirect: 'follow',
                        headers: {
                            'User-Agent': consent_constants_js_1.SCANNER_INFO.USER_AGENT,
                        },
                    });
                    clearTimeout(timeout2);
                    return getResponse.status;
                }
                catch {
                    clearTimeout(timeout2);
                    return -1;
                }
            }
            clearTimeout(timeout);
            return response.status;
        }
        catch {
            clearTimeout(timeout);
            return -1;
        }
    }
    /**
     * Cross-page SEO checks: duplicate titles, duplicate meta descriptions, orphan pages
     */
    async crossPageSeoChecks(jobId) {
        // Find duplicate titles
        const dupTitles = await this.pool.query(`
      SELECT title, COUNT(*) as cnt, array_agg(url) as urls
      FROM audit_pages
      WHERE audit_job_id = $1 AND crawl_status = 'crawled' AND title IS NOT NULL AND title != ''
      GROUP BY title HAVING COUNT(*) > 1
    `, [jobId]);
        const findings = [];
        for (const row of dupTitles.rows) {
            const count = parseInt(row.cnt, 10);
            findings.push({
                ruleId: 'duplicate-title',
                ruleName: 'Duplicate Page Title',
                category: 'seo',
                severity: 'serious',
                message: `"${row.title.substring(0, 80)}" is used on ${count} pages`,
                description: 'Multiple pages share the same title tag, which hurts SEO.',
                recommendation: 'Give each page a unique, descriptive title tag.',
                snippet: row.urls.slice(0, 5).join('\n'),
            });
        }
        // Find duplicate meta descriptions
        const dupDescs = await this.pool.query(`
      SELECT meta_description, COUNT(*) as cnt, array_agg(url) as urls
      FROM audit_pages
      WHERE audit_job_id = $1 AND crawl_status = 'crawled' AND meta_description IS NOT NULL AND meta_description != ''
      GROUP BY meta_description HAVING COUNT(*) > 1
    `, [jobId]);
        for (const row of dupDescs.rows) {
            const count = parseInt(row.cnt, 10);
            findings.push({
                ruleId: 'duplicate-meta-description',
                ruleName: 'Duplicate Meta Description',
                category: 'seo',
                severity: 'moderate',
                message: `Same meta description used on ${count} pages`,
                description: 'Multiple pages share the same meta description.',
                recommendation: 'Write unique meta descriptions for each page.',
                snippet: row.urls.slice(0, 5).join('\n'),
            });
        }
        // Orphan pages: pages with no incoming internal links from other crawled pages
        // Check which crawled pages have no other page linking to them (except the homepage)
        const crawledPages = await this.pool.query(`
      SELECT id, url, depth FROM audit_pages
      WHERE audit_job_id = $1 AND crawl_status = 'crawled' AND depth > 0
    `, [jobId]);
        // Build set of URLs that are linked to from discovered links
        const linkedToUrls = new Set();
        const discoveredLinks = this.discoveredLinksPerJob.get(jobId) || new Map();
        for (const [, pageData] of discoveredLinks) {
            for (const link of pageData.links) {
                if (!link.isExternal) {
                    linkedToUrls.add(link.href);
                }
            }
        }
        for (const page of crawledPages.rows) {
            if (!linkedToUrls.has(page.url)) {
                findings.push({
                    ruleId: 'orphan-page',
                    ruleName: 'Orphan Page',
                    category: 'seo',
                    severity: 'moderate',
                    message: `No internal links point to ${page.url}`,
                    description: 'This page has no incoming internal links from other pages on the site.',
                    recommendation: 'Add internal links from relevant pages to improve discoverability.',
                    selector: page.url,
                });
            }
        }
        // Store cross-page findings (null pageId = site-level)
        if (findings.length > 0) {
            await this.auditCoordinator.storeFindings(jobId, null, findings);
            console.log(`📊 Cross-page SEO: found ${findings.length} issues`);
        }
    }
    /**
     * Clean up remaining items from crawl queue after audit completes (#7)
     */
    async cleanupCrawlQueue(jobId) {
        const result = await this.pool.query('DELETE FROM crawl_queue WHERE audit_job_id = $1', [jobId]);
        if (result.rowCount && result.rowCount > 0) {
            console.log(`🧹 Cleaned up ${result.rowCount} remaining queue items`);
        }
    }
}
exports.AuditWorkerService = AuditWorkerService;
/**
 * Create an audit worker
 */
function createAuditWorker(config) {
    return new AuditWorkerService(config);
}
//# sourceMappingURL=audit-worker.service.js.map