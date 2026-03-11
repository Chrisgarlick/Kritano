/**
 * PagePulser Worker Process
 *
 * This is a standalone process that processes audit jobs from the queue.
 * Run with: npm run worker
 */

import { Pool } from 'pg';
import http from 'http';
import { createAuditWorker } from './services/queue';
import { emailService } from './services/email.service';
import { auditService } from './services/audit.service';
import { getMemoryUsage, getMemoryThreshold } from './services/queue/memory-monitor';
import dotenv from 'dotenv';
dotenv.config();

// Require DATABASE_URL - no hardcoded credentials
if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is required');
  process.exit(1);
}
const DATABASE_URL = process.env.DATABASE_URL;
const WORKER_POOL_SIZE = parseInt(process.env.WORKER_POOL_SIZE || '5', 10);
const WORKER_POLLING_MS = parseInt(process.env.WORKER_POLLING_MS || '2000', 10);
const WORKER_MAX_CONCURRENT_JOBS = parseInt(process.env.WORKER_MAX_CONCURRENT_JOBS || '1', 10);

// Create database pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: WORKER_POOL_SIZE,
});

// Helper to send notification email
async function sendAuditNotification(jobId: string, status: 'completed' | 'failed'): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT j.id, j.target_url, j.target_domain, j.status, j.user_id,
             j.total_issues, j.critical_issues,
             j.seo_score, j.accessibility_score, j.security_score, j.performance_score,
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
    }, row.user_id);
    console.log(`Notification sent for audit ${jobId}`);
  } catch (err) {
    console.error(`Failed to send notification for audit ${jobId}:`, err);
  }
}

// Create worker
const worker = createAuditWorker({
  pool,
  pollingIntervalMs: WORKER_POLLING_MS,
  maxConcurrentJobs: WORKER_MAX_CONCURRENT_JOBS,
  onJobStart: async (job) => {
    console.log(`Started audit: ${job.target_url} (${job.id})`);
    await auditService.logAuditStarted(job.id, job.target_url, worker.getWorkerId());
  },
  onJobComplete: async (job) => {
    jobsProcessed++;
    lastJobTime = new Date();

    const result = await pool.query(`
      SELECT pages_found, pages_crawled, pages_audited, total_issues, critical_issues,
             seo_score, accessibility_score, security_score, performance_score
      FROM audit_jobs WHERE id = $1
    `, [job.id]);
    const final = result.rows[0];

    console.log(`Completed audit: ${job.target_url} (${job.id})`);
    console.log(`   Pages: ${final.pages_crawled}/${final.pages_found} crawled, ${final.pages_audited} audited`);
    console.log(`   Issues: ${final.total_issues} (${final.critical_issues} critical)`);
    console.log(`   Scores: SEO=${final.seo_score}, A11y=${final.accessibility_score}, Sec=${final.security_score}, Perf=${final.performance_score}`);

    await auditService.logAuditCompleted(job.id, job.target_url, {
      pagesAudited: final.pages_audited || 0,
      totalIssues: final.total_issues || 0,
      criticalIssues: final.critical_issues || 0,
    });

    await sendAuditNotification(job.id, 'completed');
  },
  onJobFail: async (job, error) => {
    jobsFailed++;
    lastJobTime = new Date();

    console.error(`Failed audit: ${job.target_url} (${job.id})`);
    console.error(`   Error: ${error.message}`);

    await auditService.logAuditFailed(job.id, job.target_url, error.message);
    await sendAuditNotification(job.id, 'failed');
  },
});

// Health check endpoint
const BASE_HEALTH_PORT = parseInt(process.env.WORKER_HEALTH_PORT || '3002', 10);
const MAX_PORT_ATTEMPTS = 10;
const startTime = Date.now();
let jobsProcessed = 0;
let jobsFailed = 0;
let lastJobTime: Date | null = null;

const healthRequestHandler: http.RequestListener = async (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', uptime: Date.now() - startTime }));
  } else if (req.url === '/status') {
    try {
      const queueResult = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
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
        stats: { jobsProcessed, jobsFailed, lastJobTime: lastJobTime?.toISOString() || null },
        queue24h: {
          pending: parseInt(stats.pending, 10),
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
    } catch {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', error: 'Database query failed' }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
};

let healthServerRef: http.Server | null = null;

const startHealthServer = (port: number, attempt: number = 1): void => {
  if (attempt > MAX_PORT_ATTEMPTS) {
    console.error(`Failed to start health server: all ports ${BASE_HEALTH_PORT}-${BASE_HEALTH_PORT + MAX_PORT_ATTEMPTS - 1} in use`);
    return;
  }
  const server = http.createServer(healthRequestHandler);
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      startHealthServer(port + 1, attempt + 1);
    } else {
      console.error(`Health server error:`, err);
    }
  });
  server.listen(port, () => {
    console.log(`Health endpoint listening on port ${port}`);
    healthServerRef = server;
  });
};

startHealthServer(BASE_HEALTH_PORT);

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  if (healthServerRef) {
    healthServerRef.close();
    healthServerRef = null;
  }
  await worker.stop();
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  await worker.stop();
  await pool.end();
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  console.error('Unhandled rejection:', reason);
  await worker.stop();
  await pool.end();
  process.exit(1);
});

// Start worker
console.log('PagePulser Worker');
console.log('   Version: 1.0.0');
console.log('   Database: ' + DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
console.log('   Max concurrent audits: ' + WORKER_MAX_CONCURRENT_JOBS);
console.log('');

worker.start().catch(async (error) => {
  console.error('Failed to start worker:', error);
  await pool.end();
  process.exit(1);
});
