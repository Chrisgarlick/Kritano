/**
 * Public Pages SSR Routes
 *
 * Serves fully rendered HTML for public marketing pages.
 * These routes take priority over the SPA catch-all in nginx,
 * ensuring crawlers and fetch tools see complete content.
 */
declare const router: import("express-serve-static-core").Router;
export { router as publicSsrRouter };
//# sourceMappingURL=public-ssr.d.ts.map