/**
 * Trial Worker Service
 *
 * Polls every 5 minutes to check for expiring and expired trials.
 * Sends warning emails 3 days before expiry and downgrades expired trials to free.
 */
import { Pool } from 'pg';
interface TrialWorkerConfig {
    pool: Pool;
}
export declare function createTrialWorker(_config: TrialWorkerConfig): {
    start(): Promise<void>;
    stop(): Promise<void>;
};
export {};
//# sourceMappingURL=trial-worker.service.d.ts.map