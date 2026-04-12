"use strict";
/**
 * Kritano Worker Process
 *
 * This is a standalone process that processes audit jobs from the queue.
 * Run with: npm run worker
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const http_1 = __importDefault(require("http"));
const Sentry = __importStar(require("@sentry/node"));
const queue_1 = require("./services/queue");
const discovery_worker_service_js_1 = require("./services/queue/discovery-worker.service.js");
const campaign_worker_service_js_1 = require("./services/queue/campaign-worker.service.js");
const trial_worker_service_js_1 = require("./services/queue/trial-worker.service.js");
const schedule_poller_service_js_1 = require("./services/queue/schedule-poller.service.js");
const gdpr_worker_service_js_1 = require("./services/queue/gdpr-worker.service.js");
const gsc_sync_worker_service_js_1 = require("./services/queue/gsc-sync-worker.service.js");
// Cold prospect worker is NOT started here — run separately via `npm run prospects`
const schedule_service_js_1 = require("./services/schedule.service.js");
const email_service_1 = require("./services/email.service");
const audit_service_1 = require("./services/audit.service");
const domain_verification_service_js_1 = require("./services/domain-verification.service.js");
const site_service_js_1 = require("./services/site.service.js");
const lead_scoring_service_js_1 = require("./services/lead-scoring.service.js");
const crm_trigger_service_js_1 = require("./services/crm-trigger.service.js");
const referral_service_js_1 = require("./services/referral.service.js");
const system_settings_service_js_1 = require("./services/system-settings.service.js");
const revenue_snapshot_service_js_1 = require("./services/revenue-snapshot.service.js");
const event_tracking_service_js_1 = require("./services/event-tracking.service.js");
const memory_monitor_1 = require("./services/queue/memory-monitor");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Initialize Sentry (#68)
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
    console.log('🔍 Sentry error tracking enabled (worker)');
}
// Configurable via environment variables (#67 Worker scaling)
// Require DATABASE_URL - no hardcoded credentials
if (!process.env.DATABASE_URL) {
    console.error('FATAL: DATABASE_URL environment variable is required');
    process.exit(1);
}
const DATABASE_URL = process.env.DATABASE_URL;
const WORKER_POOL_SIZE = parseInt(process.env.WORKER_POOL_SIZE || '5', 10);
const WORKER_POLLING_MS = parseInt(process.env.WORKER_POLLING_MS || '2000', 10);
const WORKER_MAX_CONCURRENT_JOBS = parseInt(process.env.WORKER_MAX_CONCURRENT_JOBS || '1', 10);
const DISCOVERY_MAX_CONCURRENT = parseInt(process.env.DISCOVERY_MAX_CONCURRENT || '5', 10);
// Create database pool (primary — for audits and critical workers)
const pool = new pg_1.Pool({
    connectionString: DATABASE_URL,
    max: WORKER_POOL_SIZE,
});
// Initialize services that need the pool
(0, domain_verification_service_js_1.setPool)(pool);
(0, site_service_js_1.setPool)(pool);
(0, schedule_service_js_1.setPool)(pool);
(0, referral_service_js_1.setPool)(pool);
(0, system_settings_service_js_1.setPool)(pool);
(0, revenue_snapshot_service_js_1.setPool)(pool);
(0, event_tracking_service_js_1.setPool)(pool);
// Helper to send notification email
async function sendAuditNotification(jobId, status) {
    try {
        // Get audit details with user info
        const result = await pool.query(`
      SELECT j.id, j.target_url, j.target_domain, j.status, j.user_id,
             j.total_issues, j.critical_issues,
             j.seo_score, j.accessibility_score, j.security_score, j.performance_score,
             j.content_score, j.structured_data_score,
             u.email, u.first_name
      FROM audit_jobs j
      JOIN users u ON j.user_id = u.id
      WHERE j.id = $1
    `, [jobId]);
        if (result.rows.length === 0)
            return;
        const row = result.rows[0];
        await email_service_1.emailService.sendAuditCompletedEmail(row.email, row.first_name, {
            id: row.id,
            target_url: row.target_url,
            target_domain: row.target_domain,
            status,
            total_issues: row.total_issues || 0,
            critical_issues: row.critical_issues || 0,
            seo_score: row.seo_score,
            accessibility_score: row.accessibility_score,
            security_score: row.security_score,
            performance_score: row.performance_score,
            content_score: row.content_score,
            structured_data_score: row.structured_data_score,
        }, row.user_id);
        console.log(`📧 Notification sent for audit ${jobId}`);
    }
    catch (err) {
        console.error(`📧 Failed to send notification for audit ${jobId}:`, err);
    }
}
// Create campaign worker
const campaignWorker = (0, campaign_worker_service_js_1.createCampaignWorker)({ pool });
// Create trial worker
const trialWorker = (0, trial_worker_service_js_1.createTrialWorker)({ pool });
// Create schedule poller
const schedulePoller = (0, schedule_poller_service_js_1.createSchedulePoller)({ pool });
// Create GDPR worker (data exports and retention cleanup)
const gdprWorker = (0, gdpr_worker_service_js_1.createGdprWorker)({ pool });
// Create GSC sync worker (Search Console data sync)
const gscSyncWorker = (0, gsc_sync_worker_service_js_1.createGscSyncWorker)({ pool });
// Create discovery worker (Phase 1: lightweight HTTP-only discovery)
const discoveryWorker = (0, discovery_worker_service_js_1.createDiscoveryWorker)({
    pool,
    pollingIntervalMs: WORKER_POLLING_MS,
    maxConcurrent: DISCOVERY_MAX_CONCURRENT,
    onJobStart: async (job) => {
        console.log(`🔍 Discovery started: ${job.target_url} (${job.id})`);
    },
    onJobFail: async (job, error) => {
        console.error(`❌ Discovery failed: ${job.target_url} (${job.id}) - ${error.message}`);
        await sendAuditNotification(job.id, 'failed');
    },
});
// Stalled verification polling (every 6 hours)
const STALLED_VERIFICATION_MS = 6 * 60 * 60 * 1000;
let stalledVerificationTimer = null;
let stalledVerificationRunning = false;
async function pollStalledVerifications() {
    if (!stalledVerificationRunning)
        return;
    try {
        const fired = await (0, crm_trigger_service_js_1.checkStalledVerifications)();
        if (fired.length > 0) {
            console.log(`🔔 Stalled verification triggers: ${fired.length} fired`);
        }
    }
    catch (err) {
        console.error('Stalled verification poll error:', err);
    }
    if (stalledVerificationRunning) {
        stalledVerificationTimer = setTimeout(pollStalledVerifications, STALLED_VERIFICATION_MS);
    }
}
function startStalledVerificationPoller() {
    stalledVerificationRunning = true;
    console.log('🔔 Stalled verification poller started (every 6 hours)');
    // Run first check after 2 minutes (let other workers settle)
    stalledVerificationTimer = setTimeout(pollStalledVerifications, 2 * 60 * 1000);
}
function stopStalledVerificationPoller() {
    stalledVerificationRunning = false;
    if (stalledVerificationTimer) {
        clearTimeout(stalledVerificationTimer);
        stalledVerificationTimer = null;
    }
}
// Daily revenue snapshot (every 24 hours)
const REVENUE_SNAPSHOT_MS = 24 * 60 * 60 * 1000;
let revenueSnapshotTimer = null;
let revenueSnapshotRunning = false;
async function pollRevenueSnapshot() {
    if (!revenueSnapshotRunning)
        return;
    try {
        await (0, revenue_snapshot_service_js_1.takeSnapshot)();
        console.log('📊 Daily revenue snapshot taken');
    }
    catch (err) {
        console.error('Revenue snapshot error:', err);
    }
    if (revenueSnapshotRunning) {
        revenueSnapshotTimer = setTimeout(pollRevenueSnapshot, REVENUE_SNAPSHOT_MS);
    }
}
function startRevenueSnapshotPoller() {
    revenueSnapshotRunning = true;
    console.log('📊 Revenue snapshot poller started (every 24 hours)');
    // Take first snapshot after 1 minute (let DB settle)
    revenueSnapshotTimer = setTimeout(pollRevenueSnapshot, 60 * 1000);
}
function stopRevenueSnapshotPoller() {
    revenueSnapshotRunning = false;
    if (revenueSnapshotTimer) {
        clearTimeout(revenueSnapshotTimer);
        revenueSnapshotTimer = null;
    }
}
// Create worker
const worker = (0, queue_1.createAuditWorker)({
    pool,
    pollingIntervalMs: WORKER_POLLING_MS,
    maxConcurrentJobs: WORKER_MAX_CONCURRENT_JOBS,
    onJobStart: async (job) => {
        console.log(`🔄 Started audit: ${job.target_url} (${job.id})`);
        await audit_service_1.auditService.logAuditStarted(job.id, job.target_url, worker.getWorkerId());
    },
    onJobComplete: async (job) => {
        // Update health stats
        jobsProcessed++;
        lastJobTime = new Date();
        // Fetch final stats
        const result = await pool.query(`
      SELECT pages_found, pages_crawled, pages_audited, total_issues, critical_issues,
             seo_score, accessibility_score, security_score, performance_score
      FROM audit_jobs WHERE id = $1
    `, [job.id]);
        const final = result.rows[0];
        console.log(`✅ Completed audit: ${job.target_url} (${job.id})`);
        console.log(`   Pages: ${final.pages_crawled}/${final.pages_found} crawled, ${final.pages_audited} audited`);
        console.log(`   Issues: ${final.total_issues} (${final.critical_issues} critical)`);
        console.log(`   Scores: SEO=${final.seo_score}, A11y=${final.accessibility_score}, Sec=${final.security_score}, Perf=${final.performance_score}`);
        // Log audit completion
        await audit_service_1.auditService.logAuditCompleted(job.id, job.target_url, {
            pagesAudited: final.pages_audited || 0,
            totalIssues: final.total_issues || 0,
            criticalIssues: final.critical_issues || 0,
        });
        // Send email notification (#63)
        await sendAuditNotification(job.id, 'completed');
        // CRM: Recalculate lead score + check triggers after audit completion
        try {
            const scoreResult = await (0, lead_scoring_service_js_1.recalculateScore)(job.user_id);
            await (0, crm_trigger_service_js_1.checkTriggers)(job.user_id, 'audit_completed', {
                auditId: job.id,
                domain: job.target_domain,
                seoScore: final.seo_score,
                accessibilityScore: final.accessibility_score,
                securityScore: final.security_score,
                performanceScore: final.performance_score,
                contentScore: final.content_score,
                aeoScore: final.aeo_score,
            });
            // Check for churn risk after score update
            if (scoreResult.status === 'churning') {
                await (0, crm_trigger_service_js_1.checkTriggers)(job.user_id, 'score_recalculated', {
                    status: scoreResult.status,
                    score: scoreResult.score,
                });
            }
        }
        catch (crmErr) {
            console.error(`CRM processing failed for audit ${job.id}:`, crmErr);
        }
        // Check if referral can qualify (audit now completed)
        (0, referral_service_js_1.checkAndQualifyReferral)(job.user_id).catch(err => console.error(`Referral qualification check failed for user ${job.user_id}:`, err));
    },
    onJobFail: async (job, error) => {
        // Update health stats
        jobsFailed++;
        lastJobTime = new Date();
        console.error(`❌ Failed audit: ${job.target_url} (${job.id})`);
        console.error(`   Error: ${error.message}`);
        // Log audit failure
        await audit_service_1.auditService.logAuditFailed(job.id, job.target_url, error.message);
        // Send email notification (#63)
        await sendAuditNotification(job.id, 'failed');
    },
});
// Health check endpoint (S12: Worker health monitoring)
const BASE_HEALTH_PORT = parseInt(process.env.WORKER_HEALTH_PORT || '3002', 10);
const MAX_PORT_ATTEMPTS = 10;
const startTime = Date.now();
let jobsProcessed = 0;
let jobsFailed = 0;
let lastJobTime = null;
// Health request handler (extracted for port retry logic)
const healthRequestHandler = async (req, res) => {
    if (req.url === '/health') {
        // Basic health check - just confirms worker is running
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', uptime: Date.now() - startTime }));
    }
    else if (req.url === '/status') {
        // Detailed status for monitoring dashboards
        try {
            const queueResult = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'discovering') as discovering,
          COUNT(*) FILTER (WHERE status = 'ready') as ready,
          COUNT(*) FILTER (WHERE status = 'processing') as processing,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'failed') as failed
        FROM audit_jobs
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `);
            const stats = queueResult.rows[0];
            const mem = (0, memory_monitor_1.getMemoryUsage)();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'healthy',
                uptime: Date.now() - startTime,
                workerId: worker.getWorkerId(),
                isProcessing: worker.isProcessing(),
                stats: {
                    jobsProcessed,
                    jobsFailed,
                    lastJobTime: lastJobTime?.toISOString() || null,
                },
                queue24h: {
                    pending: parseInt(stats.pending, 10),
                    discovering: parseInt(stats.discovering, 10),
                    ready: parseInt(stats.ready, 10),
                    processing: parseInt(stats.processing, 10),
                    completed: parseInt(stats.completed, 10),
                    failed: parseInt(stats.failed, 10),
                },
                memory: {
                    usedPercent: mem.usedPercent,
                    freeMB: mem.freeMB,
                    totalMB: mem.totalMB,
                    threshold: (0, memory_monitor_1.getMemoryThreshold)(),
                    effectiveConcurrency: worker.getEffectiveConcurrency(),
                },
            }));
        }
        catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', error: 'Database query failed' }));
        }
    }
    else if (req.url === '/restart' && req.method === 'POST') {
        // Graceful restart — shut down so process manager (PM2/Docker/systemd) restarts us
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'restarting' }));
        console.log('🔄 Restart requested via admin panel');
        // Delay slightly to ensure response is sent
        setTimeout(() => shutdown('RESTART'), 500);
    }
    else if (req.url === '/ready') {
        // Readiness check for k8s-style orchestrators
        const isDbConnected = pool.totalCount > 0;
        if (isDbConnected) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ready' }));
        }
        else {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'not ready', reason: 'Database not connected' }));
        }
    }
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
};
// Try to find an available port for health endpoint
const startHealthServer = (port, attempt = 1) => {
    if (attempt > MAX_PORT_ATTEMPTS) {
        console.error(`❌ Failed to start health server: all ports ${BASE_HEALTH_PORT}-${BASE_HEALTH_PORT + MAX_PORT_ATTEMPTS - 1} in use`);
        return;
    }
    const server = http_1.default.createServer(healthRequestHandler);
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️  Port ${port} in use, trying ${port + 1}...`);
            startHealthServer(port + 1, attempt + 1);
        }
        else {
            console.error(`❌ Health server error:`, err);
        }
    });
    server.listen(port, () => {
        console.log(`🏥 Health endpoint listening on port ${port}`);
        healthServerRef = server;
    });
};
startHealthServer(BASE_HEALTH_PORT);
// Graceful shutdown handlers
let healthServerRef = null;
const shutdown = async (signal) => {
    console.log(`\n📥 Received ${signal}, shutting down gracefully...`);
    if (healthServerRef) {
        healthServerRef.close();
        healthServerRef = null;
    }
    stopStalledVerificationPoller();
    stopRevenueSnapshotPoller();
    await Promise.all([discoveryWorker.stop(), worker.stop(), campaignWorker.stop(), trialWorker.stop(), schedulePoller.stop(), gdprWorker.stop(), gscSyncWorker.stop()]);
    await pool.end();
    process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
// Handle uncaught errors
process.on('uncaughtException', async (error) => {
    console.error('💥 Uncaught exception:', error);
    if (process.env.SENTRY_DSN) {
        Sentry.captureException(error);
        await Sentry.flush(2000);
    }
    stopStalledVerificationPoller();
    stopRevenueSnapshotPoller();
    await Promise.all([discoveryWorker.stop(), worker.stop(), campaignWorker.stop(), trialWorker.stop(), schedulePoller.stop(), gdprWorker.stop(), gscSyncWorker.stop()]);
    await pool.end();
    process.exit(1);
});
process.on('unhandledRejection', async (reason) => {
    console.error('💥 Unhandled rejection:', reason);
    if (process.env.SENTRY_DSN) {
        Sentry.captureException(reason);
        await Sentry.flush(2000);
    }
    stopStalledVerificationPoller();
    stopRevenueSnapshotPoller();
    await Promise.all([discoveryWorker.stop(), worker.stop(), campaignWorker.stop(), trialWorker.stop(), schedulePoller.stop(), gdprWorker.stop(), gscSyncWorker.stop()]);
    await pool.end();
    process.exit(1);
});
// Start worker
console.log('🛡️  Kritano Worker');
console.log('   Version: 1.0.0');
console.log('   Database: ' + DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
console.log('   Max concurrent audits: ' + WORKER_MAX_CONCURRENT_JOBS);
console.log('   Max concurrent discovery: ' + DISCOVERY_MAX_CONCURRENT);
console.log('');
startStalledVerificationPoller();
startRevenueSnapshotPoller();
Promise.all([discoveryWorker.start(), worker.start(), campaignWorker.start(), trialWorker.start(), schedulePoller.start(), gdprWorker.start(), gscSyncWorker.start()]).catch(async (error) => {
    console.error('💥 Failed to start workers:', error);
    await pool.end();
    process.exit(1);
});
//# sourceMappingURL=worker.js.map