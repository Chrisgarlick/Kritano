"use strict";
/**
 * Public Blog Routes (no auth required)
 *
 * List published posts, view post by slug, categories, sitemap, RSS feed.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogRouter = void 0;
const express_1 = require("express");
const blog_service_js_1 = require("../services/blog.service.js");
const router = (0, express_1.Router)();
exports.blogRouter = router;
// GET /api/blog/posts
router.get('/posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 12, 50);
        const category = req.query.category;
        const tag = req.query.tag;
        const result = await (0, blog_service_js_1.listPublishedPosts)({ category, tag, page, limit });
        res.json({
            posts: result.posts,
            total: result.total,
            page,
            totalPages: Math.ceil(result.total / limit),
        });
    }
    catch (error) {
        console.error('List blog posts error:', error);
        res.status(500).json({ error: 'Failed to load posts' });
    }
});
// GET /api/blog/posts/:slug
router.get('/posts/:slug', async (req, res) => {
    try {
        const post = await (0, blog_service_js_1.getPostBySlug)(req.params.slug);
        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }
        // Increment view count (debounced by IP)
        const sessionKey = (req.ip || req.headers['x-forwarded-for'] || 'unknown');
        (0, blog_service_js_1.incrementViewCount)(post.id, sessionKey).catch(err => console.error('Blog view count increment failed:', err));
        res.json({ post });
    }
    catch (error) {
        console.error('Get blog post error:', error);
        res.status(500).json({ error: 'Failed to load post' });
    }
});
// GET /api/blog/posts/:slug/related
router.get('/posts/:slug/related', async (req, res) => {
    try {
        const post = await (0, blog_service_js_1.getPostBySlug)(req.params.slug);
        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }
        const posts = await (0, blog_service_js_1.getRelatedPosts)(post.id, post.category, post.tags, post.related_post_ids || [], 3);
        res.json({ posts });
    }
    catch (error) {
        console.error('Get related posts error:', error);
        res.status(500).json({ error: 'Failed to load related posts' });
    }
});
// GET /api/blog/categories
router.get('/categories', async (_req, res) => {
    try {
        const categories = await (0, blog_service_js_1.getPublishedCategories)();
        res.json({ categories });
    }
    catch (error) {
        console.error('Get blog categories error:', error);
        res.status(500).json({ error: 'Failed to load categories' });
    }
});
// GET /api/blog/sitemap.xml
router.get('/sitemap.xml', async (_req, res) => {
    try {
        const posts = await (0, blog_service_js_1.getPublishedPostsForSitemap)();
        const baseUrl = process.env.APP_URL || 'https://kritano.com';
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/blog</loc>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
        for (const post of posts) {
            xml += '  <url>\n';
            xml += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
            xml += `    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>\n`;
            xml += '    <priority>0.6</priority>\n';
            xml += '  </url>\n';
        }
        xml += '</urlset>';
        res.set('Content-Type', 'application/xml');
        res.send(xml);
    }
    catch (error) {
        console.error('Generate sitemap error:', error);
        res.status(500).json({ error: 'Failed to generate sitemap' });
    }
});
// GET /api/blog/feed.xml (RSS/Atom)
router.get('/feed.xml', async (_req, res) => {
    try {
        const posts = await (0, blog_service_js_1.getLatestPublishedPosts)(20);
        const baseUrl = process.env.APP_URL || 'https://kritano.com';
        const now = new Date().toISOString();
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<feed xmlns="http://www.w3.org/2005/Atom">\n';
        xml += '  <title>Kritano Blog</title>\n';
        xml += `  <link href="${baseUrl}/blog" rel="alternate" />\n`;
        xml += `  <link href="${baseUrl}/api/blog/feed.xml" rel="self" />\n`;
        xml += `  <id>${baseUrl}/blog</id>\n`;
        xml += `  <updated>${now}</updated>\n`;
        xml += '  <author><name>Kritano</name></author>\n';
        for (const post of posts) {
            const content = blocksToPlainText(post.content);
            xml += '  <entry>\n';
            xml += `    <title>${escapeXml(post.title)}</title>\n`;
            xml += `    <link href="${baseUrl}/blog/${post.slug}" rel="alternate" />\n`;
            xml += `    <id>${baseUrl}/blog/${post.slug}</id>\n`;
            xml += `    <published>${post.published_at || post.created_at}</published>\n`;
            xml += `    <updated>${post.updated_at}</updated>\n`;
            xml += `    <summary>${escapeXml(post.excerpt)}</summary>\n`;
            xml += `    <content type="text">${escapeXml(content.substring(0, 2000))}</content>\n`;
            xml += `    <author><name>${escapeXml(post.author_name)}</name></author>\n`;
            for (const tag of post.tags) {
                xml += `    <category term="${escapeXml(tag)}" />\n`;
            }
            xml += '  </entry>\n';
        }
        xml += '</feed>';
        res.set('Content-Type', 'application/atom+xml');
        res.send(xml);
    }
    catch (error) {
        console.error('Generate RSS feed error:', error);
        res.status(500).json({ error: 'Failed to generate feed' });
    }
});
function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
function blocksToPlainText(blocks) {
    const parts = [];
    for (const block of blocks) {
        const props = block.props;
        switch (block.type) {
            case 'text':
                parts.push(props.markdown || '');
                break;
            case 'heading':
                parts.push(props.text || '');
                break;
            case 'callout':
                parts.push(props.markdown || '');
                break;
            case 'quote':
                parts.push(props.text || '');
                break;
            case 'code':
                parts.push(props.code || '');
                break;
            case 'stat_highlight':
                parts.push(`${props.stat || ''} — ${props.description || ''}`);
                break;
        }
    }
    return parts.join('\n\n');
}
//# sourceMappingURL=blog.js.map