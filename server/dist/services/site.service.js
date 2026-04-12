"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPool = setPool;
exports.createSite = createSite;
exports.getUserSites = getUserSites;
exports.getSites = getUserSites;
exports.getSiteById = getSiteById;
exports.getSiteWithStats = getSiteWithStats;
exports.updateSite = updateSite;
exports.deleteSite = deleteSite;
exports.getUserTierLimits = getUserTierLimits;
exports.getSiteOwnerTierLimits = getSiteOwnerTierLimits;
exports.transferSiteOwnership = transferSiteOwnership;
exports.checkUserSiteLimit = checkUserSiteLimit;
exports.getUserSiteUsage = getUserSiteUsage;
exports.getSiteUsage = getUserSiteUsage;
exports.getSiteAudits = getSiteAudits;
exports.getSiteScoreHistory = getSiteScoreHistory;
exports.getSiteUrls = getSiteUrls;
exports.getKnownPages = getSiteUrls;
exports.getUrlById = getUrlById;
exports.getUrlBySiteAndUrl = getUrlBySiteAndUrl;
exports.findOrCreateUrl = findOrCreateUrl;
exports.addUrl = addUrl;
exports.getUrlAudits = getUrlAudits;
exports.getUrlCount = getUrlCount;
exports.getKnownPagesCount = getUrlCount;
exports.upsertUrlsFromSitemap = upsertUrlsFromSitemap;
exports.upsertKnownPages = upsertUrlsFromSitemap;
exports.discoverSitemapUrls = discoverSitemapUrls;
exports.discoverSitemapPages = discoverSitemapUrls;
exports.findSiteByDomainForUser = findSiteByDomainForUser;
exports.findOrCreateSiteForDomain = findOrCreateSiteForDomain;
exports.generateVerificationToken = generateVerificationToken;
exports.isSiteVerified = isSiteVerified;
exports.markSiteVerified = markSiteVerified;
exports.incrementVerificationAttempt = incrementVerificationAttempt;
exports.recordAuditedPages = recordAuditedPages;
let pool;
function setPool(dbPool) {
    pool = dbPool;
}
// =============================================
// SITE CRUD (User-centric)
// =============================================
/**
 * Create a new site owned by a user
 */
async function createSite(userId, input) {
    // Normalize domain
    const domain = normalizeDomain(input.domain);
    // Check site limit for user
    const canAdd = await checkUserSiteLimit(userId);
    if (!canAdd.allowed) {
        throw new Error(canAdd.reason || 'Site limit reached');
    }
    // Check if domain already exists for this user
    const existing = await pool.query('SELECT id FROM sites WHERE owner_id = $1 AND domain = $2', [userId, domain]);
    if (existing.rows.length > 0) {
        throw new Error('A site with this domain already exists');
    }
    const result = await pool.query(`INSERT INTO sites (owner_id, name, domain, description, created_by)
     VALUES ($1, $2, $3, $4, $1)
     RETURNING *`, [userId, input.name, domain, input.description || null]);
    return result.rows[0];
}
/**
 * Get all sites accessible by a user (owned + shared)
 * Uses COALESCE(owner_id, created_by) for backward compatibility
 */
async function getUserSites(userId) {
    // Use COALESCE for backward compatibility with both owner_id and created_by
    const ownedResult = await pool.query(`SELECT
      s.*,
      COUNT(DISTINCT aj.id)::text as total_audits,
      MAX(aj.completed_at) as last_audit_at,
      (
        SELECT seo_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_seo_score,
      (
        SELECT accessibility_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_accessibility_score,
      (
        SELECT security_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_security_score,
      (
        SELECT performance_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_performance_score,
      COUNT(DISTINCT su.id)::text as url_count,
      COALESCE(
        (SELECT sub.tier FROM subscriptions sub WHERE sub.user_id = COALESCE(s.owner_id, s.created_by) AND sub.status IN ('active', 'trialing') ORDER BY sub.created_at DESC LIMIT 1),
        'free'
      ) as owner_tier
     FROM sites s
     LEFT JOIN audit_jobs aj ON aj.site_id = s.id
     LEFT JOIN site_urls su ON su.site_id = s.id
     WHERE COALESCE(s.owner_id, s.created_by) = $1
     GROUP BY s.id
     ORDER BY s.created_at DESC`, [userId]);
    // Get shared sites
    const sharedResult = await pool.query(`SELECT
      s.*,
      ss.permission,
      ss.invited_by as shared_by,
      ss.accepted_at as shared_at,
      COUNT(DISTINCT aj.id)::text as total_audits,
      MAX(aj.completed_at) as last_audit_at,
      (
        SELECT seo_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_seo_score,
      (
        SELECT accessibility_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_accessibility_score,
      (
        SELECT security_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_security_score,
      (
        SELECT performance_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_performance_score,
      COUNT(DISTINCT su.id)::text as url_count,
      COALESCE(
        (SELECT sub.tier FROM subscriptions sub WHERE sub.user_id = COALESCE(s.owner_id, s.created_by) AND sub.status IN ('active', 'trialing') ORDER BY sub.created_at DESC LIMIT 1),
        'free'
      ) as owner_tier
     FROM sites s
     JOIN site_shares ss ON ss.site_id = s.id
     LEFT JOIN audit_jobs aj ON aj.site_id = s.id
     LEFT JOIN site_urls su ON su.site_id = s.id
     WHERE ss.user_id = $1 AND ss.accepted_at IS NOT NULL
     GROUP BY s.id, ss.permission, ss.invited_by, ss.accepted_at
     ORDER BY ss.accepted_at DESC`, [userId]);
    const mapRowToAccess = (row, permission, sharedBy, sharedAt) => ({
        site: {
            id: row.id,
            owner_id: row.owner_id,
            name: row.name,
            domain: row.domain,
            description: row.description,
            logo_url: row.logo_url,
            verified: row.verified,
            verification_token: row.verification_token,
            verified_at: row.verified_at,
            verification_method: row.verification_method,
            verification_attempts: row.verification_attempts,
            last_verification_attempt: row.last_verification_attempt,
            ignore_robots_txt: row.ignore_robots_txt,
            rate_limit_profile: row.rate_limit_profile,
            send_verification_header: row.send_verification_header,
            badge_enabled: row.badge_enabled,
            settings: row.settings,
            created_by: row.created_by,
            created_at: row.created_at,
            updated_at: row.updated_at,
            stats: {
                totalAudits: parseInt(row.total_audits, 10),
                lastAuditAt: row.last_audit_at,
                latestScores: row.latest_seo_score !== null ? {
                    seo: row.latest_seo_score,
                    accessibility: row.latest_accessibility_score,
                    security: row.latest_security_score,
                    performance: row.latest_performance_score,
                } : null,
                urlCount: parseInt(row.url_count, 10),
            },
        },
        permission,
        ownerTier: row.owner_tier || 'free',
        sharedBy,
        sharedAt,
    });
    const owned = ownedResult.rows.map(row => mapRowToAccess(row, 'owner'));
    const shared = sharedResult.rows.map(row => mapRowToAccess(row, row.permission, row.shared_by, row.shared_at));
    return [...owned, ...shared];
}
/**
 * Get a single site by ID
 */
async function getSiteById(siteId) {
    const result = await pool.query('SELECT * FROM sites WHERE id = $1', [siteId]);
    return result.rows[0] || null;
}
/**
 * Get a single site with stats
 */
async function getSiteWithStats(siteId) {
    const result = await pool.query(`SELECT
      s.*,
      COUNT(DISTINCT aj.id)::text as total_audits,
      MAX(aj.completed_at) as last_audit_at,
      (
        SELECT seo_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_seo_score,
      (
        SELECT accessibility_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_accessibility_score,
      (
        SELECT security_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_security_score,
      (
        SELECT performance_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_performance_score,
      COUNT(DISTINCT su.id)::text as url_count
     FROM sites s
     LEFT JOIN audit_jobs aj ON aj.site_id = s.id
     LEFT JOIN site_urls su ON su.site_id = s.id
     WHERE s.id = $1
     GROUP BY s.id`, [siteId]);
    if (result.rows.length === 0)
        return null;
    const row = result.rows[0];
    return {
        id: row.id,
        owner_id: row.owner_id,
        name: row.name,
        domain: row.domain,
        description: row.description,
        logo_url: row.logo_url,
        verified: row.verified,
        verification_token: row.verification_token,
        verified_at: row.verified_at,
        verification_method: row.verification_method,
        verification_attempts: row.verification_attempts,
        last_verification_attempt: row.last_verification_attempt,
        ignore_robots_txt: row.ignore_robots_txt,
        rate_limit_profile: row.rate_limit_profile,
        send_verification_header: row.send_verification_header,
        badge_enabled: row.badge_enabled,
        settings: row.settings,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
        stats: {
            totalAudits: parseInt(row.total_audits, 10),
            lastAuditAt: row.last_audit_at,
            latestScores: row.latest_seo_score !== null ? {
                seo: row.latest_seo_score,
                accessibility: row.latest_accessibility_score,
                security: row.latest_security_score,
                performance: row.latest_performance_score,
            } : null,
            urlCount: parseInt(row.url_count, 10),
        },
    };
}
/**
 * Update a site
 */
async function updateSite(siteId, input) {
    const updates = [];
    const values = [];
    let paramIndex = 1;
    if (input.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(input.name);
    }
    if (input.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(input.description);
    }
    if (input.logo_url !== undefined) {
        updates.push(`logo_url = $${paramIndex++}`);
        values.push(input.logo_url);
    }
    if (input.settings !== undefined) {
        updates.push(`settings = settings || $${paramIndex++}::jsonb`);
        values.push(JSON.stringify(input.settings));
    }
    if (updates.length === 0) {
        const site = await getSiteById(siteId);
        if (!site)
            throw new Error('Site not found');
        return site;
    }
    values.push(siteId);
    const result = await pool.query(`UPDATE sites SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`, values);
    if (result.rows.length === 0) {
        throw new Error('Site not found');
    }
    return result.rows[0];
}
/**
 * Delete a site
 */
async function deleteSite(siteId) {
    await pool.query('DELETE FROM sites WHERE id = $1', [siteId]);
}
// =============================================
// SITE LIMITS (User-centric)
// =============================================
/**
 * Get user's subscription tier limits.
 * Pure user-centric: only checks the user's own subscription row.
 */
async function getUserTierLimits(userId) {
    const tierResult = await pool.query(`SELECT COALESCE(
      (SELECT s.tier FROM subscriptions s WHERE s.user_id = $1 AND s.status IN ('active', 'trialing') ORDER BY s.created_at DESC LIMIT 1),
      'free'
    ) as tier`, [userId]);
    const tier = tierResult.rows[0]?.tier || 'free';
    const limitsResult = await pool.query(`SELECT * FROM tier_limits WHERE tier = $1`, [tier]);
    return limitsResult.rows[0] || null;
}
/**
 * Get tier limits based on the site owner's subscription.
 * Resolves the owner via COALESCE(owner_id, created_by) for backward compatibility.
 */
async function getSiteOwnerTierLimits(siteId) {
    const ownerResult = await pool.query(`SELECT COALESCE(owner_id, created_by) as owner_id FROM sites WHERE id = $1`, [siteId]);
    if (ownerResult.rows.length === 0)
        return null;
    const ownerId = ownerResult.rows[0].owner_id;
    return getUserTierLimits(ownerId);
}
/**
 * Transfer site ownership to a new user.
 * - Validates the current owner matches
 * - Checks the new owner's site limit
 * - Updates sites.owner_id
 * - Removes any site_share for the new owner (they're now owner)
 * - Creates an admin-level site_share for the old owner
 */
async function transferSiteOwnership(siteId, currentOwnerId, newOwnerId) {
    // Verify current owner
    const siteResult = await pool.query(`SELECT * FROM sites WHERE id = $1 AND COALESCE(owner_id, created_by) = $2`, [siteId, currentOwnerId]);
    if (siteResult.rows.length === 0) {
        throw new Error('Site not found or you are not the owner');
    }
    if (currentOwnerId === newOwnerId) {
        throw new Error('Cannot transfer site to yourself');
    }
    // Check new owner's site limit
    const canAdd = await checkUserSiteLimit(newOwnerId);
    if (!canAdd.allowed) {
        throw new Error('The new owner has reached their site limit. They need to upgrade their plan.');
    }
    // Update owner
    const updated = await pool.query(`UPDATE sites SET owner_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [newOwnerId, siteId]);
    // Remove any existing share for the new owner (they're now the owner)
    await pool.query(`DELETE FROM site_shares WHERE site_id = $1 AND user_id = $2`, [siteId, newOwnerId]);
    // Add old owner as admin share (so they retain access)
    const existingShare = await pool.query(`SELECT id FROM site_shares WHERE site_id = $1 AND user_id = $2`, [siteId, currentOwnerId]);
    if (existingShare.rows.length === 0) {
        await pool.query(`INSERT INTO site_shares (site_id, user_id, permission, invited_by, accepted_at)
       VALUES ($1, $2, 'admin', $3, NOW())`, [siteId, currentOwnerId, newOwnerId]);
    }
    return updated.rows[0];
}
/**
 * Check if user can add more sites
 */
async function checkUserSiteLimit(userId) {
    const limits = await getUserTierLimits(userId);
    // Check both max_sites and max_sites_per_user (migration 025 adds the latter)
    // Default to 1 for free tier if neither is set
    const tier = limits?.tier || 'free';
    let maxSites = null;
    if (limits?.max_sites !== undefined && limits?.max_sites !== null) {
        maxSites = limits.max_sites;
    }
    else if (limits?.max_sites_per_user !== undefined && limits?.max_sites_per_user !== null) {
        maxSites = limits.max_sites_per_user;
    }
    else if (tier === 'free') {
        // Default for free tier if column is missing
        maxSites = 1;
    }
    // null means unlimited (enterprise)
    // If unlimited, allow
    if (maxSites === null) {
        return { allowed: true, used: 0, max: null };
    }
    // Count current sites owned by user (handles both old and new schema)
    const used = await countUserSites(userId);
    if (used >= maxSites) {
        return {
            allowed: false,
            reason: `You've reached your limit of ${maxSites} sites. Upgrade your plan to add more.`,
            used,
            max: maxSites,
        };
    }
    return { allowed: true, used, max: maxSites };
}
/**
 * Count sites owned/created by a user
 * Uses COALESCE(owner_id, created_by) for backward compatibility
 */
async function countUserSites(userId) {
    const result = await pool.query(`SELECT COUNT(*) as count FROM sites WHERE COALESCE(owner_id, created_by) = $1`, [userId]);
    return parseInt(result.rows[0].count, 10);
}
/**
 * Get site usage for a user
 */
async function getUserSiteUsage(userId) {
    const sites = await countUserSites(userId);
    const limits = await getUserTierLimits(userId);
    // Check both max_sites and max_sites_per_user (migration 025 adds the latter)
    // Default to 1 for free tier if neither is set
    const tier = limits?.tier || 'free';
    let maxSites = null;
    if (limits?.max_sites !== undefined && limits?.max_sites !== null) {
        maxSites = limits.max_sites;
    }
    else if (limits?.max_sites_per_user !== undefined && limits?.max_sites_per_user !== null) {
        maxSites = limits.max_sites_per_user;
    }
    else if (tier === 'free') {
        // Default for free tier if column is missing
        maxSites = 1;
    }
    // null means unlimited (enterprise)
    return {
        sites,
        maxSites,
        canAddMore: maxSites === null || sites < maxSites,
    };
}
// =============================================
// SITE AUDITS
// =============================================
/**
 * Get audits for a site
 */
async function getSiteAudits(siteId, options = {}) {
    const { limit = 20, offset = 0, status } = options;
    let whereClause = 'WHERE site_id = $1';
    const params = [siteId];
    let paramIndex = 2;
    if (status) {
        whereClause += ` AND status = $${paramIndex++}`;
        params.push(status);
    }
    // Get total count
    const countResult = await pool.query(`SELECT COUNT(*) as count FROM audit_jobs ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    // Get audits
    params.push(limit, offset);
    const result = await pool.query(`SELECT * FROM audit_jobs ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`, params);
    return { audits: result.rows, total };
}
/**
 * Get score history for a site
 */
async function getSiteScoreHistory(siteId, limit = 30) {
    const result = await pool.query(`SELECT completed_at, seo_score, accessibility_score, security_score, performance_score
     FROM audit_jobs
     WHERE site_id = $1 AND status = 'completed'
     ORDER BY completed_at DESC
     LIMIT $2`, [siteId, limit]);
    return result.rows.map(row => ({
        date: row.completed_at,
        seo: row.seo_score,
        accessibility: row.accessibility_score,
        security: row.security_score,
        performance: row.performance_score,
    })).reverse(); // Return in chronological order
}
// =============================================
// SITE URLs
// =============================================
/**
 * Get URLs for a site with search and pagination
 */
async function getSiteUrls(siteId, options = {}) {
    const { search, limit = 50, offset = 0, sortBy = 'url_path', sortOrder = 'asc', } = options;
    let whereClause = 'WHERE site_id = $1';
    const params = [siteId];
    let paramIndex = 2;
    if (search) {
        whereClause += ` AND (url_path ILIKE $${paramIndex} OR url ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
    }
    // Get total count
    const countResult = await pool.query(`SELECT COUNT(*) as count FROM site_urls ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    // Get URLs with sorting
    const validSortColumns = [
        'url_path', 'last_audited_at', 'audit_count', 'sitemap_priority',
        'last_seo_score', 'last_accessibility_score', 'last_security_score', 'last_performance_score', 'last_content_score'
    ];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'url_path';
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';
    // Handle NULL values in sorting (put NULLs last for nullable columns)
    const nullableColumns = ['last_audited_at', 'sitemap_priority', 'last_seo_score', 'last_accessibility_score', 'last_security_score', 'last_performance_score', 'last_content_score'];
    const nullsLast = nullableColumns.includes(sortColumn) ? 'NULLS LAST' : '';
    params.push(limit, offset);
    const result = await pool.query(`SELECT * FROM site_urls ${whereClause}
     ORDER BY ${sortColumn} ${order} ${nullsLast}
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`, params);
    return { urls: result.rows, total };
}
/**
 * Get a single URL by ID
 */
async function getUrlById(urlId) {
    const result = await pool.query('SELECT * FROM site_urls WHERE id = $1', [urlId]);
    return result.rows[0] || null;
}
/**
 * Get a URL by site and path
 */
async function getUrlBySiteAndUrl(siteId, url) {
    const result = await pool.query('SELECT * FROM site_urls WHERE site_id = $1 AND url = $2', [siteId, url]);
    return result.rows[0] || null;
}
/**
 * Create or get a URL for a site
 */
async function findOrCreateUrl(siteId, url, source = 'audit') {
    const urlPath = extractUrlPath(url);
    const result = await pool.query(`INSERT INTO site_urls (site_id, url, url_path, source)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (site_id, url)
     DO UPDATE SET updated_at = NOW()
     RETURNING *`, [siteId, url, urlPath, source]);
    return result.rows[0];
}
/**
 * Add a URL manually
 */
async function addUrl(siteId, url) {
    // Validate URL
    try {
        new URL(url);
    }
    catch {
        throw new Error('Invalid URL format');
    }
    return findOrCreateUrl(siteId, url, 'manual');
}
/**
 * Get audits for a specific URL
 */
async function getUrlAudits(urlId, options = {}) {
    const { limit = 20, offset = 0 } = options;
    const countResult = await pool.query(`SELECT COUNT(*) as count FROM audit_jobs WHERE url_id = $1`, [urlId]);
    const total = parseInt(countResult.rows[0].count, 10);
    const result = await pool.query(`SELECT * FROM audit_jobs WHERE url_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`, [urlId, limit, offset]);
    return { audits: result.rows, total };
}
/**
 * Count URLs for a site
 */
async function getUrlCount(siteId) {
    const result = await pool.query('SELECT COUNT(*) as count FROM site_urls WHERE site_id = $1', [siteId]);
    return parseInt(result.rows[0].count, 10);
}
/**
 * Bulk upsert URLs from sitemap
 */
async function upsertUrlsFromSitemap(siteId, urls) {
    if (urls.length === 0)
        return 0;
    let insertedCount = 0;
    for (const urlData of urls) {
        try {
            const urlPath = extractUrlPath(urlData.url);
            await pool.query(`INSERT INTO site_urls (site_id, url, url_path, source, sitemap_priority, sitemap_changefreq)
         VALUES ($1, $2, $3, 'sitemap', $4, $5)
         ON CONFLICT (site_id, url)
         DO UPDATE SET
           sitemap_priority = COALESCE(EXCLUDED.sitemap_priority, site_urls.sitemap_priority),
           sitemap_changefreq = COALESCE(EXCLUDED.sitemap_changefreq, site_urls.sitemap_changefreq),
           updated_at = NOW()`, [siteId, urlData.url, urlPath, urlData.priority ?? null, urlData.changefreq ?? null]);
            insertedCount++;
        }
        catch (err) {
            console.error(`Failed to upsert URL: ${urlData.url}`, err);
        }
    }
    return insertedCount;
}
/**
 * Discover and store pages from sitemap
 */
async function discoverSitemapUrls(siteId, domain) {
    const { createSitemapParser } = await import('./spider/sitemap-parser.service.js');
    const parser = createSitemapParser({
        maxSitemaps: 10,
        maxUrlsPerSitemap: 10000,
    });
    const baseUrl = `https://${domain}`;
    const { urls, errors } = await parser.discoverAndParse(baseUrl);
    const pagesData = urls.map(u => ({
        url: u.loc,
        priority: u.priority,
        changefreq: u.changefreq,
    }));
    const urlsDiscovered = await upsertUrlsFromSitemap(siteId, pagesData);
    return { urlsDiscovered, errors };
}
// =============================================
// SITE LOOKUP HELPERS
// =============================================
/**
 * Find a site by domain for a user (owned or shared with edit access)
 * Uses COALESCE(owner_id, created_by) for backward compatibility
 */
async function findSiteByDomainForUser(userId, domain) {
    const normalizedDomain = normalizeDomain(domain);
    // Check owned sites first (using COALESCE for backward compatibility)
    const owned = await pool.query(`SELECT * FROM sites WHERE COALESCE(owner_id, created_by) = $1 AND domain = $2`, [userId, normalizedDomain]);
    if (owned.rows.length > 0) {
        return owned.rows[0];
    }
    // Check shared sites with edit access
    const shared = await pool.query(`SELECT s.* FROM sites s
     JOIN site_shares ss ON ss.site_id = s.id
     WHERE ss.user_id = $1 AND s.domain = $2
     AND ss.permission IN ('editor', 'admin')
     AND ss.accepted_at IS NOT NULL`, [userId, normalizedDomain]);
    return shared.rows[0] || null;
}
/**
 * Find or create a site for a domain
 */
async function findOrCreateSiteForDomain(userId, domain) {
    const normalizedDomain = normalizeDomain(domain);
    // Check if site exists
    const existing = await findSiteByDomainForUser(userId, domain);
    if (existing) {
        return existing;
    }
    // Check if we can create a new site
    const canAdd = await checkUserSiteLimit(userId);
    if (!canAdd.allowed) {
        throw new Error(canAdd.reason || 'Site limit reached');
    }
    // Create new site
    const result = await pool.query(`INSERT INTO sites (owner_id, name, domain, created_by)
     VALUES ($1, $2, $3, $1)
     RETURNING *`, [userId, normalizedDomain, normalizedDomain]);
    return result.rows[0];
}
// =============================================
// VERIFICATION
// =============================================
/**
 * Generate a verification token for a site
 * Returns existing token if one exists (unless regenerate is true)
 */
async function generateVerificationToken(siteId, regenerate = false) {
    // Check for existing token first (unless regenerate is requested)
    if (!regenerate) {
        const existing = await pool.query(`SELECT verification_token FROM sites WHERE id = $1`, [siteId]);
        if (existing.rows[0]?.verification_token) {
            return existing.rows[0].verification_token;
        }
    }
    // Generate new token
    const token = `kritano-verify-${crypto.randomUUID()}`;
    await pool.query(`UPDATE sites SET verification_token = $1, updated_at = NOW() WHERE id = $2`, [token, siteId]);
    return token;
}
/**
 * Check if site is verified
 */
async function isSiteVerified(siteId) {
    const result = await pool.query(`SELECT verified FROM sites WHERE id = $1`, [siteId]);
    return result.rows[0]?.verified ?? false;
}
/**
 * Mark site as verified and send notification email + CRM trigger.
 */
async function markSiteVerified(siteId, method) {
    await pool.query(`UPDATE sites SET
       verified = TRUE,
       verified_at = NOW(),
       verification_method = $1,
       updated_at = NOW()
     WHERE id = $2`, [method, siteId]);
    // Send verification success email & fire CRM trigger (non-blocking)
    try {
        const siteResult = await pool.query(`SELECT s.id, s.domain, s.created_by,
              u.email, u.first_name
       FROM sites s
       JOIN users u ON s.created_by = u.id
       WHERE s.id = $1`, [siteId]);
        if (siteResult.rows.length > 0) {
            const site = siteResult.rows[0];
            const appUrl = process.env.APP_URL || 'http://localhost:3000';
            // Send email
            const { sendTemplate } = await import('./email-template.service.js');
            await sendTemplate({
                templateSlug: 'domain_verified',
                to: {
                    userId: site.created_by,
                    email: site.email,
                    firstName: site.first_name || 'there',
                },
                variables: {
                    firstName: site.first_name || 'there',
                    domain: site.domain,
                    verificationMethod: method === 'dns' ? 'DNS TXT record' : 'verification file',
                    siteUrl: `${appUrl}/app/sites/${site.id}`,
                    verifiedDate: new Date().toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    }),
                },
            });
            // Fire CRM trigger
            const { checkTriggers } = await import('./crm-trigger.service.js');
            await checkTriggers(site.created_by, 'domain_verified', {
                siteId: site.id,
                domain: site.domain,
                method,
            });
        }
    }
    catch (err) {
        // Don't fail verification if email/trigger fails
        console.warn('Domain verification notification failed:', err);
    }
}
/**
 * Increment verification attempt count
 */
async function incrementVerificationAttempt(siteId) {
    await pool.query(`UPDATE sites SET
       verification_attempts = verification_attempts + 1,
       last_verification_attempt = NOW(),
       updated_at = NOW()
     WHERE id = $1`, [siteId]);
}
// =============================================
// HELPERS
// =============================================
function normalizeDomain(domain) {
    return domain
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/.*$/, '')
        .trim();
}
function extractUrlPath(url) {
    try {
        const parsed = new URL(url);
        return parsed.pathname + parsed.search;
    }
    catch {
        return url.replace(/^https?:\/\/[^/]+/, '');
    }
}
/**
 * Record pages that were audited
 */
async function recordAuditedPages(siteId, auditId, urls) {
    if (urls.length === 0)
        return;
    // First, upsert the pages as known
    for (const url of urls) {
        await findOrCreateUrl(siteId, url, 'audit');
    }
    // Update the audit timestamp for all these URLs
    await pool.query(`UPDATE site_urls
     SET last_audited_at = NOW(), last_audit_id = $1, updated_at = NOW()
     WHERE site_id = $2 AND url = ANY($3)`, [auditId, siteId, urls]);
}
//# sourceMappingURL=site.service.js.map