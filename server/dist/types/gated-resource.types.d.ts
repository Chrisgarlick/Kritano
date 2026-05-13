/**
 * Gated Resource type definitions.
 *
 * See /docs/gated-resources.md for the feature plan and
 * /docs/gated_resources.md for the resource catalogue and ranking.
 */
import type { PostCategory } from './blog.types.js';
export type ResourceFormat = 'md' | 'pdf' | 'html' | 'docx';
export declare const ALL_FORMATS: readonly ResourceFormat[];
export interface GatedResource {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    hook: string;
    category: PostCategory;
    audience: string | null;
    description: string;
    preview_md: string;
    source_md_path: string;
    formats: ResourceFormat[];
    content_hash: string;
    page_count: number | null;
    published: boolean;
    download_count: number;
    /** SEO scaffolding — mirrors blog_posts. All nullable; SSR falls back gracefully. */
    focus_keyword: string | null;
    secondary_keywords: string[];
    seo_title: string | null;
    seo_description: string | null;
    tags: string[];
    created_at: string;
    updated_at: string;
}
export interface ResourceSummary {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    hook: string;
    category: PostCategory;
    audience: string | null;
    formats: ResourceFormat[];
    page_count: number | null;
    download_count: number;
    updated_at: string;
}
export interface GatedResourceLead {
    id: string;
    resource_id: string;
    email: string;
    email_normalised: string;
    consent_newsletter: boolean;
    referer: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    ip_hash: string | null;
    user_agent: string | null;
    user_id: string | null;
    created_at: string;
}
export interface GatedResourceToken {
    token: string;
    resource_id: string;
    lead_id: string | null;
    user_id: string | null;
    expires_at: string;
    uses_count: number;
    last_used_at: string | null;
    created_at: string;
}
export interface GatedResourceDownload {
    id: string;
    resource_id: string;
    format: ResourceFormat;
    lead_id: string | null;
    user_id: string | null;
    token_id: string | null;
    ip_hash: string | null;
    referer: string | null;
    downloaded_at: string;
}
/**
 * Resolved download context: identifies who is downloading and via what mechanism.
 * Produced by token or session validation and consumed by the download endpoint
 * and the audit-log writer.
 */
export interface DownloadContext {
    resource: GatedResource;
    format: ResourceFormat;
    user_id: string | null;
    lead_id: string | null;
    token: string | null;
}
/**
 * MIME type and downloadable filename for a given resource + format.
 * Returned by the delivery service for the HTTP layer to set response headers.
 */
export interface DeliveredFormat {
    /** Absolute filesystem path to the file to stream. */
    path: string;
    mimeType: string;
    filename: string;
}
export declare const FORMAT_MIME: Record<ResourceFormat, string>;
export declare const FORMAT_EXTENSION: Record<ResourceFormat, string>;
export declare class UnsupportedFormatError extends Error {
    constructor(format: string);
}
export declare class TypesetNotConfiguredError extends Error {
    constructor();
}
export declare class TypesetRenderError extends Error {
    readonly statusCode?: number | undefined;
    constructor(message: string, statusCode?: number | undefined);
}
//# sourceMappingURL=gated-resource.types.d.ts.map