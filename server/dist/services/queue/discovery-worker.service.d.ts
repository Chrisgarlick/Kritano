/**
 * Discovery Worker Service
 *
 * Phase 1 of the two-phase audit pipeline.
 * Handles lightweight HTTP-only work: robots.txt, sitemaps, exposed files,
 * Google dorking. No Playwright browser needed.
 *
 * Runs at high concurrency (default 5) since it's just HTTP fetches.
 */
import { Pool } from 'pg';
import type { AuditJob } from '../../types/audit.types';
export interface DiscoveryWorkerConfig {
    pool: Pool;
    pollingIntervalMs?: number;
    maxConcurrent?: number;
    onJobStart?: (job: AuditJob) => void | Promise<void>;
    onJobFail?: (job: AuditJob, error: Error) => void | Promise<void>;
}
export declare class DiscoveryWorkerService {
    private pool;
    private workerId;
    private isRunning;
    private maxConcurrent;
    private pollingIntervalMs;
    private config;
    private activeJobs;
    private auditCoordinator;
    constructor(config: DiscoveryWorkerConfig);
    getWorkerId(): string;
    start(): Promise<void>;
    stop(): Promise<void>;
    /**
     * Claim a pending job and set it to discovering
     */
    private claimJob;
    /**
     * Mark job as ready for the Playwright phase
     */
    private markReady;
    /**
     * Recover stale discovering jobs back to pending
     */
    private recoverStaleJobs;
    private processLoop;
    private processJob;
    private runDiscovery;
    private sleep;
}
export declare function createDiscoveryWorker(config: DiscoveryWorkerConfig): DiscoveryWorkerService;
//# sourceMappingURL=discovery-worker.service.d.ts.map