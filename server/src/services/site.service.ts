import { Pool } from 'pg';
import type {
  Site,
  SiteWithStats,
  SiteWithStatsRow,
  ScoreHistoryEntry,
  CreateSiteInput,
  UpdateSiteInput,
  SiteUrl,
  GetUrlsOptions,
  UserSiteAccess,
} from '../types/site.types.js';

let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
}

// =============================================
// SITE CRUD (User-centric)
// =============================================

/**
 * Create a new site owned by a user
 */
export async function createSite(
  userId: string,
  input: CreateSiteInput
): Promise<Site> {
  // Normalize domain
  const domain = normalizeDomain(input.domain);

  // Check site limit for user
  const canAdd = await checkUserSiteLimit(userId);
  if (!canAdd.allowed) {
    throw new Error(canAdd.reason || 'Site limit reached');
  }

  // Check if domain already exists for this user
  const existing = await pool.query(
    'SELECT id FROM sites WHERE owner_id = $1 AND domain = $2',
    [userId, domain]
  );
  if (existing.rows.length > 0) {
    throw new Error('A site with this domain already exists');
  }

  const result = await pool.query<Site>(
    `INSERT INTO sites (owner_id, name, domain, description, created_by)
     VALUES ($1, $2, $3, $4, $1)
     RETURNING *`,
    [userId, input.name, domain, input.description || null]
  );

  return result.rows[0];
}

/**
 * Get all sites accessible by a user (owned + shared)
 * Uses COALESCE(owner_id, created_by) for backward compatibility
 */
export async function getUserSites(userId: string): Promise<UserSiteAccess[]> {
  // Use COALESCE for backward compatibility with both owner_id and created_by
  const ownedResult = await pool.query<SiteWithStatsRow>(
    `SELECT
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
     WHERE COALESCE(s.owner_id, s.created_by) = $1
     GROUP BY s.id
     ORDER BY s.created_at DESC`,
    [userId]
  );

  // Get shared sites
  const sharedResult = await pool.query<SiteWithStatsRow & { permission: string; shared_by: string; shared_at: Date }>(
    `SELECT
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
      COUNT(DISTINCT su.id)::text as url_count
     FROM sites s
     JOIN site_shares ss ON ss.site_id = s.id
     LEFT JOIN audit_jobs aj ON aj.site_id = s.id
     LEFT JOIN site_urls su ON su.site_id = s.id
     WHERE ss.user_id = $1 AND ss.accepted_at IS NOT NULL
     GROUP BY s.id, ss.permission, ss.invited_by, ss.accepted_at
     ORDER BY ss.accepted_at DESC`,
    [userId]
  );

  const mapRowToAccess = (row: SiteWithStatsRow, permission: 'owner' | 'admin' | 'editor' | 'viewer', sharedBy?: string, sharedAt?: Date): UserSiteAccess => ({
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
    sharedBy,
    sharedAt,
  });

  const owned = ownedResult.rows.map(row => mapRowToAccess(row, 'owner'));
  const shared = sharedResult.rows.map(row =>
    mapRowToAccess(row, row.permission as 'admin' | 'editor' | 'viewer', row.shared_by, row.shared_at)
  );

  return [...owned, ...shared];
}

/**
 * Get a single site by ID
 */
export async function getSiteById(siteId: string): Promise<Site | null> {
  const result = await pool.query<Site>(
    'SELECT * FROM sites WHERE id = $1',
    [siteId]
  );
  return result.rows[0] || null;
}

/**
 * Get a single site with stats
 */
export async function getSiteWithStats(siteId: string): Promise<SiteWithStats | null> {
  const result = await pool.query<SiteWithStatsRow>(
    `SELECT
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
     GROUP BY s.id`,
    [siteId]
  );

  if (result.rows.length === 0) return null;

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
export async function updateSite(
  siteId: string,
  input: UpdateSiteInput
): Promise<Site> {
  const updates: string[] = [];
  const values: unknown[] = [];
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
    if (!site) throw new Error('Site not found');
    return site;
  }

  values.push(siteId);
  const result = await pool.query<Site>(
    `UPDATE sites SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Site not found');
  }

  return result.rows[0];
}

/**
 * Delete a site
 */
export async function deleteSite(siteId: string): Promise<void> {
  await pool.query('DELETE FROM sites WHERE id = $1', [siteId]);
}

// =============================================
// SITE LIMITS (User-centric)
// =============================================

/**
 * Get user's subscription tier limits
 * Checks user-level subscription first, then falls back to org-level subscription
 */
export async function getUserTierLimits(userId: string): Promise<Record<string, unknown> | null> {
  // Get user's tier - try user-based subscription, then org-based, then fall back to free
  const tierResult = await pool.query<{ tier: string }>(
    `SELECT COALESCE(
      (SELECT s.tier FROM subscriptions s WHERE s.user_id = $1 AND s.status IN ('active', 'trialing') ORDER BY s.created_at DESC LIMIT 1),
      (SELECT s.tier FROM subscriptions s
       JOIN organizations o ON o.id = s.organization_id
       WHERE o.owner_id = $1 AND s.status IN ('active', 'trialing')
       ORDER BY s.created_at DESC LIMIT 1),
      (SELECT s.tier FROM subscriptions s
       JOIN organization_members om ON om.organization_id = s.organization_id
       WHERE om.user_id = $1 AND s.status IN ('active', 'trialing')
       ORDER BY s.created_at DESC LIMIT 1),
      'free'
    ) as tier`,
    [userId]
  );

  const tier = tierResult.rows[0]?.tier || 'free';

  const limitsResult = await pool.query(
    `SELECT * FROM tier_limits WHERE tier = $1`,
    [tier]
  );

  return limitsResult.rows[0] || null;
}

/**
 * Get tier limits based on the site owner's subscription.
 * Resolves the owner via COALESCE(owner_id, created_by) for backward compatibility.
 */
export async function getSiteOwnerTierLimits(siteId: string): Promise<Record<string, unknown> | null> {
  const ownerResult = await pool.query<{ owner_id: string }>(
    `SELECT COALESCE(owner_id, created_by) as owner_id FROM sites WHERE id = $1`,
    [siteId]
  );

  if (ownerResult.rows.length === 0) return null;

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
export async function transferSiteOwnership(
  siteId: string,
  currentOwnerId: string,
  newOwnerId: string
): Promise<Site> {
  // Verify current owner
  const siteResult = await pool.query<Site>(
    `SELECT * FROM sites WHERE id = $1 AND COALESCE(owner_id, created_by) = $2`,
    [siteId, currentOwnerId]
  );

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
  const updated = await pool.query<Site>(
    `UPDATE sites SET owner_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [newOwnerId, siteId]
  );

  // Remove any existing share for the new owner (they're now the owner)
  await pool.query(
    `DELETE FROM site_shares WHERE site_id = $1 AND user_id = $2`,
    [siteId, newOwnerId]
  );

  // Add old owner as admin share (so they retain access)
  const existingShare = await pool.query(
    `SELECT id FROM site_shares WHERE site_id = $1 AND user_id = $2`,
    [siteId, currentOwnerId]
  );

  if (existingShare.rows.length === 0) {
    await pool.query(
      `INSERT INTO site_shares (site_id, user_id, permission, invited_by, accepted_at)
       VALUES ($1, $2, 'admin', $3, NOW())`,
      [siteId, currentOwnerId, newOwnerId]
    );
  }

  return updated.rows[0];
}

/**
 * Check if user can add more sites
 */
export async function checkUserSiteLimit(
  userId: string
): Promise<{ allowed: boolean; reason?: string; used: number; max: number | null }> {
  const limits = await getUserTierLimits(userId);

  // Check both max_sites and max_sites_per_user (migration 025 adds the latter)
  // Default to 1 for free tier if neither is set
  const tier = (limits?.tier as string) || 'free';
  let maxSites: number | null = null;

  if (limits?.max_sites !== undefined && limits?.max_sites !== null) {
    maxSites = limits.max_sites as number;
  } else if (limits?.max_sites_per_user !== undefined && limits?.max_sites_per_user !== null) {
    maxSites = limits.max_sites_per_user as number;
  } else if (tier === 'free') {
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
async function countUserSites(userId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM sites WHERE COALESCE(owner_id, created_by) = $1`,
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
}

/**
 * Get site usage for a user
 */
export async function getUserSiteUsage(
  userId: string
): Promise<{ sites: number; maxSites: number | null; canAddMore: boolean }> {
  const sites = await countUserSites(userId);
  const limits = await getUserTierLimits(userId);

  // Check both max_sites and max_sites_per_user (migration 025 adds the latter)
  // Default to 1 for free tier if neither is set
  const tier = (limits?.tier as string) || 'free';
  let maxSites: number | null = null;

  if (limits?.max_sites !== undefined && limits?.max_sites !== null) {
    maxSites = limits.max_sites as number;
  } else if (limits?.max_sites_per_user !== undefined && limits?.max_sites_per_user !== null) {
    maxSites = limits.max_sites_per_user as number;
  } else if (tier === 'free') {
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
export async function getSiteAudits(
  siteId: string,
  options: { limit?: number; offset?: number; status?: string } = {}
): Promise<{ audits: unknown[]; total: number }> {
  const { limit = 20, offset = 0, status } = options;

  let whereClause = 'WHERE site_id = $1';
  const params: unknown[] = [siteId];
  let paramIndex = 2;

  if (status) {
    whereClause += ` AND status = $${paramIndex++}`;
    params.push(status);
  }

  // Get total count
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM audit_jobs ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Get audits
  params.push(limit, offset);
  const result = await pool.query(
    `SELECT * FROM audit_jobs ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );

  return { audits: result.rows, total };
}

/**
 * Get score history for a site
 */
export async function getSiteScoreHistory(
  siteId: string,
  limit: number = 30
): Promise<ScoreHistoryEntry[]> {
  const result = await pool.query<{
    completed_at: Date;
    seo_score: number | null;
    accessibility_score: number | null;
    security_score: number | null;
    performance_score: number | null;
  }>(
    `SELECT completed_at, seo_score, accessibility_score, security_score, performance_score
     FROM audit_jobs
     WHERE site_id = $1 AND status = 'completed'
     ORDER BY completed_at DESC
     LIMIT $2`,
    [siteId, limit]
  );

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
export async function getSiteUrls(
  siteId: string,
  options: GetUrlsOptions = {}
): Promise<{ urls: SiteUrl[]; total: number }> {
  const {
    search,
    limit = 50,
    offset = 0,
    sortBy = 'url_path',
    sortOrder = 'asc',
  } = options;

  let whereClause = 'WHERE site_id = $1';
  const params: unknown[] = [siteId];
  let paramIndex = 2;

  if (search) {
    whereClause += ` AND (url_path ILIKE $${paramIndex} OR url ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  // Get total count
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM site_urls ${whereClause}`,
    params
  );
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
  const result = await pool.query<SiteUrl>(
    `SELECT * FROM site_urls ${whereClause}
     ORDER BY ${sortColumn} ${order} ${nullsLast}
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );

  return { urls: result.rows, total };
}

/**
 * Get a single URL by ID
 */
export async function getUrlById(urlId: string): Promise<SiteUrl | null> {
  const result = await pool.query<SiteUrl>(
    'SELECT * FROM site_urls WHERE id = $1',
    [urlId]
  );
  return result.rows[0] || null;
}

/**
 * Get a URL by site and path
 */
export async function getUrlBySiteAndUrl(siteId: string, url: string): Promise<SiteUrl | null> {
  const result = await pool.query<SiteUrl>(
    'SELECT * FROM site_urls WHERE site_id = $1 AND url = $2',
    [siteId, url]
  );
  return result.rows[0] || null;
}

/**
 * Create or get a URL for a site
 */
export async function findOrCreateUrl(
  siteId: string,
  url: string,
  source: 'sitemap' | 'audit' | 'manual' = 'audit'
): Promise<SiteUrl> {
  const urlPath = extractUrlPath(url);

  const result = await pool.query<SiteUrl>(
    `INSERT INTO site_urls (site_id, url, url_path, source)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (site_id, url)
     DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [siteId, url, urlPath, source]
  );

  return result.rows[0];
}

/**
 * Add a URL manually
 */
export async function addUrl(
  siteId: string,
  url: string
): Promise<SiteUrl> {
  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid URL format');
  }

  return findOrCreateUrl(siteId, url, 'manual');
}

/**
 * Get audits for a specific URL
 */
export async function getUrlAudits(
  urlId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ audits: unknown[]; total: number }> {
  const { limit = 20, offset = 0 } = options;

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM audit_jobs WHERE url_id = $1`,
    [urlId]
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await pool.query(
    `SELECT * FROM audit_jobs WHERE url_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [urlId, limit, offset]
  );

  return { audits: result.rows, total };
}

/**
 * Count URLs for a site
 */
export async function getUrlCount(siteId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    'SELECT COUNT(*) as count FROM site_urls WHERE site_id = $1',
    [siteId]
  );
  return parseInt(result.rows[0].count, 10);
}

/**
 * Bulk upsert URLs from sitemap
 */
export async function upsertUrlsFromSitemap(
  siteId: string,
  urls: Array<{
    url: string;
    priority?: number;
    changefreq?: string;
  }>
): Promise<number> {
  if (urls.length === 0) return 0;

  let insertedCount = 0;

  for (const urlData of urls) {
    try {
      const urlPath = extractUrlPath(urlData.url);

      await pool.query(
        `INSERT INTO site_urls (site_id, url, url_path, source, sitemap_priority, sitemap_changefreq)
         VALUES ($1, $2, $3, 'sitemap', $4, $5)
         ON CONFLICT (site_id, url)
         DO UPDATE SET
           sitemap_priority = COALESCE(EXCLUDED.sitemap_priority, site_urls.sitemap_priority),
           sitemap_changefreq = COALESCE(EXCLUDED.sitemap_changefreq, site_urls.sitemap_changefreq),
           updated_at = NOW()`,
        [siteId, urlData.url, urlPath, urlData.priority ?? null, urlData.changefreq ?? null]
      );
      insertedCount++;
    } catch (err) {
      console.error(`Failed to upsert URL: ${urlData.url}`, err);
    }
  }

  return insertedCount;
}

/**
 * Discover and store pages from sitemap
 */
export async function discoverSitemapUrls(
  siteId: string,
  domain: string
): Promise<{ urlsDiscovered: number; errors: string[] }> {
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
export async function findSiteByDomainForUser(
  userId: string,
  domain: string
): Promise<Site | null> {
  const normalizedDomain = normalizeDomain(domain);

  // Check owned sites first (using COALESCE for backward compatibility)
  const owned = await pool.query<Site>(
    `SELECT * FROM sites WHERE COALESCE(owner_id, created_by) = $1 AND domain = $2`,
    [userId, normalizedDomain]
  );

  if (owned.rows.length > 0) {
    return owned.rows[0];
  }

  // Check shared sites with edit access
  const shared = await pool.query<Site>(
    `SELECT s.* FROM sites s
     JOIN site_shares ss ON ss.site_id = s.id
     WHERE ss.user_id = $1 AND s.domain = $2
     AND ss.permission IN ('editor', 'admin')
     AND ss.accepted_at IS NOT NULL`,
    [userId, normalizedDomain]
  );

  return shared.rows[0] || null;
}

/**
 * Find or create a site for a domain
 */
export async function findOrCreateSiteForDomain(
  userId: string,
  domain: string
): Promise<Site> {
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
  const result = await pool.query<Site>(
    `INSERT INTO sites (owner_id, name, domain, created_by)
     VALUES ($1, $2, $3, $1)
     RETURNING *`,
    [userId, normalizedDomain, normalizedDomain]
  );

  return result.rows[0];
}

// =============================================
// VERIFICATION
// =============================================

/**
 * Generate a verification token for a site
 * Returns existing token if one exists (unless regenerate is true)
 */
export async function generateVerificationToken(siteId: string, regenerate: boolean = false): Promise<string> {
  // Check for existing token first (unless regenerate is requested)
  if (!regenerate) {
    const existing = await pool.query<{ verification_token: string | null }>(
      `SELECT verification_token FROM sites WHERE id = $1`,
      [siteId]
    );

    if (existing.rows[0]?.verification_token) {
      return existing.rows[0].verification_token;
    }
  }

  // Generate new token
  const token = `pagepulser-verify-${crypto.randomUUID()}`;

  await pool.query(
    `UPDATE sites SET verification_token = $1, updated_at = NOW() WHERE id = $2`,
    [token, siteId]
  );

  return token;
}

/**
 * Check if site is verified
 */
export async function isSiteVerified(siteId: string): Promise<boolean> {
  const result = await pool.query<{ verified: boolean }>(
    `SELECT verified FROM sites WHERE id = $1`,
    [siteId]
  );
  return result.rows[0]?.verified ?? false;
}

/**
 * Mark site as verified and send notification email + CRM trigger.
 */
export async function markSiteVerified(
  siteId: string,
  method: 'dns' | 'file'
): Promise<void> {
  await pool.query(
    `UPDATE sites SET
       verified = TRUE,
       verified_at = NOW(),
       verification_method = $1,
       updated_at = NOW()
     WHERE id = $2`,
    [method, siteId]
  );

  // TODO: Phase 10 - Send verification success email
  // TODO: Phase 10 - Fire CRM trigger for domain_verified
}

/**
 * Increment verification attempt count
 */
export async function incrementVerificationAttempt(siteId: string): Promise<void> {
  await pool.query(
    `UPDATE sites SET
       verification_attempts = verification_attempts + 1,
       last_verification_attempt = NOW(),
       updated_at = NOW()
     WHERE id = $1`,
    [siteId]
  );
}

// =============================================
// HELPERS
// =============================================

function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .trim();
}

function extractUrlPath(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  } catch {
    return url.replace(/^https?:\/\/[^/]+/, '');
  }
}

// Legacy exports for backward compatibility (will be removed)
export { getUserSites as getSites };
export { getUserSiteUsage as getSiteUsage };

// Re-export known pages functions for backward compatibility
// These now operate on site_urls
export type KnownPage = SiteUrl;
export { getSiteUrls as getKnownPages };
export { getUrlCount as getKnownPagesCount };
export { upsertUrlsFromSitemap as upsertKnownPages };
export { discoverSitemapUrls as discoverSitemapPages };

/**
 * Record pages that were audited
 */
export async function recordAuditedPages(
  siteId: string,
  auditId: string,
  urls: string[]
): Promise<void> {
  if (urls.length === 0) return;

  // First, upsert the pages as known
  for (const url of urls) {
    await findOrCreateUrl(siteId, url, 'audit');
  }

  // Update the audit timestamp for all these URLs
  await pool.query(
    `UPDATE site_urls
     SET last_audited_at = NOW(), last_audit_id = $1, updated_at = NOW()
     WHERE site_id = $2 AND url = ANY($3)`,
    [auditId, siteId, urls]
  );
}
