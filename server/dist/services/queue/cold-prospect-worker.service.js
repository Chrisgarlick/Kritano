"use strict";
/**
 * Cold Prospect Worker Service
 *
 * Orchestrates the cold prospect pipeline:
 * - Downloads daily NRD feeds
 * - Checks domains for live websites
 * - Extracts contact emails and names
 *
 * Runs inside the main worker.ts process.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createColdProspectWorker = createColdProspectWorker;
const nrd_feed_service_js_1 = require("../cold-prospect/nrd-feed.service.js");
const domain_checker_service_js_1 = require("../cold-prospect/domain-checker.service.js");
const email_extractor_service_js_1 = require("../cold-prospect/email-extractor.service.js");
const cold_prospect_admin_service_js_1 = require("../cold-prospect/cold-prospect-admin.service.js");
const outreach_service_js_1 = require("../cold-prospect/outreach.service.js");
const system_settings_service_js_1 = require("../system-settings.service.js");
// Polling intervals
const NRD_FEED_CHECK_MS = 60 * 60 * 1000; // Check for new feed every hour
const MX_CHECK_MS = 2 * 60 * 1000; // MX filter every 2 minutes (fast)
const DOMAIN_CHECK_MS = 5 * 60 * 1000; // Check domains every 5 minutes
const EMAIL_EXTRACT_MS = 5 * 60 * 1000; // Extract emails every 5 minutes
const OUTREACH_MS = 10 * 60 * 1000; // Outreach every 10 minutes
const RETENTION_CLEANUP_MS = 24 * 60 * 60 * 1000; // Data retention cleanup every 24 hours
function createColdProspectWorker(config) {
    const { pool } = config;
    let running = false;
    let feedTimer = null;
    let mxTimer = null;
    let domainTimer = null;
    let emailTimer = null;
    let outreachTimer = null;
    let retentionTimer = null;
    // Initialize all service pools
    (0, nrd_feed_service_js_1.setPool)(pool);
    (0, domain_checker_service_js_1.setPool)(pool);
    (0, email_extractor_service_js_1.setPool)(pool);
    (0, cold_prospect_admin_service_js_1.setPool)(pool);
    (0, outreach_service_js_1.setPool)(pool);
    /**
     * Check if today's NRD feed is available and import it
     */
    async function pollNrdFeed() {
        if (!running)
            return;
        try {
            const settings = await (0, nrd_feed_service_js_1.getSettings)();
            const today = new Date().toISOString().split('T')[0];
            // Skip if already imported today
            if (settings.lastFeedDate === today) {
                scheduleFeedPoll();
                return;
            }
            // Try to download yesterday's feed (published ~04:00 UTC for previous day)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            try {
                const csvPath = await (0, nrd_feed_service_js_1.downloadDailyFeed)(yesterday);
                const domains = await (0, nrd_feed_service_js_1.parseFeed)(csvPath, settings.targetTlds, settings.excludedKeywords);
                if (domains.length > 0) {
                    // Apply daily check limit
                    const limitedDomains = domains.slice(0, settings.dailyCheckLimit);
                    const result = await (0, nrd_feed_service_js_1.importDomains)(limitedDomains, yesterday);
                    console.log(`🎯 NRD import: ${result.imported} new, ${result.duplicates} duplicates (of ${domains.length} total)`);
                    await (0, nrd_feed_service_js_1.updateSetting)('last_feed_date', today);
                }
                // Clean up old temp files
                (0, nrd_feed_service_js_1.cleanupTempFiles)(7);
            }
            catch (feedErr) {
                // Feed might not be available yet, will retry next hour
                console.log(`🎯 NRD feed not available yet, will retry later`);
            }
        }
        catch (err) {
            console.error('🎯 NRD feed poll error:', err);
        }
        scheduleFeedPoll();
    }
    function scheduleFeedPoll() {
        if (running) {
            feedTimer = setTimeout(pollNrdFeed, NRD_FEED_CHECK_MS);
        }
    }
    /**
     * Fast DNS pre-filter — kills domains without A/AAAA records before slow HTTP checks
     */
    async function pollDnsFilter() {
        if (!running)
            return;
        try {
            const result = await (0, domain_checker_service_js_1.processDnsBatch)(500);
            if (result.checked > 0) {
                console.log(`🎯 DNS filter: ${result.checked} checked, ${result.killed} killed, ${result.passed} passed`);
            }
        }
        catch (err) {
            console.error('🎯 DNS filter poll error:', err);
        }
        if (running) {
            mxTimer = setTimeout(pollDnsFilter, MX_CHECK_MS);
        }
    }
    /**
     * Process pending domains for liveness checks
     */
    async function pollDomainChecker() {
        if (!running)
            return;
        try {
            const settings = await (0, nrd_feed_service_js_1.getSettings)();
            const processed = await (0, domain_checker_service_js_1.processPendingBatch)(Math.min(50, settings.dailyCheckLimit));
            if (processed > 0) {
                console.log(`🎯 Domain check: ${processed} domains processed`);
            }
        }
        catch (err) {
            console.error('🎯 Domain checker poll error:', err);
        }
        if (running) {
            domainTimer = setTimeout(pollDomainChecker, DOMAIN_CHECK_MS);
        }
    }
    /**
     * Process live domains for email extraction
     */
    async function pollEmailExtractor() {
        if (!running)
            return;
        try {
            const processed = await (0, email_extractor_service_js_1.processLiveBatch)(20);
            if (processed > 0) {
                console.log(`📧 Email extraction: ${processed} domains processed`);
            }
        }
        catch (err) {
            console.error('📧 Email extractor poll error:', err);
        }
        if (running) {
            emailTimer = setTimeout(pollEmailExtractor, EMAIL_EXTRACT_MS);
        }
    }
    /**
     * Process cold prospect outreach emails
     */
    async function pollOutreach() {
        if (!running)
            return;
        try {
            // Check if outreach is enabled
            const enabled = await (0, system_settings_service_js_1.getSetting)('trigger_auto_send_cold_outreach');
            if (enabled !== true && enabled !== 'true') {
                if (running) {
                    outreachTimer = setTimeout(pollOutreach, OUTREACH_MS);
                }
                return;
            }
            // Queue new outreach emails
            const queued = await (0, outreach_service_js_1.queueOutreachBatch)();
            if (queued.queued > 0) {
                console.log(`📨 Cold outreach: ${queued.queued} emails queued`);
            }
            // Process the queue
            const result = await (0, outreach_service_js_1.processOutreachQueue)(10);
            if (result.sent > 0 || result.failed > 0) {
                console.log(`📨 Cold outreach: ${result.sent} sent, ${result.failed} failed`);
            }
        }
        catch (err) {
            console.error('📨 Cold outreach poll error:', err);
        }
        if (running) {
            outreachTimer = setTimeout(pollOutreach, OUTREACH_MS);
        }
    }
    /**
     * LIA compliance: Purge cold prospects with no engagement after 6 months
     */
    async function pollRetentionCleanup() {
        if (!running)
            return;
        try {
            const result = await (0, outreach_service_js_1.purgeStaleProspects)();
            if (result.deleted > 0) {
                console.log(`🗑️ Cold prospect retention cleanup: ${result.deleted} stale prospects deleted`);
            }
        }
        catch (err) {
            console.error('🗑️ Retention cleanup error:', err);
        }
        if (running) {
            retentionTimer = setTimeout(pollRetentionCleanup, RETENTION_CLEANUP_MS);
        }
    }
    return {
        async start() {
            running = true;
            console.log('🎯 Cold prospect worker started');
            console.log('   NRD feed check: every 1 hour');
            console.log('   DNS filter: every 2 minutes');
            console.log('   Domain checker: every 5 minutes');
            console.log('   Email extractor: every 5 minutes');
            console.log('   Outreach: every 10 minutes');
            console.log('   Retention cleanup: every 24 hours');
            // Stagger start times
            pollNrdFeed();
            setTimeout(pollDnsFilter, 15 * 1000); // Start 15s after
            setTimeout(pollDomainChecker, 30 * 1000); // Start 30s after
            setTimeout(pollEmailExtractor, 60 * 1000); // Start 60s after
            setTimeout(pollOutreach, 90 * 1000); // Start 90s after
            setTimeout(pollRetentionCleanup, 120 * 1000); // Start 2min after
        },
        async stop() {
            running = false;
            if (feedTimer) {
                clearTimeout(feedTimer);
                feedTimer = null;
            }
            if (mxTimer) {
                clearTimeout(mxTimer);
                mxTimer = null;
            }
            if (domainTimer) {
                clearTimeout(domainTimer);
                domainTimer = null;
            }
            if (emailTimer) {
                clearTimeout(emailTimer);
                emailTimer = null;
            }
            if (outreachTimer) {
                clearTimeout(outreachTimer);
                outreachTimer = null;
            }
            if (retentionTimer) {
                clearTimeout(retentionTimer);
                retentionTimer = null;
            }
            console.log('🎯 Cold prospect worker stopped');
        },
    };
}
//# sourceMappingURL=cold-prospect-worker.service.js.map