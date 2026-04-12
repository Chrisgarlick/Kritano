"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seoRouter = void 0;
const express_1 = require("express");
const seo_service_js_1 = require("../services/seo.service.js");
const router = (0, express_1.Router)();
exports.seoRouter = router;
/**
 * GET /api/seo
 * Public endpoint — returns all SEO entries for frontend consumption.
 * Cached by the frontend on app load.
 */
router.get('/', async (_req, res) => {
    try {
        const entries = await (0, seo_service_js_1.getAllSeoEntries)();
        // Cache for 5 minutes
        res.set('Cache-Control', 'public, max-age=300');
        res.json({ entries });
    }
    catch (error) {
        console.error('Public SEO entries error:', error);
        res.status(500).json({ error: 'Failed to load SEO entries' });
    }
});
//# sourceMappingURL=seo.js.map