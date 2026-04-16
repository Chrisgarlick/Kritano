"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPool = setPool;
exports.generateGscAuthUrl = generateGscAuthUrl;
exports.handleGscCallback = handleGscCallback;
exports.getConnection = getConnection;
exports.getConnectionsByUser = getConnectionsByUser;
exports.disconnectGsc = disconnectGsc;
exports.syncQueryData = syncQueryData;
exports.getTopQueries = getTopQueries;
exports.getTopPages = getTopPages;
exports.getQueryTrend = getQueryTrend;
exports.getOverviewStats = getOverviewStats;
exports.getOverviewTrend = getOverviewTrend;
exports.getCtrOpportunities = getCtrOpportunities;
exports.getCannibalisation = getCannibalisation;
exports.getPageKeywords = getPageKeywords;
exports.cleanupOldData = cleanupOldData;
exports.getAllConnectionsForSync = getAllConnectionsForSync;
const googleapis_1 = require("googleapis");
const google_auth_library_1 = require("google-auth-library");
const oauth_config_js_1 = require("../config/oauth.config.js");
const crypto_utils_js_1 = require("../utils/crypto.utils.js");
let pool;
function setPool(p) {
    pool = p;
}
const GSC_SCOPES = [
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
];
function createOAuth2Client() {
    return new google_auth_library_1.OAuth2Client(oauth_config_js_1.OAUTH_CONFIG.google.clientId, oauth_config_js_1.OAUTH_CONFIG.google.clientSecret, `${process.env.APP_URL}/auth/callback/gsc`);
}
// ========== OAuth Flow ==========
function generateGscAuthUrl(siteId) {
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
async function handleGscCallback(code, siteId, userId) {
    const client = createOAuth2Client();
    const { tokens } = await client.getToken(code);
    if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Failed to obtain tokens from Google. Please try again.');
    }
    // Get user info to store email
    client.setCredentials(tokens);
    const oauth2 = googleapis_1.google.oauth2({ version: 'v2', auth: client });
    const userInfo = await oauth2.userinfo.get();
    const googleEmail = userInfo.data.email || 'unknown';
    // List available GSC properties to find a match
    const webmasters = googleapis_1.google.webmasters({ version: 'v3', auth: client });
    const sitesRes = await webmasters.sites.list();
    const sites = sitesRes.data.siteEntry || [];
    // Get the domain for this site_id
    const domainResult = await pool.query(`SELECT domain FROM sites WHERE id = $1`, [siteId]);
    if (domainResult.rows.length === 0) {
        throw new Error('Site not found');
    }
    const domainName = domainResult.rows[0].domain;
    // Find matching GSC property
    const matchingProperty = findMatchingProperty(sites, domainName);
    if (!matchingProperty) {
        const available = sites.map((s) => s.siteUrl).join(', ');
        throw new Error(`No matching Search Console property found for "${domainName}". ` +
            `Available properties: ${available || 'none'}. ` +
            `Make sure the domain is verified in Google Search Console.`);
    }
    // Encrypt tokens
    const accessTokenEncrypted = (0, crypto_utils_js_1.encryptToken)(tokens.access_token);
    const refreshTokenEncrypted = (0, crypto_utils_js_1.encryptToken)(tokens.refresh_token);
    // Upsert connection
    const result = await pool.query(`INSERT INTO gsc_connections (site_id, user_id, google_email, access_token_encrypted, refresh_token_encrypted, gsc_property)
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
     RETURNING id`, [siteId, userId, googleEmail, accessTokenEncrypted, refreshTokenEncrypted, matchingProperty]);
    return { connectionId: result.rows[0].id, property: matchingProperty };
}
function findMatchingProperty(sites, domain) {
    const normalised = domain.toLowerCase().replace(/^www\./, '');
    // Prefer sc-domain: property (covers all subdomains)
    for (const site of sites) {
        const url = site.siteUrl || '';
        if (url === `sc-domain:${normalised}`)
            return url;
    }
    // Fall back to URL-prefix properties
    for (const site of sites) {
        const url = site.siteUrl || '';
        try {
            const parsed = new URL(url);
            const siteHost = parsed.hostname.toLowerCase().replace(/^www\./, '');
            if (siteHost === normalised)
                return url;
        }
        catch {
            // Not a URL (could be sc-domain: format we already checked)
        }
    }
    return null;
}
// ========== Connection Management ==========
async function getConnection(siteId) {
    const result = await pool.query(`SELECT id, site_id, user_id, google_email, gsc_property, connected_at,
            last_sync_at, sync_status, sync_error, created_at
     FROM gsc_connections WHERE site_id = $1`, [siteId]);
    return result.rows[0] || null;
}
async function getConnectionsByUser(userId) {
    const result = await pool.query(`SELECT gc.id, gc.site_id, gc.google_email, gc.gsc_property, gc.connected_at,
            gc.last_sync_at, gc.sync_status, gc.sync_error,
            s.domain
     FROM gsc_connections gc
     JOIN sites s ON gc.site_id = s.id
     WHERE gc.user_id = $1
     ORDER BY gc.connected_at DESC`, [userId]);
    return result.rows;
}
async function disconnectGsc(siteId, userId) {
    const result = await pool.query(`DELETE FROM gsc_connections WHERE site_id = $1 AND user_id = $2 RETURNING id`, [siteId, userId]);
    return (result.rowCount ?? 0) > 0;
}
// ========== Data Sync ==========
async function getAuthenticatedClient(connectionId) {
    const result = await pool.query(`SELECT access_token_encrypted, refresh_token_encrypted FROM gsc_connections WHERE id = $1`, [connectionId]);
    if (result.rows.length === 0)
        throw new Error('GSC connection not found');
    const accessToken = (0, crypto_utils_js_1.decryptToken)(result.rows[0].access_token_encrypted);
    const refreshToken = (0, crypto_utils_js_1.decryptToken)(result.rows[0].refresh_token_encrypted);
    const client = createOAuth2Client();
    client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
    // Handle token refresh
    client.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            const encrypted = (0, crypto_utils_js_1.encryptToken)(tokens.access_token);
            await pool.query(`UPDATE gsc_connections SET access_token_encrypted = $1, updated_at = NOW() WHERE id = $2`, [encrypted, connectionId]);
        }
    });
    return client;
}
async function syncQueryData(connectionId, startDate, endDate) {
    const connResult = await pool.query(`SELECT gsc_property FROM gsc_connections WHERE id = $1`, [connectionId]);
    if (connResult.rows.length === 0)
        throw new Error('Connection not found');
    const property = connResult.rows[0].gsc_property;
    const client = await getAuthenticatedClient(connectionId);
    const webmasters = googleapis_1.google.webmasters({ version: 'v3', auth: client });
    // Update sync status
    await pool.query(`UPDATE gsc_connections SET sync_status = 'syncing', sync_error = NULL, updated_at = NOW() WHERE id = $1`, [connectionId]);
    try {
        let rowsInserted = 0;
        let startRow = 0;
        const rowLimit = 5000;
        const dimensions = ['query', 'page', 'device', 'country', 'date'];
        // Paginate through detailed results
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
            if (rows.length === 0)
                break;
            // Batch insert
            for (const row of rows) {
                const [query, pageUrl, device, country, date] = row.keys || [];
                await pool.query(`INSERT INTO gsc_query_data (connection_id, query, page_url, date, clicks, impressions, ctr, position, device, country)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT DO NOTHING`, [
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
                ]);
                rowsInserted++;
            }
            if (rows.length < rowLimit)
                break;
            startRow += rowLimit;
        }
        // Fallback: if no detailed rows returned, fetch daily aggregates.
        // GSC anonymises sparse data and won't break it down by query/page,
        // but still returns totals per date.
        if (rowsInserted === 0) {
            const dateResponse = await webmasters.searchanalytics.query({
                siteUrl: property,
                requestBody: {
                    startDate,
                    endDate,
                    dimensions: ['date'],
                    rowLimit: 5000,
                },
            });
            const dateRows = dateResponse.data.rows || [];
            for (const row of dateRows) {
                const impressions = row.impressions || 0;
                const clicks = row.clicks || 0;
                if (impressions === 0 && clicks === 0)
                    continue;
                const [date] = row.keys || [];
                await pool.query(`INSERT INTO gsc_query_data (connection_id, query, page_url, date, clicks, impressions, ctr, position, device, country)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT DO NOTHING`, [
                    connectionId,
                    '(anonymised)',
                    null,
                    date,
                    clicks,
                    impressions,
                    row.ctr || 0,
                    row.position || 0,
                    null,
                    null,
                ]);
                rowsInserted++;
            }
        }
        // Update sync status
        await pool.query(`UPDATE gsc_connections SET sync_status = 'complete', last_sync_at = NOW(), sync_error = NULL, updated_at = NOW() WHERE id = $1`, [connectionId]);
        return rowsInserted;
    }
    catch (error) {
        await pool.query(`UPDATE gsc_connections SET sync_status = 'error', sync_error = $1, updated_at = NOW() WHERE id = $2`, [error.message?.substring(0, 500) || 'Unknown error', connectionId]);
        throw error;
    }
}
async function getTopQueries(filters) {
    const { connectionId, startDate, endDate, device, country, search, sortBy = 'clicks', sortDir = 'desc', limit = 50, offset = 0, } = filters;
    const params = [connectionId];
    const conditions = ['connection_id = $1'];
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
    const countResult = await pool.query(`SELECT COUNT(DISTINCT query) as total FROM gsc_query_data WHERE ${where}`, params);
    params.push(limit, offset);
    const result = await pool.query(`SELECT query,
            SUM(clicks)::INTEGER as clicks,
            SUM(impressions)::INTEGER as impressions,
            ROUND(AVG(ctr)::NUMERIC, 4) as ctr,
            ROUND(AVG(position)::NUMERIC, 1) as position,
            COUNT(DISTINCT page_url) as pages
     FROM gsc_query_data
     WHERE ${where}
     GROUP BY query
     ORDER BY ${safeSort} ${safeDir}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, params);
    return {
        queries: result.rows,
        total: parseInt(countResult.rows[0].total, 10),
    };
}
async function getTopPages(filters) {
    const { connectionId, startDate, endDate, device, search, sortBy = 'clicks', sortDir = 'desc', limit = 50, offset = 0, } = filters;
    const params = [connectionId];
    const conditions = ['connection_id = $1'];
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
    const result = await pool.query(`SELECT page_url,
            SUM(clicks)::INTEGER as clicks,
            SUM(impressions)::INTEGER as impressions,
            ROUND(AVG(ctr)::NUMERIC, 4) as ctr,
            ROUND(AVG(position)::NUMERIC, 1) as position,
            COUNT(DISTINCT query) as queries
     FROM gsc_query_data
     WHERE ${where}
     GROUP BY page_url
     ORDER BY ${safeSort} ${safeDir}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, params);
    return { pages: result.rows };
}
async function getQueryTrend(connectionId, query, days = 28) {
    const result = await pool.query(`SELECT date,
            SUM(clicks)::INTEGER as clicks,
            SUM(impressions)::INTEGER as impressions,
            ROUND(AVG(ctr)::NUMERIC, 4) as ctr,
            ROUND(AVG(position)::NUMERIC, 1) as position
     FROM gsc_query_data
     WHERE connection_id = $1 AND query = $2 AND date >= CURRENT_DATE - $3::INTEGER
     GROUP BY date
     ORDER BY date ASC`, [connectionId, query, days]);
    return result.rows;
}
async function getOverviewStats(connectionId, days = 28) {
    const result = await pool.query(`SELECT
       SUM(clicks)::INTEGER as total_clicks,
       SUM(impressions)::INTEGER as total_impressions,
       ROUND(AVG(ctr)::NUMERIC, 4) as avg_ctr,
       ROUND(AVG(position)::NUMERIC, 1) as avg_position,
       COUNT(DISTINCT query) as unique_queries,
       COUNT(DISTINCT page_url) as unique_pages
     FROM gsc_query_data
     WHERE connection_id = $1 AND date >= CURRENT_DATE - $2::INTEGER`, [connectionId, days]);
    return result.rows[0];
}
async function getOverviewTrend(connectionId, days = 28) {
    const result = await pool.query(`SELECT date,
            SUM(clicks)::INTEGER as clicks,
            SUM(impressions)::INTEGER as impressions,
            ROUND(AVG(ctr)::NUMERIC, 4) as ctr,
            ROUND(AVG(position)::NUMERIC, 1) as position
     FROM gsc_query_data
     WHERE connection_id = $1 AND date >= CURRENT_DATE - $2::INTEGER
     GROUP BY date
     ORDER BY date ASC`, [connectionId, days]);
    return result.rows;
}
// ========== CTR Opportunities ==========
async function getCtrOpportunities(connectionId, days = 28) {
    // High impressions but low CTR = opportunity to improve title/description
    const result = await pool.query(`SELECT query,
            SUM(clicks)::INTEGER as clicks,
            SUM(impressions)::INTEGER as impressions,
            ROUND(AVG(ctr)::NUMERIC, 4) as ctr,
            ROUND(AVG(position)::NUMERIC, 1) as position
     FROM gsc_query_data
     WHERE connection_id = $1 AND date >= CURRENT_DATE - $2::INTEGER
     GROUP BY query
     HAVING SUM(impressions) >= 50 AND AVG(ctr) < 0.03 AND AVG(position) <= 20
     ORDER BY SUM(impressions) DESC
     LIMIT 25`, [connectionId, days]);
    return result.rows;
}
// ========== Cannibalisation Detection ==========
async function getCannibalisation(connectionId, days = 28) {
    // Queries where multiple pages rank -- potential cannibalisation
    const result = await pool.query(`WITH query_pages AS (
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
     LIMIT 100`, [connectionId, days]);
    // Group by query
    const grouped = {};
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
async function getPageKeywords(connectionId, pageUrl, days = 28) {
    const result = await pool.query(`SELECT query,
            SUM(clicks)::INTEGER as clicks,
            SUM(impressions)::INTEGER as impressions,
            ROUND(AVG(ctr)::NUMERIC, 4) as ctr,
            ROUND(AVG(position)::NUMERIC, 1) as position
     FROM gsc_query_data
     WHERE connection_id = $1 AND page_url = $2 AND date >= CURRENT_DATE - $3::INTEGER
     GROUP BY query
     ORDER BY SUM(clicks) DESC
     LIMIT 20`, [connectionId, pageUrl, days]);
    return result.rows;
}
// ========== Data Retention Cleanup ==========
async function cleanupOldData(connectionId, retentionDays) {
    const result = await pool.query(`DELETE FROM gsc_query_data
     WHERE connection_id = $1 AND date < CURRENT_DATE - $2::INTEGER`, [connectionId, retentionDays]);
    return result.rowCount ?? 0;
}
// ========== Sync All Connections ==========
async function getAllConnectionsForSync() {
    const result = await pool.query(`SELECT gc.id, gc.site_id, gc.gsc_property, gc.last_sync_at,
            tl.gsc_data_retention_days
     FROM gsc_connections gc
     JOIN subscriptions s ON s.user_id = gc.user_id AND s.status IN ('active', 'trialing')
     LEFT JOIN tier_limits tl ON tl.tier = s.tier
     WHERE gc.sync_status != 'syncing'
     ORDER BY gc.last_sync_at ASC NULLS FIRST`);
    return result.rows;
}
//# sourceMappingURL=gsc.service.js.map