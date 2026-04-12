import { Pool } from 'pg';
interface GscSyncWorkerConfig {
    pool: Pool;
}
export declare function createGscSyncWorker(config: GscSyncWorkerConfig): {
    start(): Promise<void>;
    stop(): Promise<void>;
};
export {};
//# sourceMappingURL=gsc-sync-worker.service.d.ts.map