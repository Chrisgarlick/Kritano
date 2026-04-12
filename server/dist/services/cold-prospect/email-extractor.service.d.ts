/**
 * Email Extractor Service
 *
 * Extracts contact emails and person names from live websites.
 * Checks mailto links, contact/about pages, structured data, and common patterns.
 * Uses FOR UPDATE SKIP LOCKED for safe concurrent batch processing.
 */
import { Pool } from 'pg';
import type { EmailExtractionResult } from '../../types/cold-prospect.types.js';
export declare function setPool(dbPool: Pool): void;
/**
 * Extract all contact information from a domain
 */
export declare function extractEmails(domain: string, hasSsl?: boolean): Promise<EmailExtractionResult>;
/**
 * Process a batch of live domains for email extraction
 * Uses FOR UPDATE SKIP LOCKED to prevent duplicate processing
 */
export declare function processLiveBatch(batchSize?: number): Promise<number>;
//# sourceMappingURL=email-extractor.service.d.ts.map