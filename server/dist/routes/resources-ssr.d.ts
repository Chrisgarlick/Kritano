/**
 * Gated Resources SSR Routes.
 *
 *   GET  /resources                       — list page
 *   GET  /resources/:slug                 — detail page (form or direct links)
 *   POST /resources/:slug/request         — form handler → 303 → thanks
 *   GET  /resources/:slug/thanks?token=…  — success page with download buttons
 *
 * The JSON API endpoints (POST /api/resources/:slug/request and
 * GET /api/resources/:slug/download/:format) live in routes/resources/index.ts.
 *
 * See /docs/gated-resources.md for the feature plan.
 */
export declare const resourcesSsrRouter: import("express-serve-static-core").Router;
//# sourceMappingURL=resources-ssr.d.ts.map