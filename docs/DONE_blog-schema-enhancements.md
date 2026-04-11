# Blog Post Schema Enhancements

## Overview

Add per-post structured data schema selection to the blog admin panel. Different blog post types benefit from different Schema.org markup beyond the default `Article` schema. A post editor dropdown lets the author select the appropriate schema type, and the frontend automatically generates the correct JSON-LD based on the post's content blocks and the selected type.

## Key Decisions

1. **Schema type is stored on the post, not derived** -- The author explicitly selects the schema type in the admin panel. Auto-detection is unreliable (a post with numbered headings isn't necessarily a HowTo). The dropdown acts as a signal of editorial intent.

2. **Article schema is always emitted** -- The selected schema type is *additional* structured data layered on top of Article. Google allows multiple schema types on a single page. A HowTo post still benefits from Article markup.

3. **Content blocks are parsed into schema steps/questions automatically** -- When `HowTo` is selected, heading + text block pairs are converted to `HowToStep` objects. When `FAQPage` is selected, heading + text pairs become `Question`/`Answer` objects. No extra manual entry is required.

4. **VideoObject is auto-detected from embed blocks** -- If any `embed` block contains a YouTube/Vimeo URL, `VideoObject` schema is emitted automatically regardless of the dropdown selection. No manual toggle needed.

5. **New column, no migration risk** -- A single nullable `schema_type` VARCHAR column with a default of `'article'`. Existing posts continue working unchanged.

## Schema Types

| Type | Schema.org | When to Use | How Steps/Items Are Derived |
|------|-----------|-------------|---------------------------|
| Article (default) | `Article` | Standard blog posts, opinion pieces, news | N/A -- already implemented |
| HowTo | `Article` + `HowTo` | Tutorial/guide posts with step-by-step instructions | Each `heading` block (h2/h3) becomes a step name; subsequent `text`/`image`/`code` blocks until the next heading become the step's `itemListElement` |
| FAQ | `Article` + `FAQPage` | Posts structured as question/answer pairs | Each `heading` block ending in `?` becomes a `Question`; subsequent `text` blocks become the `acceptedAnswer` |
| ClaimReview | `Article` + `ClaimReview` | Fact-check or myth-busting posts | Requires 2 extra fields in sidebar: `claimReviewed` (text) and `reviewRating` (dropdown: True/Mostly True/Mixed/Mostly False/False) |

## Database Changes

### Migration: `1XX_blog_schema_type.sql`

```sql
ALTER TABLE blog_posts
  ADD COLUMN schema_type VARCHAR(20) NOT NULL DEFAULT 'article';

-- For ClaimReview posts, store the claim and rating
ALTER TABLE blog_posts
  ADD COLUMN schema_claim_reviewed VARCHAR(500),
  ADD COLUMN schema_review_rating VARCHAR(20);

-- Constrain allowed values
ALTER TABLE blog_posts
  ADD CONSTRAINT chk_blog_schema_type
  CHECK (schema_type IN ('article', 'howto', 'faq', 'claim_review'));

ALTER TABLE blog_posts
  ADD CONSTRAINT chk_blog_review_rating
  CHECK (schema_review_rating IS NULL OR schema_review_rating IN ('True', 'MostlyTrue', 'Mixed', 'MostlyFalse', 'False'));
```

## Backend Changes

### API Types (`client/src/services/api.ts`)

Add to `BlogPostSummary`:
```typescript
schema_type: 'article' | 'howto' | 'faq' | 'claim_review';
```

Add to `BlogPostDetail`:
```typescript
schema_claim_reviewed: string | null;
schema_review_rating: string | null;
```

Add to `CreateBlogPostInput` / `UpdateBlogPostInput`:
```typescript
schema_type?: 'article' | 'howto' | 'faq' | 'claim_review';
schema_claim_reviewed?: string | null;
schema_review_rating?: string | null;
```

### Server Validation (`server/src/routes/admin/cms.ts`)

Add `schema_type`, `schema_claim_reviewed`, `schema_review_rating` to the Zod schemas for create/update. Validate that `schema_claim_reviewed` and `schema_review_rating` are only present when `schema_type === 'claim_review'`.

### Server Queries

Update the INSERT/UPDATE queries for blog_posts to include the three new columns. No changes to SELECT queries needed since they already use `SELECT *` or can be extended.

## Frontend Changes

### 1. Post Editor Sidebar (`PostEditorPage.tsx`)

Add a new "Schema Type" section in the sidebar, between "Category" and "Tags":

```
Schema Type
[Article          v]  <-- dropdown

(When HowTo selected):
Info: Steps will be auto-generated from your heading + content block pairs.

(When FAQ selected):
Info: Q&A pairs will be extracted from headings ending in "?" and their following text.

(When ClaimReview selected):
Claim Reviewed: [________________________]
Rating:         [True                   v]
```

The dropdown options:
- Article (default)
- How-To Guide
- FAQ
- Claim Review

### 2. Schema Builder Utility (`client/src/utils/blogSchemaBuilder.ts`)

New utility file that takes a `BlogPostDetail` and returns an array of structured data objects:

```typescript
export function buildBlogStructuredData(post: BlogPostDetail): Record<string, unknown>[] {
  const schemas: Record<string, unknown>[] = [];

  // 1. Always emit Article (existing logic, moved here)
  schemas.push(buildArticleSchema(post));

  // 2. Emit additional schema based on type
  switch (post.schema_type) {
    case 'howto':
      schemas.push(buildHowToSchema(post));
      break;
    case 'faq':
      schemas.push(buildFAQSchema(post));
      break;
    case 'claim_review':
      schemas.push(buildClaimReviewSchema(post));
      break;
  }

  // 3. Auto-detect VideoObject from embed blocks
  const videoSchemas = buildVideoSchemas(post);
  schemas.push(...videoSchemas);

  // 4. Always emit BreadcrumbList (existing logic, moved here)
  schemas.push(buildBreadcrumbSchema(post));

  return schemas;
}
```

#### HowTo Schema Builder

Parses content blocks into steps:

```typescript
function buildHowToSchema(post: BlogPostDetail): Record<string, unknown> {
  const steps: { name: string; text: string; image?: string }[] = [];
  let currentStep: { name: string; textParts: string[]; image?: string } | null = null;

  for (const block of post.content) {
    if (block.type === 'heading') {
      // Flush previous step
      if (currentStep) {
        steps.push({
          name: currentStep.name,
          text: currentStep.textParts.join('\n'),
          image: currentStep.image,
        });
      }
      currentStep = { name: block.props.text as string, textParts: [] };
    } else if (currentStep) {
      if (block.type === 'text') {
        currentStep.textParts.push(block.props.content as string);
      } else if (block.type === 'image' && !currentStep.image) {
        currentStep.image = block.props.src as string;
      }
    }
  }
  // Flush last step
  if (currentStep) {
    steps.push({ name: currentStep.name, text: currentStep.textParts.join('\n'), image: currentStep.image });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: post.title,
    description: post.seo_description || post.excerpt,
    image: post.featured_image_url || undefined,
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.image ? { image: s.image } : {}),
    })),
  };
}
```

#### FAQ Schema Builder

Extracts Q&A pairs from headings ending in `?`:

```typescript
function buildFAQSchema(post: BlogPostDetail): Record<string, unknown> {
  const pairs: { question: string; answer: string }[] = [];
  let currentQuestion: string | null = null;
  let answerParts: string[] = [];

  for (const block of post.content) {
    if (block.type === 'heading' && (block.props.text as string).trim().endsWith('?')) {
      if (currentQuestion && answerParts.length > 0) {
        pairs.push({ question: currentQuestion, answer: answerParts.join('\n') });
      }
      currentQuestion = block.props.text as string;
      answerParts = [];
    } else if (currentQuestion && block.type === 'text') {
      answerParts.push(block.props.content as string);
    }
  }
  if (currentQuestion && answerParts.length > 0) {
    pairs.push({ question: currentQuestion, answer: answerParts.join('\n') });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs.map(p => ({
      '@type': 'Question',
      name: p.question,
      acceptedAnswer: { '@type': 'Answer', text: p.answer },
    })),
  };
}
```

#### ClaimReview Schema Builder

Uses the explicit fields from the sidebar:

```typescript
function buildClaimReviewSchema(post: BlogPostDetail): Record<string, unknown> {
  const ratingMap: Record<string, { value: number; bestRating: number; alternateName: string }> = {
    'True': { value: 5, bestRating: 5, alternateName: 'True' },
    'MostlyTrue': { value: 4, bestRating: 5, alternateName: 'Mostly True' },
    'Mixed': { value: 3, bestRating: 5, alternateName: 'Mixed' },
    'MostlyFalse': { value: 2, bestRating: 5, alternateName: 'Mostly False' },
    'False': { value: 1, bestRating: 5, alternateName: 'False' },
  };

  const rating = ratingMap[post.schema_review_rating || 'Mixed'];

  return {
    '@context': 'https://schema.org',
    '@type': 'ClaimReview',
    url: `https://kritano.com/blog/${post.slug}`,
    claimReviewed: post.schema_claim_reviewed,
    author: { '@type': 'Organization', name: 'Kritano', url: 'https://kritano.com' },
    datePublished: post.published_at,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: rating.value,
      bestRating: rating.bestRating,
      worstRating: 1,
      alternateName: rating.alternateName,
    },
  };
}
```

#### VideoObject Schema (auto-detected)

```typescript
function buildVideoSchemas(post: BlogPostDetail): Record<string, unknown>[] {
  return post.content
    .filter(b => b.type === 'embed' && b.props.url)
    .map(b => {
      const url = b.props.url as string;
      return {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: post.title,
        description: post.seo_description || post.excerpt,
        embedUrl: url,
        uploadDate: post.published_at,
      };
    });
}
```

### 3. PostDetailPage.tsx

Replace the inline structured data construction with a call to `buildBlogStructuredData(post)`. The existing Article + Breadcrumb logic moves into the utility, keeping the page component clean.

```diff
- const structuredData = [
-   { '@context': 'https://schema.org', '@type': 'Article', ... },
-   { '@context': 'https://schema.org', '@type': 'BreadcrumbList', ... },
- ];
+ const structuredData = buildBlogStructuredData(post);
```

## Critical Files Summary

| File | Change |
|------|--------|
| `server/src/db/migrations/1XX_blog_schema_type.sql` | New: migration adding 3 columns |
| `server/src/routes/admin/cms.ts` | Update: Zod schemas + queries for new columns |
| `client/src/services/api.ts` | Update: add fields to blog types |
| `client/src/pages/admin/cms/PostEditorPage.tsx` | Update: add Schema Type dropdown + conditional fields |
| `client/src/utils/blogSchemaBuilder.ts` | New: schema builder utility |
| `client/src/pages/blog/PostDetailPage.tsx` | Update: use schema builder instead of inline construction |

## Testing Plan

1. **Default behaviour unchanged** -- Existing posts with `schema_type = 'article'` produce identical Article + Breadcrumb JSON-LD as before
2. **HowTo parsing** -- Create a post with h2 headings and text blocks, select HowTo, verify the JSON-LD output contains correct `HowToStep` objects with position, name, and text
3. **FAQ parsing** -- Create a post with question headings (ending in ?) and answer text, select FAQ, verify `FAQPage` schema with `Question`/`AcceptedAnswer` pairs
4. **ClaimReview** -- Select ClaimReview, fill in claim + rating, verify the `ClaimReview` schema includes correct `ratingValue` mapping
5. **VideoObject auto-detection** -- Add an embed block with a YouTube URL, verify `VideoObject` appears in the JSON-LD regardless of schema type selection
6. **Google Rich Results Test** -- Paste rendered page HTML into https://search.google.com/test/rich-results and confirm each schema type is detected and valid
7. **Admin panel UX** -- Verify dropdown appears, conditional fields show/hide correctly, ClaimReview fields are required when that type is selected

## Implementation Order

1. Database migration (new columns)
2. Server-side: update Zod schemas + queries in `cms.ts`
3. Client API types (`api.ts`)
4. Schema builder utility (`blogSchemaBuilder.ts`)
5. Update `PostDetailPage.tsx` to use schema builder
6. Update `PostEditorPage.tsx` with dropdown + conditional fields
7. Test with Google Rich Results validator
