import { Pool } from 'pg';
import type { AuditJob } from '../../types/audit.types';
export interface JobQueueConfig {
    pool: Pool;
    maxRetries?: number;
    staleLockTimeoutMs?: number;
    pollingIntervalMs?: number;
}
/**
 * PostgreSQL-based job queue using SKIP LOCKED for concurrent access
 */
export declare class JobQueueService {
    private pool;
    private workerId;
    private config;
    private isRunning;
    private processingJobIds;
    constructor(config: JobQueueConfig);
    /**
     * Get the worker ID
     */
    getWorkerId(): string;
    /**
     * Check if currently processing any jobs
     */
    isProcessing(): boolean;
    /**
     * Get the currently processing job IDs
     */
    getProcessingJobIds(): Set<string>;
    /**
     * Claim the next available job using SKIP LOCKED
     * This ensures safe concurrent access without conflicts
     */
    claimJob(): Promise<AuditJob | null>;
    /**
     * Mark a job as completed
     */
    completeJob(jobId: string): Promise<void>;
    /**
     * Mark a job as failed
     */
    failJob(jobId: string, errorMessage: string): Promise<void>;
    /**
     * Update job progress
     */
    updateProgress(jobId: string, progress: {
        pagesFound?: number;
        pagesCrawled?: number;
        pagesAudited?: number;
        currentUrl?: string | null;
        totalIssues?: number;
        criticalIssues?: number;
    }): Promise<void>;
    /**
     * Update job scores
     */
    updateScores(jobId: string, scores: {
        seoScore?: number | null;
        accessibilityScore?: number | null;
        securityScore?: number | null;
        performanceScore?: number | null;
        contentScore?: number | null;
        structuredDataScore?: number | null;
    }): Promise<void>;
    /**
     * Recover stale jobs (from crashed workers)
     * Returns the number of jobs recovered
     */
    recoverStaleJobs(): Promise<number>;
    /**
     * Get queue statistics
     */
    getQueueStats(): Promise<{
        pending: number;
        discovering: number;
        ready: number;
        processing: number;
        completed: number;
        failed: number;
    }>;
    /**
     * Get a job by ID
     */
    getJob(jobId: string): Promise<AuditJob | null>;
    /**
     * Cancel a job
     */
    cancelJob(jobId: string): Promise<boolean>;
    /**
     * Start the worker loop
     */
    start(): void;
    /**
     * Stop the worker loop
     */
    stop(): void;
    /**
     * Check if worker should continue running
     */
    shouldContinue(): boolean;
    /**
     * Release current job locks (for graceful shutdown)
     */
    releaseCurrentJob(): Promise<void>;
}
/**
 * Create a job queue service
 */
export declare function createJobQueue(config: JobQueueConfig): JobQueueService;
//# sourceMappingURL=job-queue.service.d.ts.map