/**
 * Blog CMS Zod validators
 *
 * Validates all block types and post metadata on save.
 */

import { z } from 'zod';

// ── Block type schemas ──

const TextBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('text'),
  props: z.object({
    content: z.string().max(50000),
  }),
});

const HeadingBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('heading'),
  props: z.object({
    text: z.string().max(300),
    level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  }),
});

const ImageBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('image'),
  props: z.object({
    src: z.string().max(1000),
    alt: z.string().max(300),
    caption: z.string().max(200).optional(),
    width: z.enum(['full', 'wide', 'content']).default('content'),
  }),
});

// Forward-declare for recursive two_column
const BaseBlockSchema: z.ZodType<unknown> = z.lazy(() =>
  z.discriminatedUnion('type', [
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
  ])
);

const TwoColumnBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('two_column'),
  props: z.object({
    left: z.array(BaseBlockSchema).max(20),
    right: z.array(BaseBlockSchema).max(20),
  }),
});

const CalloutBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('callout'),
  props: z.object({
    type: z.enum(['tip', 'warning', 'info', 'example']),
    title: z.string().max(200).optional(),
    body: z.string().max(10000),
  }),
});

const CodeBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('code'),
  props: z.object({
    language: z.string().max(30),
    code: z.string().max(50000),
    filename: z.string().max(200).optional(),
  }),
});

const QuoteBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('quote'),
  props: z.object({
    text: z.string().max(5000),
    attribution: z.string().max(200).optional(),
  }),
});

const DividerBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('divider'),
  props: z.object({}).passthrough(),
});

const EmbedBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('embed'),
  props: z.object({
    url: z.string().url().max(1000),
    caption: z.string().max(200).optional(),
  }),
});

const CtaBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('cta'),
  props: z.object({
    text: z.string().max(100),
    url: z.string().max(1000),
    variant: z.enum(['primary', 'secondary']),
  }),
});

const StatHighlightBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('stat_highlight'),
  props: z.object({
    stat: z.string().max(100),
    description: z.string().max(500),
    source: z.string().max(200).optional(),
  }),
});

const AuditLinkBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('audit_link'),
  props: z.object({
    ruleId: z.string().max(100),
    customText: z.string().max(200).optional(),
  }),
});

// ── Combined block schema ──

export const ContentBlockSchema = z.discriminatedUnion('type', [
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

export const PostCategorySchema = z.enum([
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

// ── Post schemas ──

export const CreatePostSchema = z.object({
  title: z.string().min(1).max(300),
  subtitle: z.string().max(500).nullable().optional(),
  excerpt: z.string().min(1).max(500),
  featured_image_url: z.string().max(1000).nullable().optional(),
  featured_image_alt: z.string().max(300).nullable().optional(),
  content: z.array(ContentBlockSchema).max(200),
  category: PostCategorySchema,
  tags: z.array(z.string().max(30)).max(10).default([]),
  seo_title: z.string().max(200).nullable().optional(),
  seo_description: z.string().max(400).nullable().optional(),
});

export const UpdatePostSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  subtitle: z.string().max(500).nullable().optional(),
  excerpt: z.string().min(1).max(500).optional(),
  featured_image_url: z.string().max(1000).nullable().optional(),
  featured_image_alt: z.string().max(300).nullable().optional(),
  content: z.array(ContentBlockSchema).max(200).optional(),
  category: PostCategorySchema.optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  seo_title: z.string().max(200).nullable().optional(),
  seo_description: z.string().max(400).nullable().optional(),
  related_post_ids: z.array(z.string().uuid()).max(5).optional(),
});
