/**
 * Domain Checker Service
 *
 * Checks if newly registered domains have live websites.
 * Detects technology stack, SSL, page count, and calculates a quality score.
 * Uses FOR UPDATE SKIP LOCKED for safe concurrent batch processing.
 */
import { Pool } from 'pg';
import type { DomainCheckResult } from '../../types/cold-prospect.types.js';
export declare function setPool(dbPool: Pool): void;
/**
 * Check a single domain for liveness and gather info
 */
export declare function checkDomain(domain: string): Promise<DomainCheckResult>;
/**
 * Calculate quality score for a prospect based on domain check results
 */
export declare function calculateQualityScore(result: DomainCheckResult, tld: string): number;
/**
 * Process a batch of pending domains
 * Uses FOR UPDATE SKIP LOCKED to prevent duplicate processing
 */
export declare function processPendingBatch(batchSize?: number): Promise<number>;
/**
 * Fast DNS pre-filter — kills domains without A/AAAA records.
 * No A record = no website = no point doing slow HTTP checks.
 * DNS lookups are fast and can be heavily parallelised (50 concurrent).
 *
 * Domains WITHOUT A/AAAA records → marked 'dead' immediately
 * Domains WITH A/AAAA records → marked 'checking' for the HTTP check
 */
export declare function processDnsBatch(batchSize?: number): Promise<{
    checked: number;
    killed: number;
    passed: number;
}>;
//# sourceMappingURL=domain-checker.service.d.ts.map