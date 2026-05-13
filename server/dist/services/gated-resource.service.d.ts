/**
 * Gated Resource Service
 *
 * Lifecycle for the gated resource library:
 *   - list / get catalogue entries
 *   - capture an email lead and issue a download token
 *   - issue a download token for a logged-in user (no email gate)
 *   - validate a token against a resource slug
 *   - record each download for analytics, lead scoring, and abuse tracking
 *
 * Downstream side effects (CRM trigger event, lead scoring points, email send)
 * are wired in milestones 6-8 and intentionally live outside this module so
 * the persistence layer stays a single-responsibility primitive.
 *
 * See /docs/gated-resources.md for the full feature plan.
 */
import { Pool } from 'pg';
import type { GatedResource, GatedResourceLead, GatedResourceToken, ResourceFormat, ResourceSummary } from '../types/gated-resource.types.js';
export declare function setPool(dbPool: Pool): void;
/**
 * The subset of an HTTP request the service needs to record a lead or a
 * download. Routes extract this from Express's Request and pass a plain
 * object so the service stays framework-agnostic and trivially testable.
 */
export interface RequestContext {
    ip?: string | null;
    userAgent?: string | null;
    referer?: string | null;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
}
declare function hashIp(ip: string | null | undefined): string | null;
declare function normaliseEmail(email: string): string;
export declare function listPublishedResources(filters?: {
    category?: string;
}): Promise<ResourceSummary[]>;
export declare function getResourceBySlug(slug: string): Promise<GatedResource | null>;
export interface CaptureEmailInput {
    resource: GatedResource;
    email: string;
    consentNewsletter: boolean;
    request: RequestContext;
}
export interface CaptureEmailResult {
    token: string;
    lead: GatedResourceLead;
    /** True if a brand-new lead row was inserted (vs a returning email). */
    isNewLead: boolean;
}
export declare function captureEmailAndIssueToken(input: CaptureEmailInput): Promise<CaptureEmailResult>;
export declare function issueTokenForUser(resourceId: string, userId: string): Promise<string>;
export interface ValidatedToken {
    token: GatedResourceToken;
    resource: GatedResource;
}
/**
 * Returns the token + resource pair if the token is unexpired AND its
 * resource_id matches the supplied slug. Returns null for invalid, expired,
 * or wrong-resource tokens. The route handler maps null → 401/403 without
 * disclosing which check failed.
 */
export declare function validateToken(token: string, resourceSlug: string): Promise<ValidatedToken | null>;
export interface RecordDownloadInput {
    resourceId: string;
    format: ResourceFormat;
    userId?: string | null;
    leadId?: string | null;
    token?: string | null;
    request: RequestContext;
}
/**
 * Persist a download row, bump the resource counter, and (if applicable)
 * tick the token's use counter. Wrapped in a single transaction so the
 * counters stay consistent with the audit-log table.
 */
export declare function recordDownload(input: RecordDownloadInput): Promise<void>;
/**
 * Link any prior anonymous lead rows for this email to the new user_id.
 * Idempotent: only updates rows where user_id is currently NULL.
 * Returns the number of rows linked.
 */
export declare function linkLeadsToUser(email: string, userId: string): Promise<number>;
export interface AdminResourceSummary {
    id: string;
    slug: string;
    title: string;
    category: string;
    formats: ResourceFormat[];
    published: boolean;
    page_count: number | null;
    download_count: number;
    lead_count: number;
    downloads_30d: number;
    updated_at: string;
    created_at: string;
}
export declare function adminListResources(): Promise<AdminResourceSummary[]>;
export interface AdminUpdateInput {
    title?: string;
    subtitle?: string | null;
    hook?: string;
    category?: string;
    audience?: string | null;
    description?: string;
    preview_md?: string;
    source_md_path?: string;
    formats?: ResourceFormat[];
    page_count?: number | null;
    published?: boolean;
    focus_keyword?: string | null;
    secondary_keywords?: string[];
    seo_title?: string | null;
    seo_description?: string | null;
    tags?: string[];
}
export declare function adminUpdateResource(id: string, patch: AdminUpdateInput): Promise<GatedResource | null>;
export interface AdminCreateInput {
    slug: string;
    title: string;
    subtitle?: string | null;
    hook: string;
    category: string;
    audience?: string | null;
    description: string;
    preview_md: string;
    source_md_path: string;
    formats?: ResourceFormat[];
    page_count?: number | null;
    focus_keyword?: string | null;
    secondary_keywords?: string[];
    seo_title?: string | null;
    seo_description?: string | null;
    tags?: string[];
}
export declare function adminCreateResource(input: AdminCreateInput): Promise<GatedResource>;
export declare function getResourceById(id: string): Promise<GatedResource | null>;
/**
 * Recompute the sha256 of a resource's source MD on disk and update the
 * row. Use this after editing the source file outside the admin UI.
 */
export declare function adminRegenerateContentHash(id: string): Promise<{
    content_hash: string;
} | null>;
export interface AdminLeadRow {
    id: string;
    email: string;
    consent_newsletter: boolean;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    referer: string | null;
    user_id: string | null;
    created_at: string;
}
export declare function adminListLeads(resourceId: string, filters?: {
    page?: number;
    limit?: number;
}): Promise<{
    leads: AdminLeadRow[];
    total: number;
}>;
/**
 * Returns every lead row for a resource, suitable for CSV export.
 * No pagination; used only by the admin export endpoint.
 */
export declare function adminExportLeads(resourceId: string): Promise<AdminLeadRow[]>;
export declare const __internal: {
    hashIp: typeof hashIp;
    normaliseEmail: typeof normaliseEmail;
};
/**
 * Pull the request fields the service needs out of an Express Request.
 * Lives here so callers do not couple to header names; tests use plain
 * RequestContext objects.
 */
export declare function extractRequestContext(req: import('express').Request): RequestContext;
export {};
//# sourceMappingURL=gated-resource.service.d.ts.map