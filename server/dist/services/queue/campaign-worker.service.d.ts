/**
 * Campaign Worker Service
 *
 * Polls for active campaigns, claims queued email_sends, rate-limits delivery,
 * and transitions campaigns to sent when complete.
 */
import { Pool } from 'pg';
interface CampaignWorkerConfig {
    pool: Pool;
    batchSize?: number;
}
export declare function createCampaignWorker(config: CampaignWorkerConfig): {
    start(): Promise<void>;
    stop(): Promise<void>;
};
export {};
//# sourceMappingURL=campaign-worker.service.d.ts.map