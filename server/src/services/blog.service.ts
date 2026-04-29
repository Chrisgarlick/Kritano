/**
 * Blog Service
 *
 * Post CRUD, slug generation, revision management, reading time calculation.
 */

import { pool } from '../db/index.js';
import type {
  BlogPost,
  PostSummary,
  CreatePostInput,
  UpdatePostInput,
  PostFilters,
  ContentBlock,
  BlogPostRevision,
  CmsStats,
} from '../types/blog.types.js';

const MAX_REVISIONS_PER_POST = 20;

// ── Slug generation ──

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 180);
}

async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title);
  if (!base) return `post-${Date.now()}`;

  let slug = base;
  let counter = 0;

  while (true) {
    const check = excludeId
      ? await pool.query('SELECT id FROM blog_posts WHERE slug = $1 AND id != $2', [slug, excludeId])
      : await pool.query('SELECT id FROM blog_posts WHERE slug = $1', [slug]);

    if (check.rows.length === 0) return slug;

    counter++;
    slug = `${base}-${counter}`;
  }
}

// ── Reading time calculation ──

function calculateReadingTime(content: ContentBlock[]): number {
  let wordCount = 0;

  function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  function processBlocks(blocks: ContentBlock[]): void {
    for (const block of blocks) {
      const props = block.props as Record<string, unknown>;
      switch (block.type) {
        case 'text':
          wordCount += countWords((props.content as string) || '');
          break;
        case 'heading':
          wordCount += countWords((props.text as string) || '');
          break;
        case 'callout':
          wordCount += countWords((props.body as string) || '');
          if (props.title) wordCount += countWords(props.title as string);
          break;
        case 'quote':
          wordCount += countWords((props.text as string) || '');
          break;
        case 'code':
          wordCount += countWords((props.code as string) || '') * 0.5; // code reads slower
          break;
        case 'stat_highlight':
          wordCount += countWords((props.stat as string) || '');
          wordCount += countWords((props.description as string) || '');
          break;
        case 'cta':
          wordCount += countWords((props.text as string) || '');
          break;
        case 'two_column':
          if (Array.isArray(props.left)) processBlocks(props.left as ContentBlock[]);
          if (Array.isArray(props.right)) processBlocks(props.right as ContentBlock[]);
          break;
        case 'image':
          wordCount += 12; // images add ~3 seconds = ~12 words
          break;
      }
    }
  }

  processBlocks(content);
  return Math.max(1, Math.round(wordCount / 200)); // 200 WPM average
}

// ── Post CRUD ──

export async function listPosts(filters: PostFilters = {}): Promise<{ posts: PostSummary[]; total: number }> {
  const { status, category, search, page = 1, limit = 20 } = filters;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (status) {
    conditions.push(`status = $${paramIdx++}`);
    params.push(status);
  }

  if (category) {
    conditions.push(`category = $${paramIdx++}`);
    params.push(category);
  }

  if (search) {
    conditions.push(`(title ILIKE $${paramIdx} OR excerpt ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [postsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT id, slug, title, subtitle, excerpt, featured_image_url, category, tags,
              author_name, status, published_at, reading_time_minutes, view_count,
              created_at, updated_at
       FROM blog_posts ${where}
       ORDER BY CASE WHEN status = 'published' THEN published_at ELSE created_at END DESC NULLS LAST
       LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT COUNT(*)::int AS total FROM blog_posts ${where}`, params),
  ]);

  return {
    posts: postsResult.rows,
    total: countResult.rows[0].total,
  };
}

export async function listPublishedPosts(filters: {
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
}): Promise<{ posts: PostSummary[]; total: number }> {
  const { category, tag, page = 1, limit = 12 } = filters;
  const conditions: string[] = ["status = 'published'"];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (category) {
    conditions.push(`category = $${paramIdx++}`);
    params.push(category);
  }

  if (tag) {
    conditions.push(`$${paramIdx++} = ANY(tags)`);
    params.push(tag);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const [postsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT id, slug, title, subtitle, excerpt, featured_image_url, category, tags,
              author_name, status, published_at, reading_time_minutes, view_count,
              created_at, updated_at
       FROM blog_posts ${where}
       ORDER BY published_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT COUNT(*)::int AS total FROM blog_posts ${where}`, params),
  ]);

  return {
    posts: postsResult.rows,
    total: countResult.rows[0].total,
  };
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const result = await pool.query('SELECT * FROM blog_posts WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const result = await pool.query(
    "SELECT * FROM blog_posts WHERE slug = $1 AND status = 'published'",
    [slug]
  );
  return result.rows[0] || null;
}

export async function createPost(
  input: CreatePostInput,
  authorId: string,
  authorName: string
): Promise<BlogPost> {
  const slug = input.slug
    ? await generateUniqueSlug(input.slug)
    : await generateUniqueSlug(input.title);
  const readingTime = calculateReadingTime(input.content);

  const result = await pool.query(
    `INSERT INTO blog_posts (
      slug, title, subtitle, excerpt, featured_image_url, featured_image_alt,
      content, category, tags, author_id, author_name,
      seo_title, seo_description, focus_keyword, secondary_keywords, reading_time_minutes,
      schema_type, schema_claim_reviewed, schema_review_rating
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    RETURNING *`,
    [
      slug,
      input.title,
      input.subtitle || null,
      input.excerpt,
      input.featured_image_url || null,
      input.featured_image_alt || null,
      JSON.stringify(input.content),
      input.category,
      input.tags || [],
      authorId,
      authorName,
      input.seo_title || null,
      input.seo_description || null,
      input.focus_keyword || null,
      input.secondary_keywords || [],
      readingTime,
      input.schema_type || 'article',
      input.schema_claim_reviewed || null,
      input.schema_review_rating || null,
    ]
  );

  return result.rows[0];
}

export async function updatePost(
  id: string,
  input: UpdatePostInput,
  editorId: string,
  revisionNote?: string
): Promise<BlogPost | null> {
  const existing = await getPostById(id);
  if (!existing) return null;

  // Save revision before updating
  await saveRevision(id, existing.content, existing.title, editorId, revisionNote || 'Auto-save');

  const fields: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (input.slug !== undefined && input.slug !== null) {
    const newSlug = await generateUniqueSlug(input.slug, id);
    if (newSlug !== existing.slug) {
      // Save old slug as redirect
      await pool.query(
        `INSERT INTO blog_post_redirects (post_id, old_slug)
         VALUES ($1, $2)
         ON CONFLICT (old_slug) DO UPDATE SET post_id = $1, created_at = NOW()`,
        [id, existing.slug]
      );
      // Clean up any redirect pointing to the new slug (avoid circular redirects)
      await pool.query('DELETE FROM blog_post_redirects WHERE old_slug = $1', [newSlug]);
    }
    fields.push(`slug = $${paramIdx++}`);
    params.push(newSlug);
  }

  if (input.title !== undefined) {
    fields.push(`title = $${paramIdx++}`);
    params.push(input.title);
  }

  if (input.subtitle !== undefined) {
    fields.push(`subtitle = $${paramIdx++}`);
    params.push(input.subtitle);
  }

  if (input.excerpt !== undefined) {
    fields.push(`excerpt = $${paramIdx++}`);
    params.push(input.excerpt);
  }

  if (input.featured_image_url !== undefined) {
    fields.push(`featured_image_url = $${paramIdx++}`);
    params.push(input.featured_image_url);
  }

  if (input.featured_image_alt !== undefined) {
    fields.push(`featured_image_alt = $${paramIdx++}`);
    params.push(input.featured_image_alt);
  }

  if (input.content !== undefined) {
    fields.push(`content = $${paramIdx++}`);
    params.push(JSON.stringify(input.content));
    fields.push(`reading_time_minutes = $${paramIdx++}`);
    params.push(calculateReadingTime(input.content));
  }

  if (input.category !== undefined) {
    fields.push(`category = $${paramIdx++}`);
    params.push(input.category);
  }

  if (input.tags !== undefined) {
    fields.push(`tags = $${paramIdx++}`);
    params.push(input.tags);
  }

  if (input.seo_title !== undefined) {
    fields.push(`seo_title = $${paramIdx++}`);
    params.push(input.seo_title);
  }

  if (input.seo_description !== undefined) {
    fields.push(`seo_description = $${paramIdx++}`);
    params.push(input.seo_description);
  }

  if (input.focus_keyword !== undefined) {
    fields.push(`focus_keyword = $${paramIdx++}`);
    params.push(input.focus_keyword);
  }

  if (input.secondary_keywords !== undefined) {
    fields.push(`secondary_keywords = $${paramIdx++}`);
    params.push(input.secondary_keywords);
  }

  if (input.related_post_ids !== undefined) {
    fields.push(`related_post_ids = $${paramIdx++}`);
    params.push(input.related_post_ids);
  }

  if (input.schema_type !== undefined) {
    fields.push(`schema_type = $${paramIdx++}`);
    params.push(input.schema_type);
  }

  if (input.schema_claim_reviewed !== undefined) {
    fields.push(`schema_claim_reviewed = $${paramIdx++}`);
    params.push(input.schema_claim_reviewed);
  }

  if (input.schema_review_rating !== undefined) {
    fields.push(`schema_review_rating = $${paramIdx++}`);
    params.push(input.schema_review_rating);
  }

  if (fields.length === 0) return existing;

  fields.push(`updated_at = NOW()`);
  params.push(id);

  const result = await pool.query(
    `UPDATE blog_posts SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
    params
  );

  return result.rows[0] || null;
}

export async function deletePost(id: string): Promise<boolean> {
  const result = await pool.query(
    "UPDATE blog_posts SET status = 'archived', updated_at = NOW() WHERE id = $1",
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function publishPost(id: string): Promise<BlogPost | null> {
  const result = await pool.query(
    "UPDATE blog_posts SET status = 'published', published_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}

export async function unpublishPost(id: string): Promise<BlogPost | null> {
  const result = await pool.query(
    "UPDATE blog_posts SET status = 'draft', published_at = NULL, updated_at = NOW() WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}

// ── View counting (debounced per session) ──

const viewedPosts = new Map<string, Set<string>>();

export async function incrementViewCount(postId: string, sessionKey: string): Promise<void> {
  if (!viewedPosts.has(sessionKey)) {
    viewedPosts.set(sessionKey, new Set());
  }

  const viewed = viewedPosts.get(sessionKey)!;
  if (viewed.has(postId)) return;

  viewed.add(postId);
  await pool.query(
    'UPDATE blog_posts SET view_count = view_count + 1 WHERE id = $1',
    [postId]
  );

  // Cleanup old sessions periodically (rough LRU)
  if (viewedPosts.size > 10000) {
    const keys = Array.from(viewedPosts.keys());
    for (let i = 0; i < 5000; i++) {
      viewedPosts.delete(keys[i]);
    }
  }
}

// ── Revisions ──

async function saveRevision(
  postId: string,
  content: ContentBlock[],
  title: string,
  createdBy: string,
  note: string
): Promise<void> {
  await pool.query(
    `INSERT INTO blog_post_revisions (post_id, content, title, revision_note, created_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [postId, JSON.stringify(content), title, note, createdBy]
  );

  // Prune old revisions (keep last N)
  await pool.query(
    `DELETE FROM blog_post_revisions
     WHERE post_id = $1
       AND id NOT IN (
         SELECT id FROM blog_post_revisions
         WHERE post_id = $1
         ORDER BY created_at DESC
         LIMIT $2
       )`,
    [postId, MAX_REVISIONS_PER_POST]
  );
}

export async function listRevisions(postId: string): Promise<BlogPostRevision[]> {
  const result = await pool.query(
    `SELECT r.*, u.email AS editor_email
     FROM blog_post_revisions r
     LEFT JOIN users u ON u.id = r.created_by
     WHERE r.post_id = $1
     ORDER BY r.created_at DESC`,
    [postId]
  );
  return result.rows;
}

export async function restoreRevision(
  postId: string,
  revisionId: string,
  editorId: string
): Promise<BlogPost | null> {
  const revision = await pool.query(
    'SELECT * FROM blog_post_revisions WHERE id = $1 AND post_id = $2',
    [revisionId, postId]
  );

  if (revision.rows.length === 0) return null;

  const rev = revision.rows[0];

  // Save current state as revision first
  const existing = await getPostById(postId);
  if (existing) {
    await saveRevision(postId, existing.content, existing.title, editorId, 'Before restore');
  }

  const content = typeof rev.content === 'string' ? JSON.parse(rev.content) : rev.content;
  const readingTime = calculateReadingTime(content);

  const result = await pool.query(
    `UPDATE blog_posts
     SET content = $1, title = $2, reading_time_minutes = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [JSON.stringify(content), rev.title, readingTime, postId]
  );

  return result.rows[0] || null;
}

// ── Categories ──

export async function getPublishedCategories(): Promise<Array<{ category: string; count: number }>> {
  const result = await pool.query(
    `SELECT category, COUNT(*)::int AS count
     FROM blog_posts
     WHERE status = 'published'
     GROUP BY category
     ORDER BY count DESC`
  );
  return result.rows;
}

// ── Stats ──

export async function getCmsStats(): Promise<CmsStats> {
  const [postStats, viewStats, mediaCount, topPosts] = await Promise.all([
    pool.query(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'published')::int AS published,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS drafts,
        COUNT(*) FILTER (WHERE status = 'archived')::int AS archived
       FROM blog_posts`
    ),
    pool.query('SELECT COALESCE(SUM(view_count), 0)::int AS total_views FROM blog_posts'),
    pool.query('SELECT COUNT(*)::int AS total FROM blog_media'),
    pool.query(
      `SELECT id, title, slug, view_count, published_at
       FROM blog_posts
       WHERE status = 'published'
       ORDER BY view_count DESC
       LIMIT 10`
    ),
  ]);

  const stats = postStats.rows[0];

  return {
    totalPosts: stats.total,
    published: stats.published,
    drafts: stats.drafts,
    archived: stats.archived,
    totalViews: viewStats.rows[0].total_views,
    totalMedia: mediaCount.rows[0].total,
    topPosts: topPosts.rows,
  };
}

// ── Related posts ──

export async function getRelatedPosts(
  postId: string,
  category: string,
  tags: string[],
  manualIds: string[],
  limit: number = 3
): Promise<PostSummary[]> {
  // If manual IDs are set, fetch those (published only, preserve order)
  if (manualIds.length > 0) {
    const result = await pool.query(
      `SELECT id, slug, title, subtitle, excerpt, featured_image_url, category, tags,
              author_name, status, published_at, reading_time_minutes, view_count,
              created_at, updated_at
       FROM blog_posts
       WHERE id = ANY($1) AND status = 'published' AND id != $2
       LIMIT $3`,
      [manualIds, postId, limit]
    );
    // Preserve the manual order
    const byId = new Map(result.rows.map((r: PostSummary) => [r.id, r]));
    return manualIds
      .map(id => byId.get(id))
      .filter((p): p is PostSummary => p !== undefined)
      .slice(0, limit);
  }

  // Auto-match: score by shared tags (×3) + same category (×1), tie-break by recency
  if (tags.length === 0) {
    // No tags — just match by category
    const result = await pool.query(
      `SELECT id, slug, title, subtitle, excerpt, featured_image_url, category, tags,
              author_name, status, published_at, reading_time_minutes, view_count,
              created_at, updated_at
       FROM blog_posts
       WHERE status = 'published' AND id != $1 AND category = $2
       ORDER BY published_at DESC NULLS LAST
       LIMIT $3`,
      [postId, category, limit]
    );
    return result.rows;
  }

  const result = await pool.query(
    `SELECT id, slug, title, subtitle, excerpt, featured_image_url, category, tags,
            author_name, status, published_at, reading_time_minutes, view_count,
            created_at, updated_at,
            (
              (SELECT COUNT(*) FROM unnest(tags) t WHERE t = ANY($2)) * 3
              + CASE WHEN category = $3 THEN 1 ELSE 0 END
            ) AS relevance_score
     FROM blog_posts
     WHERE status = 'published' AND id != $1
       AND (
         tags && $2 OR category = $3
       )
     ORDER BY relevance_score DESC, published_at DESC NULLS LAST
     LIMIT $4`,
    [postId, tags, category, limit]
  );
  return result.rows;
}

// ── Sitemap & RSS helpers ──

export async function getPublishedPostsForSitemap(): Promise<Array<{ slug: string; updated_at: string }>> {
  const result = await pool.query(
    `SELECT slug, updated_at FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC`
  );
  return result.rows;
}

export async function getLatestPublishedPosts(limit: number = 20): Promise<BlogPost[]> {
  const result = await pool.query(
    `SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

// ── Redirects ──

export interface BlogRedirect {
  id: string;
  post_id: string;
  old_slug: string;
  created_at: string;
  post_title: string;
  current_slug: string;
  post_status: string;
}

export async function getRedirectByOldSlug(oldSlug: string): Promise<{ post_id: string; current_slug: string } | null> {
  const result = await pool.query(
    `SELECT r.post_id, p.slug AS current_slug
     FROM blog_post_redirects r
     JOIN blog_posts p ON p.id = r.post_id
     WHERE r.old_slug = $1`,
    [oldSlug]
  );
  return result.rows[0] || null;
}

export async function listRedirects(filters: { search?: string; page?: number; limit?: number } = {}): Promise<{ redirects: BlogRedirect[]; total: number }> {
  const { search, page = 1, limit = 50 } = filters;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (search) {
    conditions.push(`(r.old_slug ILIKE $${paramIdx} OR p.title ILIKE $${paramIdx} OR p.slug ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows, countResult] = await Promise.all([
    pool.query(
      `SELECT r.id, r.post_id, r.old_slug, r.created_at,
              p.title AS post_title, p.slug AS current_slug, p.status AS post_status
       FROM blog_post_redirects r
       JOIN blog_posts p ON p.id = r.post_id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      [...params, limit, (page - 1) * limit]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total FROM blog_post_redirects r JOIN blog_posts p ON p.id = r.post_id ${where}`,
      params
    ),
  ]);

  return { redirects: rows.rows, total: countResult.rows[0].total };
}

export async function deleteRedirect(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM blog_post_redirects WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function createRedirect(postId: string, oldSlug: string): Promise<BlogRedirect | null> {
  // Don't allow redirecting to the current slug
  const post = await getPostById(postId);
  if (!post) return null;
  if (post.slug === oldSlug) return null;

  // Don't allow if old_slug matches another post's current slug
  const conflict = await pool.query('SELECT id FROM blog_posts WHERE slug = $1', [oldSlug]);
  if (conflict.rows.length > 0) return null;

  const result = await pool.query(
    `INSERT INTO blog_post_redirects (post_id, old_slug)
     VALUES ($1, $2)
     ON CONFLICT (old_slug) DO UPDATE SET post_id = $1, created_at = NOW()
     RETURNING *`,
    [postId, oldSlug]
  );

  if (result.rows.length === 0) return null;

  const r = result.rows[0];
  return { ...r, post_title: post.title, current_slug: post.slug, post_status: post.status };
}
