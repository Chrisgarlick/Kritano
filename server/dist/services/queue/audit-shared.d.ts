/**
 * Shared utilities for audit workers (discovery + crawl phases).
 *
 * Extracted from AuditWorkerService so both DiscoveryWorkerService and
 * AuditWorkerService can share the same logic without duplication.
 */
import { Pool } from 'pg';
import type { AuditJob } from '../../types/audit.types';
import type { AuditConfig } from '../audit-engines';
/**
 * Add an entry to the activity log (keeps last 50 entries)
 */
export declare function addActivityLog(pool: Pool, jobId: string, message: string, type?: 'info' | 'success' | 'warning' | 'error'): Promise<void>;
/**
 * Add URL to crawl queue (deduplicates by url_hash)
 */
export declare function addToQueue(pool: Pool, jobId: string, url: string, depth: number, discoveredFrom: string | null, priority: number, forRetry?: boolean): Promise<void>;
/**
 * Check if URL should be excluded from crawling (sitemaps, feeds, etc.)
 */
export declare function shouldExcludeUrl(url: string): boolean;
/**
 * Build audit config from job + tier checks
 */
export declare function buildAuditConfig(pool: Pool, job: AuditJob): Promise<AuditConfig>;
//# sourceMappingURL=audit-shared.d.ts.map