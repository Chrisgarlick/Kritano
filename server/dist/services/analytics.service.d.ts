import { Pool } from 'pg';
import type { ScoreHistory, IssueTrends, AuditComparison, OrgAnalytics, SiteComparison, ScoreHistoryOptions, IssueTrendOptions, UserOverview, UrlAnalytics, UrlScoreHistoryOptions, UrlComparison, UserAuditedUrl } from '../types/analytics.types.js';
export declare function setPool(dbPool: Pool): void;
export declare function getSiteScoreHistory(options: ScoreHistoryOptions): Promise<ScoreHistory>;
export declare function getIssueTrends(options: IssueTrendOptions): Promise<IssueTrends>;
export declare function compareAudits(auditIds: string[]): Promise<AuditComparison>;
export declare function getOrganizationOverview(organizationId: string): Promise<OrgAnalytics>;
export declare function compareSites(siteIds: string[]): Promise<SiteComparison>;
export declare function getUserOverview(userId: string): Promise<UserOverview>;
export declare function getUrlScoreHistory(options: UrlScoreHistoryOptions): Promise<ScoreHistory>;
export declare function getUrlAnalytics(urlId: string, siteId: string): Promise<UrlAnalytics>;
export declare function getUserAuditedUrls(userId: string, search?: string, limit?: number): Promise<UserAuditedUrl[]>;
export declare function compareUrls(urlSpecs: [{
    siteId: string;
    urlId: string;
}, {
    siteId: string;
    urlId: string;
}]): Promise<UrlComparison>;
export declare function getIssueWaterfall(siteId: string, userId: string): Promise<{
    steps: Array<{
        auditId: string;
        completedAt: string;
        totalIssues: number;
        fixed: number;
        introduced: number;
    }>;
}>;
export declare function getFixVelocity(siteId: string, userId: string): Promise<{
    points: Array<{
        auditId: string;
        completedAt: string;
        cumulativeFixed: number;
        cumulativeNew: number;
        netChange: number;
    }>;
}>;
export declare function getPageHeatmap(siteId: string, auditId: string, userId: string): Promise<{
    pages: Array<{
        pageId: string;
        url: string;
        categories: Record<string, {
            count: number;
            maxSeverity: string;
        }>;
    }>;
}>;
export declare function getResponseTimeDistribution(auditId: string, userId: string): Promise<{
    buckets: Array<{
        range: string;
        count: number;
        min: number;
        max: number;
    }>;
    stats: {
        median: number;
        p75: number;
        p95: number;
        max: number;
        total: number;
    };
}>;
export declare function getPageSizeDistribution(auditId: string, userId: string): Promise<{
    pages: Array<{
        url: string;
        sizeBytes: number;
        overBudget: boolean;
    }>;
    stats: {
        median: number;
        total: number;
        overBudgetCount: number;
    };
    budgetBytes: number;
}>;
//# sourceMappingURL=analytics.service.d.ts.map