"use strict";
/**
 * Public Pages SSR Routes
 *
 * Serves fully rendered HTML for public marketing pages.
 * These routes take priority over the SPA catch-all in nginx,
 * ensuring crawlers and fetch tools see complete content.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicSsrRouter = void 0;
const express_1 = require("express");
const ssr_shared_service_js_1 = require("../services/ssr-shared.service.js");
const public_ssr_service_js_1 = require("../services/public-ssr.service.js");
const router = (0, express_1.Router)();
exports.publicSsrRouter = router;
const SSR_CACHE = 'public, max-age=300, stale-while-revalidate=86400';
// GET / - Homepage
router.get('/', (_req, res) => {
    try {
        const html = (0, public_ssr_service_js_1.renderHomepage)();
        (0, ssr_shared_service_js_1.setSsrHeaders)(res);
        res.set('Cache-Control', SSR_CACHE);
        res.send(html);
    }
    catch (error) {
        console.error('Homepage SSR error:', error);
        res.status(500).send('Internal server error');
    }
});
//# sourceMappingURL=public-ssr.js.map