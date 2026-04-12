"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobQueueService = void 0;
exports.createJobQueue = createJobQueue;
const os_1 = __importDefault(require("os"));
const DEFAULT_CONFIG = {
    maxRetries: 3,
    staleLockTimeoutMs: 10 * 60 * 1000, // 10 minutes
    pollingIntervalMs: 1000, // 1 second
};
/**
 * PostgreSQL-based job queue using SKIP LOCKED for concurrent access
 */
class JobQueueService {
    pool;
    workerId;
    config;
    isRunning = false;
    processingJobIds = new Set();
    constructor(config) {
        this.pool = config.pool;
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
        };
        // Generate unique worker ID
        this.workerId = `worker-${os_1.default.hostname()}-${process.pid}-${Date.now()}`;
    }
    /**
     * Get the worker ID
     */
    getWorkerId() {
        return this.workerId;
    }
    /**
     * Check if currently processing any jobs
     */
    isProcessing() {
        return this.processingJobIds.size > 0;
    }
    /**
     * Get the currently processing job IDs
     */
    getProcessingJobIds() {
        return this.processingJobIds;
    }
    /**
     * Claim the next available job using SKIP LOCKED
     * This ensures safe concurrent access without conflicts
     */
    async claimJob() {
        const result = await this.pool.query(`
      UPDATE audit_jobs
      SET
        status = 'processing',
        worker_id = $1,
        locked_at = NOW(),
        started_at = COALESCE(started_at, NOW()),
        updated_at = NOW()
      WHERE id = (
        SELECT id FROM audit_jobs
        WHERE status = 'ready'
        ORDER BY max_pages ASC, created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING *
    `, [this.workerId]);
        if (result.rows.length === 0) {
            return null;
        }
        this.processingJobIds.add(result.rows[0].id);
        return result.rows[0];
    }
    /**
     * Mark a job as completed
     */
    async completeJob(jobId) {
        await this.pool.query(`
      UPDATE audit_jobs
      SET
        status = 'completed',
        completed_at = NOW(),
        worker_id = NULL,
        locked_at = NULL,
        current_url = NULL,
        updated_at = NOW()
      WHERE id = $1
    `, [jobId]);
        this.processingJobIds.delete(jobId);
    }
    /**
     * Mark a job as failed
     */
    async failJob(jobId, errorMessage) {
        await this.pool.query(`
      UPDATE audit_jobs
      SET
        status = 'failed',
        completed_at = NOW(),
        error_message = $2,
        worker_id = NULL,
        locked_at = NULL,
        current_url = NULL,
        updated_at = NOW()
      WHERE id = $1
    `, [jobId, errorMessage]);
        this.processingJobIds.delete(jobId);
    }
    /**
     * Update job progress
     */
    async updateProgress(jobId, progress) {
        const updates = ['updated_at = NOW()', 'locked_at = NOW()'];
        const values = [jobId];
        let paramIndex = 2;
        if (progress.pagesFound !== undefined) {
            updates.push(`pages_found = $${paramIndex++}`);
            values.push(progress.pagesFound);
        }
        if (progress.pagesCrawled !== undefined) {
            updates.push(`pages_crawled = $${paramIndex++}`);
            values.push(progress.pagesCrawled);
        }
        if (progress.pagesAudited !== undefined) {
            updates.push(`pages_audited = $${paramIndex++}`);
            values.push(progress.pagesAudited);
        }
        if (progress.currentUrl !== undefined) {
            updates.push(`current_url = $${paramIndex++}`);
            values.push(progress.currentUrl);
        }
        if (progress.totalIssues !== undefined) {
            updates.push(`total_issues = $${paramIndex++}`);
            values.push(progress.totalIssues);
        }
        if (progress.criticalIssues !== undefined) {
            updates.push(`critical_issues = $${paramIndex++}`);
            values.push(progress.criticalIssues);
        }
        await this.pool.query(`
      UPDATE audit_jobs SET ${updates.join(', ')} WHERE id = $1
    `, values);
    }
    /**
     * Update job scores
     */
    async updateScores(jobId, scores) {
        await this.pool.query(`
      UPDATE audit_jobs SET
        seo_score = COALESCE($2, seo_score),
        accessibility_score = COALESCE($3, accessibility_score),
        security_score = COALESCE($4, security_score),
        performance_score = COALESCE($5, performance_score),
        content_score = COALESCE($6, content_score),
        structured_data_score = COALESCE($7, structured_data_score),
        updated_at = NOW()
      WHERE id = $1
    `, [
            jobId,
            scores.seoScore,
            scores.accessibilityScore,
            scores.securityScore,
            scores.performanceScore,
            scores.contentScore,
            scores.structuredDataScore,
        ]);
    }
    /**
     * Recover stale jobs (from crashed workers)
     * Returns the number of jobs recovered
     */
    async recoverStaleJobs() {
        const staleThreshold = new Date(Date.now() - this.config.staleLockTimeoutMs);
        // Recover stale processing jobs back to ready (discovery already done)
        const result = await this.pool.query(`
      UPDATE audit_jobs
      SET
        status = 'ready',
        worker_id = NULL,
        locked_at = NULL,
        retry_count = retry_count + 1,
        updated_at = NOW()
      WHERE
        status = 'processing'
        AND locked_at < $1
        AND retry_count < $2
      RETURNING id
    `, [staleThreshold, this.config.maxRetries]);
        // Mark jobs that exceeded retry count as failed
        await this.pool.query(`
      UPDATE audit_jobs
      SET
        status = 'failed',
        error_message = 'Maximum retry count exceeded',
        worker_id = NULL,
        locked_at = NULL,
        completed_at = NOW(),
        updated_at = NOW()
      WHERE
        status = 'processing'
        AND locked_at < $1
        AND retry_count >= $2
    `, [staleThreshold, this.config.maxRetries]);
        // Also recover stale discovering jobs back to pending
        const discoveryResult = await this.pool.query(`
      UPDATE audit_jobs
      SET
        status = 'pending',
        worker_id = NULL,
        locked_at = NULL,
        updated_at = NOW()
      WHERE
        status = 'discovering'
        AND locked_at < $1
      RETURNING id
    `, [staleThreshold]);
        return (result.rowCount || 0) + (discoveryResult.rowCount || 0);
    }
    /**
     * Get queue statistics
     */
    async getQueueStats() {
        const result = await this.pool.query(`
      SELECT status, COUNT(*) as count
      FROM audit_jobs
      GROUP BY status
    `);
        const stats = {
            pending: 0,
            discovering: 0,
            ready: 0,
            processing: 0,
            completed: 0,
            failed: 0,
        };
        for (const row of result.rows) {
            const count = parseInt(row.count, 10);
            switch (row.status) {
                case 'pending':
                    stats.pending = count;
                    break;
                case 'discovering':
                    stats.discovering = count;
                    break;
                case 'ready':
                    stats.ready = count;
                    break;
                case 'processing':
                    stats.processing = count;
                    break;
                case 'completed':
                    stats.completed = count;
                    break;
                case 'failed':
                    stats.failed = count;
                    break;
            }
        }
        return stats;
    }
    /**
     * Get a job by ID
     */
    async getJob(jobId) {
        const result = await this.pool.query(`
      SELECT * FROM audit_jobs WHERE id = $1
    `, [jobId]);
        return result.rows[0] || null;
    }
    /**
     * Cancel a job
     */
    async cancelJob(jobId) {
        const result = await this.pool.query(`
      UPDATE audit_jobs
      SET
        status = 'cancelled',
        completed_at = NOW(),
        worker_id = NULL,
        locked_at = NULL,
        updated_at = NOW()
      WHERE id = $1 AND status IN ('pending', 'discovering', 'ready', 'processing')
      RETURNING id
    `, [jobId]);
        return (result.rowCount || 0) > 0;
    }
    /**
     * Start the worker loop
     */
    start() {
        this.isRunning = true;
    }
    /**
     * Stop the worker loop
     */
    stop() {
        this.isRunning = false;
    }
    /**
     * Check if worker should continue running
     */
    shouldContinue() {
        return this.isRunning;
    }
    /**
     * Release current job locks (for graceful shutdown)
     */
    async releaseCurrentJob() {
        if (this.processingJobIds.size > 0) {
            // Put processing jobs back to ready (discovery already done, no need to re-run it)
            for (const jobId of this.processingJobIds) {
                await this.pool.query(`
          UPDATE audit_jobs
          SET
            status = 'ready',
            worker_id = NULL,
            locked_at = NULL,
            updated_at = NOW()
          WHERE id = $1 AND worker_id = $2
        `, [jobId, this.workerId]);
            }
            this.processingJobIds.clear();
        }
    }
}
exports.JobQueueService = JobQueueService;
/**
 * Create a job queue service
 */
function createJobQueue(config) {
    return new JobQueueService(config);
}
//# sourceMappingURL=job-queue.service.js.map