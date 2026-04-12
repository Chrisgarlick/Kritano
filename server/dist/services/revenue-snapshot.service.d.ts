/**
 * Revenue Snapshot Service
 *
 * Takes daily snapshots of MRR/ARR for historical revenue tracking.
 * Uses the same tier pricing as admin-analytics.service.ts.
 */
import { Pool } from 'pg';
export declare function setPool(dbPool: Pool): void;
/**
 * Take a revenue snapshot for today.
 * Uses UPSERT so it's safe to call multiple times on the same day.
 */
export declare function takeSnapshot(): Promise<void>;
/**
 * Get historical revenue snapshots for the last N days.
 */
export declare function getHistory(days: number): Promise<Array<{
    date: string;
    mrr: number;
    arr: number;
    subscribers: number;
}>>;
//# sourceMappingURL=revenue-snapshot.service.d.ts.map