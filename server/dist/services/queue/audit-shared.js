"use strict";
/**
 * Shared utilities for audit workers (discovery + crawl phases).
 *
 * Extracted from AuditWorkerService so both DiscoveryWorkerService and
 * AuditWorkerService can share the same logic without duplication.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addActivityLog = addActivityLog;
exports.addToQueue = addToQueue;
exports.shouldExcludeUrl = shouldExcludeUrl;
exports.buildAuditConfig = buildAuditConfig;
const url_normalizer_service_1 = require("../spider/url-normalizer.service");
/**
 * Add an entry to the activity log (keeps last 50 entries)
 */
async function addActivityLog(pool, jobId, message, type = 'info') {
    const entry = {
        timestamp: new Date().toISOString(),
        message,
        type,
    };
    await pool.query(`
    UPDATE audit_jobs
    SET activity_log = (
      SELECT jsonb_agg(elem)
      FROM (
        SELECT elem
        FROM jsonb_array_elements(COALESCE(activity_log, '[]'::jsonb) || $2::jsonb) AS elem
        ORDER BY elem->>'timestamp' DESC
        LIMIT 50
      ) sub
    )
    WHERE id = $1
  `, [jobId, JSON.stringify([entry])]);
}
/**
 * Add URL to crawl queue (deduplicates by url_hash)
 */
async function addToQueue(pool, jobId, url, depth, discoveredFrom, priority, forRetry = false) {
    const urlNormalizer = (0, url_normalizer_service_1.createUrlNormalizer)(url, false);
    const normalized = urlNormalizer.normalize(url);
    const normalizedUrl = normalized.normalizedUrl || url;
    const urlHash = urlNormalizer.hashUrl(normalizedUrl);
    if (!forRetry) {
        const existingPage = await pool.query(`
      SELECT id FROM audit_pages WHERE audit_job_id = $1 AND url_hash = $2 LIMIT 1
    `, [jobId, urlHash]);
        if (existingPage.rows.length > 0) {
            return;
        }
    }
    const result = await pool.query(`
    INSERT INTO crawl_queue (audit_job_id, url, url_hash, depth, discovered_from, priority)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (audit_job_id, url_hash) DO NOTHING
    RETURNING id
  `, [jobId, normalizedUrl, urlHash, depth, discoveredFrom, priority]);
    if (result.rowCount && result.rowCount > 0) {
        await pool.query(`
      UPDATE audit_jobs SET pages_found = pages_found + 1 WHERE id = $1
    `, [jobId]);
    }
}
/**
 * Check if URL should be excluded from crawling (sitemaps, feeds, etc.)
 */
function shouldExcludeUrl(url) {
    const pathname = new URL(url).pathname.toLowerCase();
    const excludedPatterns = [
        '/sitemap.xml',
        '/sitemap_index.xml',
        '/sitemap-index.xml',
        '/robots.txt',
        '/feed',
        '/feed/',
        '/rss',
        '/rss/',
        '/atom.xml',
        '/feed.xml',
    ];
    return excludedPatterns.some(pattern => pathname === pattern || pathname.endsWith(pattern));
}
/**
 * Build audit config from job + tier checks
 */
async function buildAuditConfig(pool, job) {
    let checkEeat = false;
    let checkAeo = false;
    let checkFileExtraction = false;
    try {
        const tierCheck = await pool.query(`SELECT tl.available_checks FROM tier_limits tl
       JOIN (
         SELECT COALESCE(
           (SELECT s.tier FROM subscriptions s WHERE s.user_id = sites.owner_id AND s.status = 'active' ORDER BY s.created_at DESC LIMIT 1),
           (SELECT s.tier FROM subscriptions s JOIN organizations o ON o.id = s.organization_id WHERE o.owner_id = sites.owner_id AND s.status = 'active' ORDER BY s.created_at DESC LIMIT 1),
           (SELECT s.tier FROM subscriptions s JOIN organization_members om ON om.organization_id = s.organization_id WHERE om.user_id = sites.owner_id AND s.status = 'active' ORDER BY s.created_at DESC LIMIT 1),
           'free'
         ) as tier
         FROM sites WHERE sites.id = $1
       ) ut ON tl.tier = ut.tier::subscription_tier`, [job.site_id]);
        const availableChecks = tierCheck.rows[0]?.available_checks || [];
        checkEeat = availableChecks.includes('eeat');
        checkAeo = availableChecks.includes('aeo');
        checkFileExtraction = job.check_file_extraction && availableChecks.includes('file-extraction');
    }
    catch {
        // Default to disabled if tier check fails
    }
    return {
        checkSeo: job.check_seo,
        checkAccessibility: job.check_accessibility,
        checkSecurity: job.check_security,
        checkPerformance: job.check_performance,
        checkContent: job.check_content ?? true,
        checkStructuredData: job.check_structured_data ?? true,
        checkEeat,
        checkAeo,
        wcagVersion: job.wcag_version,
        wcagLevel: job.wcag_level,
    };
}
//# sourceMappingURL=audit-shared.js.map