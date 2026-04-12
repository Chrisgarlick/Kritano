/**
 * Cold Prospect Admin Service
 *
 * CRUD operations, stats, and settings management for the cold prospects pipeline.
 */
import { Pool } from 'pg';
import type { ColdProspect, ColdProspectFilters, ColdProspectStats, ColdProspectSettings } from '../../types/cold-prospect.types.js';
export declare function setPool(dbPool: Pool): void;
/**
 * List prospects with filters and pagination
 */
export declare function getProspects(filters: ColdProspectFilters): Promise<{
    prospects: ColdProspect[];
    total: number;
}>;
/**
 * Get a single prospect by ID
 */
export declare function getProspect(id: string): Promise<ColdProspect | null>;
/**
 * Get pipeline statistics
 */
export declare function getStats(): Promise<ColdProspectStats>;
/**
 * Exclude a prospect
 */
export declare function excludeProspect(id: string, reason: string): Promise<void>;
/**
 * Bulk exclude prospects
 */
export declare function bulkExclude(ids: string[], reason: string): Promise<number>;
/**
 * Retry a prospect (reset to pending)
 */
export declare function retryProspect(id: string): Promise<void>;
/**
 * Get pipeline settings
 */
export declare function getPipelineSettings(): Promise<ColdProspectSettings>;
/**
 * Update pipeline settings
 */
export declare function updatePipelineSettings(settings: Partial<ColdProspectSettings>): Promise<void>;
/**
 * Get distinct TLDs for filter dropdown
 */
export declare function getDistinctTlds(): Promise<string[]>;
/**
 * Get daily import stats for chart
 */
export declare function getDailyStats(days?: number): Promise<{
    date: string;
    imported: number;
    qualified: number;
    contacted: number;
}[]>;
//# sourceMappingURL=cold-prospect-admin.service.d.ts.map