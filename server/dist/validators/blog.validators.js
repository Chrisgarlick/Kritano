"use strict";
/**
 * Blog CMS Zod validators
 *
 * Validates all block types and post metadata on save.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePostSchema = exports.CreatePostSchema = exports.ReviewRatingSchema = exports.SchemaTypeSchema = exports.PostCategorySchema = exports.ContentBlockSchema = void 0;
const zod_1 = require("zod");
// ── Block type schemas ──
const TextBlockSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.literal('text'),
    props: zod_1.z.object({
        content: zod_1.z.string().max(50000),
    }),
});
const HeadingBlockSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.literal('heading'),
    props: zod_1.z.object({
        text: zod_1.z.string().max(300),
        level: zod_1.z.union([zod_1.z.literal(2), zod_1.z.literal(3), zod_1.z.literal(4)]),
    }),
});
const ImageBlockSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.literal('image'),
    props: zod_1.z.object({
        src: zod_1.z.string().max(1000),
        alt: zod_1.z.string().max(300),
        caption: zod_1.z.string().max(200).optional(),
        width: zod_1.z.enum(['full', 'wide', 'content']).default('content'),
    }),
});
// Forward-declare for recursive two_column
const BaseBlockSchema = zod_1.z.lazy(() => zod_1.z.discriminatedUnion('type', [
    TextBlockSchema,
    HeadingBlockSchema,
    ImageBlockSchema,
    CalloutBlockSchema,
    CodeBlockSchema,
    QuoteBlockSchema,
    DividerBlockSchema,
    EmbedBlockSchema,
    CtaBlockSchema,
    StatHighlightBlockSchema,
    AuditLinkBlockSchema,
]));
const TwoColumnBlockSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.literal('two_column'),
    props: zod_1.z.object({
        left: zod_1.z.array(BaseBlockSchema).max(20),
        right: zod_1.z.array(BaseBlockSchema).max(20),
    }),
});
const CalloutBlockSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.literal('callout'),
    props: zod_1.z.object({
        type: zod_1.z.enum(['tip', 'warning', 'info', 'example']),
        title: zod_1.z.string().max(200).optional(),
        body: zod_1.z.string().max(10000),
    }),
});
const CodeBlockSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.literal('code'),
    props: zod_1.z.object({
        language: zod_1.z.string().max(30),
        code: zod_1.z.string().max(50000),
        filename: zod_1.z.string().max(200).optional(),
    }),
});
const QuoteBlockSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.literal('quote'),
    props: zod_1.z.object({
        text: zod_1.z.string().max(5000),
        attribution: zod_1.z.string().max(200).optional(),
    }),
});
const DividerBlockSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.literal('divider'),
    props: zod_1.z.object({}).passthrough(),
});
const EmbedBlockSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.literal('embed'),
    props: zod_1.z.object({
        url: zod_1.z.string().url().max(1000),
        caption: zod_1.z.string().max(200).optional(),
    }),
});
const CtaBlockSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.literal('cta'),
    props: zod_1.z.object({
        text: zod_1.z.string().max(100),
        url: zod_1.z.string().max(1000),
        variant: zod_1.z.enum(['primary', 'secondary']),
    }),
});
const StatHighlightBlockSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.literal('stat_highlight'),
    props: zod_1.z.object({
        stat: zod_1.z.string().max(100),
        description: zod_1.z.string().max(500),
        source: zod_1.z.string().max(200).optional(),
    }),
});
const AuditLinkBlockSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.literal('audit_link'),
    props: zod_1.z.object({
        ruleId: zod_1.z.string().max(100),
        customText: zod_1.z.string().max(200).optional(),
    }),
});
// ── Combined block schema ──
exports.ContentBlockSchema = zod_1.z.discriminatedUnion('type', [
    TextBlockSchema,
    HeadingBlockSchema,
    ImageBlockSchema,
    TwoColumnBlockSchema,
    CalloutBlockSchema,
    CodeBlockSchema,
    QuoteBlockSchema,
    DividerBlockSchema,
    EmbedBlockSchema,
    CtaBlockSchema,
    StatHighlightBlockSchema,
    AuditLinkBlockSchema,
]);
// ── Post category ──
exports.PostCategorySchema = zod_1.z.enum([
    'seo',
    'accessibility',
    'security',
    'performance',
    'content-quality',
    'structured-data',
    'eeat',
    'aeo',
    'guides',
    'case-studies',
    'product-updates',
]);
// ── Schema type ──
exports.SchemaTypeSchema = zod_1.z.enum(['article', 'howto', 'faq', 'claim_review']);
exports.ReviewRatingSchema = zod_1.z.enum(['True', 'MostlyTrue', 'Mixed', 'MostlyFalse', 'False']);
// ── Post schemas ──
exports.CreatePostSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(300),
    subtitle: zod_1.z.string().max(500).nullable().optional(),
    excerpt: zod_1.z.string().min(1).max(500),
    featured_image_url: zod_1.z.string().max(1000).nullable().optional(),
    featured_image_alt: zod_1.z.string().max(300).nullable().optional(),
    content: zod_1.z.array(exports.ContentBlockSchema).max(200),
    category: exports.PostCategorySchema,
    tags: zod_1.z.array(zod_1.z.string().max(30)).max(10).default([]),
    seo_title: zod_1.z.string().max(200).nullable().optional(),
    seo_description: zod_1.z.string().max(400).nullable().optional(),
    focus_keyword: zod_1.z.string().max(100).nullable().optional(),
    schema_type: exports.SchemaTypeSchema.default('article'),
    schema_claim_reviewed: zod_1.z.string().max(500).nullable().optional(),
    schema_review_rating: exports.ReviewRatingSchema.nullable().optional(),
});
exports.UpdatePostSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(300).optional(),
    subtitle: zod_1.z.string().max(500).nullable().optional(),
    excerpt: zod_1.z.string().min(1).max(500).optional(),
    featured_image_url: zod_1.z.string().max(1000).nullable().optional(),
    featured_image_alt: zod_1.z.string().max(300).nullable().optional(),
    content: zod_1.z.array(exports.ContentBlockSchema).max(200).optional(),
    category: exports.PostCategorySchema.optional(),
    tags: zod_1.z.array(zod_1.z.string().max(30)).max(10).optional(),
    seo_title: zod_1.z.string().max(200).nullable().optional(),
    seo_description: zod_1.z.string().max(400).nullable().optional(),
    focus_keyword: zod_1.z.string().max(100).nullable().optional(),
    related_post_ids: zod_1.z.array(zod_1.z.string().uuid()).max(5).optional(),
    schema_type: exports.SchemaTypeSchema.optional(),
    schema_claim_reviewed: zod_1.z.string().max(500).nullable().optional(),
    schema_review_rating: exports.ReviewRatingSchema.nullable().optional(),
});
//# sourceMappingURL=blog.validators.js.map