/**
 * PagePulser Worker Process
 *
 * This is a standalone process that processes audit jobs from the queue.
 * Run with: npm run worker
 */

import { Pool } from 'pg';
import http from 'http';
import * as Sentry from '@sentry/node';
import { createAuditWorker } from './services/queue';
import { createDiscoveryWorker } from './services/queue/discovery-worker.service.js';
import { createCampaignWorker } from './services/queue/campaign-worker.service.js';
import { createTrialWorker } from './services/queue/trial-worker.service.js';
import { createSchedulePoller } from './services/queue/schedule-poller.service.js';
// Cold prospect worker is NOT started here — run separately via `npm run prospects`
import { setPool as setScheduleServicePool } from './services/schedule.service.js';
import { emailService } from './services/email.service';
import { auditService } from './services/audit.service';
import { setPool as setDomainVerificationPool } from './services/domain-verification.service.js';
import { recalculateScore } from './services/lead-scoring.service.js';
import { checkTriggers, checkStalledVerifications } from './services/crm-trigger.service.js';
import { checkAndQualifyReferral, setPool as setReferralServicePool } from './services/referral.service.js';
import { setPool as setSystemSettingsPool } from './services/system-settings.service.js';

import { getMemoryUsage, getMemoryThreshold } from './services/queue/memory-monitor';
import dotenv from 'dotenv';
dotenv.config();

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
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: WORKER_POOL_SIZE,
});


// Initialize services that need the pool
setDomainVerificationPool(pool);
setScheduleServicePool(pool);
setReferralServicePool(pool);
setSystemSettingsPool(pool);

// Helper to send notification email
async function sendAuditNotification(jobId: string, status: 'completed' | 'failed'): Promise<void> {
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

    if (result.rows.length === 0) return;

    const row = result.rows[0];
    await emailService.sendAuditCompletedEmail(row.email, row.first_name, {
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
  } catch (err) {
    console.error(`📧 Failed to send notification for audit ${jobId}:`, err);
  }
}

// Create campaign worker
const campaignWorker = createCampaignWorker({ pool });

// Create trial worker
const trialWorker = createTrialWorker({ pool });

// Create schedule poller
const schedulePoller = createSchedulePoller({ pool });

// Create discovery worker (Phase 1: lightweight HTTP-only discovery)
const discoveryWorker = createDiscoveryWorker({
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
let stalledVerificationTimer: ReturnType<typeof setTimeout> | null = null;
let stalledVerificationRunning = false;

async function pollStalledVerifications(): Promise<void> {
  if (!stalledVerificationRunning) return;
  try {
    const fired = await checkStalledVerifications();
    if (fired.length > 0) {
      console.log(`🔔 Stalled verification triggers: ${fired.length} fired`);
    }
  } catch (err) {
    console.error('Stalled verification poll error:', err);
  }
  if (stalledVerificationRunning) {
    stalledVerificationTimer = setTimeout(pollStalledVerifications, STALLED_VERIFICATION_MS);
  }
}

function startStalledVerificationPoller(): void {
  stalledVerificationRunning = true;
  console.log('🔔 Stalled verification poller started (every 6 hours)');
  // Run first check after 2 minutes (let other workers settle)
  stalledVerificationTimer = setTimeout(pollStalledVerifications, 2 * 60 * 1000);
}

function stopStalledVerificationPoller(): void {
  stalledVerificationRunning = false;
  if (stalledVerificationTimer) {
    clearTimeout(stalledVerificationTimer);
    stalledVerificationTimer = null;
  }
}

// Create worker
const worker = createAuditWorker({
  pool,
  pollingIntervalMs: WORKER_POLLING_MS,
  maxConcurrentJobs: WORKER_MAX_CONCURRENT_JOBS,
  onJobStart: async (job) => {
    console.log(`🔄 Started audit: ${job.target_url} (${job.id})`);
    await auditService.logAuditStarted(job.id, job.target_url, worker.getWorkerId());
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
    await auditService.logAuditCompleted(job.id, job.target_url, {
      pagesAudited: final.pages_audited || 0,
      totalIssues: final.total_issues || 0,
      criticalIssues: final.critical_issues || 0,
    });

    // Send email notification (#63)
    await sendAuditNotification(job.id, 'completed');

    // CRM: Recalculate lead score + check triggers after audit completion
    try {
      const scoreResult = await recalculateScore(job.user_id);
      await checkTriggers(job.user_id, 'audit_completed', {
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
        await checkTriggers(job.user_id, 'score_recalculated', {
          status: scoreResult.status,
          score: scoreResult.score,
        });
      }
    } catch (crmErr) {
      console.error(`CRM processing failed for audit ${job.id}:`, crmErr);
    }

    // Check if referral can qualify (audit now completed)
    checkAndQualifyReferral(job.user_id).catch(err =>
      console.error(`Referral qualification check failed for user ${job.user_id}:`, err)
    );
  },
  onJobFail: async (job, error) => {
    // Update health stats
    jobsFailed++;
    lastJobTime = new Date();

    console.error(`❌ Failed audit: ${job.target_url} (${job.id})`);
    console.error(`   Error: ${error.message}`);

    // Log audit failure
    await auditService.logAuditFailed(job.id, job.target_url, error.message);

    // Send email notification (#63)
    await sendAuditNotification(job.id, 'failed');
  },
});

// Health check endpoint (S12: Worker health monitoring)
const BASE_HEALTH_PORT = parseInt(process.env.WORKER_HEALTH_PORT || '3001', 10);
const MAX_PORT_ATTEMPTS = 10;
const startTime = Date.now();
let jobsProcessed = 0;
let jobsFailed = 0;
let lastJobTime: Date | null = null;

// Health request handler (extracted for port retry logic)
const healthRequestHandler: http.RequestListener = async (req, res) => {
  if (req.url === '/health') {
    // Basic health check - just confirms worker is running
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', uptime: Date.now() - startTime }));
  } else if (req.url === '/status') {
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

      const mem = getMemoryUsage();
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
          threshold: getMemoryThreshold(),
          effectiveConcurrency: worker.getEffectiveConcurrency(),
        },
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', error: 'Database query failed' }));
    }
  } else if (req.url === '/restart' && req.method === 'POST') {
    // Graceful restart — shut down so process manager (PM2/Docker/systemd) restarts us
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'restarting' }));
    console.log('🔄 Restart requested via admin panel');
    // Delay slightly to ensure response is sent
    setTimeout(() => shutdown('RESTART'), 500);
  } else if (req.url === '/ready') {
    // Readiness check for k8s-style orchestrators
    const isDbConnected = pool.totalCount > 0;
    if (isDbConnected) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ready' }));
    } else {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'not ready', reason: 'Database not connected' }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
};

// Try to find an available port for health endpoint
const startHealthServer = (port: number, attempt: number = 1): void => {
  if (attempt > MAX_PORT_ATTEMPTS) {
    console.error(`❌ Failed to start health server: all ports ${BASE_HEALTH_PORT}-${BASE_HEALTH_PORT + MAX_PORT_ATTEMPTS - 1} in use`);
    return;
  }

  const server = http.createServer(healthRequestHandler);

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${port} in use, trying ${port + 1}...`);
      startHealthServer(port + 1, attempt + 1);
    } else {
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
let healthServerRef: http.Server | null = null;

const shutdown = async (signal: string) => {
  console.log(`\n📥 Received ${signal}, shutting down gracefully...`);
  if (healthServerRef) {
    healthServerRef.close();
    healthServerRef = null;
  }
  stopStalledVerificationPoller();
  await Promise.all([discoveryWorker.stop(), worker.stop(), campaignWorker.stop(), trialWorker.stop(), schedulePoller.stop()]);
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
  await Promise.all([discoveryWorker.stop(), worker.stop(), campaignWorker.stop(), trialWorker.stop(), schedulePoller.stop()]);
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
  await Promise.all([discoveryWorker.stop(), worker.stop(), campaignWorker.stop(), trialWorker.stop(), schedulePoller.stop()]);
  await pool.end();
  process.exit(1);
});

// Start worker
console.log('🛡️  PagePulser Worker');
console.log('   Version: 1.0.0');
console.log('   Database: ' + DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
console.log('   Max concurrent audits: ' + WORKER_MAX_CONCURRENT_JOBS);
console.log('   Max concurrent discovery: ' + DISCOVERY_MAX_CONCURRENT);
console.log('');

startStalledVerificationPoller();
Promise.all([discoveryWorker.start(), worker.start(), campaignWorker.start(), trialWorker.start(), schedulePoller.start()]).catch(async (error) => {
  console.error('💥 Failed to start workers:', error);
  await pool.end();
  process.exit(1);
});
