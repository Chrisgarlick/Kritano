"use strict";
/**
 * Blog SSR Routes
 *
 * Serves fully rendered HTML for blog pages directly from the database.
 * No JavaScript execution or pre-rendering needed - Google gets real HTML
 * with content, meta tags, and structured data on the first request.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogSsrRouter = void 0;
const express_1 = require("express");
const blog_service_js_1 = require("../services/blog.service.js");
const blog_ssr_service_js_1 = require("../services/blog-ssr.service.js");
const router = (0, express_1.Router)();
exports.blogSsrRouter = router;
// SSR pages serve full HTML documents, not API JSON. Override Helmet's
// restrictive API CSP with the same policy nginx uses for SPA pages.
function setSsrHeaders(res) {
    res.set('Content-Type', 'text/html');
    res.removeHeader('Content-Security-Policy');
    res.set('Content-Security-Policy', "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "font-src 'self'; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self'; " +
        "frame-src 'none'; " +
        "frame-ancestors 'self'; " +
        "base-uri 'self'");
}
// GET /blog - Blog listing page
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const category = req.query.category;
        const tag = req.query.tag;
        const result = await (0, blog_service_js_1.listPublishedPosts)({ category, tag, page, limit });
        const totalPages = Math.ceil(result.total / limit);
        const html = (0, blog_ssr_service_js_1.renderBlogListing)(result.posts, result.total, page, totalPages, category, tag);
        setSsrHeaders(res);
        res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
        res.send(html);
    }
    catch (error) {
        console.error('Blog SSR listing error:', error);
        res.status(500).send('Internal server error');
    }
});
// GET /blog/:slug - Individual blog post
router.get('/:slug', async (req, res) => {
    try {
        const post = await (0, blog_service_js_1.getPostBySlug)(req.params.slug);
        if (!post) {
            // Check for a slug redirect before returning 404
            const redirect = await (0, blog_service_js_1.getRedirectByOldSlug)(req.params.slug);
            if (redirect) {
                res.redirect(301, `/blog/${redirect.current_slug}`);
                return;
            }
            const html = (0, blog_ssr_service_js_1.renderBlogNotFound)();
            setSsrHeaders(res);
            res.status(404).send(html);
            return;
        }
        // Increment view count (debounced by IP)
        const sessionKey = (req.ip || req.headers['x-forwarded-for'] || 'unknown');
        (0, blog_service_js_1.incrementViewCount)(post.id, sessionKey).catch(err => console.error('Blog view count increment failed:', err));
        const html = (0, blog_ssr_service_js_1.renderBlogPost)(post);
        setSsrHeaders(res);
        res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=120');
        res.send(html);
    }
    catch (error) {
        console.error('Blog SSR post error:', error);
        res.status(500).send('Internal server error');
    }
});
//# sourceMappingURL=blog-ssr.js.map