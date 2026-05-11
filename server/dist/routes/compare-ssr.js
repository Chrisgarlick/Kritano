"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareSsrRouter = void 0;
const express_1 = require("express");
const ssr_shared_service_js_1 = require("../services/ssr-shared.service.js");
const compare_ssr_service_js_1 = require("../services/compare-ssr.service.js");
const router = (0, express_1.Router)();
exports.compareSsrRouter = router;
const SSR_CACHE = 'public, max-age=300, stale-while-revalidate=86400';
// GET /compare - Landing page with optional filtering and pagination
router.get('/', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const type = req.query.type || undefined;
        const html = (0, compare_ssr_service_js_1.renderCompareLanding)({ page, type });
        (0, ssr_shared_service_js_1.setSsrHeaders)(res);
        res.set('Cache-Control', SSR_CACHE);
        res.send(html);
    }
    catch (error) {
        console.error('Compare landing SSR error:', error);
        res.status(500).send('Internal server error');
    }
});
// GET /compare/:slug - Detail page
router.get('/:slug', (req, res) => {
    try {
        const html = (0, compare_ssr_service_js_1.renderCompareDetail)(req.params.slug);
        if (!html) {
            res.status(404).send('Not found');
            return;
        }
        (0, ssr_shared_service_js_1.setSsrHeaders)(res);
        res.set('Cache-Control', SSR_CACHE);
        res.send(html);
    }
    catch (error) {
        console.error('Compare detail SSR error:', error);
        res.status(500).send('Internal server error');
    }
});
//# sourceMappingURL=compare-ssr.js.map