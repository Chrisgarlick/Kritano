/**
 * NRD Feed Service
 *
 * Downloads and parses daily Newly Registered Domain feeds from WhoisDS.
 * Filters by target TLDs and excluded keywords, then bulk imports to DB.
 */
import { Pool } from 'pg';
export declare function setPool(dbPool: Pool): void;
/**
 * Get a setting value from cold_prospect_settings
 */
export declare function getSetting<T>(key: string): Promise<T | null>;
/**
 * Update a setting value
 */
export declare function updateSetting(key: string, value: unknown): Promise<void>;
/**
 * Get all settings as a typed object
 */
export declare function getSettings(): Promise<{
    targetTlds: string[];
    excludedKeywords: string[];
    minQualityScore: number;
    dailyCheckLimit: number;
    dailyEmailLimit: number;
    autoOutreachEnabled: boolean;
    lastFeedDate: string | null;
}>;
/**
 * Download the daily NRD feed from WhoisDS.
 *
 * WhoisDS provides ~70k newly registered domains per day for free.
 * URL requires base64-encoded "{date}.zip" in the path.
 * The zip contains a single `domain-names.txt` file (one domain per line).
 */
export declare function downloadDailyFeed(date: Date): Promise<string>;
/**
 * Extract TLD from a domain name
 */
export declare function extractTld(domain: string): string;
/**
 * Parse the NRD feed CSV and filter by target TLDs
 * Returns array of domain names that pass filters
 */
export declare function parseFeed(filePath: string, targetTlds: string[], excludedKeywords: string[]): Promise<string[]>;
/**
 * Bulk import domains into cold_prospects table
 * Uses ON CONFLICT DO NOTHING to skip duplicates
 */
export declare function importDomains(domains: string[], batchDate: Date, source?: string): Promise<{
    imported: number;
    duplicates: number;
}>;
/**
 * Import domains from a manual CSV upload
 * Expects CSV with at least a "domain" column
 */
export declare function importFromCsv(csvContent: string): Promise<{
    imported: number;
    duplicates: number;
    errors: number;
}>;
/**
 * Clean up old temp files
 */
export declare function cleanupTempFiles(olderThanDays?: number): void;
//# sourceMappingURL=nrd-feed.service.d.ts.map