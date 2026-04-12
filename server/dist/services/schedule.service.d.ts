/**
 * Schedule Service — Business logic for scheduled audits
 */
import { Pool } from 'pg';
import type { AuditSchedule, AuditScheduleWithSite, CreateScheduleInput, UpdateScheduleInput, ScheduleFrequency, ScheduleRunSummary } from '../types/schedule.types.js';
export declare function setPool(dbPool: Pool): void;
/**
 * Convert a frequency preset + optional day/hour into a cron expression.
 */
export declare function frequencyToCron(frequency: ScheduleFrequency, dayOfWeek?: number, // Monday
hourOfDay?: number): string;
/**
 * Get the next occurrence from a cron expression using croner.
 */
export declare function getNextCronOccurrence(cronExpression: string, timezone?: string): Date | null;
/**
 * Validate a cron expression.
 */
export declare function isValidCron(cronExpression: string): boolean;
/**
 * Validate that the user's tier allows scheduling and the requested frequency.
 */
export declare function validateScheduleTier(userId: string, frequency: ScheduleFrequency, cronExpression?: string): Promise<{
    allowed: boolean;
    reason?: string;
    tier?: string;
}>;
export declare function createSchedule(userId: string, input: CreateScheduleInput): Promise<AuditSchedule>;
export declare function updateSchedule(userId: string, scheduleId: string, input: UpdateScheduleInput): Promise<AuditSchedule>;
export declare function deleteSchedule(userId: string, scheduleId: string): Promise<void>;
export declare function getScheduleById(userId: string, scheduleId: string): Promise<AuditScheduleWithSite | null>;
export declare function getSchedulesByUser(userId: string, siteId?: string): Promise<AuditScheduleWithSite[]>;
export declare function toggleSchedule(userId: string, scheduleId: string, enabled: boolean): Promise<AuditSchedule>;
export declare function getScheduleRunHistory(scheduleId: string, userId: string, limit?: number, offset?: number): Promise<{
    runs: ScheduleRunSummary[];
    total: number;
}>;
/**
 * Get schedules that are due to run. Uses FOR UPDATE SKIP LOCKED
 * to prevent duplicate execution across multiple workers.
 */
export declare function getDueSchedules(limit?: number): Promise<AuditSchedule[]>;
/**
 * Create an audit job from a schedule. Mirrors the main audit creation logic
 * with tier re-validation and config clamping.
 */
export declare function createAuditFromSchedule(schedule: AuditSchedule): Promise<{
    auditId: string;
} | {
    skipped: true;
    reason: string;
}>;
/**
 * Update schedule state after a run.
 */
export declare function markScheduleRun(scheduleId: string, status: 'completed' | 'failed', auditId: string | null, nextRunAt: Date | null): Promise<void>;
/**
 * Auto-pause a schedule (e.g., after too many consecutive failures).
 */
export declare function pauseSchedule(scheduleId: string, reason: string): Promise<void>;
export declare function getAdminSchedulesList(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<{
    schedules: any[];
    total: number;
}>;
export declare function getAdminScheduleStats(): Promise<{
    total: number;
    active: number;
    paused: number;
    disabled: number;
    ranToday: number;
}>;
export declare function adminGetScheduleById(scheduleId: string): Promise<any | null>;
export declare function adminUpdateSchedule(scheduleId: string, updates: {
    enabled?: boolean;
    paused_reason?: string | null;
    max_consecutive_failures?: number;
}): Promise<any>;
export declare function adminDeleteSchedule(scheduleId: string): Promise<void>;
//# sourceMappingURL=schedule.service.d.ts.map