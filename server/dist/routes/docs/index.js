"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.docsRouter = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
/**
 * GET /api/docs
 * Redirect to the SPA docs pages
 */
router.get('/', (_req, res) => {
    res.redirect(301, '/docs');
});
exports.docsRouter = router;
//# sourceMappingURL=index.js.map