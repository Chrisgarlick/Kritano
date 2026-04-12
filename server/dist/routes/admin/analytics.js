"use strict";
/**
 * Admin Analytics Routes — Phase 6
 *
 * Funnel analytics, global trends, and revenue dashboard.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAnalyticsRouter = void 0;
const express_1 = require("express");
const admin_analytics_service_js_1 = require("../../services/admin-analytics.service.js");
const router = (0, express_1.Router)();
exports.adminAnalyticsRouter = router;
/**
 * GET /api/admin/analytics/funnel?range=30d
 * Conversion funnel: Registered → Verified → First Audit → Domain Verified → Paid
 */
router.get('/funnel', async (req, res) => {
    try {
        const range = req.query.range || '30d';
        const data = await (0, admin_analytics_service_js_1.getFunnelAnalytics)(range);
        res.json(data);
    }
    catch (error) {
        console.error('Admin funnel analytics error:', error);
        res.status(500).json({ error: 'Failed to load funnel analytics', code: 'FUNNEL_ERROR' });
    }
});
/**
 * GET /api/admin/analytics/trends?range=30d
 * Global audit trends: top issues, score distribution, tier breakdown
 */
router.get('/trends', async (req, res) => {
    try {
        const range = req.query.range || '30d';
        const data = await (0, admin_analytics_service_js_1.getGlobalTrends)(range);
        res.json(data);
    }
    catch (error) {
        console.error('Admin trends analytics error:', error);
        res.status(500).json({ error: 'Failed to load trends analytics', code: 'TRENDS_ERROR' });
    }
});
/**
 * GET /api/admin/analytics/revenue
 * Revenue dashboard: MRR/ARR by tier, churn, new subscribers
 */
router.get('/revenue', async (_req, res) => {
    try {
        const data = await (0, admin_analytics_service_js_1.getRevenueAnalytics)();
        res.json(data);
    }
    catch (error) {
        console.error('Admin revenue analytics error:', error);
        res.status(500).json({ error: 'Failed to load revenue analytics', code: 'REVENUE_ERROR' });
    }
});
//# sourceMappingURL=analytics.js.map