/**
 * SEO Service — Manages page SEO metadata overrides
 */
import { Pool } from 'pg';
export declare function setPool(dbPool: Pool): void;
export interface SeoEntry {
    id: string;
    route_path: string;
    title: string | null;
    description: string | null;
    keywords: string | null;
    og_title: string | null;
    og_description: string | null;
    og_image: string | null;
    og_type: string;
    twitter_card: string;
    canonical_url: string | null;
    featured_image: string | null;
    structured_data: Record<string, unknown> | null;
    noindex: boolean;
    updated_at: string;
    updated_by: string | null;
}
export declare function getAllSeoEntries(): Promise<SeoEntry[]>;
export declare function getSeoByPath(routePath: string): Promise<SeoEntry | null>;
export declare function upsertSeo(routePath: string, data: {
    title?: string | null;
    description?: string | null;
    keywords?: string | null;
    og_title?: string | null;
    og_description?: string | null;
    og_image?: string | null;
    og_type?: string | null;
    twitter_card?: string | null;
    canonical_url?: string | null;
    featured_image?: string | null;
    structured_data?: Record<string, unknown> | null;
    noindex?: boolean;
}, adminId: string): Promise<SeoEntry>;
export declare function deleteSeo(routePath: string): Promise<void>;
//# sourceMappingURL=seo.service.d.ts.map