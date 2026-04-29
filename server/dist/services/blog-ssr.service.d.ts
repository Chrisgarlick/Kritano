/**
 * Blog SSR Service
 *
 * Renders blog posts and listing pages as complete HTML documents server-side.
 * This ensures search engines see fully rendered content without needing
 * JavaScript execution or Puppeteer pre-rendering.
 */
import type { BlogPost, PostSummary } from '../types/blog.types.js';
/**
 * Render a single blog post as a complete HTML page.
 */
export declare function renderBlogPost(post: BlogPost): string;
/**
 * Render the blog listing page as a complete HTML page.
 */
export declare function renderBlogListing(posts: PostSummary[], total: number, page: number, totalPages: number, category?: string, tag?: string): string;
/**
 * Render a 404 page for missing blog posts.
 */
export declare function renderBlogNotFound(): string;
//# sourceMappingURL=blog-ssr.service.d.ts.map