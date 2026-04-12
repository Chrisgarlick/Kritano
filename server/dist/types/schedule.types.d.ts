/**
 * Scheduled Audits — Type Definitions
 */
export type ScheduleFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
export interface AuditSchedule {
    id: string;
    user_id: string;
    site_id: string | null;
    organization_id: string | null;
    name: string | null;
    target_url: string;
    target_domain: string;
    config: Record<string, unknown>;
    frequency: ScheduleFrequency;
    cron_expression: string;
    next_run_at: string | null;
    last_run_at: string | null;
    last_status: string | null;
    last_audit_id: string | null;
    enabled: boolean;
    run_count: number;
    failure_count: number;
    consecutive_failures: number;
    max_consecutive_failures: number;
    paused_reason: string | null;
    paused_at: string | null;
    notify_on_completion: boolean;
    notify_on_failure: boolean;
    timezone: string;
    created_at: string;
    updated_at: string;
}
export interface AuditScheduleWithSite extends AuditSchedule {
    site_name?: string;
    site_verified?: boolean;
}
export interface CreateScheduleInput {
    targetUrl: string;
    name?: string;
    frequency: ScheduleFrequency;
    cronExpression?: string;
    config?: Record<string, unknown>;
    notifyOnCompletion?: boolean;
    notifyOnFailure?: boolean;
    timezone?: string;
    dayOfWeek?: number;
    hourOfDay?: number;
}
export interface UpdateScheduleInput {
    name?: string;
    frequency?: ScheduleFrequency;
    cronExpression?: string;
    config?: Record<string, unknown>;
    notifyOnCompletion?: boolean;
    notifyOnFailure?: boolean;
    timezone?: string;
    dayOfWeek?: number;
    hourOfDay?: number;
}
export interface ScheduleRunSummary {
    id: string;
    status: string;
    target_url: string;
    created_at: string;
    completed_at: string | null;
    seo_score: number | null;
    accessibility_score: number | null;
    security_score: number | null;
    performance_score: number | null;
    total_issues: number | null;
}
//# sourceMappingURL=schedule.types.d.ts.map