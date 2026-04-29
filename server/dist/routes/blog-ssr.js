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
        res.set('Content-Type', 'text/html');
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
            const html = (0, blog_ssr_service_js_1.renderBlogNotFound)();
            res.status(404).set('Content-Type', 'text/html').send(html);
            return;
        }
        // Increment view count (debounced by IP)
        const sessionKey = (req.ip || req.headers['x-forwarded-for'] || 'unknown');
        (0, blog_service_js_1.incrementViewCount)(post.id, sessionKey).catch(err => console.error('Blog view count increment failed:', err));
        const html = (0, blog_ssr_service_js_1.renderBlogPost)(post);
        res.set('Content-Type', 'text/html');
        res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=120');
        res.send(html);
    }
    catch (error) {
        console.error('Blog SSR post error:', error);
        res.status(500).send('Internal server error');
    }
});
//# sourceMappingURL=blog-ssr.js.map