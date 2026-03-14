/**
 * Blog CMS type definitions
 */

export type PostCategory =
  | 'seo'
  | 'accessibility'
  | 'security'
  | 'performance'
  | 'content-quality'
  | 'structured-data'
  | 'eeat'
  | 'aeo'
  | 'guides'
  | 'case-studies'
  | 'product-updates';

export type PostStatus = 'draft' | 'published' | 'archived';

export type BlockType =
  | 'text'
  | 'heading'
  | 'image'
  | 'two_column'
  | 'callout'
  | 'code'
  | 'quote'
  | 'divider'
  | 'embed'
  | 'cta'
  | 'stat_highlight'
  | 'audit_link';

export interface ContentBlock {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  content: ContentBlock[];
  category: PostCategory;
  tags: string[];
  author_id: string;
  author_name: string;
  status: PostStatus;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  reading_time_minutes: number;
  view_count: number;
  related_post_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  featured_image_url: string | null;
  category: PostCategory;
  tags: string[];
  author_name: string;
  status: PostStatus;
  published_at: string | null;
  reading_time_minutes: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePostInput {
  title: string;
  subtitle?: string | null;
  excerpt: string;
  featured_image_url?: string | null;
  featured_image_alt?: string | null;
  content: ContentBlock[];
  category: PostCategory;
  tags?: string[];
  seo_title?: string | null;
  seo_description?: string | null;
}

export interface UpdatePostInput {
  title?: string;
  subtitle?: string | null;
  excerpt?: string;
  featured_image_url?: string | null;
  featured_image_alt?: string | null;
  content?: ContentBlock[];
  category?: PostCategory;
  tags?: string[];
  seo_title?: string | null;
  seo_description?: string | null;
  related_post_ids?: string[];
}

export interface PostFilters {
  status?: PostStatus;
  category?: PostCategory;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BlogMedia {
  id: string;
  filename: string;
  storage_key: string;
  mime_type: string;
  file_size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  thumbnail_key: string | null;
  webp_key: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface BlogPostRevision {
  id: string;
  post_id: string;
  content: ContentBlock[];
  title: string;
  revision_note: string | null;
  created_by: string;
  created_at: string;
}

export interface CmsStats {
  totalPosts: number;
  published: number;
  drafts: number;
  archived: number;
  totalViews: number;
  totalMedia: number;
  topPosts: Array<{
    id: string;
    title: string;
    slug: string;
    view_count: number;
    published_at: string;
  }>;
}

// ── CMS Extras (Phase 5) ──

export interface AuditAdviceTemplate {
  id: string;
  rule_id: string;
  rule_name: string;
  category: string;
  severity: string;
  description: string;
  recommendation: string;
  learn_more_url: string | null;
  is_custom: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface CreateAdviceInput {
  rule_id: string;
  rule_name: string;
  category: string;
  severity: string;
  description: string;
  recommendation: string;
  learn_more_url?: string | null;
}

export interface UpdateAdviceInput {
  rule_name?: string;
  category?: string;
  severity?: string;
  description?: string;
  recommendation?: string;
  learn_more_url?: string | null;
}

export type AnnouncementType = 'info' | 'success' | 'warning' | 'maintenance';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  target_tiers: string[] | null;
  cta_label: string | null;
  cta_url: string | null;
  starts_at: string;
  ends_at: string | null;
  is_dismissible: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  type?: AnnouncementType;
  target_tiers?: string[] | null;
  cta_label?: string | null;
  cta_url?: string | null;
  starts_at?: string;
  ends_at?: string | null;
  is_dismissible?: boolean;
}

export interface UpdateAnnouncementInput {
  title?: string;
  body?: string;
  type?: AnnouncementType;
  target_tiers?: string[] | null;
  cta_label?: string | null;
  cta_url?: string | null;
  starts_at?: string;
  ends_at?: string | null;
  is_dismissible?: boolean;
  is_active?: boolean;
}

export interface SuccessStory {
  id: string;
  site_id: string | null;
  domain: string;
  category: string;
  score_before: number;
  score_after: number;
  headline: string;
  is_published: boolean;
  display_order: number;
  published_at: string | null;
  created_by: string;
  created_at: string;
}

export interface CreateSuccessStoryInput {
  site_id?: string | null;
  domain: string;
  category: string;
  score_before: number;
  score_after: number;
  headline: string;
  is_published?: boolean;
  display_order?: number;
}

export interface UpdateSuccessStoryInput {
  domain?: string;
  category?: string;
  score_before?: number;
  score_after?: number;
  headline?: string;
  is_published?: boolean;
  display_order?: number;
}
