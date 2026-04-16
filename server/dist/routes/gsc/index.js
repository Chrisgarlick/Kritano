"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gscRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const site_service_js_1 = require("../../services/site.service.js");
const index_js_1 = require("../../db/index.js");
const gsc_service_js_1 = require("../../services/gsc.service.js");
const router = (0, express_1.Router)();
// All GSC routes require authentication
router.use(auth_middleware_js_1.authenticate);
// ========== Verified Domains ==========
// Get user's verified sites (for the connect dropdown)
router.get('/domains', async (req, res) => {
    try {
        const result = await index_js_1.pool.query(`SELECT s.id, s.domain, s.verified
       FROM sites s
       WHERE s.owner_id = $1 AND s.verified = TRUE
       ORDER BY s.domain ASC`, [req.user.id]);
        res.json({ domains: result.rows });
    }
    catch (error) {
        console.error('GSC domains list error:', error);
        res.status(500).json({ error: 'Failed to list domains' });
    }
});
// ========== Connection Management ==========
// Get all GSC connections for the current user
router.get('/connections', async (req, res) => {
    try {
        const connections = await (0, gsc_service_js_1.getConnectionsByUser)(req.user.id);
        res.json({ connections });
    }
    catch (error) {
        console.error('GSC connections list error:', error);
        res.status(500).json({ error: 'Failed to list connections' });
    }
});
// Get GSC connection for a specific domain
router.get('/connections/:siteId', async (req, res) => {
    try {
        const connection = await (0, gsc_service_js_1.getConnection)(req.params.siteId);
        res.json({ connection });
    }
    catch (error) {
        console.error('GSC connection error:', error);
        res.status(500).json({ error: 'Failed to get connection' });
    }
});
// Generate OAuth URL to connect GSC
router.post('/connect', async (req, res) => {
    try {
        const { siteId } = zod_1.z.object({ siteId: zod_1.z.string().uuid() }).parse(req.body);
        // Check tier limits (NULL = unlimited for enterprise)
        const limits = await (0, site_service_js_1.getUserTierLimits)(req.user.id);
        const gscProperties = limits?.gsc_properties;
        if (gscProperties === 0) {
            res.status(403).json({ error: 'Search Console integration is not available on your current plan.' });
            return;
        }
        // Check current connection count (skip if NULL = unlimited)
        if (gscProperties !== null) {
            const connections = await (0, gsc_service_js_1.getConnectionsByUser)(req.user.id);
            if (connections.length >= gscProperties) {
                res.status(403).json({
                    error: `Your plan allows ${gscProperties} Search Console connection${gscProperties === 1 ? '' : 's'}. Please disconnect one first.`,
                });
                return;
            }
        }
        const { url, state } = (0, gsc_service_js_1.generateGscAuthUrl)(siteId);
        res.json({ url, state });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Invalid domain ID' });
            return;
        }
        console.error('GSC connect error:', error);
        res.status(500).json({ error: 'Failed to generate auth URL' });
    }
});
// Handle OAuth callback
router.post('/callback', async (req, res) => {
    try {
        const { code, siteId } = zod_1.z.object({
            code: zod_1.z.string().min(1),
            siteId: zod_1.z.string().uuid(),
        }).parse(req.body);
        const result = await (0, gsc_service_js_1.handleGscCallback)(code, siteId, req.user.id);
        res.json({
            success: true,
            connectionId: result.connectionId,
            property: result.property,
        });
    }
    catch (error) {
        console.error('GSC callback error:', error);
        res.status(400).json({ error: error.message || 'Failed to connect Search Console' });
    }
});
// Disconnect GSC
router.delete('/connections/:siteId', async (req, res) => {
    try {
        await (0, gsc_service_js_1.disconnectGsc)(req.params.siteId, req.user.id);
        res.json({ success: true });
    }
    catch (error) {
        console.error('GSC disconnect error:', error);
        res.status(500).json({ error: 'Failed to disconnect' });
    }
});
// Trigger manual sync
router.post('/connections/:connectionId/sync', async (req, res) => {
    try {
        const connectionId = req.params.connectionId;
        // Check if this connection has any data - if not, do a full 90-day backfill
        const dataCheck = await index_js_1.pool.query(`SELECT COUNT(*) as cnt FROM gsc_query_data WHERE connection_id = $1 LIMIT 1`, [connectionId]);
        const hasData = parseInt(dataCheck.rows[0].cnt, 10) > 0;
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 3);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - (hasData ? 7 : 90));
        const format = (d) => d.toISOString().split('T')[0];
        console.log(`GSC manual sync: ${format(startDate)} to ${format(endDate)}${!hasData ? ' (backfill)' : ''}`);
        const rows = await (0, gsc_service_js_1.syncQueryData)(connectionId, format(startDate), format(endDate));
        res.json({ success: true, rowsSynced: rows });
    }
    catch (error) {
        console.error('GSC manual sync error:', error);
        res.status(500).json({ error: error.message || 'Sync failed' });
    }
});
// ========== Analytics Endpoints ==========
// Overview stats
router.get('/data/:connectionId/overview', async (req, res) => {
    try {
        const days = Math.min(parseInt(req.query.days) || 28, 365);
        const [stats, trend] = await Promise.all([
            (0, gsc_service_js_1.getOverviewStats)(req.params.connectionId, days),
            (0, gsc_service_js_1.getOverviewTrend)(req.params.connectionId, days),
        ]);
        res.json({ stats, trend });
    }
    catch (error) {
        console.error('GSC overview error:', error);
        res.status(500).json({ error: 'Failed to get overview' });
    }
});
// Top queries
router.get('/data/:connectionId/queries', async (req, res) => {
    try {
        const result = await (0, gsc_service_js_1.getTopQueries)({
            connectionId: req.params.connectionId,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            device: req.query.device,
            country: req.query.country,
            search: req.query.search,
            sortBy: req.query.sortBy,
            sortDir: req.query.sortDir,
            limit: Math.min(parseInt(req.query.limit) || 50, 100),
            offset: parseInt(req.query.offset) || 0,
        });
        res.json(result);
    }
    catch (error) {
        console.error('GSC queries error:', error);
        res.status(500).json({ error: 'Failed to get queries' });
    }
});
// Top pages
router.get('/data/:connectionId/pages', async (req, res) => {
    try {
        const result = await (0, gsc_service_js_1.getTopPages)({
            connectionId: req.params.connectionId,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            device: req.query.device,
            search: req.query.search,
            sortBy: req.query.sortBy,
            sortDir: req.query.sortDir,
            limit: Math.min(parseInt(req.query.limit) || 50, 100),
            offset: parseInt(req.query.offset) || 0,
        });
        res.json(result);
    }
    catch (error) {
        console.error('GSC pages error:', error);
        res.status(500).json({ error: 'Failed to get pages' });
    }
});
// Query trend
router.get('/data/:connectionId/queries/:query/trend', async (req, res) => {
    try {
        const days = Math.min(parseInt(req.query.days) || 28, 365);
        const trend = await (0, gsc_service_js_1.getQueryTrend)(req.params.connectionId, decodeURIComponent(req.params.query), days);
        res.json({ trend });
    }
    catch (error) {
        console.error('GSC query trend error:', error);
        res.status(500).json({ error: 'Failed to get trend' });
    }
});
// CTR opportunities
router.get('/data/:connectionId/opportunities', async (req, res) => {
    try {
        const days = Math.min(parseInt(req.query.days) || 28, 365);
        const opportunities = await (0, gsc_service_js_1.getCtrOpportunities)(req.params.connectionId, days);
        res.json({ opportunities });
    }
    catch (error) {
        console.error('GSC opportunities error:', error);
        res.status(500).json({ error: 'Failed to get opportunities' });
    }
});
// Cannibalisation detection
router.get('/data/:connectionId/cannibalisation', async (req, res) => {
    try {
        const days = Math.min(parseInt(req.query.days) || 28, 365);
        const results = await (0, gsc_service_js_1.getCannibalisation)(req.params.connectionId, days);
        res.json({ cannibalisation: results });
    }
    catch (error) {
        console.error('GSC cannibalisation error:', error);
        res.status(500).json({ error: 'Failed to detect cannibalisation' });
    }
});
// Page keywords (for a specific URL)
router.get('/data/:connectionId/page-keywords', async (req, res) => {
    try {
        const pageUrl = req.query.url;
        if (!pageUrl) {
            res.status(400).json({ error: 'url parameter is required' });
            return;
        }
        const days = Math.min(parseInt(req.query.days) || 28, 365);
        const keywords = await (0, gsc_service_js_1.getPageKeywords)(req.params.connectionId, pageUrl, days);
        res.json({ keywords });
    }
    catch (error) {
        console.error('GSC page keywords error:', error);
        res.status(500).json({ error: 'Failed to get page keywords' });
    }
});
exports.gscRouter = router;
//# sourceMappingURL=index.js.map