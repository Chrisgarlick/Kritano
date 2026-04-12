/**
 * Blog Service
 *
 * Post CRUD, slug generation, revision management, reading time calculation.
 */
import type { BlogPost, PostSummary, CreatePostInput, UpdatePostInput, PostFilters, BlogPostRevision, CmsStats } from '../types/blog.types.js';
export declare function listPosts(filters?: PostFilters): Promise<{
    posts: PostSummary[];
    total: number;
}>;
export declare function listPublishedPosts(filters: {
    category?: string;
    tag?: string;
    page?: number;
    limit?: number;
}): Promise<{
    posts: PostSummary[];
    total: number;
}>;
export declare function getPostById(id: string): Promise<BlogPost | null>;
export declare function getPostBySlug(slug: string): Promise<BlogPost | null>;
export declare function createPost(input: CreatePostInput, authorId: string, authorName: string): Promise<BlogPost>;
export declare function updatePost(id: string, input: UpdatePostInput, editorId: string, revisionNote?: string): Promise<BlogPost | null>;
export declare function deletePost(id: string): Promise<boolean>;
export declare function publishPost(id: string): Promise<BlogPost | null>;
export declare function unpublishPost(id: string): Promise<BlogPost | null>;
export declare function incrementViewCount(postId: string, sessionKey: string): Promise<void>;
export declare function listRevisions(postId: string): Promise<BlogPostRevision[]>;
export declare function restoreRevision(postId: string, revisionId: string, editorId: string): Promise<BlogPost | null>;
export declare function getPublishedCategories(): Promise<Array<{
    category: string;
    count: number;
}>>;
export declare function getCmsStats(): Promise<CmsStats>;
export declare function getRelatedPosts(postId: string, category: string, tags: string[], manualIds: string[], limit?: number): Promise<PostSummary[]>;
export declare function getPublishedPostsForSitemap(): Promise<Array<{
    slug: string;
    updated_at: string;
}>>;
export declare function getLatestPublishedPosts(limit?: number): Promise<BlogPost[]>;
//# sourceMappingURL=blog.service.d.ts.map