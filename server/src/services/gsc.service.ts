import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Pool } from 'pg';
import { OAUTH_CONFIG } from '../config/oauth.config.js';
import { encryptToken, decryptToken } from '../utils/crypto.utils.js';

let pool: Pool;

export function setPool(p: Pool): void {
  pool = p;
}

const GSC_SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

function createOAuth2Client(): OAuth2Client {
  return new OAuth2Client(
    OAUTH_CONFIG.google.clientId,
    OAUTH_CONFIG.google.clientSecret,
    `${process.env.APP_URL}/auth/callback/gsc`
  );
}

// ========== OAuth Flow ==========

export function generateGscAuthUrl(siteId: string): { url: string; state: string } {
  const client = createOAuth2Client();
  const state = `gsc:${siteId}`;
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: GSC_SCOPES,
    state,
    prompt: 'consent',
  });
  return { url, state };
}

export async function handleGscCallback(
  code: string,
  siteId: string,
  userId: string
): Promise<{ connectionId: string; property: string }> {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to obtain tokens from Google. Please try again.');
  }

  // Get user info to store email
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const userInfo = await oauth2.userinfo.get();
  const googleEmail = userInfo.data.email || 'unknown';

  // List available GSC properties to find a match
  const webmasters = google.webmasters({ version: 'v3', auth: client });
  const sitesRes = await webmasters.sites.list();
  const sites = sitesRes.data.siteEntry || [];

  // Get the domain for this site_id
  const domainResult = await pool.query(
    `SELECT domain FROM sites WHERE id = $1`,
    [siteId]
  );
  if (domainResult.rows.length === 0) {
    throw new Error('Site not found');
  }
  const domainName = domainResult.rows[0].domain;

  // Find matching GSC property
  const matchingProperty = findMatchingProperty(sites, domainName);
  if (!matchingProperty) {
    const available = sites.map((s: any) => s.siteUrl).join(', ');
    throw new Error(
      `No matching Search Console property found for "${domainName}". ` +
      `Available properties: ${available || 'none'}. ` +
      `Make sure the domain is verified in Google Search Console.`
    );
  }

  // Encrypt tokens
  const accessTokenEncrypted = encryptToken(tokens.access_token);
  const refreshTokenEncrypted = encryptToken(tokens.refresh_token);

  // Upsert connection
  const result = await pool.query(
    `INSERT INTO gsc_connections (site_id, user_id, google_email, access_token_encrypted, refresh_token_encrypted, gsc_property)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (site_id) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       google_email = EXCLUDED.google_email,
       access_token_encrypted = EXCLUDED.access_token_encrypted,
       refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
       gsc_property = EXCLUDED.gsc_property,
       sync_status = 'pending',
       sync_error = NULL,
       updated_at = NOW()
     RETURNING id`,
    [siteId, userId, googleEmail, accessTokenEncrypted, refreshTokenEncrypted, matchingProperty]
  );

  return { connectionId: result.rows[0].id, property: matchingProperty };
}

function findMatchingProperty(sites: any[], domain: string): string | null {
  const normalised = domain.toLowerCase().replace(/^www\./, '');

  // Prefer sc-domain: property (covers all subdomains)
  for (const site of sites) {
    const url = site.siteUrl || '';
    if (url === `sc-domain:${normalised}`) return url;
  }

  // Fall back to URL-prefix properties
  for (const site of sites) {
    const url = site.siteUrl || '';
    try {
      const parsed = new URL(url);
      const siteHost = parsed.hostname.toLowerCase().replace(/^www\./, '');
      if (siteHost === normalised) return url;
    } catch {
      // Not a URL (could be sc-domain: format we already checked)
    }
  }

  return null;
}

// ========== Connection Management ==========

export async function getConnection(siteId: string) {
  const result = await pool.query(
    `SELECT id, site_id, user_id, google_email, gsc_property, connected_at,
            last_sync_at, sync_status, sync_error, created_at
     FROM gsc_connections WHERE site_id = $1`,
    [siteId]
  );
  return result.rows[0] || null;
}

export async function getConnectionsByUser(userId: string) {
  const result = await pool.query(
    `SELECT gc.id, gc.site_id, gc.google_email, gc.gsc_property, gc.connected_at,
            gc.last_sync_at, gc.sync_status, gc.sync_error,
            s.domain
     FROM gsc_connections gc
     JOIN sites s ON gc.site_id = s.id
     WHERE gc.user_id = $1
     ORDER BY gc.connected_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function disconnectGsc(siteId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM gsc_connections WHERE site_id = $1 AND user_id = $2 RETURNING id`,
    [siteId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

// ========== Data Sync ==========

async function getAuthenticatedClient(connectionId: string): Promise<OAuth2Client> {
  const result = await pool.query(
    `SELECT access_token_encrypted, refresh_token_encrypted FROM gsc_connections WHERE id = $1`,
    [connectionId]
  );
  if (result.rows.length === 0) throw new Error('GSC connection not found');

  const accessToken = decryptToken(result.rows[0].access_token_encrypted);
  const refreshToken = decryptToken(result.rows[0].refresh_token_encrypted);

  const client = createOAuth2Client();
  client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  // Handle token refresh
  client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      const encrypted = encryptToken(tokens.access_token);
      await pool.query(
        `UPDATE gsc_connections SET access_token_encrypted = $1, updated_at = NOW() WHERE id = $2`,
        [encrypted, connectionId]
      );
    }
  });

  return client;
}

export async function syncQueryData(
  connectionId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const connResult = await pool.query(
    `SELECT gsc_property FROM gsc_connections WHERE id = $1`,
    [connectionId]
  );
  if (connResult.rows.length === 0) throw new Error('Connection not found');

  const property = connResult.rows[0].gsc_property;
  const client = await getAuthenticatedClient(connectionId);
  const webmasters = google.webmasters({ version: 'v3', auth: client });

  // Update sync status
  await pool.query(
    `UPDATE gsc_connections SET sync_status = 'syncing', sync_error = NULL, updated_at = NOW() WHERE id = $1`,
    [connectionId]
  );

  try {
    let rowsInserted = 0;
    let startRow = 0;
    const rowLimit = 5000;
    const dimensions = ['query', 'page', 'device', 'country', 'date'];

    // Paginate through results
    while (true) {
      const response = await webmasters.searchanalytics.query({
        siteUrl: property,
        requestBody: {
          startDate,
          endDate,
          dimensions,
          rowLimit,
          startRow,
        },
      });

      const rows = response.data.rows || [];
      if (rows.length === 0) break;

      // Batch insert
      for (const row of rows) {
        const [query, pageUrl, device, country, date] = row.keys || [];
        await pool.query(
          `INSERT INTO gsc_query_data (connection_id, query, page_url, date, clicks, impressions, ctr, position, device, country)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT DO NOTHING`,
          [
            connectionId,
            query,
            pageUrl,
            date,
            row.clicks || 0,
            row.impressions || 0,
            row.ctr || 0,
            row.position || 0,
            device?.toLowerCase() || null,
            country?.toUpperCase() || null,
          ]
        );
        rowsInserted++;
      }

      if (rows.length < rowLimit) break;
      startRow += rowLimit;
    }

    // Update sync status
    await pool.query(
      `UPDATE gsc_connections SET sync_status = 'complete', last_sync_at = NOW(), sync_error = NULL, updated_at = NOW() WHERE id = $1`,
      [connectionId]
    );

    return rowsInserted;
  } catch (error: any) {
    await pool.query(
      `UPDATE gsc_connections SET sync_status = 'error', sync_error = $1, updated_at = NOW() WHERE id = $2`,
      [error.message?.substring(0, 500) || 'Unknown error', connectionId]
    );
    throw error;
  }
}

// ========== Query Analytics ==========

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

export async function getTopQueries(filters: GscQueryFilters) {
  const {
    connectionId,
    startDate,
    endDate,
    device,
    country,
    search,
    sortBy = 'clicks',
    sortDir = 'desc',
    limit = 50,
    offset = 0,
  } = filters;

  const params: any[] = [connectionId];
  const conditions: string[] = ['connection_id = $1'];
  let paramIndex = 2;

  if (startDate) {
    conditions.push(`date >= $${paramIndex}`);
    params.push(startDate);
    paramIndex++;
  }
  if (endDate) {
    conditions.push(`date <= $${paramIndex}`);
    params.push(endDate);
    paramIndex++;
  }
  if (device) {
    conditions.push(`device = $${paramIndex}`);
    params.push(device);
    paramIndex++;
  }
  if (country) {
    conditions.push(`country = $${paramIndex}`);
    params.push(country);
    paramIndex++;
  }
  if (search) {
    conditions.push(`query ILIKE $${paramIndex}`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const allowedSorts = ['clicks', 'impressions', 'ctr', 'position'];
  const safeSort = allowedSorts.includes(sortBy) ? sortBy : 'clicks';
  const safeDir = sortDir === 'asc' ? 'ASC' : 'DESC';

  const where = conditions.join(' AND ');

  const countResult = await pool.query(
    `SELECT COUNT(DISTINCT query) as total FROM gsc_query_data WHERE ${where}`,
    params
  );

  params.push(limit, offset);
  const result = await pool.query(
    `SELECT query,
            SUM(clicks)::INTEGER as clicks,
            SUM(impressions)::INTEGER as impressions,
            ROUND(AVG(ctr)::NUMERIC, 4) as ctr,
            ROUND(AVG(position)::NUMERIC, 1) as position,
            COUNT(DISTINCT page_url) as pages
     FROM gsc_query_data
     WHERE ${where}
     GROUP BY query
     ORDER BY ${safeSort} ${safeDir}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params
  );

  return {
    queries: result.rows,
    total: parseInt(countResult.rows[0].total, 10),
  };
}

export async function getTopPages(filters: GscQueryFilters) {
  const {
    connectionId,
    startDate,
    endDate,
    device,
    search,
    sortBy = 'clicks',
    sortDir = 'desc',
    limit = 50,
    offset = 0,
  } = filters;

  const params: any[] = [connectionId];
  const conditions: string[] = ['connection_id = $1'];
  let paramIndex = 2;

  if (startDate) {
    conditions.push(`date >= $${paramIndex}`);
    params.push(startDate);
    paramIndex++;
  }
  if (endDate) {
    conditions.push(`date <= $${paramIndex}`);
    params.push(endDate);
    paramIndex++;
  }
  if (device) {
    conditions.push(`device = $${paramIndex}`);
    params.push(device);
    paramIndex++;
  }
  if (search) {
    conditions.push(`page_url ILIKE $${paramIndex}`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const allowedSorts = ['clicks', 'impressions', 'ctr', 'position'];
  const safeSort = allowedSorts.includes(sortBy) ? sortBy : 'clicks';
  const safeDir = sortDir === 'asc' ? 'ASC' : 'DESC';
  const where = conditions.join(' AND ');

  params.push(limit, offset);
  const result = await pool.query(
    `SELECT page_url,
            SUM(clicks)::INTEGER as clicks,
            SUM(impressions)::INTEGER as impressions,
            ROUND(AVG(ctr)::NUMERIC, 4) as ctr,
            ROUND(AVG(position)::NUMERIC, 1) as position,
            COUNT(DISTINCT query) as queries
     FROM gsc_query_data
     WHERE ${where}
     GROUP BY page_url
     ORDER BY ${safeSort} ${safeDir}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params
  );

  return { pages: result.rows };
}

export async function getQueryTrend(connectionId: string, query: string, days: number = 28) {
  const result = await pool.query(
    `SELECT date,
            SUM(clicks)::INTEGER as clicks,
            SUM(impressions)::INTEGER as impressions,
            ROUND(AVG(ctr)::NUMERIC, 4) as ctr,
            ROUND(AVG(position)::NUMERIC, 1) as position
     FROM gsc_query_data
     WHERE connection_id = $1 AND query = $2 AND date >= CURRENT_DATE - $3::INTEGER
     GROUP BY date
     ORDER BY date ASC`,
    [connectionId, query, days]
  );
  return result.rows;
}

export async function getOverviewStats(connectionId: string, days: number = 28) {
  const result = await pool.query(
    `SELECT
       SUM(clicks)::INTEGER as total_clicks,
       SUM(impressions)::INTEGER as total_impressions,
       ROUND(AVG(ctr)::NUMERIC, 4) as avg_ctr,
       ROUND(AVG(position)::NUMERIC, 1) as avg_position,
       COUNT(DISTINCT query) as unique_queries,
       COUNT(DISTINCT page_url) as unique_pages
     FROM gsc_query_data
     WHERE connection_id = $1 AND date >= CURRENT_DATE - $2::INTEGER`,
    [connectionId, days]
  );
  return result.rows[0];
}

export async function getOverviewTrend(connectionId: string, days: number = 28) {
  const result = await pool.query(
    `SELECT date,
            SUM(clicks)::INTEGER as clicks,
            SUM(impressions)::INTEGER as impressions,
            ROUND(AVG(ctr)::NUMERIC, 4) as ctr,
            ROUND(AVG(position)::NUMERIC, 1) as position
     FROM gsc_query_data
     WHERE connection_id = $1 AND date >= CURRENT_DATE - $2::INTEGER
     GROUP BY date
     ORDER BY date ASC`,
    [connectionId, days]
  );
  return result.rows;
}

// ========== CTR Opportunities ==========

export async function getCtrOpportunities(connectionId: string, days: number = 28) {
  // High impressions but low CTR = opportunity to improve title/description
  const result = await pool.query(
    `SELECT query,
            SUM(clicks)::INTEGER as clicks,
            SUM(impressions)::INTEGER as impressions,
            ROUND(AVG(ctr)::NUMERIC, 4) as ctr,
            ROUND(AVG(position)::NUMERIC, 1) as position
     FROM gsc_query_data
     WHERE connection_id = $1 AND date >= CURRENT_DATE - $2::INTEGER
     GROUP BY query
     HAVING SUM(impressions) >= 50 AND AVG(ctr) < 0.03 AND AVG(position) <= 20
     ORDER BY SUM(impressions) DESC
     LIMIT 25`,
    [connectionId, days]
  );
  return result.rows;
}

// ========== Cannibalisation Detection ==========

export async function getCannibalisation(connectionId: string, days: number = 28) {
  // Queries where multiple pages rank -- potential cannibalisation
  const result = await pool.query(
    `WITH query_pages AS (
       SELECT query,
              page_url,
              SUM(clicks)::INTEGER as clicks,
              SUM(impressions)::INTEGER as impressions,
              ROUND(AVG(position)::NUMERIC, 1) as position
       FROM gsc_query_data
       WHERE connection_id = $1 AND date >= CURRENT_DATE - $2::INTEGER
       GROUP BY query, page_url
       HAVING SUM(impressions) >= 10
     ),
     multi_page_queries AS (
       SELECT query, COUNT(*) as page_count
       FROM query_pages
       GROUP BY query
       HAVING COUNT(*) >= 2
     )
     SELECT qp.query, qp.page_url, qp.clicks, qp.impressions, qp.position,
            mp.page_count
     FROM query_pages qp
     JOIN multi_page_queries mp ON qp.query = mp.query
     ORDER BY mp.page_count DESC, qp.query, qp.position ASC
     LIMIT 100`,
    [connectionId, days]
  );

  // Group by query
  const grouped: Record<string, { query: string; pageCount: number; pages: any[] }> = {};
  for (const row of result.rows) {
    if (!grouped[row.query]) {
      grouped[row.query] = { query: row.query, pageCount: row.page_count, pages: [] };
    }
    grouped[row.query].pages.push({
      url: row.page_url,
      clicks: row.clicks,
      impressions: row.impressions,
      position: row.position,
    });
  }

  return Object.values(grouped);
}

// ========== Page Keywords (for audit integration) ==========

export async function getPageKeywords(connectionId: string, pageUrl: string, days: number = 28) {
  const result = await pool.query(
    `SELECT query,
            SUM(clicks)::INTEGER as clicks,
            SUM(impressions)::INTEGER as impressions,
            ROUND(AVG(ctr)::NUMERIC, 4) as ctr,
            ROUND(AVG(position)::NUMERIC, 1) as position
     FROM gsc_query_data
     WHERE connection_id = $1 AND page_url = $2 AND date >= CURRENT_DATE - $3::INTEGER
     GROUP BY query
     ORDER BY SUM(clicks) DESC
     LIMIT 20`,
    [connectionId, pageUrl, days]
  );
  return result.rows;
}

// ========== Data Retention Cleanup ==========

export async function cleanupOldData(connectionId: string, retentionDays: number): Promise<number> {
  const result = await pool.query(
    `DELETE FROM gsc_query_data
     WHERE connection_id = $1 AND date < CURRENT_DATE - $2::INTEGER`,
    [connectionId, retentionDays]
  );
  return result.rowCount ?? 0;
}

// ========== Sync All Connections ==========

export async function getAllConnectionsForSync() {
  const result = await pool.query(
    `SELECT gc.id, gc.site_id, gc.gsc_property, gc.last_sync_at,
            tl.gsc_data_retention_days
     FROM gsc_connections gc
     JOIN subscriptions s ON s.user_id = gc.user_id AND s.status IN ('active', 'trialing')
     LEFT JOIN tier_limits tl ON tl.tier = s.tier
     WHERE gc.sync_status != 'syncing'
     ORDER BY gc.last_sync_at ASC NULLS FIRST`,
  );
  return result.rows;
}
