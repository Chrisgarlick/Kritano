import { Pool } from 'pg';
import type { Site, SiteWithStats, ScoreHistoryEntry, CreateSiteInput, UpdateSiteInput, SiteUrl, GetUrlsOptions, UserSiteAccess } from '../types/site.types.js';
export declare function setPool(dbPool: Pool): void;
/**
 * Create a new site owned by a user
 */
export declare function createSite(userId: string, input: CreateSiteInput): Promise<Site>;
/**
 * Get all sites accessible by a user (owned + shared)
 * Uses COALESCE(owner_id, created_by) for backward compatibility
 */
export declare function getUserSites(userId: string): Promise<UserSiteAccess[]>;
/**
 * Get a single site by ID
 */
export declare function getSiteById(siteId: string): Promise<Site | null>;
/**
 * Get a single site with stats
 */
export declare function getSiteWithStats(siteId: string): Promise<SiteWithStats | null>;
/**
 * Update a site
 */
export declare function updateSite(siteId: string, input: UpdateSiteInput): Promise<Site>;
/**
 * Delete a site
 */
export declare function deleteSite(siteId: string): Promise<void>;
/**
 * Get user's subscription tier limits.
 * Pure user-centric: only checks the user's own subscription row.
 */
export declare function getUserTierLimits(userId: string): Promise<Record<string, unknown> | null>;
/**
 * Get tier limits based on the site owner's subscription.
 * Resolves the owner via COALESCE(owner_id, created_by) for backward compatibility.
 */
export declare function getSiteOwnerTierLimits(siteId: string): Promise<Record<string, unknown> | null>;
/**
 * Transfer site ownership to a new user.
 * - Validates the current owner matches
 * - Checks the new owner's site limit
 * - Updates sites.owner_id
 * - Removes any site_share for the new owner (they're now owner)
 * - Creates an admin-level site_share for the old owner
 */
export declare function transferSiteOwnership(siteId: string, currentOwnerId: string, newOwnerId: string): Promise<Site>;
/**
 * Check if user can add more sites
 */
export declare function checkUserSiteLimit(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    used: number;
    max: number | null;
}>;
/**
 * Get site usage for a user
 */
export declare function getUserSiteUsage(userId: string): Promise<{
    sites: number;
    maxSites: number | null;
    canAddMore: boolean;
}>;
/**
 * Get audits for a site
 */
export declare function getSiteAudits(siteId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
}): Promise<{
    audits: unknown[];
    total: number;
}>;
/**
 * Get score history for a site
 */
export declare function getSiteScoreHistory(siteId: string, limit?: number): Promise<ScoreHistoryEntry[]>;
/**
 * Get URLs for a site with search and pagination
 */
export declare function getSiteUrls(siteId: string, options?: GetUrlsOptions): Promise<{
    urls: SiteUrl[];
    total: number;
}>;
/**
 * Get a single URL by ID
 */
export declare function getUrlById(urlId: string): Promise<SiteUrl | null>;
/**
 * Get a URL by site and path
 */
export declare function getUrlBySiteAndUrl(siteId: string, url: string): Promise<SiteUrl | null>;
/**
 * Create or get a URL for a site
 */
export declare function findOrCreateUrl(siteId: string, url: string, source?: 'sitemap' | 'audit' | 'manual'): Promise<SiteUrl>;
/**
 * Add a URL manually
 */
export declare function addUrl(siteId: string, url: string): Promise<SiteUrl>;
/**
 * Get audits for a specific URL
 */
export declare function getUrlAudits(urlId: string, options?: {
    limit?: number;
    offset?: number;
}): Promise<{
    audits: unknown[];
    total: number;
}>;
/**
 * Count URLs for a site
 */
export declare function getUrlCount(siteId: string): Promise<number>;
/**
 * Bulk upsert URLs from sitemap
 */
export declare function upsertUrlsFromSitemap(siteId: string, urls: Array<{
    url: string;
    priority?: number;
    changefreq?: string;
}>): Promise<number>;
/**
 * Discover and store pages from sitemap
 */
export declare function discoverSitemapUrls(siteId: string, domain: string): Promise<{
    urlsDiscovered: number;
    errors: string[];
}>;
/**
 * Find a site by domain for a user (owned or shared with edit access)
 * Uses COALESCE(owner_id, created_by) for backward compatibility
 */
export declare function findSiteByDomainForUser(userId: string, domain: string): Promise<Site | null>;
/**
 * Find or create a site for a domain
 */
export declare function findOrCreateSiteForDomain(userId: string, domain: string): Promise<Site>;
/**
 * Generate a verification token for a site
 * Returns existing token if one exists (unless regenerate is true)
 */
export declare function generateVerificationToken(siteId: string, regenerate?: boolean): Promise<string>;
/**
 * Check if site is verified
 */
export declare function isSiteVerified(siteId: string): Promise<boolean>;
/**
 * Mark site as verified and send notification email + CRM trigger.
 */
export declare function markSiteVerified(siteId: string, method: 'dns' | 'file'): Promise<void>;
/**
 * Increment verification attempt count
 */
export declare function incrementVerificationAttempt(siteId: string): Promise<void>;
export { getUserSites as getSites };
export { getUserSiteUsage as getSiteUsage };
export type KnownPage = SiteUrl;
export { getSiteUrls as getKnownPages };
export { getUrlCount as getKnownPagesCount };
export { upsertUrlsFromSitemap as upsertKnownPages };
export { discoverSitemapUrls as discoverSitemapPages };
/**
 * Record pages that were audited
 */
export declare function recordAuditedPages(siteId: string, auditId: string, urls: string[]): Promise<void>;
//# sourceMappingURL=site.service.d.ts.map