/**
 * Blog SSR Routes
 *
 * Serves fully rendered HTML for blog pages directly from the database.
 * No JavaScript execution or pre-rendering needed - Google gets real HTML
 * with content, meta tags, and structured data on the first request.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  listPublishedPosts,
  getPostBySlug,
  incrementViewCount,
} from '../services/blog.service.js';
import {
  renderBlogPost,
  renderBlogListing,
  renderBlogNotFound,
} from '../services/blog-ssr.service.js';

const router = Router();

// SSR pages serve full HTML documents, not API JSON. Override Helmet's
// restrictive API CSP with the same policy nginx uses for SPA pages.
function setSsrHeaders(res: Response): void {
  res.set('Content-Type', 'text/html');
  res.removeHeader('Content-Security-Policy');
  res.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "font-src 'self'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self'; " +
    "frame-src 'none'; " +
    "frame-ancestors 'self'; " +
    "base-uri 'self'"
  );
}

// GET /blog - Blog listing page
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 12;
    const category = req.query.category as string | undefined;
    const tag = req.query.tag as string | undefined;

    const result = await listPublishedPosts({ category, tag, page, limit });
    const totalPages = Math.ceil(result.total / limit);

    const html = renderBlogListing(result.posts, result.total, page, totalPages, category, tag);

    setSsrHeaders(res);
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    res.send(html);
  } catch (error) {
    console.error('Blog SSR listing error:', error);
    res.status(500).send('Internal server error');
  }
});

// GET /blog/:slug - Individual blog post
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await getPostBySlug(req.params.slug);

    if (!post) {
      const html = renderBlogNotFound();
      setSsrHeaders(res);
      res.status(404).send(html);
      return;
    }

    // Increment view count (debounced by IP)
    const sessionKey = (req.ip || req.headers['x-forwarded-for'] || 'unknown') as string;
    incrementViewCount(post.id, sessionKey).catch(err =>
      console.error('Blog view count increment failed:', err)
    );

    const html = renderBlogPost(post);

    setSsrHeaders(res);
    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=120');
    res.send(html);
  } catch (error) {
    console.error('Blog SSR post error:', error);
    res.status(500).send('Internal server error');
  }
});

export { router as blogSsrRouter };
