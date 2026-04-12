/**
 * Structured Data Types
 *
 * Types for Schema.org/JSON-LD/Microdata/Open Graph analysis
 */
export type SchemaType = 'Organization' | 'WebSite' | 'WebPage' | 'Article' | 'NewsArticle' | 'BlogPosting' | 'Product' | 'Offer' | 'AggregateRating' | 'Review' | 'LocalBusiness' | 'BreadcrumbList' | 'FAQPage' | 'HowTo' | 'Event' | 'Person' | 'VideoObject' | 'ImageObject' | 'SearchAction' | 'ContactPoint' | 'PostalAddress' | 'OpeningHoursSpecification';
export interface SchemaRequirements {
    required: string[];
    recommended: string[];
}
export declare const SCHEMA_REQUIREMENTS: Record<string, SchemaRequirements>;
export interface PageTypeExpectation {
    pageType: string;
    expectedSchemas: string[];
    indicators: string[];
}
export declare const PAGE_TYPE_EXPECTATIONS: PageTypeExpectation[];
export interface ParsedJsonLd {
    raw: string;
    parsed: any;
    isValid: boolean;
    parseError?: string;
    types: string[];
}
export interface OpenGraphData {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    siteName?: string;
    locale?: string;
}
export interface TwitterCardData {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
    site?: string;
    creator?: string;
}
export interface MicrodataItem {
    type: string;
    properties: Record<string, any>;
}
export interface StructuredDataAnalysis {
    score: number;
    jsonLd: {
        found: boolean;
        count: number;
        items: ParsedJsonLd[];
        validCount: number;
        invalidCount: number;
    };
    microdata: {
        found: boolean;
        count: number;
        items: MicrodataItem[];
    };
    openGraph: {
        found: boolean;
        data: OpenGraphData;
        completeness: number;
    };
    twitterCard: {
        found: boolean;
        data: TwitterCardData;
        completeness: number;
    };
    detectedTypes: string[];
    missingExpectedTypes: string[];
    detectedPageType: string | null;
    validationErrors: StructuredDataValidationError[];
}
export interface StructuredDataValidationError {
    type: 'missing_required' | 'missing_recommended' | 'invalid_value' | 'syntax_error' | 'type_mismatch';
    schemaType?: string;
    field?: string;
    message: string;
    severity: 'critical' | 'warning' | 'info';
}
export interface StructuredDataContext {
    url: string;
    html: string;
    $: any;
    analysis: StructuredDataAnalysis;
    isHomepage: boolean;
}
//# sourceMappingURL=structured-data.types.d.ts.map