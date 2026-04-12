/**
 * Admin Analytics Service — Phase 6
 *
 * Pure aggregation queries over existing tables.
 * No new tables needed — funnel, global trends, and revenue metrics.
 */
import { Pool } from 'pg';
export declare function initializeAdminAnalyticsService(dbPool: Pool): void;
export interface FunnelStage {
    name: string;
    count: number;
    conversionFromPrevious: number | null;
}
export interface FunnelAnalytics {
    range: string;
    stages: FunnelStage[];
}
export interface TopIssue {
    ruleId: string;
    ruleName: string;
    category: string;
    severity: string;
    affectedAudits: number;
    percentage: number;
}
export interface ScoreDistribution {
    avg: number;
    median: number;
    p10: number;
    p90: number;
}
export interface TierAuditBreakdown {
    audits: number;
    avgScore: number;
}
export interface GlobalTrends {
    range: string;
    totalAuditsCompleted: number;
    totalPagesScanned: number;
    topIssues: TopIssue[];
    scoreDistribution: Record<string, ScoreDistribution>;
    tierBreakdown: Record<string, TierAuditBreakdown>;
}
export interface TierRevenue {
    count: number;
    mrr: number;
}
export interface ChurnNewMetrics {
    count: number;
    mrrLost?: number;
    mrrGained?: number;
}
export interface RevenueAnalytics {
    mrr: number;
    arr: number;
    byTier: Record<string, TierRevenue>;
    churnThisMonth: ChurnNewMetrics;
    newThisMonth: ChurnNewMetrics;
}
export declare function getFunnelAnalytics(range?: string): Promise<FunnelAnalytics>;
export declare function getGlobalTrends(range?: string): Promise<GlobalTrends>;
export declare function getRevenueAnalytics(): Promise<RevenueAnalytics>;
//# sourceMappingURL=admin-analytics.service.d.ts.map