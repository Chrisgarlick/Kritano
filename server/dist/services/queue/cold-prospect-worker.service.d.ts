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
import { Pool } from 'pg';
interface ColdProspectWorkerConfig {
    pool: Pool;
}
export declare function createColdProspectWorker(config: ColdProspectWorkerConfig): {
    start(): Promise<void>;
    stop(): Promise<void>;
};
export {};
//# sourceMappingURL=cold-prospect-worker.service.d.ts.map