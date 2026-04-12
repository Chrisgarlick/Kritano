/**
 * Schema Generator Service
 * Template-based JSON-LD generation using page data.
 * No AI API calls — uses detected page type and metadata to produce valid JSON-LD.
 *
 * Site-aware: sub-pages include isPartOf / publisher references back to the main site.
 */
interface PageData {
    url: string;
    title: string | null;
    metaDescription: string | null;
    detectedPageType: string | null;
}
interface SiteContext {
    siteUrl: string;
    siteName: string | null;
}
interface GeneratedSchema {
    jsonLd: string;
    pageType: string;
}
interface GeneratedSiteSchema {
    pages: Array<{
        pageId: string;
        url: string;
        title: string | null;
        pageType: string;
        jsonLd: string;
    }>;
    combined: string;
}
/**
 * Generate schema for a single page (with site context for cross-references)
 */
export declare function generateSchemaForPage(data: PageData, ctx?: SiteContext): GeneratedSchema;
/**
 * Generate schema for all pages in an audit at once.
 * Homepage gets Organization + WebSite; sub-pages get their type + isPartOf references.
 */
export declare function generateSchemaForSite(pages: Array<PageData & {
    id: string;
}>): GeneratedSiteSchema;
export {};
//# sourceMappingURL=schema-generator.service.d.ts.map