/**
 * Blog SSR Routes
 *
 * Serves fully rendered HTML for blog pages directly from the database.
 * No JavaScript execution or pre-rendering needed - Google gets real HTML
 * with content, meta tags, and structured data on the first request.
 */
declare const router: import("express-serve-static-core").Router;
export { router as blogSsrRouter };
//# sourceMappingURL=blog-ssr.d.ts.map