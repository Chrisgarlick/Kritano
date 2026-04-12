/**
 * Lead Scoring Service
 *
 * Calculates lead scores and statuses for the CRM module.
 * Scores are recalculated on relevant events (idempotent).
 * Status is derived from score + behavior, not set manually.
 */
export type LeadStatus = 'new' | 'activated' | 'engaged' | 'power_user' | 'upgrade_prospect' | 'churning' | 'churned';
export interface LeadProfile {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    lead_score: number;
    lead_status: LeadStatus;
    lead_score_updated_at: string | null;
    email_verified: boolean;
    last_login_at: string | null;
    created_at: string;
    tier: string;
    total_audits: number;
    completed_audits: number;
    total_sites: number;
    verified_domains: number;
    team_members: number;
    has_exported_pdf: boolean;
}
export interface LeadBoardFilters {
    status?: LeadStatus;
    search?: string;
    sort?: 'lead_score' | 'created_at' | 'last_login_at';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
export interface LeadBoardResult {
    leads: LeadProfile[];
    total: number;
}
export interface LeadStats {
    total: number;
    by_status: Record<LeadStatus, number>;
    avg_score: number;
}
export interface LeadTimeline {
    event: string;
    detail: string;
    timestamp: string;
}
export interface LeadMembership {
    site_id: string;
    site_name: string;
    site_domain: string;
    role: string;
    tier: string;
    verified: boolean;
    last_audit_at: string | null;
    audit_count: number;
}
/**
 * Recalculate lead score for a single user.
 * Idempotent — checks current state, not event count.
 */
export declare function recalculateScore(userId: string): Promise<{
    score: number;
    status: LeadStatus;
}>;
/**
 * Get paginated lead board for admin CRM view.
 */
export declare function getLeadBoard(filters: LeadBoardFilters): Promise<LeadBoardResult>;
/**
 * Get detailed lead profile for CRM view.
 */
export declare function getLeadProfile(userId: string): Promise<LeadProfile | null>;
/**
 * Get timeline events for a lead.
 */
export declare function getLeadTimeline(userId: string): Promise<LeadTimeline[]>;
/**
 * Get memberships (sites + role) for a lead.
 */
export declare function getLeadMemberships(userId: string): Promise<LeadMembership[]>;
/**
 * Get lead funnel stats by status.
 */
export declare function getLeadStats(): Promise<LeadStats>;
/**
 * Batch recalculate scores for all users.
 * Used for nightly jobs and initial backfill.
 */
export declare function batchRecalculate(): Promise<{
    processed: number;
    errors: number;
}>;
//# sourceMappingURL=lead-scoring.service.d.ts.map