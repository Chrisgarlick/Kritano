/**
 * CRM Trigger Service
 *
 * Automated behavior triggers that fire when users enter specific states.
 * Triggers are deduplicated: same (user_id, trigger_type) won't fire again
 * within 30 days unless the previous was dismissed.
 */
export type TriggerType = 'stalled_verification' | 'domain_verified' | 'security_alert' | 'upgrade_nudge' | 'low_aeo_score' | 'low_content_score' | 'churn_risk' | 'score_improvement' | 'first_audit_complete' | 'trial_started' | 'trial_expiring' | 'trial_expired';
export type TriggerStatus = 'pending' | 'sent' | 'dismissed' | 'actioned';
export interface CrmTrigger {
    id: string;
    user_id: string;
    trigger_type: TriggerType;
    status: TriggerStatus;
    context: Record<string, unknown>;
    created_at: string;
    actioned_at: string | null;
    actioned_by: string | null;
    user_email?: string;
    user_first_name?: string;
    user_last_name?: string;
    user_lead_score?: number;
    user_lead_status?: string;
}
export interface TriggerFilters {
    status?: TriggerStatus;
    type?: TriggerType;
    userId?: string;
    page?: number;
    limit?: number;
}
export interface TriggerStats {
    total: number;
    pending: number;
    sent: number;
    dismissed: number;
    actioned: number;
    by_type: Record<string, number>;
}
export type TriggerEvent = 'audit_completed' | 'registration' | 'email_verified' | 'domain_verified' | 'member_added' | 'score_recalculated' | 'limit_hit';
/**
 * Check and fire triggers for a user based on an event.
 * This is the main entry point — call after relevant events.
 */
export declare function checkTriggers(userId: string, event: TriggerEvent, context?: Record<string, unknown>): Promise<CrmTrigger[]>;
/**
 * Check for stalled verification triggers.
 * Called by batch job — checks for sites created 48h+ ago with unverified domains.
 */
export declare function checkStalledVerifications(): Promise<CrmTrigger[]>;
/**
 * Fire a trigger with deduplication.
 * Returns null if a duplicate exists within 30 days.
 */
export declare function fireTrigger(userId: string, triggerType: TriggerType, context?: Record<string, unknown>): Promise<CrmTrigger | null>;
/**
 * Get pending triggers with user info.
 */
export declare function getPendingTriggers(filters: TriggerFilters): Promise<{
    triggers: CrmTrigger[];
    total: number;
}>;
/**
 * Action a trigger (mark as sent, dismissed, or actioned).
 */
export declare function actionTrigger(triggerId: string, adminId: string, action: 'sent' | 'dismissed' | 'actioned'): Promise<CrmTrigger | null>;
/**
 * Get trigger stats.
 */
export declare function getTriggerStats(): Promise<TriggerStats>;
//# sourceMappingURL=crm-trigger.service.d.ts.map