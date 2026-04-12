export interface CompetitorProfile {
    id: string;
    organization_id: string;
    domain: string;
    name: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
}
export interface CompetitorProfileWithLatestAudit extends CompetitorProfile {
    latest_audit_id: string | null;
    latest_audit_completed_at: Date | null;
    latest_seo_score: number | null;
    latest_accessibility_score: number | null;
    latest_security_score: number | null;
    latest_performance_score: number | null;
}
export interface AuditComparison {
    id: string;
    organization_id: string;
    name: string | null;
    my_audit_id: string;
    competitor_audit_id: string;
    created_by: string | null;
    created_at: Date;
}
export interface AuditComparisonWithAudits extends AuditComparison {
    my_audit: {
        id: string;
        target_url: string;
        target_domain: string;
        seo_score: number | null;
        accessibility_score: number | null;
        security_score: number | null;
        performance_score: number | null;
        completed_at: Date | null;
    };
    competitor_audit: {
        id: string;
        target_url: string;
        target_domain: string;
        seo_score: number | null;
        accessibility_score: number | null;
        security_score: number | null;
        performance_score: number | null;
        completed_at: Date | null;
    };
}
export interface CategoryScores {
    seo: number | null;
    accessibility: number | null;
    security: number | null;
    performance: number | null;
    overall: number | null;
}
export interface ScoresDiff {
    my: CategoryScores;
    competitor: CategoryScores;
    diff: CategoryScores;
}
export interface FindingSummary {
    rule_id: string;
    rule_name: string;
    category: string;
    severity: string;
    count: number;
}
export interface FindingsDiff {
    onlyInMine: FindingSummary[];
    onlyInCompetitor: FindingSummary[];
    inBoth: FindingSummary[];
}
export interface ComparisonRecommendation {
    category: string;
    gap: number;
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
}
export interface CreateCompetitorInput {
    domain: string;
    name?: string;
    notes?: string;
}
export interface UpdateCompetitorInput {
    name?: string;
    notes?: string;
}
export interface CreateComparisonInput {
    myAuditId: string;
    competitorAuditId: string;
    name?: string;
}
//# sourceMappingURL=competitor.types.d.ts.map