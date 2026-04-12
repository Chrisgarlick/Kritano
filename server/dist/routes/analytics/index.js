"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPool = setPool;
const express_1 = require("express");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const site_middleware_js_1 = require("../../middleware/site.middleware.js");
const analytics_service_js_1 = require("../../services/analytics.service.js");
const VALID_RANGES = ['7d', '30d', '90d', '1y', 'all'];
const VALID_GROUP_BY = ['day', 'week', 'month'];
function isValidRange(v) {
    return typeof v === 'string' && VALID_RANGES.includes(v);
}
function isValidGroupBy(v) {
    return typeof v === 'string' && VALID_GROUP_BY.includes(v);
}
const router = (0, express_1.Router)();
let pool;
function setPool(dbPool) {
    pool = dbPool;
    (0, analytics_service_js_1.setPool)(dbPool);
}
// All routes require authentication
router.use(auth_middleware_js_1.authenticate);
// =============================================
// USER OVERVIEW
// =============================================
/**
 * GET /api/analytics/overview
 * Get user-centric analytics overview
 */
router.get('/overview', async (req, res) => {
    try {
        const userId = req.user.id;
        const overview = await (0, analytics_service_js_1.getUserOverview)(userId);
        res.json(overview);
    }
    catch (error) {
        console.error('Get user overview error:', error);
        res.status(500).json({ error: 'Failed to get analytics overview' });
    }
});
// =============================================
// SITE ANALYTICS
// =============================================
/**
 * GET /api/analytics/sites/:siteId/scores
 * Get score history for a specific site
 */
router.get('/sites/:siteId/scores', site_middleware_js_1.loadSite, async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const { range, from, to } = req.query;
        if (range && !isValidRange(range)) {
            res.status(400).json({ error: 'Invalid range parameter. Must be one of: 7d, 30d, 90d, 1y, all' });
            return;
        }
        const options = {
            siteId,
            range: range || '30d',
        };
        if (from && to) {
            options.from = new Date(from);
            options.to = new Date(to);
        }
        const history = await (0, analytics_service_js_1.getSiteScoreHistory)(options);
        res.json(history);
    }
    catch (error) {
        console.error('Get site scores error:', error);
        res.status(500).json({ error: 'Failed to get score history' });
    }
});
/**
 * GET /api/analytics/sites/:siteId/issues
 * Get issue trends for a specific site
 */
router.get('/sites/:siteId/issues', site_middleware_js_1.loadSite, async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const { range, groupBy } = req.query;
        if (range && !isValidRange(range)) {
            res.status(400).json({ error: 'Invalid range parameter. Must be one of: 7d, 30d, 90d, 1y, all' });
            return;
        }
        if (groupBy && !isValidGroupBy(groupBy)) {
            res.status(400).json({ error: 'Invalid groupBy parameter. Must be one of: day, week, month' });
            return;
        }
        const trends = await (0, analytics_service_js_1.getIssueTrends)({
            siteId,
            range: range || '30d',
            groupBy: groupBy || 'week',
        });
        res.json(trends);
    }
    catch (error) {
        console.error('Get issue trends error:', error);
        res.status(500).json({ error: 'Failed to get issue trends' });
    }
});
// =============================================
// URL ANALYTICS
// =============================================
/**
 * GET /api/analytics/sites/:siteId/urls/:urlId
 * Get full analytics for a specific URL
 */
router.get('/sites/:siteId/urls/:urlId', site_middleware_js_1.loadSite, async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const { urlId } = req.params;
        // Verify URL belongs to site
        const urlCheck = await pool.query('SELECT id FROM site_urls WHERE id = $1 AND site_id = $2', [urlId, siteId]);
        if (urlCheck.rows.length === 0) {
            res.status(404).json({ error: 'URL not found' });
            return;
        }
        const analytics = await (0, analytics_service_js_1.getUrlAnalytics)(urlId, siteId);
        res.json(analytics);
    }
    catch (error) {
        console.error('Get URL analytics error:', error);
        if (error.message === 'URL not found') {
            res.status(404).json({ error: 'URL not found' });
            return;
        }
        res.status(500).json({ error: 'Failed to get URL analytics' });
    }
});
/**
 * GET /api/analytics/sites/:siteId/urls/:urlId/scores
 * Get score history for a specific URL
 */
router.get('/sites/:siteId/urls/:urlId/scores', site_middleware_js_1.loadSite, async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const { urlId } = req.params;
        const { range, from, to } = req.query;
        // Verify URL belongs to site
        const urlCheck = await pool.query('SELECT id FROM site_urls WHERE id = $1 AND site_id = $2', [urlId, siteId]);
        if (urlCheck.rows.length === 0) {
            res.status(404).json({ error: 'URL not found' });
            return;
        }
        const options = {
            urlId,
            range: range || '30d',
        };
        if (from && to) {
            options.from = new Date(from);
            options.to = new Date(to);
        }
        const history = await (0, analytics_service_js_1.getUrlScoreHistory)(options);
        res.json(history);
    }
    catch (error) {
        console.error('Get URL scores error:', error);
        res.status(500).json({ error: 'Failed to get URL score history' });
    }
});
// =============================================
// AUDIT COMPARISON
// =============================================
/**
 * GET /api/analytics/compare
 * Compare multiple audits
 */
router.get('/compare', async (req, res) => {
    try {
        const userId = req.user.id;
        const { audits } = req.query;
        if (!audits || typeof audits !== 'string') {
            res.status(400).json({ error: 'audits parameter is required (comma-separated audit IDs)' });
            return;
        }
        const auditIds = audits.split(',').map(id => id.trim());
        if (auditIds.length < 2 || auditIds.length > 4) {
            res.status(400).json({ error: 'Comparison requires 2-4 audits' });
            return;
        }
        // Verify all audits belong to sites the user has access to
        const verifyResult = await pool.query(`SELECT aj.id
       FROM audit_jobs aj
       JOIN sites s ON s.id = aj.site_id
       LEFT JOIN site_shares ss ON ss.site_id = s.id AND ss.user_id = $2 AND ss.accepted_at IS NOT NULL
       WHERE aj.id = ANY($1)
         AND (s.owner_id = $2 OR ss.id IS NOT NULL)`, [auditIds, userId]);
        if (verifyResult.rows.length !== auditIds.length) {
            res.status(403).json({ error: 'One or more audits not found or not accessible' });
            return;
        }
        const comparison = await (0, analytics_service_js_1.compareAudits)(auditIds);
        res.json(comparison);
    }
    catch (error) {
        console.error('Compare audits error:', error);
        if (error.message?.includes('requires')) {
            res.status(400).json({ error: 'Invalid comparison parameters' });
            return;
        }
        res.status(500).json({ error: 'Failed to compare audits' });
    }
});
// =============================================
// SITE COMPARISON
// =============================================
/**
 * GET /api/analytics/compare-sites
 * Compare multiple sites
 */
router.get('/compare-sites', async (req, res) => {
    try {
        const userId = req.user.id;
        const { sites } = req.query;
        if (!sites || typeof sites !== 'string') {
            res.status(400).json({ error: 'sites parameter is required (comma-separated site IDs)' });
            return;
        }
        const siteIds = sites.split(',').map(id => id.trim());
        if (siteIds.length < 2 || siteIds.length > 6) {
            res.status(400).json({ error: 'Comparison requires 2-6 sites' });
            return;
        }
        // Verify all sites belong to the user (owned or shared)
        const verifyResult = await pool.query(`SELECT s.id
       FROM sites s
       LEFT JOIN site_shares ss ON ss.site_id = s.id AND ss.user_id = $2 AND ss.accepted_at IS NOT NULL
       WHERE s.id = ANY($1)
         AND (s.owner_id = $2 OR ss.id IS NOT NULL)`, [siteIds, userId]);
        if (verifyResult.rows.length !== siteIds.length) {
            res.status(403).json({ error: 'One or more sites not found or not accessible' });
            return;
        }
        const comparison = await (0, analytics_service_js_1.compareSites)(siteIds);
        res.json(comparison);
    }
    catch (error) {
        console.error('Compare sites error:', error);
        if (error.message?.includes('requires')) {
            res.status(400).json({ error: 'Invalid comparison parameters' });
            return;
        }
        res.status(500).json({ error: 'Failed to compare sites' });
    }
});
// =============================================
// USER AUDITED URLS (for URL comparison picker)
// =============================================
/**
 * GET /api/analytics/user-urls
 * Get all audited URLs across user's sites
 */
router.get('/user-urls', async (req, res) => {
    try {
        const userId = req.user.id;
        const { search, limit } = req.query;
        const urls = await (0, analytics_service_js_1.getUserAuditedUrls)(userId, search, limit ? parseInt(limit, 10) : undefined);
        res.json(urls);
    }
    catch (error) {
        console.error('Get user URLs error:', error);
        res.status(500).json({ error: 'Failed to get user URLs' });
    }
});
// =============================================
// URL COMPARISON
// =============================================
/**
 * GET /api/analytics/compare-urls
 * Compare two URLs side-by-side
 * Query: urls=siteId1:urlId1,siteId2:urlId2
 */
router.get('/compare-urls', async (req, res) => {
    try {
        const userId = req.user.id;
        const { urls } = req.query;
        if (!urls || typeof urls !== 'string') {
            res.status(400).json({ error: 'urls parameter is required (format: siteId1:urlId1,siteId2:urlId2)' });
            return;
        }
        const parts = urls.split(',').map(p => p.trim());
        if (parts.length !== 2) {
            res.status(400).json({ error: 'Exactly 2 URL specs are required' });
            return;
        }
        const urlSpecs = parts.map(part => {
            const [siteId, urlId] = part.split(':');
            return { siteId, urlId };
        });
        if (urlSpecs.some(s => !s.siteId || !s.urlId)) {
            res.status(400).json({ error: 'Invalid URL spec format. Use siteId:urlId' });
            return;
        }
        // Verify user has access to both sites
        const siteIds = urlSpecs.map(s => s.siteId);
        const verifyResult = await pool.query(`SELECT s.id
       FROM sites s
       LEFT JOIN site_shares ss ON ss.site_id = s.id AND ss.user_id = $2 AND ss.accepted_at IS NOT NULL
       WHERE s.id = ANY($1)
         AND (s.owner_id = $2 OR ss.id IS NOT NULL)`, [siteIds, userId]);
        const accessibleSiteIds = new Set(verifyResult.rows.map((r) => r.id));
        if (!siteIds.every(id => accessibleSiteIds.has(id))) {
            res.status(403).json({ error: 'One or more sites not found or not accessible' });
            return;
        }
        const comparison = await (0, analytics_service_js_1.compareUrls)(urlSpecs);
        res.json(comparison);
    }
    catch (error) {
        console.error('Compare URLs error:', error);
        if (error.message?.includes('not found') || error.message?.includes('No audit data')) {
            res.status(404).json({ error: 'URL or audit data not found' });
            return;
        }
        res.status(500).json({ error: 'Failed to compare URLs' });
    }
});
// =============================================
// Issue Waterfall
// =============================================
router.get('/sites/:siteId/waterfall', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const { siteId } = req.params;
        const userId = req.user.id;
        const data = await (0, analytics_service_js_1.getIssueWaterfall)(siteId, userId);
        res.json(data);
    }
    catch (error) {
        console.error('Issue waterfall error:', error);
        res.status(500).json({ error: 'Failed to get issue waterfall' });
    }
});
// =============================================
// Fix Velocity
// =============================================
router.get('/sites/:siteId/fix-velocity', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const { siteId } = req.params;
        const userId = req.user.id;
        const data = await (0, analytics_service_js_1.getFixVelocity)(siteId, userId);
        res.json(data);
    }
    catch (error) {
        console.error('Fix velocity error:', error);
        res.status(500).json({ error: 'Failed to get fix velocity' });
    }
});
// =============================================
// Page Finding Heatmap
// =============================================
router.get('/sites/:siteId/heatmap/:auditId', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const { siteId, auditId } = req.params;
        const userId = req.user.id;
        const data = await (0, analytics_service_js_1.getPageHeatmap)(siteId, auditId, userId);
        res.json(data);
    }
    catch (error) {
        console.error('Page heatmap error:', error);
        res.status(500).json({ error: 'Failed to get page heatmap' });
    }
});
// =============================================
// Response Time Distribution
// =============================================
router.get('/sites/:siteId/response-times/:auditId', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const { auditId } = req.params;
        const userId = req.user.id;
        const data = await (0, analytics_service_js_1.getResponseTimeDistribution)(auditId, userId);
        res.json(data);
    }
    catch (error) {
        console.error('Response time distribution error:', error);
        res.status(500).json({ error: 'Failed to get response time distribution' });
    }
});
// =============================================
// Page Size Distribution
// =============================================
router.get('/sites/:siteId/page-sizes/:auditId', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const { auditId } = req.params;
        const userId = req.user.id;
        const data = await (0, analytics_service_js_1.getPageSizeDistribution)(auditId, userId);
        res.json(data);
    }
    catch (error) {
        console.error('Page size distribution error:', error);
        res.status(500).json({ error: 'Failed to get page size distribution' });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map