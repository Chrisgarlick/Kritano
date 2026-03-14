# Related Blog Posts — Ultrathink Plan

## Overview/Summary

Add a "Related Posts" feature to the PagePulser blog system using a **hybrid approach**: posts are auto-matched by shared tags and category, but admins can manually override related posts via the post editor sidebar. The public blog post detail page displays up to 3 related post cards in a responsive grid between the tags section and the CTA banner.

**Why this matters:** When a reader finishes a blog post, there's currently no way to discover more content. Related posts increase page views, reduce bounce rate, and keep readers engaged with the site — all of which improve SEO signals and conversion potential.

---

## Key Decisions

### 1. Hybrid Approach: Automatic Matching with Manual Override

The `blog_posts` table gets a new `related_post_ids UUID[]` column (nullable, defaults to `'{}'`). When this array is non-empty, those IDs are used directly (manual override). When empty, the backend runs an auto-matching query scoring posts by tag overlap and category match.

**Why hybrid?** Pure automatic matching is convenient but can produce poor results for niche content. Pure manual is tedious and doesn't scale. The hybrid gives the best of both — hands-off for most posts, with fine-grained control when it matters.

### 2. Scoring Algorithm for Auto-Matching

The auto-match query uses a simple scoring system within a single SQL query:
- Each shared tag = **3 points**
- Same category = **1 point**
- Tie-breaking by `published_at DESC` (recency)
- Only include posts with `status = 'published'`
- Exclude the current post itself
- Posts with zero score (no shared tags AND different category) are excluded
- Limit to **3** results

This can be done efficiently with the existing GIN index on `tags` by using array overlap (`&&`) as a pre-filter, then scoring in SQL.

**Why this weighting?** Tags are more specific and intentional (e.g., "schema", "ai-search") while categories are broader (e.g., "seo"). A post sharing 2 tags is much more relevant than one merely sharing a category.

### 3. Display Threshold: 0 Minimum

- **0 related posts**: Section is hidden entirely — no "Related Articles" heading, no empty state
- **1-2 related posts**: Grid renders with 1-2 cards; responsive layout handles gracefully
- **3 related posts**: Full 3-column grid on desktop, stacks on mobile

No minimum limit enforced — showing 1 genuinely relevant post is better than showing 3 poor matches.

### 4. Manual Overrides Filter Unpublished Posts at Read Time

If an admin manually selects 3 related posts and one gets unpublished later, the endpoint silently filters it out and returns only 2. It does **NOT** backfill with auto-matched posts — this keeps behaviour predictable for admins. The admin UI shows a visual indicator if a manually-selected post is no longer published.

### 5. No Caching Layer Needed Initially

The query is lightweight (operates on a small table with good indexes). The existing `idx_blog_posts_tags` GIN index already supports the array overlap operator. Caching can be added later if the blog scales to hundreds of posts.

### 6. Admin Preview

Related posts do **NOT** show in the admin preview mode. The preview is for content editing, not layout elements. Related posts only appear on the public-facing detail page.

---

## Database Changes

### New Migration: `server/src/db/migrations/078_blog_related_posts.sql`

```sql
-- Migration: 078_blog_related_posts.sql
-- Add manual related post overrides to blog_posts

ALTER TABLE blog_posts
  ADD COLUMN related_post_ids UUID[] DEFAULT '{}';

COMMENT ON COLUMN blog_posts.related_post_ids IS
  'Manual override for related posts. When non-empty, these IDs are used instead of auto-matching by tags/category.';
```

No new indexes needed. The column is only read when a specific post is loaded, and the resulting lookup is a simple `WHERE id = ANY(...)` on the primary key.

---

## Backend Changes

### 1. Types — `server/src/types/blog.types.ts`

Add `related_post_ids` to the relevant interfaces:

```typescript
// In BlogPost interface:
related_post_ids: string[];

// In UpdatePostInput interface:
related_post_ids?: string[];
```

Do **NOT** add it to `CreatePostInput` (a new post has no related posts yet) or `PostSummary` (not needed in list views).

### 2. Validators — `server/src/validators/blog.validators.ts`

Add to `UpdatePostSchema`:

```typescript
related_post_ids: z.array(z.string().uuid()).max(5).optional(),
```

Cap at 5 manual overrides maximum (only 3 are displayed, but allows some buffer for admin flexibility).

### 3. Service — `server/src/services/blog.service.ts`

**New function: `getRelatedPosts`**

```typescript
export async function getRelatedPosts(
  postId: string,
  category: string,
  tags: string[],
  manualIds: string[],
  limit: number = 3
): Promise<PostSummary[]> {
  // If manual overrides exist, fetch those (filtered to published only)
  if (manualIds.length > 0) {
    const result = await pool.query(
      `SELECT id, slug, title, subtitle, excerpt, featured_image_url, category, tags,
              author_name, status, published_at, reading_time_minutes, view_count,
              created_at, updated_at
       FROM blog_posts
       WHERE id = ANY($1) AND status = 'published'
       ORDER BY array_position($1::uuid[], id)
       LIMIT $2`,
      [manualIds, limit]
    );
    return result.rows;
  }

  // Auto-match: score by tag overlap + category match
  const result = await pool.query(
    `SELECT id, slug, title, subtitle, excerpt, featured_image_url, category, tags,
            author_name, status, published_at, reading_time_minutes, view_count,
            created_at, updated_at,
            (COALESCE(array_length(ARRAY(
              SELECT unnest(tags) INTERSECT SELECT unnest($2::text[])
            ), 1), 0) * 3
            + CASE WHEN category = $3 THEN 1 ELSE 0 END) AS relevance_score
     FROM blog_posts
     WHERE id != $1
       AND status = 'published'
       AND (tags && $2::text[] OR category = $3)
     ORDER BY relevance_score DESC, published_at DESC
     LIMIT $4`,
    [postId, tags, category, limit]
  );
  return result.rows;
}
```

Key notes:
- `array_position` preserves the admin's chosen ordering for manual overrides
- The `tags && $2::text[]` operator (array overlap) uses the existing GIN index
- The `INTERSECT` approach counts exact tag matches between the two arrays
- The `relevance_score` is computed inline — no extra table scan

**Update existing `updatePost` function:**

Add handling for the new field following the same pattern as existing optional fields:

```typescript
if (input.related_post_ids !== undefined) {
  fields.push(`related_post_ids = $${paramIdx++}`);
  params.push(input.related_post_ids);
}
```

### 4. Public Route — `server/src/routes/blog.ts`

Add a new public endpoint:

```typescript
// GET /api/blog/posts/:slug/related
router.get('/posts/:slug/related', async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await getPostBySlug(req.params.slug);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const related = await getRelatedPosts(
      post.id,
      post.category,
      post.tags,
      post.related_post_ids || []
    );

    res.json({ posts: related });
  } catch (error) {
    console.error('Get related posts error:', error);
    res.status(500).json({ error: 'Failed to load related posts' });
  }
});
```

### 5. Admin Route — `server/src/routes/admin/cms.ts`

No new routes needed. The existing `PATCH /api/admin/cms/posts/:id` route already calls `updatePost` with the validated body. The `UpdatePostSchema` addition handles `related_post_ids` automatically.

The existing `GET /api/admin/cms/posts?search=...` endpoint can be reused for the admin related posts picker search.

---

## Frontend Changes

### 1. API Layer — `client/src/services/api.ts`

Add to the `blogApi` object:

```typescript
getRelatedPosts: (slug: string) =>
  api.get<{ posts: BlogPostSummary[] }>(`/blog/posts/${slug}/related`),
```

Add `related_post_ids` to the `BlogPostDetail` interface:

```typescript
related_post_ids: string[];
```

Add to `UpdateBlogPostInput`:

```typescript
related_post_ids?: string[];
```

### 2. Public Detail Page — `client/src/pages/blog/PostDetailPage.tsx`

Add a `RelatedPosts` section between the tags block and the CTA block. Fetched asynchronously after the main post loads (non-blocking for the main content render).

**State additions:**
```typescript
const [relatedPosts, setRelatedPosts] = useState<BlogPostSummary[]>([]);
```

**New effect (fires after main post loads):**
```typescript
useEffect(() => {
  if (slug) {
    blogApi.getRelatedPosts(slug)
      .then(({ data }) => setRelatedPosts(data.posts))
      .catch(() => {}); // silently fail — related posts are non-critical
  }
}, [slug]);
```

**JSX — between the tags `<div>` and the CTA `<div>`:**

```tsx
{/* Related Posts */}
{relatedPosts.length > 0 && (
  <div className="mt-16">
    <h3 className="font-display text-2xl text-slate-900 mb-6">
      Related Articles
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {relatedPosts.map(related => (
        <Link
          key={related.id}
          to={`/blog/${related.slug}`}
          className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-200 group"
        >
          {related.featured_image_url && (
            <div className="aspect-video bg-slate-100 overflow-hidden">
              <img
                src={related.featured_image_url}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="p-5">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
              {CATEGORY_LABELS[related.category] || related.category}
            </span>
            <h4 className="mt-2 text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
              {related.title}
            </h4>
            <p className="mt-1 text-sm text-slate-500 line-clamp-2">{related.excerpt}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {related.reading_time_minutes} min read
            </div>
          </div>
        </Link>
      ))}
    </div>
  </div>
)}
```

This card design mirrors the existing `PostListPage` cards but slightly smaller to fit 3-across. Uses the same `group-hover:scale-105` image effect, same category badge style, and same typography patterns from the brand guidelines.

### 3. Admin Editor — `client/src/pages/admin/cms/PostEditorPage.tsx`

Add a "Related Posts" section in the sidebar (after Tags section, before Featured Image). This allows the admin to:

1. **See currently selected related posts** — title + status badge + remove button
2. **Search for posts to add** — debounced search using existing admin list endpoint
3. **Remove selected posts** — click × to deselect
4. **Explanatory helper text** — "Leave empty for automatic selection based on tags and category"

**New state:**
```typescript
const [relatedPostIds, setRelatedPostIds] = useState<string[]>([]);
const [relatedPostDetails, setRelatedPostDetails] = useState<Array<{ id: string; title: string; status: string }>>([]);
const [relatedSearch, setRelatedSearch] = useState('');
const [relatedSearchResults, setRelatedSearchResults] = useState<Array<{ id: string; title: string; status: string }>>([]);
```

**Load when editing existing post (in `loadPost`):**
```typescript
setRelatedPostIds(post.related_post_ids || []);
```

**Include in `handleSave`:**
```typescript
const postData = {
  // ...existing fields
  related_post_ids: relatedPostIds,
};
```

**Sidebar JSX (consistent with existing sidebar sections):**
```tsx
<div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
  <label className="text-xs font-medium text-slate-400 mb-2 block">
    Related Posts
  </label>
  <p className="text-xs text-slate-500 mb-3">
    Override auto-matching. Leave empty for automatic selection.
  </p>

  {/* Selected posts list */}
  {relatedPostDetails.map(p => (
    <div key={p.id} className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2 mb-2">
      <span className="text-sm text-slate-300 truncate">{p.title}</span>
      <button onClick={() => removeRelated(p.id)} className="text-slate-500 hover:text-red-400 ml-2">
        <X className="w-4 h-4" />
      </button>
    </div>
  ))}

  {/* Search input (only show if <5 selected) */}
  {relatedPostIds.length < 5 && (
    <input
      type="text"
      placeholder="Search posts to add..."
      value={relatedSearch}
      onChange={(e) => setRelatedSearch(e.target.value)}
      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
    />
  )}

  {/* Search results dropdown */}
  {relatedSearchResults.map(result => (
    <button
      key={result.id}
      onClick={() => addRelated(result)}
      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded"
    >
      {result.title}
    </button>
  ))}
</div>
```

The search uses a debounced call (300ms) to `adminApi.listPosts({ search: relatedSearch, limit: 5 })` and displays results in a dropdown. The current post's own ID is excluded from search results.

---

## Edge Cases

| Edge Case | Behaviour |
|-----------|-----------|
| Post has 0 related posts (auto or manual) | Related section hidden entirely |
| Post has 1-2 related posts | Grid renders with 1-2 cards; responsive layout handles gracefully |
| Manually-selected post gets unpublished | Filtered out at query time; admin UI shows warning badge |
| Manually-selected post gets archived/deleted | Same as unpublished — filtered out at query time |
| Post has no tags and no matching category | Auto-match returns 0 results; section hidden |
| Admin selects more than 3 manual posts | Allowed up to 5 in DB; endpoint limits to 3 returned |
| Circular references (A links to B, B links to A) | Perfectly fine — no issue |
| New post (not yet saved) | Related posts section hidden in admin (only shows for existing posts) |

---

## Critical Files Summary

| File | Change |
|------|--------|
| `server/src/db/migrations/078_blog_related_posts.sql` | **New** — add `related_post_ids` column |
| `server/src/types/blog.types.ts` | Add `related_post_ids` to `BlogPost` and `UpdatePostInput` |
| `server/src/validators/blog.validators.ts` | Add `related_post_ids` to `UpdatePostSchema` |
| `server/src/services/blog.service.ts` | Add `getRelatedPosts()` function, update `updatePost()` |
| `server/src/routes/blog.ts` | Add `GET /api/blog/posts/:slug/related` endpoint |
| `client/src/services/api.ts` | Add `blogApi.getRelatedPosts()`, update types |
| `client/src/pages/blog/PostDetailPage.tsx` | Add related posts card grid UI |
| `client/src/pages/admin/cms/PostEditorPage.tsx` | Add related posts picker in sidebar |

---

## Testing Plan

1. **Auto-matching accuracy**: Create 5+ posts across different categories/tags; verify the scoring returns the most relevant posts
2. **Manual override**: Set `related_post_ids` on a post; verify those exact posts are returned in order
3. **Unpublished filtering**: Manually link to a post, unpublish it, verify it disappears from the related response
4. **Empty state**: Verify the section is hidden when no related posts exist
5. **Validation**: Verify non-UUID values in `related_post_ids` are rejected by the validator
6. **Performance**: Verify the auto-match query uses the GIN index (`EXPLAIN ANALYZE`)
7. **Responsive design**: Verify card grid renders correctly at 1, 2, and 3 cards across mobile/tablet/desktop

---

## Implementation Order

1. Database migration (`078_blog_related_posts.sql`)
2. Backend types (`blog.types.ts`)
3. Backend validator (`blog.validators.ts`)
4. Backend service (`blog.service.ts`)
5. Backend public route (`blog.ts`)
6. Frontend types and API (`api.ts`)
7. Frontend public page (`PostDetailPage.tsx`)
8. Frontend admin editor (`PostEditorPage.tsx`)
