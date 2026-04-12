"use strict";
/**
 * Structured Data Types
 *
 * Types for Schema.org/JSON-LD/Microdata/Open Graph analysis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGE_TYPE_EXPECTATIONS = exports.SCHEMA_REQUIREMENTS = void 0;
// Schema requirements dictionary
exports.SCHEMA_REQUIREMENTS = {
    Organization: {
        required: ['@type', 'name'],
        recommended: ['url', 'logo', 'contactPoint', 'sameAs', 'description'],
    },
    WebSite: {
        required: ['@type', 'name', 'url'],
        recommended: ['potentialAction', 'description'],
    },
    Article: {
        required: ['@type', 'headline', 'author', 'datePublished'],
        recommended: ['image', 'dateModified', 'publisher', 'description', 'mainEntityOfPage'],
    },
    NewsArticle: {
        required: ['@type', 'headline', 'author', 'datePublished'],
        recommended: ['image', 'dateModified', 'publisher', 'description', 'mainEntityOfPage'],
    },
    BlogPosting: {
        required: ['@type', 'headline', 'author', 'datePublished'],
        recommended: ['image', 'dateModified', 'publisher', 'description', 'mainEntityOfPage'],
    },
    Product: {
        required: ['@type', 'name'],
        recommended: ['image', 'description', 'sku', 'brand', 'offers', 'aggregateRating', 'review'],
    },
    Offer: {
        required: ['@type', 'price', 'priceCurrency'],
        recommended: ['availability', 'priceValidUntil', 'url', 'seller'],
    },
    LocalBusiness: {
        required: ['@type', 'name', 'address'],
        recommended: ['telephone', 'openingHoursSpecification', 'geo', 'url', 'image', 'priceRange'],
    },
    BreadcrumbList: {
        required: ['@type', 'itemListElement'],
        recommended: [],
    },
    FAQPage: {
        required: ['@type', 'mainEntity'],
        recommended: [],
    },
    Person: {
        required: ['@type', 'name'],
        recommended: ['image', 'jobTitle', 'url', 'sameAs'],
    },
    Event: {
        required: ['@type', 'name', 'startDate', 'location'],
        recommended: ['description', 'endDate', 'image', 'performer', 'offers'],
    },
    VideoObject: {
        required: ['@type', 'name', 'description', 'thumbnailUrl', 'uploadDate'],
        recommended: ['duration', 'contentUrl', 'embedUrl', 'interactionCount'],
    },
    Review: {
        required: ['@type', 'reviewRating', 'author'],
        recommended: ['itemReviewed', 'datePublished', 'reviewBody'],
    },
    AggregateRating: {
        required: ['@type', 'ratingValue'],
        recommended: ['reviewCount', 'ratingCount', 'bestRating', 'worstRating'],
    },
};
exports.PAGE_TYPE_EXPECTATIONS = [
    {
        pageType: 'homepage',
        expectedSchemas: ['Organization', 'WebSite'],
        indicators: ['is-homepage', 'path-is-root'],
    },
    {
        pageType: 'article',
        expectedSchemas: ['Article', 'BreadcrumbList'],
        indicators: ['article-tag', 'blog-content', 'news-content', 'date-published'],
    },
    {
        pageType: 'product',
        expectedSchemas: ['Product', 'Offer', 'BreadcrumbList'],
        indicators: ['add-to-cart', 'price-element', 'product-details', 'buy-button'],
    },
    {
        pageType: 'local-business',
        expectedSchemas: ['LocalBusiness', 'PostalAddress'],
        indicators: ['address-block', 'phone-number', 'opening-hours', 'map-embed'],
    },
    {
        pageType: 'faq',
        expectedSchemas: ['FAQPage'],
        indicators: ['faq-section', 'question-answer-pairs', 'accordion-qa'],
    },
    {
        pageType: 'event',
        expectedSchemas: ['Event'],
        indicators: ['event-date', 'event-location', 'event-registration'],
    },
];
//# sourceMappingURL=structured-data.types.js.map