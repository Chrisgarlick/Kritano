/**
 * Schedule Poller Service
 *
 * Polls every 60 seconds for due audit schedules and creates audit jobs.
 * Uses FOR UPDATE SKIP LOCKED to prevent duplicate execution across workers.
 * Auto-pauses schedules after 3 consecutive failures.
 */
import { Pool } from 'pg';
interface SchedulePollerConfig {
    pool: Pool;
}
export declare function createSchedulePoller(_config: SchedulePollerConfig): {
    start(): Promise<void>;
    stop(): Promise<void>;
};
export {};
//# sourceMappingURL=schedule-poller.service.d.ts.map