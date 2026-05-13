/**
 * Blog SSR Service
 *
 * Renders blog posts and listing pages as complete HTML documents server-side.
 * This ensures search engines see fully rendered content without needing
 * JavaScript execution or Puppeteer pre-rendering.
 */
import type { BlogPost, PostSummary } from '../types/blog.types.js';
import type { GatedResource } from '../types/gated-resource.types.js';
/**
 * Returns the slug of the anchor resource for a blog category, or null if
 * the category has no associated anchor. Always falls back to the Website
 * Health Checklist for categories we plan to add later, so every post gets
 * a CTA card.
 */
export declare function anchorSlugForCategory(category: string): string | null;
/**
 * Render a single blog post as a complete HTML page.
 */
/**
 * Render the end-of-post resource anchor card. Returns an empty string when
 * no resource is supplied (category has no anchor, or the resource lookup
 * came back null/unpublished), so callers can interpolate the result
 * unconditionally.
 */
export declare function renderResourceAnchor(resource: GatedResource | null): string;
export declare function renderBlogPost(post: BlogPost, anchorResource?: GatedResource | null): string;
/**
 * Render the blog listing page as a complete HTML page.
 */
export declare function renderBlogListing(posts: PostSummary[], total: number, page: number, totalPages: number, category?: string, tag?: string): string;
/**
 * Render a 404 page for missing blog posts.
 */
export declare function renderBlogNotFound(): string;
//# sourceMappingURL=blog-ssr.service.d.ts.map