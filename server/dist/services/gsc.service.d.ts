import { Pool } from 'pg';
export declare function setPool(p: Pool): void;
export declare function generateGscAuthUrl(siteId: string): {
    url: string;
    state: string;
};
export declare function handleGscCallback(code: string, siteId: string, userId: string): Promise<{
    connectionId: string;
    property: string;
}>;
export declare function getConnection(siteId: string): Promise<any>;
export declare function getConnectionsByUser(userId: string): Promise<any[]>;
export declare function disconnectGsc(siteId: string, userId: string): Promise<boolean>;
export declare function syncQueryData(connectionId: string, startDate: string, endDate: string): Promise<number>;
export interface GscQueryFilters {
    connectionId: string;
    startDate?: string;
    endDate?: string;
    device?: string;
    country?: string;
    search?: string;
    sortBy?: 'clicks' | 'impressions' | 'ctr' | 'position';
    sortDir?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}
export declare function getTopQueries(filters: GscQueryFilters): Promise<{
    queries: any[];
    total: number;
}>;
export declare function getTopPages(filters: GscQueryFilters): Promise<{
    pages: any[];
}>;
export declare function getQueryTrend(connectionId: string, query: string, days?: number): Promise<any[]>;
export declare function getOverviewStats(connectionId: string, days?: number): Promise<any>;
export declare function getOverviewTrend(connectionId: string, days?: number): Promise<any[]>;
export declare function getCtrOpportunities(connectionId: string, days?: number): Promise<any[]>;
export declare function getCannibalisation(connectionId: string, days?: number): Promise<{
    query: string;
    pageCount: number;
    pages: any[];
}[]>;
export declare function getPageKeywords(connectionId: string, pageUrl: string, days?: number): Promise<any[]>;
export declare function cleanupOldData(connectionId: string, retentionDays: number): Promise<number>;
export declare function getAllConnectionsForSync(): Promise<any[]>;
//# sourceMappingURL=gsc.service.d.ts.map